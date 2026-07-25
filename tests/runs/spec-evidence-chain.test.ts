import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { planSpecIntentLedger } from "../../src/requirements/spec-intent-ledger.js";
import { completePlayableShooterGameSpec } from "../../src/requirements/spec-playability-completion-policy.js";
import { completeShooterGameSpec } from "../../src/requirements/spec-completion-policy.js";
import { sha256File } from "../../src/runs/artifact-hash.js";
import {
  createRunManifest,
  RunManifestSchema,
} from "../../src/runs/run-manifest.js";
import { verifySpecEvidenceChain } from "../../src/runs/spec-evidence-chain.js";

const createdDirectories: string[] = [];

async function writeJson(directory: string, name: string, value: unknown) {
  const filePath = path.join(directory, name);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return { path: name, sha256: await sha256File(filePath) };
}

async function createEvidenceFixture() {
  const directory = await mkdtemp(path.join(tmpdir(), "spec-evidence-"));
  createdDirectories.push(directory);
  await mkdir(directory, { recursive: true });
  const probeCase = JSON.parse(
    await readFile(
      new URL(
        "../../evals/cases/natural-language-probe-v2.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { language: "zh-CN"; prompt: string };
  const report = JSON.parse(
    await readFile(
      new URL(
        "../../artifacts/evaluations/natural-language-probes/66f33ad6-6d53-440d-9fca-4324cd768c27/report.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { spec: unknown };
  const request = { language: probeCase.language, prompt: probeCase.prompt };
  const ledger = planSpecIntentLedger(request, report.spec);
  const playability = completePlayableShooterGameSpec(
    request,
    report.spec,
    ledger,
  );
  const assetCompletion = completeShooterGameSpec(playability.completedSpec);
  const artifacts = {
    sourceSpec: await writeJson(directory, "source-spec.json", report.spec),
    specIntentLedger: await writeJson(
      directory,
      "spec-intent-ledger.json",
      ledger,
    ),
    playabilitySpec: await writeJson(
      directory,
      "playability-spec.json",
      playability.completedSpec,
    ),
    specPlayabilityCompletion: await writeJson(
      directory,
      "spec-playability-completion.json",
      playability.artifact,
    ),
    specCompletion: await writeJson(
      directory,
      "spec-completion.json",
      assetCompletion.artifact,
    ),
    spec: await writeJson(
      directory,
      "spec.json",
      assetCompletion.completedSpec,
    ),
  };
  const manifest = RunManifestSchema.parse({
    ...createRunManifest(probeCase.prompt),
    artifacts,
  });
  return { directory, manifest };
}

afterEach(async () => {
  for (const directory of createdDirectories.splice(0)) {
    await rm(directory, { recursive: true, force: true });
  }
});

describe("Spec evidence chain", () => {
  it("revalidates the request, ledger, both completion stages, and final Spec", async () => {
    const fixture = await createEvidenceFixture();
    await expect(
      verifySpecEvidenceChain(fixture.directory, fixture.manifest),
    ).resolves.toBeUndefined();
  });

  it("rejects a changed ledger before recovery or packaging", async () => {
    const fixture = await createEvidenceFixture();
    await writeFile(
      path.join(fixture.directory, "spec-intent-ledger.json"),
      "{}\n",
      "utf8",
    );
    await expect(
      verifySpecEvidenceChain(fixture.directory, fixture.manifest),
    ).rejects.toThrow("specIntentLedger artifact hash does not match");
  });
});
