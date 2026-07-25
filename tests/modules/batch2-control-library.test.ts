import { describe, expect, it } from "vitest";

import {
  BATCH2_CONTROL_DEFINITIONS,
  createBatch2ControlRegistry,
} from "../../src/modules/batch2-gameplay-library.js";
import { RuntimePayloadSchemas } from "../../src/modules/game-module-runtime-payloads.js";

const configurations = {
  "intent.directional-aim": {
    source: "pointer-world",
    deadZone: 0,
    normalization: "unit",
    pointerCapture: "latest-active",
  },
  "intent.active-attack": {
    device: "pointer",
    control: "primary",
    pointerCapture: "matching-pointer",
  },
  "intent.focus": {
    device: "keyboard",
    control: "ShiftLeft",
    initialFocused: false,
  },
  "locomotion.focus-speed": {
    multiplier: 0.5,
    releaseBehavior: "restore",
  },
  "locomotion.bounded": {
    moveSpeed: 300,
    bounds: { left: 20, right: 20, top: 20, bottom: 20 },
    absoluteMode: "clamp",
    neutralMode: "zero-velocity",
  },
  "targeting.directional": {
    attackChannelId: "player.primary",
    pointFallbackDirection: { x: 0, y: -1 },
    zeroVectorPolicy: "retain-last",
  },
  "targeting.nearest": {
    attackChannelId: "player.primary",
    range: 1000,
    allowedRoles: ["enemy", "boss"],
    inactivePolicy: "ignore",
    noTargetFallbackDirection: { x: 0, y: -1 },
  },
  "trigger.active": {
    attackChannelId: "player.primary",
    mode: "hold-repeat",
    initialDelayMs: 0,
    repeatIntervalMs: 100,
  },
} as const;

describe("Batch 2 control production library", () => {
  it("freezes and loader-admits all eight control definitions", async () => {
    const registry = await createBatch2ControlRegistry();
    expect(BATCH2_CONTROL_DEFINITIONS).toHaveLength(8);
    expect(registry.list()).toHaveLength(8);

    for (const definition of BATCH2_CONTROL_DEFINITIONS) {
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

  it("validates strict configurations and exact reservations", async () => {
    const registry = await createBatch2ControlRegistry();
    for (const definition of BATCH2_CONTROL_DEFINITIONS) {
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
      expect(registration.evaluateResourceReservation(configuration)).toEqual(
        definition.manifest.moduleId === "trigger.active"
          ? {
              activeEntities: 0,
              activeProjectiles: 0,
              spawnsPerSecond: 0,
              timers: 1,
            }
          : {
              activeEntities: 0,
              activeProjectiles: 0,
              spawnsPerSecond: 0,
              timers: 0,
            },
      );
      expect(() =>
        definition.configurationSchema.parse({
          ...(configuration as object),
          undeclared: true,
        }),
      ).toThrow();
    }
  });

  it("reserves no timer for edge modes and one timer only for hold-repeat", async () => {
    const registry = await createBatch2ControlRegistry();
    const trigger = registry.find("trigger.active", "1.0.0")[0]!;
    expect(
      trigger.evaluateResourceReservation({
        attackChannelId: "player.primary",
        mode: "press",
      }).timers,
    ).toBe(0);
    expect(
      trigger.evaluateResourceReservation({
        attackChannelId: "player.primary",
        mode: "release",
      }).timers,
    ).toBe(0);
    expect(
      trigger.evaluateResourceReservation({
        attackChannelId: "player.primary",
        mode: "hold-repeat",
        initialDelayMs: 50,
        repeatIntervalMs: 100,
      }).timers,
    ).toBe(1);
  });

  it("emits schema-valid control payloads from the admitted factories", async () => {
    const registry = await createBatch2ControlRegistry();
    for (const definition of BATCH2_CONTROL_DEFINITIONS) {
      const handlers = new Map<string, (value: any) => void>();
      const inputs = new Map<string, (value: any) => void>();
      const outputs: { portId: string; payload: unknown }[] = [];
      const registration = registry.find(
        definition.manifest.moduleId,
        definition.manifest.version,
      )[0]!;
      const create = registration.executableHandle!.loadedExport;
      const participant = create({
        identity: {
          instanceId: "control-one",
          ownerId: "player-one",
          moduleId: definition.manifest.moduleId,
          version: definition.manifest.version,
          artifactEnvelopeSha256: registration.artifactIdentity!.envelopeSha256,
        },
        configuration:
          configurations[
            definition.manifest.moduleId as keyof typeof configurations
          ],
        services: {
          viewport: { read: () => ({ width: 720, height: 720 }) },
          actors: {
            readOwner: () => ({
              actorId: "player-one",
              active: true,
              position: { x: 360, y: 600 },
            }),
            writeOwnerMotion: () => undefined,
            writeOwnerPosition: () => undefined,
          },
          input: {
            register: (id: string, handler: (value: any) => void) => {
              inputs.set(id, handler);
              return () => inputs.delete(id);
            },
          },
          overlaps: { register: () => () => undefined },
          channels: {
            activate: () => undefined,
            recycle: () => undefined,
            read: () => undefined,
          },
          observation: { register: () => () => undefined },
          contact: {
            executePolicy: () => undefined,
            prepareCommit: () => undefined,
          },
          actorSnapshots: {
            read: () => ({ directoryRevision: 1, entries: [] }),
          },
        },
        ports: {
          declareHandler: (id: string, handler: (value: any) => void) =>
            handlers.set(id, handler),
          declareAddressedHandler: () => undefined,
          publishState: (portId: string, payload: unknown) =>
            outputs.push({ portId, payload }),
          emitEvent: (portId: string, payload: unknown) =>
            outputs.push({ portId, payload }),
        },
        clock: {
          nowMs: () => 10,
          schedule: () => ({ active: true, cancel() {} }),
        },
        assets: {
          requireTexture: () => "texture",
          optionalTexture: () => undefined,
        },
      }) as {
        initialize?(): void;
        start?(): void;
        update?(): void;
        stop?(): void;
      };
      participant.initialize?.();
      participant.start?.();
      if (definition.manifest.moduleId === "intent.active-attack") {
        inputs.get("attack.pointer-down")!({ id: 7 });
        inputs.get("attack.pointer-up")!({ id: 7 });
      }
      if (definition.manifest.moduleId === "trigger.active") {
        handlers.get("intent")!({ phase: "press", inputIdentity: "pointer-7" });
      }
      participant.update?.();

      for (const output of outputs) {
        const port = definition.manifest.outputPorts.find(
          (candidate) => candidate.id === output.portId,
        )!;
        const schema =
          RuntimePayloadSchemas[
            port.payloadType as keyof typeof RuntimePayloadSchemas
          ];
        expect(schema).toBeDefined();
        expect(() => schema!.parse(output.payload)).not.toThrow();
      }
      participant.stop?.();
    }
  });
});
