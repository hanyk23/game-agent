import { describe, expect, it } from "vitest";

import {
  AttackRequestPayloadV2Schema,
  ContactDecisionPayloadV2Schema,
  HealthStatePayloadV3Schema,
  RuntimePayloadSchemas,
  ScoreTransactionPayloadSchema,
  TargetedAttackPayloadSchema,
} from "../../src/modules/game-module-runtime-payloads.js";

const request = {
  sequence: 1,
  emittedAtMs: 10,
  requestedAtMs: 10,
  attackChannelId: "enemy-main",
  rootChannelId: "enemy-roots",
  sourceActorId: "root/waves/0",
  sourceGeneration: 2,
  patternSourceId: "radial",
  emissionIndex: 0,
};

const projectileRootCandidate = {
  sequence: 1,
  emittedAtMs: 10,
  contactId: "projectile-root",
  contactSequence: 3,
  damage: 5,
  contactKind: "projectile-root" as const,
  sourceChannelId: "player-projectiles",
  sourceEntityId: "projectile-one",
  sourceGeneration: 1,
  sourceActorId: "player-one",
  targetRootChannelId: "enemy-roots",
  targetActorId: "root/waves/0",
  targetActorGeneration: 2,
};

describe("ADR 0028 runtime payload registry", () => {
  it("registers every strict Batch 3 payload without changing V2 semantics", () => {
    for (const payloadType of [
      "actor-root-channel-v1",
      "actor-root-lifecycle-v1",
      "actor-defeated-v1",
      "encounter-pattern-activation-v1",
      "encounter-handoff-v1",
      "attack-request-v3",
      "targeted-attack-v1",
      "emission-v2",
      "contact-candidate-v2",
      "contact-decision-v2",
      "damage-v2",
      "health-state-v3",
      "defeat-evidence-v1",
      "score-source-v1",
      "score-transaction-v1",
      "score-state-v1",
      "outcome-condition-v1",
      "terminal-decision-v1",
    ])
      expect(RuntimePayloadSchemas).toHaveProperty(payloadType);
    expect(
      AttackRequestPayloadV2Schema.safeParse({
        sequence: 0,
        emittedAtMs: 0,
        requestedAtMs: 0,
        attackChannelId: "primary",
        slot: "primary",
        sourceActorId: "root/waves/0",
      }).success,
    ).toBe(false);
  });

  it("keeps Boss handoff request and cleared acknowledgement strict", () => {
    const handoff = {
      sequence: 0,
      emittedAtMs: 100,
      handoffId: "waves-to-boss",
      bossStartMs: 100,
      status: "requested" as const,
    };
    expect(
      RuntimePayloadSchemas["encounter-handoff-v1"].parse(handoff),
    ).toEqual(handoff);
    expect(
      RuntimePayloadSchemas["encounter-handoff-v1"].safeParse({
        ...handoff,
        status: "cleared",
        rootActorId: "root/boss/0",
      }).success,
    ).toBe(false);
  });

  it("preserves exact V3 source lineage through targeting", () => {
    expect(
      TargetedAttackPayloadSchema.parse({
        ...request,
        sourcePosition: { x: 10, y: 20 },
        direction: { x: 0, y: 1 },
      }),
    ).toMatchObject(request);
    for (const invalid of [
      { ...request, sourceActorId: "enemy-one" },
      { ...request, sourceGeneration: -1 },
      { ...request, unexpected: true },
    ])
      expect(
        RuntimePayloadSchemas["attack-request-v3"].safeParse(invalid).success,
      ).toBe(false);
  });

  it("allows only the two reviewed V2 contact/source-operation pairs", () => {
    expect(
      ContactDecisionPayloadV2Schema.safeParse({
        candidate: projectileRootCandidate,
        disposition: "damage",
        sourceOperation: "consume",
        damage: 5,
        routeId: "enemy-health",
      }).success,
    ).toBe(true);
    expect(
      ContactDecisionPayloadV2Schema.safeParse({
        candidate: projectileRootCandidate,
        disposition: "damage",
        sourceOperation: "deactivate-root",
        damage: 5,
        routeId: "player-health",
      }).success,
    ).toBe(false);
  });

  it("preserves fractional awards and rejects ratio/non-finite/unknown drift", () => {
    expect(
      ScoreTransactionPayloadSchema.parse({
        sequence: 0,
        emittedAtMs: 0,
        sourceEvidenceId: "pickup:one:1",
        kind: "pickup",
        award: 7.5,
      }).award,
    ).toBe(7.5);
    expect(
      ScoreTransactionPayloadSchema.safeParse({
        sequence: 0,
        emittedAtMs: 0,
        sourceEvidenceId: "pickup:one:1",
        kind: "pickup",
        award: Number.POSITIVE_INFINITY,
      }).success,
    ).toBe(false);
    expect(
      HealthStatePayloadV3Schema.safeParse({
        revision: 0,
        emittedAtMs: 0,
        rootChannelId: "enemy-roots",
        actorId: "root/waves/0",
        actorGeneration: 0,
        actorRole: "enemy",
        sourceId: "wave-scout",
        current: 5,
        maximum: 10,
        ratio: 0.4,
        reason: "damaged",
      }).success,
    ).toBe(false);
  });
});
