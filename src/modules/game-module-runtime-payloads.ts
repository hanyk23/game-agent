import { z } from "zod";

const LogicalIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/);
const InstanceIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
const FiniteNumberSchema = z.number().finite();
const NonNegativeIntegerSchema = z.number().int().min(0);
const SafeNonNegativeIntegerSchema = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);

const VectorSchema = z.strictObject({
  x: FiniteNumberSchema,
  y: FiniteNumberSchema,
});
const NormalizedDirectionSchema = VectorSchema.refine(({ x, y }) => {
  const magnitude = Math.hypot(x, y);
  return magnitude > 0 && Math.abs(magnitude - 1) <= 1e-6;
}, "direction must be a normalized non-zero vector");

const PayloadEnvelopeSchema = z.strictObject({
  sequence: NonNegativeIntegerSchema,
  emittedAtMs: NonNegativeIntegerSchema,
});

export const MovementCommandPayloadSchema = PayloadEnvelopeSchema.extend({
  sourceId: InstanceIdSchema,
  active: z.boolean(),
  command: z.discriminatedUnion("kind", [
    z.strictObject({
      kind: z.literal("velocity-direction"),
      direction: VectorSchema,
    }),
    z.strictObject({
      kind: z.literal("absolute-position"),
      position: VectorSchema,
      pointerId: z.number().int().min(0),
    }),
  ]),
}).superRefine((payload, context) => {
  if (
    payload.command.kind === "velocity-direction" &&
    payload.active &&
    !NormalizedDirectionSchema.safeParse(payload.command.direction).success
  ) {
    context.addIssue({
      code: "custom",
      message: "an active velocity direction must be normalized and non-zero",
      path: ["command", "direction"],
    });
  }
});

export const ResolvedMovementCommandPayloadSchema =
  MovementCommandPayloadSchema.extend({
    selectedSourceId: InstanceIdSchema,
    arbitrationReason: z.enum(["keyboard", "touch-active", "touch-released"]),
  });

export const TargetSelectionPayloadSchema = z.strictObject({
  revision: NonNegativeIntegerSchema,
  emittedAtMs: NonNegativeIntegerSchema,
  kind: z.literal("direction"),
  direction: NormalizedDirectionSchema,
});

export const AttackRequestPayloadSchema = PayloadEnvelopeSchema.extend({
  requestedAtMs: NonNegativeIntegerSchema,
  channel: z.literal("primary"),
});

export const AimCommandPayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  sourceId: InstanceIdSchema,
  active: z.boolean(),
  command: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("direction"), direction: VectorSchema }),
    z.strictObject({ kind: z.literal("world-point"), point: VectorSchema }),
  ]),
});

export const AttackIntentPayloadSchema = PayloadEnvelopeSchema.extend({
  sourceId: InstanceIdSchema,
  phase: z.enum(["press", "release"]),
  inputIdentity: z.string().min(1).max(100),
});

export const FocusStatePayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  active: z.boolean(),
  sourceId: InstanceIdSchema,
});

export const MovementScalePayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  scale: FiniteNumberSchema.positive().max(1),
});

export const TargetSolutionPayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  attackChannelId: LogicalIdSchema,
  direction: NormalizedDirectionSchema,
  targetEvidence: z
    .strictObject({
      actorId: InstanceIdSchema,
      actorGeneration: SafeNonNegativeIntegerSchema,
      directoryRevision: SafeNonNegativeIntegerSchema,
    })
    .nullable(),
});

export const AttackRequestPayloadV2Schema = z.strictObject({
  sequence: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  requestedAtMs: SafeNonNegativeIntegerSchema,
  attackChannelId: LogicalIdSchema,
  slot: z.literal("primary"),
});

const PickupEffectEventEnvelopeV1Schema = z.strictObject({
  sequence: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  commitSequence: SafeNonNegativeIntegerSchema,
  commitEvidenceId: SafeNonNegativeIntegerSchema,
  eventOrdinal: SafeNonNegativeIntegerSchema,
});

export const PickupCollectedTemplateV1Schema = z.strictObject({
  sourceChannelId: LogicalIdSchema,
  sourceEntityId: InstanceIdSchema,
  sourceGeneration: SafeNonNegativeIntegerSchema,
  targetActorId: InstanceIdSchema,
  effectId: z.enum(["heal", "shield", "weaponPower", "scoreBonus"]),
  value: FiniteNumberSchema.positive(),
});

export const ModifierApplicationTemplateV1Schema = z.strictObject({
  routeId: LogicalIdSchema,
  targetInstanceId: InstanceIdSchema,
  fieldId: z.enum([
    "combat.health.current",
    "combat.shield.current",
    "attack.damage.multiplier",
    "attack.projectile-count.bonus",
  ]),
  operation: z.literal("add"),
  value: FiniteNumberSchema.positive(),
});

export const PickupCollectedPayloadSchema =
  PickupEffectEventEnvelopeV1Schema.extend(
    PickupCollectedTemplateV1Schema.shape,
  );

export const ModifierApplicationPayloadSchema =
  PickupEffectEventEnvelopeV1Schema.extend(
    ModifierApplicationTemplateV1Schema.shape,
  );

export const ModifierStatePayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  fieldId: ModifierApplicationTemplateV1Schema.shape.fieldId,
  current: FiniteNumberSchema,
  minimum: FiniteNumberSchema,
  maximum: FiniteNumberSchema,
});

export const DefenseStatePayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  actorId: InstanceIdSchema,
  active: z.boolean(),
  current: FiniteNumberSchema.min(0),
  maximum: FiniteNumberSchema.min(0),
});

export const DefenseResultPayloadSchema = PayloadEnvelopeSchema.extend({
  targetActorId: InstanceIdSchema,
  result: z.enum(["accepted", "blocked", "absorbed", "passed-remainder"]),
  amount: FiniteNumberSchema.min(0),
});

export const GrazePayloadSchema = PayloadEnvelopeSchema.extend({
  channelId: LogicalIdSchema,
  entityId: InstanceIdSchema,
  generation: SafeNonNegativeIntegerSchema,
  playerActorId: InstanceIdSchema,
});

export const EntityChannelPayloadSchema = z.strictObject({
  revision: NonNegativeIntegerSchema,
  emittedAtMs: NonNegativeIntegerSchema,
  channelId: LogicalIdSchema,
  ownerInstanceId: InstanceIdSchema,
  ownerActorId: InstanceIdSchema,
  entityRole: LogicalIdSchema,
  generation: NonNegativeIntegerSchema,
});

export const EmissionPayloadSchema = PayloadEnvelopeSchema.extend({
  entityId: InstanceIdSchema,
  channelId: LogicalIdSchema,
  ownerActorId: InstanceIdSchema,
  position: VectorSchema,
  velocity: VectorSchema,
  damage: FiniteNumberSchema.positive(),
  generation: NonNegativeIntegerSchema,
});

export const ContactCandidatePayloadSchema = PayloadEnvelopeSchema.extend({
  contactId: LogicalIdSchema,
  sourceChannelId: LogicalIdSchema,
  sourceEntityId: InstanceIdSchema,
  sourceGeneration: NonNegativeIntegerSchema,
  sourceActorId: InstanceIdSchema,
  targetActorId: InstanceIdSchema,
  contactSequence: NonNegativeIntegerSchema,
  metadata: z.strictObject({
    damage: FiniteNumberSchema.positive(),
    damageKind: z.enum(["projectile", "beam", "field", "contact"]),
  }),
});

export const ContactDispositionSchema = z.enum([
  "damage",
  "absorb",
  "reflect",
  "cancel",
  "ignore",
]);
export const ContactSourceOperationSchema = z.enum([
  "consume",
  "retain",
  "transfer",
]);

export const ContactDecisionPairMatrix = Object.freeze({
  damage: Object.freeze(["consume", "retain"]),
  absorb: Object.freeze(["consume"]),
  reflect: Object.freeze(["transfer"]),
  cancel: Object.freeze(["consume"]),
  ignore: Object.freeze(["retain"]),
} satisfies Readonly<
  Record<
    z.infer<typeof ContactDispositionSchema>,
    readonly z.infer<typeof ContactSourceOperationSchema>[]
  >
>);

export function isLegalContactDecisionPair(
  disposition: z.infer<typeof ContactDispositionSchema>,
  sourceOperation: z.infer<typeof ContactSourceOperationSchema>,
): boolean {
  return (ContactDecisionPairMatrix[disposition] as readonly string[]).includes(
    sourceOperation,
  );
}

export const ContactDecisionPayloadSchema = z
  .strictObject({
    contactId: LogicalIdSchema,
    sourceChannelId: LogicalIdSchema,
    sourceEntityId: InstanceIdSchema,
    sourceGeneration: NonNegativeIntegerSchema,
    sourceActorId: InstanceIdSchema,
    targetActorId: InstanceIdSchema,
    contactSequence: NonNegativeIntegerSchema,
    metadata: z.strictObject({
      damage: FiniteNumberSchema.positive(),
      damageKind: z.enum(["projectile", "beam", "field", "contact"]),
    }),
    disposition: ContactDispositionSchema,
    sourceOperation: ContactSourceOperationSchema,
    damage: FiniteNumberSchema.positive().optional(),
    transferTargetActorId: InstanceIdSchema.optional(),
    policyTrace: z.array(LogicalIdSchema).max(16),
  })
  .superRefine((decision, context) => {
    if (
      !isLegalContactDecisionPair(
        decision.disposition,
        decision.sourceOperation,
      )
    ) {
      context.addIssue({
        code: "custom",
        message: `illegal contact decision pair: ${decision.disposition}/${decision.sourceOperation}`,
        path: ["sourceOperation"],
      });
    }
    if (decision.disposition === "damage" && decision.damage === undefined) {
      context.addIssue({
        code: "custom",
        message: "damage disposition requires damage",
        path: ["damage"],
      });
    }
    if (decision.disposition !== "damage" && decision.damage !== undefined) {
      context.addIssue({
        code: "custom",
        message: "damage is allowed only for damage disposition",
        path: ["damage"],
      });
    }
    if (
      decision.sourceOperation === "transfer" &&
      decision.transferTargetActorId === undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "transfer operation requires transferTargetActorId",
        path: ["transferTargetActorId"],
      });
    }
    if (
      decision.sourceOperation !== "transfer" &&
      decision.transferTargetActorId !== undefined
    ) {
      context.addIssue({
        code: "custom",
        message: "transferTargetActorId is allowed only for transfer",
        path: ["transferTargetActorId"],
      });
    }
  });

export const HitPayloadSchema = PayloadEnvelopeSchema.extend({
  sourceEntityId: InstanceIdSchema,
  targetActorId: InstanceIdSchema,
  contactSequence: NonNegativeIntegerSchema,
  consumed: z.boolean(),
});

export const DamagePayloadSchema = PayloadEnvelopeSchema.extend({
  sourceActorId: InstanceIdSchema,
  targetActorId: InstanceIdSchema,
  amount: FiniteNumberSchema.positive(),
  damageKind: z.enum(["projectile", "beam", "field", "contact"]),
  contactSequence: NonNegativeIntegerSchema,
});

export const HealthStatePayloadSchema = z
  .strictObject({
    revision: NonNegativeIntegerSchema,
    emittedAtMs: NonNegativeIntegerSchema,
    actorId: InstanceIdSchema,
    current: FiniteNumberSchema.min(0),
    maximum: FiniteNumberSchema.positive(),
    delta: FiniteNumberSchema,
    reason: z.enum(["initialized", "damaged", "depleted"]),
  })
  .refine((state) => state.current <= state.maximum, {
    message: "current health cannot exceed maximum health",
    path: ["current"],
  });

export const HealthStatePayloadV2Schema = z
  .strictObject({
    revision: SafeNonNegativeIntegerSchema,
    emittedAtMs: SafeNonNegativeIntegerSchema,
    actorId: InstanceIdSchema,
    current: FiniteNumberSchema.min(0),
    maximum: FiniteNumberSchema.positive(),
    delta: FiniteNumberSchema,
    reason: z.enum(["initialized", "damaged", "healed", "depleted"]),
  })
  .refine((state) => state.current <= state.maximum, {
    message: "current health cannot exceed maximum health",
    path: ["current"],
  });

const ActorRootIdSchema = z
  .string()
  .max(140)
  .regex(/^root\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/[0-9]+$/);
const EvidenceIdentitySchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9][a-z0-9./:-]*$/);
const ActorRootReferenceShape = {
  rootChannelId: LogicalIdSchema,
  actorId: ActorRootIdSchema,
  actorGeneration: SafeNonNegativeIntegerSchema,
  actorRole: z.enum(["enemy", "boss"]),
};

export const ActorRootChannelPayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  rootChannelId: LogicalIdSchema,
  producerInstanceId: InstanceIdSchema,
  actorRole: z.enum(["enemy", "boss"]),
  capacity: z.number().int().min(1).max(10_000),
});

export const ActorRootLifecyclePayloadSchema = PayloadEnvelopeSchema.extend({
  ...ActorRootReferenceShape,
  sourceId: LogicalIdSchema,
  reason: z.enum([
    "activated",
    "offscreen",
    "health-depleted",
    "body-contact",
    "boss-handoff",
    "phase-transition",
    "terminal-cleanup",
  ]),
  position: VectorSchema,
});

export const ActorDefeatedPayloadSchema = PayloadEnvelopeSchema.extend({
  ...ActorRootReferenceShape,
  sourceId: LogicalIdSchema,
  healthEvidenceId: EvidenceIdentitySchema,
});

export const EncounterPatternActivationPayloadSchema =
  PayloadEnvelopeSchema.extend({
    ...ActorRootReferenceShape,
    attackChannelId: LogicalIdSchema,
    patternSourceId: LogicalIdSchema,
    startsAtMs: SafeNonNegativeIntegerSchema,
    endsAtMs: SafeNonNegativeIntegerSchema,
    intervalMs: z.number().int().min(1).max(60_000),
  }).refine((value) => value.endsAtMs >= value.startsAtMs, {
    message: "pattern activation end cannot precede start",
    path: ["endsAtMs"],
  });

export const EncounterHandoffPayloadSchema = PayloadEnvelopeSchema.extend({
  handoffId: LogicalIdSchema,
  bossStartMs: SafeNonNegativeIntegerSchema,
  status: z.enum(["requested", "cleared"]),
});

export const AttackRequestPayloadV3Schema = PayloadEnvelopeSchema.extend({
  requestedAtMs: SafeNonNegativeIntegerSchema,
  attackChannelId: LogicalIdSchema,
  rootChannelId: LogicalIdSchema,
  sourceActorId: ActorRootIdSchema,
  sourceGeneration: SafeNonNegativeIntegerSchema,
  patternSourceId: LogicalIdSchema,
  emissionIndex: SafeNonNegativeIntegerSchema,
});

export const TargetedAttackPayloadSchema = AttackRequestPayloadV3Schema.extend({
  sourcePosition: VectorSchema,
  direction: NormalizedDirectionSchema,
});

export const EmissionPayloadV2Schema = TargetedAttackPayloadSchema.extend({
  projectileEntityId: InstanceIdSchema,
  projectileChannelId: LogicalIdSchema,
  projectileGeneration: SafeNonNegativeIntegerSchema,
  position: VectorSchema,
  velocity: VectorSchema,
  damage: FiniteNumberSchema.positive(),
});

const ContactCandidateV2BaseSchema = PayloadEnvelopeSchema.extend({
  contactId: LogicalIdSchema,
  contactSequence: SafeNonNegativeIntegerSchema,
  damage: FiniteNumberSchema.positive(),
});

export const ContactCandidatePayloadV2Schema = z.discriminatedUnion(
  "contactKind",
  [
    ContactCandidateV2BaseSchema.extend({
      contactKind: z.literal("projectile-root"),
      sourceChannelId: LogicalIdSchema,
      sourceEntityId: InstanceIdSchema,
      sourceGeneration: SafeNonNegativeIntegerSchema,
      sourceActorId: InstanceIdSchema,
      targetRootChannelId: LogicalIdSchema,
      targetActorId: ActorRootIdSchema,
      targetActorGeneration: SafeNonNegativeIntegerSchema,
    }),
    ContactCandidateV2BaseSchema.extend({
      contactKind: z.literal("actor-root-player"),
      sourceRootChannelId: LogicalIdSchema,
      sourceActorId: ActorRootIdSchema,
      sourceActorGeneration: SafeNonNegativeIntegerSchema,
      targetActorId: InstanceIdSchema,
    }),
  ],
);

export const ContactDecisionPayloadV2Schema = z
  .discriminatedUnion("sourceOperation", [
    z.strictObject({
      candidate: ContactCandidatePayloadV2Schema,
      disposition: z.literal("damage"),
      sourceOperation: z.literal("consume"),
      damage: FiniteNumberSchema.positive(),
      routeId: LogicalIdSchema,
    }),
    z.strictObject({
      candidate: ContactCandidatePayloadV2Schema,
      disposition: z.literal("damage"),
      sourceOperation: z.literal("deactivate-root"),
      damage: FiniteNumberSchema.positive(),
      routeId: LogicalIdSchema,
    }),
  ])
  .superRefine((decision, context) => {
    if (
      (decision.sourceOperation === "consume" &&
        decision.candidate.contactKind !== "projectile-root") ||
      (decision.sourceOperation === "deactivate-root" &&
        decision.candidate.contactKind !== "actor-root-player")
    )
      context.addIssue({
        code: "custom",
        message: "contact-decision-v2 source operation/contact kind mismatch",
        path: ["sourceOperation"],
      });
  });

export const DamagePayloadV2Schema = PayloadEnvelopeSchema.extend({
  sourceEvidenceId: EvidenceIdentitySchema,
  targetRootChannelId: LogicalIdSchema,
  targetActorId: ActorRootIdSchema,
  targetActorGeneration: SafeNonNegativeIntegerSchema,
  amount: FiniteNumberSchema.positive(),
  damageKind: z.enum(["projectile", "contact"]),
});

export const HealthStatePayloadV3Schema = z
  .strictObject({
    revision: SafeNonNegativeIntegerSchema,
    emittedAtMs: SafeNonNegativeIntegerSchema,
    ...ActorRootReferenceShape,
    sourceId: LogicalIdSchema,
    current: FiniteNumberSchema.min(0),
    maximum: FiniteNumberSchema.positive(),
    ratio: FiniteNumberSchema.min(0).max(1),
    reason: z.enum(["initialized", "damaged", "depleted"]),
  })
  .superRefine((state, context) => {
    if (
      state.current > state.maximum ||
      state.ratio !== state.current / state.maximum
    )
      context.addIssue({
        code: "custom",
        message: "health-state-v3 current/maximum/ratio mismatch",
        path: ["ratio"],
      });
  });

export const DefeatEvidencePayloadSchema = PayloadEnvelopeSchema.extend({
  ...ActorRootReferenceShape,
  sourceId: LogicalIdSchema,
  deactivationEvidenceId: EvidenceIdentitySchema,
  baseScore: FiniteNumberSchema.min(0).max(Number.MAX_SAFE_INTEGER),
});

export const ScoreSourcePayloadSchema = PayloadEnvelopeSchema.extend({
  sourceEvidenceId: EvidenceIdentitySchema,
  kind: z.enum(["defeat", "graze", "pickup"]),
  baseAward: FiniteNumberSchema.min(0).max(Number.MAX_SAFE_INTEGER),
});

export const ScoreTransactionPayloadSchema = PayloadEnvelopeSchema.extend({
  sourceEvidenceId: EvidenceIdentitySchema,
  kind: z.enum(["defeat", "graze", "pickup"]),
  award: FiniteNumberSchema.min(0).max(Number.MAX_SAFE_INTEGER),
});

export const ScoreStatePayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  total: FiniteNumberSchema.min(0).max(Number.MAX_SAFE_INTEGER),
  transactionCount: SafeNonNegativeIntegerSchema,
  defeatCount: SafeNonNegativeIntegerSchema,
  grazeCount: SafeNonNegativeIntegerSchema,
  pickupCount: SafeNonNegativeIntegerSchema,
});

export const OutcomeConditionPayloadSchema = z.strictObject({
  revision: SafeNonNegativeIntegerSchema,
  emittedAtMs: SafeNonNegativeIntegerSchema,
  providerInstanceId: InstanceIdSchema,
  candidate: z.enum(["win", "loss"]),
  met: z.boolean(),
  reason: z.enum([
    "player-health",
    "boss-defeat",
    "score-threshold",
    "survival-time",
  ]),
  observedAtMs: SafeNonNegativeIntegerSchema,
  eligibleFrameSequence: SafeNonNegativeIntegerSchema,
  evidenceId: EvidenceIdentitySchema,
});

export const TerminalDecisionPayloadSchema = z.strictObject({
  sequence: SafeNonNegativeIntegerSchema,
  committedAtMs: SafeNonNegativeIntegerSchema,
  frameSequence: SafeNonNegativeIntegerSchema,
  outcome: z.enum(["win", "loss"]),
  reason: OutcomeConditionPayloadSchema.shape.reason,
  elapsedMs: SafeNonNegativeIntegerSchema,
  score: FiniteNumberSchema.min(0).max(Number.MAX_SAFE_INTEGER),
  conditionEvidenceId: EvidenceIdentitySchema,
});

export const RuntimePayloadSchemas = Object.freeze({
  "movement-command-v1": MovementCommandPayloadSchema,
  "resolved-movement-command-v1": ResolvedMovementCommandPayloadSchema,
  "target-selection-v1": TargetSelectionPayloadSchema,
  "attack-request-v1": AttackRequestPayloadSchema,
  "aim-command-v1": AimCommandPayloadSchema,
  "attack-intent-v1": AttackIntentPayloadSchema,
  "focus-state-v1": FocusStatePayloadSchema,
  "movement-scale-v1": MovementScalePayloadSchema,
  "target-solution-v1": TargetSolutionPayloadSchema,
  "attack-request-v2": AttackRequestPayloadV2Schema,
  "actor-root-channel-v1": ActorRootChannelPayloadSchema,
  "actor-root-lifecycle-v1": ActorRootLifecyclePayloadSchema,
  "actor-defeated-v1": ActorDefeatedPayloadSchema,
  "encounter-pattern-activation-v1": EncounterPatternActivationPayloadSchema,
  "encounter-handoff-v1": EncounterHandoffPayloadSchema,
  "attack-request-v3": AttackRequestPayloadV3Schema,
  "targeted-attack-v1": TargetedAttackPayloadSchema,
  "emission-v2": EmissionPayloadV2Schema,
  "entity-channel-v1": EntityChannelPayloadSchema,
  "emission-v1": EmissionPayloadSchema,
  "contact-candidate-v1": ContactCandidatePayloadSchema,
  "contact-decision-v1": ContactDecisionPayloadSchema,
  "contact-candidate-v2": ContactCandidatePayloadV2Schema,
  "contact-decision-v2": ContactDecisionPayloadV2Schema,
  "hit-v1": HitPayloadSchema,
  "damage-v1": DamagePayloadSchema,
  "damage-v2": DamagePayloadV2Schema,
  "health-state-v1": HealthStatePayloadSchema,
  "health-state-v2": HealthStatePayloadV2Schema,
  "health-state-v3": HealthStatePayloadV3Schema,
  "defeat-evidence-v1": DefeatEvidencePayloadSchema,
  "score-source-v1": ScoreSourcePayloadSchema,
  "score-transaction-v1": ScoreTransactionPayloadSchema,
  "score-state-v1": ScoreStatePayloadSchema,
  "outcome-condition-v1": OutcomeConditionPayloadSchema,
  "terminal-decision-v1": TerminalDecisionPayloadSchema,
  "modifier-application-v1": ModifierApplicationPayloadSchema,
  "modifier-state-v1": ModifierStatePayloadSchema,
  "defense-state-v1": DefenseStatePayloadSchema,
  "defense-result-v1": DefenseResultPayloadSchema,
  "graze-v1": GrazePayloadSchema,
  "pickup-collected-v1": PickupCollectedPayloadSchema,
});

export type MovementCommandPayload = z.infer<
  typeof MovementCommandPayloadSchema
>;
export type ResolvedMovementCommandPayload = z.infer<
  typeof ResolvedMovementCommandPayloadSchema
>;
export type TargetSelectionPayload = z.infer<
  typeof TargetSelectionPayloadSchema
>;
export type AttackRequestPayload = z.infer<typeof AttackRequestPayloadSchema>;
export type EntityChannelPayload = z.infer<typeof EntityChannelPayloadSchema>;
export type EmissionPayload = z.infer<typeof EmissionPayloadSchema>;
export type ContactCandidatePayload = z.infer<
  typeof ContactCandidatePayloadSchema
>;
export type ContactDecisionPayload = z.infer<
  typeof ContactDecisionPayloadSchema
>;
export type HitPayload = z.infer<typeof HitPayloadSchema>;
export type DamagePayload = z.infer<typeof DamagePayloadSchema>;
export type HealthStatePayload = z.infer<typeof HealthStatePayloadSchema>;
export type AttackRequestPayloadV3 = z.infer<
  typeof AttackRequestPayloadV3Schema
>;
export type EncounterHandoffPayload = z.infer<
  typeof EncounterHandoffPayloadSchema
>;
export type TargetedAttackPayload = z.infer<typeof TargetedAttackPayloadSchema>;
export type EmissionPayloadV2 = z.infer<typeof EmissionPayloadV2Schema>;
export type ContactCandidatePayloadV2 = z.infer<
  typeof ContactCandidatePayloadV2Schema
>;
export type ContactDecisionPayloadV2 = z.infer<
  typeof ContactDecisionPayloadV2Schema
>;
export type DamagePayloadV2 = z.infer<typeof DamagePayloadV2Schema>;
export type HealthStatePayloadV3 = z.infer<typeof HealthStatePayloadV3Schema>;
export type ScoreTransactionPayload = z.infer<
  typeof ScoreTransactionPayloadSchema
>;
export type ScoreStatePayload = z.infer<typeof ScoreStatePayloadSchema>;
export type OutcomeConditionPayload = z.infer<
  typeof OutcomeConditionPayloadSchema
>;
export type TerminalDecisionPayload = z.infer<
  typeof TerminalDecisionPayloadSchema
>;
