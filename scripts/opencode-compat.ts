import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createOpencode } from "@opencode-ai/sdk/v2";

import {
  OpenCodeCompatibilityReportSchema,
  parseModelReference,
  type OpenCodeCompatibilityReport,
} from "../src/opencode/compatibility.js";
import { readOpenCodeJsonResult } from "../src/requirements/requirement-analyzer.js";

type EventStream = AsyncIterable<{ type?: string }>;

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

async function readPackageVersion(projectDirectory: string): Promise<string> {
  const packageJson = JSON.parse(
    await readFile(
      path.join(
        projectDirectory,
        "node_modules",
        "@opencode-ai",
        "sdk",
        "package.json",
      ),
      "utf8",
    ),
  ) as { version?: string };
  if (!packageJson.version) {
    throw new Error("Unable to determine @opencode-ai/sdk version");
  }
  return packageJson.version;
}

async function captureEvents(
  stream: EventStream,
  expectedType: string,
  timeoutMs: number,
): Promise<string[]> {
  const types: string[] = [];
  const iterator = stream[Symbol.asyncIterator]();
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<IteratorResult<{ type?: string }>>((resolve) => {
    timeoutHandle = setTimeout(
      () => resolve({ done: true, value: undefined }),
      timeoutMs,
    );
  });

  try {
    while (types.length < 20) {
      const result = await Promise.race([iterator.next(), timeout]);
      if (result.done) break;
      if (result.value.type) types.push(result.value.type);
      if (result.value.type === expectedType) break;
    }
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    await iterator.return?.();
  }

  return types;
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
    "opencode-compat.json",
  );
  configureIsolatedHome(projectDirectory);
  await mkdir(path.dirname(reportPath), { recursive: true });

  const report: OpenCodeCompatibilityReport = {
    checkedAt: new Date().toISOString(),
    sdkVersion: await readPackageVersion(projectDirectory),
    server: { started: false, healthy: false, version: null, url: null },
    session: { created: false, sessionId: null, aborted: false },
    events: { subscribed: false, capturedTypes: [] },
    structuredOutput: {
      status: "skipped",
      model: process.env.OPENCODE_MODEL ?? null,
      reason:
        "Set OPENCODE_RUN_MODEL_PROBE=1 after approving model cost to run this check.",
    },
    errors: [],
  };

  let closeServer: (() => void) | undefined;
  try {
    const opencode = await createOpencode({
      hostname: "127.0.0.1",
      port: 0,
      timeout: 20_000,
    });
    closeServer = opencode.server.close;
    report.server.started = true;
    report.server.url = opencode.server.url;

    const health = await opencode.client.global.health({ throwOnError: true });
    report.server.healthy = health.data.healthy;
    report.server.version = health.data.version;

    const eventController = new AbortController();
    const eventSubscription = await opencode.client.event.subscribe(
      { directory: projectDirectory },
      { signal: eventController.signal },
    );
    report.events.subscribed = true;
    const eventCapture = captureEvents(
      eventSubscription.stream as EventStream,
      "session.created",
      5_000,
    );

    const created = await opencode.client.session.create(
      {
        directory: projectDirectory,
        title: "Bullet Hell Agent SDK Compatibility Probe",
        permission: [{ permission: "*", pattern: "*", action: "deny" }],
      },
      { throwOnError: true },
    );
    report.session.created = true;
    report.session.sessionId = created.data.id;
    report.events.capturedTypes = await eventCapture;
    eventController.abort();

    if (process.env.OPENCODE_RUN_MODEL_PROBE === "1") {
      if (!process.env.OPENCODE_MODEL) {
        throw new Error(
          "OPENCODE_MODEL is required when OPENCODE_RUN_MODEL_PROBE=1",
        );
      }
      const model = parseModelReference(process.env.OPENCODE_MODEL);
      const response = await opencode.client.session.prompt(
        {
          directory: projectDirectory,
          sessionID: created.data.id,
          model,
          tools: { "*": false },
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: { probe: { const: "ok" } },
              required: ["probe"],
            },
            retryCount: 0,
          },
          parts: [
            { type: "text", text: 'Return JSON with exactly {"probe":"ok"}.' },
          ],
        },
        { throwOnError: true },
      );
      const structured = readOpenCodeJsonResult(response.data).value as
        { probe?: unknown } | undefined;
      if (structured?.probe !== "ok") {
        throw new Error(
          "OpenCode structured output probe returned an unexpected value",
        );
      }
      report.structuredOutput = {
        status: "passed",
        model: process.env.OPENCODE_MODEL,
        reason: null,
      };
    }

    const aborted = await opencode.client.session.abort(
      { directory: projectDirectory, sessionID: created.data.id },
      { throwOnError: true },
    );
    report.session.aborted = aborted.data;
  } catch (error) {
    report.errors.push(
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
    if (process.env.OPENCODE_RUN_MODEL_PROBE === "1") {
      report.structuredOutput.status = "failed";
      report.structuredOutput.reason = report.errors.at(-1) ?? "Unknown error";
    }
  } finally {
    closeServer?.();
  }

  const parsed = OpenCodeCompatibilityReportSchema.parse(report);
  await writeFile(reportPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  await new Promise<void>((resolve) => {
    process.stdout.write(`${JSON.stringify(parsed, null, 2)}\n`, () =>
      resolve(),
    );
  });

  const failed =
    !parsed.server.healthy ||
    !parsed.session.created ||
    parsed.errors.length > 0;
  process.exit(failed ? 1 : 0);
}

await main();
