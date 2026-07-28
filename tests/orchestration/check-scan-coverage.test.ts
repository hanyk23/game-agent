import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// Structural guard for the layered check scripts.
//
// The check:* scripts run vitest against an EXPLICIT allowlist of directories
// rather than the whole tests/ tree:
//   - check:fast      → its own directory list (also the daily fast loop)
//   - check:admission → runs check:fast first, then adds more directories
//   - check           → `pnpm test` (vitest run with no filter → every dir)
//
// That explicitness is deliberate (fast loop stays fast, release runs
// everything), but it creates a silent-drop hazard: a NEW test directory — or a
// test file relocated into a "more natural" directory that nobody wired in —
// runs in `pnpm check` yet quietly falls out of check:fast / check:admission.
// This guard makes that failure loud: every directory under tests/ that holds
// *.test.ts must be covered by the fast+admission gates, unless it is an
// explicitly acknowledged release-only directory below.

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Directories that intentionally run only in the full `pnpm check` release gate
 * (via `pnpm test`), not in check:fast / check:admission. Keep this list tiny
 * and justified — every entry is a conscious exclusion, not an oversight.
 */
const RELEASE_ONLY_TEST_DIRS = new Set<string>([
  // Documentation-governance suites: assert doc byte/line budgets and provenance.
  // Not needed for code-change fast/admission loops; covered by `pnpm check`.
  "docs",
  // Evaluation/regression baselines used for acceptance, not per-change gating.
  "evaluation",
]);

function parseScannedDirs(script: string): Set<string> {
  // Collect every `tests/<dir>` token the script hands to vitest.
  const dirs = new Set<string>();
  for (const match of script.matchAll(/tests\/([A-Za-z0-9_-]+)/g)) {
    const dir = match[1];
    if (dir !== undefined) dirs.add(dir);
  }
  return dirs;
}

function readPackageScripts(): Record<string, string> {
  const raw = readFileSync(
    new URL("package.json", `file://${repoRoot}`),
    "utf8",
  );
  const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
  return parsed.scripts ?? {};
}

function testDirsWithSuites(): string[] {
  const testsRoot = new URL("tests/", `file://${repoRoot}`);
  const entries = readdirSync(testsRoot, { withFileTypes: true });
  const dirs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dirUrl = new URL(`${entry.name}/`, testsRoot);
    const hasSuite = readdirSync(dirUrl).some((name) =>
      name.endsWith(".test.ts"),
    );
    if (hasSuite) dirs.push(entry.name);
  }
  return dirs;
}

describe("layered check scripts cover every test directory", () => {
  const scripts = readPackageScripts();
  const fastDirs = parseScannedDirs(scripts["check:fast"] ?? "");
  // check:admission runs check:fast first, so its effective coverage is the union.
  const admissionDirs = new Set<string>([
    ...fastDirs,
    ...parseScannedDirs(scripts["check:admission"] ?? ""),
  ]);
  const suiteDirs = testDirsWithSuites();

  it("keeps the orchestration suite in the fast + admission gates", () => {
    // The specific regression this guard was born from: the Orchestrator seam
    // test must never silently drop out of the fast/admission loops.
    expect(fastDirs.has("orchestration")).toBe(true);
    expect(admissionDirs.has("orchestration")).toBe(true);
  });

  it("wires every non-release test directory into check:admission", () => {
    const uncovered = suiteDirs.filter(
      (dir) => !admissionDirs.has(dir) && !RELEASE_ONLY_TEST_DIRS.has(dir),
    );
    expect(
      uncovered,
      `these tests/ directories hold *.test.ts but are not scanned by ` +
        `check:fast/check:admission and are not marked release-only — wire ` +
        `them into package.json or add them to RELEASE_ONLY_TEST_DIRS: ` +
        `${uncovered.join(", ")}`,
    ).toEqual([]);
  });

  it("keeps every release-only exclusion an actual, deliberate directory", () => {
    // Prevent the allowlist from rotting: an entry that no longer maps to a
    // real suite-bearing directory is stale and should be removed.
    const stale = [...RELEASE_ONLY_TEST_DIRS].filter(
      (dir) => !suiteDirs.includes(dir),
    );
    expect(stale).toEqual([]);
  });
});
