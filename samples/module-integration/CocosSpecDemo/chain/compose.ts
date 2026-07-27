// Node-side composition bridge for the Module Integration Sanity (方案 B).
//
// This module runs ONLY in Node (via tsx) — never inside Cocos — because it
// re-exports the byte-identical `composeShooterGame` whose import closure needs
// `zod` + `node:crypto` (see reports/MODULE_INTEGRATION_SANITY.md, GAP-1).
//
// It is the single seam that turns a raw ShooterGameSpec JSON into the composed
// RuntimeGameConfig the engine-neutral kernel consumes:
//
//   valid-spec.json
//     -> parseShooterGameSpec(json)                       (spec zod validation)
//        -> composeShooterGame(spec, { resourceProfile })  (THE mandated entry)
//           -> RuntimeGameConfig
//
// Nothing here is a mock: parseShooterGameSpec + composeShooterGame are the real
// byte-identical product functions.
import { readFileSync } from "node:fs";
import { composeShooterGame } from "./runtime/shooter-game-composer.js";
import type { RuntimeGameConfig } from "./runtime/runtime-game-config.js";

/** Compose a RuntimeGameConfig from an already-parsed raw spec object. */
export function composeRuntimeConfig(rawSpec: unknown): RuntimeGameConfig {
  // composeShooterGame internally calls parseShooterGameSpec(rawSpec), so the
  // spec zod layer runs here too — the whole spec → runtime path is exercised.
  return composeShooterGame(rawSpec, { resourceProfile: "balanced" });
}

/** Compose a RuntimeGameConfig straight from a valid-spec.json path. */
export function composeRuntimeConfigFromFile(
  specPath: string,
): RuntimeGameConfig {
  const raw: unknown = JSON.parse(readFileSync(specPath, "utf8"));
  return composeRuntimeConfig(raw);
}
