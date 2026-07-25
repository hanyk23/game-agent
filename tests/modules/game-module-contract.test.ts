import { z } from "zod";

import { describe, expect, it } from "vitest";

import {
  ContractFixtureAssemblies,
  ContractFixtureManifests,
  createContractFixtureRegistry,
} from "../../src/modules/game-module-contract-fixtures.js";
import {
  GameAssemblySpecSchema,
  GameModuleManifestSchema,
  versionSatisfiesRange,
} from "../../src/modules/game-module-contract.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import {
  ModuleResolutionError,
  ModuleResolutionErrorCode,
  resolveGameAssembly,
} from "../../src/modules/game-module-resolver.js";

const emptyConfiguration = z.strictObject({});
const standardBudget = {
  activeEntities: 100,
  activeProjectiles: 500,
  spawnsPerSecond: 200,
  timers: 100,
};

function resolutionCode(
  assembly: unknown,
  registry: GameModuleRegistry,
): string {
  try {
    resolveGameAssembly(assembly, registry);
    throw new Error("expected resolution to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(ModuleResolutionError);
    return (error as ModuleResolutionError).code;
  }
}

function testManifest(
  moduleId: string,
  overrides: Record<string, unknown> = {},
): unknown {
  const source = ContractFixtureManifests[0]!;
  return {
    ...source,
    moduleId,
    implementationId: `${moduleId}.v1`,
    configurationSchemaId: `${moduleId}.config`,
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    conflicts: [],
    exclusiveOwnership: [],
    resources: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
    ...overrides,
  };
}

function testAssembly(
  modules: readonly Readonly<{
    instanceId: string;
    moduleId: string;
    versionRange?: string;
  }>[],
  bindings: readonly unknown[] = [],
): unknown {
  return {
    schemaVersion: "1.0.0",
    assemblyId: "test.assembly",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [{ actorId: "player-one", role: "player" }],
    modules: modules.map((entry) => ({
      instanceId: entry.instanceId,
      moduleId: entry.moduleId,
      versionRange: entry.versionRange ?? "1.0.0",
      ownerId: "player-one",
      configuration: {},
    })),
    bindings,
    assetRoles: [],
    globalBudget: standardBudget,
  };
}

describe("single-player module contracts", () => {
  it("accepts the five representative data-only assemblies", () => {
    expect(Object.keys(ContractFixtureAssemblies)).toEqual([
      "legacyForward",
      "directionalActive",
      "automaticTarget",
      "polarityAbsorption",
      "slottedEquipment",
    ]);
    for (const assembly of Object.values(ContractFixtureAssemblies)) {
      expect(GameAssemblySpecSchema.parse(assembly)).toEqual(assembly);
    }
  });

  it("resolves every fixture deterministically to exact local versions", () => {
    const registry = createContractFixtureRegistry();
    for (const assembly of Object.values(ContractFixtureAssemblies)) {
      const first = resolveGameAssembly(assembly, registry);
      const second = resolveGameAssembly(structuredClone(assembly), registry);
      expect(second).toEqual(first);
      expect(first.modules.every((entry) => entry.version === "1.0.0")).toBe(
        true,
      );
    }
  });

  it("supports only bounded exact, caret, and tilde selectors", () => {
    expect(versionSatisfiesRange("1.4.2", "^1.2.0")).toBe(true);
    expect(versionSatisfiesRange("2.0.0", "^1.2.0")).toBe(false);
    expect(versionSatisfiesRange("1.2.9", "~1.2.0")).toBe(true);
    expect(versionSatisfiesRange("1.3.0", "~1.2.0")).toBe(false);
    expect(versionSatisfiesRange("0.0.2", "^0.0.1")).toBe(false);
    expect(() => versionSatisfiesRange("1.0.0", ">=1.0.0")).toThrow();
  });

  it("rejects executable implementation paths and unknown manifest fields", () => {
    const source = ContractFixtureManifests[0]!;
    expect(() =>
      GameModuleManifestSchema.parse({
        ...source,
        implementationId: "../../unsafe.ts",
      }),
    ).toThrow();
    expect(() =>
      GameModuleManifestSchema.parse({
        ...source,
        sourceCode: "execute arbitrary code",
      }),
    ).toThrow();
  });

  it("rejects multiplayer topology and unknown networking fields", () => {
    const source = structuredClone(ContractFixtureAssemblies.legacyForward);
    source.actors.push({ actorId: "player-two", role: "player" });
    expect(() => GameAssemblySpecSchema.parse(source)).toThrow(
      /exactly one player actor/,
    );
    expect(() =>
      GameAssemblySpecSchema.parse({
        ...ContractFixtureAssemblies.legacyForward,
        networkMode: "peer-to-peer",
      }),
    ).toThrow();
  });

  it("rejects missing modules, ambiguous versions, and bad configuration", () => {
    const missing = structuredClone(ContractFixtureAssemblies.legacyForward);
    missing.modules[0]!.moduleId = "missing.targeting";
    expect(resolutionCode(missing, createContractFixtureRegistry())).toBe(
      ModuleResolutionErrorCode.missingModule,
    );

    const ambiguousRegistry = createContractFixtureRegistry();
    const fixed = ContractFixtureManifests.find(
      (entry) => entry.moduleId === "targeting.fixed-forward",
    )!;
    ambiguousRegistry.register(
      { ...fixed, version: "1.1.0" },
      z.strictObject({ angleDegrees: z.literal(-90) }),
    );
    expect(
      resolutionCode(
        ContractFixtureAssemblies.legacyForward,
        ambiguousRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.ambiguousVersion);

    const unsafeConfiguration = structuredClone(
      ContractFixtureAssemblies.legacyForward,
    );
    unsafeConfiguration.modules[1]!.configuration = {
      intervalMs: 240,
      command: "run-this",
    };
    expect(
      resolutionCode(unsafeConfiguration, createContractFixtureRegistry()),
    ).toBe(ModuleResolutionErrorCode.invalidConfiguration);
  });

  it("rejects missing and cyclic dependencies", () => {
    const missingRegistry = new GameModuleRegistry();
    missingRegistry.register(
      testManifest("test.dependent", {
        dependencies: [
          {
            moduleId: "test.provider",
            versionRange: "1.0.0",
            optional: false,
          },
        ],
      }),
      emptyConfiguration,
    );
    expect(
      resolutionCode(
        testAssembly([{ instanceId: "dependent", moduleId: "test.dependent" }]),
        missingRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.missingDependency);

    const cycleRegistry = new GameModuleRegistry();
    cycleRegistry.register(
      testManifest("test.cycle-a", {
        dependencies: [
          {
            moduleId: "test.cycle-b",
            versionRange: "1.0.0",
            optional: false,
          },
        ],
      }),
      emptyConfiguration,
    );
    cycleRegistry.register(
      testManifest("test.cycle-b", {
        dependencies: [
          {
            moduleId: "test.cycle-a",
            versionRange: "1.0.0",
            optional: false,
          },
        ],
      }),
      emptyConfiguration,
    );
    expect(
      resolutionCode(
        testAssembly([
          { instanceId: "cycle-a", moduleId: "test.cycle-a" },
          { instanceId: "cycle-b", moduleId: "test.cycle-b" },
        ]),
        cycleRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.dependencyCycle);

    const capabilityCycleRegistry = new GameModuleRegistry();
    capabilityCycleRegistry.register(
      testManifest("test.capability-cycle-a", {
        provides: [{ id: "test.capability-a", version: "1.0.0" }],
        requires: [
          {
            id: "test.capability-b",
            versionRange: "1.0.0",
            cardinality: "exactly-one",
          },
        ],
      }),
      emptyConfiguration,
    );
    capabilityCycleRegistry.register(
      testManifest("test.capability-cycle-b", {
        provides: [{ id: "test.capability-b", version: "1.0.0" }],
        requires: [
          {
            id: "test.capability-a",
            versionRange: "1.0.0",
            cardinality: "exactly-one",
          },
        ],
      }),
      emptyConfiguration,
    );
    expect(
      resolutionCode(
        testAssembly([
          {
            instanceId: "capability-cycle-a",
            moduleId: "test.capability-cycle-a",
          },
          {
            instanceId: "capability-cycle-b",
            moduleId: "test.capability-cycle-b",
          },
        ]),
        capabilityCycleRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.dependencyCycle);
  });

  it("rejects conflicts, duplicate ownership, and missing capabilities", () => {
    const conflictRegistry = new GameModuleRegistry();
    conflictRegistry.register(
      testManifest("test.conflict-a", { conflicts: ["test.conflict-b"] }),
      emptyConfiguration,
    );
    conflictRegistry.register(
      testManifest("test.conflict-b"),
      emptyConfiguration,
    );
    expect(
      resolutionCode(
        testAssembly([
          { instanceId: "conflict-a", moduleId: "test.conflict-a" },
          { instanceId: "conflict-b", moduleId: "test.conflict-b" },
        ]),
        conflictRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.moduleConflict);

    const ownershipRegistry = new GameModuleRegistry();
    ownershipRegistry.register(
      testManifest("test.owner-a", {
        exclusiveOwnership: ["player.aim"],
      }),
      emptyConfiguration,
    );
    ownershipRegistry.register(
      testManifest("test.owner-b", {
        exclusiveOwnership: ["player.aim"],
      }),
      emptyConfiguration,
    );
    expect(
      resolutionCode(
        testAssembly([
          { instanceId: "owner-a", moduleId: "test.owner-a" },
          { instanceId: "owner-b", moduleId: "test.owner-b" },
        ]),
        ownershipRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.duplicateOwnership);

    const capabilityRegistry = new GameModuleRegistry();
    capabilityRegistry.register(
      testManifest("test.consumer", {
        requires: [
          {
            id: "missing.capability",
            versionRange: "1.0.0",
            cardinality: "exactly-one",
          },
        ],
      }),
      emptyConfiguration,
    );
    expect(
      resolutionCode(
        testAssembly([{ instanceId: "consumer", moduleId: "test.consumer" }]),
        capabilityRegistry,
      ),
    ).toBe(ModuleResolutionErrorCode.missingCapability);
  });

  it("rejects undeclared, incompatible, duplicate, and missing port bindings", () => {
    const unknownPort = structuredClone(
      ContractFixtureAssemblies.legacyForward,
    );
    unknownPort.bindings[0]!.from.portId = "unknown";
    expect(resolutionCode(unknownPort, createContractFixtureRegistry())).toBe(
      ModuleResolutionErrorCode.unknownPort,
    );

    const wrongPayload = structuredClone(
      ContractFixtureAssemblies.legacyForward,
    );
    wrongPayload.bindings[0]!.from = {
      instanceId: "interval-trigger",
      portId: "request",
    };
    expect(resolutionCode(wrongPayload, createContractFixtureRegistry())).toBe(
      ModuleResolutionErrorCode.portTypeMismatch,
    );

    const duplicate = structuredClone(ContractFixtureAssemblies.legacyForward);
    duplicate.bindings.push(structuredClone(duplicate.bindings[0]!));
    expect(resolutionCode(duplicate, createContractFixtureRegistry())).toBe(
      ModuleResolutionErrorCode.duplicateBinding,
    );

    const missingRequired = structuredClone(
      ContractFixtureAssemblies.legacyForward,
    );
    missingRequired.bindings.splice(0, 1);
    expect(
      resolutionCode(missingRequired, createContractFixtureRegistry()),
    ).toBe(ModuleResolutionErrorCode.missingRequiredPort);
  });

  it("rejects aggregate resource-budget excess", () => {
    const assembly = structuredClone(ContractFixtureAssemblies.legacyForward);
    assembly.globalBudget.activeProjectiles = 199;
    expect(resolutionCode(assembly, createContractFixtureRegistry())).toBe(
      ModuleResolutionErrorCode.resourceBudgetExceeded,
    );
  });
});
