import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const designUrl = new URL(
  "../../docs/BATCH_3_MODULE_DESIGN.md",
  import.meta.url,
);
const adrUrl = new URL(
  "../../docs/decisions/0028-batch-3-encounter-authority-and-legacy-parity.md",
  import.meta.url,
);

async function read(url: URL): Promise<string> {
  return readFile(url, "utf8");
}

describe("Batch 3 design governance", () => {
  it("binds the accepted ADR 0028 to the frozen Revision 2 bytes", async () => {
    const design = await read(designUrl);
    const adr = await read(adrUrl);
    const hash = createHash("sha256").update(design).digest("hex");

    expect(design).toContain("Status: Revision 2 freeze candidate");
    expect(adr).toContain("Revision 2 freeze candidate");
    expect(adr).toContain("- Status: Accepted");
    expect(adr).toContain("- Accepted: 2026-07-18");
    expect(adr).toContain(`- Design SHA-256: \`${hash}\``);
    expect(adr).toContain("Acceptance authorizes");
  });

  it("keeps older ABI versions and frozen Batch 2 factories immutable", async () => {
    const design = await read(designUrl);
    const adr = await read(adrUrl);

    for (const contract of ["Manifest 1.2", "Manifest 1.3", "Graph 1.3"]) {
      expect(`${design}\n${adr}`).toContain(contract);
    }
    expect(design).toContain("No existing definition is rewritten");
    expect(design).toContain("frozen Batch 2 graze factory");
    expect(adr).toMatch(
      /Existing `@1\.0\.0`\s+registrations remain byte-identical/iu,
    );
  });

  it("locks legal hostile-source lineage, independent custody, and shared caps", async () => {
    const design = await read(designUrl);

    expect(design).toContain("attack-request-v3");
    expect(design).toContain("rootChannelLineageId");
    expect(design).toContain("enemy-projectile");
    expect(design).toContain("hostile-contention-v1");
    expect(design).toMatch(/no shared physical pool/iu);
    expect(design).toContain("Source deactivation cancels future emissions");
    expect(design).toContain("quarantines custody");
  });

  it("locks single-writer scoring and win-first deferred outcomes", async () => {
    const design = await read(designUrl);

    expect(design).toContain("scoring.ledger");
    expect(design).toMatch(/the only\s+score\s+writer/iu);
    expect(design).toMatch(/evaluates win\s+before loss/iu);
    expect(design).toContain(
      "defers scene transition until the guard is released",
    );
    expect(design).toMatch(/Restart\s+always creates a new graph/iu);
  });

  it("preserves fractional legacy score bonuses without silent coercion", async () => {
    const design = await read(designUrl);
    const adr = await read(adrUrl);

    expect(design).toContain("bounded-score-number-v1");
    expect(design).toContain("`7.5` remains `7.5`");
    expect(design).toContain(
      "`Number.isSafeInteger` is deliberately not required",
    );
    expect(design).toContain("no rounding, flooring, decimal scaling, epsilon");
    expect(adr).toMatch(/including legal\s+fractional `scoreBonus` values/iu);
  });

  it("preserves zero-window combo semantics", async () => {
    const design = await read(designUrl);
    const adr = await read(adrUrl);

    expect(design).toContain("comboWindowMs > 0");
    expect(design).toContain("A zero window never continues a combo");
    expect(adr).toMatch(
      /a zero\s+window never chains same-millisecond defeats/iu,
    );
  });

  it("requires once-only frame-tail outcome arbitration", async () => {
    const design = await read(designUrl);
    const adr = await read(adrUrl);

    expect(design).toContain("post-provider-post-event-frame-v1");
    expect(design).toMatch(
      /invoke the one resolved\s+outcome coordinator exactly once/iu,
    );
    expect(design).toMatch(
      /This frame sequence, not callback\s+arrival order/iu,
    );
    expect(adr).toMatch(/barrier per accepted\s+frame/iu);
    expect(adr).toMatch(/exact arbitration token and\s+frame sequence/iu);
  });
});
