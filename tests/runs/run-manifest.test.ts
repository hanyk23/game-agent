import { describe, expect, it } from "vitest";

import {
  createRunManifest,
  RunManifestSchema,
  transitionRunManifest,
} from "../../src/runs/run-manifest.js";

const runId = "e9c6c8cf-d2be-4f9d-8dd4-cfc994f342f4";
const start = new Date("2026-07-15T00:00:00.000Z");

describe("run manifest", () => {
  it("creates a deterministic received-state manifest", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });

    expect(manifest.state).toBe("received");
    expect(manifest.manifestVersion).toBe("1.5.0");
    expect(manifest.repairBudget).toEqual({ maximumRounds: 3, usedRounds: 0 });
    expect(manifest.transitions).toHaveLength(1);
  });

  it("continues to parse pre-asset manifest version 1.1.0", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });

    expect(
      RunManifestSchema.parse({ ...manifest, manifestVersion: "1.1.0" })
        .manifestVersion,
    ).toBe("1.1.0");
  });

  it("records valid state transitions", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });
    const next = transitionRunManifest(
      manifest,
      "spec_generated",
      "Structured output received.",
      new Date("2026-07-15T00:00:01.000Z"),
    );

    expect(next.state).toBe("spec_generated");
    expect(next.transitions.at(-1)).toMatchObject({
      from: "received",
      to: "spec_generated",
    });
  });

  it("rejects skipped or backwards transitions", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });

    expect(() =>
      transitionRunManifest(manifest, "built", "Skip ahead."),
    ).toThrow("invalid run transition");
  });

  it("counts and enforces repair rounds", () => {
    let manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
      maximumRepairRounds: 1,
    });
    manifest = transitionRunManifest(
      manifest,
      "spec_generated",
      "Spec generated.",
    );
    manifest = transitionRunManifest(manifest, "spec_validated", "Spec valid.");
    manifest = transitionRunManifest(manifest, "planned", "Plan ready.");
    manifest = transitionRunManifest(manifest, "composed", "Game composed.");
    manifest = transitionRunManifest(manifest, "built", "Build complete.");
    manifest = transitionRunManifest(
      manifest,
      "repairing",
      "Build finding selected.",
    );
    manifest = transitionRunManifest(manifest, "built", "Patch rebuilt.");

    expect(manifest.repairBudget.usedRounds).toBe(1);
    expect(() =>
      transitionRunManifest(manifest, "repairing", "Retry again."),
    ).toThrow("repair budget exhausted");
  });

  it("records explicit exhaustion when no further repair round is available", () => {
    let manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
      maximumRepairRounds: 0,
    });
    manifest = transitionRunManifest(
      manifest,
      "spec_generated",
      "Spec generated.",
    );
    manifest = transitionRunManifest(manifest, "spec_validated", "Spec valid.");
    manifest = transitionRunManifest(manifest, "planned", "Plan ready.");
    manifest = transitionRunManifest(manifest, "composed", "Game composed.");
    manifest = transitionRunManifest(manifest, "built", "Build complete.");
    manifest = transitionRunManifest(
      manifest,
      "repair_budget_exhausted",
      "No repair rounds remain.",
    );

    expect(manifest.state).toBe("repair_budget_exhausted");
    expect(manifest.repairBudget.usedRounds).toBe(0);
  });

  it("rejects artifact paths that escape a run directory", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });

    expect(
      RunManifestSchema.safeParse({
        ...manifest,
        artifacts: {
          spec: {
            path: "../outside.json",
            sha256: "0".repeat(64),
          },
        },
      }).success,
    ).toBe(false);
  });

  it("rejects malformed artifact hashes", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });

    expect(
      RunManifestSchema.safeParse({
        ...manifest,
        artifacts: {
          spec: { path: "spec.json", sha256: "not-a-sha256" },
        },
      }).success,
    ).toBe(false);
  });

  it("accepts optional versioned asset-query grounding evidence", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });

    expect(
      RunManifestSchema.parse({
        ...manifest,
        artifacts: {
          assetQueryGrounding: {
            path: "asset-query-grounding.json",
            sha256: "a".repeat(64),
          },
        },
      }).artifacts.assetQueryGrounding,
    ).toEqual({
      path: "asset-query-grounding.json",
      sha256: "a".repeat(64),
    });
  });

  it("accepts optional Spec completion evidence", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });

    expect(
      RunManifestSchema.parse({
        ...manifest,
        artifacts: {
          sourceSpec: {
            path: "source-spec.json",
            sha256: "a".repeat(64),
          },
          specCompletion: {
            path: "spec-completion.json",
            sha256: "b".repeat(64),
          },
        },
      }).artifacts,
    ).toMatchObject({
      sourceSpec: { path: "source-spec.json" },
      specCompletion: { path: "spec-completion.json" },
    });
  });

  it("accepts the playability evidence chain", () => {
    const manifest = createRunManifest("Generate a game", {
      runId,
      now: () => start,
    });
    const evidence = (path: string, value: string) => ({
      path,
      sha256: value.repeat(64),
    });

    expect(
      RunManifestSchema.parse({
        ...manifest,
        artifacts: {
          sourceSpec: evidence("source-spec.json", "a"),
          specIntentLedger: evidence("spec-intent-ledger.json", "b"),
          playabilitySpec: evidence("playability-spec.json", "c"),
          specPlayabilityCompletion: evidence(
            "spec-playability-completion.json",
            "d",
          ),
        },
      }).artifacts,
    ).toMatchObject({
      specIntentLedger: { path: "spec-intent-ledger.json" },
      playabilitySpec: { path: "playability-spec.json" },
      specPlayabilityCompletion: {
        path: "spec-playability-completion.json",
      },
    });
  });
});
