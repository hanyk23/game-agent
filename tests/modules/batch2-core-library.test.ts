import { describe, expect, it } from "vitest";

import {
  BATCH2_APPROVED_PRODUCTION_COUNT,
  createBatch2CoreProductionRegistry,
} from "../../src/modules/batch2-core-library.js";

describe("complete Batch 2 Core production registry", () => {
  it("admits exactly all 27 frozen Batch 2 definitions beside Batch 1", async () => {
    const registry = await createBatch2CoreProductionRegistry();
    const entries = registry.list();
    const batch2 = entries.filter(
      (entry) => entry.manifest.schemaVersion === "1.3.0",
    );

    expect(BATCH2_APPROVED_PRODUCTION_COUNT).toBe(27);
    expect(batch2).toHaveLength(BATCH2_APPROVED_PRODUCTION_COUNT);
    expect(entries).toHaveLength(38);
    expect(
      new Set(
        batch2.map(
          (entry) => `${entry.manifest.moduleId}@${entry.manifest.version}`,
        ),
      ).size,
    ).toBe(BATCH2_APPROVED_PRODUCTION_COUNT);
    for (const entry of batch2) {
      expect(entry.registrationKind).toBe("production");
      expect(entry.executableHandle).toBeDefined();
      expect(entry.artifactIdentity?.envelopeSha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});
