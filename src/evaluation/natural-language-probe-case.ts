import { z } from "zod";

export const NATURAL_LANGUAGE_PROBE_CASE_FILES = [
  "natural-language-probe-v1.json",
  "natural-language-probe-v2.json",
] as const;

export const NATURAL_LANGUAGE_PROBE_CASE_PATHS = [
  "evals/cases/natural-language-probe-v1.json",
  "evals/cases/natural-language-probe-v2.json",
] as const;

export const NaturalLanguageProbeCaseFileSchema = z.enum(
  NATURAL_LANGUAGE_PROBE_CASE_FILES,
);
export const NaturalLanguageProbeCasePathSchema = z.enum(
  NATURAL_LANGUAGE_PROBE_CASE_PATHS,
);

export const NaturalLanguageProbeCaseSchema = z
  .object({
    caseVersion: z.literal("1.0.0"),
    caseId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    inputKind: z.literal("natural-language-request"),
    language: z.literal("zh-CN"),
    prompt: z.string().min(12).max(2_000),
    intendedChecks: z
      .array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
      .min(1),
  })
  .strict();

export type NaturalLanguageProbeCase = z.infer<
  typeof NaturalLanguageProbeCaseSchema
>;
export type NaturalLanguageProbeCaseFile = z.infer<
  typeof NaturalLanguageProbeCaseFileSchema
>;

export function naturalLanguageProbeCasePath(
  fileName: NaturalLanguageProbeCaseFile,
): `evals/cases/${NaturalLanguageProbeCaseFile}` {
  return `evals/cases/${fileName}`;
}

export function parseNaturalLanguageProbeCase(
  input: unknown,
): NaturalLanguageProbeCase {
  return NaturalLanguageProbeCaseSchema.parse(input);
}

export function preflightNaturalLanguageProbePrompt(prompt: string) {
  const normalized = prompt.normalize("NFKC");
  const unsafePatterns = [
    /```/u,
    /https?:\/\//iu,
    /\b(?:powershell|cmd\.exe|bash|curl|wget)\b/iu,
    /\b(?:api[_ -]?key|access[_ -]?token|password|credential)\b/iu,
    /(?:API\s*密钥|访问令牌|密码|凭据)/u,
  ];
  const unsafePatternCount = unsafePatterns.filter((pattern) =>
    pattern.test(normalized),
  ).length;
  return {
    promptCharacters: [...normalized].length,
    unsafePatternCount,
    status:
      unsafePatternCount === 0 ? ("passed" as const) : ("failed" as const),
  };
}
