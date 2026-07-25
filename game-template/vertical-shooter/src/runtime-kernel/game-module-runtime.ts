import { DeterministicGameModuleProductionInstantiator } from "../../../../src/modules/game-module-production-instantiator.js";
import {
  BrowserGameModuleRuntimeCatalog,
  type BrowserGameModuleRuntimeCatalogInput,
} from "../../../../src/modules/game-module-runtime-catalog.js";
import type { ContactPolicyRuntimeRegistry } from "../../../../src/modules/game-module-contact-policy-host.js";
import type { ResolvedModuleGraph } from "../../../../src/modules/game-module-resolver.js";
import type { ProductionModuleExecutionRegistry } from "../../../../src/modules/game-module-runtime-factory.js";
import type { GameModuleRuntimeServiceHost } from "../../../../src/modules/game-module-runtime-services.js";
import type { RuntimeKernel } from "./contracts.js";
import type { RuntimeLifecycle } from "./contracts.js";
import {
  createGameModuleRuntimeServiceHost,
  type GameModuleRuntimeActorBinding,
  type GameModuleRuntimeAssetRoleBinding,
  type GameModuleRuntimeChannelBinding,
  type GameModuleRuntimeEntityAdapter,
} from "./game-module-runtime-service-host.js";

export type GameModuleTemplateRuntimeOptions<TEntity, TSnapshot> = Readonly<{
  graph: ResolvedModuleGraph;
  registry: ProductionModuleExecutionRegistry & ContactPolicyRuntimeRegistry;
  kernel: RuntimeKernel<TEntity, TSnapshot>;
  actors: readonly GameModuleRuntimeActorBinding<TEntity>[];
  channels: readonly GameModuleRuntimeChannelBinding[];
  assetRoles: readonly GameModuleRuntimeAssetRoleBinding[];
  entities: GameModuleRuntimeEntityAdapter<TEntity>;
}>;

export type TemplateGameModuleExecution = Readonly<{
  initialize(): void;
  start(): void;
  stop(): void;
  dispose(): void;
  destroy(): void;
}>;

export type TemplateGameModuleRuntime = TemplateGameModuleExecution &
  Readonly<{ readonly execution: TemplateGameModuleExecution }>;

export function ownTemplateGameModuleExecution(
  execution: TemplateGameModuleExecution,
  lifecycle: RuntimeLifecycle,
): TemplateGameModuleRuntime {
  let disposed = false;
  let destroyed = false;
  const shutdown = (): void => {
    if (destroyed) return;
    const failures: unknown[] = [];
    if (!disposed) {
      disposed = true;
      try {
        execution.dispose();
      } catch (error) {
        failures.push(error);
      }
    }
    destroyed = true;
    try {
      execution.destroy();
    } catch (error) {
      failures.push(error);
    }
    if (failures.length > 0) {
      throw new AggregateError(failures, "module runtime shutdown failed");
    }
  };
  const removeShutdown = lifecycle.onShutdown(shutdown);
  const dispose = (): void => {
    if (disposed) return;
    removeShutdown();
    disposed = true;
    execution.dispose();
  };
  const destroy = (): void => {
    if (destroyed) return;
    const failures: unknown[] = [];
    try {
      dispose();
    } catch (error) {
      failures.push(error);
    }
    destroyed = true;
    try {
      execution.destroy();
    } catch (error) {
      failures.push(error);
    }
    if (failures.length > 0) {
      throw new AggregateError(failures, "module runtime destruction failed");
    }
  };
  return Object.freeze({
    execution,
    initialize: () => execution.initialize(),
    start: () => execution.start(),
    stop: () => execution.stop(),
    dispose,
    destroy,
  });
}

function verifyBindings<TEntity, TSnapshot>(
  options: GameModuleTemplateRuntimeOptions<TEntity, TSnapshot>,
): void {
  for (const channel of options.graph.entityChannels) {
    const binding = options.channels.find(
      (candidate) => candidate.channelId === channel.channelId,
    );
    if (
      binding === undefined ||
      binding.ownerInstanceId !== channel.ownerInstanceId ||
      binding.entityRole !== channel.entityRole ||
      binding.capacity !== channel.capacity
    ) {
      throw new Error(`runtime channel binding mismatch: ${channel.channelId}`);
    }
  }
  if (
    options.channels.some(
      (binding) =>
        !options.graph.entityChannels.some(
          (channel) => channel.channelId === binding.channelId,
        ),
    )
  ) {
    throw new Error("runtime channel binding is not present in the graph");
  }
  for (const actor of options.graph.actors) {
    if (!options.actors.some((binding) => binding.actorId === actor.actorId)) {
      throw new Error(`runtime actor binding is missing: ${actor.actorId}`);
    }
  }
  for (const role of options.graph.assetRoles) {
    if (!options.assetRoles.some((binding) => binding.roleId === role.roleId)) {
      throw new Error(`runtime asset-role binding is missing: ${role.roleId}`);
    }
  }
}

/** Creates one terminal production graph over the Phaser-backed kernel seam. */
export function createTemplateGameModuleRuntime<TEntity, TSnapshot>(
  options: GameModuleTemplateRuntimeOptions<TEntity, TSnapshot>,
): TemplateGameModuleRuntime {
  verifyBindings(options);
  const serviceHost = createGameModuleRuntimeServiceHost(options.kernel, {
    actors: options.actors,
    channels: options.channels,
    assetRoles: options.assetRoles,
    entities: options.entities,
  }) satisfies GameModuleRuntimeServiceHost;
  return ownTemplateGameModuleExecution(
    DeterministicGameModuleProductionInstantiator.create({
      graph: options.graph,
      registry: options.registry,
      serviceHost,
    }),
    options.kernel.lifecycle,
  );
}

export const GAME_MODULE_RUNTIME_FACTORY_REGISTRY_KEY =
  "agent.module-runtime.foundation";

export const gameModuleRuntimeFoundation = Object.freeze({
  createExecution: createTemplateGameModuleRuntime,
  createCatalog: (input: BrowserGameModuleRuntimeCatalogInput) =>
    new BrowserGameModuleRuntimeCatalog(input),
});
