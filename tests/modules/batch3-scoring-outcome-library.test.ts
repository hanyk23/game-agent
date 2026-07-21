import { describe, expect, it } from "vitest";

import {
  BATCH3_SCORING_OUTCOME_DEFINITIONS,
  createBatch3ScoringOutcomeRegistry,
} from "../../src/modules/batch3-scoring-outcome-library.js";
import { createModuleArtifactHashDescriptor } from "../../src/modules/game-module-execution-contract.js";
import { FrameTailOutcomeAuthorityAdapterV14 } from "../../src/modules/game-module-outcome-authority-adapter-v14.js";
import { FrameTailOutcomeHostV1 } from "../../src/modules/game-module-outcome-host.js";
import { GraphTransitionGuard } from "../../src/modules/game-module-runtime-abi-v12.js";

function factoryFor(index: number) {
  const definition = BATCH3_SCORING_OUTCOME_DEFINITIONS[index]!;
  const implementationBundle = new TextEncoder().encode(
    definition.implementationSource,
  );
  const artifact = createModuleArtifactHashDescriptor({
    manifest: definition.manifest,
    configurationDescriptor: definition.configurationDescriptor,
    reservationDescriptor: definition.reservationDescriptor,
    implementationBundle,
    dependencyLockIdentity: new TextEncoder().encode(
      "pnpm-lock.batch3.scoring-outcome.v1",
    ),
    toolchainIdentity: new TextEncoder().encode(
      "typescript-5.9.3.esm-self-contained.batch3.scoring-outcome.v1",
    ),
  });
  return async () => {
    const registry = await createBatch3ScoringOutcomeRegistry();
    return registry.findExactProductionV14(
      definition.manifest.moduleId,
      definition.manifest.version,
      artifact.envelopeSha256,
    )!.executableHandle!.loadedExport as (context: unknown) => any;
  };
}

describe("Batch 3 scoring and outcome production catalog", () => {
  it("loader-admits the scoring/outcome factories without re-admitting frozen graze", async () => {
    const registry = await createBatch3ScoringOutcomeRegistry();
    expect(
      BATCH3_SCORING_OUTCOME_DEFINITIONS.map(
        ({ manifest }) => `${manifest.moduleId}@${manifest.version}`,
      ),
    ).toEqual([
      "scoring.defeat@1.0.0",
      "scoring.combo@1.0.0",
      "scoring.pickup@1.0.0",
      "scoring.graze@1.0.0",
      "scoring.ledger@1.0.0",
      "outcome.player-health@1.0.0",
      "outcome.boss-defeat@1.0.0",
      "outcome.score-threshold@1.0.0",
      "outcome.survival-time@1.0.0",
      "outcome.coordinator@1.0.0",
    ]);
    expect(registry).toBeDefined();
    for (const definition of BATCH3_SCORING_OUTCOME_DEFINITIONS)
      expect(definition.implementationSource).toContain(
        "export function create",
      );
  });

  it("keeps combo scoring source-only and lets the coordinator commit only the selected win-first view", async () => {
    const combo = await factoryFor(1)();
    const handlers = new Map<string, (value: any) => unknown>();
    const transactions: any[] = [];
    combo({
      identity: { instanceId: "combo" },
      configuration: { comboWindowMs: 100, multiplierCap: 2 },
      clock: { nowMs: () => 10 },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        emitEvent: (_id: string, payload: unknown) =>
          transactions.push(payload),
      },
    });
    handlers.get("sources")!({
      kind: "defeat",
      baseAward: 4,
      sourceEvidenceId: "defeat:a",
    });
    handlers.get("sources")!({
      kind: "defeat",
      baseAward: 4,
      sourceEvidenceId: "defeat:b",
    });
    expect(transactions.map((value) => value.award)).toEqual([4, 8]);

    const coordinator = await factoryFor(9)();
    const commits: unknown[] = [];
    const participant = coordinator({
      identity: { instanceId: "coordinator" },
      configuration: {},
      services: {
        outcomeCommit: {
          commit: (_id: string, value: unknown) => commits.push(value),
        },
      },
    });
    participant.arbitrateOutcomeFrameTail({
      win: {
        met: true,
        candidate: "win",
        reason: "boss-defeat",
        evidenceId: "boss:defeat",
      },
      loss: {
        met: true,
        candidate: "loss",
        reason: "player-health",
        evidenceId: "player:zero",
      },
    });
    expect(commits).toEqual([
      {
        outcome: "win",
        reason: "boss-defeat",
        conditionEvidenceId: "boss:defeat",
      },
    ]);
  });

  it("scores only a successfully deactivated health-depleted root lifecycle", async () => {
    const defeat = await factoryFor(0)();
    const handlers = new Map<string, (value: any) => unknown>();
    const sources: any[] = [];
    defeat({
      identity: { instanceId: "defeat-score" },
      configuration: { scoreBySourceId: { scout: 40 } },
      clock: { nowMs: () => 25 },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        emitEvent: (_id: string, value: unknown) => sources.push(value),
      },
    });
    const lifecycle = {
      rootChannelId: "root-channel.enemy-waves.enemy.roots",
      actorId: "root/enemy-waves/0",
      actorGeneration: 2,
      sourceId: "scout",
    };
    handlers.get("defeats")!({ ...lifecycle, reason: "offscreen" });
    handlers.get("defeats")!({ ...lifecycle, reason: "health-depleted" });
    expect(sources).toEqual([
      expect.objectContaining({
        kind: "defeat",
        baseAward: 40,
        sourceEvidenceId:
          "defeat:root-channel.enemy-waves.enemy.roots:root/enemy-waves/0:2",
      }),
    ]);
  });

  it("converts frozen per-channel graze evidence into a stable flat score route", async () => {
    const graze = await factoryFor(3)();
    const handlers = new Map<string, (value: any) => unknown>();
    const transactions: any[] = [];
    graze({
      identity: { instanceId: "graze-score" },
      configuration: { award: 0.25 },
      clock: { nowMs: () => 16 },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        emitEvent: (_id: string, value: unknown) => transactions.push(value),
      },
    });
    const frozenGrazeEvidence = {
      sequence: 0,
      emittedAtMs: 16,
      channelId: "enemy-radial.projectiles",
      entityId: "projectile-4",
      generation: 2,
      playerActorId: "player-one",
    };
    handlers.get("grazes")!(frozenGrazeEvidence);
    handlers.get("grazes")!(frozenGrazeEvidence);
    expect(transactions).toEqual([
      expect.objectContaining({
        kind: "graze",
        award: 0.25,
        sourceEvidenceId:
          "graze:enemy-radial.projectiles:projectile-4:2:player-one",
      }),
      expect.objectContaining({
        sourceEvidenceId:
          "graze:enemy-radial.projectiles:projectile-4:2:player-one",
      }),
    ]);
  });

  it("routes an actual Boss-defeat provider through the frame-tail host before the actual coordinator can commit", async () => {
    const guard = new GraphTransitionGuard();
    const host = new FrameTailOutcomeHostV1({
      guard,
      winProviderInstanceId: "boss-defeat",
      lossProviderInstanceId: "player-health",
      commitServiceId: "outcome.commit",
      firstFrameSequence: 1,
    });
    const decisions: unknown[] = [];
    const authority = new FrameTailOutcomeAuthorityAdapterV14({
      host,
      readElapsedMs: () => 16,
      readScore: () => 0,
      cleanup: () => ({ graphClean: true, quarantineClean: true }),
      transition: (decision) => decisions.push(decision),
    });
    const handlers = new Map<string, (value: any) => unknown>();
    const bossDefeat = await factoryFor(6)();
    bossDefeat({
      identity: { instanceId: "boss-defeat" },
      configuration: { candidate: "win" },
      clock: { nowMs: () => 16 },
      ports: {
        declareHandler: (id: string, handler: (value: any) => unknown) =>
          handlers.set(id, handler),
        publishState: (_id: string, proposal: any) =>
          authority.publishCondition({
            providerInstanceId: "boss-defeat",
            ...proposal,
          }),
      },
    });
    const coordinatorFactory = await factoryFor(9)();
    const coordinator = coordinatorFactory({
      identity: { instanceId: "coordinator" },
      configuration: {},
      services: { outcomeCommit: authority },
    });
    guard.run("frame", () => {
      authority.beginFrame(1);
      handlers.get("lifecycle")!({
        actorRole: "boss",
        reason: "health-depleted",
        actorId: "root/boss-phases/0",
        actorGeneration: 0,
      });
      authority.arbitrateFrameTail(1, coordinator.arbitrateOutcomeFrameTail);
    });
    authority.afterGuard(1);
    expect(decisions).toEqual([
      expect.objectContaining({ outcome: "win", reason: "boss-defeat" }),
    ]);
  });
});
