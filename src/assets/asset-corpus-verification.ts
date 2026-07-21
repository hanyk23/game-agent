import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { parseAssetCatalog, type AssetCatalog } from "./asset-catalog.js";
import { readPngTechnicalMetadata } from "./png-metadata.js";

export type AssetCorpusVerificationIssue = Readonly<{
  path: string;
  reason: string;
}>;

export type AssetCorpusVerificationResult = Readonly<{
  ok: boolean;
  verifiedFiles: number;
  corpusBytes: number;
  issues: readonly AssetCorpusVerificationIssue[];
}>;

async function sumRegularFileBytes(directory: string): Promise<number> {
  let total = 0;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      total += await sumRegularFileBytes(path);
    } else if (entry.isFile()) {
      total += (await stat(path)).size;
    }
  }
  return total;
}

function resolveInsideCorpus(corpusRoot: string, catalogPath: string): string {
  const root = resolve(corpusRoot);
  const target = resolve(root, ...catalogPath.split("/"));
  const fromRoot = relative(root, target);
  if (
    fromRoot === "" ||
    isAbsolute(fromRoot) ||
    fromRoot === ".." ||
    fromRoot.startsWith(`..${sep}`)
  ) {
    throw new Error("catalog path escapes the corpus root");
  }
  return target;
}

async function verifyCatalogFile(
  corpusRoot: string,
  file: AssetCatalog["records"][number]["sourceFile"],
): Promise<AssetCorpusVerificationIssue[]> {
  const issues: AssetCorpusVerificationIssue[] = [];
  let path: string;
  try {
    path = resolveInsideCorpus(corpusRoot, file.path);
  } catch (error) {
    return [{ path: file.path, reason: (error as Error).message }];
  }

  let bytes: Buffer;
  try {
    const details = await stat(path);
    if (!details.isFile()) {
      return [{ path: file.path, reason: "not-a-regular-file" }];
    }
    bytes = await readFile(path);
  } catch (error) {
    return [
      {
        path: file.path,
        reason: `file-read-failed:${(error as NodeJS.ErrnoException).code ?? "unknown"}`,
      },
    ];
  }

  if (bytes.length !== file.byteSize) {
    issues.push({ path: file.path, reason: "byte-size-mismatch" });
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== file.sha256) {
    issues.push({ path: file.path, reason: "sha256-mismatch" });
  }

  if (file.format !== "png") {
    issues.push({ path: file.path, reason: "technical-format-not-supported" });
    return issues;
  }
  try {
    const metadata = readPngTechnicalMetadata(bytes);
    if (metadata.width !== file.width || metadata.height !== file.height) {
      issues.push({ path: file.path, reason: "dimensions-mismatch" });
    }
    if (metadata.hasTransparency !== file.hasTransparency) {
      issues.push({ path: file.path, reason: "transparency-mismatch" });
    }
  } catch (error) {
    issues.push({
      path: file.path,
      reason: `png-verification-failed:${(error as Error).message}`,
    });
  }
  return issues;
}

export async function verifyAssetCorpus(
  corpusRoot: string,
  rawCatalog: unknown,
  diskCapBytes: number,
): Promise<AssetCorpusVerificationResult> {
  if (!Number.isSafeInteger(diskCapBytes) || diskCapBytes < 1) {
    throw new Error("diskCapBytes must be a positive safe integer");
  }
  const catalog = parseAssetCatalog(rawCatalog);
  const issues: AssetCorpusVerificationIssue[] = [];
  let verifiedFiles = 0;

  for (const record of catalog.records) {
    const files = [record.sourceFile, ...record.derivedFiles];
    for (const file of files) {
      const fileIssues = await verifyCatalogFile(corpusRoot, file);
      issues.push(...fileIssues);
      if (fileIssues.length === 0) {
        verifiedFiles += 1;
      }
    }
  }

  const corpusBytes = await sumRegularFileBytes(resolve(corpusRoot));
  if (corpusBytes > diskCapBytes) {
    issues.push({ path: ".", reason: "disk-cap-exceeded" });
  }
  return {
    ok: issues.length === 0,
    verifiedFiles,
    corpusBytes,
    issues,
  };
}
