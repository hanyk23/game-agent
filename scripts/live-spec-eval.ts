import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createOpencode } from "@opencode-ai/sdk/v2";

import { parseModelReference } from "../src/opencode/compatibility.js";
import { analyzeRequirementWithMetadata } from "../src/requirements/requirement-analyzer.js";

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
  const modelReference = process.env.OPENCODE_MODEL;
  if (!modelReference) throw new Error("OPENCODE_MODEL is required");

  configureIsolatedHome(projectDirectory);
  await mkdir(path.dirname(reportPath), { recursive: true });

  let closeServer: (() => void) | undefined;
  let sessionId: string | undefined;
  let client: Awaited<ReturnType<typeof createOpencode>>["client"] | undefined;

  try {
    const opencode = await createOpencode({
      hostname: "127.0.0.1",
      port: 0,
      timeout: 20_000,
    });
    client = opencode.client;
    closeServer = opencode.server.close;

    const created = await client.session.create(
      {
        directory: projectDirectory,
        title: "DeepSeek ShooterGameSpec Live Evaluation",
        permission: [{ permission: "*", pattern: "*", action: "deny" }],
      },
      { throwOnError: true },
    );
    sessionId = created.data.id;

    const result = await analyzeRequirementWithMetadata(client, {
      sessionId,
      directory: projectDirectory,
      model: parseModelReference(modelReference),
      retryCount: 0,
      prompt:
        "生成一款竖屏 H5 弹幕射击游戏：主题为水墨仙侠，玩家操控白鹤，" +
        "使用键盘和触屏移动并自动射击。关卡包含至少两种普通敌人波次和一个三阶段黑龙 Boss；" +
        "弹幕应包含扇形、螺旋与瞄准射击，难度中等。明确玩家生命、计分、擦弹奖励、" +
        "补给、胜负条件、性能上限、音画风格及全部素材检索需求。所有引用 ID 必须有效且唯一。",
    });

    await writeFile(
      reportPath,
      `${JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          model: modelReference,
          status: "passed",
          outputMode: result.outputMode,
          usage: result.usage,
          spec: result.spec,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    process.stdout.write(
      `${JSON.stringify({
        status: "passed",
        model: modelReference,
        outputMode: result.outputMode,
        usage: result.usage,
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
          model: modelReference,
          status: "failed",
          error: safeError,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    throw error;
  } finally {
    if (client && sessionId) {
      await client.session
        .abort(
          { directory: projectDirectory, sessionID: sessionId },
          { throwOnError: false },
        )
        .catch(() => undefined);
    }
    closeServer?.();
  }
}

await main();
process.exit(0);
