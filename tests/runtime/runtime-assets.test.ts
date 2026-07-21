import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parseRuntimeGameConfig } from "../../game-template/vertical-shooter/src/runtime-assets.js";
import { planAssetSelections } from "../../src/assets/asset-selection-plan.js";
import { composeShooterGame } from "../../src/runtime/shooter-game-composer.js";
import { sha256File } from "../../src/runs/artifact-hash.js";
import { createSpaceAssetSpec } from "../fixtures/create-space-asset-spec.js";
import { createValidSpec } from "../fixtures/create-valid-spec.js";

const catalogUrl = new URL("../../assets/corpus/catalog.json", import.meta.url);

async function createCatalogRuntimeConfig() {
  const spec = createSpaceAssetSpec();
  const catalog = JSON.parse(await readFile(catalogUrl, "utf8")) as unknown;
  const selection = planAssetSelections(
    spec,
    catalog,
    await sha256File(fileURLToPath(catalogUrl)),
  );
  return composeShooterGame(spec, { assetSelection: selection });
}

describe("runtime asset map", () => {
  it("keeps geometric textures behind an explicit legacy mode", () => {
    const config = composeShooterGame(createValidSpec());

    expect(config.resolvedAssets).toEqual({ mode: "legacy-geometric" });
    expect(parseRuntimeGameConfig(config)).toBe(config);
  });

  it("maps every selection into stable data-only texture evidence", async () => {
    const config = await createCatalogRuntimeConfig();
    expect(config.resolvedAssets.mode).toBe("catalog");
    if (config.resolvedAssets.mode !== "catalog") return;

    expect(config.resolvedAssets.selections).toHaveLength(
      config.assetQueries.length,
    );
    expect(config.resolvedAssets.backgroundQueryId).toBe(
      "background-mountains",
    );
    expect(config.resolvedAssets.enemyProjectileQueryId).toBe(
      "enemy-bullet-orb",
    );
    expect(config.resolvedAssets.uiQueryId).toBe("ui-hud-panel");
    expect(config.resolvedAssets.effectQueryId).toBe("effect-pickup-ring");
    expect(
      config.resolvedAssets.selections.map((selected) => selected.textureKey),
    ).toEqual([
      "catalog-kenney-player-ship-1-blue",
      "catalog-kenney-player-laser-blue-01",
      "catalog-kenney-enemy-black-1",
      "catalog-kenney-boss-ufo-blue",
      "catalog-kenney-pickup-blue-shield",
      "catalog-oga-pixel-starfield",
      "catalog-kenney-enemy-laser-red-02",
      "catalog-kenney-ui-glass-panel",
      "catalog-kenney-effect-energy-ring",
    ]);
    expect(parseRuntimeGameConfig(config)).toBe(config);
  });

  it("fails closed on unknown fields and query/path tampering", async () => {
    const config = await createCatalogRuntimeConfig();
    const withUnknown = structuredClone(config) as unknown as {
      resolvedAssets: Record<string, unknown>;
    };
    withUnknown.resolvedAssets.unsafePath = "../outside.png";
    expect(() => parseRuntimeGameConfig(withUnknown)).toThrow(
      "missing or unknown fields",
    );

    const withBadUrl = structuredClone(config);
    if (withBadUrl.resolvedAssets.mode !== "catalog") return;
    const first = withBadUrl.resolvedAssets.selections[0];
    if (first === undefined) return;
    (first as { runtimeUrl: string }).runtimeUrl = "/assets/catalog/wrong.png";
    expect(() => parseRuntimeGameConfig(withBadUrl)).toThrow(
      "invalid runtime URL",
    );

    const withoutUiRole = structuredClone(config);
    if (withoutUiRole.resolvedAssets.mode !== "catalog") return;
    delete (withoutUiRole.resolvedAssets as { uiQueryId?: string }).uiQueryId;
    expect(() => parseRuntimeGameConfig(withoutUiRole)).toThrow(
      "resolvedAssets.uiQueryId",
    );
  });
});
