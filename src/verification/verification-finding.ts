import { createHash, randomUUID } from "node:crypto";

import { z } from "zod";

const RelativeRunPathSchema = z
  .string()
  .min(1)
  .max(300)
  .superRefine((value, context) => {
    const normalized = value.replaceAll("\\", "/");
    if (
      normalized.startsWith("/") ||
      /^[a-zA-Z]:/.test(normalized) ||
      normalized.split("/").includes("..")
    ) {
      context.addIssue({
        code: "custom",
        message: "finding paths must remain relative to the run directory",
      });
    }
  });

export const VerificationFindingSchema = z.strictObject({
  findingVersion: z.literal("1.0.0"),
  id: z.string().uuid(),
  gate: z.enum(["build", "runtime", "play", "visual"]),
  severity: z.enum(["error", "warning"]),
  code: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  message: z.string().min(1).max(500),
  suspectedFiles: z.array(RelativeRunPathSchema).min(1).max(6),
  evidence: z.strictObject({
    reportPath: RelativeRunPathSchema,
    caseName: z.enum(["desktop", "mobile"]).optional(),
  }),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
});

export type VerificationFinding = z.infer<typeof VerificationFindingSchema>;

export function createVerificationFinding(input: {
  gate: VerificationFinding["gate"];
  severity?: VerificationFinding["severity"];
  code: string;
  message: string;
  suspectedFiles: readonly string[];
  reportPath: string;
  caseName?: "desktop" | "mobile";
  id?: string;
}): VerificationFinding {
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        gate: input.gate,
        code: input.code,
        message: input.message,
        suspectedFiles: input.suspectedFiles,
      }),
    )
    .digest("hex");
  return VerificationFindingSchema.parse({
    findingVersion: "1.0.0",
    id: input.id ?? randomUUID(),
    gate: input.gate,
    severity: input.severity ?? "error",
    code: input.code,
    message: input.message,
    suspectedFiles: [...input.suspectedFiles],
    evidence: {
      reportPath: input.reportPath,
      ...(input.caseName === undefined ? {} : { caseName: input.caseName }),
    },
    fingerprint,
  });
}
