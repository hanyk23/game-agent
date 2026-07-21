import { describe, expect, it } from "vitest";

import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { BATCH1_VERTICAL_SLICE_ASSEMBLY } from "../../src/modules/batch1-vertical-slice.js";
import {
  GameAssemblySpecV12Schema,
  GameModuleManifestV13Schema,
} from "../../src/modules/game-module-contract.js";
import { ConditionalEnumReservationDescriptorV11Schema } from "../../src/modules/game-module-execution-contract.js";
import { MaximumReachableReservationDescriptorV11Schema } from "../../src/modules/game-module-execution-contract.js";
import { evaluateCanonicalResourceReservationV11 } from "../../src/modules/game-module-registry.js";

function v13Manifest(overrides: Record<string, unknown> = {}) {
  return {
    ...structuredClone(BATCH1_MODULE_DEFINITIONS[0]!.manifest),
    schemaVersion: "1.3.0",
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: null,
    preparedEffectCommit: null,
    modifierTargets: [],
    pickupEffectPlanTransform: null,
    ...overrides,
  };
}

describe("ADR 0027 strict contracts", () => {
  it("accepts canonical Manifest 1.3 and Assembly 1.2 without widening older inputs", () => {
    const manifest = v13Manifest();
    expect(GameModuleManifestV13Schema.parse(manifest)).toEqual(manifest);

    const assembly = {
      ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY),
      schemaVersion: "1.2.0",
      effectApplicationBindings: [],
      pickupEffectPlanSelections: [],
    };
    expect(GameAssemblySpecV12Schema.parse(assembly)).toEqual(assembly);
    expect(() =>
      GameAssemblySpecV12Schema.parse({ ...assembly, command: "unsafe" }),
    ).toThrow();
  });

  it("rejects unknown Manifest 1.3 authority and wrong attack role ports", () => {
    expect(() =>
      GameModuleManifestV13Schema.parse({
        ...v13Manifest(),
        actorDirectory: "raw",
      }),
    ).toThrow();
    expect(() =>
      GameModuleManifestV13Schema.parse(
        v13Manifest({
          attackChannel: {
            role: "trigger",
            configurationField: "attackChannelId",
            requestOutputPort: "missing",
            requestPayloadType: "attack-request-v2",
          },
        }),
      ),
    ).toThrow(/attack channel descriptor/);
  });

  it("requires snapshot identity fields and a matching distance origin", () => {
    expect(() =>
      GameModuleManifestV13Schema.parse(
        v13Manifest({
          actorSnapshotReads: [
            {
              readId: "nearest.read",
              ownerRelation: "different-owner",
              sourceActorRoles: ["player"],
              targetActorRoles: ["enemy"],
              maximumEntries: 8,
              entryFields: ["actorId", "active", "position"],
              envelopeFields: [
                "directoryRevision",
                "sampledAtMs",
                "sampledFrameSequence",
                "entryCount",
              ],
              order: "distance-then-actor-id-generation",
              distanceOrigin: null,
            },
          ],
        }),
      ),
    ).toThrow(/snapshot identity fields/);
  });

  it("admits prepared pickup mutation only through one consume-only V1.3 access", () => {
    const prepared = v13Manifest({
      moduleId: "progression.pickup-collect-test",
      kind: "progression-loadout",
      implementationId: "progression.pickup-collect-test.v1",
      configurationSchemaId: "progression.pickup-collect-test.config",
      inputPorts: [
        {
          id: "sources",
          payloadType: "entity-channel-v1",
          required: true,
          multiple: false,
          delivery: "state",
          authorization: {
            ownerRelation: "different-owner",
            sourceActorRoles: ["world"],
            targetActorRoles: ["player"],
            sourceEntityRoles: ["pickup"],
          },
        },
      ],
      outputPorts: [
        {
          id: "collected",
          payloadType: "pickup-collected-v1",
          delivery: "event",
        },
      ],
      runtimeContract: {
        update: null,
        timerSlots: { slotGroupId: "main" },
        inputRegistrations: [],
        observationReaders: [],
        contactCommit: null,
      },
      runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 0 },
      entityMutationAccess: [
        {
          accessId: "pickup.consume",
          inputPort: "sources",
          operations: ["consume"],
          transferRecipientActorRoles: [],
        },
      ],
      preparedEffectCommit: {
        commitServiceId: "pickup.commit",
        mutationChannelStateInputPort: "sources",
        admittedSourceOperation: "consume",
        effectPlanProfileId: "pickup.default",
        collectedOutputPort: "collected",
        applicationRouteSourceId: "applications",
        maximumApplicationsPerCommit: 2,
        maximumConcurrentCommits: 4,
        duplicateLedgerCapacity: 16,
      },
    });
    expect(GameModuleManifestV13Schema.parse(prepared)).toEqual(prepared);
    expect(() =>
      GameModuleManifestV13Schema.parse({
        ...prepared,
        entityMutationAccess: [],
      }),
    ).toThrow(/prepared effect output/);
  });

  it("validates conditional exact reservation cases and rejects duplicates", () => {
    const descriptor = {
      descriptorVersion: "1.1.0",
      reservationId: "trigger.active.resources",
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
    };
    expect(
      ConditionalEnumReservationDescriptorV11Schema.parse(descriptor),
    ).toEqual(descriptor);
    expect(() =>
      ConditionalEnumReservationDescriptorV11Schema.parse({
        ...descriptor,
        cases: [descriptor.cases[0], descriptor.cases[0]],
      }),
    ).toThrow(/unique/);
  });

  it("evaluates maximum reachable projectile counts and rejects unsafe products", () => {
    const descriptor = MaximumReachableReservationDescriptorV11Schema.parse({
      descriptorVersion: "1.1.0",
      reservationId: "delivery.pattern.resources",
      strategy: "maximum-reachable-v1",
      fields: [
        {
          resource: "activeEntities",
          formula: { kind: "configuration-field", field: "maxActive" },
        },
        {
          resource: "activeProjectiles",
          formula: { kind: "configuration-field", field: "maxActive" },
        },
        {
          resource: "spawnsPerSecond",
          formula: {
            kind: "product-field-and-sum",
            factorField: "maximumAcceptedRequestsPerSecond",
            sumFields: ["baseCount", "maximumCountBonus"],
          },
        },
        {
          resource: "timers",
          formula: { kind: "constant", value: 0 },
        },
      ],
    });
    expect(
      evaluateCanonicalResourceReservationV11(descriptor, {
        maxActive: 64,
        maximumAcceptedRequestsPerSecond: 10,
        baseCount: 4,
        maximumCountBonus: 2,
      }),
    ).toEqual({
      activeEntities: 64,
      activeProjectiles: 64,
      spawnsPerSecond: 60,
      timers: 0,
    });
    expect(() =>
      evaluateCanonicalResourceReservationV11(descriptor, {
        maxActive: 64,
        maximumAcceptedRequestsPerSecond: Number.MAX_SAFE_INTEGER,
        baseCount: 2,
        maximumCountBonus: 0,
      }),
    ).toThrow(/safe integer/);
  });
});
