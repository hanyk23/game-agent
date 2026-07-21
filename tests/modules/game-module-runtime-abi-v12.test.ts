import { createHash } from "node:crypto";

import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

import {
  GameAssemblySpecSchema,
  GameModuleManifestSchema,
  type GameModuleManifestV12,
} from "../../src/modules/game-module-contract.js";
import {
  createModuleArtifactHashDescriptor,
  ContactIdentityV12Schema,
  MovementArbiterCapabilityDescriptorV12Schema,
  ProjectileDeliveryCapabilityDescriptorV12Schema,
  sha256CanonicalJson,
} from "../../src/modules/game-module-execution-contract.js";
import { TrustedGameModuleExecutableLoader } from "../../src/modules/game-module-executable-loader.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import { generateBrowserRuntimeCatalogV12 } from "../../src/modules/game-module-runtime-catalog-generator.js";
import { DeterministicGameModuleProductionInstantiatorV12 } from "../../src/modules/game-module-production-instantiator.js";
import {
  resolveGameAssembly,
  resolveGameAssemblyV12,
} from "../../src/modules/game-module-resolver.js";
import {
  ContactCommitCoordinatorV12,
  deriveModuleTextureKey,
  deriveRuntimeServiceLeaseSuffix,
  DeterministicGameModuleRuntimeV12,
  DeterministicModuleClockV12,
  GraphTransitionGuard,
  ModularObservationRegistryV12,
  RuntimeKernelSessionQuarantineLedgerV12,
  EntityCustodyControllerV12,
  assertRuntimeServicePermission,
} from "../../src/modules/game-module-runtime-abi-v12.js";

const hash = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");
const zeros = "0".repeat(64);
const contactIdentity = (sequence: number) => ({
  producerInstanceId: "resolver",
  producerSequence: sequence,
  sourceChannelId: "projectiles",
  sourceEntityId: `projectile-${sequence}`,
  sourceGeneration: 1,
});

function manifest12(
  overrides: Partial<GameModuleManifestV12> = {},
): GameModuleManifestV12 {
  return GameModuleManifestSchema.parse({
    schemaVersion: "1.2.0",
    moduleId: "test.runtime",
    version: "1.0.0",
    kind: "scoring",
    implementationId: "test.runtime.impl",
    configurationSchemaId: "test.runtime.config",
    kernelVersionRange: "^1.0.0",
    engine: { id: "phaser", versionRange: "^3.0.0" },
    provides: [],
    requires: [],
    inputPorts: [],
    outputPorts: [],
    dependencies: [],
    assetRequirements: [],
    conflicts: [],
    exclusiveOwnership: [],
    cardinality: {
      maximumInstancesPerAssembly: 1,
      maximumInstancesPerOwner: 1,
    },
    resources: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
    runtimeLeases: { startLeases: 0, instanceLeases: 0, graphLeases: 0 },
    runtimeContract: {
      update: null,
      timerSlots: { slotGroupId: "main" },
      inputRegistrations: [],
      observationReaders: [],
      contactCommit: null,
    },
    browserSupport: { desktop: true, touch: true },
    evidence: { provenanceId: "test.provenance", testSuiteId: "test.suite" },
    ...overrides,
  }) as GameModuleManifestV12;
}

function assembly11(moduleId = "test.runtime") {
  return GameAssemblySpecSchema.parse({
    schemaVersion: "1.1.0",
    assemblyId: "test.assembly",
    kernelVersion: "1.0.0",
    engine: { id: "phaser", version: "3.80.0" },
    actors: [{ actorId: "player", role: "player" }],
    modules: [
      {
        instanceId: "runtime",
        moduleId,
        versionRange: "1.0.0",
        ownerId: "player",
        configuration: {},
      },
    ],
    bindings: [],
    assetRoles: [],
    assetBindings: [],
    globalBudget: {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
  });
}

async function productionRegistry(
  manifest = manifest12(),
): Promise<GameModuleRegistry> {
  const bundle = new TextEncoder().encode(
    "export function create(){ return Object.freeze({}); }",
  );
  const configurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId: manifest.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: {},
  } as const;
  const reservationDescriptor = {
    descriptorVersion: "1.0.0",
    reservationId: "test.reservation",
    strategy: "constant",
    fields: [],
  } as const;
  const lock = new TextEncoder().encode("lock");
  const toolchain = new TextEncoder().encode("toolchain");
  const artifact = createModuleArtifactHashDescriptor({
    manifest,
    configurationDescriptor,
    reservationDescriptor,
    implementationBundle: bundle,
    dependencyLockIdentity: lock,
    toolchainIdentity: toolchain,
  });
  const handle = await new TrustedGameModuleExecutableLoader().admit({
    generatedOutput: bundle,
    expectedOutputSha256: hash(bundle),
    implementationId: manifest.implementationId,
    exportName: "create",
    exportKind: "lifecycle-create-v1",
    sourceBundleSha256: hash(bundle),
    manifestSha256: artifact.manifestSha256,
    dependencyLockSha256: artifact.dependencyLockSha256,
    toolchainIdentitySha256: artifact.toolchainIdentitySha256,
  });
  const registry = new GameModuleRegistry();
  registry.registerProductionV12({
    manifest,
    configurationDescriptor,
    configurationSchema: z.strictObject({}),
    reservationDescriptor,
    reservationEvaluator: () => ({
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    }),
    implementationBundle: bundle,
    dependencyLockIdentity: lock,
    toolchainIdentity: toolchain,
    expectedArtifact: artifact,
    executableHandle: handle,
  });
  return registry;
}

describe("ABI 1.2 contract, trusted loader, and readiness", () => {
  it("preserves explicit version boundaries and emits matching readiness evidence", async () => {
    const registry = await productionRegistry();
    expect(() => resolveGameAssembly(assembly11(), registry)).toThrow(
      /resolveGameAssemblyV12/,
    );
    const result = resolveGameAssemblyV12(assembly11(), registry);
    expect(result.graph.graphVersion).toBe("1.2.0");
    expect(result.graph.executionReadiness).toEqual({
      status: "ready",
      evidenceId: result.readinessReport.graphEvidenceId,
    });
    expect(result.graph).not.toHaveProperty("productionInstantiationAllowed");
    expect(Object.isFrozen(result.graph)).toBe(true);
  });

  it("generates a frozen catalog and instantiates only matching graph evidence", async () => {
    const registry = await productionRegistry();
    const result = resolveGameAssemblyV12(assembly11(), registry);
    const catalog = generateBrowserRuntimeCatalogV12(result.graph, registry);
    const runtime = DeterministicGameModuleProductionInstantiatorV12.create({
      graph: result.graph,
      catalog,
      createContext: (module, clock) =>
        Object.freeze({
          identity: Object.freeze({
            instanceId: module.instanceId,
            ownerId: module.ownerId,
            moduleId: module.moduleId,
            version: module.version,
            artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
          }),
          configuration: Object.freeze({}),
          services: Object.freeze({
            viewport: Object.freeze({ read: vi.fn() }),
            actors: Object.freeze({
              readOwner: vi.fn(),
              writeOwnerMotion: vi.fn(),
              writeOwnerPosition: vi.fn(),
            }),
            input: Object.freeze({ register: vi.fn() }),
            overlaps: Object.freeze({ register: vi.fn() }),
            channels: Object.freeze({
              activate: vi.fn(),
              recycle: vi.fn(),
              read: vi.fn(),
            }),
            observation: Object.freeze({ register: vi.fn() }),
            contact: Object.freeze({
              executePolicy: vi.fn(),
              prepareCommit: vi.fn(),
            }),
          }),
          ports: Object.freeze({
            declareHandler: vi.fn(),
            publishState: vi.fn(),
            emitEvent: vi.fn(),
          }),
          clock: Object.freeze({
            nowMs: () => clock.nowMs(),
            schedule: vi.fn(),
          }),
          assets: Object.freeze({
            requireTexture: vi.fn(),
            optionalTexture: vi.fn(),
          }),
        }),
    });
    runtime.initialize();
    runtime.start();
    runtime.dispose();
    runtime.destroy();
    expect(runtime.phase).toBe("destroyed");
    expect(Object.isFrozen(catalog)).toBe(true);
  });

  it("blocks fixture registrations and rejects forged or forbidden executable admission", async () => {
    const fixture = new GameModuleRegistry();
    fixture.register(manifest12(), z.strictObject({}));
    expect(
      resolveGameAssemblyV12(assembly11(), fixture).readinessReport.blockers,
    ).toContainEqual({ instanceId: "runtime", code: "fixture-registration" });
    const loader = new TrustedGameModuleExecutableLoader();
    const forbidden = new TextEncoder().encode(
      "export function create(){ return process.env; }",
    );
    await expect(
      loader.admit({
        generatedOutput: forbidden,
        expectedOutputSha256: hash(forbidden),
        implementationId: "test.runtime.impl",
        exportName: "create",
        exportKind: "lifecycle-create-v1",
        sourceBundleSha256: zeros,
        manifestSha256: zeros,
        dependencyLockSha256: zeros,
        toolchainIdentitySha256: zeros,
      }),
    ).rejects.toThrow(/ambient authority/);
    const sideEffect = new TextEncoder().encode(
      "doSomething(); export function create(){}",
    );
    await expect(
      loader.admit({
        generatedOutput: sideEffect,
        expectedOutputSha256: hash(sideEffect),
        implementationId: "test.runtime.impl",
        exportName: "create",
        exportKind: "lifecycle-create-v1",
        sourceBundleSha256: zeros,
        manifestSha256: zeros,
        dependencyLockSha256: zeros,
        toolchainIdentitySha256: zeros,
      }),
    ).rejects.toThrow(/top-level/);
    const pure = new TextEncoder().encode("export function create(){}");
    await expect(
      loader.admit({
        generatedOutput: pure,
        expectedOutputSha256: zeros,
        implementationId: "test.runtime.impl",
        exportName: "create",
        exportKind: "lifecycle-create-v1",
        sourceBundleSha256: zeros,
        manifestSha256: zeros,
        dependencyLockSha256: zeros,
        toolchainIdentitySha256: zeros,
      }),
    ).rejects.toThrow(/byte drift/);
    const registry = new GameModuleRegistry();
    expect(() => registry.registerProductionV12({} as never)).toThrow();
  });

  it("enforces owner-scoped dependency ambiguity and required asset bindings", async () => {
    const requiring = manifest12({
      moduleId: "test.consumer",
      implementationId: "test.consumer.impl",
      dependencies: [
        {
          moduleId: "test.provider",
          versionRange: "1.0.0",
          optional: false,
          scope: "owner",
        },
      ],
      assetRequirements: [
        {
          roleId: "sprite",
          category: "ui",
          cardinality: "exactly-one",
          sharing: "instance",
        },
      ],
    });
    expect(requiring.dependencies[0]?.scope).toBe("owner");
    const key = deriveModuleTextureKey("a".repeat(64), "sprite", new Set());
    expect(key).toBe(`module/${"a".repeat(64)}/sprite`);
    expect(() =>
      deriveModuleTextureKey("a".repeat(64), "sprite", new Set([key])),
    ).toThrow(/already exists/);
    const registry = await productionRegistry(
      manifest12({ ...requiring, dependencies: [] }),
    );
    const missing = resolveGameAssemblyV12(
      assembly11("test.consumer"),
      registry,
    );
    expect(missing.readinessReport.blockers).toContainEqual({
      instanceId: "runtime",
      code: "missing-required-asset",
    });
    const withAsset = {
      ...assembly11("test.consumer"),
      assetBindings: [
        {
          bindingId: "sprite",
          roleId: "sprite",
          category: "ui",
          artifact: {
            assetId: "sprite.asset",
            sourceSha256: "b".repeat(64),
            runtimeSha256: "c".repeat(64),
            provenanceId: "asset.provenance",
            licenseRecordId: "asset.license",
          },
          sharing: "instance",
          consumerInstanceIds: ["runtime"],
        },
      ],
    };
    expect(
      resolveGameAssemblyV12(withAsset, registry, {
        assets: [withAsset.assetBindings[0]!.artifact],
        approvedSharingEvidenceIds: [],
      }).graph.assetBindings[0]?.textureKey,
    ).toBe(`module/${"c".repeat(64)}/sprite`);
  });

  it("derives every factory-inaccessible service identity without fallback keys", () => {
    expect(
      deriveRuntimeServiceLeaseSuffix({
        kind: "timer",
        id: "main",
        secondaryId: "0",
      }),
    ).toBe("timer/main/0");
    expect(
      deriveRuntimeServiceLeaseSuffix({ kind: "observation", id: "status" }),
    ).toBe("observation/status");
    expect(() =>
      deriveRuntimeServiceLeaseSuffix({ kind: "timer", id: "main" }),
    ).toThrow(/secondary/);
  });

  it("rejects optional scoped dependency ambiguity and cycles in the combined DAG", () => {
    const registry = new GameModuleRegistry();
    registry.register(
      manifest12({
        moduleId: "test.provider",
        implementationId: "test.provider.impl",
        cardinality: {
          maximumInstancesPerAssembly: 2,
          maximumInstancesPerOwner: 2,
        },
      }),
      z.strictObject({}),
    );
    registry.register(
      manifest12({
        moduleId: "test.consumer",
        implementationId: "test.consumer.impl",
        dependencies: [
          {
            moduleId: "test.provider",
            versionRange: "1.0.0",
            optional: true,
            scope: "owner",
          },
        ],
      }),
      z.strictObject({}),
    );
    const ambiguous = {
      ...assembly11("test.consumer"),
      modules: [
        {
          instanceId: "consumer",
          moduleId: "test.consumer",
          versionRange: "1.0.0",
          ownerId: "player",
          configuration: {},
        },
        {
          instanceId: "provider-a",
          moduleId: "test.provider",
          versionRange: "1.0.0",
          ownerId: "player",
          configuration: {},
        },
        {
          instanceId: "provider-b",
          moduleId: "test.provider",
          versionRange: "1.0.0",
          ownerId: "player",
          configuration: {},
        },
      ],
    };
    expect(() => resolveGameAssemblyV12(ambiguous, registry)).toThrow(
      /multiple dependency/,
    );

    const cyclic = new GameModuleRegistry();
    cyclic.register(
      manifest12({
        moduleId: "test.a",
        implementationId: "test.a.impl",
        dependencies: [
          {
            moduleId: "test.b",
            versionRange: "1.0.0",
            optional: false,
            scope: "assembly",
          },
        ],
      }),
      z.strictObject({}),
    );
    cyclic.register(
      manifest12({
        moduleId: "test.b",
        implementationId: "test.b.impl",
        dependencies: [
          {
            moduleId: "test.a",
            versionRange: "1.0.0",
            optional: false,
            scope: "assembly",
          },
        ],
      }),
      z.strictObject({}),
    );
    const cycleAssembly = {
      ...assembly11("test.a"),
      modules: [
        {
          instanceId: "a",
          moduleId: "test.a",
          versionRange: "1.0.0",
          ownerId: "player",
          configuration: {},
        },
        {
          instanceId: "b",
          moduleId: "test.b",
          versionRange: "1.0.0",
          ownerId: "player",
          configuration: {},
        },
      ],
    };
    expect(() => resolveGameAssemblyV12(cycleAssembly, cyclic)).toThrow(
      /cycle/,
    );
  });
});

describe("ABI 1.2 lifecycle, event, clock, and permissions", () => {
  it("runs the V1.4 host frame barrier after providers and releases the guard before finalization", () => {
    const order: string[] = [];
    let runtime: DeterministicGameModuleRuntimeV12;
    runtime = new DeterministicGameModuleRuntimeV12({
      readiness: { status: "ready" },
      constructionOrder: ["provider"],
      participants: [
        {
          instanceId: "provider",
          update: () => order.push("provider"),
        },
      ],
      updateInstanceIds: ["provider"],
      exactTimerGrants: { provider: 0 },
      hostFrameHooks: {
        beginFrame: (frameSequence) => {
          expect(frameSequence).toBe(1);
          expect(runtime.guard.currentTransition?.kind).toBe("frame");
          order.push("begin");
        },
        frameTail: (frameSequence) => {
          expect(frameSequence).toBe(1);
          expect(runtime.guard.currentTransition?.kind).toBe("frame");
          expect(runtime.servicePhase).toBeUndefined();
          expect(() => runtime.assertService("read")).toThrow(
            /outside a module phase/,
          );
          order.push("tail");
        },
        afterGuard: (frameSequence) => {
          expect(frameSequence).toBe(1);
          expect(runtime.guard.held).toBe(false);
          order.push("after");
        },
      },
    });
    runtime.initialize();
    runtime.start();
    runtime.frame(16);
    expect(order).toEqual(["begin", "provider", "tail", "after"]);
  });

  it("replays retained state before start and rejects start publication", () => {
    const order: string[] = [];
    let runtime!: DeterministicGameModuleRuntimeV12;
    runtime = new DeterministicGameModuleRuntimeV12({
      readiness: { status: "ready" },
      constructionOrder: ["provider", "consumer"],
      updateInstanceIds: ["provider", "consumer"],
      exactTimerGrants: { provider: 1, consumer: 0 },
      participants: [
        {
          instanceId: "consumer",
          start: () => order.push("consumer-start"),
          update: () => order.push("consumer-update"),
        },
        {
          instanceId: "provider",
          initialize: () => runtime.publishState("provider.value", 7),
          start: () => {
            order.push("provider-start");
            expect(() => runtime.publishState("provider.value", 8)).toThrow(
              /forbidden/,
            );
          },
          update: () => order.push("provider-update"),
        },
      ],
    });
    runtime.registerStateHandler("provider.value", () => order.push("replay"));
    runtime.initialize();
    runtime.start();
    runtime.frame(0);
    expect(order).toEqual([
      "replay",
      "provider-start",
      "consumer-start",
      "provider-update",
      "consumer-update",
    ]);
  });

  it("rejects invalid deltas without side effects and terminally cleans timer/update failures", () => {
    const clock = new DeterministicModuleClockV12(["a"], { a: 1 });
    expect(clock.validateDelta(251)).toBe(false);
    expect(clock.frameSequence).toBe(0);
    expect(clock.nowMs()).toBe(0);
    const runtime = new DeterministicGameModuleRuntimeV12({
      readiness: { status: "ready" },
      constructionOrder: ["a"],
      updateInstanceIds: ["a"],
      exactTimerGrants: { a: 0 },
      participants: [
        {
          instanceId: "a",
          update: () => {
            throw new Error("boom");
          },
        },
      ],
    });
    runtime.initialize();
    runtime.start();
    expect(() => runtime.frame(1)).toThrow(AggregateError);
    expect(runtime.phase).toBe("destroyed");
    expect(runtime.dispose()).toBe(runtime.cleanupReport);
  });

  it("uses exact timer slots, stable due order, later-frame scheduling, and idempotent cancellation", () => {
    const clock = new DeterministicModuleClockV12(["a", "b"], { a: 2, b: 1 });
    const calls: string[] = [];
    let nested = false;
    const handle = clock.schedule("a", {
      mode: "once",
      delayMs: 0,
      callback: () => {
        calls.push("a0");
        clock.schedule("a", {
          mode: "once",
          delayMs: 0,
          callback: () => {
            nested = true;
          },
        });
      },
    });
    clock.schedule("b", {
      mode: "finite-repeat",
      initialDelayMs: 0,
      intervalMs: 1,
      totalFireCount: 2,
      callback: () => calls.push("b"),
    });
    expect(() =>
      clock.schedule("b", { mode: "once", delayMs: 0, callback: vi.fn() }),
    ).toThrow(/exhausted/);
    clock.beginAcceptedFrame(0);
    clock.dispatchDue();
    expect(calls).toEqual(["a0", "b"]);
    expect(nested).toBe(false);
    expect(handle.active).toBe(false);
    handle.cancel();
    clock.beginAcceptedFrame(1);
    clock.dispatchDue();
    expect(calls).toEqual(["a0", "b", "b"]);
    expect(nested).toBe(true);
  });

  it("allows inherited nested events but rejects top-level reentry and depth overflow", () => {
    const guard = new GraphTransitionGuard();
    let sameId = false;
    guard.run("external-event", () =>
      guard.deliver((outer) =>
        guard.deliver((inner) => {
          sameId = outer.eventTransactionId === inner.eventTransactionId;
          expect(inner.depth).toBe(2);
        }),
      ),
    );
    expect(sameId).toBe(true);
    expect(() =>
      guard.run("frame", () => guard.run("stop", () => undefined)),
    ).toThrow(/reentered/);
    expect(() =>
      guard.run("external-event", () => {
        const recurse = (): void => guard.deliver(() => recurse());
        recurse();
      }),
    ).toThrow(/depth/);
  });

  it("mechanically enforces every phase matrix rejection", () => {
    expect(() =>
      assertRuntimeServicePermission("state-replay", "timer"),
    ).toThrow();
    expect(() =>
      assertRuntimeServicePermission("start", "publish-state"),
    ).toThrow();
    expect(() =>
      assertRuntimeServicePermission("initialize", "publish-event"),
    ).toThrow();
    expect(() =>
      assertRuntimeServicePermission("running", "contact-commit"),
    ).not.toThrow();
    const expected: Record<string, readonly string[]> = {
      initialize: [
        "read",
        "publish-state",
        "create-runtime-state",
        "register-observation",
      ],
      "state-replay": ["read"],
      start: ["read", "register-input", "timer"],
      running: [
        "read",
        "publish-state",
        "publish-event",
        "timer",
        "activate-entity",
        "recycle-entity",
        "write-actor-motion",
        "contact-policy",
        "contact-commit",
      ],
      stop: ["read"],
      dispose: ["read"],
    };
    const phases = Object.keys(expected) as Array<keyof typeof expected>;
    const operations = [
      "read",
      "publish-state",
      "publish-event",
      "create-runtime-state",
      "register-observation",
      "register-input",
      "timer",
      "activate-entity",
      "recycle-entity",
      "write-actor-motion",
      "contact-policy",
      "contact-commit",
    ] as const;
    for (const phase of phases)
      for (const operation of operations) {
        const call = () =>
          assertRuntimeServicePermission(phase as never, operation);
        if (expected[phase]!.includes(operation)) expect(call).not.toThrow();
        else expect(call).toThrow();
      }
  });

  it("auto-stops running disposal and makes terminal disposal/destruction idempotent", () => {
    const order: string[] = [];
    const runtime = new DeterministicGameModuleRuntimeV12({
      readiness: { status: "ready" },
      constructionOrder: ["a", "b"],
      updateInstanceIds: [],
      exactTimerGrants: {},
      participants: [
        {
          instanceId: "a",
          stop: () => order.push("stop-a"),
          dispose: () => order.push("dispose-a"),
        },
        {
          instanceId: "b",
          stop: () => order.push("stop-b"),
          dispose: () => order.push("dispose-b"),
        },
      ],
    });
    runtime.initialize();
    runtime.start();
    const report = runtime.dispose();
    expect(order).toEqual(["stop-b", "stop-a", "dispose-b", "dispose-a"]);
    runtime.destroy();
    expect(runtime.dispose()).toBe(report);
    expect(runtime.destroy()).toBe(report);
  });
});

describe("ABI 1.2 observation, quarantine, and contact commit", () => {
  it("publishes namespaced observations atomically and rejects invalid values/reentrancy", () => {
    const observations = new ModularObservationRegistryV12();
    const guard = new GraphTransitionGuard();
    observations.register("b", "status", () => ({ ok: true }));
    observations.register("a", "status", () => [1, 2]);
    const snapshot = observations.snapshot(2, 10, guard);
    expect(Object.keys(snapshot.modules)).toEqual(["a", "b"]);
    expect(snapshot.revision).toBe(1);
    observations.register("a", "bad", () => ({ value: Number.NaN }));
    expect(() => observations.snapshot(3, 11, guard)).toThrow(/non-finite/);
    expect(() =>
      guard.run("frame", () => observations.snapshot(3, 11, guard)),
    ).toThrow(/guard/);
  });

  it("enforces observation reader, depth, entry, string, and snapshot-byte hard limits", () => {
    const guard = new GraphTransitionGuard();
    const readers = new ModularObservationRegistryV12();
    for (let index = 0; index < 8; index += 1)
      readers.register("one", `r${index}`, () => []);
    expect(() => readers.register("one", "r8", () => [])).toThrow(/capacity/);
    const entries = new ModularObservationRegistryV12();
    entries.register("one", "exact", () =>
      Array.from({ length: 128 }, () => 0),
    );
    expect(() => entries.snapshot(0, 0, guard)).not.toThrow();
    const overEntries = new ModularObservationRegistryV12();
    overEntries.register("one", "over", () =>
      Array.from({ length: 129 }, () => 0),
    );
    expect(() => overEntries.snapshot(0, 0, guard)).toThrow(/entry/);
    const deep = new ModularObservationRegistryV12();
    let value: unknown = 0;
    for (let index = 0; index < 9; index += 1) value = [value];
    deep.register("one", "deep", () => value);
    expect(() => deep.snapshot(0, 0, guard)).toThrow(/depth/);
    const text = new ModularObservationRegistryV12();
    text.register("one", "text", () => "x".repeat(4097));
    expect(() => text.snapshot(0, 0, guard)).toThrow(/string/);
    const bytes = new ModularObservationRegistryV12();
    for (let instance = 0; instance < 65; instance += 1)
      bytes.register(`i${instance}`, "text", () => "x".repeat(4096));
    expect(() => bytes.snapshot(0, 0, guard)).toThrow(/byte/);
  });

  it("pre-reserves quarantine capacity and blocks graph/verification until clean report", () => {
    const ledger = new RuntimeKernelSessionQuarantineLedgerV12(1);
    ledger.assertGraphCreationAllowed(1);
    const release = ledger.reserveActivation();
    expect(() => ledger.reserveActivation()).toThrow(/exhausted/);
    ledger.transfer("entity/one", 1, ["entity", "pool"], release);
    expect(() => ledger.assertGraphCreationAllowed(0)).toThrow(/blocks/);
    const unresolved = ledger.finalCleanup(() => false);
    expect(() => ledger.assertVerificationClean(unresolved)).toThrow();
    const clean = ledger.destroy(() => true);
    expect(clean.disposition).toBe("clean");
    expect(() => ledger.assertVerificationClean(clean)).not.toThrow();
  });

  it("coordinates physical/logical entity custody and transfers indeterminate rollback", () => {
    const ledger = new RuntimeKernelSessionQuarantineLedgerV12(2);
    const clean = new EntityCustodyControllerV12(ledger, {
      activatePhysical: vi.fn(),
      activateLogical: vi.fn(),
      deactivatePhysical: () => true,
      deactivateLogical: () => true,
    });
    clean.activate("entity/clean", 1, ["entity"]);
    expect(clean.state("entity/clean")).toBe("active");
    clean.recycle("entity/clean", 1, ["entity"]);
    expect(clean.state("entity/clean")).toBe("inactive");
    const bad = new EntityCustodyControllerV12(ledger, {
      activatePhysical: vi.fn(),
      activateLogical: () => {
        throw new Error("logical");
      },
      deactivatePhysical: () => false,
      deactivateLogical: () => true,
    });
    expect(() => bad.activate("entity/bad", 1, ["entity", "pool"])).toThrow(
      /activation failed/,
    );
    expect(bad.state("entity/bad")).toBe("quarantined");
    expect(ledger.size).toBe(1);
  });

  it("aborts abandoned prepares without evidence holes and commits source-first in fixed order", () => {
    const guard = new GraphTransitionGuard();
    const commits = new ContactCommitCoordinatorV12(guard, 1);
    const order: string[] = [];
    guard.run("external-event", () =>
      guard.deliver(() => {
        commits.prepare({
          contactIdentity: contactIdentity(1),
          sourceOperation: "consume",
          applySourceOperation: () => ({ physical: true, logical: true }),
          deliverHit: () => undefined,
          deliverDamage: () => undefined,
          quarantine: vi.fn(),
        });
      }),
    );
    expect(commits.abortedPrepareCount).toBe(1);
    guard.run("external-event", () =>
      guard.deliver(() => {
        const prepared = commits.prepare({
          contactIdentity: contactIdentity(1),
          sourceOperation: "consume",
          applySourceOperation: () => {
            order.push("source");
            return { physical: true, logical: true };
          },
          deliverHit: (id) => order.push(`hit-${id}`),
          deliverDamage: (id) => order.push(`damage-${id}`),
          quarantine: vi.fn(),
        });
        expect(prepared.commit().evidenceId).toBe(1);
        expect(() => prepared.commit()).toThrow();
      }),
    );
    expect(order).toEqual(["source", "hit-1", "damage-1"]);
    expect(() =>
      guard.run("external-event", () =>
        guard.deliver(() =>
          commits.prepare({
            contactIdentity: contactIdentity(1),
            sourceOperation: "consume",
            applySourceOperation: () => ({ physical: true, logical: true }),
            deliverHit: vi.fn(),
            deliverDamage: vi.fn(),
            quarantine: vi.fn(),
          }),
        ),
      ),
    ).toThrow(/duplicate/);
    commits.releaseInactiveSourceGeneration("projectiles", "projectile-1", 1);
  });

  it("quarantines indeterminate source mutation and emits no gameplay result", () => {
    const guard = new GraphTransitionGuard();
    const commits = new ContactCommitCoordinatorV12(guard, 1);
    const hit = vi.fn();
    const damage = vi.fn();
    const quarantine = vi.fn();
    expect(() =>
      guard.run("external-event", () =>
        guard.deliver(() =>
          commits
            .prepare({
              contactIdentity: contactIdentity(3),
              sourceOperation: "consume",
              applySourceOperation: () => ({ physical: true, logical: false }),
              deliverHit: hit,
              deliverDamage: damage,
              quarantine,
            })
            .commit(),
        ),
      ),
    ).toThrow(/source-operation-indeterminate/);
    expect(hit).not.toHaveBeenCalled();
    expect(damage).not.toHaveBeenCalled();
    expect(quarantine).toHaveBeenCalledOnce();
  });
});

describe("ABI evidence identities", () => {
  it("keeps canonical evidence stable", () => {
    expect(sha256CanonicalJson({ b: 2, a: 1 })).toBe(
      sha256CanonicalJson({ a: 1, b: 2 }),
    );
  });
  it("freezes the four Batch 1 shared semantic contracts", () => {
    expect(
      MovementArbiterCapabilityDescriptorV12Schema.parse({
        capability: "intent.movement-arbiter@1.0.0",
        scope: "owner",
        outputPayloadType: "resolved-movement-command-v1",
      }).scope,
    ).toBe("owner");
    expect(
      ProjectileDeliveryCapabilityDescriptorV12Schema.parse({
        capability: "delivery.projectile@1.0.0",
        channelId: "projectiles",
        entityRole: "projectile",
        capacityResources: ["activeEntities", "activeProjectiles"],
      }).entityRole,
    ).toBe("projectile");
    expect(ContactIdentityV12Schema.parse(contactIdentity(1))).toEqual(
      contactIdentity(1),
    );
    expect(() =>
      ProjectileDeliveryCapabilityDescriptorV12Schema.parse({
        capability: "delivery.projectile@1.0.0",
        channelId: "projectiles",
        entityRole: "projectile",
        capacityResources: ["activeEntities"],
      }),
    ).toThrow();
    expect(manifest12().sharedSemantics).toBeUndefined();
  });
});
