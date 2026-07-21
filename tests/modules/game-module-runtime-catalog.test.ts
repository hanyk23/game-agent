import { describe, expect, it } from "vitest";

import { BrowserGameModuleRuntimeCatalog } from "../../src/modules/game-module-runtime-catalog.js";

const hash = "a".repeat(64);

function registration(overrides: Record<string, unknown> = {}) {
  return {
    manifest: {
      schemaVersion: "1.1.0",
      moduleId: "test.runtime",
      version: "1.0.0",
      implementationId: "test.runtime.v1",
    },
    executionExports: {
      implementationId: "test.runtime.v1",
      artifactEnvelopeSha256: hash,
      runtimeLeaseKeys: { start: [], instance: [], graph: [] },
      create: () => ({}),
    },
    ...overrides,
  } as any;
}

describe("browser game-module runtime catalog", () => {
  it("returns only the exact frozen admitted identity", () => {
    const admitted = registration();
    const catalog = new BrowserGameModuleRuntimeCatalog({
      registrations: [admitted],
    });
    expect(catalog.findExactProduction("test.runtime", "1.0.0", hash)).toBe(
      admitted,
    );
    expect(
      catalog.findExactProduction("test.runtime", "1.0.0", "b".repeat(64)),
    ).toBeUndefined();
    expect(Object.isFrozen(admitted)).toBe(true);
    expect(Object.isFrozen(admitted.executionExports)).toBe(true);
  });

  it("rejects fixture, mismatched, malformed, and duplicate registrations", () => {
    expect(
      () =>
        new BrowserGameModuleRuntimeCatalog({
          registrations: [
            registration({
              manifest: {
                schemaVersion: "1.0.0",
                moduleId: "test.runtime",
                version: "1.0.0",
                implementationId: "test.runtime.v1",
              },
            }),
          ],
        }),
    ).toThrow(/invalid browser runtime registration/);
    expect(
      () =>
        new BrowserGameModuleRuntimeCatalog({
          registrations: [
            registration({
              executionExports: {
                implementationId: "wrong",
                artifactEnvelopeSha256: hash,
              },
            }),
          ],
        }),
    ).toThrow(/invalid browser runtime registration/);
    expect(
      () =>
        new BrowserGameModuleRuntimeCatalog({
          registrations: [registration(), registration()],
        }),
    ).toThrow(/duplicate browser runtime registration/);
  });
});
