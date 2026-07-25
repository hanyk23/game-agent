import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type Asset = { label: string; expectedBytes: number };
type Source = {
  id: string;
  pageUrl: string;
  author: string;
  assets: Asset[];
};

const sources: Source[] = [
  {
    id: "toxsick-black-green-background",
    pageUrl: "https://opengameart.org/content/black-and-green-2000x2000",
    author: "ToxSickProductions.com",
    assets: [{ label: "GreenBlackBG.png", expectedBytes: 318_400 }],
  },
  {
    id: "tebruno99-chalky-space",
    pageUrl:
      "https://opengameart.org/content/background-space-with-planet-in-chalky-style",
    author: "tebruno99",
    assets: [{ label: "chalky-space.png", expectedBytes: 2_000_000 }],
  },
  {
    id: "sauer2-starfield",
    pageUrl: "https://opengameart.org/content/starfield-background",
    author: "Sauer2",
    assets: [{ label: "bg_1_1.png", expectedBytes: 15_100 }],
  },
  {
    id: "luminousdragon-seamless-night",
    pageUrl: "https://opengameart.org/content/perfectly-seamless-night-sky",
    author: "LuminousDragonGames",
    assets: [{ label: "Starbasesnow.png", expectedBytes: 3_500_000 }],
  },
  {
    id: "hassekf-scifi-background",
    pageUrl: "https://opengameart.org/content/sci-fi-background",
    author: "hassekf",
    assets: [
      {
        label: "sci_fi_bg_freebie_ask4asset.com_.zip",
        expectedBytes: 162_600,
      },
    ],
  },
  {
    id: "pwl-seamless-cave",
    pageUrl: "https://opengameart.org/content/seamless-cave-background",
    author: "PWL",
    assets: [{ label: "back_cave.png", expectedBytes: 82_900 }],
  },
  {
    id: "beren77-space-backdrop",
    pageUrl: "https://opengameart.org/content/space-backdrop",
    author: "beren77",
    assets: [{ label: "spacefield_a-000.png", expectedBytes: 454_300 }],
  },
  {
    id: "stumpystrust-space-background",
    pageUrl: "https://opengameart.org/content/space-background-2",
    author: "StumpyStrust",
    assets: [{ label: "space1.png", expectedBytes: 1_200_000 }],
  },
  {
    id: "sethbyrd-starry-night",
    pageUrl: "https://opengameart.org/content/starry-night-background",
    author: "SethByrd",
    assets: [{ label: "ASSETS.zip", expectedBytes: 1_100_000 }],
  },
  {
    id: "phobi-bullets",
    pageUrl: "https://opengameart.org/content/bullets",
    author: "phobi",
    assets: [{ label: "Bullets_by_phobi.zip", expectedBytes: 1_600 }],
  },
  {
    id: "ruok-geometry-siege",
    pageUrl:
      "https://opengameart.org/content/abstract-geometric-bosses-bullets-player-and-other",
    author: "RUOK",
    assets: [{ label: "geometrysiegeassets.zip", expectedBytes: 919_700 }],
  },
  {
    id: "mieki256-stg-objects",
    pageUrl: "https://opengameart.org/content/stg-object-image",
    author: "mieki256",
    assets: [
      { label: "shot.png", expectedBytes: 565 },
      { label: "boss_shot1.png", expectedBytes: 206 },
      { label: "boss_laser.png", expectedBytes: 161 },
      { label: "boss_body.png", expectedBytes: 4_500 },
    ],
  },
  {
    id: "ansimuz-megabot",
    pageUrl: "https://opengameart.org/content/mega-bot-assets-pack",
    author: "ansimuz",
    assets: [{ label: "megabot assets files.zip", expectedBytes: 24_600 }],
  },
  {
    id: "jaykingsta14-mega-mecha",
    pageUrl: "https://opengameart.org/node/88384",
    author: "JayKingSta14",
    assets: [{ label: "Mega Mecha.png", expectedBytes: 378_300 }],
  },
  {
    id: "gameprogrammingslave-effects",
    pageUrl: "https://opengameart.org/content/explosions",
    author: "GameProgrammingSlave",
    assets: [
      { label: "explosion0.png", expectedBytes: 22_800 },
      { label: "explosion1.png", expectedBytes: 25_900 },
      { label: "explosion2.png", expectedBytes: 24_900 },
      { label: "shields.png", expectedBytes: 15_600 },
    ],
  },
  {
    id: "arlantr-energy",
    pageUrl: "https://opengameart.org/content/energy",
    author: "ArlanTR",
    assets: [{ label: "energy-sprite-sheet.png", expectedBytes: 4_200 }],
  },
  {
    id: "zeroisnotnull-shield",
    pageUrl: "https://opengameart.org/content/shield-sprite",
    author: "zeroisnotnull",
    assets: [{ label: "shield.png", expectedBytes: 150_600 }],
  },
  {
    id: "diggy-rocket",
    pageUrl: "https://opengameart.org/content/16-direction-rocket-projectile",
    author: "diggy",
    assets: [{ label: "projectile_rocket_16x16.png", expectedBytes: 98_800 }],
  },
  {
    id: "luca-pixel-bullets",
    pageUrl:
      "https://opengameart.org/content/bullet-collection-different-colors",
    author: "Luca Pixel",
    assets: [{ label: "Bullet.zip", expectedBytes: 2_300 }],
  },
];

const expectedSourceCount = 19;
const expectedAssetCount = 25;
const expectedLogicalGetCount = 45;
const previousDownloadedBytes = 5_310_222;
const assetHardStopBytes = 14_000_000;
const combinedAssetHardStopBytes = 19_310_222;
const pageHardStopBytes = 22_000_000;
const perPageHardStopBytes = 2_000_000;
const spacingMs = 10_000;
const pageTimeoutMs = 60_000;
const assetTimeoutMs = 120_000;
const allowedHosts = new Set(["opengameart.org", "www.opengameart.org"]);
const outputRoot = path.resolve(
  ".runtime",
  "asset-batch-003",
  "gap-acquisition",
);
const downloadsRoot = path.join(outputRoot, "downloads");
const eventsPath = path.join(outputRoot, "request-events.jsonl");
const attemptRunId = randomUUID();

const sha256 = (value: Uint8Array | string): string =>
  createHash("sha256").update(value).digest("hex");

const decodeHtml = (value: string): string =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_match, code: string) =>
      String.fromCodePoint(Number(code)),
    );

const plainText = (html: string): string =>
  decodeHtml(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const normalizedLabel = (value: string): string =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();

const assertAllowedUrl = (url: string, purpose: string): URL => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname)) {
    throw new Error(`${purpose} resolved to unexpected URL: ${url}`);
  }
  return parsed;
};

type CurlResult = { body: Uint8Array; responseUrl: string };

const fetchChecked = async (
  url: string,
  timeoutMs: number,
  remainingBytes: number,
): Promise<CurlResult> => {
  assertAllowedUrl(url, "request");
  return new Promise<CurlResult>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let stderr = "";
    let receivedBytes = 0;
    let capFailure: Error | undefined;
    let timerFailure = false;
    let settled = false;
    const finishReject = (error: Error): void => {
      if (settled) return;
      settled = true;
      reject(error);
    };
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
        String(Math.ceil(timeoutMs / 1_000)),
        "--max-filesize",
        String(remainingBytes),
        "--user-agent",
        "game-agent-asset-research/1.0 (bounded Batch 003 gap acquisition)",
        "--output",
        "-",
        "--write-out",
        "%{stderr}\n__CURL_META__%{url_effective}\t%{http_code}\t%{size_download}\n",
        url,
      ],
      { shell: false, windowsHide: true },
    );
    const processTimer = setTimeout(() => {
      timerFailure = true;
      child.kill();
    }, timeoutMs + 5_000);
    child.stdout.on("data", (chunk: Buffer) => {
      receivedBytes += chunk.byteLength;
      if (receivedBytes > remainingBytes) {
        capFailure = new Error(
          `response crossed remaining byte cap ${remainingBytes}`,
        );
        child.kill();
        return;
      }
      chunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 65_536) stderr += chunk.toString("utf8");
    });
    child.on("error", (error) => {
      clearTimeout(processTimer);
      finishReject(error);
    });
    child.on("close", (code) => {
      clearTimeout(processTimer);
      if (capFailure !== undefined) return finishReject(capFailure);
      if (timerFailure) {
        return finishReject(
          new Error(`curl process exceeded total timeout ${timeoutMs} ms`),
        );
      }
      if (code !== 0) {
        const safeError = stderr
          .replace(/__CURL_META__[\s\S]*$/, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 1_000);
        return finishReject(
          new Error(`curl exited ${code}${safeError ? `: ${safeError}` : ""}`),
        );
      }
      const meta = stderr.match(/__CURL_META__([^\t\r\n]+)\t(\d{3})\t(\d+)/);
      if (meta === null) {
        return finishReject(
          new Error("curl did not emit bounded response metadata"),
        );
      }
      const responseUrl = meta[1] ?? "";
      const status = Number(meta[2]);
      const reportedBytes = Number(meta[3]);
      try {
        assertAllowedUrl(responseUrl, "response");
      } catch (error) {
        return finishReject(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
      if (status < 200 || status >= 300) {
        return finishReject(new Error(`GET ${url} failed with HTTP ${status}`));
      }
      if (reportedBytes !== receivedBytes) {
        return finishReject(
          new Error(
            `curl byte evidence mismatch: ${reportedBytes} versus ${receivedBytes}`,
          ),
        );
      }
      settled = true;
      resolve({
        body: new Uint8Array(Buffer.concat(chunks, receivedBytes)),
        responseUrl,
      });
    });
  });
};

const extractAssetUrl = (
  html: string,
  pageUrl: string,
  label: string,
): string => {
  const anchors = [
    ...html.matchAll(
      /<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi,
    ),
  ];
  const target = normalizedLabel(label);
  for (const match of anchors) {
    if (normalizedLabel(plainText(match[3] ?? "")) === target) {
      return new URL(decodeHtml(match[1] ?? match[2] ?? ""), pageUrl).href;
    }
  }
  const stem = target.replace(/\.[^.]+$/, "");
  for (const match of anchors) {
    const resolved = new URL(decodeHtml(match[1] ?? match[2] ?? ""), pageUrl);
    const basename = normalizedLabel(
      decodeURIComponent(resolved.pathname.split("/").at(-1) ?? ""),
    ).replace(/_\d+(?=\.[^.]+$)/, "");
    if (basename.includes(stem)) return resolved.href;
  }
  throw new Error(`could not locate fixed asset link ${label} on ${pageUrl}`);
};

const safeOutputName = (sourceId: string, label: string): string => {
  const extension = path.extname(label).toLowerCase();
  const basename = path
    .basename(label, path.extname(label))
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${sourceId}--${basename}${extension}`;
};

const assertMagic = (label: string, body: Uint8Array): void => {
  const extension = path.extname(label).toLowerCase();
  const isPng =
    body.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (byte, index) => body[index] === byte,
    );
  const isZip = body.length >= 4 && body[0] === 80 && body[1] === 75;
  if ((extension === ".png" && !isPng) || (extension === ".zip" && !isZip)) {
    throw new Error(`${label} response does not match its fixed file type`);
  }
};

const recordEvent = async (event: Record<string, unknown>): Promise<void> => {
  await appendFile(
    eventsPath,
    `${JSON.stringify({ attemptRunId, at: new Date().toISOString(), ...event })}\n`,
    "utf8",
  );
};

const sleep = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const main = async (): Promise<void> => {
  const assets = sources.flatMap((source) => source.assets);
  if (
    sources.length !== expectedSourceCount ||
    assets.length !== expectedAssetCount ||
    1 + sources.length + assets.length !== expectedLogicalGetCount
  ) {
    throw new Error("incremental plan no longer matches the fixed proposal");
  }
  const expectedAssetBytes = assets.reduce(
    (total, asset) => total + asset.expectedBytes,
    0,
  );
  if (
    expectedAssetBytes > assetHardStopBytes ||
    previousDownloadedBytes + expectedAssetBytes > combinedAssetHardStopBytes
  ) {
    throw new Error("fixed expected bytes exceed an acquisition cap");
  }

  await mkdir(downloadsRoot, { recursive: true });
  await recordEvent({
    event: "attempt-start",
    expectedLogicalGetCount,
    expectedAssetBytes,
  });
  let logicalGetNumber = 1;
  let pageBytes = 0;
  const requestEvidence: Array<Record<string, unknown>> = [];
  const robotsUrl = "https://opengameart.org/robots.txt";
  await recordEvent({
    event: "request-start",
    logicalGetNumber,
    kind: "robots",
    requestedUrl: robotsUrl,
  });
  const robotsResponse = await fetchChecked(
    robotsUrl,
    pageTimeoutMs,
    1_000_000,
  );
  const robotsBody = robotsResponse.body;
  const robotsText = new TextDecoder().decode(robotsBody);
  if (
    /User-agent:\s*\*[\s\S]*?Disallow:\s*\/\s*(?:\r?\n|$)/i.test(robotsText)
  ) {
    throw new Error("OpenGameArt robots policy disallows the acquisition");
  }
  await recordEvent({
    event: "request-complete",
    logicalGetNumber,
    kind: "robots",
    responseUrl: robotsResponse.responseUrl,
    bytes: robotsBody.byteLength,
    sha256: sha256(robotsBody),
  });

  const pages = new Map<string, { html: string; responseUrl: string }>();
  for (const source of sources) {
    logicalGetNumber += 1;
    await recordEvent({
      event: "request-start",
      logicalGetNumber,
      kind: "source-page",
      sourceId: source.id,
      requestedUrl: source.pageUrl,
    });
    process.stdout.write(
      `[${logicalGetNumber}/${expectedLogicalGetCount}] page ${source.id}\n`,
    );
    const response = await fetchChecked(
      source.pageUrl,
      pageTimeoutMs,
      perPageHardStopBytes,
    );
    const body = response.body;
    pageBytes += body.byteLength;
    if (pageBytes > pageHardStopBytes) {
      throw new Error(`source pages crossed ${pageHardStopBytes} bytes`);
    }
    const html = new TextDecoder().decode(body);
    const text = plainText(html);
    if (!text.includes(source.author)) {
      throw new Error(`${source.id} page no longer names ${source.author}`);
    }
    if (!/\bCC0\b|Creative Commons Zero/i.test(text)) {
      throw new Error(`${source.id} page no longer proves CC0`);
    }
    for (const asset of source.assets) {
      extractAssetUrl(html, response.responseUrl, asset.label);
    }
    pages.set(source.id, { html, responseUrl: response.responseUrl });
    const digest = sha256(body);
    requestEvidence.push({
      logicalGetNumber,
      kind: "source-page",
      sourceId: source.id,
      sourcePage: source.pageUrl,
      author: source.author,
      license: "CC0-1.0",
      responseUrl: response.responseUrl,
      bytes: body.byteLength,
      sha256: digest,
    });
    await recordEvent({
      event: "request-complete",
      logicalGetNumber,
      kind: "source-page",
      sourceId: source.id,
      bytes: body.byteLength,
      sha256: digest,
    });
  }

  let assetBytes = 0;
  let previousAssetStart = 0;
  for (const source of sources) {
    const page = pages.get(source.id);
    if (page === undefined)
      throw new Error(`missing page evidence: ${source.id}`);
    for (const asset of source.assets) {
      if (assetBytes + asset.expectedBytes > assetHardStopBytes) {
        throw new Error(`${asset.label} would cross the fixed asset cap`);
      }
      const elapsed = Date.now() - previousAssetStart;
      if (previousAssetStart !== 0 && elapsed < spacingMs) {
        await sleep(spacingMs - elapsed);
      }
      const assetUrl = extractAssetUrl(
        page.html,
        page.responseUrl,
        asset.label,
      );
      assertAllowedUrl(assetUrl, `asset ${asset.label}`);
      previousAssetStart = Date.now();
      logicalGetNumber += 1;
      await recordEvent({
        event: "request-start",
        logicalGetNumber,
        kind: "asset-file",
        sourceId: source.id,
        label: asset.label,
        requestedUrl: assetUrl,
      });
      process.stdout.write(
        `[${logicalGetNumber}/${expectedLogicalGetCount}] asset ${source.id}/${asset.label}\n`,
      );
      const response = await fetchChecked(
        assetUrl,
        assetTimeoutMs,
        assetHardStopBytes - assetBytes,
      );
      const body = response.body;
      assertMagic(asset.label, body);
      assetBytes += body.byteLength;
      if (previousDownloadedBytes + assetBytes > combinedAssetHardStopBytes) {
        throw new Error("combined Batch 003 asset bytes crossed the fixed cap");
      }
      const outputPath = path.join(
        downloadsRoot,
        safeOutputName(source.id, asset.label),
      );
      await writeFile(outputPath, body, { flag: "wx" });
      const digest = sha256(body);
      requestEvidence.push({
        logicalGetNumber,
        kind: "asset-file",
        sourceId: source.id,
        sourcePage: source.pageUrl,
        author: source.author,
        license: "CC0-1.0",
        label: asset.label,
        requestedUrl: assetUrl,
        responseUrl: response.responseUrl,
        expectedBytes: asset.expectedBytes,
        bytes: body.byteLength,
        sha256: digest,
        outputPath: path.relative(outputRoot, outputPath).replaceAll("\\", "/"),
      });
      await recordEvent({
        event: "request-complete",
        logicalGetNumber,
        kind: "asset-file",
        sourceId: source.id,
        label: asset.label,
        bytes: body.byteLength,
        sha256: digest,
      });
    }
  }

  if (logicalGetNumber !== expectedLogicalGetCount) {
    throw new Error(
      `completed ${logicalGetNumber} GETs instead of ${expectedLogicalGetCount}`,
    );
  }
  const manifest = {
    schemaVersion: "1.0.0",
    batchId: "003-gap-increment",
    attemptRunId,
    status: "downloaded-uninspected",
    proposal: "docs/ASSET_BATCH_003_PROPOSAL.md",
    limits: {
      logicalGetCount: expectedLogicalGetCount,
      pageHardStopBytes,
      perPageHardStopBytes,
      assetHardStopBytes,
      combinedAssetHardStopBytes,
      expandedWorkspaceHardStopBytes: 150_000_000,
      permanentCandidateHardStopBytes: 20_000_000,
      spacingMs,
      pageTimeoutMs,
      assetTimeoutMs,
      transport: "curl.exe 8.14.1",
    },
    actual: {
      logicalGetCount: logicalGetNumber,
      sourcePageCount: sources.length,
      archiveCount: assets.filter((asset) => asset.label.endsWith(".zip"))
        .length,
      directPngCount: assets.filter((asset) => asset.label.endsWith(".png"))
        .length,
      pageBytes,
      assetBytes,
      combinedAssetBytes: previousDownloadedBytes + assetBytes,
    },
    requests: requestEvidence,
  };
  await writeFile(
    path.join(outputRoot, "download-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx" },
  );
  await recordEvent({
    event: "attempt-complete",
    logicalGetCount: logicalGetNumber,
    pageBytes,
    assetBytes,
  });
  process.stdout.write(
    `Batch 003 gap acquisition complete: ${assetBytes} asset bytes.\n`,
  );
};

await main().catch(async (error: unknown) => {
  await mkdir(outputRoot, { recursive: true });
  await recordEvent({
    event: "attempt-failed",
    error: error instanceof Error ? error.message : String(error),
  });
  throw error;
});
