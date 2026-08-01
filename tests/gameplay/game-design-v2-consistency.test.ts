import { describe, expect, it } from "vitest";

import {
  GameDesignV2ConsistencyError,
  verifyGameDesignV2Consistency,
  verifyGameDesignV2References,
} from "../../src/gameplay/game-design-v2-consistency.js";
import {
  compiledSurvivalDesign,
  upstreamGameSpecV2,
  upstreamIntentLedgerV2,
  upstreamRequestRecord,
} from "../fixtures/create-design-agent-output.js";

function verify(design = compiledSurvivalDesign()) {
  return verifyGameDesignV2Consistency({
    request: upstreamRequestRecord(),
    gameSpec: upstreamGameSpecV2(),
    intentLedger: upstreamIntentLedgerV2(),
    design,
  });
}

describe("GameDesignV2 consistency", () => {
  it("accepts a direct, source-bound GameDesignV2", () => {
    expect(() => verify()).not.toThrow();
    expect(() => verifyGameDesignV2References(verify())).not.toThrow();
  });

  it("rejects a dangling reference", () => {
    const design = compiledSurvivalDesign();
    design.systemDesign.actors = design.systemDesign.actors.filter(
      (actor) => actor.id !== "actor-enemy",
    );
    expect(() => verify(design)).toThrow(GameDesignV2ConsistencyError);
  });

  it("rejects a tampered upstream hash", () => {
    const design = compiledSurvivalDesign();
    design.sources.gameSpec.sha256 = "0".repeat(64);
    expect(() => verify(design)).toThrow(/hash mismatch/u);
  });

  it("requires every locked statement to be covered", () => {
    const design = compiledSurvivalDesign();
    design.requirementBindings.decisions =
      design.requirementBindings.decisions.filter(
        (decision) => decision.id !== "bind-movement",
      );
    expect(() => verify(design)).toThrow(/locked statements/u);
  });

  it("rejects a forbidden capability that is enabled", () => {
    const design = compiledSurvivalDesign();
    design.systemDesign.actors.push({
      id: "actor-boss",
      role: "boss",
      capabilityTags: [],
    });
    expect(() => verify(design)).toThrow(/forbidden/u);
  });
});
