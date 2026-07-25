import { z } from "zod";

import {
  sha256SpecIntentLedger,
  verifySpecIntentLedger,
  type SpecIntentLedger,
  type SpecIntentRequest,
} from "./spec-intent-ledger.js";
import {
  parseShooterGameSpec,
  type ShooterGameSpec,
} from "./shooter-game-spec.js";
import { sha256CompletedShooterGameSpec } from "./spec-completion-policy.js";

const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);

const PlayabilityDecisionV1Schema = z.strictObject({
  field: z.literal("player.maxHealth"),
  action: z.literal("replaced"),
  previousValue: z.number().int().min(1).max(20),
  completedValue: z.literal(20),
  ruleId: z.literal("set-agent-owned-boss-health-ceiling-v1"),
  reason: z.string().min(1).max(320),
});

const PlayabilityDecisionV2Schema = z.strictObject({
  field: z.literal("player.maxHealth"),
  action: z.literal("replaced"),
  previousValue: z.number().int().min(1).max(40),
  completedValue: z.literal(40),
  ruleId: z.literal("set-agent-owned-boss-health-ceiling-v2"),
  reason: z.string().min(1).max(320),
});

const PlayabilityDecisionV3Schema = z.strictObject({
  field: z.literal("player.maxHealth"),
  action: z.literal("replaced"),
  previousValue: z.number().int().min(1).max(60),
  completedValue: z.literal(60),
  ruleId: z.literal("set-agent-owned-boss-health-ceiling-v3"),
  reason: z.string().min(1).max(320),
});

const SpecPlayabilityCompletionArtifactV1Schema = z.strictObject({
  schemaVersion: z.literal("1.0.0"),
  policyId: z.literal("boss-flow-player-health-v1"),
  sourceSpec: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  intentLedger: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  completedSpec: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  decisions: z.tuple([PlayabilityDecisionV1Schema]),
});

const SpecPlayabilityCompletionArtifactV2Schema = z.strictObject({
  schemaVersion: z.literal("1.1.0"),
  policyId: z.literal("boss-flow-player-health-v2"),
  sourceSpec: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  intentLedger: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  completedSpec: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  decisions: z.tuple([PlayabilityDecisionV2Schema]),
});

const SpecPlayabilityCompletionArtifactV3Schema = z.strictObject({
  schemaVersion: z.literal("1.2.0"),
  policyId: z.literal("boss-flow-player-health-v3"),
  sourceSpec: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  intentLedger: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  completedSpec: z.strictObject({
    schemaVersion: z.literal("1.0.0"),
    sha256: Sha256Schema,
  }),
  decisions: z.tuple([PlayabilityDecisionV3Schema]),
});

export const SpecPlayabilityCompletionArtifactSchema = z.union([
  SpecPlayabilityCompletionArtifactV1Schema,
  SpecPlayabilityCompletionArtifactV2Schema,
  SpecPlayabilityCompletionArtifactV3Schema,
]);

export type SpecPlayabilityCompletionArtifact = z.infer<
  typeof SpecPlayabilityCompletionArtifactSchema
>;

export type SpecPlayabilityCompletionResult = Readonly<{
  sourceSpec: ShooterGameSpec;
  completedSpec: ShooterGameSpec;
  intentLedger: SpecIntentLedger;
  artifact: SpecPlayabilityCompletionArtifact;
}>;

export class SpecPlayabilityCompletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpecPlayabilityCompletionError";
  }
}

export function completePlayableShooterGameSpec(
  request: SpecIntentRequest,
  rawSourceSpec: unknown,
  rawIntentLedger: unknown,
): SpecPlayabilityCompletionResult {
  return completePlayableShooterGameSpecWithPolicy(
    request,
    rawSourceSpec,
    rawIntentLedger,
    "1.2.0",
  );
}

function completePlayableShooterGameSpecWithPolicy(
  request: SpecIntentRequest,
  rawSourceSpec: unknown,
  rawIntentLedger: unknown,
  policyVersion: "1.0.0" | "1.1.0" | "1.2.0",
): SpecPlayabilityCompletionResult {
  const sourceSpec = parseShooterGameSpec(rawSourceSpec);
  const intentLedger = verifySpecIntentLedger(
    request,
    sourceSpec,
    rawIntentLedger,
  );
  const healthIntent = intentLedger.entries.find(
    (entry) => entry.intentId === "player-max-health",
  );
  if (
    healthIntent?.ownership !== "agent-choice" ||
    healthIntent.specBinding.kind !== "player-max-health" ||
    healthIntent.specBinding.value !== sourceSpec.player.maxHealth
  ) {
    throw new SpecPlayabilityCompletionError(
      "player.maxHealth is not explicitly recorded as an Agent choice",
    );
  }
  const ceiling =
    policyVersion === "1.0.0" ? 20 : policyVersion === "1.1.0" ? 40 : 60;
  if (sourceSpec.winCondition.type !== "bossDefeated") {
    throw new SpecPlayabilityCompletionError(
      "boss-flow-player-health supports only Boss-defeat games",
    );
  }
  if (sourceSpec.player.maxHealth >= ceiling) {
    throw new SpecPlayabilityCompletionError(
      "player.maxHealth is already at the bounded schema ceiling",
    );
  }

  const completedSpec = parseShooterGameSpec({
    ...sourceSpec,
    player: { ...sourceSpec.player, maxHealth: ceiling },
  });
  const artifact = SpecPlayabilityCompletionArtifactSchema.parse({
    schemaVersion: policyVersion,
    policyId:
      policyVersion === "1.0.0"
        ? "boss-flow-player-health-v1"
        : policyVersion === "1.1.0"
          ? "boss-flow-player-health-v2"
          : "boss-flow-player-health-v3",
    sourceSpec: {
      schemaVersion: sourceSpec.schemaVersion,
      sha256: sha256CompletedShooterGameSpec(sourceSpec),
    },
    intentLedger: {
      schemaVersion: intentLedger.schemaVersion,
      sha256: sha256SpecIntentLedger(intentLedger),
    },
    completedSpec: {
      schemaVersion: completedSpec.schemaVersion,
      sha256: sha256CompletedShooterGameSpec(completedSpec),
    },
    decisions: [
      {
        field: "player.maxHealth",
        action: "replaced",
        previousValue: sourceSpec.player.maxHealth,
        completedValue: ceiling,
        ruleId:
          policyVersion === "1.0.0"
            ? "set-agent-owned-boss-health-ceiling-v1"
            : policyVersion === "1.1.0"
              ? "set-agent-owned-boss-health-ceiling-v2"
              : "set-agent-owned-boss-health-ceiling-v3",
        reason:
          policyVersion === "1.0.0"
            ? "The request did not lock player health, and the preserved browser failure showed that the Agent-chosen value could not complete the bounded Boss flow; policy 1.0.0 uses the existing schema ceiling without changing gameplay requirements."
            : policyVersion === "1.1.0"
              ? "The request did not lock player health, and immutable browser evidence showed that health 20 could not complete the bounded Boss flow; policy 1.1.0 raises only the Agent-owned health ceiling to 40."
              : "The request did not lock player health, and immutable mobile browser evidence showed that health 40 depleted after all required play evidence; policy 1.2.0 raises only the Agent-owned ceiling to 60.",
      },
    ],
  });
  return { sourceSpec, completedSpec, intentLedger, artifact };
}

export function verifySpecPlayabilityCompletion(
  request: SpecIntentRequest,
  rawSourceSpec: unknown,
  rawCompletedSpec: unknown,
  rawIntentLedger: unknown,
  rawArtifact: unknown,
): SpecPlayabilityCompletionResult {
  const artifact = SpecPlayabilityCompletionArtifactSchema.parse(rawArtifact);
  const expected = completePlayableShooterGameSpecWithPolicy(
    request,
    rawSourceSpec,
    rawIntentLedger,
    artifact.schemaVersion,
  );
  const completedSpec = parseShooterGameSpec(rawCompletedSpec);
  if (
    sha256CompletedShooterGameSpec(completedSpec) !==
      expected.artifact.completedSpec.sha256 ||
    JSON.stringify(artifact) !== JSON.stringify(expected.artifact)
  ) {
    throw new SpecPlayabilityCompletionError(
      "playability completion evidence does not match the deterministic policy",
    );
  }
  return { ...expected, completedSpec };
}
