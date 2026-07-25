import type {
  GameModuleManifestV11,
  RuntimeLeaseCeilings,
} from "./game-module-contract.js";
import type { ArtifactHashDescriptor } from "./game-module-execution-contract.js";
import type {
  LogicalEntityMutationEvidence,
  LogicalEntityReference,
} from "./game-module-entity-directory.js";
import type {
  GameModuleLease,
  GameModuleLeaseScope,
} from "./game-module-lease-ledger.js";
import type { GameModuleLifecycleParticipant } from "./game-module-lifecycle-coordinator.js";
import type { ModulePortHandler } from "./game-module-port-router.js";
import type {
  ProjectileDeliveryAdmissionResultV1,
  ProjectileDeliveryAdmissionSnapshotV1,
} from "./game-module-projectile-delivery-admission-host.js";
import type {
  GameModuleScopedRuntimeServices,
  GameModuleScopedRuntimeServicesV12,
} from "./game-module-runtime-services.js";
import type { ContactDecisionPayload } from "./game-module-runtime-payloads.js";
import type { OutcomeArbitrationViewV1 } from "./game-module-outcome-host.js";
import type {
  TimerHandleV12,
  TimerScheduleV12,
} from "./game-module-runtime-abi-v12.js";

export type ContactPolicyTransform = (
  decision: Readonly<ContactDecisionPayload>,
) => unknown;

export type GameModuleRuntimeLeaseKeys = Readonly<
  Record<GameModuleLeaseScope, readonly string[]>
>;

export type GameModuleFactoryContext = Readonly<{
  identity: Readonly<{
    instanceId: string;
    ownerId: string;
    moduleId: string;
    version: string;
    artifactEnvelopeSha256: string;
  }>;
  configuration: Readonly<unknown>;
  services: GameModuleScopedRuntimeServices;
  ports: Readonly<{
    declareHandler(portId: string, handler: ModulePortHandler): void;
    publishState(portId: string, payload: unknown): void;
    emitEvent(portId: string, payload: unknown): void;
  }>;
  contactPolicies: Readonly<{
    execute(candidate: unknown): Readonly<ContactDecisionPayload>;
  }>;
  leases: Readonly<{
    acquire(scope: GameModuleLeaseScope, key: string): GameModuleLease;
    release(lease: GameModuleLease): void;
  }>;
  entities: Readonly<{
    activate(
      channelId: string,
      entityId: string,
      generation: number,
    ): LogicalEntityReference;
    read(reference: LogicalEntityReference): LogicalEntityReference;
    recycle(reference: LogicalEntityReference): LogicalEntityReference;
    mutate(
      grantId: string,
      reference: LogicalEntityReference,
      operation: "consume" | "transfer",
      transferTargetActorId?: string,
    ): LogicalEntityMutationEvidence;
    isGenerationActive(
      channelId: string,
      entityId: string,
      generation: number,
    ): boolean;
  }>;
}>;

export type GameModuleFactory = (context: GameModuleFactoryContext) => unknown;

/** Manifest 1.2 context intentionally has no raw lease/entity/kernel authority. */
export type GameModuleFactoryContextV12 = Readonly<{
  identity: Readonly<{
    instanceId: string;
    ownerId: string;
    moduleId: string;
    version: string;
    artifactEnvelopeSha256: string;
  }>;
  configuration: Readonly<unknown>;
  services: GameModuleScopedRuntimeServicesV12;
  ports: Readonly<{
    declareHandler(portId: string, handler: ModulePortHandler): void;
    publishState(portId: string, payload: unknown): void;
    emitEvent(portId: string, payload: unknown): void;
  }>;
  clock: Readonly<{
    nowMs(): number;
    schedule(schedule: TimerScheduleV12): TimerHandleV12;
  }>;
  assets: Readonly<{
    requireTexture(roleId: string): string;
    optionalTexture(roleId: string): string | undefined;
  }>;
}>;

/** Manifest 1.3 context is distinct; optional service keys exist only by grant. */
export type GameModuleFactoryContextV13 = Readonly<{
  identity: GameModuleFactoryContextV12["identity"];
  configuration: Readonly<unknown>;
  services: GameModuleScopedRuntimeServicesV12 &
    Readonly<{
      actorSnapshots?: Readonly<{
        read(readId: string): unknown;
      }>;
      entityChannelSnapshots?: Readonly<{
        read(readId: string): unknown;
      }>;
      preparedEffects?: Readonly<{
        prepare(sourceKey: string, collectedTemplate: unknown): unknown;
      }>;
      projectileDelivery?: Readonly<{
        admit(
          requestSequence: number,
          plan: readonly unknown[],
        ): ProjectileDeliveryAdmissionResultV1;
        recycle(reference: LogicalEntityReference): void;
        observe(): ProjectileDeliveryAdmissionSnapshotV1;
      }>;
    }>;
  ports: Readonly<{
    declareHandler(portId: string, handler: ModulePortHandler): void;
    declareAddressedHandler(fieldId: string, handler: ModulePortHandler): void;
    publishState(portId: string, payload: unknown): void;
    emitEvent(portId: string, payload: unknown): void;
  }>;
  clock: GameModuleFactoryContextV12["clock"];
  assets: GameModuleFactoryContextV12["assets"];
}>;

export type GameModuleFactoryContextV13ServiceKey =
  | "actorSnapshots"
  | "entityChannelSnapshots"
  | "preparedEffects"
  | "projectileDelivery";

export type GameModuleFactoryContextV14ServiceKey =
  | GameModuleFactoryContextV13ServiceKey
  | "actorRoots"
  | "actorRootSnapshots"
  | "actorRootMutation"
  | "hostileProjectileDelivery"
  | "outcomeCommit";

/** V1.4 coordinator-only callable; invoked exclusively by the host barrier. */
export type OutcomeFrameTailCallableV14 = (
  view: OutcomeArbitrationViewV1,
) => unknown;

/** Manifest 1.4 context adds only resolved, instance-bound semantic grants. */
export type GameModuleFactoryContextV14 = Readonly<{
  identity: GameModuleFactoryContextV12["identity"];
  configuration: Readonly<unknown>;
  services: GameModuleFactoryContextV13["services"] &
    Readonly<{
      actorRoots?: Readonly<{
        activate(grantId: string, request: Readonly<unknown>): unknown;
        deactivate(grantId: string, request: Readonly<unknown>): unknown;
      }>;
      actorRootSnapshots?: Readonly<{
        read(grantId: string): unknown;
      }>;
      actorRootMutation?: Readonly<{
        deactivate(grantId: string, request: Readonly<unknown>): unknown;
      }>;
      hostileProjectileDelivery?: Readonly<{
        admit(grantId: string, request: Readonly<unknown>): unknown;
        recycle(grantId: string, request: Readonly<unknown>): unknown;
        observe(grantId: string): unknown;
      }>;
      outcomeCommit?: Readonly<{
        commit(grantId: string, decision: Readonly<unknown>): unknown;
      }>;
    }>;
  ports: GameModuleFactoryContextV13["ports"];
  clock: GameModuleFactoryContextV12["clock"];
  assets: GameModuleFactoryContextV12["assets"];
}>;

export type ProductionModuleExecutionExports = Readonly<{
  implementationId: string;
  artifactEnvelopeSha256: string;
  runtimeLeaseKeys: GameModuleRuntimeLeaseKeys;
  create?: GameModuleFactory | undefined;
  contactPolicyTransform?: ContactPolicyTransform | undefined;
}>;

export type ProductionModuleExecutionRegistration = Readonly<{
  executionExports?: ProductionModuleExecutionExports | undefined;
}>;

export type ProductionModuleExecutionRegistry = Readonly<{
  findExactProduction(
    moduleId: string,
    version: string,
    envelopeSha256: string,
  ): ProductionModuleExecutionRegistration | undefined;
}>;

const scopes = ["start", "instance", "graph"] as const;
const ceilingField = {
  start: "startLeases",
  instance: "instanceLeases",
  graph: "graphLeases",
} as const satisfies Record<GameModuleLeaseScope, keyof RuntimeLeaseCeilings>;

function validKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 100 &&
    /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/.test(value)
  );
}

export function validateProductionModuleExecutionExports(
  input: ProductionModuleExecutionExports,
  manifest: GameModuleManifestV11,
  artifact: ArtifactHashDescriptor,
): ProductionModuleExecutionExports {
  if (
    input.implementationId !== manifest.implementationId ||
    input.artifactEnvelopeSha256 !== artifact.envelopeSha256
  ) {
    throw new Error(
      `execution export identity mismatch for ${manifest.moduleId}@${manifest.version}`,
    );
  }
  const keys: Record<GameModuleLeaseScope, readonly string[]> = {
    start: [],
    instance: [],
    graph: [],
  };
  for (const scope of scopes) {
    const values = input.runtimeLeaseKeys[scope];
    if (
      !Array.isArray(values) ||
      values.some((value) => !validKey(value)) ||
      new Set(values).size !== values.length ||
      values.length > manifest.runtimeLeases[ceilingField[scope]]
    ) {
      throw new Error(
        `invalid ${scope} execution lease keys for ${manifest.moduleId}@${manifest.version}`,
      );
    }
    keys[scope] = Object.freeze([...values]);
  }
  const isPolicy = manifest.contactPolicyTransform !== undefined;
  if (
    (isPolicy &&
      (typeof input.contactPolicyTransform !== "function" ||
        input.create !== undefined)) ||
    (!isPolicy &&
      (typeof input.create !== "function" ||
        input.contactPolicyTransform !== undefined))
  ) {
    throw new Error(
      `execution export shape mismatch for ${manifest.moduleId}@${manifest.version}`,
    );
  }
  return Object.freeze({
    implementationId: input.implementationId,
    artifactEnvelopeSha256: input.artifactEnvelopeSha256,
    runtimeLeaseKeys: Object.freeze(keys),
    ...(input.create === undefined ? {} : { create: input.create }),
    ...(input.contactPolicyTransform === undefined
      ? {}
      : { contactPolicyTransform: input.contactPolicyTransform }),
  });
}

export function asLifecycleParticipant(
  instanceId: string,
  value: unknown,
): GameModuleLifecycleParticipant {
  if (
    value === null ||
    typeof value !== "object" ||
    ("instanceId" in value &&
      (value as { instanceId?: unknown }).instanceId !== instanceId)
  ) {
    throw new Error(
      `factory returned an invalid participant for ${instanceId}`,
    );
  }
  const source = value as Record<string, unknown>;
  for (const hook of ["initialize", "start", "stop", "dispose"] as const) {
    if (source[hook] !== undefined && typeof source[hook] !== "function") {
      throw new Error(
        `factory returned invalid ${hook} hook for ${instanceId}`,
      );
    }
  }
  return Object.freeze({
    instanceId,
    ...(source.initialize === undefined
      ? {}
      : { initialize: source.initialize as () => unknown }),
    ...(source.start === undefined
      ? {}
      : { start: source.start as () => unknown }),
    ...(source.stop === undefined
      ? {}
      : { stop: source.stop as () => unknown }),
    ...(source.dispose === undefined
      ? {}
      : { dispose: source.dispose as () => unknown }),
  });
}
