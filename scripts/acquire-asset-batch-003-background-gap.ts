import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const pageUrl = "https://opengameart.org/content/black-and-green-2000x2000";
const author = "ToxSickProductions.com";
const label = "GreenBlackBG.png";
const robotsUrl = "https://opengameart.org/robots.txt";
const outputRoot = path.resolve(
  ".runtime",
  "asset-batch-003",
  "background-gap-acquisition",
);
const eventsPath = path.join(outputRoot, "request-events.jsonl");
const outputPath = path.join(outputRoot, "downloads", "greenblackbg.png");
const attemptRunId = randomUUID();
const allowedHosts = new Set(["opengameart.org", "www.opengameart.org"]);

const sha256 = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const assertAllowedUrl = (url: string): void => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname)) {
    throw new Error(`unexpected URL: ${url}`);
  }
};

const fetchWithCurl = async (
  url: string,
  timeoutSeconds: number,
  maxBytes: number,
): Promise<{ body: Uint8Array; responseUrl: string }> => {
  assertAllowedUrl(url);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;
    let stderr = "";
    let failure: Error | undefined;
    const child = spawn(
      "curl.exe",
      [
        "--silent",
        "--show-error",
        "--location",
        "--proto",
        "=https",
        "--proto-redir",
        "=https",
        "--max-redirs",
        "3",
        "--max-time",
        String(timeoutSeconds),
        "--max-filesize",
        String(maxBytes),
        "--user-agent",
        "game-agent-asset-research/1.0 (Batch 003 background micro-increment)",
        "--output",
        "-",
        "--write-out",
        "%{stderr}\n__CURL_META__%{url_effective}\t%{http_code}\t%{size_download}\n",
        url,
      ],
      { shell: false, windowsHide: true },
    );
    const timer = setTimeout(
      () => {
        failure = new Error(`curl exceeded ${timeoutSeconds + 5} seconds`);
        child.kill();
      },
      (timeoutSeconds + 5) * 1_000,
    );
    child.stdout.on("data", (chunk: Buffer) => {
      received += chunk.byteLength;
      if (received > maxBytes) {
        failure = new Error(`response crossed ${maxBytes} byte cap`);
        child.kill();
        return;
      }
      chunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 65_536) stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (failure !== undefined) return reject(failure);
      if (code !== 0) {
        return reject(
          new Error(
            `curl exited ${code}: ${stderr.replace(/\s+/g, " ").slice(0, 500)}`,
          ),
        );
      }
      const meta = stderr.match(/__CURL_META__([^\t\r\n]+)\t(\d{3})\t(\d+)/);
      if (meta === null) return reject(new Error("curl metadata is missing"));
      const responseUrl = meta[1] ?? "";
      const status = Number(meta[2]);
      const reportedBytes = Number(meta[3]);
      try {
        assertAllowedUrl(responseUrl);
      } catch (error) {
        return reject(error);
      }
      if (status < 200 || status >= 300) {
        return reject(new Error(`HTTP ${status} for ${url}`));
      }
      if (reportedBytes !== received) {
        return reject(
          new Error(`curl byte mismatch: ${reportedBytes} versus ${received}`),
        );
      }
      resolve({
        body: new Uint8Array(Buffer.concat(chunks, received)),
        responseUrl,
      });
    });
  });
};

const record = async (event: Record<string, unknown>): Promise<void> => {
  await appendFile(
    eventsPath,
    `${JSON.stringify({ attemptRunId, at: new Date().toISOString(), ...event })}\n`,
    "utf8",
  );
};

const main = async (): Promise<void> => {
  await mkdir(path.dirname(outputPath), { recursive: true });
  const evidence: Array<Record<string, unknown>> = [];
  await record({ event: "attempt-start", expectedLogicalGetCount: 3 });

  await record({ event: "request-start", logicalGetNumber: 1, url: robotsUrl });
  const robots = await fetchWithCurl(robotsUrl, 60, 1_000_000);
  const robotsText = new TextDecoder().decode(robots.body);
  if (
    /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robotsText)
  ) {
    throw new Error("robots policy disallows acquisition");
  }
  evidence.push({
    logicalGetNumber: 1,
    kind: "robots",
    requestedUrl: robotsUrl,
    responseUrl: robots.responseUrl,
    bytes: robots.body.byteLength,
    sha256: sha256(robots.body),
  });
  await record({
    event: "request-complete",
    logicalGetNumber: 1,
    bytes: robots.body.byteLength,
  });

  await record({ event: "request-start", logicalGetNumber: 2, url: pageUrl });
  const page = await fetchWithCurl(pageUrl, 60, 2_000_000);
  const html = new TextDecoder().decode(page.body);
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  if (!text.includes(author) || !/\bCC0\b|Creative Commons Zero/i.test(text)) {
    throw new Error(
      "source page no longer proves fixed author and CC0 license",
    );
  }
  const anchors = [
    ...html.matchAll(
      /<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi,
    ),
  ];
  const anchor = anchors.find((match) =>
    (match[3] ?? "").replace(/<[^>]+>/g, " ").includes(label),
  );
  if (anchor === undefined)
    throw new Error(`fixed file label missing: ${label}`);
  const assetUrl = new URL(
    (anchor[1] ?? anchor[2] ?? "").replaceAll("&amp;", "&"),
    page.responseUrl,
  ).href;
  assertAllowedUrl(assetUrl);
  evidence.push({
    logicalGetNumber: 2,
    kind: "source-page",
    sourcePage: pageUrl,
    author,
    license: "CC0-1.0",
    responseUrl: page.responseUrl,
    bytes: page.body.byteLength,
    sha256: sha256(page.body),
  });
  await record({
    event: "request-complete",
    logicalGetNumber: 2,
    bytes: page.body.byteLength,
  });

  await record({
    event: "request-start",
    logicalGetNumber: 3,
    url: assetUrl,
  });
  const asset = await fetchWithCurl(assetUrl, 120, 1_000_000);
  const pngMagic = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!pngMagic.every((byte, index) => asset.body[index] === byte)) {
    throw new Error("asset response is not PNG");
  }
  await writeFile(outputPath, asset.body, { flag: "wx" });
  evidence.push({
    logicalGetNumber: 3,
    kind: "asset-file",
    sourcePage: pageUrl,
    author,
    license: "CC0-1.0",
    label,
    requestedUrl: assetUrl,
    responseUrl: asset.responseUrl,
    bytes: asset.body.byteLength,
    sha256: sha256(asset.body),
    outputPath: path.relative(outputRoot, outputPath).replaceAll("\\", "/"),
  });
  await record({
    event: "request-complete",
    logicalGetNumber: 3,
    bytes: asset.body.byteLength,
    sha256: sha256(asset.body),
  });

  const manifest = {
    schemaVersion: "1.0.0",
    batchId: "003-background-gap",
    status: "downloaded-uninspected",
    attemptRunId,
    proposal: "docs/ASSET_BATCH_003_PROPOSAL.md",
    limits: {
      logicalGetCount: 3,
      pageHardStopBytes: 2_000_000,
      assetHardStopBytes: 1_000_000,
      expandedWorkspaceHardStopBytes: 150_000_000,
      permanentCandidateHardStopBytes: 20_000_000,
    },
    actual: {
      logicalGetCount: 3,
      sourcePageCount: 1,
      directPngCount: 1,
      assetBytes: asset.body.byteLength,
    },
    requests: evidence,
  };
  await writeFile(
    path.join(outputRoot, "download-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx" },
  );
  await record({ event: "attempt-complete", logicalGetCount: 3 });
  process.stdout.write(
    `Background gap acquisition complete: ${asset.body.byteLength} bytes.\n`,
  );
};

await main().catch(async (error: unknown) => {
  await mkdir(outputRoot, { recursive: true });
  await record({
    event: "attempt-failed",
    error: error instanceof Error ? error.message : String(error),
  });
  throw error;
});
