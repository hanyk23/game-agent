import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

export type DirectoryDigest = Readonly<{
  sha256: string;
  fileCount: number;
  totalBytes: number;
}>;

export async function sha256File(filePath: string): Promise<string> {
  const stats = await lstat(filePath);
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(`artifact is not a regular file: ${filePath}`);
  }
  return createHash("sha256")
    .update(await readFile(filePath))
    .digest("hex");
}

async function collectRegularFiles(
  directory: string,
  relativeDirectory = "",
): Promise<string[]> {
  const entries = await readdir(path.join(directory, relativeDirectory), {
    withFileTypes: true,
  });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(
        `artifact directory contains a symbolic link: ${relativePath}`,
      );
    }
    if (entry.isDirectory()) {
      files.push(...(await collectRegularFiles(directory, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(
        `artifact directory contains a non-regular entry: ${relativePath}`,
      );
    }
  }

  return files;
}

export async function digestDirectory(
  directory: string,
): Promise<DirectoryDigest> {
  const stats = await lstat(directory);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error(`artifact is not a regular directory: ${directory}`);
  }

  const relativePaths = await collectRegularFiles(directory);
  if (relativePaths.length === 0) {
    throw new Error(`artifact directory is empty: ${directory}`);
  }

  const hash = createHash("sha256");
  let totalBytes = 0;
  for (const relativePath of relativePaths) {
    const contents = await readFile(path.join(directory, relativePath));
    const normalizedPath = relativePath.replaceAll("\\", "/");
    totalBytes += contents.byteLength;
    hash.update(normalizedPath);
    hash.update("\0");
    hash.update(String(contents.byteLength));
    hash.update("\0");
    hash.update(contents);
    hash.update("\0");
  }

  return {
    sha256: hash.digest("hex"),
    fileCount: relativePaths.length,
    totalBytes,
  };
}
