import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

// Round B baseline guard for the golden Cocos sample.
//
// The sample at samples/golden-cocos/CocosShooter/ was promoted to a FORMAL
// framework + contract baseline (Round B). This test is its standing guard.
//
// Scope (matches BASELINE_LOCK.json):
//   - contract layer: the two reused product modules must stay byte-identical
//     both to their recorded hash AND to their live src/modules/ originals
//     (catches "src/ evolved but the sample copy was not resynced", or a copy
//     being silently edited).
//   - framework layer: the kernel/adapter/scene/tooling files the baseline
//     names must exist.
//   - content layer is EXPLICITLY excluded: gameplay numerics AND art assets
//     (the 5 PNGs) are content and are listed under excludedFromLock, so this
//     guard does NOT byte-lock them.
//   - toolchain product bytes (cc.js etc.) require the Cocos build and are
//     recorded in BASELINE_LOCK.json (roundAPortraitSHA256) as informative
//     cold-reproduction evidence, not enforced here.
//
// Runs in check:fast (see package.json) so the baseline is protected on every
// day-to-day change without needing the Cocos toolchain.

const repoRoot = new URL("../../", import.meta.url);
const sampleRoot = new URL("samples/golden-cocos/CocosShooter/", repoRoot);

interface BaselineLock {
  readonly version: string;
  readonly frameworkLayer: {
    readonly kernelFile: string;
    readonly adapterFile: string;
    readonly sceneFile: string;
    readonly buildScript: string;
    readonly reproScript: string;
    readonly smokeScript: string;
  };
  readonly contractLayer: {
    readonly modules: ReadonlyArray<{
      readonly name: string;
      readonly src: string;
      readonly copy: string;
      readonly sha256: string;
    }>;
  };
  readonly buildJudgment: {
    readonly passExitCode: number;
    readonly failExitCode: number;
    readonly badParamsExitCode: number;
    readonly requiredArtifact: string;
  };
  readonly excludedFromLock: readonly string[];
}

const lockUrl = new URL("samples/golden-cocos/BASELINE_LOCK.json", repoRoot);

async function sha256Of(url: URL): Promise<string> {
  const bytes = await readFile(url);
  return createHash("sha256").update(bytes).digest("hex");
}

async function exists(url: URL): Promise<boolean> {
  try {
    await access(url);
    return true;
  } catch {
    return false;
  }
}

async function loadLock(): Promise<BaselineLock> {
  const raw = await readFile(lockUrl, "utf8");
  return JSON.parse(raw) as BaselineLock;
}

describe("golden-cocos Round B baseline lock", () => {
  it("locks exactly the two reused contract modules (art/gameplay excluded)", async () => {
    const lock = await loadLock();
    expect(lock.version).toBe("1.0.0");
    expect(lock.buildJudgment.passExitCode).toBe(36);

    const names = lock.contractLayer.modules.map((m) => m.name).sort();
    expect(names).toEqual(
      ["DeterministicLogicalEntityDirectory", "SafeMonotonicCounterV1"].sort(),
    );

    // Content layer (gameplay numerics + art PNGs) must stay OUT of the lock.
    const excluded = lock.excludedFromLock.join(" ").toLowerCase();
    expect(excluded).toContain("art assets");
    expect(excluded).toContain("gameplay");
  });

  it("keeps every framework-layer file the baseline names present", async () => {
    const lock = await loadLock();
    for (const rel of [
      lock.frameworkLayer.kernelFile,
      lock.frameworkLayer.adapterFile,
      lock.frameworkLayer.sceneFile,
      lock.frameworkLayer.buildScript,
      lock.frameworkLayer.reproScript,
      lock.frameworkLayer.smokeScript,
    ]) {
      const url = new URL(rel, sampleRoot);
      expect(await exists(url), `missing framework file: ${rel}`).toBe(true);
    }
  });

  it("keeps reused module copies byte-identical to hash and to src originals", async () => {
    const lock = await loadLock();
    expect(lock.contractLayer.modules.length).toBe(2);
    for (const mod of lock.contractLayer.modules) {
      // copy is CocosShooter-relative; src is repo-root-relative.
      const copyHash = await sha256Of(new URL(mod.copy, sampleRoot));
      const srcHash = await sha256Of(new URL(mod.src, repoRoot));
      // Copy still equals the recorded lock value...
      expect(copyHash, `copy drifted: ${mod.copy}`).toBe(mod.sha256);
      // ...and still equals the live src/modules/ original (catches drift in
      // either direction between src/ and the materialised sample copy).
      expect(srcHash, `copy != original: ${mod.copy} vs ${mod.src}`).toBe(
        copyHash,
      );
    }
  });
});
