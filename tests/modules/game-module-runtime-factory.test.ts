import { z } from "zod";

import { describe, expect, it } from "vitest";

import { GameModuleManifestV11Schema } from "../../src/modules/game-module-contract.js";
import { createModuleArtifactHashDescriptor } from "../../src/modules/game-module-execution-contract.js";
import {
  GameModuleRegistry,
  type ProductionGameModuleRegistrationInput,
} from "../../src/modules/game-module-registry.js";
import type {
  GameModuleFactory,
  ProductionModuleExecutionExports,
} from "../../src/modules/game-module-runtime-factory.js";
import {
  manifest11,
  zeroBudget,
} from "./game-module-execution-test-helpers.js";

function productionInput(
  manifest: unknown,
  executionExports: (
    artifactEnvelopeSha256: string,
  ) => ProductionModuleExecutionExports,
): ProductionGameModuleRegistrationInput {
  const typed = manifest as {
    moduleId: string;
    configurationSchemaId: string;
  };
  const configurationDescriptor = {
    descriptorVersion: "1.0.0",
    schemaId: typed.configurationSchemaId,
    dialect: "json-schema-2020-12-subset",
    schema: { type: "object", additionalProperties: false },
  } as const;
  const reservationDescriptor = {
    descriptorVersion: "1.0.0",
    reservationId: `${typed.moduleId}.reservation`,
    strategy: "constant",
    fields: [
      { resource: "activeEntities", constant: 0 },
      { resource: "activeProjectiles", constant: 0 },
      { resource: "spawnsPerSecond", constant: 0 },
      { resource: "timers", constant: 0 },
    ],
  } as const;
  const implementationBundle = Buffer.from(`${typed.moduleId}-bundle-v1`);
  const dependencyLockIdentity = Buffer.from("pnpm-lock-reviewed-v1");
  const toolchainIdentity = Buffer.from("node22-typescript5-v1");
  const expectedArtifact = createModuleArtifactHashDescriptor({
    manifest,
    configurationDescriptor,
    reservationDescriptor,
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
  });
  return {
    manifest,
    configurationDescriptor,
    configurationSchema: z.strictObject({}),
    reservationDescriptor,
    reservationEvaluator: () => ({ ...zeroBudget }),
    implementationBundle,
    dependencyLockIdentity,
    toolchainIdentity,
    expectedArtifact,
    executionExports: executionExports(expectedArtifact.envelopeSha256),
  };
}

function expectRegistrationFailure(
  input: ProductionGameModuleRegistrationInput,
  pattern: RegExp,
): void {
  expect(() => new GameModuleRegistry().registerProduction(input)).toThrow(
    pattern,
  );
}

const create: GameModuleFactory = () => ({ initialize: () => undefined });

function factoryExports(
  implementationId: string,
  artifactEnvelopeSha256: string,
  overrides: Partial<ProductionModuleExecutionExports> = {},
): ProductionModuleExecutionExports {
  return {
    implementationId,
    artifactEnvelopeSha256,
    runtimeLeaseKeys: { start: [], instance: [], graph: [] },
    create,
    ...overrides,
  };
}

function policyDescriptor(): unknown {
  return {
    descriptorVersion: "1.0.0",
    executionModel: "contact-policy-transform-v1",
    inputPayloadType: "contact-decision-v1",
    outputPayloadType: "contact-decision-v1",
    policyPhase: "default",
    policyRole: "policy.default-damage",
    allowedPredecessors: [],
    allowedSuccessors: [],
    requiresBefore: [],
    requiresAfter: [],
    supportedChainEvidenceIds: ["evidence.default-damage"],
    mutableDecisionFields: ["disposition", "sourceOperation", "damage"],
  };
}

describe("production module runtime factory registration boundary", () => {
  it("binds an exact implementation and artifact identity to frozen exports", () => {
    const manifest = manifest11("test.runtime-factory", {
      runtimeLeases: { startLeases: 2, instanceLeases: 1, graphLeases: 1 },
    });
    const input = productionInput(manifest, (envelope) =>
      factoryExports("test.runtime-factory.v1", envelope, {
        runtimeLeaseKeys: {
          start: ["input.keyboard", "update"],
          instance: ["state-cache"],
          graph: ["shared-ledger"],
        },
      }),
    );
    const registry = new GameModuleRegistry();
    registry.registerProduction(input);

    const artifact = input.expectedArtifact as { envelopeSha256: string };
    const registration = registry.findExactProduction(
      "test.runtime-factory",
      "1.0.0",
      artifact.envelopeSha256,
    );
    expect(registration?.executionExports).toMatchObject({
      implementationId: "test.runtime-factory.v1",
      artifactEnvelopeSha256: artifact.envelopeSha256,
      runtimeLeaseKeys: {
        start: ["input.keyboard", "update"],
        instance: ["state-cache"],
        graph: ["shared-ledger"],
      },
      create,
    });
    expect(Object.isFrozen(registration?.executionExports)).toBe(true);
    expect(
      Object.isFrozen(registration?.executionExports?.runtimeLeaseKeys),
    ).toBe(true);
    expect(
      registry.findExactProduction(
        "test.runtime-factory",
        "1.0.0",
        "0".repeat(64),
      ),
    ).toBeUndefined();
  });

  it("rejects implementation and artifact identity mismatches", () => {
    const manifest = manifest11("test.runtime-identity");
    expectRegistrationFailure(
      productionInput(manifest, (envelope) =>
        factoryExports("test.other-implementation.v1", envelope),
      ),
      /execution export identity mismatch/,
    );
    expectRegistrationFailure(
      productionInput(manifest, () =>
        factoryExports("test.runtime-identity.v1", "0".repeat(64)),
      ),
      /execution export identity mismatch/,
    );
  });

  it("rejects duplicate, invalid, and one-over lease-key declarations", () => {
    const manifest = manifest11("test.runtime-leases", {
      runtimeLeases: { startLeases: 1, instanceLeases: 1, graphLeases: 1 },
    });
    for (const [runtimeLeaseKeys, scope] of [
      [{ start: ["timer", "timer"], instance: [], graph: [] }, "start"],
      [{ start: [], instance: ["UNKNOWN_KEY"], graph: [] }, "instance"],
      [
        { start: [], instance: [], graph: ["router", "shared-ledger"] },
        "graph",
      ],
    ] as const) {
      expectRegistrationFailure(
        productionInput(manifest, (envelope) =>
          factoryExports("test.runtime-leases.v1", envelope, {
            runtimeLeaseKeys,
          }),
        ),
        new RegExp(`invalid ${scope} execution lease keys`),
      );
    }
  });

  it("admits only create exports for factories and transform exports for policies", () => {
    const factoryManifest = manifest11("test.factory-shape");
    expectRegistrationFailure(
      productionInput(factoryManifest, (envelope) => ({
        implementationId: "test.factory-shape.v1",
        artifactEnvelopeSha256: envelope,
        runtimeLeaseKeys: { start: [], instance: [], graph: [] },
        contactPolicyTransform: (decision) => decision,
      })),
      /execution export shape mismatch/,
    );
    expectRegistrationFailure(
      productionInput(factoryManifest, (envelope) => ({
        implementationId: "test.factory-shape.v1",
        artifactEnvelopeSha256: envelope,
        runtimeLeaseKeys: { start: [], instance: [], graph: [] },
        create,
        contactPolicyTransform: (decision) => decision,
      })),
      /execution export shape mismatch/,
    );

    const policyManifest = manifest11("test.policy-shape", {
      contactPolicyTransform: policyDescriptor(),
    });
    const validPolicyInput = productionInput(policyManifest, (envelope) => ({
      implementationId: "test.policy-shape.v1",
      artifactEnvelopeSha256: envelope,
      runtimeLeaseKeys: { start: [], instance: [], graph: [] },
      contactPolicyTransform: (decision) => decision,
    }));
    const registry = new GameModuleRegistry();
    registry.registerProduction(validPolicyInput);
    expect(registry.list()[0]?.executionExports?.create).toBeUndefined();
    expect(
      registry.list()[0]?.executionExports?.contactPolicyTransform,
    ).toBeTypeOf("function");

    expectRegistrationFailure(
      productionInput(policyManifest, (envelope) =>
        factoryExports("test.policy-shape.v1", envelope),
      ),
      /execution export shape mismatch/,
    );
  });

  it("uses the strict Manifest 1.1 policy descriptor at this boundary", () => {
    expect(
      GameModuleManifestV11Schema.safeParse(
        manifest11("test.policy-contract", {
          contactPolicyTransform: policyDescriptor(),
        }),
      ).success,
    ).toBe(true);
  });
});
