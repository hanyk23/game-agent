import { beforeAll, describe, expect, it } from "vitest";

import { resolveBatch2VerticalSlice } from "../../src/modules/batch2-vertical-slice.js";
import { ResolvedModuleGraphV13Schema } from "../../src/modules/game-module-resolver.js";
import {
  ResolvedModuleGraphV14Schema,
  type ResolvedModuleGraphV14,
} from "../../src/modules/game-module-resolver-v14.js";

let validGraph: ResolvedModuleGraphV14;

beforeAll(async () => {
  const base = structuredClone((await resolveBatch2VerticalSlice()).graph);
  const template = base.modules[0]!;
  const module = (
    instanceId: string,
    kind: string,
    resources = {
      activeEntities: 0,
      activeProjectiles: 0,
      spawnsPerSecond: 0,
      timers: 0,
    },
  ) => ({
    ...structuredClone(template),
    instanceId,
    ownerId: "world",
    moduleId: `test.${instanceId}`,
    version: "1.0.0",
    kind,
    implementationId: `test.${instanceId}.v1`,
    configurationSchemaId: `test.${instanceId}.config`,
    manifestSchemaVersion: "1.4.0" as const,
    factoryContextVersion: "1.4.0" as const,
    resources,
    resourceGrant: resources,
    runtimePorts: { inputPorts: [], outputPorts: [] },
    runtimeAuthorities: {
      inputRegistrationIds: [],
      observationReaderIds: [],
      ownedChannelIds:
        instanceId === "hostile-delivery" ? ["hostile.projectiles"] : [],
      ownsPlayerLocomotion: false,
    },
  });
  const v14Modules = [
    module("enemy-roots", "encounter-flow"),
    module("hostile-source", "attack-trigger"),
    module("hostile-targeting", "targeting"),
    module("hostile-delivery", "attack-delivery", {
      activeEntities: 4,
      activeProjectiles: 4,
      spawnsPerSecond: 12,
      timers: 0,
    }),
  ];
  const graph = {
    ...base,
    graphVersion: "1.4.0" as const,
    executionReadiness: {
      status: "blocked" as const,
      evidenceId: base.executionReadiness.evidenceId,
    },
    modules: [...base.modules, ...v14Modules],
    constructionOrder: [
      ...base.constructionOrder,
      ...v14Modules.map((entry) => entry.instanceId),
    ],
    actorRootChannels: [
      {
        rootChannelId: "enemy.roots",
        producerInstanceId: "enemy-roots",
        producerId: "enemy.roots.producer",
        actorRole: "enemy" as const,
        capacity: 8,
        poolId: "enemy.pool",
        rootChannelOutputPort: "roots",
        lifecycleOutputPort: "lifecycle",
        consumerGrants: [
          {
            bindingId: "enemy.pattern-source",
            consumerInstanceId: "hostile-source",
            inputPort: "roots",
            expectedActorRole: "enemy" as const,
            purpose: "pattern-source" as const,
            maximumEntries: 8,
          },
        ],
        identityStrategy: "host-minted-lowest-free-slot-v1" as const,
        counterStrategy: "safe-monotonic-v1" as const,
      },
    ],
    hostileAttackChannels: [
      {
        lineageId: "enemy.roots.primary",
        rootChannelId: "enemy.roots",
        attackChannelId: "enemy.primary",
        sourceInstanceId: "hostile-source",
        targetingInstanceId: "hostile-targeting",
        deliveryInstanceId: "hostile-delivery",
        projectileChannelId: "hostile.projectiles",
        requestPayloadType: "attack-request-v3" as const,
        targetedPayloadType: "targeted-attack-v1" as const,
        emissionPayloadType: "emission-v2" as const,
        requiredAssetRole: "enemy-projectile" as const,
        contentionGroupId: "hostile.shared",
      },
    ],
    hostileContentionGroups: [
      {
        groupId: "hostile.shared",
        kind: "hostile-contention-v1" as const,
        memberInstanceIds: ["hostile-delivery"],
        activeEntityCapacity: 8,
        activeProjectileCapacity: 8,
        spawnsPerSecondCapacity: 20,
        ordering: "resolved-provider-order" as const,
      },
    ],
    actorSetDamageRoutes: [],
    actorRootMutationGrants: [],
    contactRoutes: [],
    scoringAuthority: null,
    outcomeAuthority: null,
  };
  validGraph = ResolvedModuleGraphV14Schema.parse(graph);
});

describe("ADR 0028 Graph 1.4 resolver red gate", () => {
  it("accepts an exact actor-root/V3 hostile/contention closure without widening Graph 1.3", () => {
    expect(ResolvedModuleGraphV14Schema.parse(validGraph)).toEqual(validGraph);
    expect(() => ResolvedModuleGraphV13Schema.parse(validGraph)).toThrow();
  });

  it("does not label a partial authority plan ready", () => {
    const graph = structuredClone(validGraph);
    graph.executionReadiness.status = "ready";
    expect(() => ResolvedModuleGraphV14Schema.parse(graph)).toThrow(
      /requires actor-set, scoring, and outcome authority closure/,
    );
  });

  it("rejects unbound extra outcome ports at the serialized graph boundary", () => {
    const graph = structuredClone(validGraph);
    const template = graph.modules.find(
      (entry) => entry.instanceId === "hostile-source",
    )!;
    const provider = (instanceId: string, outputIds: readonly string[]) => ({
      ...structuredClone(template),
      instanceId,
      moduleId: `test.${instanceId}`,
      implementationId: `test.${instanceId}.v1`,
      runtimePorts: {
        inputPorts: [],
        outputPorts: outputIds.map((id) => ({
          id,
          payloadType: "outcome-condition-v1",
          delivery: "state" as const,
        })),
      },
    });
    const win = provider("outcome-win", ["condition", "extra-condition"]);
    const loss = provider("outcome-loss", ["condition"]);
    const coordinator = {
      ...structuredClone(template),
      instanceId: "outcome-coordinator",
      moduleId: "test.outcome-coordinator",
      implementationId: "test.outcome-coordinator.v1",
      runtimePorts: {
        inputPorts: [
          {
            id: "win",
            payloadType: "outcome-condition-v1",
            delivery: "state" as const,
            required: true,
          },
          {
            id: "loss",
            payloadType: "outcome-condition-v1",
            delivery: "state" as const,
            required: true,
          },
        ],
        outputPorts: [],
      },
    };
    graph.modules.push(win, loss, coordinator);
    graph.constructionOrder.push(
      "outcome-win",
      "outcome-loss",
      "outcome-coordinator",
    );
    graph.bindings.push(
      {
        from: { instanceId: "outcome-win", portId: "condition" },
        to: { instanceId: "outcome-coordinator", portId: "win" },
        payloadType: "outcome-condition-v1",
        delivery: "state",
      },
      {
        from: { instanceId: "outcome-loss", portId: "condition" },
        to: { instanceId: "outcome-coordinator", portId: "loss" },
        payloadType: "outcome-condition-v1",
        delivery: "state",
      },
    );
    graph.outcomeAuthority = {
      coordinatorInstanceId: "outcome-coordinator",
      winConditionInstanceId: "outcome-win",
      lossConditionInstanceId: "outcome-loss",
      winConditionStateInputPort: "win",
      lossConditionStateInputPort: "loss",
      arbitrationPhase: "post-provider-post-event-frame-v1",
      commitServiceId: "outcome.commit",
    };
    expect(() => ResolvedModuleGraphV14Schema.parse(graph)).toThrow(
      /outcome selection/,
    );
    win.runtimePorts.outputPorts.pop();
    coordinator.runtimePorts.inputPorts.push({
      id: "extra-input",
      payloadType: "outcome-condition-v1",
      delivery: "state",
      required: false,
    });
    expect(() => ResolvedModuleGraphV14Schema.parse(graph)).toThrow(
      /outcome selection/,
    );
  });

  it("rejects a V1.4 module carried in a V1.3 factory context", () => {
    const graph = structuredClone(validGraph);
    const source = graph.modules.find(
      (entry) => entry.instanceId === "hostile-source",
    )!;
    source.factoryContextVersion = "1.3.0";
    expect(() => ResolvedModuleGraphV14Schema.parse(graph)).toThrow(
      /hostile V3 triple/,
    );
  });

  it("rejects V2 payload mixing and missing exact root lineage", () => {
    const v2 = structuredClone(validGraph) as unknown as Record<
      string,
      unknown
    >;
    (
      v2.hostileAttackChannels as Array<Record<string, unknown>>
    )[0]!.requestPayloadType = "attack-request-v2";
    expect(() => ResolvedModuleGraphV14Schema.parse(v2)).toThrow();

    const missingRoot = structuredClone(validGraph);
    missingRoot.hostileAttackChannels[0]!.rootChannelId = "missing.root";
    expect(() => ResolvedModuleGraphV14Schema.parse(missingRoot)).toThrow(
      /hostile V3 triple/,
    );
  });

  it("rejects duplicate membership and local ceilings above the host group", () => {
    const duplicate = structuredClone(validGraph);
    duplicate.hostileContentionGroups.push({
      ...structuredClone(duplicate.hostileContentionGroups[0]!),
      groupId: "hostile.second",
    });
    expect(() => ResolvedModuleGraphV14Schema.parse(duplicate)).toThrow(
      /membership/,
    );

    const over = structuredClone(validGraph);
    over.hostileContentionGroups[0]!.activeProjectileCapacity = 3;
    expect(() => ResolvedModuleGraphV14Schema.parse(over)).toThrow(
      /hostile V3 triple/,
    );
  });

  it("rejects actor-root role/capacity drift and non-hostile group members", () => {
    const capacity = structuredClone(validGraph);
    capacity.actorRootChannels[0]!.consumerGrants[0]!.maximumEntries = 9;
    expect(() => ResolvedModuleGraphV14Schema.parse(capacity)).toThrow(
      /actor-root lineage/,
    );

    const ordinary = structuredClone(validGraph);
    ordinary.hostileContentionGroups[0]!.memberInstanceIds.push(
      ordinary.modules[0]!.instanceId,
    );
    expect(() => ResolvedModuleGraphV14Schema.parse(ordinary)).toThrow(
      /non-hostile delivery/,
    );
  });
});
