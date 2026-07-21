import { z } from "zod";

import { describe, expect, it } from "vitest";

import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { GameModuleManifestV13Schema } from "../../src/modules/game-module-contract.js";
import { createModuleArtifactHashDescriptor } from "../../src/modules/game-module-execution-contract.js";
import { TrustedGameModuleExecutableLoader } from "../../src/modules/game-module-executable-loader.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";

function manifest() {
  return GameModuleManifestV13Schema.parse({
    ...structuredClone(BATCH1_MODULE_DEFINITIONS[0]!.manifest),
    schemaVersion: "1.3.0",
    moduleId: "test.conditional-probe",
    implementationId: "test.conditional-probe.v1",
    configurationSchemaId: "test.conditional-probe.config",
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    assetRequirements: [],
    conflicts: [],
    exclusiveOwnership: [],
    resources: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 1,
    },
    runtimeLeases: { startLeases: 1, instanceLeases: 0, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: null,
    preparedEffectCommit: null,
    modifierTargets: [],
    pickupEffectPlanTransform: null,
  });
}

const configurationDescriptor = {
  descriptorVersion: "1.0.0",
  schemaId: "test.conditional-probe.config",
  dialect: "json-schema-2020-12-subset",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["mode"],
    properties: { mode: { type: "string", enum: ["press", "hold-repeat"] } },
  },
} as const;

const reservationDescriptor = {
  descriptorVersion: "1.1.0",
  reservationId: "test.conditional-probe.resources",
  strategy: "conditional-enum-v1",
  configurationField: "mode",
  cases: [
    {
      value: "press",
      resources: {
        activeEntities: 0,
        activeProjectiles: 0,
        spawnsPerSecond: 0,
        timers: 0,
      },
    },
    {
      value: "hold-repeat",
      resources: {
        activeEntities: 0,
        activeProjectiles: 0,
        spawnsPerSecond: 0,
        timers: 1,
      },
    },
  ],
} as const;

describe("Manifest 1.3 production registration", () => {
  it("admits an exact conditional evaluator and rejects formula drift", async () => {
    const reviewedManifest = manifest();
    const implementationBundle = new TextEncoder().encode(
      "export function create(){return Object.freeze({});}",
    );
    const dependencyLockIdentity = new TextEncoder().encode("lock-v1");
    const toolchainIdentity = new TextEncoder().encode("toolchain-v1");
    const artifact = createModuleArtifactHashDescriptor({
      manifest: reviewedManifest,
      configurationDescriptor,
      reservationDescriptor,
      implementationBundle,
      dependencyLockIdentity,
      toolchainIdentity,
    });
    const handle = await new TrustedGameModuleExecutableLoader().admit({
      generatedOutput: implementationBundle,
      expectedOutputSha256: artifact.implementationBundleSha256,
      implementationId: reviewedManifest.implementationId,
      exportName: "create",
      exportKind: "lifecycle-create-v1",
      sourceBundleSha256: artifact.implementationBundleSha256,
      manifestSha256: artifact.manifestSha256,
      dependencyLockSha256: artifact.dependencyLockSha256,
      toolchainIdentitySha256: artifact.toolchainIdentitySha256,
    });
    const registry = new GameModuleRegistry();
    registry.registerProductionV13({
      manifest: reviewedManifest,
      configurationDescriptor,
      configurationSchema: z.strictObject({
        mode: z.enum(["press", "hold-repeat"]),
      }),
      reservationDescriptor,
      reservationEvaluator: (configuration) => ({
        activeEntities: 0,
        activeProjectiles: 0,
        spawnsPerSecond: 0,
        timers:
          (configuration as { mode: string }).mode === "hold-repeat" ? 1 : 0,
      }),
      implementationBundle,
      dependencyLockIdentity,
      toolchainIdentity,
      expectedArtifact: artifact,
      executableHandle: handle,
    });
    const registration = registry.find(reviewedManifest.moduleId, "1.0.0")[0]!;
    expect(
      registration.evaluateResourceReservation({ mode: "hold-repeat" }),
    ).toMatchObject({ timers: 1 });
    expect(() =>
      registration.evaluateResourceReservation({ mode: "press" }),
    ).not.toThrow();

    const drift = new GameModuleRegistry();
    drift.registerProductionV13({
      manifest: reviewedManifest,
      configurationDescriptor,
      configurationSchema: z.strictObject({
        mode: z.enum(["press", "hold-repeat"]),
      }),
      reservationDescriptor,
      reservationEvaluator: () => ({
        activeEntities: 0,
        activeProjectiles: 0,
        spawnsPerSecond: 0,
        timers: 1,
      }),
      implementationBundle,
      dependencyLockIdentity,
      toolchainIdentity,
      expectedArtifact: artifact,
      executableHandle: handle,
    });
    expect(() =>
      drift
        .find(reviewedManifest.moduleId, "1.0.0")[0]!
        .evaluateResourceReservation({ mode: "press" }),
    ).toThrow(/drift/);
  });

  it("rejects conditional cases that are not the exact configuration enum", () => {
    expect(() =>
      new GameModuleRegistry().registerProductionV13({
        manifest: manifest(),
        configurationDescriptor,
        configurationSchema: z.strictObject({
          mode: z.enum(["press", "hold-repeat"]),
        }),
        reservationDescriptor: {
          ...reservationDescriptor,
          cases: [reservationDescriptor.cases[0]],
        },
        reservationEvaluator: () => ({
          ...reservationDescriptor.cases[0].resources,
        }),
        implementationBundle: new Uint8Array([1]),
        dependencyLockIdentity: new Uint8Array([1]),
        toolchainIdentity: new Uint8Array([1]),
        expectedArtifact: {},
        executableHandle: {} as never,
      }),
    ).toThrow(/exactly match/);
  });

  it("admits only a loader-minted pickup transform with the exact restricted kind", async () => {
    const reviewedManifest = GameModuleManifestV13Schema.parse({
      ...manifest(),
      moduleId: "progression.pickup-plan-test",
      implementationId: "progression.pickup-plan-test.v1",
      configurationSchemaId: "progression.pickup-plan-test.config",
      resources: {
        activeEntities: 0,
        activeProjectiles: 0,
        spawnsPerSecond: 0,
        timers: 0,
      },
      runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
      pickupEffectPlanTransform: {
        profileId: "pickup.default",
        exportKind: "pickup-effect-plan-transform-v1",
        maximumApplicationsPerPlan: 2,
      },
    });
    const emptyConfigurationDescriptor = {
      descriptorVersion: "1.0.0",
      schemaId: reviewedManifest.configurationSchemaId,
      dialect: "json-schema-2020-12-subset",
      schema: { type: "object", additionalProperties: false },
    } as const;
    const zeroReservationDescriptor = {
      descriptorVersion: "1.0.0",
      reservationId: "progression.pickup-plan-test.resources",
      strategy: "constant",
      fields: [],
    } as const;
    const implementationBundle = new TextEncoder().encode(
      "export function transform(){return Object.freeze([]);}",
    );
    const dependencyLockIdentity = new TextEncoder().encode("lock-v1");
    const toolchainIdentity = new TextEncoder().encode("toolchain-v1");
    const artifact = createModuleArtifactHashDescriptor({
      manifest: reviewedManifest,
      configurationDescriptor: emptyConfigurationDescriptor,
      reservationDescriptor: zeroReservationDescriptor,
      implementationBundle,
      dependencyLockIdentity,
      toolchainIdentity,
    });
    const loader = new TrustedGameModuleExecutableLoader();
    const admit = (
      exportKind: "pickup-effect-plan-transform-v1" | "lifecycle-create-v1",
    ) =>
      loader.admit({
        generatedOutput: implementationBundle,
        expectedOutputSha256: artifact.implementationBundleSha256,
        implementationId: reviewedManifest.implementationId,
        exportName: "transform",
        exportKind,
        sourceBundleSha256: artifact.implementationBundleSha256,
        manifestSha256: artifact.manifestSha256,
        dependencyLockSha256: artifact.dependencyLockSha256,
        toolchainIdentitySha256: artifact.toolchainIdentitySha256,
      });
    const exactHandle = await admit("pickup-effect-plan-transform-v1");
    const registrationInput = {
      manifest: reviewedManifest,
      configurationDescriptor: emptyConfigurationDescriptor,
      configurationSchema: z.strictObject({}),
      reservationDescriptor: zeroReservationDescriptor,
      reservationEvaluator: () => ({
        activeEntities: 0,
        activeProjectiles: 0,
        spawnsPerSecond: 0,
        timers: 0,
      }),
      implementationBundle,
      dependencyLockIdentity,
      toolchainIdentity,
      expectedArtifact: artifact,
    } as const;
    const registry = new GameModuleRegistry();
    registry.registerProductionV13({
      ...registrationInput,
      executableHandle: exactHandle,
    });
    const admitted = registry.find(reviewedManifest.moduleId, "1.0.0")[0]!;
    expect(admitted.executableHandle?.exportKind).toBe(
      "pickup-effect-plan-transform-v1",
    );
    expect(admitted.executableHandle?.loadedExport()).toEqual([]);

    const wrongKindHandle = await admit("lifecycle-create-v1");
    expect(() =>
      new GameModuleRegistry().registerProductionV13({
        ...registrationInput,
        executableHandle: wrongKindHandle,
      }),
    ).toThrow(/executable handle identity mismatch/);
  });
});
