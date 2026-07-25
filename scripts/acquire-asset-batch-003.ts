import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type SourceDefinition = {
  id: string;
  pageUrl: string;
  author: string;
  assets: Array<{
    label: string;
    expectedBytes: number;
  }>;
};

const sources: SourceDefinition[] = [
  {
    id: "scrittl-starships",
    pageUrl: "https://opengameart.org/content/spaceship-set-32x32px",
    author: "Scrittl",
    assets: [{ label: "spaceshipset32x32.zip", expectedBytes: 36_900 }],
  },
  {
    id: "irmandito-starships",
    pageUrl: "https://opengameart.org/content/spaceships-32x32",
    author: "Irmandito",
    assets: [{ label: "spaceships.zip", expectedBytes: 7_200 }],
  },
  {
    id: "scientist-starships",
    pageUrl: "https://opengameart.org/content/spaceship-set",
    author: "The_Scientist___",
    assets: [{ label: "SpaceShip Sprites.zip", expectedBytes: 100_300 }],
  },
  {
    id: "lamoot-fighter",
    pageUrl: "https://opengameart.org/content/top-down-space-fighter-sprite",
    author: "Lamoot",
    assets: [{ label: "fighter.png", expectedBytes: 31_400 }],
  },
  {
    id: "gusmando-aliens",
    pageUrl:
      "https://opengameart.org/content/multiple-alien-enemies-and-soldier-character",
    author: "Gusmando",
    assets: [{ label: "soldierandenemies.zip", expectedBytes: 59_000 }],
  },
  {
    id: "david-harrington-robot",
    pageUrl: "https://opengameart.org/content/pixel-robot",
    author: "David Harrington",
    assets: [{ label: "pixel-robot.zip", expectedBytes: 33_000 }],
  },
  {
    id: "knik1985-drone",
    pageUrl: "https://opengameart.org/content/pixel-drone",
    author: "knik1985",
    assets: [{ label: "drone.zip", expectedBytes: 16_000 }],
  },
  {
    id: "zonked-turret",
    pageUrl: "https://opengameart.org/content/pixel-turret-animation",
    author: "zonked",
    assets: [
      { label: "turret-sprites-body.png", expectedBytes: 38_100 },
      { label: "turret-sprites-deployment.png", expectedBytes: 99_000 },
      { label: "turret-sprites-head-shot-idle.png", expectedBytes: 68_500 },
      { label: "turret-sprites-head-shot.png", expectedBytes: 48_200 },
    ],
  },
  {
    id: "ultrahuntr-turret",
    pageUrl: "https://opengameart.org/content/small-turret-deploying-animation",
    author: "Ultrahuntr",
    assets: [{ label: "turretdeploy.png", expectedBytes: 1_900 }],
  },
  {
    id: "scientist-objects",
    pageUrl: "https://opengameart.org/content/asteroidsdebris-set",
    author: "The_Scientist___",
    assets: [{ label: "Objects.zip", expectedBytes: 12_900 }],
  },
  {
    id: "scientist-spaceship-boss",
    pageUrl: "https://opengameart.org/content/spaceship-boss-set",
    author: "The_Scientist___",
    assets: [{ label: "SpaceShip Boss Sprites.zip", expectedBytes: 182_000 }],
  },
  {
    id: "scientist-alien-boss",
    pageUrl: "https://opengameart.org/content/alien-boss-set",
    author: "The_Scientist___",
    assets: [{ label: "Alien Bosses.zip", expectedBytes: 501_000 }],
  },
  {
    id: "chaosshark-shipyard",
    pageUrl:
      "https://opengameart.org/content/sci-fi-top-down-shipyard-space-station",
    author: "ChaosShark",
    assets: [{ label: "Shipyard Exterior.png", expectedBytes: 19_800 }],
  },
  {
    id: "shiv-mecha",
    pageUrl: "https://opengameart.org/content/mecha-platformer-pixelart",
    author: "Shiv",
    assets: [{ label: "mechaplatformer_bu_shiv.zip", expectedBytes: 542_400 }],
  },
  {
    id: "stealthix-backgrounds",
    pageUrl: "https://opengameart.org/content/pixel-art-backgrounds-0",
    author: "stealthix",
    assets: [{ label: "Backgrounds.zip", expectedBytes: 90_000 }],
  },
  {
    id: "ansimuz-space-shooter",
    pageUrl: "https://opengameart.org/node/34210",
    author: "ansimuz",
    assets: [{ label: "space_shooter_pack.zip", expectedBytes: 263_000 }],
  },
  {
    id: "konita-powerups",
    pageUrl: "https://opengameart.org/content/power-ups",
    author: "KonitaTutorials",
    assets: [{ label: "powerups.zip", expectedBytes: 5_500 }],
  },
  {
    id: "cethiel-pickups",
    pageUrl: "https://opengameart.org/content/pickup-items-icons",
    author: "Cethiel",
    assets: [{ label: "PowerUp.zip", expectedBytes: 588_400 }],
  },
  {
    id: "tokyogeisha-ui",
    pageUrl: "https://opengameart.org/content/pixel-uihud-pack",
    author: "TokyoGeisha",
    assets: [{ label: "PixelUIHUDPack.zip", expectedBytes: 77_000 }],
  },
  {
    id: "barkino-ui",
    pageUrl: "https://opengameart.org/content/pixel-ui-kit",
    author: "barkino",
    assets: [{ label: "Pixel UI.zip", expectedBytes: 6_200 }],
  },
  {
    id: "pace-smith-ui",
    pageUrl:
      "https://opengameart.org/content/retro-pixel-art-guihud-elements-including-dialogue-box",
    author: "Pace Smith",
    assets: [
      { label: "dialoguebox1.png", expectedBytes: 206 },
      { label: "dialoguebox2.png", expectedBytes: 233 },
      { label: "mouse pointer.png", expectedBytes: 340 },
      { label: "question mark.png", expectedBytes: 836 },
      { label: "quit-icon.png", expectedBytes: 408 },
      { label: "speaker-icon1.png", expectedBytes: 479 },
    ],
  },
  {
    id: "rawdanitsu-ui",
    pageUrl:
      "https://opengameart.org/content/simple-hud-gui-constraction-kit-in-8-colors",
    author: "Rawdanitsu",
    assets: [{ label: "Space-Gui.zip", expectedBytes: 1_300_000 }],
  },
  {
    id: "reactorcore-muzzle",
    pageUrl:
      "https://opengameart.org/content/gun-muzzle-flash-effects-fire-and-ion-and-melee",
    author: "Reactorcore",
    assets: [
      { label: "rc_art_-_muzzle_effects.zip", expectedBytes: 1_200_000 },
    ],
  },
  {
    id: "reactorcore-plasma",
    pageUrl:
      "https://opengameart.org/content/plasma-electric-effect-animations",
    author: "Reactorcore",
    assets: [
      {
        label: "rc_art_-_plasma_electric_animations.zip",
        expectedBytes: 2_700_000,
      },
    ],
  },
  {
    id: "gameprogrammingslave-effects",
    pageUrl: "https://opengameart.org/content/explosions",
    author: "GameProgrammingSlave",
    assets: [
      { label: "explosion0.png", expectedBytes: 22_800 },
      { label: "explosion1.png", expectedBytes: 25_900 },
      { label: "explosion2.png", expectedBytes: 24_900 },
      { label: "shields.png", expectedBytes: 15_600 },
    ],
  },
  {
    id: "arlantr-energy",
    pageUrl: "https://opengameart.org/content/energy",
    author: "ArlanTR",
    assets: [{ label: "energy-sprite-sheet.png", expectedBytes: 4_200 }],
  },
  {
    id: "zeroisnotnull-shield",
    pageUrl: "https://opengameart.org/content/shield-sprite",
    author: "zeroisnotnull",
    assets: [{ label: "shield.png", expectedBytes: 150_600 }],
  },
  {
    id: "diggy-rocket",
    pageUrl: "https://opengameart.org/content/16-direction-rocket-projectile",
    author: "diggy",
    assets: [{ label: "projectile_rocket_16x16.png", expectedBytes: 98_800 }],
  },
  {
    id: "luca-pixel-bullets",
    pageUrl:
      "https://opengameart.org/content/bullet-collection-different-colors",
    author: "Luca Pixel",
    assets: [{ label: "Bullet.zip", expectedBytes: 2_300 }],
  },
];

const expectedSourceCount = 29;
const expectedAssetCount = 40;
const expectedLogicalGetCount = 70;
const downloadHardStopBytes = 15_000_000;
const assetRequestSpacingMs = 10_000;
const requestTimeoutMs = 60_000;
const allowedHostnames = new Set(["opengameart.org", "www.opengameart.org"]);
const outputRoot = path.resolve(".runtime", "asset-batch-003", "acquisition");
const downloadsRoot = path.join(outputRoot, "downloads");
const eventsPath = path.join(outputRoot, "request-events.jsonl");
const attemptRunId = randomUUID();

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

const decodeHtml = (value: string): string =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    );

const plainText = (html: string): string =>
  decodeHtml(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const normalizedLabel = (value: string): string =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();

const assertAllowedUrl = (url: string, purpose: string): URL => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !allowedHostnames.has(parsed.hostname)) {
    throw new Error(`${purpose} resolved to unexpected URL: ${url}`);
  }
  return parsed;
};

const fetchWithTimeout = async (url: string): Promise<Response> => {
  assertAllowedUrl(url, "request");
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "game-agent-asset-research/1.0 (bounded Batch 003 acquisition)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  assertAllowedUrl(response.url, "response");
  if (!response.ok) {
    throw new Error(`GET ${url} failed with HTTP ${response.status}`);
  }
  return response;
};

const readResponseBounded = async (
  response: Response,
  remainingBytes: number,
): Promise<Uint8Array> => {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null && Number(declaredLength) > remainingBytes) {
    throw new Error(
      `response content-length ${declaredLength} exceeds remaining ${remainingBytes}`,
    );
  }
  if (response.body === null) {
    throw new Error("response has no body");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > remainingBytes) {
      await reader.cancel("Batch 003 download hard stop");
      throw new Error(`response crossed remaining byte cap ${remainingBytes}`);
    }
    chunks.push(value);
  }

  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
};

const extractAssetUrl = (
  html: string,
  pageUrl: string,
  label: string,
): string => {
  const anchors = [
    ...html.matchAll(
      /<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi,
    ),
  ];
  const target = normalizedLabel(label);
  for (const match of anchors) {
    const href = decodeHtml(match[1] ?? match[2] ?? "");
    const text = normalizedLabel(plainText(match[3] ?? ""));
    if (text === target) {
      return new URL(href, pageUrl).href;
    }
  }

  const targetStem = target.replace(/\.[^.]+$/, "");
  for (const match of anchors) {
    const href = decodeHtml(match[1] ?? match[2] ?? "");
    const resolved = new URL(href, pageUrl);
    const basename = normalizedLabel(
      decodeURIComponent(resolved.pathname.split("/").at(-1) ?? ""),
    );
    if (basename.replace(/_\d+(?=\.[^.]+$)/, "").includes(targetStem)) {
      return resolved.href;
    }
  }
  throw new Error(`could not locate fixed asset link ${label} on ${pageUrl}`);
};

const safeOutputName = (sourceId: string, label: string): string => {
  const extension = path.extname(label).toLowerCase();
  const basename = path
    .basename(label, path.extname(label))
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${sourceId}--${basename}${extension}`;
};

const sleep = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const recordEvent = async (event: Record<string, unknown>): Promise<void> => {
  await appendFile(
    eventsPath,
    `${JSON.stringify({ attemptRunId, at: new Date().toISOString(), ...event })}\n`,
    "utf8",
  );
};

const main = async (): Promise<void> => {
  const assetCount = sources.reduce(
    (total, source) => total + source.assets.length,
    0,
  );
  if (
    sources.length !== expectedSourceCount ||
    assetCount !== expectedAssetCount
  ) {
    throw new Error(
      `fixed plan mismatch: ${sources.length} sources and ${assetCount} assets`,
    );
  }
  if (1 + sources.length + assetCount !== expectedLogicalGetCount) {
    throw new Error("fixed logical GET count no longer equals the proposal");
  }

  await mkdir(downloadsRoot, { recursive: true });
  const startedAt = new Date().toISOString();
  const requestEvidence: Array<Record<string, unknown>> = [];
  let logicalGetNumber = 0;

  await recordEvent({ event: "attempt-start", expectedLogicalGetCount });
  logicalGetNumber += 1;
  await recordEvent({
    event: "request-start",
    logicalGetNumber,
    kind: "robots",
    requestedUrl: "https://opengameart.org/robots.txt",
  });
  process.stdout.write(
    `[${logicalGetNumber}/${expectedLogicalGetCount}] preflight robots\n`,
  );
  const robotsResponse = await fetchWithTimeout(
    "https://opengameart.org/robots.txt",
  );
  const robotsBytes = await readResponseBounded(robotsResponse, 1_000_000);
  const robotsText = new TextDecoder().decode(robotsBytes);
  if (
    /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robotsText)
  ) {
    throw new Error("OpenGameArt robots policy disallows the acquisition");
  }
  requestEvidence.push({
    logicalGetNumber,
    kind: "robots",
    requestedUrl: "https://opengameart.org/robots.txt",
    responseUrl: robotsResponse.url,
    bytes: robotsBytes.byteLength,
    sha256: sha256(robotsBytes),
  });
  await recordEvent({
    event: "request-complete",
    logicalGetNumber,
    kind: "robots",
    responseUrl: robotsResponse.url,
    bytes: robotsBytes.byteLength,
    sha256: sha256(robotsBytes),
  });

  const pageEvidence = new Map<
    string,
    { html: string; responseUrl: string; bytes: number; sha256: string }
  >();
  for (const source of sources) {
    const license =
      source.id === "irmandito-starships" ? "CC-BY-4.0" : "CC0-1.0";
    logicalGetNumber += 1;
    await recordEvent({
      event: "request-start",
      logicalGetNumber,
      kind: "source-page",
      sourceId: source.id,
      requestedUrl: source.pageUrl,
    });
    process.stdout.write(
      `[${logicalGetNumber}/${expectedLogicalGetCount}] preflight ${source.id}\n`,
    );
    const response = await fetchWithTimeout(source.pageUrl);
    const body = await readResponseBounded(response, 2_000_000);
    const html = new TextDecoder().decode(body);
    const text = plainText(html);
    if (!text.includes(source.author)) {
      throw new Error(
        `${source.id} page no longer names author ${source.author}`,
      );
    }
    const licenseIsProven =
      license === "CC-BY-4.0"
        ? /CC-BY\s*4\.0|CC BY\s*4\.0/i.test(text)
        : /\bCC0\b|Creative Commons Zero/i.test(text);
    if (!licenseIsProven) {
      throw new Error(`${source.id} page no longer proves ${license}`);
    }
    for (const asset of source.assets) {
      extractAssetUrl(html, response.url, asset.label);
    }
    const evidence = {
      html,
      responseUrl: response.url,
      bytes: body.byteLength,
      sha256: sha256(body),
    };
    pageEvidence.set(source.id, evidence);
    requestEvidence.push({
      logicalGetNumber,
      kind: "source-page",
      sourceId: source.id,
      author: source.author,
      license,
      requestedUrl: source.pageUrl,
      responseUrl: response.url,
      bytes: body.byteLength,
      sha256: evidence.sha256,
    });
    await recordEvent({
      event: "request-complete",
      logicalGetNumber,
      kind: "source-page",
      sourceId: source.id,
      responseUrl: response.url,
      bytes: body.byteLength,
      sha256: evidence.sha256,
    });
  }

  let downloadedBytes = 0;
  let previousAssetStart = 0;
  for (const source of sources) {
    const license =
      source.id === "irmandito-starships" ? "CC-BY-4.0" : "CC0-1.0";
    const page = pageEvidence.get(source.id);
    if (page === undefined)
      throw new Error(`missing page evidence for ${source.id}`);
    for (const asset of source.assets) {
      if (downloadedBytes + asset.expectedBytes > downloadHardStopBytes) {
        throw new Error(
          `expected ${asset.label} would cross the download hard stop`,
        );
      }
      const elapsed = Date.now() - previousAssetStart;
      if (previousAssetStart !== 0 && elapsed < assetRequestSpacingMs) {
        await sleep(assetRequestSpacingMs - elapsed);
      }
      const assetUrl = extractAssetUrl(
        page.html,
        page.responseUrl,
        asset.label,
      );
      assertAllowedUrl(assetUrl, `asset ${asset.label}`);
      previousAssetStart = Date.now();
      logicalGetNumber += 1;
      await recordEvent({
        event: "request-start",
        logicalGetNumber,
        kind: "asset-file",
        sourceId: source.id,
        label: asset.label,
        requestedUrl: assetUrl,
      });
      process.stdout.write(
        `[${logicalGetNumber}/${expectedLogicalGetCount}] download ${source.id}/${asset.label}\n`,
      );
      const response = await fetchWithTimeout(assetUrl);
      const body = await readResponseBounded(
        response,
        downloadHardStopBytes - downloadedBytes,
      );
      downloadedBytes += body.byteLength;
      const outputName = safeOutputName(source.id, asset.label);
      const outputPath = path.join(downloadsRoot, outputName);
      await writeFile(outputPath, body, { flag: "wx" });
      requestEvidence.push({
        logicalGetNumber,
        kind: "asset-file",
        sourceId: source.id,
        author: source.author,
        license,
        sourcePage: source.pageUrl,
        label: asset.label,
        requestedUrl: assetUrl,
        responseUrl: response.url,
        contentType: response.headers.get("content-type"),
        expectedBytes: asset.expectedBytes,
        bytes: body.byteLength,
        sha256: sha256(body),
        outputPath: path.relative(outputRoot, outputPath).replaceAll("\\", "/"),
      });
      await recordEvent({
        event: "request-complete",
        logicalGetNumber,
        kind: "asset-file",
        sourceId: source.id,
        label: asset.label,
        responseUrl: response.url,
        bytes: body.byteLength,
        sha256: sha256(body),
      });
      process.stdout.write(
        `[${logicalGetNumber}/${expectedLogicalGetCount}] ${source.id}/${asset.label}: ${body.byteLength} bytes\n`,
      );
    }
  }

  if (logicalGetNumber !== expectedLogicalGetCount) {
    throw new Error(
      `completed ${logicalGetNumber} logical GETs, expected ${expectedLogicalGetCount}`,
    );
  }
  const manifest = {
    schemaVersion: "1.0.0",
    batchId: "003",
    attemptRunId,
    status: "downloaded-uninspected",
    startedAt,
    completedAt: new Date().toISOString(),
    proposal: "docs/ASSET_BATCH_003_PROPOSAL.md",
    limits: {
      logicalGetCount: expectedLogicalGetCount,
      downloadHardStopBytes,
      expandedWorkspaceHardStopBytes: 150_000_000,
      permanentCandidateHardStopBytes: 20_000_000,
      assetRequestSpacingMs,
    },
    actual: {
      logicalGetCount: logicalGetNumber,
      sourcePageCount: sources.length,
      archiveCount: sources
        .flatMap((source) => source.assets)
        .filter((asset) => asset.label.toLowerCase().endsWith(".zip")).length,
      directPngCount: sources
        .flatMap((source) => source.assets)
        .filter((asset) => asset.label.toLowerCase().endsWith(".png")).length,
      downloadedBytes,
    },
    requests: requestEvidence,
  };
  await writeFile(
    path.join(outputRoot, "download-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx" },
  );
  await recordEvent({
    event: "attempt-complete",
    logicalGetCount: logicalGetNumber,
    downloadedBytes,
  });
  process.stdout.write(
    `Batch 003 download complete: ${downloadedBytes} bytes across ${logicalGetNumber} logical GETs.\n`,
  );
};

await main().catch(async (error: unknown) => {
  await mkdir(outputRoot, { recursive: true });
  await recordEvent({
    event: "attempt-failed",
    error: error instanceof Error ? error.message : String(error),
  });
  throw error;
});
