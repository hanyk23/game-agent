import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

const files = {
  agents: new URL("../../AGENTS.md", import.meta.url),
  roadmap: new URL("../../docs/ROADMAP.md", import.meta.url),
  handoff: new URL("../../docs/HANDOFF.md", import.meta.url),
  status: new URL("../../docs/CURRENT_STATUS.md", import.meta.url),
  abiSpec: new URL("../../docs/BATCH_1_RUNTIME_ABI_SPEC.md", import.meta.url),
  abiAdr: new URL(
    "../../docs/decisions/0026-batch-1-runtime-abi-remediation.md",
    import.meta.url,
  ),
};

async function text(name: keyof typeof files): Promise<string> {
  return readFile(files[name], "utf8");
}

function lineCount(value: string): number {
  return value.trimEnd().split(/\r?\n/u).length;
}

describe("documentation governance", () => {
  it("keeps the recovery surface within bounded line budgets", async () => {
    const agents = await text("agents");

    expect(lineCount(agents)).toBeLessThanOrEqual(130);
    expect(Buffer.byteLength(agents, "utf8")).toBeLessThanOrEqual(9_000);
    expect(lineCount(await text("roadmap"))).toBeLessThanOrEqual(140);
    expect(lineCount(await text("handoff"))).toBeLessThanOrEqual(80);
    expect(lineCount(await text("status"))).toBeLessThanOrEqual(220);
  });

  it("keeps chronology out of the current status ledger", async () => {
    const status = await text("status");

    expect(status).toContain("## Capability matrix");
    expect(status).toContain("## Latest evaluation evidence");
    expect(status).toContain("## Known risks and gaps");
    expect(status).toContain("## Next milestone");
    expect(status).not.toContain("## Verification performed");
    expect(status).not.toContain("## Milestones");
  });

  it("keeps the ABI 1.2 child-rule matrix complete and hash-linked", async () => {
    const spec = await text("abiSpec");
    const adr = await text("abiAdr");
    const rows = spec
      .split(/\r?\n/u)
      .filter((line) => /^\| ABI26-[A-Z0-9-]+\.\d+\s+\|/u.test(line));
    const ids = rows.map((row) => row.split("|")[1]!.trim());
    expect(rows.length).toBeGreaterThanOrEqual(37);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      rows.every((row) =>
        row
          .split("|")
          .slice(1, 6)
          .every((cell) => cell.trim().length > 0),
      ),
    ).toBe(true);
    expect(spec).not.toMatch(/\bpending\b/iu);
    const hash = createHash("sha256").update(spec).digest("hex");
    expect(adr).toContain(hash);
  });
});