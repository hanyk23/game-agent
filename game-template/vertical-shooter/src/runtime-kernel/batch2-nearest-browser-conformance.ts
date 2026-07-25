import {
  batch2NearestGraph,
  batch2NearestRuntimeCatalog,
} from "../generated/batch2-nearest.js";
import { DeterministicActorSnapshotHostV13 } from "../../../../src/modules/game-module-actor-snapshot-host.js";
import { DeterministicGameModuleProductionInstantiatorV13 } from "../../../../src/modules/game-module-production-instantiator.js";

type SnapshotActor = Parameters<
  DeterministicActorSnapshotHostV13["register"]
>[0];

export type Batch2NearestCaseEvidence = Readonly<{
  caseId:
    | "empty"
    | "equal-distance-tie"
    | "inactive"
    | "out-of-range"
    | "stale-old"
    | "stale-new"
    | "stale-fallback";
  direction: Readonly<{ x: number; y: number }>;
  actorReadsBeforeAttack: number;
  actorReadsAfterAttack: number;
  noReresolve: boolean;
  cleanupResidue: number;
}>;

export type Batch2NearestBrowserConformanceSnapshot = Readonly<{
  phase: "running" | "complete" | "destroyed";
  completedCases: readonly Batch2NearestCaseEvidence[];
  allPassed: boolean;
}>;

export type Batch2NearestBrowserConformanceRuntime = Readonly<{
  frame(deltaMs: number): void;
  snapshot(): Batch2NearestBrowserConformanceSnapshot;
  destroy(): void;
}>;

type NearestScenario = Readonly<{
  caseId: Batch2NearestCaseEvidence["caseId"];
  targets: readonly SnapshotActor[];
  expected: Readonly<{ x: number; y: number }>;
  mutateAfterFirstUpdate?: Readonly<{
    position?: Readonly<{ x: number; y: number }>;
    active?: boolean;
  }>;
  updateAfterMutation?: boolean;
}>;

const player: SnapshotActor = Object.freeze({
  actorId: "player-one",
  role: "player",
  active: true,
  position: Object.freeze({ x: 360, y: 600 }),
  collisionRadius: 12,
  healthRatio: 1,
});

const target = (
  actorId: "enemy-one" | "boss-one",
  role: "enemy" | "boss",
  x: number,
  y: number,
  active = true,
): SnapshotActor =>
  Object.freeze({
    actorId,
    role,
    active,
    position: Object.freeze({ x, y }),
    collisionRadius: 20,
    healthRatio: 1,
  });

const scenarios: readonly NearestScenario[] = Object.freeze([
  Object.freeze({
    caseId: "empty" as const,
    targets: Object.freeze([]),
    expected: Object.freeze({ x: 0, y: -1 }),
  }),
  Object.freeze({
    caseId: "equal-distance-tie" as const,
    targets: Object.freeze([
      target("enemy-one", "enemy", 460, 600),
      target("boss-one", "boss", 260, 600),
    ]),
    expected: Object.freeze({ x: -1, y: 0 }),
  }),
  Object.freeze({
    caseId: "inactive" as const,
    targets: Object.freeze([target("enemy-one", "enemy", 360, 500, false)]),
    expected: Object.freeze({ x: 0, y: -1 }),
  }),
  Object.freeze({
    caseId: "out-of-range" as const,
    targets: Object.freeze([target("boss-one", "boss", 360, 100)]),
    expected: Object.freeze({ x: 0, y: -1 }),
  }),
  Object.freeze({
    caseId: "stale-old" as const,
    targets: Object.freeze([target("enemy-one", "enemy", 460, 600)]),
    mutateAfterFirstUpdate: Object.freeze({ position: { x: 360, y: 700 } }),
    expected: Object.freeze({ x: 1, y: 0 }),
  }),
  Object.freeze({
    caseId: "stale-new" as const,
    targets: Object.freeze([target("enemy-one", "enemy", 460, 600)]),
    mutateAfterFirstUpdate: Object.freeze({ position: { x: 360, y: 700 } }),
    updateAfterMutation: true,
    expected: Object.freeze({ x: 0, y: 1 }),
  }),
  Object.freeze({
    caseId: "stale-fallback" as const,
    targets: Object.freeze([target("enemy-one", "enemy", 460, 600)]),
    mutateAfterFirstUpdate: Object.freeze({ active: false }),
    updateAfterMutation: true,
    expected: Object.freeze({ x: 0, y: -1 }),
  }),
]);

export function createBatch2NearestBrowserConformanceRuntime(): Batch2NearestBrowserConformanceRuntime {
  const completedCases: Batch2NearestCaseEvidence[] = [];
  let destroyed = false;

  const executeScenario = (
    scenario: (typeof scenarios)[number],
    deltaMs: number,
  ): Batch2NearestCaseEvidence => {
    const host = new DeterministicActorSnapshotHostV13(
      batch2NearestGraph.actorSnapshotGrants,
    );
    host.register(player);
    for (const actor of scenario.targets) host.register(actor);
    const owner = {
      actorId: "player-one",
      active: true,
      position: { x: 360, y: 600 },
      velocity: { x: 0, y: 0 },
    };
    const inputs = new Map<string, (value: unknown) => unknown>();
    const active = new Map<string, unknown>();
    let direction = Object.freeze({ x: Number.NaN, y: Number.NaN });
    let actorReads = 0;
    let snapshotSequence = 0;
    const createContext = (
      module: (typeof batch2NearestGraph.modules)[number],
      clock: unknown,
    ) => ({
      identity: {
        instanceId: module.instanceId,
        ownerId: module.ownerId,
        moduleId: module.moduleId,
        version: module.version,
        artifactEnvelopeSha256: module.artifactIdentity!.envelopeSha256,
      },
      configuration: module.configuration,
      services: {
        viewport: { read: () => ({ width: 720, height: 720 }) },
        actors: {
          readOwner: () => owner,
          writeOwnerMotion: () => undefined,
          writeOwnerPosition: () => undefined,
        },
        input: {
          register: (id: string, handler: (value: unknown) => unknown) => {
            const key = `${module.instanceId}:${id}`;
            inputs.set(key, handler);
            return () => inputs.delete(key);
          },
        },
        overlaps: { register: () => () => undefined },
        channels: {
          activate: (_channelId: string, entity: unknown) => {
            const value = entity as {
              entityId: string;
              velocity: Readonly<{ x: number; y: number }>;
            };
            const speed = Math.hypot(value.velocity.x, value.velocity.y);
            direction = Object.freeze({
              x: value.velocity.x / speed,
              y: value.velocity.y / speed,
            });
            const reference = Object.freeze({
              ...value,
              channelId: `${module.instanceId}.projectiles`,
              ownerActorId: module.ownerId,
              entityRole: "projectile" as const,
            });
            active.set(value.entityId, reference);
            return reference;
          },
          recycle: (_channelId: string, entity: unknown) =>
            active.delete((entity as { entityId: string }).entityId),
          read: () => Object.freeze([]),
        },
        observation: { register: () => () => undefined },
        contact: {
          executePolicy: () => undefined,
          prepareCommit: () => undefined,
        },
        actorSnapshots: {
          read: (grantId: string) => {
            actorReads += 1;
            return host.snapshot(
              module.instanceId,
              grantId,
              snapshotSequence,
              snapshotSequence++,
            );
          },
        },
      },
      ports: {
        declareHandler: () => undefined,
        declareAddressedHandler: () => undefined,
        publishState: () => undefined,
        emitEvent: () => undefined,
      },
      clock,
      assets: {
        requireTexture: () => batch2NearestGraph.assetBindings[0]!.textureKey,
        optionalTexture: () => undefined,
      },
    });
    const runtime = DeterministicGameModuleProductionInstantiatorV13.create({
      graph: batch2NearestGraph,
      catalog: batch2NearestRuntimeCatalog,
      createContextV12: (module, clock) =>
        createContext(module, clock) as never,
      createContextV13: (module, clock) =>
        createContext(module, clock) as never,
      registerAddressedHandler: () => undefined,
    });
    runtime.initialize();
    runtime.start();
    runtime.frame(deltaMs);
    if (scenario.mutateAfterFirstUpdate !== undefined) {
      host.update("enemy-one", scenario.mutateAfterFirstUpdate);
      if (scenario.updateAfterMutation === true) runtime.frame(deltaMs);
    }
    const actorReadsBeforeAttack = actorReads;
    inputs.get("attack-intent:attack.pointer-down")!({ id: 1 });
    inputs.get("attack-intent:attack.pointer-up")!({ id: 1 });
    const actorReadsAfterAttack = actorReads;
    runtime.stop();
    runtime.dispose();
    runtime.destroy();
    return Object.freeze({
      caseId: scenario.caseId,
      direction,
      actorReadsBeforeAttack,
      actorReadsAfterAttack,
      noReresolve: actorReadsBeforeAttack === actorReadsAfterAttack,
      cleanupResidue: active.size + inputs.size,
    });
  };

  const snapshot = (): Batch2NearestBrowserConformanceSnapshot => {
    const allPassed =
      completedCases.length === scenarios.length &&
      completedCases.every((evidence, index) => {
        const expected = scenarios[index]!.expected;
        return (
          evidence.caseId === scenarios[index]!.caseId &&
          Math.abs(evidence.direction.x - expected.x) <= 1e-9 &&
          Math.abs(evidence.direction.y - expected.y) <= 1e-9 &&
          evidence.noReresolve &&
          evidence.cleanupResidue === 0
        );
      });
    return Object.freeze({
      phase: destroyed
        ? "destroyed"
        : completedCases.length === scenarios.length
          ? "complete"
          : "running",
      completedCases: Object.freeze([...completedCases]),
      allPassed,
    });
  };

  return Object.freeze({
    frame: (deltaMs: number) => {
      if (destroyed || completedCases.length >= scenarios.length) return;
      if (!Number.isFinite(deltaMs) || deltaMs < 0)
        throw new Error("invalid nearest conformance delta");
      completedCases.push(
        executeScenario(
          scenarios[completedCases.length]!,
          Math.floor(Math.min(250, deltaMs)),
        ),
      );
    },
    snapshot,
    destroy: () => {
      destroyed = true;
    },
  });
}
