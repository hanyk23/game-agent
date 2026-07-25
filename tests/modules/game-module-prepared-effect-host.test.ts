import { describe, expect, it, vi } from "vitest";

import {
  PreparedEffectCommitHostV1,
  PreparedEffectHostError,
  PreparedEffectHostErrorCode,
  type PreparedEffectHostV1Options,
} from "../../src/modules/game-module-prepared-effect-host.js";
import type { ResolvedEffectApplicationRouteV13 } from "../../src/modules/game-module-resolver.js";

const token = Object.freeze({ token: "event" });
const collected = Object.freeze({
  sourceChannelId: "pickup.channel",
  sourceEntityId: "pickup-one",
  sourceGeneration: 1,
  targetActorId: "player-one",
  effectId: "heal",
  value: 5,
});

function route(
  routeId: string,
  targetInstanceId: string,
  fieldId:
    "combat.health.current" | "combat.shield.current" = "combat.health.current",
): ResolvedEffectApplicationRouteV13 {
  return Object.freeze({
    routeId,
    bindingId: `${routeId}.binding`,
    sourceInstanceId: "pickup-collect",
    applicationRouteSourceId: "applications",
    targetInstanceId,
    targetInputPort: "modifier",
    fieldId,
    operation: "add",
    payloadType: "modifier-application-v1",
    targetLeaseId: `start/effect-target/${routeId}`,
  });
}

function application(resolved: ResolvedEffectApplicationRouteV13, value = 5) {
  return Object.freeze({
    routeId: resolved.routeId,
    targetInstanceId: resolved.targetInstanceId,
    fieldId: resolved.fieldId,
    operation: "add" as const,
    value,
  });
}

function hostOptions(
  overrides: Partial<PreparedEffectHostV1Options> = {},
): PreparedEffectHostV1Options {
  return {
    maximumConcurrentCommits: 1,
    duplicateLedgerCapacity: 4,
    maximumApplicationsPerCommit: 4,
    routes: [],
    planner: () => [],
    assertRunningEventToken: (received) => {
      if (received !== token) throw new Error("wrong token");
    },
    nowMs: () => 10,
    consumeSource: () => "consumed",
    quarantineSource: () => undefined,
    deliverCollected: () => undefined,
    recordFailure: () => undefined,
    ...overrides,
  };
}

describe("ADR 0027 prepared effect host", () => {
  it("clears route, provisional, and durable residue on graph disposal", () => {
    const healthRoute = route("pickup.health", "health");
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        routes: [healthRoute],
        planner: () => [application(healthRoute)],
      }),
    );
    host.startRoute(healthRoute.routeId, () => undefined);
    host.prepare(token, "durable.1", collected).commit();
    host.prepare(token, "provisional.1", collected);
    expect(host.activeRouteCount).toBe(1);
    expect(host.durableSourceCount).toBe(1);
    expect(host.activePreparedCount).toBe(1);

    host.dispose();
    host.dispose();
    expect(host.activeRouteCount).toBe(0);
    expect(host.durableSourceCount).toBe(0);
    expect(host.activePreparedCount).toBe(0);
    expect(() => host.prepare(token, "after.1", collected)).toThrow(
      expect.objectContaining({
        code: PreparedEffectHostErrorCode.invalidPhaseOrToken,
      }),
    );
  });

  it("atomically releases provisional resources on every failed prepare", () => {
    let fail = true;
    const consume = vi.fn(() => "consumed" as const);
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        planner: () => {
          if (fail) throw new Error("planner failure");
          return [];
        },
        consumeSource: consume,
      }),
    );
    for (let index = 0; index < 8; index += 1) {
      expect(() => host.prepare(token, "pickup-one.1", collected)).toThrow(
        "planner failure",
      );
      expect(host.activePreparedCount).toBe(0);
      expect(host.hasDuplicateState("pickup-one.1")).toBe(false);
    }
    fail = false;
    const prepared = host.prepare(token, "pickup-one.1", collected);
    expect(host.activePreparedCount).toBe(1);
    prepared.commit();
    expect(consume).toHaveBeenCalledOnce();
  });

  it("cleans invalid templates and permits same-source retry", () => {
    const healthRoute = route("pickup.health", "health");
    let valid = false;
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        routes: [healthRoute],
        planner: () =>
          valid
            ? [application(healthRoute)]
            : [
                {
                  ...application(healthRoute),
                  routeId: "pickup.unknown",
                },
              ],
      }),
    );
    expect(() => host.prepare(token, "pickup-one.1", collected)).toThrow(
      PreparedEffectHostError,
    );
    expect(host.activePreparedCount).toBe(0);
    valid = true;
    const stop = host.startRoute(healthRoute.routeId, () => undefined);
    host.prepare(token, "pickup-one.1", collected).commit();
    stop();
  });

  it("rejects thenable, missing, reserved-field, and over-ceiling plans without leaks", () => {
    const healthRoute = route("pickup.health", "health");
    const invalidPlans = [
      Promise.resolve([]),
      undefined,
      [
        {
          ...application(healthRoute),
          sequence: 99,
        },
      ],
      [application(healthRoute), application(healthRoute)],
    ];
    let index = 0;
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        routes: [healthRoute],
        maximumApplicationsPerCommit: 1,
        planner: () => invalidPlans[index++],
      }),
    );
    for (let attempt = 0; attempt < invalidPlans.length; attempt += 1) {
      expect(() => host.prepare(token, "pickup-one.1", collected)).toThrow();
      expect(host.activePreparedCount).toBe(0);
      expect(host.hasDuplicateState("pickup-one.1")).toBe(false);
    }
  });

  it("releases an abandoned capability and rejects inactive routes before mutation", () => {
    const healthRoute = route("pickup.health", "health");
    const consume = vi.fn(() => "consumed" as const);
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        routes: [healthRoute],
        planner: () => [application(healthRoute)],
        consumeSource: consume,
      }),
    );
    host.prepare(token, "pickup-one.1", collected).abandon();
    expect(host.activePreparedCount).toBe(0);
    expect(host.hasDuplicateState("pickup-one.1")).toBe(false);
    expect(() =>
      host.prepare(token, "pickup-one.1", collected).commit(),
    ).toThrow(
      expect.objectContaining({
        code: PreparedEffectHostErrorCode.inactiveRouteLease,
      }),
    );
    expect(consume).not.toHaveBeenCalled();
    expect(host.hasDuplicateState("pickup-one.1")).toBe(false);
  });

  it("delivers each application only to its addressed singleton route", () => {
    const healthRoute = route("pickup.health", "health");
    const shieldRoute = route(
      "pickup.shield",
      "shield",
      "combat.shield.current",
    );
    const health = vi.fn();
    const shield = vi.fn();
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        routes: [healthRoute, shieldRoute],
        planner: () => [application(healthRoute)],
      }),
    );
    host.startRoute(healthRoute.routeId, health);
    host.startRoute(shieldRoute.routeId, shield);
    host.prepare(token, "pickup-one.1", collected).commit();
    expect(health).toHaveBeenCalledOnce();
    expect(shield).not.toHaveBeenCalled();
    expect(health.mock.calls[0]![0]).toMatchObject({
      eventOrdinal: 1,
      routeId: healthRoute.routeId,
      targetInstanceId: "health",
    });
  });

  it("attempts later addressed routes after a post-consume handler failure", () => {
    const healthRoute = route("pickup.health", "health");
    const shieldRoute = route(
      "pickup.shield",
      "shield",
      "combat.shield.current",
    );
    const later = vi.fn();
    const evidence = vi.fn();
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        routes: [healthRoute, shieldRoute],
        planner: () => [application(healthRoute), application(shieldRoute)],
        recordFailure: evidence,
      }),
    );
    host.startRoute(healthRoute.routeId, () => {
      throw new Error("health failed");
    });
    host.startRoute(shieldRoute.routeId, later);
    expect(() =>
      host.prepare(token, "pickup-one.1", collected).commit(),
    ).toThrow(
      expect.objectContaining({
        code: PreparedEffectHostErrorCode.deliveryFailed,
      }),
    );
    expect(later).toHaveBeenCalledOnce();
    expect(evidence).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "delivery-failed", failedOrdinals: [1] }),
    );
  });

  it("allocates one contiguous event block with shared commit identity", () => {
    const healthRoute = route("pickup.health", "health");
    const shieldRoute = route(
      "pickup.shield",
      "shield",
      "combat.shield.current",
    );
    const events: Array<Record<string, number>> = [];
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        routes: [healthRoute, shieldRoute],
        planner: () => [application(healthRoute), application(shieldRoute)],
        deliverCollected: (payload) =>
          events.push(payload as Record<string, number>),
      }),
    );
    host.startRoute(healthRoute.routeId, (payload) =>
      events.push(payload as Record<string, number>),
    );
    host.startRoute(shieldRoute.routeId, (payload) =>
      events.push(payload as Record<string, number>),
    );
    host.prepare(token, "pickup-one.1", collected).commit();
    expect(events.map((event) => event.sequence)).toEqual([0, 1, 2]);
    expect(events.map((event) => event.eventOrdinal)).toEqual([0, 1, 2]);
    expect(new Set(events.map((event) => event.commitSequence))).toEqual(
      new Set([0]),
    );
    expect(new Set(events.map((event) => event.commitEvidenceId))).toEqual(
      new Set([0]),
    );
  });

  it("records indeterminate mutation and delivers no collected or application event", () => {
    const healthRoute = route("pickup.health", "health");
    const collectedDelivery = vi.fn();
    const applicationDelivery = vi.fn();
    const evidence = vi.fn();
    const quarantine = vi.fn();
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        routes: [healthRoute],
        planner: () => [application(healthRoute)],
        consumeSource: () => "indeterminate",
        quarantineSource: quarantine,
        deliverCollected: collectedDelivery,
        recordFailure: evidence,
      }),
    );
    host.startRoute(healthRoute.routeId, applicationDelivery);
    expect(() =>
      host.prepare(token, "pickup-one.1", collected).commit(),
    ).toThrow(
      expect.objectContaining({
        code: PreparedEffectHostErrorCode.sourceMutationIndeterminate,
      }),
    );
    expect(collectedDelivery).not.toHaveBeenCalled();
    expect(applicationDelivery).not.toHaveBeenCalled();
    expect(quarantine).toHaveBeenCalledOnce();
    expect(quarantine).toHaveBeenCalledWith("pickup-one.1");
    expect(evidence).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "mutation-indeterminate",
        eventSequenceBase: 0,
        failedOrdinals: [0, 1],
      }),
    );
    expect(host.hasDuplicateState("pickup-one.1")).toBe(true);
  });

  it("accounts finalization failure identities before mutation and permits retry", () => {
    let nowMs = 0.5;
    const consume = vi.fn(() => "consumed" as const);
    const evidence = vi.fn();
    const delivered = vi.fn();
    const host = new PreparedEffectCommitHostV1(
      hostOptions({
        nowMs: () => nowMs,
        consumeSource: consume,
        deliverCollected: delivered,
        recordFailure: evidence,
      }),
    );
    expect(() =>
      host.prepare(token, "pickup-one.1", collected).commit(),
    ).toThrow();
    expect(consume).not.toHaveBeenCalled();
    expect(delivered).not.toHaveBeenCalled();
    expect(evidence).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "finalization-failed",
        commitSequence: 0,
        commitEvidenceId: 0,
        eventSequenceBase: 0,
        failedOrdinals: [0],
      }),
    );
    expect(host.hasDuplicateState("pickup-one.1")).toBe(false);
    nowMs = 1;
    host.prepare(token, "pickup-one.1", collected).commit();
    expect(consume).toHaveBeenCalledOnce();
    expect(delivered).toHaveBeenCalledWith(
      expect.objectContaining({
        commitSequence: 1,
        commitEvidenceId: 1,
        sequence: 1,
      }),
    );
  });
});
