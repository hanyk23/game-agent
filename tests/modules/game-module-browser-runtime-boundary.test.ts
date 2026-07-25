import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  RuntimePayloadSchemas as compatibilityPayloadSchemas,
  ContactDecisionPayloadSchema as compatibilityDecisionSchema,
} from "../../src/modules/game-module-execution-contract.js";
import {
  DeterministicLogicalEntityDirectory,
  LogicalEntityDirectoryError,
  LogicalEntityDirectoryErrorCode,
} from "../../src/modules/game-module-entity-directory.js";
import { DeterministicGameModuleProductionInstantiator } from "../../src/modules/game-module-production-instantiator.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import { resolveGameAssembly } from "../../src/modules/game-module-resolver.js";
import type { ProductionModuleExecutionRegistry } from "../../src/modules/game-module-runtime-factory.js";
import {
  ContactDecisionPayloadSchema,
  RuntimePayloadSchemas,
} from "../../src/modules/game-module-runtime-payloads.js";
import {
  createUnavailableRuntimeServiceHost,
  type GameModuleRuntimeServiceHost,
  type GameModuleRuntimeServiceScopeAuthority,
} from "../../src/modules/game-module-runtime-services.js";
import {
  assembly11,
  manifest11,
  registerExecutable,
} from "./game-module-execution-test-helpers.js";

function runtimeRelativeSpecifiers(source: string): readonly string[] {
  const specifiers: string[] = [];
  const imports =
    /\bimport\s+(?!type\b)(?:(?:[\s\S]*?)\s+from\s+)?["']([^"']+)["']\s*;|\bexport\s+\*\s+from\s+["']([^"']+)["']\s*;/g;
  for (const match of source.matchAll(imports)) {
    const specifier = match[1] ?? match[2];
    if (specifier?.startsWith(".")) specifiers.push(specifier);
  }
  return specifiers;
}

function browserRuntimeClosure(entry: string): readonly string[] {
  const visited = new Set<string>();
  const visit = (file: string): void => {
    const normalized = path.normalize(file);
    if (visited.has(normalized)) return;
    visited.add(normalized);
    const source = readFileSync(normalized, "utf8");
    expect(source, normalized).not.toMatch(/\b(?:import|export).*?["']node:/s);
    for (const specifier of runtimeRelativeSpecifiers(source)) {
      const target = path.resolve(
        path.dirname(normalized),
        specifier.replace(/\.js$/, ".ts"),
      );
      visit(target);
    }
  };
  visit(entry);
  return Object.freeze([...visited].sort());
}

describe("browser-safe production execution boundary", () => {
  it("keeps payload compatibility exports identical while routing through the browser-safe module", () => {
    expect(compatibilityPayloadSchemas).toBe(RuntimePayloadSchemas);
    expect(compatibilityDecisionSchema).toBe(ContactDecisionPayloadSchema);
    expect(
      RuntimePayloadSchemas["target-selection-v1"].safeParse({
        revision: 0,
        emittedAtMs: 0,
        kind: "direction",
        direction: { x: 0, y: -1 },
      }).success,
    ).toBe(true);
  });

  it("has no Node builtin import in the production instantiator runtime dependency closure", () => {
    const entry = path.resolve(
      process.cwd(),
      "src/modules/game-module-production-instantiator.ts",
    );
    const closure = browserRuntimeClosure(entry).map((file) =>
      path.basename(file),
    );

    expect(closure).toContain("game-module-runtime-payloads.ts");
    expect(closure).toContain("game-module-port-router.ts");
    expect(closure).toContain("game-module-runtime-abi-v12.ts");
    expect(closure).toContain("game-module-runtime-catalog.ts");
    expect(closure).not.toContain("game-module-runtime-catalog-generator.ts");
    expect(closure).not.toContain("game-module-execution-contract.ts");
    expect(closure).not.toContain("game-module-registry.ts");
  });

  it("accepts GameModuleRegistry structurally through the minimal read-only execution interface", () => {
    const registry: ProductionModuleExecutionRegistry =
      new GameModuleRegistry();
    expect(typeof registry.findExactProduction).toBe("function");
  });

  it("binds service-host lease authority to the ledger and revokes it at the instance boundary", () => {
    const registry = new GameModuleRegistry();
    const manifest = manifest11("test.browser-boundary", {
      runtimeLeases: { startLeases: 0, instanceLeases: 1, graphLeases: 0 },
    });
    registerExecutable(registry, manifest, {
      runtimeLeaseKeys: { start: [], instance: ["state"], graph: [] },
      create: () => ({}),
    });
    const graph = resolveGameAssembly(
      assembly11([
        { instanceId: "boundary", moduleId: "test.browser-boundary" },
      ]),
      registry,
    );
    const unavailable = createUnavailableRuntimeServiceHost();
    let authority: GameModuleRuntimeServiceScopeAuthority | undefined;
    let instanceLease: ReturnType<
      GameModuleRuntimeServiceScopeAuthority["acquireLease"]
    >;
    const host: GameModuleRuntimeServiceHost = {
      createScope: (evidence, scopedAuthority) => {
        expect(evidence.runtimeLeaseKeys).toEqual({
          start: [],
          instance: ["state"],
          graph: [],
        });
        expect(scopedAuthority).toBeDefined();
        authority = scopedAuthority;
        instanceLease = scopedAuthority!.acquireLease("instance", "state");
        return unavailable.createScope(evidence, scopedAuthority);
      },
      revoke: (_instanceId, scope) => {
        if (scope === "instance") authority!.releaseLease(instanceLease);
      },
      destroy: () => undefined,
    };
    const instance = DeterministicGameModuleProductionInstantiator.create({
      graph,
      registry,
      serviceHost: host,
    });
    expect(instance.snapshot().leaseCounts.instance).toBe(1);
    instance.dispose();
    expect(instance.snapshot().leaseCounts.instance).toBe(0);
    instance.destroy();
  });

  it("allows only a channel owner to recycle one logical entity generation", () => {
    const directory = new DeterministicLogicalEntityDirectory(
      [
        {
          channelId: "projectiles",
          ownerInstanceId: "provider",
          ownerActorId: "player-one",
          entityRole: "friendly-projectile",
          capacity: 1,
          readerInstanceIds: ["consumer"],
        },
      ],
      [],
    );
    const reference = directory.activate(
      "provider",
      "projectiles",
      "projectile-one",
      0,
    );
    expect(() => directory.recycle("consumer", reference)).toThrowError(
      expect.objectContaining({
        code: LogicalEntityDirectoryErrorCode.unauthorized,
      }),
    );
    expect(directory.recycle("provider", reference)).toEqual(reference);
    expect(
      directory.isGenerationActive("projectiles", "projectile-one", 0),
    ).toBe(false);
    expect(() => directory.recycle("provider", reference)).toThrow(
      LogicalEntityDirectoryError,
    );
    directory.destroy();
  });
});
