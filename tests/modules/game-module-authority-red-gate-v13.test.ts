import { z } from "zod";

import { describe, expect, it } from "vitest";

import { BATCH1_MODULE_DEFINITIONS } from "../../src/modules/batch1-gameplay-library.js";
import { DeterministicActorSnapshotHostV13 } from "../../src/modules/game-module-actor-snapshot-host.js";
import { GameModuleManifestV13Schema } from "../../src/modules/game-module-contract.js";
import { DeterministicEntityChannelSnapshotHostV13 } from "../../src/modules/game-module-entity-channel-snapshot-host.js";
import { createModuleArtifactHashDescriptor } from "../../src/modules/game-module-execution-contract.js";
import { TrustedGameModuleExecutableLoader } from "../../src/modules/game-module-executable-loader.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import {
  preflightMonotonicAllocations,
  SafeMonotonicCounterV1,
} from "../../src/modules/game-module-safe-counter.js";
import type {
  ResolvedActorSnapshotGrantV13,
  ResolvedEntityChannelReadGrantV13,
  ResolvedModuleGraphV13,
} from "../../src/modules/game-module-resolver.js";

function manifest13(overrides: Record<string, unknown> = {}) {
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

const actorRead: ResolvedActorSnapshotGrantV13["descriptor"] = {
  readId: "enemy-nearest",
  ownerRelation: "different-owner",
  sourceActorRoles: ["player"],
  targetActorRoles: ["enemy"],
  maximumEntries: 2,
  entryFields: ["actorId", "actorGeneration", "active", "position"],
  envelopeFields: [
    "directoryRevision",
    "sampledAtMs",
    "sampledFrameSequence",
    "entryCount",
  ],
  order: "distance-then-actor-id-generation",
  distanceOrigin: "owner-position-same-snapshot",
};

function actorGrant(): ResolvedActorSnapshotGrantV13 {
  return {
    grantId: "nearest/actor-read/enemy-nearest",
    instanceId: "nearest",
    ownerActorId: "player-one",
    descriptor: actorRead,
  };
}

function actor(
  actorId: string,
  role: "player" | "enemy",
  x: number,
  y: number,
) {
  return {
    actorId,
    role,
    active: true,
    position: { x, y },
    collisionRadius: 4,
    healthRatio: 1,
  } as const;
}

const channels = [
  {
    channelId: "enemy-one.projectiles",
    localChannelId: "projectiles",
    ownerInstanceId: "delivery",
    ownerActorId: "enemy-one",
    outputPort: "projectiles",
    entityRole: "projectile",
    capacity: 1,
    capacityResources: ["activeEntities", "activeProjectiles"],
    readerInstanceIds: ["graze"],
  },
] as unknown as ResolvedModuleGraphV13["entityChannels"];

const entityReadGrant: ResolvedEntityChannelReadGrantV13 = {
  grantId: "graze/channel-read/projectiles",
  instanceId: "graze",
  channelId: "enemy-one.projectiles",
  maximumEntries: 1,
  descriptor: {
    readId: "projectiles",
    channelStateInputPort: "sources",
    sourceEntityRole: "projectile",
    targetActorRoles: ["player"],
    maximumEntriesSource: "resolved-channel-capacity",
    entryFields: ["entityId", "generation", "position", "active"],
    order: "entity-id-generation",
  },
};

describe("ADR 0027 authority descriptor red gate", () => {
  it("rejects missing, duplicate, undeclared, wrong-role, and over-capacity descriptors", () => {
    const missing = manifest13();
    delete (missing as Partial<typeof missing>).actorSnapshotReads;
    expect(() => GameModuleManifestV13Schema.parse(missing)).toThrow();

    expect(() =>
      GameModuleManifestV13Schema.parse(
        manifest13({ actorSnapshotReads: [actorRead, actorRead] }),
      ),
    ).toThrow(/duplicate actorSnapshotReads/);

    expect(() =>
      GameModuleManifestV13Schema.parse(
        manifest13({
          actorSnapshotReads: [
            {
              ...actorRead,
              entryFields: [...actorRead.entryFields, "velocity"],
            },
          ],
        }),
      ),
    ).toThrow();

    expect(() =>
      GameModuleManifestV13Schema.parse(
        manifest13({
          actorSnapshotReads: [
            { ...actorRead, targetActorRoles: ["projectile"] },
          ],
        }),
      ),
    ).toThrow();

    expect(() =>
      GameModuleManifestV13Schema.parse(
        manifest13({
          actorSnapshotReads: [{ ...actorRead, maximumEntries: 129 }],
        }),
      ),
    ).toThrow();

    expect(() =>
      GameModuleManifestV13Schema.parse(
        manifest13({
          actorSnapshotReads: [{ ...actorRead, distanceOrigin: null }],
        }),
      ),
    ).toThrow(/distance origin/);

    expect(() =>
      GameModuleManifestV13Schema.parse(
        manifest13({
          kind: "targeting",
          attackChannel: {
            role: "trigger",
            configurationField: "attackChannelId",
            requestOutputPort: "movement",
            requestPayloadType: "attack-request-v2",
          },
        }),
      ),
    ).toThrow(/role/);

    expect(() =>
      GameModuleManifestV13Schema.parse(
        manifest13({
          preparedEffectCommit: {
            commitServiceId: "pickup.commit",
            mutationChannelStateInputPort: "sources",
            admittedSourceOperation: "consume",
            effectPlanProfileId: "pickup.default",
            collectedOutputPort: "collected",
            applicationRouteSourceId: "applications",
            maximumApplicationsPerCommit: 33,
            maximumConcurrentCommits: 1,
            duplicateLedgerCapacity: 1,
          },
        }),
      ),
    ).toThrow();
  });

  it("projects only declared actor fields, uses the owner snapshot origin, and never reuses a stale generation", () => {
    const grant = actorGrant();
    expect(() => new DeterministicActorSnapshotHostV13([grant, grant])).toThrow(
      /duplicate actor snapshot grant/,
    );

    const host = new DeterministicActorSnapshotHostV13([grant]);
    host.register(actor("player-one", "player", 100, 0));
    const staleGeneration = host.register(actor("enemy-a", "enemy", 0, 0));
    host.register(actor("enemy-b", "enemy", 101, 0));
    const first = host.snapshot("nearest", grant.grantId, 10, 2);
    expect(first.entries.map((entry) => entry.actorId)).toEqual([
      "enemy-b",
      "enemy-a",
    ]);
    expect(Object.keys(first.entries[0]!).sort()).toEqual(
      [...actorRead.entryFields].sort(),
    );
    expect(Object.keys(first).sort()).toEqual(
      [...actorRead.envelopeFields, "entries"].sort(),
    );

    const beforeRemoval = first.directoryRevision;
    host.remove("enemy-a");
    const freshGeneration = host.register(actor("enemy-a", "enemy", 99, 0));
    expect(freshGeneration).toBe(staleGeneration + 1);
    const second = host.snapshot("nearest", grant.grantId, 11, 3);
    expect(second.directoryRevision).toBeGreaterThan(beforeRemoval);
    expect(
      second.entries.find((entry) => entry.actorId === "enemy-a")
        ?.actorGeneration,
    ).toBe(freshGeneration);
    expect(second.entries).not.toContainEqual(
      expect.objectContaining({
        actorId: "enemy-a",
        actorGeneration: staleGeneration,
      }),
    );
  });

  it("enforces entity projection, resolved count, ownership, and generation identity", () => {
    const host = new DeterministicEntityChannelSnapshotHostV13(channels, [
      entityReadGrant,
    ]);
    const first = {
      entityId: "bullet-a",
      generation: 0,
      position: { x: 1, y: 2 },
      collisionRadius: 2,
      active: true,
    } as const;
    host.activate("delivery", "enemy-one.projectiles", first);
    const snapshot = host.snapshot("graze", entityReadGrant.grantId);
    expect(snapshot).toHaveLength(1);
    expect(Object.keys(snapshot[0]!).sort()).toEqual(
      [...entityReadGrant.descriptor.entryFields].sort(),
    );
    expect(() =>
      host.activate("delivery", "enemy-one.projectiles", {
        ...first,
        entityId: "bullet-b",
      }),
    ).toThrow(/capacity exceeded/);
    expect(() =>
      host.update("other-delivery", "enemy-one.projectiles", "bullet-a", 0, {
        position: { x: 2, y: 2 },
      }),
    ).toThrow(/stale/);
    host.deactivate("delivery", "enemy-one.projectiles", "bullet-a", 0);
    expect(() =>
      host.update("delivery", "enemy-one.projectiles", "bullet-a", 0, {
        position: { x: 2, y: 2 },
      }),
    ).toThrow(/stale/);
    expect(() =>
      host.activate("delivery", "enemy-one.projectiles", first),
    ).toThrow(/strictly increasing/);
  });

  it("preflights a multi-counter block atomically at the safe-integer edge", () => {
    const registration = new SafeMonotonicCounterV1(
      "registration",
      Number.MAX_SAFE_INTEGER - 2,
    );
    const mutation = new SafeMonotonicCounterV1("mutation", 40);
    const evidence = new SafeMonotonicCounterV1("evidence", 90);
    expect(
      preflightMonotonicAllocations([
        { counter: registration, count: 2 },
        { counter: mutation, count: 1 },
        { counter: evidence, count: 1 },
      ]),
    ).toEqual([
      {
        base: Number.MAX_SAFE_INTEGER - 1,
        end: Number.MAX_SAFE_INTEGER,
      },
      { base: 41, end: 41 },
      { base: 91, end: 91 },
    ]);
    expect(registration.current).toBe(Number.MAX_SAFE_INTEGER - 2);
    expect(mutation.current).toBe(40);
    expect(evidence.current).toBe(90);

    expect(() =>
      preflightMonotonicAllocations([
        { counter: mutation, count: 1 },
        { counter: registration, count: 3 },
        { counter: evidence, count: 1 },
      ]),
    ).toThrow(/counter-exhausted/);
    expect(registration.current).toBe(Number.MAX_SAFE_INTEGER - 2);
    expect(mutation.current).toBe(40);
    expect(evidence.current).toBe(90);
  });

  it("rejects Manifest 1.3 production artifact evidence drift", async () => {
    const reviewedManifest = GameModuleManifestV13Schema.parse(
      manifest13({
        moduleId: "test.authority-evidence",
        implementationId: "test.authority-evidence.v1",
        configurationSchemaId: "test.authority-evidence.config",
        provides: [],
        requires: [],
        inputPorts: [],
        outputPorts: [],
        dependencies: [],
        assetRequirements: [],
        conflicts: [],
        exclusiveOwnership: [],
      }),
    );
    const configurationDescriptor = {
      descriptorVersion: "1.0.0",
      schemaId: reviewedManifest.configurationSchemaId,
      dialect: "json-schema-2020-12-subset",
      schema: {},
    } as const;
    const reservationDescriptor = {
      descriptorVersion: "1.0.0",
      reservationId: "test.authority-evidence.resources",
      strategy: "constant",
      fields: [],
    } as const;
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
    expect(() =>
      new GameModuleRegistry().registerProductionV13({
        manifest: reviewedManifest,
        configurationDescriptor,
        configurationSchema: z.strictObject({}),
        reservationDescriptor,
        reservationEvaluator: () => ({
          activeEntities: 0,
          activeProjectiles: 0,
          spawnsPerSecond: 0,
          timers: 0,
        }),
        implementationBundle,
        dependencyLockIdentity,
        toolchainIdentity,
        expectedArtifact: {
          ...artifact,
          manifestSha256:
            artifact.manifestSha256 === "0".repeat(64)
              ? "1".repeat(64)
              : "0".repeat(64),
        },
        executableHandle: handle,
      }),
    ).toThrow(/artifact identity mismatch/);
  });
});
