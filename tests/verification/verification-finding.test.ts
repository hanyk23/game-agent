import { describe, expect, it } from "vitest";

import {
  createVerificationFinding,
  VerificationFindingSchema,
} from "../../src/verification/verification-finding.js";

describe("verification finding", () => {
  it("creates stable bounded machine-readable evidence", () => {
    const input = {
      gate: "play" as const,
      code: "keyboard-movement-failed",
      message: "Keyboard movement did not move the player.",
      suspectedFiles: [
        "game-template/vertical-shooter/src/scenes/play-scene.ts",
      ],
      reportPath: "verification/browser-gates.json",
      caseName: "desktop" as const,
      id: "e9c6c8cf-d2be-4f9d-8dd4-cfc994f342f4",
    };

    const first = createVerificationFinding(input);
    const second = createVerificationFinding(input);
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(first).toMatchObject({ gate: "play", severity: "error" });
  });

  it("rejects paths that escape the run", () => {
    const finding = createVerificationFinding({
      gate: "play",
      code: "runtime-failed",
      message: "Runtime failed.",
      suspectedFiles: [
        "game-template/vertical-shooter/src/scenes/play-scene.ts",
      ],
      reportPath: "verification/browser-gates.json",
    });
    expect(
      VerificationFindingSchema.safeParse({
        ...finding,
        suspectedFiles: ["../outside.ts"],
      }).success,
    ).toBe(false);
  });
});
