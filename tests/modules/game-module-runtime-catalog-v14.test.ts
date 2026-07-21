import { describe, expect, it } from "vitest";

import type { ResolvedModuleGraphV14 } from "../../src/modules/game-module-resolver-v14.js";
import {
  BrowserGameModuleRuntimeCatalogV14,
  type BrowserRuntimeCatalogEntryV14,
} from "../../src/modules/game-module-runtime-catalog.js";

const hash = (character: string): string => character.repeat(64);
const versions = ["1.2.0", "1.3.0", "1.4.0"] as const;

function entry(
  index: number,
  version: (typeof versions)[number],
): BrowserRuntimeCatalogEntryV14 {
  return {
    moduleId: `test.mixed-${index}`,
    version: "1.0.0",
    envelopeSha256: hash(String(index + 1)),
    implementationId: `test.mixed-${index}.v1`,
    manifestSchemaVersion: version,
    factoryContextVersion: version,
    exportKind: "lifecycle-create-v1",
    entryEvidenceId: hash(String(index + 4)),
    executable: () => ({ index }),
  };
}

function graph(entries: readonly BrowserRuntimeCatalogEntryV14[]) {
  return {
    graphVersion: "1.4.0",
    executionReadiness: { status: "ready", evidenceId: hash("a") },
    catalogEvidenceId: hash("b"),
    modules: entries.map((item, index) => ({
      instanceId: `instance-${index}`,
      moduleId: item.moduleId,
      version: item.version,
      implementationId: item.implementationId,
      manifestSchemaVersion: item.manifestSchemaVersion,
      factoryContextVersion: item.factoryContextVersion,
      artifactIdentity: { envelopeSha256: item.envelopeSha256 },
      catalogEntryEvidenceId: item.entryEvidenceId,
    })),
  } as unknown as ResolvedModuleGraphV14;
}

describe("Graph 1.4 browser runtime catalog", () => {
  it("selects exact mixed Manifest/context 1.2, 1.3, and 1.4 entries", () => {
    const entries = versions.map((version, index) => entry(index, version));
    const resolved = graph(entries);
    const catalog = new BrowserGameModuleRuntimeCatalogV14({
      catalogEvidenceId: resolved.catalogEvidenceId!,
      entries,
    });
    expect(
      resolved.modules.map((module) =>
        catalog.findForGraph(resolved, module.instanceId),
      ),
    ).toEqual(entries);
  });

  it("rejects manifest/context upcasts at construction", () => {
    const invalid = {
      ...entry(0, "1.2.0"),
      factoryContextVersion: "1.4.0" as const,
    };
    expect(
      () =>
        new BrowserGameModuleRuntimeCatalogV14({
          catalogEvidenceId: hash("b"),
          entries: [invalid],
        }),
    ).toThrow(/invalid Graph 1.4 catalog entry/);
  });

  it("rejects blocked graphs and every version/evidence identity drift", () => {
    const entries = versions.map((version, index) => entry(index, version));
    const resolved = graph(entries);
    const catalog = new BrowserGameModuleRuntimeCatalogV14({
      catalogEvidenceId: resolved.catalogEvidenceId!,
      entries,
    });
    expect(() =>
      catalog.findForGraph(
        {
          ...resolved,
          executionReadiness: { status: "blocked", evidenceId: hash("a") },
        } as ResolvedModuleGraphV14,
        "instance-0",
      ),
    ).toThrow(/readiness\/catalog evidence mismatch/);
    expect(() =>
      catalog.findForGraph(
        {
          ...resolved,
          modules: resolved.modules.map((module, index) =>
            index === 0
              ? { ...module, factoryContextVersion: "1.4.0" as const }
              : module,
          ),
        } as ResolvedModuleGraphV14,
        "instance-0",
      ),
    ).toThrow(/catalog drift/);
    expect(() =>
      catalog.findForGraph(
        { ...resolved, catalogEvidenceId: hash("c") } as ResolvedModuleGraphV14,
        "instance-0",
      ),
    ).toThrow(/readiness\/catalog evidence mismatch/);
    expect(() =>
      catalog.findForGraph(
        {
          ...resolved,
          modules: resolved.modules.map((module, index) =>
            index === 0
              ? { ...module, catalogEntryEvidenceId: hash("c") }
              : module,
          ),
        } as ResolvedModuleGraphV14,
        "instance-0",
      ),
    ).toThrow(/catalog drift/);
  });
});
