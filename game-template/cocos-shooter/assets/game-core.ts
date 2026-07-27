// =============================================================================
// TEMPLATE PLACEHOLDER — game-core.ts
// =============================================================================
// This is the engine-neutral kernel for the Cocos output template.
// It is intentionally minimal: it compiles and runs but contains NO hardcoded
// gameplay numerics (enemy count, hp, speeds, etc.). Every gameplay value must
// arrive through CoreConfig, whose concrete values are supplied by the caller
// (host / smoke), never baked into the kernel.
//
// GENERATOR FILL POINT: Replace the CoreConfig fields and BulletHellCore
// implementation with generated content. The SafeMonotonicCounterV1 and
// DeterministicLogicalEntityDirectory imports below are the ONLY reused product
// modules — do not replace them; they are byte-identical copies of the real
// product modules under src/modules/ (see assets/modules/PROVENANCE.md).
// =============================================================================

import { SafeMonotonicCounterV1 } from "./modules/game-module-safe-counter";
import {
  DeterministicLogicalEntityDirectory,
  type LogicalEntityChannelDeclaration,
} from "./modules/game-module-entity-directory";

export type Orientation = "portrait" | "landscape";

// GENERATOR FILL POINT: Add gameplay-specific fields here. All numeric gameplay
// parameters must come from config — never hardcoded in the kernel.
// Example: enemyBudget?: number; playerHp?: number; bulletSpeed?: number; seed?: number;
export type CoreConfig = Readonly<{
  orientation: Orientation;
  fieldWidth: number;
  fieldHeight: number;
}>;

export type GameState = "playing" | "won" | "lost";

export type CoreSnapshot = Readonly<{
  state: GameState;
  score: number;
  playerHp: number;
}>;

// Identifiers + a single structural resource bound for the reused directory.
// ENTITY_CAPACITY is NOT a gameplay numeric: it only caps how many live logical
// entities the directory tracks (the product's bounded-resource contract). The
// generator derives real channels/capacities from its own content when it fills
// the kernel. OWNER/CH_ENTITIES satisfy the directory's id grammar.
const OWNER = "template-core";
const CH_ENTITIES = "entities";
const ENTITY_CAPACITY = 64;

// GENERATOR FILL POINT: Replace with the full simulation loop.
export class BulletHellCore {
  // Reused product modules — do not replace.
  readonly #ids: SafeMonotonicCounterV1;
  readonly #directory: DeterministicLogicalEntityDirectory;

  #state: GameState = "playing";
  #score = 0;
  #playerHp = 0;

  constructor(config: CoreConfig) {
    // Read (not just type) the config so the placeholder consumes its inputs;
    // the generator will use these to size the field and gameplay.
    void config.orientation;
    void config.fieldWidth;
    void config.fieldHeight;

    this.#ids = new SafeMonotonicCounterV1(OWNER);
    const channels: LogicalEntityChannelDeclaration[] = [
      {
        channelId: CH_ENTITIES,
        ownerInstanceId: OWNER,
        ownerActorId: OWNER,
        entityRole: "entity",
        capacity: ENTITY_CAPACITY,
        readerInstanceIds: [],
      },
    ];
    this.#directory = new DeterministicLogicalEntityDirectory(channels, []);
  }

  step(_dt: number, _inputs: Record<string, boolean>): void {
    // GENERATOR FILL POINT: implement the simulation step.
    // Use this.#ids.allocate() to mint unique logical entity ids.
    // Use this.#directory.activate(OWNER, CH_ENTITIES, id, generation) and
    // this.#directory.recycle(OWNER, ref) for entity lifecycle under the
    // product's bounded-resource contract.
    void this.#ids;
    void this.#directory;
  }

  snapshot(): CoreSnapshot {
    return Object.freeze({
      state: this.#state,
      score: this.#score,
      playerHp: this.#playerHp,
    });
  }

  get state(): GameState {
    return this.#state;
  }

  // For smoke testing: advance N steps with empty autopilot inputs.
  autoStep(steps: number): void {
    for (let i = 0; i < steps; i++) this.step(1 / 60, {});
  }
}
