import { z } from "zod";

import type { ModuleResourceBudget } from "../../src/modules/game-module-contract.js";
import { createModuleArtifactHashDescriptor } from "../../src/modules/game-module-execution-contract.js";
import {
  GameModuleRegistry,
  type ProductionGameModuleRegistrationInput,
} from "../../src/modules/game-module-registry.js";
import type {
  ContactPolicyTransform,
  GameModuleFactory,
  GameModuleRuntimeLeaseKeys,
} from "../../src/modules/game-module-runtime-factory.js";

export const zeroBudget: ModuleResourceBudget = Object.freeze({
  activeEntities: 0,
  activeProjectiles: 0,
  spawnsPerSecond: 0,
  timers: 0,
});

export function manifest11(
  moduleId: string,
  overrides: Record<string, unknown> = {},
): unknown {
  return {
    schemaVersion: "1.1.0",
    moduleId,
    version: "1.0.0",
    kind: "combat-interaction",
    implementationId: `${moduleId}.v1`,
    configurationSchemaId: `${moduleId}.config`,
    kernelVersionRange: "^1.0.0",
    engine: { id: "phaser", versionRange: "^3.90.0" },
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    conflicts: [],
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 16,
      maximumInstancesPerOwner: 16,
    },
    resources: zeroBudget,
    runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    browserSupport: { desktop: true, touch: true },
    evidence: {
      provenanceId: "tests.execution-host",
      testSuiteId: "modules.execution-host",
    },
    ...overrides,
  };
}

export function registerExecutable(
  registry: GameModuleRegistry,
  manifest: unknown,
  exports: Readonly<{
    runtimeLeaseKeys?: GameModuleRuntimeLeaseKeys;
    create?: GameModuleFactory;
    contactPolicyTransform?: ContactPolicyTransform;
  }>,
): void {
  const typed = manifest as {
    moduleId: string;
    implementationId: string;
    configurationSchemaId: string;
    resources: ModuleResourceBudget;
  };
  const configurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId: typed.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: { type: "object", additionalProperties: false },
  } as const;
  const reservationDescriptor = {
    descriptorVersion: "1.0.0",
    reservationId: `${typed.moduleId}.reservation`,
    strategy: "constant",
    fields: [
      { resource: "activeEntities", constant: typed.resources.activeEntities },
      {
        resource: "activeProjectiles",
        constant: typed.resources.activeProjectiles,
      },
      {
        resource: "spawnsPerSecond",
        constant: typed.resources.spawnsPerSecond,
      },
      { resource: "timers", constant: typed.resources.timers },
    ],
  } as const;
  const implementationBundle = Buffer.from(`${typed.moduleId}-bundle-v1`);
  const dependencyLockIdentity = Buffer.from("pnpm-lock-reviewed-v1");
  const toolchainIdentity = Buffer.from("node22-typescript5-v1");
  const expectedArtifact = createModuleArtifactHashDescriptor({
    manifest,
    configurationDescriptor,
    reservationDescriptor,
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
  });
  const input: ProductionGameModuleRegistrationInput = {
    manifest,
    configurationDescriptor,
    configurationSchema: z.strictObject({}),
    reservationDescriptor,
    reservationEvaluator: () => ({ ...typed.resources }),
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
    expectedArtifact,
    executionExports: {
      implementationId: typed.implementationId,
      artifactEnvelopeSha256: expectedArtifact.envelopeSha256,
      runtimeLeaseKeys: exports.runtimeLeaseKeys ?? {
        start: [],
        instance: [],
        graph: [],
      },
      ...(exports.create === undefined ? {} : { create: exports.create }),
      ...(exports.contactPolicyTransform === undefined
        ? {}
        : { contactPolicyTransform: exports.contactPolicyTransform }),
    },
  };
  registry.registerProduction(input);
}

export function assembly11(
  modules: readonly Readonly<{
    instanceId: string;
    moduleId: string;
    ownerId?: string;
  }>[],
  bindings: readonly unknown[] = [],
  overrides: Record<string, unknown> = {},
): unknown {
  return {
    schemaVersion: "1.0.0",
    assemblyId: "test.execution-host",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.90.0" },
    actors: [
      { actorId: "player-one", role: "player" },
      { actorId: "enemy-one", role: "enemy" },
    ],
    modules: modules.map((module) => ({
      instanceId: module.instanceId,
      moduleId: module.moduleId,
      versionRange: "1.0.0",
      ownerId: module.ownerId ?? "player-one",
      configuration: {},
    })),
    bindings,
    contactPolicySelections: [],
    damageSinkRoutes: [],
    assetRoles: [],
    globalBudget: {
      activeEntities: 100,
      activeProjectiles: 100,
      spawnsPerSecond: 100,
      timers: 100,
    },
    ...overrides,
  };
}
