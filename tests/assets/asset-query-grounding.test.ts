import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  applyAssetQueryGrounding,
  AssetQueryGroundingError,
  planAssetQueryGrounding,
  sha256ShooterGameSpec,
} from "../../src/assets/asset-query-grounding.js";
import { planAssetSelections } from "../../src/assets/asset-selection-plan.js";
import { sha256File } from "../../src/runs/artifact-hash.js";

const catalogUrl = new URL("../../assets/corpus/catalog.json", import.meta.url);
const probeReportUrl = new URL(
  "../../artifacts/evaluations/natural-language-probes/fcbc9858-8d1c-43af-bcdb-b04e544f9be8/report.json",
  import.meta.url,
);
const v2ProbeReportUrl = new URL(
  "../../artifacts/evaluations/natural-language-probes/66f33ad6-6d53-440d-9fca-4324cd768c27/report.json",
  import.meta.url,
);

async function loadEvidence(): Promise<{ spec: unknown; catalog: unknown }> {
  const report = JSON.parse(await readFile(probeReportUrl, "utf8")) as {
    spec: unknown;
  };
  return {
    spec: report.spec,
    catalog: JSON.parse(await readFile(catalogUrl, "utf8")) as unknown,
  };
}

async function loadV2Evidence(): Promise<{ spec: unknown; catalog: unknown }> {
  const report = JSON.parse(await readFile(v2ProbeReportUrl, "utf8")) as {
    spec: unknown;
  };
  return {
    spec: report.spec,
    catalog: JSON.parse(await readFile(catalogUrl, "utf8")) as unknown,
  };
}

function withoutAssetVocabulary(input: unknown) {
  const clone = structuredClone(input) as {
    assetQueries: Array<Record<string, unknown>>;
  };
  clone.assetQueries = clone.assetQueries.map(
    ({ theme: _theme, visualStyle: _visualStyle, tags: _tags, ...query }) =>
      query,
  );
  return clone;
}

describe("bounded asset query grounding", () => {
  it("binds the preserved live Spec and current catalog without mutating gameplay", async () => {
    const { spec, catalog } = await loadEvidence();
    const original = structuredClone(spec);
    const catalogSha256 = await sha256File(fileURLToPath(catalogUrl));
    const first = planAssetQueryGrounding(spec, catalog, catalogSha256);
    const second = planAssetQueryGrounding(spec, catalog, catalogSha256);
    const groundedSpec = applyAssetQueryGrounding(
      spec,
      catalog,
      catalogSha256,
      first,
    );

    expect(second).toEqual(first);
    expect(spec).toEqual(original);
    expect(first.sourceSpec.sha256).toBe(sha256ShooterGameSpec(spec));
    expect(first.catalog.sha256).toBe(catalogSha256);
    expect(first.queries).toHaveLength(9);
    expect(withoutAssetVocabulary(groundedSpec)).toEqual(
      withoutAssetVocabulary(original),
    );

    const orange = first.queries.find(
      (query) => query.queryId === "orange-rescue-ship",
    );
    expect(orange?.grounded).toEqual({
      theme: "space",
      visualStyle: ["pixel-art"],
      tags: ["orange", "player", "ship"],
    });
    expect(
      orange?.terms.every(
        (term) => term.ruleId.length > 0 && term.rationale.length > 0,
      ),
    ).toBe(true);
  });

  it("makes every preserved query positively selection-eligible", async () => {
    const { spec, catalog } = await loadEvidence();
    const catalogSha256 = await sha256File(fileURLToPath(catalogUrl));
    const grounding = planAssetQueryGrounding(spec, catalog, catalogSha256);
    const selection = planAssetSelections(spec, catalog, catalogSha256, {
      grounding,
    });

    expect(selection.selections).toHaveLength(9);
    expect(
      selection.selections.every(
        (entry) => entry.breakdown.theme > 0 && entry.breakdown.visualStyle > 0,
      ),
    ).toBe(true);
    expect(selection.selections.map((entry) => entry.selectedAssetId)).toEqual([
      "oga-pixel-player-ship",
      "kenney-player-laser-blue-01",
      "kenney-enemy-black-1",
      "kenney-enemy-meteor-grey-big-1",
      "kenney-enemy-black-1",
      "kenney-boss-ufo-red",
      "kenney-pickup-blue-shield",
      "kenney-pickup-green-bolt",
      "kenney-enemy-laser-red-02",
    ]);
  });

  it("grounds the v2 probe to distinct semantic enemy and pickup roles", async () => {
    const { spec, catalog } = await loadV2Evidence();
    const catalogSha256 = await sha256File(fileURLToPath(catalogUrl));
    const grounding = planAssetQueryGrounding(spec, catalog, catalogSha256);
    const selection = planAssetSelections(spec, catalog, catalogSha256, {
      grounding,
    });

    expect(grounding.schemaVersion).toBe("1.1.2");
    expect(grounding.policyId).toBe("bounded-catalog-grounding-v1.1.2");
    expect(
      grounding.queries
        .find((query) => query.queryId === "enemy-fighter")
        ?.terms.find((term) => term.sourceTerm === "fighter"),
    ).toMatchObject({
      targetTerms: ["ship"],
      ruleId: "tag-fighter-to-ship",
    });
    expect(
      grounding.queries.find((query) => query.queryId === "enemy-fighter")
        ?.grounded.visualStyle,
    ).toEqual(["clean", "retro"]);
    expect(selection.selections.map((entry) => entry.selectedAssetId)).toEqual([
      "oga-pixel-player-ship",
      "kenney-player-laser-blue-03",
      "kenney-enemy-black-1",
      "kenney-enemy-meteor-grey-big-1",
      "kenney-enemy-red-5",
      "oga-pixel-boss",
      "kenney-enemy-laser-red-02",
      "kenney-pickup-blue-shield",
      "kenney-pickup-green-bolt",
    ]);
  });

  it("fails closed with the exact query, field, and unknown term", async () => {
    const { spec, catalog } = await loadEvidence();
    const tampered = structuredClone(spec) as {
      assetQueries: Array<{ visualStyle: string[] }>;
    };
    tampered.assetQueries[0]!.visualStyle[0] = "水墨风格";

    expect(() =>
      planAssetQueryGrounding(tampered, catalog, "a".repeat(64)),
    ).toThrowError(
      new AssetQueryGroundingError(
        "unknown-term",
        "orange-rescue-ship",
        "visualStyle",
        "水墨风格",
      ),
    );
  });

  it("fails closed instead of choosing between ambiguous catalog fields", async () => {
    const { spec, catalog } = await loadEvidence();
    const tampered = structuredClone(spec) as {
      assetQueries: Array<{ visualStyle: string[] }>;
    };
    tampered.assetQueries[0]!.visualStyle[0] = "科幻";

    expect(() =>
      planAssetQueryGrounding(tampered, catalog, "a".repeat(64)),
    ).toThrowError(/ambiguous-term.*orange-rescue-ship.*科幻/u);
  });

  it("rejects a grounding artifact rebound to changed Spec evidence", async () => {
    const { spec, catalog } = await loadEvidence();
    const catalogSha256 = await sha256File(fileURLToPath(catalogUrl));
    const grounding = planAssetQueryGrounding(spec, catalog, catalogSha256);
    const changed = structuredClone(spec) as { title: string };
    changed.title = "Changed evidence title";

    expect(() =>
      applyAssetQueryGrounding(changed, catalog, catalogSha256, grounding),
    ).toThrow(/binding-mismatch/u);
  });
});
