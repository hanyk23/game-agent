import { describe, expect, it } from "vitest";

import {
  canonicalGameSpecV2Json,
  collectStatementIds,
  parseGameSpecV2,
  parsePartialGameSpecV2,
  partitionOfStatement,
  sha256GameSpecV2,
  toGameSpecV2JsonSchema,
  validateGameSpecV2,
  type GameSpecV2,
} from "../../src/requirements/game-spec-v2.js";
import {
  horizontalFreeMoveOutput,
  novelConceptOutput,
  pureDodgeOutput,
} from "../fixtures/create-spec-agent-output.js";
import type { SpecAgentModelOutput } from "../../src/requirements/spec-agent-result.js";

function specOf(output: SpecAgentModelOutput): GameSpecV2 {
  if (output.outcome !== "spec-ready") {
    throw new Error("fixture is not spec-ready");
  }
  return output.gameSpec;
}

describe("GameSpec v2 — open-ended requirement contract", () => {
  it("accepts a valid four-partition spec and enumerates statementIds in order", () => {
    const spec = parseGameSpecV2(specOf(horizontalFreeMoveOutput()));
    expect(spec.schemaVersion).toBe("2.0.0");
    expect(collectStatementIds(spec)).toEqual([
      "concept-horizontal",
      "move-free-2d",
      "player-aims-and-shoots",
      "no-boss",
      "endless-survival",
      "control-mouse-aim",
    ]);
    expect(partitionOfStatement(spec, "no-boss")).toBe("gameplayIntent");
    expect(partitionOfStatement(spec, "concept-horizontal")).toBe(
      "gameConcept",
    );
    expect(partitionOfStatement(spec, "does-not-exist")).toBeUndefined();
  });

  it("accepts a user-invented, never-enumerated gameplay concept as free text", () => {
    // §九.5 — openness: a novel concept must round-trip without any closed enum.
    const spec = parseGameSpecV2(specOf(novelConceptOutput()));
    expect(spec.gameConcept.some((s) => s.text.includes("引力回声"))).toBe(
      true,
    );
  });

  it("rejects duplicate statementIds across partitions", () => {
    const spec = specOf(pureDodgeOutput());
    const broken = {
      ...spec,
      platformAndControls: [
        { statementId: "no-attack", text: "重复 id 应当被拒绝。" },
      ],
    };
    expect(validateGameSpecV2(broken).success).toBe(false);
  });

  it("rejects an empty spec with no statements at all", () => {
    // A spec-ready GameSpec must carry at least one requirement.
    const empty = {
      schemaVersion: "2.0.0",
      kind: "GameSpecV2",
      gameConcept: [],
      gameplayIntent: [],
      platformAndControls: [],
      additionalConstraints: [],
    };
    expect(validateGameSpecV2(empty).success).toBe(false);
  });

  it("rejects unknown top-level keys (strict object)", () => {
    const spec = specOf(pureDodgeOutput());
    expect(validateGameSpecV2({ ...spec, extra: true }).success).toBe(false);
  });

  it("rejects a statementId that is not lowercase kebab-case", () => {
    const spec = specOf(pureDodgeOutput());
    const broken = {
      ...spec,
      gameConcept: [{ statementId: "Concept_Bad", text: "非法 id。" }],
    };
    expect(validateGameSpecV2(broken).success).toBe(false);
  });

  it("allows a partial spec to be completely empty", () => {
    const partial = parsePartialGameSpecV2({
      schemaVersion: "2.0.0",
      kind: "PartialGameSpecV2",
      gameConcept: [],
      gameplayIntent: [],
      platformAndControls: [],
      additionalConstraints: [],
    });
    expect(partial.kind).toBe("PartialGameSpecV2");
  });

  it("produces a canonical, key-order-independent hash", () => {
    const spec = specOf(pureDodgeOutput());
    const reordered = {
      additionalConstraints: spec.additionalConstraints,
      gameplayIntent: spec.gameplayIntent,
      kind: spec.kind,
      gameConcept: spec.gameConcept,
      platformAndControls: spec.platformAndControls,
      schemaVersion: spec.schemaVersion,
    };
    expect(sha256GameSpecV2(reordered)).toBe(sha256GameSpecV2(spec));
    expect(canonicalGameSpecV2Json(reordered)).toBe(
      canonicalGameSpecV2Json(spec),
    );
    expect(sha256GameSpecV2(spec)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("exposes a JSON Schema for the model prompt", () => {
    const schema = toGameSpecV2JsonSchema();
    expect(typeof schema).toBe("object");
    expect(JSON.stringify(schema)).toContain("gameplayIntent");
  });
});

describe("GameSpec v2 — §五 no cross-partition duplicate requirements", () => {
  it("rejects two statements with identical normalized text (§五.1)", () => {
    // Exact-duplicate requirement text, whether same or different partition, is a
    // structural error the local schema must catch.
    const spec = specOf(pureDodgeOutput());
    const duplicated = {
      ...spec,
      platformAndControls: [
        { statementId: "dup-in-controls", text: "游戏核心是纯躲避体验。" },
      ],
    };
    expect(validateGameSpecV2(duplicated).success).toBe(false);
  });

  it("rejects identical normalized text differing only by whitespace/width", () => {
    const spec = specOf(pureDodgeOutput());
    const duplicated = {
      ...spec,
      // NFKC + collapsed whitespace makes this identical to concept-pure-dodge.
      platformAndControls: [
        { statementId: "dup-ws", text: "游戏核心是纯躲避体验。 " },
      ],
    };
    expect(validateGameSpecV2(duplicated).success).toBe(false);
  });

  it("keeps exactly one canonical statement for the mouse-aim fixture (§五.2)", () => {
    // Mouse-as-device belongs to platformAndControls; gameplay only records the
    // active aim/shoot intent — no repeated mouse-operation requirement.
    const spec = parseGameSpecV2(specOf(horizontalFreeMoveOutput()));
    const mouseControls = spec.platformAndControls.filter((s) =>
      s.text.includes("鼠标"),
    );
    expect(mouseControls).toHaveLength(1);
    // gameplayIntent must NOT re-state the mouse operation requirement.
    expect(spec.gameplayIntent.some((s) => s.text.includes("鼠标"))).toBe(
      false,
    );
  });

  it("does not drop the user's aim requirement when de-duplicated (§五.3)", () => {
    const spec = parseGameSpecV2(specOf(horizontalFreeMoveOutput()));
    // The aim/shoot intent survives in gameplay…
    expect(
      spec.gameplayIntent.some(
        (s) => s.text.includes("瞄准") && s.text.includes("射击"),
      ),
    ).toBe(true);
    // …and the mouse device requirement survives in controls.
    expect(spec.platformAndControls.some((s) => s.text.includes("鼠标"))).toBe(
      true,
    );
  });

  it("keeps the ledger 1:1 with canonical statements after de-dup (§五.4)", () => {
    // Every canonical statement appears exactly once, so a 1:1 ledger has one
    // entry per statement with no duplicate coverage.
    const output = horizontalFreeMoveOutput();
    if (output.outcome !== "spec-ready") throw new Error("bad fixture");
    const spec = parseGameSpecV2(output.gameSpec);
    const specIds = collectStatementIds(spec);
    const ledgerIds = output.ledger.map((e) => e.statementId);
    expect(new Set(ledgerIds).size).toBe(ledgerIds.length);
    expect([...ledgerIds].sort()).toEqual([...specIds].sort());
  });
});
