import { createHash } from "node:crypto";

import { z } from "zod";

import { canonicalJsonBytes } from "../modules/game-module-execution-contract.js";

export const GAME_DESIGN_V2_SCHEMA_VERSION = "2.0.0" as const;

const Sha256Schema = z
  .string()
  .regex(/^[0-9a-f]{64}$/u, "must be a lowercase SHA-256 hex digest");

export const DesignIdSchema = z
  .string()
  .min(3)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    "design ids must be lowercase kebab-case identifiers",
  )
  .meta({ id: "DesignId" });

export const DesignLabelSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/u,
    "design labels must be lowercase kebab-case",
  )
  .meta({ id: "DesignLabel" });

const TextSchema = z.string().trim().min(1).max(600);
const RationaleSchema = z.string().trim().min(1).max(400);
const FiniteNumberSchema = z.number();
const DurationMsSchema = z.number().int().min(0).max(86_400_000);
const CountSchema = z.number().int().min(0).max(1_000_000);

export const DesignProcessOwnerSchema = z
  .discriminatedUnion("type", [
    z.strictObject({ type: z.literal("actor"), id: DesignIdSchema }),
    z.strictObject({ type: z.literal("world") }),
    z.strictObject({ type: z.literal("encounter") }),
    z.strictObject({ type: z.literal("progression") }),
    z.strictObject({ type: z.literal("hazard") }),
  ])
  .meta({ id: "DesignProcessOwner" });
export type DesignProcessOwner = z.infer<typeof DesignProcessOwnerSchema>;

export const DesignPredicateTargetSchema = z
  .discriminatedUnion("type", [
    z.strictObject({ type: z.literal("resource"), id: DesignIdSchema }),
    z.strictObject({
      type: z.literal("state"),
      id: DesignIdSchema,
      equals: DesignLabelSchema.optional(),
    }),
    z.strictObject({ type: z.literal("event"), id: DesignIdSchema }),
    z.strictObject({ type: z.literal("timer"), id: DesignIdSchema }),
  ])
  .meta({ id: "DesignPredicateTarget" });

export const DesignPredicateSchema = z
  .strictObject({
    kind: z.literal("predicate"),
    target: DesignPredicateTargetSchema,
    comparator: z
      .enum([
        "eq",
        "ne",
        "lt",
        "lte",
        "gt",
        "gte",
        "occurred",
        "active",
        "in-state",
      ])
      .optional(),
    value: FiniteNumberSchema.optional(),
  })
  .meta({ id: "DesignPredicate" });
export type DesignPredicate = z.infer<typeof DesignPredicateSchema>;

export type DesignConditionNode =
  | DesignPredicate
  | { kind: "all"; of: DesignConditionNode[] }
  | { kind: "any"; of: DesignConditionNode[] }
  | { kind: "not"; of: DesignConditionNode };

export const DesignConditionNodeSchema: z.ZodType<DesignConditionNode> = z
  .lazy(() =>
    z.union([
      DesignPredicateSchema,
      z.strictObject({
        kind: z.literal("all"),
        of: z.array(DesignConditionNodeSchema).min(1).max(12),
      }),
      z.strictObject({
        kind: z.literal("any"),
        of: z.array(DesignConditionNodeSchema).min(1).max(12),
      }),
      z.strictObject({ kind: z.literal("not"), of: DesignConditionNodeSchema }),
    ]),
  )
  .meta({ id: "DesignCondition" });

export const DesignEffectSchema = z
  .discriminatedUnion("kind", [
    z.strictObject({
      kind: z.literal("resource-change"),
      resource: DesignIdSchema,
      operation: z.enum(["set", "increment", "decrement", "multiply"]),
      amount: FiniteNumberSchema,
    }),
    z.strictObject({
      kind: z.literal("state-transition"),
      state: DesignIdSchema,
      to: DesignLabelSchema,
      from: DesignLabelSchema.optional(),
    }),
    z.strictObject({ kind: z.literal("emit-event"), event: DesignIdSchema }),
    z.strictObject({
      kind: z.literal("spawn"),
      actor: DesignIdSchema,
      count: CountSchema,
    }),
    z.strictObject({ kind: z.literal("despawn"), actor: DesignIdSchema }),
    z.strictObject({
      kind: z.literal("outcome-request"),
      outcome: DesignIdSchema,
    }),
    z.strictObject({
      kind: z.literal("behavior"),
      behavior: DesignLabelSchema,
      subject: DesignIdSchema.optional(),
      target: DesignIdSchema.optional(),
    }),
  ])
  .meta({ id: "DesignEffect" });
export type DesignEffect = z.infer<typeof DesignEffectSchema>;

export const DesignTriggerSchema = z
  .discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("event"), event: DesignIdSchema }),
    z.strictObject({
      kind: z.literal("condition"),
      condition: DesignConditionNodeSchema,
    }),
  ])
  .meta({ id: "DesignTrigger" });
export type DesignTrigger = z.infer<typeof DesignTriggerSchema>;

export const DesignActorSchema = z.strictObject({
  id: DesignIdSchema,
  role: DesignLabelSchema,
  capabilityTags: z.array(DesignLabelSchema).max(16),
});

export const DesignResourceSchema = z
  .strictObject({
    id: DesignIdSchema,
    initial: FiniteNumberSchema.optional(),
    min: FiniteNumberSchema.optional(),
    max: FiniteNumberSchema.optional(),
    unit: DesignLabelSchema.optional(),
  })
  .superRefine((resource, context) => {
    if (
      resource.min !== undefined &&
      resource.max !== undefined &&
      resource.min > resource.max
    ) {
      context.addIssue({
        code: "custom",
        path: ["min"],
        message: "resource min must not exceed max",
      });
    }
    if (
      resource.initial !== undefined &&
      resource.min !== undefined &&
      resource.initial < resource.min
    ) {
      context.addIssue({
        code: "custom",
        path: ["initial"],
        message: "resource initial must not be below min",
      });
    }
    if (
      resource.initial !== undefined &&
      resource.max !== undefined &&
      resource.initial > resource.max
    ) {
      context.addIssue({
        code: "custom",
        path: ["initial"],
        message: "resource initial must not exceed max",
      });
    }
  });

export const DesignStateSchema = z
  .strictObject({
    id: DesignIdSchema,
    values: z.array(DesignLabelSchema).min(1).max(32),
    initial: DesignLabelSchema,
  })
  .superRefine((state, context) => {
    if (!state.values.includes(state.initial)) {
      context.addIssue({
        code: "custom",
        path: ["initial"],
        message: "state initial must be one of values",
      });
    }
    if (new Set(state.values).size !== state.values.length) {
      context.addIssue({
        code: "custom",
        path: ["values"],
        message: "state values must be unique",
      });
    }
  });

export const DesignActionSchema = z.strictObject({
  id: DesignIdSchema,
  actor: DesignIdSchema,
  kind: DesignLabelSchema,
  emits: DesignIdSchema.optional(),
  effects: z.array(DesignEffectSchema).max(24),
});

export const DesignEventSchema = z.strictObject({ id: DesignIdSchema });

export const DesignTimerSchema = z
  .strictObject({
    id: DesignIdSchema,
    mode: z.enum(["delay", "interval"]),
    durationMs: DurationMsSchema,
    repeat: z.enum(["once", "finite", "infinite"]),
    repeatCount: z.number().int().min(1).max(1_000_000).optional(),
    startOn: DesignIdSchema.optional(),
    stopOn: DesignIdSchema.optional(),
    emits: DesignIdSchema,
  })
  .superRefine((timer, context) => {
    if ((timer.repeat === "finite") !== (timer.repeatCount !== undefined)) {
      context.addIssue({
        code: "custom",
        path: ["repeatCount"],
        message: "repeatCount is required exactly when repeat is finite",
      });
    }
  });

export const DesignRuleSchema = z.strictObject({
  id: DesignIdSchema,
  when: DesignTriggerSchema,
  conditions: DesignConditionNodeSchema.optional(),
  effects: z.array(DesignEffectSchema).min(1).max(24),
});

export const DesignProcessCadenceSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("timer"), timer: DesignIdSchema }),
  z.strictObject({ kind: z.literal("interval"), intervalMs: DurationMsSchema }),
  z.strictObject({ kind: z.literal("continuous") }),
]);

export const DesignProcessSchema = z.strictObject({
  id: DesignIdSchema,
  owner: DesignProcessOwnerSchema,
  startOn: DesignIdSchema.optional(),
  stopOn: DesignIdSchema.optional(),
  cadence: DesignProcessCadenceSchema,
  conditions: DesignConditionNodeSchema.optional(),
  effects: z.array(DesignEffectSchema).min(1).max(24),
});

export const DesignOutcomeSchema = z.strictObject({
  id: DesignIdSchema,
  result: z.enum(["won", "lost"]),
  when: DesignTriggerSchema,
  priority: z.number().int().min(0).max(1_000_000),
  terminal: z.boolean(),
});

export const SystemDesignSchema = z.strictObject({
  actors: z.array(DesignActorSchema).min(1).max(64),
  resources: z.array(DesignResourceSchema).max(64),
  states: z.array(DesignStateSchema).max(64),
  actions: z.array(DesignActionSchema).max(64),
  events: z.array(DesignEventSchema).max(128),
  timers: z.array(DesignTimerSchema).max(64),
  rules: z.array(DesignRuleSchema).max(128),
  processes: z.array(DesignProcessSchema).max(64),
  outcomes: z.array(DesignOutcomeSchema).max(32),
});
export type SystemDesign = z.infer<typeof SystemDesignSchema>;

export const DesignViewportSchema = z
  .strictObject({
    id: DesignIdSchema,
    orientation: z.enum(["horizontal", "vertical"]),
    logicalWidth: z.number().int().min(1).max(100_000),
    logicalHeight: z.number().int().min(1).max(100_000),
    scaling: z.literal("uniform"),
    letterbox: z.enum(["allow-bars", "no-bars"]),
  })
  .superRefine((viewport, context) => {
    const legal =
      viewport.orientation === "horizontal"
        ? viewport.logicalWidth > viewport.logicalHeight
        : viewport.logicalHeight > viewport.logicalWidth;
    if (!legal) {
      context.addIssue({
        code: "custom",
        path: ["orientation"],
        message: "viewport dimensions must agree with orientation",
      });
    }
  });

export const DesignTopologySchema = z.strictObject({
  id: DesignIdSchema,
  kind: DesignLabelSchema,
});

export const DesignMovementProfileSchema = z.strictObject({
  id: DesignIdSchema,
  subject: DesignIdSchema,
  dimensions: z.enum(["none", "1d", "2d"]),
  axes: z
    .array(z.enum(["x", "y"]))
    .max(2)
    .optional(),
  constrainedToBoundaryId: DesignIdSchema.optional(),
  speedPerSecond: FiniteNumberSchema.nonnegative().optional(),
});

export const DesignAimingProfileSchema = z.strictObject({
  id: DesignIdSchema,
  subject: DesignIdSchema.optional(),
  mode: DesignLabelSchema,
  fixedDirection: z
    .strictObject({ x: FiniteNumberSchema, y: FiniteNumberSchema })
    .optional(),
  cooldownMs: DurationMsSchema.optional(),
  projectileSpeedPerSecond: FiniteNumberSchema.nonnegative().optional(),
});

export const DesignCameraSchema = z.strictObject({
  id: DesignIdSchema,
  mode: DesignLabelSchema,
  target: DesignIdSchema.optional(),
});

export const DesignSpawnPolicySchema = z.strictObject({
  id: DesignIdSchema,
  owner: DesignProcessOwnerSchema,
  spawns: DesignIdSchema.optional(),
  region: DesignLabelSchema,
  activationCondition: DesignConditionNodeSchema.optional(),
  activationEvent: DesignIdSchema.optional(),
  minimumDistance: FiniteNumberSchema.nonnegative().optional(),
  offscreenPolicy: DesignLabelSchema,
});

export const DesignBoundarySchema = z.strictObject({
  id: DesignIdSchema,
  subject: DesignIdSchema.optional(),
  appliesTo: DesignLabelSchema,
  behavior: z.enum(["block", "clamp", "wrap", "destroy", "none"]),
});

export const DesignCullingPolicySchema = z.strictObject({
  id: DesignIdSchema,
  subject: DesignIdSchema.optional(),
  appliesTo: DesignLabelSchema,
  rule: DesignLabelSchema,
});

export const SpatialDesignSchema = z.strictObject({
  viewport: DesignViewportSchema,
  topology: DesignTopologySchema,
  movement: z.array(DesignMovementProfileSchema).max(64),
  aiming: z.array(DesignAimingProfileSchema).max(64),
  camera: DesignCameraSchema,
  spawn: z.array(DesignSpawnPolicySchema).max(64),
  boundaries: z.array(DesignBoundarySchema).max(64),
  culling: z.array(DesignCullingPolicySchema).max(64),
});
export type SpatialDesign = z.infer<typeof SpatialDesignSchema>;

export const GameplayDesignSchema = z.strictObject({
  coreLoop: z.strictObject({
    id: DesignIdSchema,
    summary: TextSchema,
    actionIds: z.array(DesignIdSchema).max(32),
  }),
  progression: z.strictObject({
    id: DesignIdSchema,
    model: DesignLabelSchema,
    summary: TextSchema,
  }),
  pacing: z.strictObject({
    id: DesignIdSchema,
    model: DesignLabelSchema,
    summary: TextSchema,
  }),
});
export type GameplayDesign = z.infer<typeof GameplayDesignSchema>;

export const DesignBindingTargetSchema = z
  .strictObject({ nodeId: DesignIdSchema })
  .meta({ id: "DesignBindingTarget" });

export const DesignDecisionSchema = z.discriminatedUnion("source", [
  z.strictObject({
    id: DesignIdSchema,
    source: z.literal("user-declared"),
    statementId: DesignIdSchema,
    targets: z.array(DesignBindingTargetSchema).min(1).max(16),
  }),
  z.strictObject({
    id: DesignIdSchema,
    source: z.literal("system-default"),
    statementId: DesignIdSchema,
    targets: z.array(DesignBindingTargetSchema).min(1).max(16),
  }),
  z.strictObject({
    id: DesignIdSchema,
    source: z.literal("agent-derived"),
    rationale: RationaleSchema,
    targets: z.array(DesignBindingTargetSchema).min(1).max(16),
  }),
]);
export type DesignDecision = z.infer<typeof DesignDecisionSchema>;

export const DesignExclusionSchema = z.strictObject({
  id: DesignIdSchema,
  capability: DesignLabelSchema,
});

export const DesignConstraintSchema = z.strictObject({
  id: DesignIdSchema,
  kind: DesignLabelSchema,
});

export const DesignForbiddenBindingSchema = z.strictObject({
  id: DesignIdSchema,
  statementId: DesignIdSchema,
  exclusion: DesignIdSchema,
});

export const RequirementBindingsSchema = z.strictObject({
  constraints: z.array(DesignConstraintSchema).max(64),
  exclusions: z.array(DesignExclusionSchema).max(64),
  decisions: z.array(DesignDecisionSchema).max(200),
  forbidden: z.array(DesignForbiddenBindingSchema).max(64),
});
export type RequirementBindings = z.infer<typeof RequirementBindingsSchema>;

function collectNodeIds(design: {
  gameplayDesign: GameplayDesign;
  systemDesign: SystemDesign;
  spatialDesign: SpatialDesign;
  requirementBindings: RequirementBindings;
}): string[] {
  const gameplay = design.gameplayDesign;
  const system = design.systemDesign;
  const spatial = design.spatialDesign;
  return [
    gameplay.coreLoop.id,
    gameplay.progression.id,
    gameplay.pacing.id,
    ...system.actors.map((value) => value.id),
    ...system.resources.map((value) => value.id),
    ...system.states.map((value) => value.id),
    ...system.actions.map((value) => value.id),
    ...system.events.map((value) => value.id),
    ...system.timers.map((value) => value.id),
    ...system.rules.map((value) => value.id),
    ...system.processes.map((value) => value.id),
    ...system.outcomes.map((value) => value.id),
    spatial.viewport.id,
    spatial.topology.id,
    ...spatial.movement.map((value) => value.id),
    ...spatial.aiming.map((value) => value.id),
    spatial.camera.id,
    ...spatial.spawn.map((value) => value.id),
    ...spatial.boundaries.map((value) => value.id),
    ...spatial.culling.map((value) => value.id),
    ...design.requirementBindings.constraints.map((value) => value.id),
    ...design.requirementBindings.exclusions.map((value) => value.id),
  ];
}

function refineGameDesignStructure(
  design: {
    gameplayDesign: GameplayDesign;
    systemDesign: SystemDesign;
    spatialDesign: SpatialDesign;
    requirementBindings: RequirementBindings;
  },
  context: z.core.$RefinementCtx,
): void {
  const seen = new Set<string>();
  for (const id of collectNodeIds(design)) {
    if (seen.has(id)) {
      context.addIssue({
        code: "custom",
        path: [],
        message: `duplicate design node id: ${id}`,
      });
    }
    seen.add(id);
  }

  const bindingIds = [
    ...design.requirementBindings.decisions.map((value) => value.id),
    ...design.requirementBindings.forbidden.map((value) => value.id),
  ];
  if (new Set(bindingIds).size !== bindingIds.length) {
    context.addIssue({
      code: "custom",
      path: ["requirementBindings"],
      message: "requirement binding ids must be unique",
    });
  }

  const priorities = new Set<number>();
  for (const outcome of design.systemDesign.outcomes) {
    if (!outcome.terminal) continue;
    if (priorities.has(outcome.priority)) {
      context.addIssue({
        code: "custom",
        path: ["systemDesign", "outcomes"],
        message: "terminal outcome priorities must be unique",
      });
    }
    priorities.add(outcome.priority);
  }
}

export const GameDesignV2BodySchema = z
  .strictObject({
    schemaVersion: z.literal(GAME_DESIGN_V2_SCHEMA_VERSION),
    kind: z.literal("GameDesignV2"),
    gameplayDesign: GameplayDesignSchema,
    systemDesign: SystemDesignSchema,
    spatialDesign: SpatialDesignSchema,
    requirementBindings: RequirementBindingsSchema,
  })
  .superRefine(refineGameDesignStructure);
export type GameDesignV2Body = z.infer<typeof GameDesignV2BodySchema>;

export const GameDesignV2SourcesSchema = z.strictObject({
  request: z.strictObject({ sha256: Sha256Schema }),
  gameSpec: z.strictObject({
    schemaVersion: z.literal("2.0.0"),
    sha256: Sha256Schema,
  }),
  intentLedger: z.strictObject({
    schemaVersion: z.literal("2.0.0"),
    sha256: Sha256Schema,
  }),
});

export const GameDesignV2Schema = z
  .strictObject({
    schemaVersion: z.literal(GAME_DESIGN_V2_SCHEMA_VERSION),
    kind: z.literal("GameDesignV2"),
    sources: GameDesignV2SourcesSchema,
    gameplayDesign: GameplayDesignSchema,
    systemDesign: SystemDesignSchema,
    spatialDesign: SpatialDesignSchema,
    requirementBindings: RequirementBindingsSchema,
  })
  .superRefine(refineGameDesignStructure);
export type GameDesignV2 = z.infer<typeof GameDesignV2Schema>;

export function parseGameDesignV2Body(input: unknown): GameDesignV2Body {
  return GameDesignV2BodySchema.parse(input);
}

export function parseGameDesignV2(input: unknown): GameDesignV2 {
  return GameDesignV2Schema.parse(input);
}

export function validateGameDesignV2(input: unknown) {
  return GameDesignV2Schema.safeParse(input);
}

export function collectGameDesignV2Ids(design: GameDesignV2): string[] {
  return collectNodeIds(design);
}

export function canonicalGameDesignV2Json(rawDesign: unknown): string {
  return Buffer.from(
    canonicalJsonBytes(GameDesignV2Schema.parse(rawDesign)),
  ).toString("utf8");
}

export function sha256GameDesignV2(rawDesign: unknown): string {
  return createHash("sha256")
    .update(canonicalJsonBytes(GameDesignV2Schema.parse(rawDesign)))
    .digest("hex");
}

export function toGameDesignV2JsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(GameDesignV2Schema, {
    target: "draft-2020-12",
    unrepresentable: "throw",
  }) as Record<string, unknown>;
}

export function toGameDesignV2BodyJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(GameDesignV2BodySchema, {
    target: "draft-2020-12",
    unrepresentable: "throw",
  }) as Record<string, unknown>;
}
