import { describe, expect, it } from "vitest";

import {
  parseGameDesignV2Body,
  toGameDesignV2BodyJsonSchema,
} from "../../src/gameplay/game-design-v2.js";
import { survivalGameDesignBody } from "../fixtures/create-design-agent-output.js";

describe("GameDesignV2Body openness", () => {
  it("accepts the canonical direct Design Agent body", () => {
    expect(parseGameDesignV2Body(survivalGameDesignBody()).kind).toBe(
      "GameDesignV2",
    );
  });

  it("does not require Boss, wave, pattern, pickup or terminal win", () => {
    const design = survivalGameDesignBody();
    design.systemDesign.outcomes = design.systemDesign.outcomes.filter(
      (outcome) => outcome.result !== "won",
    );
    design.requirementBindings.exclusions = [];
    design.requirementBindings.forbidden = [];
    expect(() => parseGameDesignV2Body(design)).not.toThrow();
  });

  it("keeps orientation independent from movement and aiming", () => {
    const design = survivalGameDesignBody();
    design.spatialDesign.viewport.orientation = "vertical";
    design.spatialDesign.viewport.logicalWidth = 720;
    design.spatialDesign.viewport.logicalHeight = 1280;
    design.spatialDesign.movement = [];
    design.spatialDesign.aiming = [];
    expect(parseGameDesignV2Body(design).spatialDesign.aiming).toEqual([]);
  });

  it("rejects duplicate design node ids", () => {
    const design = survivalGameDesignBody();
    design.systemDesign.events.push({ id: "event-game-start" });
    expect(() => parseGameDesignV2Body(design)).toThrow();
  });

  it("exports GameDesignV2Body rather than a Draft contract", () => {
    const schema = JSON.stringify(toGameDesignV2BodyJsonSchema());
    expect(schema).toContain("GameDesignV2");
    expect(schema).not.toContain("GameDesignDraftV1");
  });
});
