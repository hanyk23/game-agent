import {
  ModifierApplicationPayloadSchema,
  ModifierStatePayloadSchema,
} from "./game-module-runtime-payloads.js";
import { SafeMonotonicCounterV1 } from "./game-module-safe-counter.js";

export type ModifierTargetFieldV1 =
  | "combat.health.current"
  | "combat.shield.current"
  | "attack.damage.multiplier"
  | "attack.projectile-count.bonus";

export type ClosedModifierTargetConfigurationV1 = Readonly<{
  targetInstanceId: string;
  fieldId: ModifierTargetFieldV1;
  operation: "add";
  minimum: number;
  maximum: number;
  initial: number;
}>;

export type ModifierApplicationV1 = Readonly<{
  sequence: number;
  emittedAtMs: number;
  commitSequence: number;
  commitEvidenceId: number;
  eventOrdinal: number;
  routeId: string;
  targetInstanceId: string;
  fieldId: ModifierTargetFieldV1;
  operation: "add";
  value: number;
}>;

export type ModifierStateV1 = Readonly<{
  revision: number;
  emittedAtMs: number;
  fieldId: ModifierTargetFieldV1;
  current: number;
  minimum: number;
  maximum: number;
}>;

const INSTANCE_ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const MODIFIER_FIELDS = new Set<ModifierTargetFieldV1>([
  "combat.health.current",
  "combat.shield.current",
  "attack.damage.multiplier",
  "attack.projectile-count.bonus",
]);

/** Exact addressed receiver for one ADR 0027 closed modifier field. */
export class ClosedModifierTargetHostV1 {
  readonly #configuration: ClosedModifierTargetConfigurationV1;
  readonly #nowMs: () => number;
  readonly #publish: (state: ModifierStateV1) => void;
  readonly #revision = new SafeMonotonicCounterV1("modifier.state-revision");
  #current: number;
  #disposed = false;

  constructor(
    input: Readonly<{
      configuration: ClosedModifierTargetConfigurationV1;
      nowMs(): number;
      publish?(state: ModifierStateV1): void;
    }>,
  ) {
    const configuration = input.configuration;
    if (
      !INSTANCE_ID.test(configuration.targetInstanceId) ||
      !MODIFIER_FIELDS.has(configuration.fieldId) ||
      configuration.operation !== "add" ||
      !Number.isFinite(configuration.minimum) ||
      !Number.isFinite(configuration.maximum) ||
      !Number.isFinite(configuration.initial) ||
      configuration.minimum > configuration.maximum ||
      configuration.initial < configuration.minimum ||
      configuration.initial > configuration.maximum ||
      (configuration.fieldId === "attack.projectile-count.bonus" &&
        (!Number.isSafeInteger(configuration.minimum) ||
          !Number.isSafeInteger(configuration.maximum) ||
          !Number.isSafeInteger(configuration.initial)))
    )
      throw new Error("invalid closed modifier target configuration");
    this.#configuration = Object.freeze({ ...configuration });
    this.#current = configuration.initial;
    this.#nowMs = input.nowMs;
    this.#publish = input.publish ?? (() => undefined);
  }

  get current(): number {
    return this.#current;
  }

  observe(): ModifierStateV1 {
    return this.#state(this.#revision.current < 0 ? 0 : this.#revision.current);
  }

  apply(application: ModifierApplicationV1): ModifierStateV1 {
    if (this.#disposed) throw new Error("modifier target is disposed");
    const parsed = ModifierApplicationPayloadSchema.parse(application);
    if (
      parsed.targetInstanceId !== this.#configuration.targetInstanceId ||
      parsed.fieldId !== this.#configuration.fieldId ||
      parsed.operation !== this.#configuration.operation
    )
      throw new Error(
        "modifier application does not address this exact target",
      );
    if (
      this.#configuration.fieldId === "attack.projectile-count.bonus" &&
      !Number.isSafeInteger(parsed.value)
    )
      throw new Error("projectile-count modifier value must be a safe integer");

    const candidate = this.#current + parsed.value;
    if (!Number.isFinite(candidate))
      throw new Error("modifier application produced a non-finite result");
    const next = Math.min(
      this.#configuration.maximum,
      Math.max(this.#configuration.minimum, candidate),
    );
    if (
      !Number.isFinite(next) ||
      next < this.#configuration.minimum ||
      next > this.#configuration.maximum ||
      (this.#configuration.fieldId === "attack.projectile-count.bonus" &&
        !Number.isSafeInteger(next))
    )
      throw new Error("modifier application escaped receiver bounds");

    const revision = this.#revision.preflightBlock(1).base;
    const emittedAtMs = this.#readNow();
    const state = this.#state(revision, emittedAtMs, next);
    this.#revision.allocate();
    this.#current = next;
    this.#publish(state);
    return state;
  }

  dispose(): void {
    this.#disposed = true;
  }

  #readNow(): number {
    const nowMs = this.#nowMs();
    if (!Number.isSafeInteger(nowMs) || nowMs < 0)
      throw new Error("modifier target clock returned invalid simulation time");
    return nowMs;
  }

  #state(
    revision: number,
    emittedAtMs = this.#readNow(),
    current = this.#current,
  ): ModifierStateV1 {
    return Object.freeze(
      ModifierStatePayloadSchema.parse({
        revision,
        emittedAtMs,
        fieldId: this.#configuration.fieldId,
        current,
        minimum: this.#configuration.minimum,
        maximum: this.#configuration.maximum,
      }),
    );
  }
}

export type DeliveryModifierSnapshotV1 = Readonly<{
  damageBonus: number;
  countBonus: number;
  effectiveCount: number;
  effectiveDamage: number;
}>;

/** Paired delivery targets with one immutable snapshot per attack request. */
export class DeliveryModifierTargetHostV1 {
  readonly #baseCount: number;
  readonly #baseDamage: number;
  readonly #maximumCountBonus: number;
  readonly #maximumDamageMultiplier: number;
  readonly #damage: ClosedModifierTargetHostV1;
  readonly #count: ClosedModifierTargetHostV1;

  constructor(
    input: Readonly<{
      targetInstanceId: string;
      baseCount: number;
      baseDamage: number;
      maximumCountBonus: number;
      maximumDamageMultiplier: number;
      maxActive: number;
      nowMs(): number;
      publish?(state: ModifierStateV1): void;
    }>,
  ) {
    if (
      !Number.isSafeInteger(input.baseCount) ||
      input.baseCount < 1 ||
      !Number.isFinite(input.baseDamage) ||
      input.baseDamage <= 0 ||
      !Number.isSafeInteger(input.maximumCountBonus) ||
      input.maximumCountBonus < 0 ||
      !Number.isFinite(input.maximumDamageMultiplier) ||
      input.maximumDamageMultiplier < 1 ||
      !Number.isSafeInteger(input.maxActive) ||
      input.maxActive < 1 ||
      input.baseCount + input.maximumCountBonus > input.maxActive
    )
      throw new Error("invalid delivery modifier target configuration");
    this.#baseCount = input.baseCount;
    this.#baseDamage = input.baseDamage;
    this.#maximumCountBonus = input.maximumCountBonus;
    this.#maximumDamageMultiplier = input.maximumDamageMultiplier;
    this.#damage = new ClosedModifierTargetHostV1({
      configuration: {
        targetInstanceId: input.targetInstanceId,
        fieldId: "attack.damage.multiplier",
        operation: "add",
        minimum: 0,
        maximum: input.maximumDamageMultiplier - 1,
        initial: 0,
      },
      nowMs: input.nowMs,
      ...(input.publish === undefined ? {} : { publish: input.publish }),
    });
    this.#count = new ClosedModifierTargetHostV1({
      configuration: {
        targetInstanceId: input.targetInstanceId,
        fieldId: "attack.projectile-count.bonus",
        operation: "add",
        minimum: 0,
        maximum: input.maximumCountBonus,
        initial: 0,
      },
      nowMs: input.nowMs,
      ...(input.publish === undefined ? {} : { publish: input.publish }),
    });
  }

  apply(application: ModifierApplicationV1): ModifierStateV1 {
    if (application.fieldId === "attack.damage.multiplier")
      return this.#damage.apply(application);
    if (application.fieldId === "attack.projectile-count.bonus")
      return this.#count.apply(application);
    throw new Error("modifier application is not a delivery target");
  }

  snapshotRequest(): DeliveryModifierSnapshotV1 {
    const damageBonus = this.#damage.current;
    const countBonus = this.#count.current;
    const effectiveCount = this.#baseCount + countBonus;
    const effectiveDamage =
      this.#baseDamage *
      Math.min(1 + damageBonus, this.#maximumDamageMultiplier);
    if (
      !Number.isSafeInteger(effectiveCount) ||
      effectiveCount < 1 ||
      effectiveCount > this.#baseCount + this.#maximumCountBonus ||
      !Number.isFinite(effectiveDamage) ||
      effectiveDamage <= 0
    )
      throw new Error("delivery modifier snapshot escaped configured bounds");
    return Object.freeze({
      damageBonus,
      countBonus,
      effectiveCount,
      effectiveDamage,
    });
  }

  dispose(): void {
    this.#damage.dispose();
    this.#count.dispose();
  }
}
