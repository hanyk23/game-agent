import { describe, expect, it } from "vitest";

import type {
  GameModuleFactoryContextV12,
  GameModuleFactoryContextV13,
} from "../../src/modules/game-module-runtime-factory.js";
import {
  validateFactoryContextV12,
  validateFactoryContextV13,
} from "../../src/modules/game-module-production-instantiator.js";

function baseServices() {
  return {
    viewport: { read: () => ({ width: 1, height: 1 }) },
    actors: {
      readOwner: () => undefined,
      writeOwnerMotion: () => undefined,
      writeOwnerPosition: () => undefined,
    },
    input: { register: () => () => undefined },
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
  };
}

function common() {
  return {
    identity: {
      instanceId: "probe",
      ownerId: "player-one",
      moduleId: "test.probe",
      version: "1.0.0",
      artifactEnvelopeSha256: "a".repeat(64),
    },
    configuration: {},
    clock: { nowMs: () => 0, schedule: () => ({ active: false, cancel() {} }) },
    assets: {
      requireTexture: () => "texture",
      optionalTexture: () => undefined,
    },
  };
}

describe("ADR 0027 mixed factory contexts", () => {
  it("keeps Manifest 1.2 context keys exact and rejects a V1.3 service", () => {
    const context: GameModuleFactoryContextV12 = {
      ...common(),
      services: baseServices(),
      ports: {
        declareHandler: () => undefined,
        publishState: () => undefined,
        emitEvent: () => undefined,
      },
    };
    expect(validateFactoryContextV12(context)).toBe(context);
    expect(() =>
      validateFactoryContextV12({
        ...context,
        services: {
          ...context.services,
          actorSnapshots: { read: () => undefined },
        },
      } as GameModuleFactoryContextV12),
    ).toThrow(/unexpected authority/);
  });

  it("requires exactly the resolved Manifest 1.3 service keys", () => {
    const context: GameModuleFactoryContextV13 = {
      ...common(),
      services: {
        ...baseServices(),
        actorSnapshots: { read: () => undefined },
      },
      ports: {
        declareHandler: () => undefined,
        declareAddressedHandler: () => undefined,
        publishState: () => undefined,
        emitEvent: () => undefined,
      },
    };
    expect(validateFactoryContextV13(context, ["actorSnapshots"])).toBe(
      context,
    );
    expect(() => validateFactoryContextV13(context, [])).toThrow(
      /unexpected authority/,
    );
  });
});
