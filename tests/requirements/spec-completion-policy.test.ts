import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  completeShooterGameSpec,
  SpecCompletionError,
  verifySpecCompletion,
} from "../../src/requirements/spec-completion-policy.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

const v2ReportUrl = new URL(
  "../../artifacts/evaluations/natural-language-probes/66f33ad6-6d53-440d-9fca-4324cd768c27/report.json",
  import.meta.url,
);

async function loadV2Spec(): Promise<unknown> {
  const report = JSON.parse(await readFile(v2ReportUrl, "utf8")) as {
    spec: unknown;
  };
  return report.spec;
}

describe("SpecCompletionPolicy", () => {
  it("adds a recorded background to the preserved v2 source Spec", async () => {
    const rawSpec = await loadV2Spec();
    const original = structuredClone(rawSpec);
    const first = completeShooterGameSpec(rawSpec);
    const second = completeShooterGameSpec(rawSpec);

    expect(second).toEqual(first);
    expect(rawSpec).toEqual(original);
    expect(first.artifact).toMatchObject({
      schemaVersion: "1.0.0",
      policyId: "vertical-shooter-defaults-v1",
      decisions: [
        {
          action: "added",
          queryId: "default-background",
          ruleId: "add-required-background-v1",
          derivedValue: {
            category: "background",
            theme: "space",
            visualStyle: ["pixel-art", "retro"],
          },
        },
      ],
    });
    expect(first.completedSpec.assetQueries).toHaveLength(10);
    expect(first.sourceSpec.assetQueries).toHaveLength(9);
    expect(first.artifact.sourceSpec.sha256).not.toBe(
      first.artifact.completedSpec.sha256,
    );
  });

  it("does not override an explicit background query", () => {
    const spec = createValidSpec();
    const background = structuredClone(
      spec.assetQueries.find((query) => query.category === "background"),
    );
    const result = completeShooterGameSpec(spec);

    expect(result.artifact.decisions).toEqual([]);
    expect(
      result.completedSpec.assetQueries.find(
        (query) => query.category === "background",
      ),
    ).toEqual(background);
    expect(result.artifact.sourceSpec.sha256).toBe(
      result.artifact.completedSpec.sha256,
    );
  });

  it("derives the other fixed catalog role when it is omitted", () => {
    const spec = createValidSpec();
    spec.assetQueries = spec.assetQueries.filter(
      (query) => query.category !== "enemy-projectile",
    );
    const result = completeShooterGameSpec(spec);

    expect(result.artifact.decisions).toHaveLength(1);
    expect(result.artifact.decisions[0]).toMatchObject({
      queryId: "default-enemy-projectile",
      ruleId: "add-required-enemy-projectile-v1",
      derivedValue: {
        category: "enemy-projectile",
        theme: "energy",
        visualStyle: ["glow"],
      },
    });
  });

  it("rejects completion evidence rebound to a changed derived value", async () => {
    const result = completeShooterGameSpec(await loadV2Spec());
    const tampered = structuredClone(result.artifact);
    tampered.decisions[0]!.derivedValue.theme = "arcade";

    expect(() =>
      verifySpecCompletion(result.sourceSpec, result.completedSpec, tampered),
    ).toThrow(SpecCompletionError);
  });
});
