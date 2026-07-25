import { z } from "zod";

export const OpenCodeCompatibilityReportSchema = z.strictObject({
  checkedAt: z.iso.datetime({ offset: true }),
  sdkVersion: z.string().min(1),
  server: z.strictObject({
    started: z.boolean(),
    healthy: z.boolean(),
    version: z.string().min(1).nullable(),
    url: z.url().nullable(),
  }),
  session: z.strictObject({
    created: z.boolean(),
    sessionId: z.string().min(1).nullable(),
    aborted: z.boolean(),
  }),
  events: z.strictObject({
    subscribed: z.boolean(),
    capturedTypes: z.array(z.string()),
  }),
  structuredOutput: z.strictObject({
    status: z.enum(["passed", "failed", "skipped"]),
    model: z.string().min(1).nullable(),
    reason: z.string().min(1).nullable(),
  }),
  errors: z.array(z.string()),
});

export type OpenCodeCompatibilityReport = z.infer<
  typeof OpenCodeCompatibilityReportSchema
>;

export function parseModelReference(value: string): {
  providerID: string;
  modelID: string;
} {
  const separator = value.indexOf("/");
  if (separator <= 0 || separator === value.length - 1) {
    throw new Error("OPENCODE_MODEL must use the provider/model format");
  }
  return {
    providerID: value.slice(0, separator),
    modelID: value.slice(separator + 1),
  };
}
