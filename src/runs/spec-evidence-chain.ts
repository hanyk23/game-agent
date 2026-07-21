import { readFile } from "node:fs/promises";
import path from "node:path";

import { SpecIntentLedgerSchema } from "../requirements/spec-intent-ledger.js";
import { verifySpecPlayabilityCompletion } from "../requirements/spec-playability-completion-policy.js";
import { verifySpecCompletion } from "../requirements/spec-completion-policy.js";
import { sha256File } from "./artifact-hash.js";
import type { RunManifest } from "./run-manifest.js";

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

async function readArtifact(
  runDirectory: string,
  manifest: RunManifest,
  name: keyof RunManifest["artifacts"],
): Promise<unknown> {
  const evidence = manifest.artifacts[name];
  if (evidence === undefined) {
    throw new Error(`missing ${name} artifact evidence`);
  }
  const artifactPath = path.resolve(runDirectory, evidence.path);
  assertInside(runDirectory, artifactPath);
  if ((await sha256File(artifactPath)) !== evidence.sha256) {
    throw new Error(`${name} artifact hash does not match the manifest`);
  }
  return JSON.parse(await readFile(artifactPath, "utf8"));
}

export async function verifySpecEvidenceChain(
  runDirectory: string,
  manifest: RunManifest,
): Promise<void> {
  const finalSpec = await readArtifact(runDirectory, manifest, "spec");
  const sourceEvidence = manifest.artifacts.sourceSpec;
  const ledgerEvidence = manifest.artifacts.specIntentLedger;
  const playabilitySpecEvidence = manifest.artifacts.playabilitySpec;
  const playabilityCompletionEvidence =
    manifest.artifacts.specPlayabilityCompletion;
  const playabilityCount = [
    ledgerEvidence,
    playabilitySpecEvidence,
    playabilityCompletionEvidence,
  ].filter((entry) => entry !== undefined).length;
  if (playabilityCount !== 0 && playabilityCount !== 3) {
    throw new Error(
      "intent ledger, playability Spec, and playability completion evidence must appear together",
    );
  }

  let completionSource: unknown | undefined;
  if (playabilityCount === 3) {
    if (sourceEvidence === undefined) {
      throw new Error(
        "playability completion requires sourceSpec artifact evidence",
      );
    }
    const sourceSpec = await readArtifact(runDirectory, manifest, "sourceSpec");
    const rawLedger = await readArtifact(
      runDirectory,
      manifest,
      "specIntentLedger",
    );
    const ledger = SpecIntentLedgerSchema.parse(rawLedger);
    const playabilitySpec = await readArtifact(
      runDirectory,
      manifest,
      "playabilitySpec",
    );
    const playabilityCompletion = await readArtifact(
      runDirectory,
      manifest,
      "specPlayabilityCompletion",
    );
    verifySpecPlayabilityCompletion(
      { language: ledger.request.language, prompt: manifest.request.prompt },
      sourceSpec,
      playabilitySpec,
      ledger,
      playabilityCompletion,
    );
    completionSource = playabilitySpec;
  }

  const specCompletionEvidence = manifest.artifacts.specCompletion;
  if (specCompletionEvidence !== undefined) {
    completionSource ??= await readArtifact(
      runDirectory,
      manifest,
      "sourceSpec",
    );
    const specCompletion = await readArtifact(
      runDirectory,
      manifest,
      "specCompletion",
    );
    verifySpecCompletion(completionSource, finalSpec, specCompletion);
  } else if (playabilityCount === 3) {
    if (
      manifest.artifacts.playabilitySpec!.sha256 !==
      manifest.artifacts.spec!.sha256
    ) {
      throw new Error(
        "final Spec must match playabilitySpec when asset completion is absent",
      );
    }
  } else if (sourceEvidence !== undefined) {
    throw new Error(
      "legacy sourceSpec and specCompletion artifact evidence must appear together",
    );
  }
}
