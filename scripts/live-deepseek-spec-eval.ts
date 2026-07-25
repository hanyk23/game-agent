import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeRequirementWithDeepSeek } from "../src/requirements/deepseek-requirement-adapter.js";

type RequirementCase = {
  id: string;
  expected: string;
  prompt: string;
};

async function main(): Promise<void> {
  const projectDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const reportPath = path.join(
    projectDirectory,
    "evals",
    "reports",
    "deepseek-direct-live-spec.json",
  );
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is required");

  const cases = JSON.parse(
    await readFile(
      path.join(projectDirectory, "evals", "cases", "requirement-prompts.json"),
      "utf8",
    ),
  ) as RequirementCase[];
  const evaluationCase = cases.find((item) => item.id === "ink-crane");
  if (!evaluationCase)
    throw new Error("The ink-crane evaluation case is missing");

  await mkdir(path.dirname(reportPath), { recursive: true });
  try {
    const result = await analyzeRequirementWithDeepSeek({
      apiKey,
      prompt: evaluationCase.prompt,
    });
    const report = {
      checkedAt: new Date().toISOString(),
      caseId: evaluationCase.id,
      model: result.model,
      status: "passed",
      outputMode: "deepseek_json_object",
      usage: result.usage,
      spec: result.spec,
    };
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(
      `${JSON.stringify({
        status: report.status,
        model: report.model,
        usage: report.usage,
        reportPath,
      })}\n`,
    );
  } catch (error) {
    const safeError = {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
    await writeFile(
      reportPath,
      `${JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          caseId: evaluationCase.id,
          model: "deepseek-v4-flash",
          status: "failed",
          error: safeError,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    throw error;
  }
}

await main();
