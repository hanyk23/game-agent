import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { RUN_TEMPLATE_SOURCE_FILES } from "../../src/orchestration/run-composition-stage.js";

function runtimeRelativeSpecifiers(source: string): readonly string[] {
  const specifiers: string[] = [];
  const imports =
    /\bimport\s+(?!type\b)(?:(?:[\s\S]*?)\s+from\s+)?["']([^"']+)["']\s*;|\bexport\s+\*\s+from\s+["']([^"']+)["']\s*;/g;
  for (const match of source.matchAll(imports)) {
    const specifier = match[1] ?? match[2];
    if (specifier?.startsWith(".")) specifiers.push(specifier);
  }
  return specifiers;
}

function browserRuntimeClosure(entry: string): readonly string[] {
  const visited = new Set<string>();
  const visit = (file: string): void => {
    const normalized = path.normalize(file);
    if (visited.has(normalized)) return;
    visited.add(normalized);
    const source = readFileSync(normalized, "utf8");
    expect(source, normalized).not.toMatch(/\b(?:import|export).*?["']node:/s);
    for (const specifier of runtimeRelativeSpecifiers(source)) {
      visit(
        path.resolve(
          path.dirname(normalized),
          specifier.replace(/\.js$/, ".ts"),
        ),
      );
    }
  };
  visit(entry);
  return Object.freeze([...visited].map((file) => path.basename(file)).sort());
}

describe("Graph 1.4 production browser boundary", () => {
  it("keeps the V1.4 authority projection inside the Node-free runtime closure", () => {
    const closure = browserRuntimeClosure(
      path.resolve(
        process.cwd(),
        "src/modules/game-module-production-instantiator.ts",
      ),
    );

    expect(closure).toContain("game-module-production-authority-v14.ts");
    expect(closure).toContain("game-module-hostile-attack-router.ts");
    expect(closure).toContain("game-module-score-authority-adapter-v14.ts");
    expect(closure).toContain("game-module-score-ledger-host.ts");
    expect(closure).toContain("game-module-runtime-abi-v12.ts");
    expect(closure).toContain("game-module-runtime-catalog.ts");
    expect(closure).toContain("game-module-runtime-payloads.ts");
    expect(closure).not.toContain("game-module-runtime-catalog-generator.ts");
    expect(closure).not.toContain("game-module-registry.ts");
    expect(closure).not.toContain("game-module-resolver-v14.ts");
  });

  it("copies the V1.4 runtime authority projection into isolated runs", () => {
    expect(RUN_TEMPLATE_SOURCE_FILES).toEqual(
      expect.arrayContaining([
        "src/modules/game-module-production-authority-v14.ts",
        "src/modules/game-module-hostile-attack-router.ts",
        "src/modules/game-module-outcome-authority-adapter-v14.ts",
        "src/modules/game-module-outcome-host.ts",
        "src/modules/game-module-score-authority-adapter-v14.ts",
        "src/modules/game-module-score-ledger-host.ts",
      ]),
    );
  });
});
