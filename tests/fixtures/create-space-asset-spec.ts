import { createValidSpec } from "./create-valid-spec.js";

export function createSpaceAssetSpec() {
  const spec = createValidSpec();
  spec.assetQueries.push(
    {
      id: "ui-hud-panel",
      category: "ui",
      theme: "space science fiction glass panel",
      visualStyle: ["vector", "clean"],
      tags: ["ui", "panel", "glass", "hud"],
      preferredColors: ["#dadce7"],
      requiresTransparency: true,
    },
    {
      id: "effect-pickup-ring",
      category: "effect",
      theme: "space energy ring",
      visualStyle: ["raster", "particle", "soft"],
      tags: ["effect", "ring", "energy", "shield"],
      preferredColors: ["#e0e0e0"],
      requiresTransparency: true,
    },
  );
  spec.assetQueries = spec.assetQueries.map((query) => {
    if (query.category === "player") {
      return {
        ...query,
        theme: "blue space ship",
        visualStyle: ["vector", "clean"],
        tags: ["ship", "blue"],
      };
    }
    if (query.category === "player-projectile") {
      return {
        ...query,
        theme: "blue space laser",
        visualStyle: ["vector", "glow"],
        tags: ["projectile", "laser", "blue"],
      };
    }
    if (query.category === "enemy") {
      return {
        ...query,
        theme: "space science fiction enemy",
        visualStyle: ["vector", "clean"],
        tags: ["enemy", "ship"],
      };
    }
    if (query.category === "boss") {
      return {
        ...query,
        theme: "space science fiction ufo",
        visualStyle: ["vector", "clean"],
        tags: ["boss", "ufo"],
      };
    }
    if (query.category === "background") {
      return {
        ...query,
        theme: "space arcade starfield",
        visualStyle: ["pixel-art", "retro"],
        tags: ["background", "stars"],
        requiresTransparency: false,
      };
    }
    if (query.category === "enemy-projectile") {
      return {
        ...query,
        theme: "red space laser",
        visualStyle: ["vector", "glow"],
        tags: ["projectile", "laser", "red"],
      };
    }
    if (query.category === "ui" || query.category === "effect") return query;
    return {
      ...query,
      theme: "space science fiction shield",
      visualStyle: ["vector", "clean"],
      tags: ["pickup", "shield"],
    };
  });
  return spec;
}
