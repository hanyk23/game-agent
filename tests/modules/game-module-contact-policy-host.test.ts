import { describe, expect, it } from "vitest";

import {
  computeContactPolicyChainProfileEvidenceHash,
  ContactPolicyChainProfileSchema,
  type ContactDecisionPayload,
} from "../../src/modules/game-module-execution-contract.js";
import {
  ContactPolicyHostError,
  ContactPolicyHostErrorCode,
  DeterministicContactPolicyTransactionHost,
} from "../../src/modules/game-module-contact-policy-host.js";
import { DeterministicLogicalEntityDirectory } from "../../src/modules/game-module-entity-directory.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import { resolveGameAssembly } from "../../src/modules/game-module-resolver.js";
import type { ContactPolicyTransform } from "../../src/modules/game-module-runtime-factory.js";
import type { GameModuleFactory } from "../../src/modules/game-module-runtime-factory.js";
import { DeterministicGameModuleProductionInstantiator } from "../../src/modules/game-module-production-instantiator.js";
import { createUnavailableRuntimeServiceHost } from "../../src/modules/game-module-runtime-services.js";
import {
  assembly11,
  manifest11,
  registerExecutable,
} from "./game-module-execution-test-helpers.js";

const evidenceHashPlaceholder = "a".repeat(64);

function candidate() {
  return {
    sequence: 0,
    emittedAtMs: 10,
    contactId: "contact.one",
    sourceChannelId: "enemy.projectiles",
    sourceEntityId: "projectile-one",
    sourceGeneration: 1,
    sourceActorId: "enemy-one",
    targetActorId: "player-one",
    contactSequence: 0,
    metadata: { damage: 3, damageKind: "projectile" },
  } as const;
}

function createHost(
  transform: ContactPolicyTransform,
  mutableDecisionFields: readonly (
    "disposition" | "sourceOperation" | "damage" | "transferTargetActorId"
  )[] = ["disposition", "sourceOperation", "damage"],
  allowedDispositions: readonly string[] = ["damage"],
  consumerCreate: GameModuleFactory = () => ({}),
) {
  const registry = new GameModuleRegistry();
  const policy = manifest11("interaction.default-damage", {
    contactPolicyTransform: {
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
      mutableDecisionFields,
    },
  });
  const consumer = manifest11("interaction.resolution");
  registerExecutable(registry, policy, { contactPolicyTransform: transform });
  registerExecutable(registry, consumer, { create: consumerCreate });
  const profileInput = {
    schemaVersion: "1.0.0",
    profileId: "profile.default-damage",
    version: "1.0.0",
    orderedPolicies: [
      {
        moduleId: "interaction.default-damage",
        versionRange: "1.0.0",
        policyRole: "policy.default-damage",
      },
    ],
    allowedDispositions,
    allowedSourceOperations: ["consume"],
    maxDepth: 1,
    supportedChainEvidenceId: "evidence.default-damage",
    evidenceHash: evidenceHashPlaceholder,
  } as const;
  const profile = ContactPolicyChainProfileSchema.parse({
    ...profileInput,
    evidenceHash: computeContactPolicyChainProfileEvidenceHash(profileInput),
  });
  registry.registerContactPolicyProfile(profile);
  const graph = resolveGameAssembly(
    assembly11(
      [
        {
          instanceId: "default-policy",
          moduleId: "interaction.default-damage",
        },
        { instanceId: "resolver", moduleId: "interaction.resolution" },
      ],
      [],
      {
        contactPolicySelections: [
          {
            consumerInstanceId: "resolver",
            profileId: profile.profileId,
            version: profile.version,
          },
        ],
      },
    ),
    registry,
  );
  return new DeterministicContactPolicyTransactionHost(graph, registry);
}

function hostError(action: () => void): ContactPolicyHostError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ContactPolicyHostError);
    return error as ContactPolicyHostError;
  }
  throw new Error("expected contact policy host failure");
}

describe("restricted synchronous contact-policy transaction host", () => {
  it("injects the resolved transaction authority into the production factory", () => {
    let execute: ((candidate: unknown) => unknown) | undefined;
    const transactionHost = createHost(
      (decision) => ({
        ...decision,
        disposition: "damage",
        sourceOperation: "consume",
        damage: decision.metadata.damage,
      }),
      ["disposition", "sourceOperation", "damage"],
      ["damage"],
      (context) => {
        execute = context.contactPolicies.execute;
        return {};
      },
    );
    const graph = DeterministicGameModuleProductionInstantiator.create({
      graph: transactionHost.graph as never,
      registry: transactionHost.registry,
      serviceHost: createUnavailableRuntimeServiceHost(),
    });
    expect(execute?.(candidate())).toMatchObject({
      disposition: "damage",
      sourceOperation: "consume",
      damage: 3,
    });
    graph.dispose();
    graph.destroy();
  });

  it("invokes a policy exactly once, freezes input, and appends host-owned trace", () => {
    let calls = 0;
    const host = createHost((decision) => {
      calls += 1;
      expect(Object.isFrozen(decision)).toBe(true);
      expect(Object.isFrozen(decision.metadata)).toBe(true);
      return {
        ...decision,
        disposition: "damage",
        sourceOperation: "consume",
        damage: decision.metadata.damage,
      };
    });
    const result = host.execute("resolver", candidate());
    expect(calls).toBe(1);
    expect(result).toMatchObject({
      contactId: "contact.one",
      disposition: "damage",
      sourceOperation: "consume",
      damage: 3,
      policyTrace: ["interaction.default-damage"],
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("rejects thenables and exceptions while preserving their deterministic cause", () => {
    const asyncError = hostError(() =>
      createHost(async (decision) => decision).execute("resolver", candidate()),
    );
    expect(asyncError.code).toBe(
      ContactPolicyHostErrorCode.asynchronousTransform,
    );

    const cause = new Error("policy exploded");
    const thrown = hostError(() =>
      createHost(() => {
        throw cause;
      }).execute("resolver", candidate()),
    );
    expect(thrown.code).toBe(ContactPolicyHostErrorCode.transformFailed);
    expect(thrown.cause).toBe(cause);

    const unreadableThen = hostError(() =>
      createHost(
        () =>
          Object.defineProperty({}, "then", {
            get: () => {
              throw new Error("then getter exploded");
            },
          }) as never,
      ).execute("resolver", candidate()),
    );
    expect(unreadableThen.code).toBe(
      ContactPolicyHostErrorCode.asynchronousTransform,
    );
  });

  it("rejects immutable identity, host trace, and undeclared-field mutation", () => {
    expect(
      hostError(() =>
        createHost((decision) => ({
          ...decision,
          targetActorId: "player-two",
          disposition: "damage",
          sourceOperation: "consume",
          damage: 3,
        })).execute("resolver", candidate()),
      ).code,
    ).toBe(ContactPolicyHostErrorCode.identityMutation);

    expect(
      hostError(() =>
        createHost((decision) => ({
          ...decision,
          disposition: "damage",
          sourceOperation: "consume",
          damage: 3,
          policyTrace: ["forged.policy"],
        })).execute("resolver", candidate()),
      ).code,
    ).toBe(ContactPolicyHostErrorCode.traceMutation);

    expect(
      hostError(() =>
        createHost(
          (decision) => ({
            ...decision,
            disposition: "damage",
            sourceOperation: "consume",
            damage: 3,
          }),
          ["disposition"],
        ).execute("resolver", candidate()),
      ).code,
    ).toBe(ContactPolicyHostErrorCode.unauthorizedMutation);
  });

  it("rejects missing/invalid results and profile-disallowed final outcomes", () => {
    expect(
      hostError(() =>
        createHost(() => undefined).execute("resolver", candidate()),
      ).code,
    ).toBe(ContactPolicyHostErrorCode.invalidDecision);

    const transform = (decision: Readonly<ContactDecisionPayload>) => ({
      ...decision,
      disposition: "damage" as const,
      sourceOperation: "consume" as const,
      damage: 3,
    });
    expect(
      hostError(() =>
        createHost(transform, undefined, ["absorb"]).execute(
          "resolver",
          candidate(),
        ),
      ).code,
    ).toBe(ContactPolicyHostErrorCode.profileOutcomeRejected);
  });

  it("deep-freezes reviewed profiles and mutates an entity only after the whole transaction succeeds", () => {
    const successful = createHost((decision) => ({
      ...decision,
      disposition: "damage",
      sourceOperation: "consume",
      damage: 3,
    }));
    const profile = successful.registry.findContactPolicyProfile(
      "profile.default-damage",
      "1.0.0",
    )!;
    expect(Object.isFrozen(profile.allowedDispositions)).toBe(true);
    expect(Object.isFrozen(profile.orderedPolicies[0])).toBe(true);
    expect(() =>
      (profile.allowedDispositions as string[]).push("ignore"),
    ).toThrow();

    const entities = new DeterministicLogicalEntityDirectory(
      [
        {
          channelId: "enemy.projectiles",
          ownerInstanceId: "projectile-owner",
          ownerActorId: "enemy-one",
          entityRole: "hostile-projectile",
          capacity: 1,
          readerInstanceIds: ["resolver"],
        },
      ],
      [
        {
          grantId: "resolution.consume",
          granteeInstanceId: "resolver",
          channelId: "enemy.projectiles",
          operations: ["consume"],
          transferTargetActorIds: [],
        },
      ],
    );
    const reference = entities.activate(
      "projectile-owner",
      "enemy.projectiles",
      "projectile-one",
      1,
    );
    expect(() =>
      createHost(() => {
        throw new Error("policy failure");
      }).execute("resolver", candidate()),
    ).toThrow(ContactPolicyHostError);
    expect(
      entities.isGenerationActive("enemy.projectiles", "projectile-one", 1),
    ).toBe(true);

    const decision = successful.execute("resolver", candidate());
    expect(decision.sourceOperation).toBe("consume");
    entities.mutate("resolver", "resolution.consume", reference, "consume");
    expect(
      entities.isGenerationActive("enemy.projectiles", "projectile-one", 1),
    ).toBe(false);
    entities.destroy();
  });
});
