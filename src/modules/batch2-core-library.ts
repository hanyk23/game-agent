import { createBatch1ProductionRegistry } from "./batch1-gameplay-library.js";
import { registerBatch2DefenseDefinitions } from "./batch2-defense-library.js";
import { registerBatch2DeliveryDefinitions } from "./batch2-delivery-library.js";
import { registerBatch2ControlDefinitions } from "./batch2-gameplay-library.js";
import { registerBatch2ProgressionCompatDefinitions } from "./batch2-progression-compat-library.js";
import type { GameModuleRegistry } from "./game-module-registry.js";

export const BATCH2_APPROVED_PRODUCTION_COUNT = 27;

export async function registerAllBatch2Definitions(
  registry: GameModuleRegistry,
): Promise<void> {
  await registerBatch2ControlDefinitions(registry);
  await registerBatch2DeliveryDefinitions(registry);
  await registerBatch2DefenseDefinitions(registry);
  await registerBatch2ProgressionCompatDefinitions(registry);
}

export async function createBatch2CoreProductionRegistry(): Promise<GameModuleRegistry> {
  const registry = await createBatch1ProductionRegistry();
  await registerAllBatch2Definitions(registry);
  return registry;
}
