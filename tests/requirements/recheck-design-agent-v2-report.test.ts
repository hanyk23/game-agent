import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_SOURCE_REPORT_RELATIVE_PATH,
  recheckDesignAgentV2Report,
} from "../../scripts/recheck-design-agent-v2-report.js";

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

describe("Design Agent v2 offline report re-audit", () => {
  it("reuses the saved artifact without changing it or making model calls", async () => {
    const projectDirectory = process.cwd();
    const sourceReportPath = path.join(
      projectDirectory,
      DEFAULT_SOURCE_REPORT_RELATIVE_PATH,
    );
    const temporaryDirectory = await mkdtemp(
      path.join(tmpdir(), "design-agent-v2-reaudit-"),
    );
    const outputReportPath = path.join(
      temporaryDirectory,
      "derived-reaudit.json",
    );

    try {
      const sourceBefore = await readFile(sourceReportPath);
      const sourceSha256Before = sha256(sourceBefore);
      const report = await recheckDesignAgentV2Report({
        projectDirectory,
        sourceReportPath,
        outputReportPath,
        now: () => new Date("2026-08-01T04:00:00.000Z"),
      });
      const sourceAfter = await readFile(sourceReportPath);
      const persisted = JSON.parse(
        await readFile(outputReportPath, "utf8"),
      ) as typeof report;

      expect(report.kind).toBe("design-agent-v2-offline-reaudit");
      expect(report.status).toBe("design-ready");
      expect(report.passed).toBe(true);
      expect(report.modelCalls).toBe(0);
      expect(report.reusedSavedArtifact).toBe(true);
      expect(report.sourceReportSha256Before).toBe(sourceSha256Before);
      expect(report.sourceReportSha256After).toBe(sourceSha256Before);
      expect(sha256(sourceAfter)).toBe(sourceSha256Before);
      expect(report.sourceGameDesignSha256).toBe(
        report.recomputedGameDesignSha256,
      );
      expect(
        report.structuralAssertions.every((assertion) => assertion.passed),
      ).toBe(true);
      expect(persisted).toEqual(report);
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
