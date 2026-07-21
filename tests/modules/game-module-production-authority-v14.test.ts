import { describe, expect, it, vi } from "vitest";

import { GraphAuthorityFacadeHostV14 } from "../../src/modules/game-module-production-authority-v14.js";
import type { ResolvedModuleGraphV14 } from "../../src/modules/game-module-resolver-v14.js";

function graph(): ResolvedModuleGraphV14 {
  return {
    graphVersion: "1.4.0",
    executionReadiness: { status: "ready", evidenceId: "a".repeat(64) },
    modules: [
      "producer",
      "consumer",
      "delivery",
      "coordinator",
      "ledger",
      "outcome-win",
      "outcome-loss",
    ].map((instanceId) => ({
      instanceId,
      runtimePorts:
        instanceId === "coordinator"
          ? {
              inputPorts: [
                {
                  id: "win",
                  payloadType: "outcome-condition-v1",
                  delivery: "state",
                },
                {
                  id: "loss",
                  payloadType: "outcome-condition-v1",
                  delivery: "state",
                },
              ],
              outputPorts: [],
            }
          : ["outcome-win", "outcome-loss"].includes(instanceId)
            ? {
                inputPorts: [],
                outputPorts: [
                  {
                    id: "condition",
                    payloadType: "outcome-condition-v1",
                    delivery: "state",
                  },
                ],
              }
            : { inputPorts: [], outputPorts: [] },
    })),
    bindings: [
      {
        from: { instanceId: "consumer", portId: "score.out" },
        to: { instanceId: "ledger", portId: "score.in" },
        payloadType: "score-transaction-v1",
        delivery: "event",
      },
      {
        from: { instanceId: "outcome-win", portId: "condition" },
        to: { instanceId: "coordinator", portId: "win" },
        payloadType: "outcome-condition-v1",
        delivery: "state",
      },
      {
        from: { instanceId: "outcome-loss", portId: "condition" },
        to: { instanceId: "coordinator", portId: "loss" },
        payloadType: "outcome-condition-v1",
        delivery: "state",
      },
    ],
    actorSnapshotGrants: [],
    entityChannelReadGrants: [],
    pickupEffectPlans: [],
    actorRootChannels: [
      {
        rootChannelId: "roots.enemy",
        producerInstanceId: "producer",
        consumerGrants: [
          { bindingId: "binding.enemy", consumerInstanceId: "consumer" },
        ],
      },
    ],
    actorRootMutationGrants: [
      { grantId: "mutation.enemy", consumerInstanceId: "consumer" },
    ],
    hostileAttackChannels: [
      {
        lineageId: "lineage.enemy",
        deliveryInstanceId: "delivery",
        contentionGroupId: "contention.hostile",
      },
    ],
    scoringAuthority: {
      ledgerInstanceId: "ledger",
      duplicateCapacity: 1,
      capacityEvidenceId: "b".repeat(64),
      awardProfile: "bounded-score-number-v1",
      additionOrder: "stable-router-order-binary64-v1",
      sourceRoutes: [
        {
          sourceInstanceId: "consumer",
          sourcePortId: "score.out",
          ledgerPortId: "score.in",
          maximumAward: 7.5,
          evidenceId: "c".repeat(64),
        },
      ],
    },
    outcomeAuthority: {
      coordinatorInstanceId: "coordinator",
      winConditionInstanceId: "outcome-win",
      lossConditionInstanceId: "outcome-loss",
      winConditionStateInputPort: "win",
      lossConditionStateInputPort: "loss",
      commitServiceId: "outcome.commit",
    },
  } as unknown as ResolvedModuleGraphV14;
}

describe("Graph 1.4 production authority facade", () => {
  it("projects only instance-bound grants and rechecks every opaque ID", () => {
    const calls: string[] = [];
    const host = new GraphAuthorityFacadeHostV14(graph(), {
      actorRoots: {
        activate: (id) => calls.push(`activate:${id}`),
        deactivate: (id) => calls.push(`deactivate:${id}`),
      },
      actorRootSnapshots: { read: (id) => calls.push(`read:${id}`) },
      actorRootMutation: {
        deactivate: (id) => calls.push(`mutate:${id}`),
      },
      hostileProjectileDelivery: {
        admit: (lineage, group) => calls.push(`admit:${lineage}:${group}`),
        recycle: (lineage, group) => calls.push(`recycle:${lineage}:${group}`),
        observe: (lineage, group) => calls.push(`observe:${lineage}:${group}`),
      },
      hostileAttackLineage: {
        readActiveSource: () => ({ position: { x: 0, y: 0 } }),
      },
      outcomeCommit: {
        publishCondition: () => undefined,
        commit: (id) => calls.push(`commit:${id}`),
        beginFrame: (frame) => calls.push(`begin:${frame}`),
        arbitrateFrameTail: (frame) => calls.push(`tail:${frame}`),
        afterGuard: (frame) => calls.push(`after:${frame}`),
      },
    });
    host.initializeScoreLedger(() => 0);
    const producer = host.servicesForInstance("producer");
    producer.actorRoots!.activate("roots.enemy", {});
    expect(() => producer.actorRoots!.activate("roots.boss", {})).toThrow(
      /undeclared actor-root producer grant/,
    );
    const consumer = host.servicesForInstance("consumer");
    consumer.actorRootSnapshots!.read("binding.enemy");
    consumer.actorRootMutation!.deactivate("mutation.enemy", {});
    expect(consumer.actorRoots).toBeUndefined();
    const delivery = host.servicesForInstance("delivery");
    delivery.hostileProjectileDelivery!.admit("lineage.enemy", {});
    expect(() =>
      delivery.hostileProjectileDelivery!.observe("lineage.boss"),
    ).toThrow(/undeclared hostile projectile delivery grant/);
    host
      .servicesForInstance("coordinator")
      .outcomeCommit!.commit("outcome.commit", {});
    const transaction = Object.freeze({
      sequence: 0,
      emittedAtMs: 0,
      sourceEvidenceId: "score:consumer:1",
      kind: "pickup" as const,
      award: 7.5,
    });
    expect(
      host.applyScoreTransaction({
        ledgerInstanceId: "ledger",
        sourceInstanceId: "consumer",
        sourcePortId: "score.out",
        ledgerPortId: "score.in",
        transaction,
      }),
    ).toMatchObject({ total: 7.5, transactionCount: 1 });
    expect(() =>
      host.applyScoreTransaction({
        ledgerInstanceId: "other-ledger",
        sourceInstanceId: "consumer",
        sourcePortId: "score.out",
        ledgerPortId: "score.in",
        transaction,
      }),
    ).toThrow(/undeclared authoritative score ledger/);
    expect(calls).toEqual([
      "activate:roots.enemy",
      "read:binding.enemy",
      "mutate:mutation.enemy",
      "admit:lineage.enemy:contention.hostile",
      "commit:outcome.commit",
    ]);
    host.disposeScoreLedger();
  });

  it("fails closed when a resolved authority lacks its trusted adapter", () => {
    expect(() => new GraphAuthorityFacadeHostV14(graph(), {})).toThrow(
      /missing Graph 1.4 authority adapter: actorRoots/,
    );
    const unused = vi.fn();
    expect(unused).not.toHaveBeenCalled();
  });

  it("projects actor-set health and V2 contact commits only to resolved instances", () => {
    const resolved = structuredClone(graph()) as any;
    resolved.modules.push(
      {
        instanceId: "health-bank",
        moduleId: "combat.health",
        version: "1.2.0",
        factoryContextVersion: "1.4.0",
        runtimeContract: { contactCommit: null },
        runtimePorts: { inputPorts: [], outputPorts: [] },
      },
      {
        instanceId: "contact-resolution",
        moduleId: "interaction.contact-resolution",
        version: "1.2.0",
        factoryContextVersion: "1.4.0",
        runtimeContract: {
          contactCommit: {
            commitServiceId: "contact.commit.v2",
            maximumConcurrentCommits: 4,
            admittedOperations: ["consume", "deactivate-root"],
          },
        },
        runtimePorts: { inputPorts: [], outputPorts: [] },
      },
      {
        instanceId: "body-contact",
        moduleId: "interaction.actor-root-contact",
        version: "1.0.0",
        factoryContextVersion: "1.4.0",
        runtimeContract: { contactCommit: null },
        runtimePorts: { inputPorts: [], outputPorts: [] },
      },
    );
    resolved.actorSetDamageRoutes = [
      {
        routeId: "damage.enemy",
        rootChannelId: "roots.enemy",
        orderedSinkInstanceIds: ["health-bank"],
      },
    ];
    const calls: string[] = [];
    const host = new GraphAuthorityFacadeHostV14(resolved, {
      actorRoots: { activate: () => undefined, deactivate: () => undefined },
      actorRootSnapshots: { read: () => undefined },
      actorRootMutation: { deactivate: () => undefined },
      actorSetHealth: {
        damage: (routeId, instanceId) =>
          calls.push(`health:${routeId}:${instanceId}`),
      },
      contactCandidates: {
        register: (instanceId, kind) => {
          calls.push(`candidates:${instanceId}:${kind}`);
          return () => calls.push(`candidates-stop:${instanceId}`);
        },
      },
      contactCommitV2: {
        commit: (instanceId) => calls.push(`contact:${instanceId}`),
      },
      hostileProjectileDelivery: {
        admit: () => undefined,
        recycle: () => undefined,
        observe: () => undefined,
      },
      hostileAttackLineage: {
        readActiveSource: () => ({ position: { x: 0, y: 0 } }),
      },
      outcomeCommit: {
        publishCondition: () => undefined,
        commit: () => undefined,
        beginFrame: () => undefined,
        arbitrateFrameTail: () => undefined,
        afterGuard: () => undefined,
      },
    });
    host
      .servicesForInstance("health-bank")
      .actorSetHealth!.damage("damage.enemy", {});
    expect(() =>
      host
        .servicesForInstance("health-bank")
        .actorSetHealth!.damage("damage.boss", {}),
    ).toThrow(/undeclared actor-set health route/);
    host.servicesForInstance("contact-resolution").contactCommitV2!.commit({});
    const stop = host
      .servicesForInstance("body-contact")
      .contactCandidates!.register(() => undefined);
    stop();
    expect(
      host.servicesForInstance("consumer").contactCommitV2,
    ).toBeUndefined();
    expect(calls).toEqual([
      "health:damage.enemy:health-bank",
      "contact:contact-resolution",
      "candidates:body-contact:actor-root-player",
      "candidates-stop:body-contact",
    ]);
  });

  it("rejects swapped or additional win/loss coordinator input bindings", () => {
    const adapters = () => ({
      actorRoots: {
        activate: () => undefined,
        deactivate: () => undefined,
      },
      actorRootSnapshots: { read: () => undefined },
      actorRootMutation: { deactivate: () => undefined },
      hostileProjectileDelivery: {
        admit: () => undefined,
        recycle: () => undefined,
        observe: () => undefined,
      },
      hostileAttackLineage: {
        readActiveSource: () => ({ position: { x: 0, y: 0 } }),
      },
      outcomeCommit: {
        publishCondition: () => undefined,
        commit: () => undefined,
        beginFrame: () => undefined,
        arbitrateFrameTail: () => undefined,
        afterGuard: () => undefined,
      },
    });
    const swapped = graph();
    const bindings = swapped.bindings as Array<{
      from: { instanceId: string; portId: string };
      to: { instanceId: string; portId: string };
    }>;
    bindings.find(
      (binding) => binding.from.instanceId === "outcome-win",
    )!.to.portId = "loss";
    bindings.find(
      (binding) => binding.from.instanceId === "outcome-loss",
    )!.to.portId = "win";
    expect(() => new GraphAuthorityFacadeHostV14(swapped, adapters())).toThrow(
      /exact resolved binding/,
    );

    const extra = graph();
    const extraBindings = extra.bindings as unknown as typeof bindings;
    const extraWin = structuredClone(
      extraBindings.find(
        (binding) => binding.from.instanceId === "outcome-win",
      )!,
    );
    extraWin.to.portId = "loss";
    extraBindings.push(extraWin);
    expect(() => new GraphAuthorityFacadeHostV14(extra, adapters())).toThrow(
      /exact resolved binding/,
    );
  });
});
