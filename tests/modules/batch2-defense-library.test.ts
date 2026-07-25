import { describe, expect, it } from "vitest";

import {
  BATCH2_DEFENSE_DEFINITIONS,
  createBatch2DefenseRegistry,
} from "../../src/modules/batch2-defense-library.js";

async function loadFactory(moduleId: string) {
  const source = BATCH2_DEFENSE_DEFINITIONS.find(
    (candidate) => candidate.manifest.moduleId === moduleId,
  )!.implementationSource;
  const loaded = (await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  )) as Readonly<{ create(context: unknown): Record<string, () => void> }>;
  return loaded.create;
}

function runtimeFixture(
  configuration: unknown,
  services: Record<string, unknown> = {},
) {
  let nowMs = 0;
  const handlers = new Map<string, (payload: unknown) => void>();
  const states: Array<Readonly<{ portId: string; payload: unknown }>> = [];
  const events: Array<Readonly<{ portId: string; payload: unknown }>> = [];
  const context = {
    identity: { instanceId: "defense-one", ownerId: "player-one" },
    configuration,
    clock: { nowMs: () => nowMs },
    services: {
      observation: { register: () => undefined },
      ...services,
    },
    ports: {
      declareHandler: (portId: string, handler: (payload: unknown) => void) =>
        handlers.set(portId, handler),
      declareAddressedHandler: (
        fieldId: string,
        handler: (payload: unknown) => void,
      ) => handlers.set(fieldId, handler),
      publishState: (portId: string, payload: unknown) =>
        states.push(Object.freeze({ portId, payload })),
      emitEvent: (portId: string, payload: unknown) =>
        events.push(Object.freeze({ portId, payload })),
    },
  };
  return {
    context,
    handlers,
    states,
    events,
    setNow(value: number) {
      nowMs = value;
    },
  };
}

const configurations = {
  "combat.invulnerability-window": {
    durationMs: 125,
    acceptedDamageKinds: ["projectile", "contact"],
  },
  "combat.shield": {
    maximumStrength: 100,
    initialStrength: 25,
    acceptedDamageKinds: ["projectile", "beam", "field", "contact"],
    overflowPolicy: "pass-remainder",
  },
  "combat.graze": {
    playerRadius: 8,
    bulletRadius: 4,
    margin: 18,
    ledgerCeiling: 128,
  },
} as const;

describe("Batch 2 defense production library", () => {
  it("freezes and loader-admits all three Manifest 1.3 factories", async () => {
    const registry = await createBatch2DefenseRegistry();
    expect(BATCH2_DEFENSE_DEFINITIONS).toHaveLength(3);
    expect(registry.list()).toHaveLength(3);

    for (const definition of BATCH2_DEFENSE_DEFINITIONS) {
      const registration = registry.find(
        definition.manifest.moduleId,
        definition.manifest.version,
      )[0];
      expect(registration?.registrationKind).toBe("production");
      expect(registration?.manifest.schemaVersion).toBe("1.3.0");
      expect(registration?.executableHandle?.exportKind).toBe(
        "lifecycle-create-v1",
      );
      expect(registration?.artifactIdentity?.envelopeSha256).toMatch(
        /^[a-f0-9]{64}$/,
      );
      expect(Object.isFrozen(registration?.manifest)).toBe(true);
    }
  });

  it("rejects unknown configuration and reserves no gameplay resources", async () => {
    const registry = await createBatch2DefenseRegistry();
    for (const definition of BATCH2_DEFENSE_DEFINITIONS) {
      const configuration = configurations[
        definition.manifest.moduleId as keyof typeof configurations
      ] as unknown;
      const registration = registry.find(
        definition.manifest.moduleId,
        definition.manifest.version,
      )[0]!;
      expect(() =>
        definition.configurationSchema.parse(configuration),
      ).not.toThrow();
      expect(registration.evaluateResourceReservation(configuration)).toEqual({
        activeEntities: 0,
        activeProjectiles: 0,
        spawnsPerSecond: 0,
        timers: 0,
      });
      expect(() =>
        definition.configurationSchema.parse({
          ...(configuration as object),
          undeclared: true,
        }),
      ).toThrow();
    }
  });

  it("pins invulnerability and shield into the linear filter route", () => {
    for (const moduleId of ["combat.invulnerability-window", "combat.shield"]) {
      const definition = BATCH2_DEFENSE_DEFINITIONS.find(
        (candidate) => candidate.manifest.moduleId === moduleId,
      )!;
      expect(definition.manifest.damageSink).toEqual({
        capability: "combat.damage-sink@1.0.0",
        sinkRole: "filter",
        inputPort: "damage",
        downstreamOutputPort: "downstream",
      });
      expect(definition.manifest.resources).toEqual({
        activeEntities: 0,
        activeProjectiles: 0,
        spawnsPerSecond: 0,
        timers: 0,
      });
    }
  });

  it("pins graze to a read-only, generation-aware channel grant", () => {
    const graze = BATCH2_DEFENSE_DEFINITIONS.find(
      (candidate) => candidate.manifest.moduleId === "combat.graze",
    )!.manifest;
    expect(graze.runtimeContract.update).toEqual({
      mode: "graph-frame-v1",
      registrationId: "graze.update",
    });
    expect(graze.entityChannelReads).toEqual([
      {
        readId: "graze.projectiles",
        channelStateInputPort: "projectiles",
        sourceEntityRole: "projectile",
        targetActorRoles: ["player"],
        maximumEntriesSource: "resolved-channel-capacity",
        entryFields: [
          "entityId",
          "generation",
          "position",
          "collisionRadius",
          "active",
        ],
        order: "entity-id-generation",
      },
    ]);
    expect(graze.projectileChannelConsumer).toEqual({
      role: "graze-reader",
      sourceChannelInputPort: "projectiles",
      readId: "graze.projectiles",
      requiredCapability: "delivery.projectile-channel@1.0.0",
      sourceEntityRole: "projectile",
    });
    expect(graze.entityMutationAccess ?? []).toEqual([]);
    expect(graze.runtimeLeases).toEqual({
      startLeases: 2,
      instanceLeases: 1,
      graphLeases: 0,
    });
  });

  it("limits defense routes to same-owner combat actors", () => {
    for (const moduleId of ["combat.invulnerability-window", "combat.shield"]) {
      const manifest = BATCH2_DEFENSE_DEFINITIONS.find(
        (candidate) => candidate.manifest.moduleId === moduleId,
      )!.manifest;
      expect(manifest.inputPorts[0]?.authorization).toEqual({
        ownerRelation: "same-owner",
        sourceActorRoles: ["player", "enemy", "boss"],
        targetActorRoles: ["player", "enemy", "boss"],
        sourceEntityRoles: [],
      });
    }
  });

  it("enforces bounded defense and graze configuration invariants", () => {
    const invulnerability = BATCH2_DEFENSE_DEFINITIONS[0]!;
    const shield = BATCH2_DEFENSE_DEFINITIONS[1]!;
    const graze = BATCH2_DEFENSE_DEFINITIONS[2]!;
    expect(() =>
      invulnerability.configurationSchema.parse({
        durationMs: 10_001,
        acceptedDamageKinds: ["projectile"],
      }),
    ).toThrow();
    expect(() =>
      shield.configurationSchema.parse({
        maximumStrength: 10,
        initialStrength: 11,
        acceptedDamageKinds: ["projectile"],
        overflowPolicy: "pass-remainder",
      }),
    ).toThrow();
    expect(() =>
      graze.configurationSchema.parse({
        playerRadius: 8,
        bulletRadius: 4,
        margin: 18,
        ledgerCeiling: 0,
      }),
    ).toThrow();
  });

  it("executes the half-open invulnerability filter without copying accepted damage", async () => {
    const create = await loadFactory("combat.invulnerability-window");
    const fixture = runtimeFixture(
      configurations["combat.invulnerability-window"],
    );
    const lifecycle = create(fixture.context);
    lifecycle.initialize!();
    const first = Object.freeze({
      sequence: 0,
      emittedAtMs: 0,
      sourceActorId: "enemy-one",
      targetActorId: "player-one",
      amount: 10,
      damageKind: "projectile",
      contactSequence: 0,
    });
    fixture.handlers.get("damage")!(first);
    fixture.handlers.get("damage")!(
      Object.freeze({ ...first, sequence: 1, contactSequence: 1 }),
    );
    expect(
      fixture.events.filter((event) => event.portId === "downstream"),
    ).toEqual([{ portId: "downstream", payload: first }]);
    expect(
      fixture.events
        .filter((event) => event.portId === "result")
        .map((event) => (event.payload as { result: string }).result),
    ).toEqual(["accepted", "blocked"]);

    fixture.setNow(125);
    const atExpiry = Object.freeze({
      ...first,
      sequence: 2,
      emittedAtMs: 125,
      contactSequence: 2,
    });
    fixture.handlers.get("damage")!(atExpiry);
    expect(
      fixture.events.filter((event) => event.portId === "downstream").at(-1)
        ?.payload,
    ).toBe(atExpiry);
  });

  it("absorbs shield damage first and forwards only an immutable positive remainder", async () => {
    const create = await loadFactory("combat.shield");
    const fixture = runtimeFixture(configurations["combat.shield"]);
    const lifecycle = create(fixture.context);
    lifecycle.initialize!();
    const damage = Object.freeze({
      sequence: 0,
      emittedAtMs: 0,
      sourceActorId: "enemy-one",
      targetActorId: "player-one",
      amount: 30,
      damageKind: "projectile",
      contactSequence: 0,
    });
    fixture.handlers.get("damage")!(damage);
    const downstream = fixture.events.find(
      (event) => event.portId === "downstream",
    )!.payload as Readonly<Record<string, unknown>>;
    expect(downstream).toEqual({ ...damage, amount: 5 });
    expect(Object.isFrozen(downstream)).toBe(true);
    expect(
      fixture.events
        .filter((event) => event.portId === "result")
        .map((event) => (event.payload as { result: string }).result),
    ).toEqual(["absorbed", "passed-remainder"]);
  });

  it("emits one graze per channel/entity/generation/player without mutating snapshots", async () => {
    const create = await loadFactory("combat.graze");
    let entries: readonly unknown[] = [
      Object.freeze({
        entityId: "projectile-one",
        generation: 0,
        position: Object.freeze({ x: 20, y: 0 }),
        collisionRadius: 4,
        active: true,
      }),
    ];
    const fixture = runtimeFixture(configurations["combat.graze"], {
      actors: {
        readOwner: () =>
          Object.freeze({
            actorId: "player-one",
            active: true,
            position: Object.freeze({ x: 0, y: 0 }),
          }),
      },
      entityChannelSnapshots: { read: () => ({ entries }) },
    });
    const lifecycle = create(fixture.context);
    lifecycle.initialize!();
    fixture.handlers.get("projectiles")!(
      Object.freeze({ channelId: "enemy.projectiles" }),
    );
    lifecycle.update!();
    lifecycle.update!();
    expect(
      fixture.events.filter((event) => event.portId === "graze"),
    ).toHaveLength(1);
    expect(entries[0]).toEqual({
      entityId: "projectile-one",
      generation: 0,
      position: { x: 20, y: 0 },
      collisionRadius: 4,
      active: true,
    });

    entries = [];
    lifecycle.update!();
    entries = [
      Object.freeze({
        entityId: "projectile-one",
        generation: 1,
        position: Object.freeze({ x: 20, y: 0 }),
        collisionRadius: 4,
        active: true,
      }),
    ];
    lifecycle.update!();
    expect(
      fixture.events
        .filter((event) => event.portId === "graze")
        .map((event) => (event.payload as { generation: number }).generation),
    ).toEqual([0, 1]);
  });
});
