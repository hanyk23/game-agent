import type Phaser from "phaser";

import type {
  RuntimeGameConfig,
  RuntimeResolvedAsset,
} from "../../../src/runtime/runtime-game-config.js";

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256 = /^[0-9a-f]{64}$/;
const RUNTIME_URL =
  /^\/assets\/catalog\/([a-z0-9]+(?:-[a-z0-9]+)*)\.(png|webp|jpeg|svg)$/;
const ASSET_CATEGORIES = new Set([
  "player",
  "enemy",
  "boss",
  "background",
  "player-projectile",
  "enemy-projectile",
  "pickup",
  "ui",
  "effect",
]);

type JsonRecord = Record<string, unknown>;

function assertCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(`Invalid runtime asset map: ${message}`);
}

function asRecord(value: unknown, path: string): JsonRecord {
  assertCondition(
    typeof value === "object" && value !== null && !Array.isArray(value),
    `${path} must be an object`,
  );
  return value as JsonRecord;
}

function assertExactKeys(
  record: JsonRecord,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(record).sort();
  const wanted = [...expected].sort();
  assertCondition(
    actual.length === wanted.length &&
      actual.every((key, index) => key === wanted[index]),
    `${path} contains missing or unknown fields`,
  );
}

function assertSafeId(value: unknown, path: string): asserts value is string {
  assertCondition(
    typeof value === "string" && SAFE_ID.test(value),
    `${path} must be a safe identifier`,
  );
}

function referencedQueryIds(config: JsonRecord): Array<{
  queryId: string;
  category: string;
  path: string;
}> {
  const references: Array<{
    queryId: string;
    category: string;
    path: string;
  }> = [];
  const player = asRecord(config.player, "player");
  const boss = asRecord(config.boss, "boss");
  assertSafeId(player.assetQueryId, "player.assetQueryId");
  assertSafeId(boss.assetQueryId, "boss.assetQueryId");
  references.push(
    {
      queryId: player.assetQueryId,
      category: "player",
      path: "player.assetQueryId",
    },
    {
      queryId: boss.assetQueryId,
      category: "boss",
      path: "boss.assetQueryId",
    },
  );

  for (const [field, idField, category] of [
    ["weapons", "projectileAssetQueryId", "player-projectile"],
    ["enemyWaves", "enemyAssetQueryId", "enemy"],
    ["pickups", "assetQueryId", "pickup"],
  ] as const) {
    const values = config[field];
    assertCondition(Array.isArray(values), `${field} must be an array`);
    values.forEach((value, index) => {
      const record = asRecord(value, `${field}[${index}]`);
      assertSafeId(record[idField], `${field}[${index}].${idField}`);
      references.push({
        queryId: record[idField],
        category,
        path: `${field}[${index}].${idField}`,
      });
    });
  }
  return references;
}

export function parseRuntimeGameConfig(input: unknown): RuntimeGameConfig {
  const config = asRecord(input, "config");
  const resolved = asRecord(config.resolvedAssets, "resolvedAssets");
  assertCondition(
    resolved.mode === "legacy-geometric" || resolved.mode === "catalog",
    "resolvedAssets.mode is unsupported",
  );
  if (resolved.mode === "legacy-geometric") {
    assertExactKeys(resolved, ["mode"], "resolvedAssets");
    return input as RuntimeGameConfig;
  }

  const resolvedKeys = [
    "mode",
    "catalogId",
    "catalogSha256",
    "backgroundQueryId",
    "enemyProjectileQueryId",
    "selections",
  ];
  if ("uiQueryId" in resolved) resolvedKeys.push("uiQueryId");
  if ("effectQueryId" in resolved) resolvedKeys.push("effectQueryId");
  assertExactKeys(resolved, resolvedKeys, "resolvedAssets");
  assertSafeId(resolved.catalogId, "resolvedAssets.catalogId");
  assertCondition(
    typeof resolved.catalogSha256 === "string" &&
      SHA256.test(resolved.catalogSha256),
    "resolvedAssets.catalogSha256 must be lowercase SHA-256",
  );
  assertSafeId(resolved.backgroundQueryId, "resolvedAssets.backgroundQueryId");
  assertSafeId(
    resolved.enemyProjectileQueryId,
    "resolvedAssets.enemyProjectileQueryId",
  );
  assertCondition(
    Array.isArray(resolved.selections) && resolved.selections.length > 0,
    "resolvedAssets.selections must be a non-empty array",
  );
  const assetQueries = config.assetQueries;
  assertCondition(
    Array.isArray(assetQueries) &&
      assetQueries.length === resolved.selections.length,
    "catalog mode must resolve every asset query exactly once",
  );

  const queryCategories = new Map<string, string>();
  assetQueries.forEach((value, index) => {
    const query = asRecord(value, `assetQueries[${index}]`);
    assertSafeId(query.id, `assetQueries[${index}].id`);
    assertCondition(
      typeof query.category === "string" &&
        ASSET_CATEGORIES.has(query.category),
      `assetQueries[${index}].category is unsupported`,
    );
    assertCondition(
      !queryCategories.has(query.id),
      `duplicate asset query: ${query.id}`,
    );
    queryCategories.set(query.id, query.category);
  });

  const assetDefinitions = new Map<string, string>();
  resolved.selections.forEach((value, index) => {
    const selected = asRecord(value, `resolvedAssets.selections[${index}]`);
    assertExactKeys(
      selected,
      [
        "queryId",
        "category",
        "assetId",
        "textureKey",
        "runtimeUrl",
        "sourceSha256",
        "width",
        "height",
      ],
      `resolvedAssets.selections[${index}]`,
    );
    assertSafeId(selected.queryId, `selections[${index}].queryId`);
    assertSafeId(selected.assetId, `selections[${index}].assetId`);
    assertCondition(
      selected.category === queryCategories.get(selected.queryId),
      `selection ${selected.queryId} has the wrong category`,
    );
    const query = asRecord(assetQueries[index], `assetQueries[${index}]`);
    assertCondition(
      selected.queryId === query.id && selected.category === query.category,
      "selection order must exactly match assetQueries",
    );
    assertCondition(
      selected.textureKey === `catalog-${selected.assetId}`,
      `selection ${selected.queryId} has a non-deterministic texture key`,
    );
    const urlMatch =
      typeof selected.runtimeUrl === "string"
        ? RUNTIME_URL.exec(selected.runtimeUrl)
        : null;
    assertCondition(
      urlMatch?.[1] === selected.assetId,
      `selection ${selected.queryId} has an invalid runtime URL`,
    );
    assertCondition(
      typeof selected.sourceSha256 === "string" &&
        SHA256.test(selected.sourceSha256),
      `selection ${selected.queryId} has an invalid source hash`,
    );
    assertCondition(
      Number.isSafeInteger(selected.width) &&
        Number(selected.width) > 0 &&
        Number(selected.width) <= 16_384 &&
        Number.isSafeInteger(selected.height) &&
        Number(selected.height) > 0 &&
        Number(selected.height) <= 16_384,
      `selection ${selected.queryId} has invalid dimensions`,
    );
    const definition = `${selected.textureKey}|${selected.runtimeUrl}|${selected.sourceSha256}|${selected.width}|${selected.height}`;
    const previous = assetDefinitions.get(selected.assetId);
    assertCondition(
      previous === undefined || previous === definition,
      `asset ${selected.assetId} has conflicting definitions`,
    );
    assetDefinitions.set(selected.assetId, definition);
  });

  assertCondition(
    queryCategories.get(resolved.backgroundQueryId) === "background",
    "backgroundQueryId must reference a background selection",
  );
  assertCondition(
    queryCategories.get(resolved.enemyProjectileQueryId) === "enemy-projectile",
    "enemyProjectileQueryId must reference an enemy-projectile selection",
  );
  for (const [field, category] of [
    ["uiQueryId", "ui"],
    ["effectQueryId", "effect"],
  ] as const) {
    const categoryExists = [...queryCategories.values()].includes(category);
    if (categoryExists) {
      assertSafeId(resolved[field], `resolvedAssets.${field}`);
      assertCondition(
        queryCategories.get(resolved[field]) === category,
        `${field} must reference a ${category} selection`,
      );
    } else {
      assertCondition(
        resolved[field] === undefined,
        `${field} is not allowed without a ${category} query`,
      );
    }
  }
  for (const reference of referencedQueryIds(config)) {
    assertCondition(
      queryCategories.get(reference.queryId) === reference.category,
      `${reference.path} does not reference a ${reference.category} selection`,
    );
  }

  return input as RuntimeGameConfig;
}

export function catalogSelections(
  config: RuntimeGameConfig,
): readonly RuntimeResolvedAsset[] {
  return config.resolvedAssets.mode === "catalog"
    ? config.resolvedAssets.selections
    : [];
}

export function textureKeyForQuery(
  config: RuntimeGameConfig,
  queryId: string,
  legacyTextureKey: string,
): string {
  if (config.resolvedAssets.mode === "legacy-geometric") {
    return legacyTextureKey;
  }
  const selected = config.resolvedAssets.selections.find(
    (candidate) => candidate.queryId === queryId,
  );
  if (selected === undefined) {
    throw new Error(`Missing resolved runtime asset query: ${queryId}`);
  }
  return selected.textureKey;
}

export function addRuntimeBackground(
  scene: Phaser.Scene,
  config: RuntimeGameConfig,
): string | null {
  if (config.resolvedAssets.mode !== "catalog") return null;
  const textureKey = textureKeyForQuery(
    config,
    config.resolvedAssets.backgroundQueryId,
    "",
  );
  scene.add
    .image(scene.scale.width / 2, scene.scale.height / 2, textureKey)
    .setDisplaySize(scene.scale.width, scene.scale.height)
    .setDepth(-1_000);
  return textureKey;
}

export function addRuntimeHudPanel(
  scene: Phaser.Scene,
  config: RuntimeGameConfig,
): string | null {
  if (
    config.resolvedAssets.mode !== "catalog" ||
    config.resolvedAssets.uiQueryId === undefined
  ) {
    return null;
  }
  const textureKey = textureKeyForQuery(
    config,
    config.resolvedAssets.uiQueryId,
    "",
  );
  scene.add
    .image(scene.scale.width / 2, 34, textureKey)
    .setDisplaySize(Math.max(1, scene.scale.width - 20), 68)
    .setAlpha(0.78)
    .setDepth(-900)
    .setScrollFactor(0);
  return textureKey;
}

export function addRuntimeEffect(
  scene: Phaser.Scene,
  config: RuntimeGameConfig,
  x: number,
  y: number,
  tint: number,
): string | null {
  if (
    config.resolvedAssets.mode !== "catalog" ||
    config.resolvedAssets.effectQueryId === undefined
  ) {
    return null;
  }
  const textureKey = textureKeyForQuery(
    config,
    config.resolvedAssets.effectQueryId,
    "",
  );
  const effect = scene.add
    .image(x, y, textureKey)
    .setDisplaySize(54, 54)
    .setAlpha(0.9)
    .setTint(tint)
    .setDepth(800);
  scene.tweens.add({
    targets: effect,
    alpha: 0,
    scaleX: effect.scaleX * 1.45,
    scaleY: effect.scaleY * 1.45,
    duration: 260,
    ease: "Quad.Out",
    onComplete: () => effect.destroy(),
  });
  return textureKey;
}

export function fitSpriteToBox(
  sprite: Phaser.GameObjects.Sprite,
  maximumWidth: number,
  maximumHeight: number,
): void {
  const source = sprite.texture.getSourceImage() as {
    width?: number;
    height?: number;
  };
  const width = source.width ?? sprite.width;
  const height = source.height ?? sprite.height;
  const scale = Math.min(maximumWidth / width, maximumHeight / height);
  sprite.setScale(scale);
}
