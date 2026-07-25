import { describe, expect, it } from "vitest";

import type {
  GameModuleFactoryContextV12,
  GameModuleFactoryContextV13,
  GameModuleFactoryContextV14,
} from "../../src/modules/game-module-runtime-factory.js";
import {
  validateFactoryContextV12,
  validateFactoryContextV13,
  validateFactoryContextV14,
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
      ownerId: "encounter-one",
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

const portsV12 = {
  declareHandler: () => undefined,
  publishState: () => undefined,
  emitEvent: () => undefined,
};

const portsV13 = {
  ...portsV12,
  declareAddressedHandler: () => undefined,
};

describe("ADR 0028 mixed factory contexts", () => {
  it("keeps Manifest 1.2 exact and rejects every later authority key", () => {
    const context: GameModuleFactoryContextV12 = {
      ...common(),
      services: baseServices(),
      ports: portsV12,
    };
    expect(validateFactoryContextV12(context)).toBe(context);
    for (const key of ["actorSnapshots", "actorRoots", "outcomeCommit"]) {
      expect(() =>
        validateFactoryContextV12({
          ...context,
          services: { ...context.services, [key]: {} },
        } as GameModuleFactoryContextV12),
      ).toThrow(/unexpected authority/);
    }
  });

  it("keeps Manifest 1.3 exact and rejects V1.4 authority", () => {
    const context: GameModuleFactoryContextV13 = {
      ...common(),
      services: {
        ...baseServices(),
        actorSnapshots: { read: () => undefined },
      },
      ports: portsV13,
    };
    expect(validateFactoryContextV13(context, ["actorSnapshots"])).toBe(
      context,
    );
    expect(() =>
      validateFactoryContextV13(
        {
          ...context,
          services: { ...context.services, actorRoots: {} },
        } as GameModuleFactoryContextV13,
        ["actorSnapshots"],
      ),
    ).toThrow(/unexpected authority/);
  });

  it("requires exactly the resolved Manifest 1.4 grants", () => {
    const context: GameModuleFactoryContextV14 = {
      ...common(),
      services: {
        ...baseServices(),
        actorRootSnapshots: { read: () => undefined },
        hostileProjectileDelivery: {
          admit: () => undefined,
          recycle: () => undefined,
          observe: () => undefined,
        },
      },
      ports: portsV13,
    };
    const grants = ["actorRootSnapshots", "hostileProjectileDelivery"] as const;
    expect(validateFactoryContextV14(context, grants)).toBe(context);
    expect(() =>
      validateFactoryContextV14(context, ["actorRootSnapshots"]),
    ).toThrow(/unexpected authority/);
    expect(() =>
      validateFactoryContextV14(
        {
          ...context,
          services: { ...context.services, outcomeCommit: {} },
        } as GameModuleFactoryContextV14,
        grants,
      ),
    ).toThrow(/unexpected authority/);
  });
});
