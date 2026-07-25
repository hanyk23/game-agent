import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  adaptShooterGameSpecToBatch3,
  type Batch3LegacyAssetEvidenceInput,
} from "../../src/modules/batch3-legacy-adapter.js";
import { createBatch3ProductionRegistry } from "../../src/modules/batch3-production-library.js";
import { resolveGameAssemblyV14 } from "../../src/modules/game-module-composer-v14.js";
import { parseShooterGameSpec } from "../../src/requirements/shooter-game-spec.js";

function admittedAssets(
  spec: ReturnType<typeof parseShooterGameSpec>,
): Batch3LegacyAssetEvidenceInput {
  return Object.freeze({
    byQueryId: Object.freeze(
      Object.fromEntries(
        spec.assetQueries.map((query, index) => [
          query.id,
          Object.freeze({
            assetId: `legacy.asset.${index}`,
            sourceSha256: String((index % 9) + 1).repeat(64),
            runtimeSha256: String(((index + 1) % 9) + 1).repeat(64),
            provenanceId: "legacy.recorded.reviewed",
            licenseRecordId: "project-owner-approved",
          }),
        ]),
      ),
    ),
    approvedSharingEvidenceIds: Object.freeze(["legacy.texture-sharing"]),
  });
}

describe("Batch 3 deterministic legacy adapter", () => {
  it("resolves the preserved v2 Spec as a production-ready Graph 1.4", async () => {
    const report = JSON.parse(
      await readFile(
        new URL(
          "../../evals/reports/deepseek-direct-live-spec.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as { status: string; spec: unknown };
    expect(report.status).toBe("passed");
    const spec = parseShooterGameSpec(report.spec);
    const adapted = adaptShooterGameSpecToBatch3({
      spec,
      assets: admittedAssets(spec),
    });
    const registry = await createBatch3ProductionRegistry();
    const result = resolveGameAssemblyV14(adapted.assembly, registry, {
      assetEvidence: adapted.assetEvidence,
      scoreCapacityBasis: adapted.scoreEvidence.scoreCapacityBasis,
      scoreAwardBounds: adapted.scoreEvidence.scoreAwardBounds,
    });
    expect(result.readinessReport).toMatchObject({
      status: "ready",
      blockers: [],
    });
    expect(result.graph.hostileAttackChannels).toHaveLength(4);
  });
});
