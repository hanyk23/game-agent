import { createHash } from "node:crypto";
import * as ts from "typescript";

export type ExecutableExportKind =
  | "lifecycle-create-v1"
  | "contact-policy-transform-v1"
  | "pickup-effect-plan-transform-v1";

export type ExecutableArtifactHandle = Readonly<{
  implementationId: string;
  exportName: string;
  exportKind: ExecutableExportKind;
  sourceBundleSha256: string;
  outputBundleSha256: string;
  manifestSha256: string;
  dependencyLockSha256: string;
  toolchainIdentitySha256: string;
  loadedExport: (...args: readonly unknown[]) => unknown;
}>;

const validHandles = new WeakSet<object>();
const idPattern = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const exportPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const forbiddenSource: readonly Readonly<{
  pattern: RegExp;
  reason: string;
}>[] = Object.freeze([
  {
    pattern: /\bimport\s*(?:\(|[{'"*])/u,
    reason: "imports are not self-contained",
  },
  {
    pattern: /\brequire\s*\(/u,
    reason: "CommonJS package resolution is forbidden",
  },
  {
    pattern: /\b(?:eval|Function)\s*\(/u,
    reason: "dynamic evaluation is forbidden",
  },
  {
    pattern:
      /\b(?:process|globalThis|window|document|fetch|XMLHttpRequest|WebSocket|Worker|WebAssembly)\b/u,
    reason: "ambient authority is forbidden",
  },
  {
    pattern:
      /\b(?:setTimeout|setInterval|queueMicrotask|addEventListener)\s*\(/u,
    reason: "top-level side-effect authority is forbidden",
  },
  {
    pattern: /\b(?:node:|fs|child_process|net|http|https|dns|tls|dgram)\b/u,
    reason: "Node/network authority is forbidden",
  },
]);

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertCanonicalId(value: string, field: string): void {
  if (!idPattern.test(value)) throw new Error(`invalid ${field}: ${value}`);
}

function isPureConstant(node: ts.Expression): boolean {
  if (
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword
  )
    return true;
  if (ts.isPrefixUnaryExpression(node)) return isPureConstant(node.operand);
  if (ts.isArrayLiteralExpression(node))
    return node.elements.every(
      (entry) => ts.isExpression(entry) && isPureConstant(entry),
    );
  if (ts.isObjectLiteralExpression(node))
    return node.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) &&
        isPureConstant(property.initializer),
    );
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText() === "Object" &&
    node.expression.name.text === "freeze"
  )
    return node.arguments.every(isPureConstant);
  return false;
}

function assertSideEffectFreeModule(source: string): void {
  const file = ts.createSourceFile(
    "admitted.mjs",
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  for (const statement of file.statements) {
    if (
      ts.isFunctionDeclaration(statement) ||
      (ts.isExpressionStatement(statement) &&
        ts.isStringLiteral(statement.expression))
    )
      continue;
    if (
      ts.isVariableStatement(statement) &&
      statement.declarationList.declarations.every(
        (declaration) =>
          declaration.initializer !== undefined &&
          isPureConstant(declaration.initializer),
      )
    )
      continue;
    throw new Error(
      `top-level executable statement is forbidden: ${ts.SyntaxKind[statement.kind]}`,
    );
  }
}

/** Node-only loader for ABI26-LOAD-001. It evaluates the exact scanned bytes. */
export class TrustedGameModuleExecutableLoader {
  async admit(
    input: Readonly<{
      generatedOutput: Uint8Array;
      expectedOutputSha256: string;
      implementationId: string;
      exportName: string;
      exportKind: ExecutableExportKind;
      sourceBundleSha256: string;
      manifestSha256: string;
      dependencyLockSha256: string;
      toolchainIdentitySha256: string;
    }>,
  ): Promise<ExecutableArtifactHandle> {
    assertCanonicalId(input.implementationId, "implementationId");
    if (!exportPattern.test(input.exportName))
      throw new Error("invalid exportName");
    const bytes = Uint8Array.from(input.generatedOutput);
    if (bytes.byteLength === 0)
      throw new Error("generated output must not be empty");
    const outputBundleSha256 = sha256(bytes);
    if (outputBundleSha256 !== input.expectedOutputSha256) {
      throw new Error("generated output byte drift");
    }
    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    for (const rule of forbiddenSource) {
      if (rule.pattern.test(source)) throw new Error(rule.reason);
    }
    assertSideEffectFreeModule(source);
    const beforeKeys = Reflect.ownKeys(globalThis);
    const specifier = `data:text/javascript;base64,${Buffer.from(bytes).toString("base64")}#${outputBundleSha256}`;
    const namespace = (await import(specifier)) as Record<string, unknown>;
    const afterKeys = Reflect.ownKeys(globalThis);
    if (
      beforeKeys.length !== afterKeys.length ||
      beforeKeys.some((key, index) => key !== afterKeys[index])
    ) {
      throw new Error("module evaluation changed the global registry");
    }
    const expectedExports = [input.exportName];
    const actualExports = Object.keys(namespace).sort();
    if (actualExports.length !== 1 || actualExports[0] !== expectedExports[0]) {
      throw new Error(
        `unexpected executable exports: ${actualExports.join(",")}`,
      );
    }
    const loadedExport = namespace[input.exportName];
    if (typeof loadedExport !== "function")
      throw new Error("declared executable export is not a function");
    const handle = Object.freeze({
      implementationId: input.implementationId,
      exportName: input.exportName,
      exportKind: input.exportKind,
      sourceBundleSha256: input.sourceBundleSha256,
      outputBundleSha256,
      manifestSha256: input.manifestSha256,
      dependencyLockSha256: input.dependencyLockSha256,
      toolchainIdentitySha256: input.toolchainIdentitySha256,
      loadedExport: loadedExport as (...args: readonly unknown[]) => unknown,
    });
    validHandles.add(handle);
    return handle;
  }
}

export function isLoaderMintedExecutableArtifactHandle(
  value: unknown,
): value is ExecutableArtifactHandle {
  return value !== null && typeof value === "object" && validHandles.has(value);
}
