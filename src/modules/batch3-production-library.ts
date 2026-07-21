import { createBatch2CoreProductionRegistry } from "./batch2-core-library.js";
import { registerBatch3ActorContactDefinitions } from "./batch3-actor-contact-library.js";
import { registerBatch3EncounterHostileDefinitions } from "./batch3-encounter-hostile-library.js";
import { registerBatch3HostileSliceDefinitions } from "./batch3-hostile-slice-library.js";
import { registerBatch3LegacyPlayerDefinitions } from "./batch3-legacy-player-library.js";
import { GameModuleRegistry } from "./game-module-registry.js";
import { registerBatch3ScoringOutcomeDefinitions } from "./batch3-scoring-outcome-library.js";

/**
 * The cumulative reviewed Batch 3 production catalog.  It starts from the
 * complete Batch 2 catalog so composition can select the byte-preserved
 * `combat.graze@1.0.0` definition; Batch 3 never re-admits or rewrites it.
 */
export async function createBatch3ProductionRegistry(): Promise<GameModuleRegistry> {
  const registry = await createBatch2CoreProductionRegistry();
  await registerBatch3LegacyPlayerDefinitions(registry);
  await registerBatch3HostileSliceDefinitions(registry);
  await registerBatch3EncounterHostileDefinitions(registry);
  await registerBatch3ActorContactDefinitions(registry);
  await registerBatch3ScoringOutcomeDefinitions(registry);
  return registry;
}
