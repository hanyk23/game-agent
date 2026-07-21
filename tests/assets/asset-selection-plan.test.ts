import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  AssetSelectionPlanSchema,
  AssetSelectionPlanningError,
  planAssetSelections,
} from "../../src/assets/asset-selection-plan.js";
import { sha256File } from "../../src/runs/artifact-hash.js";
import { createSpaceAssetSpec } from "../fixtures/create-space-asset-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

const catalogUrl = new URL("../../assets/corpus/catalog.json", import.meta.url);

async function loadCatalog(): Promise<unknown> {
  return JSON.parse(await readFile(catalogUrl, "utf8"));
}

describe("asset selection plan", () => {
  it("binds compatible queries to deterministic reviewed source evidence", async () => {
    const catalog = await loadCatalog();
    const catalogSha256 = await sha256File(fileURLToPath(catalogUrl));
    const first = planAssetSelections(
      createSpaceAssetSpec(),
      catalog,
      catalogSha256,
    );
    const second = planAssetSelections(
      createSpaceAssetSpec(),
      catalog,
      catalogSha256,
    );

    expect(second).toEqual(first);
    expect(first.catalog).toEqual({
      catalogId: "vertical-shooter-corpus",
      path: "assets/corpus/catalog.json",
      sha256: catalogSha256,
    });
    expect(
      first.selections.map((selection) => selection.selectedAssetId),
    ).toEqual([
      "kenney-player-ship-1-blue",
      "kenney-player-laser-blue-01",
      "kenney-enemy-black-1",
      "kenney-boss-ufo-blue",
      "kenney-pickup-blue-shield",
      "oga-pixel-starfield",
      "kenney-enemy-laser-red-02",
      "kenney-ui-glass-panel",
      "kenney-effect-energy-ring",
    ]);
    expect(
      first.selections.every(
        (selection) =>
          selection.score > 0 &&
          selection.breakdown.theme > 0 &&
          selection.breakdown.visualStyle > 0 &&
          selection.sourceFile.sha256.length === 64,
      ),
    ).toBe(true);
  });

  it("fails closed when the reviewed corpus has no matching visual style", async () => {
    await expect(async () =>
      planAssetSelections(
        createValidSpec(),
        await loadCatalog(),
        await sha256File(fileURLToPath(catalogUrl)),
      ),
    ).rejects.toThrow(AssetSelectionPlanningError);
  });

  it("rejects a materialization path outside the fixed public asset directory", async () => {
    const plan = planAssetSelections(
      createSpaceAssetSpec(),
      await loadCatalog(),
      await sha256File(fileURLToPath(catalogUrl)),
    );
    const tampered = structuredClone(plan);
    const firstSelection = tampered.selections[0];
    if (firstSelection === undefined) {
      throw new Error("expected one asset selection");
    }
    firstSelection.materialization.workspacePath = "../escaped.png";

    expect(AssetSelectionPlanSchema.safeParse(tampered).success).toBe(false);
  });
});
