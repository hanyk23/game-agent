import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { ZodError } from "zod";

import { readOpenCodeJsonResult } from "../src/requirements/requirement-analyzer.js";
import { parseShooterGameSpec } from "../src/requirements/shooter-game-spec.js";

const execFileAsync = promisify(execFile);

type ExportedAssistant = {
  info: {
    role: "assistant";
    providerID: string;
    modelID: string;
    error?: { name: string };
    structured?: unknown;
    cost: number;
    tokens: {
      input: number;
      output: number;
      reasoning: number;
      cache: { read: number };
    };
  };
  parts: Array<{ type: string; text?: string }>;
};

function configureIsolatedHome(projectDirectory: string): void {
  const runtimeHome = path.join(projectDirectory, ".runtime", "home");
  process.env.HOME = runtimeHome;
  process.env.USERPROFILE = runtimeHome;
  process.env.LOCALAPPDATA = path.join(runtimeHome, "AppData", "Local");
  process.env.APPDATA = path.join(runtimeHome, "AppData", "Roaming");
  process.env.XDG_DATA_HOME = path.join(runtimeHome, ".local", "share");
  process.env.XDG_CACHE_HOME = path.join(runtimeHome, ".cache");
  process.env.XDG_CONFIG_HOME = path.join(runtimeHome, ".config");
}

async function main(): Promise<void> {
  const sessionId = process.argv[2];
  if (!sessionId) throw new Error("A local OpenCode session ID is required");

  const projectDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const reportPath = path.join(
    projectDirectory,
    "evals",
    "reports",
    "deepseek-live-spec.json",
  );
  configureIsolatedHome(projectDirectory);
  await mkdir(path.dirname(reportPath), { recursive: true });

  const executable = path.join(
    projectDirectory,
    "node_modules",
    "opencode-windows-x64",
    "bin",
    "opencode.exe",
  );
  const exported = await execFileAsync(executable, ["export", sessionId], {
    cwd: projectDirectory,
    env: process.env,
    maxBuffer: 4 * 1024 * 1024,
  });
  const session = JSON.parse(exported.stdout) as {
    messages: Array<ExportedAssistant | { info: { role: string } }>;
  };
  const assistant = session.messages
    .filter(
      (message): message is ExportedAssistant =>
        message.info.role === "assistant",
    )
    .at(-1);
  if (!assistant) throw new Error("The session has no assistant response");
  const assistantInfo = assistant.info;

  const parsed = readOpenCodeJsonResult({
    info: assistantInfo,
    parts: assistant.parts,
  });
  let status: "passed" | "failed" = "passed";
  let spec: unknown;
  let error:
    | {
        name: string;
        message: string;
        observedTopLevelKeys: string[];
        validationIssues: Array<{
          path: Array<string | number>;
          code: string;
          message: string;
        }>;
      }
    | undefined;

  try {
    spec = parseShooterGameSpec(parsed.value);
  } catch (validationError) {
    status = "failed";
    const value = parsed.value;
    error = {
      name: "ShooterGameSpecValidationError",
      message:
        "DeepSeek returned valid JSON, but it did not match the local ShooterGameSpec schema.",
      observedTopLevelKeys:
        value && typeof value === "object" && !Array.isArray(value)
          ? Object.keys(value)
          : [],
      validationIssues:
        validationError instanceof ZodError
          ? validationError.issues.map((issue) => ({
              path: issue.path.filter(
                (segment): segment is string | number =>
                  typeof segment === "string" || typeof segment === "number",
              ),
              code: issue.code,
              message: issue.message,
            }))
          : [],
    };
  }

  const report = {
    checkedAt: new Date().toISOString(),
    model: `${assistantInfo.providerID}/${assistantInfo.modelID}`,
    status,
    outputMode: parsed.outputMode,
    usage: {
      cost: assistantInfo.cost,
      inputTokens: assistantInfo.tokens.input,
      outputTokens: assistantInfo.tokens.output,
      reasoningTokens: assistantInfo.tokens.reasoning,
      cacheReadTokens: assistantInfo.tokens.cache.read,
    },
    ...(spec ? { spec } : {}),
    ...(error ? { error } : {}),
  };
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(
    `${JSON.stringify({ status, outputMode: parsed.outputMode, reportPath })}\n`,
  );
}

await main();
process.exit(0);
