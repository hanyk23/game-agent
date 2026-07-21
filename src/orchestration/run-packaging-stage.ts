import { randomUUID } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import {
  parseAssetSelectionPlan,
  type AssetSelectionPlan,
} from "../assets/asset-selection-plan.js";
import { digestDirectory, sha256File } from "../runs/artifact-hash.js";
import {
  RunManifestSchema,
  transitionRunManifest,
  type RunManifest,
} from "../runs/run-manifest.js";
import { verifySpecEvidenceChain } from "../runs/spec-evidence-chain.js";
import {
  BrowserAssertionProfileSchema,
  CaseAwareBrowserAssertionsSchema,
} from "../verification/browser-assertion-profile.js";

const MANIFEST_PATH = "manifest.json";
const DELIVERY_PATH = "delivery";
const DELIVERY_MANIFEST_PATH = "delivery/PACKAGE_MANIFEST.json";
const THIRD_PARTY_NOTICES_SOURCE = "docs/THIRD_PARTY_NOTICES.md";

const BrowserDeliveryEvidenceSchema = z.strictObject({
  verificationVersion: z.string().min(1),
  status: z.literal("passed"),
  browser: z.strictObject({
    engine: z.literal("chromium"),
    channel: z.string().min(1),
  }),
  assertionProfile: BrowserAssertionProfileSchema.optional(),
  caseAssertions: CaseAwareBrowserAssertionsSchema.nullable().optional(),
  cases: z
    .array(
      z
        .object({
          name: z.enum(["desktop", "mobile"]),
          consoleErrorCount: z.literal(0),
          pageErrorCount: z.literal(0),
          failedRequestCount: z.literal(0),
        })
        .passthrough(),
    )
    .length(2),
  findings: z.array(z.unknown()).length(0),
});

export type RunPackagingStageOptions = Readonly<{
  projectDirectory: string;
  runId: string;
  now?: () => Date;
}>;

export type RunPackagingStageResult = Readonly<{
  runDirectory: string;
  deliveryDirectory: string;
  manifest: RunManifest;
}>;

type ArtifactKind = "file" | "directory";

function toJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertInside(parent: string, child: string): void {
  const relative = path.relative(parent, child);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`path must remain inside ${parent}`);
  }
}

async function assertMissing(target: string): Promise<void> {
  try {
    await lstat(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  throw new Error(`delivery path already exists: ${target}`);
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, toJson(value), "utf8");
}

async function writeJsonAtomic(
  filePath: string,
  value: unknown,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, toJson(value), "utf8");
    await rename(temporaryPath, filePath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    throw error;
  }
}

async function collectRegularFiles(
  directory: string,
  relativeDirectory = "",
): Promise<string[]> {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files: string[] = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`package contains a symbolic link: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      files.push(...(await collectRegularFiles(directory, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`package contains a non-regular entry: ${relativePath}`);
    }
  }
  return files;
}

async function copyRegularDirectory(
  sourceDirectory: string,
  destinationDirectory: string,
): Promise<void> {
  const files = await collectRegularFiles(sourceDirectory);
  if (files.length === 0) throw new Error("source package is empty");
  for (const relativePath of files) {
    const source = path.join(sourceDirectory, relativePath);
    const destination = path.join(destinationDirectory, relativePath);
    assertInside(sourceDirectory, source);
    assertInside(destinationDirectory, destination);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
  }
}

async function verifySelectedPackageAssets(
  packageDirectory: string,
  selection: AssetSelectionPlan | undefined,
): Promise<void> {
  if (selection === undefined) return;
  const verifiedPaths = new Set<string>();
  for (const selected of selection.selections) {
    const relativePath = selected.materialization.runtimeUrl.slice(1);
    if (verifiedPaths.has(relativePath)) continue;
    const packagedPath = path.join(
      packageDirectory,
      ...relativePath.split("/"),
    );
    assertInside(packageDirectory, packagedPath);
    if ((await sha256File(packagedPath)) !== selected.sourceFile.sha256) {
      throw new Error(
        `selected package asset hash mismatch: ${selected.selectedAssetId}`,
      );
    }
    verifiedPaths.add(relativePath);
  }
}

async function verifyProductionBoundary(packageDirectory: string) {
  const textExtensions = new Set([".css", ".html", ".js", ".json", ".txt"]);
  const forbiddenMarkers = [
    "__SHOOTER_TEST__",
    "DEEPSEEK_API_KEY",
    "OPENCODE_MODEL",
    "api key.txt",
  ];
  for (const relativePath of await collectRegularFiles(packageDirectory)) {
    if (!textExtensions.has(path.extname(relativePath).toLowerCase())) continue;
    const contents = await readFile(
      path.join(packageDirectory, relativePath),
      "utf8",
    );
    const marker = forbiddenMarkers.find((candidate) =>
      contents.includes(candidate),
    );
    if (marker !== undefined) {
      throw new Error(
        `production package contains forbidden marker ${marker}: ${relativePath}`,
      );
    }
  }
}

async function verifyArtifact(
  runDirectory: string,
  manifest: RunManifest,
  name: keyof RunManifest["artifacts"],
  kind: ArtifactKind,
): Promise<void> {
  const evidence = manifest.artifacts[name];
  if (evidence === undefined) {
    throw new Error(`missing required ${name} artifact evidence`);
  }
  const artifactPath = path.resolve(runDirectory, evidence.path);
  assertInside(runDirectory, artifactPath);
  const actual =
    kind === "directory"
      ? (await digestDirectory(artifactPath)).sha256
      : await sha256File(artifactPath);
  if (actual !== evidence.sha256) {
    throw new Error(`${name} artifact hash does not match the manifest`);
  }
}

async function verifyRunEvidence(
  runDirectory: string,
  manifest: RunManifest,
): Promise<void> {
  const required = {
    spec: "file",
    plan: "file",
    workspace: "directory",
    runtimeConfig: "file",
    buildLog: "file",
    package: "directory",
    verification: "directory",
  } as const;
  for (const [name, kind] of Object.entries(required)) {
    await verifyArtifact(
      runDirectory,
      manifest,
      name as keyof typeof required,
      kind,
    );
  }
  if (manifest.artifacts.assetSelection !== undefined) {
    await verifyArtifact(runDirectory, manifest, "assetSelection", "file");
  }
  if (manifest.artifacts.assetQueryGrounding !== undefined) {
    await verifyArtifact(runDirectory, manifest, "assetQueryGrounding", "file");
  }
  await verifySpecEvidenceChain(runDirectory, manifest);
}

async function readBrowserEvidence(
  runDirectory: string,
  manifest: RunManifest,
): Promise<z.infer<typeof BrowserDeliveryEvidenceSchema>> {
  const verification = manifest.artifacts.verification;
  if (verification === undefined) {
    throw new Error("missing verification evidence");
  }
  const reportPath = path.join(
    runDirectory,
    ...verification.path.split("/"),
    "browser-gates.json",
  );
  assertInside(runDirectory, reportPath);
  const report = BrowserDeliveryEvidenceSchema.parse(
    JSON.parse(await readFile(reportPath, "utf8")),
  );
  const caseNames = new Set(report.cases.map((entry) => entry.name));
  if (!caseNames.has("desktop") || !caseNames.has("mobile")) {
    throw new Error("verification must contain desktop and mobile cases");
  }
  return report;
}

async function readSelection(
  runDirectory: string,
  manifest: RunManifest,
): Promise<AssetSelectionPlan | undefined> {
  const evidence = manifest.artifacts.assetSelection;
  if (evidence === undefined) return undefined;
  const selectionPath = path.join(runDirectory, ...evidence.path.split("/"));
  assertInside(runDirectory, selectionPath);
  return parseAssetSelectionPlan(
    JSON.parse(await readFile(selectionPath, "utf8")),
  );
}

function licenseUrl(licenseId: "CC0-1.0" | "CC-BY-4.0"): string {
  return licenseId === "CC0-1.0"
    ? "https://creativecommons.org/publicdomain/zero/1.0/"
    : "https://creativecommons.org/licenses/by/4.0/";
}

function assetNotices(selection: AssetSelectionPlan | undefined) {
  if (selection === undefined) return [];
  const entries = new Map<
    string,
    {
      assetId: string;
      categories: Set<string>;
      queryIds: Set<string>;
      packagedPath: string;
      sourceSha256: string;
      siteName: string;
      author: string;
      sourcePageUrl: string;
      licenseId: "CC0-1.0" | "CC-BY-4.0";
      licenseUrl: string;
      attributionText: string;
    }
  >();
  for (const selected of selection.selections) {
    const previous = entries.get(selected.selectedAssetId);
    if (previous !== undefined) {
      previous.categories.add(selected.category);
      previous.queryIds.add(selected.queryId);
      continue;
    }
    entries.set(selected.selectedAssetId, {
      assetId: selected.selectedAssetId,
      categories: new Set([selected.category]),
      queryIds: new Set([selected.queryId]),
      packagedPath: `game${selected.materialization.runtimeUrl}`,
      sourceSha256: selected.sourceFile.sha256,
      siteName: selected.provenance.siteName,
      author: selected.provenance.author,
      sourcePageUrl: selected.provenance.sourcePageUrl,
      licenseId: selected.provenance.licenseId,
      licenseUrl: licenseUrl(selected.provenance.licenseId),
      attributionText: selected.provenance.attributionText,
    });
  }
  return [...entries.values()]
    .sort((left, right) => left.assetId.localeCompare(right.assetId))
    .map((entry) => ({
      ...entry,
      categories: [...entry.categories].sort(),
      queryIds: [...entry.queryIds].sort(),
    }));
}

async function inventoryFiles(directory: string) {
  const files = await collectRegularFiles(directory);
  return Promise.all(
    files.map(async (relativePath) => {
      const filePath = path.join(directory, relativePath);
      const stats = await lstat(filePath);
      return {
        path: relativePath.replaceAll("\\", "/"),
        byteSize: stats.size,
        sha256: await sha256File(filePath),
      };
    }),
  );
}

function runInstructions(runId: string): string {
  return `# Run the packaged H5 game

Run ID: \`${runId}\`

Serve the \`game\` directory as the web root with any static HTTP server. Do
not open \`index.html\` directly from the filesystem because browser asset URL
handling differs from an HTTP deployment.

Examples:

\`\`\`powershell
python -m http.server 8080 --directory game
\`\`\`

\`\`\`powershell
npx serve game
\`\`\`

Then open the URL printed by the selected server. The package contains no model
credential, OpenCode runtime, development bridge, or source corpus. Review
\`PACKAGE_MANIFEST.json\`, \`THIRD_PARTY_NOTICES.md\`, and
\`THIRD_PARTY_ASSETS.json\` before redistribution.
`;
}

export async function runPackagingStage(
  options: RunPackagingStageOptions,
): Promise<RunPackagingStageResult> {
  const projectDirectory = path.resolve(options.projectDirectory);
  const runsDirectory = path.join(projectDirectory, "artifacts", "runs");
  const runDirectory = path.join(runsDirectory, options.runId);
  assertInside(runsDirectory, runDirectory);
  const manifestPath = path.join(runDirectory, MANIFEST_PATH);
  let manifest = RunManifestSchema.parse(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  if (manifest.state !== "play_checked") {
    throw new Error(
      `packaging stage requires play_checked state, received ${manifest.state}`,
    );
  }

  const deliveryDirectory = path.join(runDirectory, DELIVERY_PATH);
  assertInside(runDirectory, deliveryDirectory);
  await assertMissing(deliveryDirectory);
  await verifyRunEvidence(runDirectory, manifest);
  const browserEvidence = await readBrowserEvidence(runDirectory, manifest);
  const selection = await readSelection(runDirectory, manifest);

  const temporaryDirectory = path.join(
    runDirectory,
    `.delivery-${randomUUID()}.tmp`,
  );
  assertInside(runDirectory, temporaryDirectory);
  await mkdir(temporaryDirectory);
  try {
    const packageEvidence = manifest.artifacts.package!;
    const sourcePackageDirectory = path.join(
      runDirectory,
      ...packageEvidence.path.split("/"),
    );
    assertInside(runDirectory, sourcePackageDirectory);
    await verifySelectedPackageAssets(sourcePackageDirectory, selection);
    await verifyProductionBoundary(sourcePackageDirectory);
    await copyRegularDirectory(
      sourcePackageDirectory,
      path.join(temporaryDirectory, "game"),
    );
    await writeFile(
      path.join(temporaryDirectory, "RUN.md"),
      runInstructions(manifest.runId),
      "utf8",
    );

    const noticesSource = path.join(
      projectDirectory,
      THIRD_PARTY_NOTICES_SOURCE,
    );
    const noticeStats = await lstat(noticesSource);
    if (!noticeStats.isFile() || noticeStats.isSymbolicLink()) {
      throw new Error("third-party notices source is not a regular file");
    }
    await copyFile(
      noticesSource,
      path.join(temporaryDirectory, "THIRD_PARTY_NOTICES.md"),
    );
    const notices = assetNotices(selection);
    await writeJson(path.join(temporaryDirectory, "THIRD_PARTY_ASSETS.json"), {
      schemaVersion: "1.0.0",
      assetCount: notices.length,
      assets: notices,
    });

    const inventory = await inventoryFiles(temporaryDirectory);
    await writeJson(path.join(temporaryDirectory, "PACKAGE_MANIFEST.json"), {
      schemaVersion: "1.0.0",
      runId: manifest.runId,
      sourceManifestVersion: manifest.manifestVersion,
      sourceArtifacts: {
        sourceSpec: manifest.artifacts.sourceSpec ?? null,
        specIntentLedger: manifest.artifacts.specIntentLedger ?? null,
        playabilitySpec: manifest.artifacts.playabilitySpec ?? null,
        specPlayabilityCompletion:
          manifest.artifacts.specPlayabilityCompletion ?? null,
        spec: manifest.artifacts.spec,
        specCompletion: manifest.artifacts.specCompletion ?? null,
        plan: manifest.artifacts.plan,
        assetQueryGrounding: manifest.artifacts.assetQueryGrounding ?? null,
        assetSelection: manifest.artifacts.assetSelection ?? null,
        package: packageEvidence,
        verification: manifest.artifacts.verification,
      },
      verification: {
        version: browserEvidence.verificationVersion,
        engine: browserEvidence.browser.engine,
        channel: browserEvidence.browser.channel,
        cases: browserEvidence.cases.map((entry) => entry.name).sort(),
      },
      inventoryExcludesThisManifest: true,
      fileCountExcludingManifest: inventory.length,
      totalBytesExcludingManifest: inventory.reduce(
        (sum, entry) => sum + entry.byteSize,
        0,
      ),
      files: inventory,
    });

    await rename(temporaryDirectory, deliveryDirectory);
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }

  const deliveryManifestPath = path.join(
    runDirectory,
    ...DELIVERY_MANIFEST_PATH.split("/"),
  );
  const deliveryDigest = await digestDirectory(deliveryDirectory);
  manifest = RunManifestSchema.parse({
    ...manifest,
    manifestVersion: "1.5.0",
    artifacts: {
      ...manifest.artifacts,
      deliveryManifest: {
        path: DELIVERY_MANIFEST_PATH,
        sha256: await sha256File(deliveryManifestPath),
      },
      delivery: {
        path: DELIVERY_PATH,
        sha256: deliveryDigest.sha256,
      },
    },
  });
  manifest = transitionRunManifest(
    manifest,
    "packaged",
    "Verified static H5 delivery package recorded with licenses and hashes.",
    options.now?.() ?? new Date(),
  );
  try {
    await writeJsonAtomic(manifestPath, manifest);
  } catch (error) {
    await rm(deliveryDirectory, { recursive: true, force: true });
    throw error;
  }
  return { runDirectory, deliveryDirectory, manifest };
}
