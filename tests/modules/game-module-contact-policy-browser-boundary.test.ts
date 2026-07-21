import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const hostPath = new URL(
  "../../src/modules/game-module-contact-policy-host.ts",
  import.meta.url,
);
const payloadPath = new URL(
  "../../src/modules/game-module-runtime-payloads.ts",
  import.meta.url,
);

describe("browser-safe contact-policy transaction boundary", () => {
  it("has no Node builtin, Buffer, admission registry, or canonical-hash runtime dependency", async () => {
    const [hostSource, payloadSource] = await Promise.all([
      readFile(hostPath, "utf8"),
      readFile(payloadPath, "utf8"),
    ]);
    const runtimeSources = `${hostSource}\n${payloadSource}`;

    expect(runtimeSources).not.toMatch(/from\s+["']node:/u);
    expect(runtimeSources).not.toMatch(/\bBuffer\b/u);
    expect(hostSource).not.toContain("game-module-execution-contract");
    expect(hostSource).not.toContain("game-module-registry");
    expect(hostSource).not.toContain(
      "computeContactPolicyChainProfileEvidenceHash",
    );

    const runtimeImports = [
      ...hostSource.matchAll(
        /^import(?!\s+type\b)[^;]+from\s+["']([^"']+)["'];/gmu,
      ),
    ].map((match) => match[1]);
    expect(runtimeImports).toEqual(["./game-module-runtime-payloads.js"]);
  });
});
