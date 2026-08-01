import { z } from "zod";

/**
 * deepseek-cost-policy — the single, reproducible conservative cost basis for
 * DeepSeek model calls (batch prompt §三).
 *
 * A provider that does not return a settled charge does NOT mean the call was
 * free. Recording `cost: 0` for such a call is false evidence and silently
 * defeats any maxCost budget gate. This module derives a CONSERVATIVE UPPER
 * BOUND from the provider's reported token usage, using the same offline pricing
 * constants the natural-language probe already records (see
 * scripts/run-natural-language-probe.ts). It never reaches the network and never
 * installs a dependency: the price table below is a checked-in snapshot with an
 * explicit source + checkedAt so any estimate is fully reproducible.
 *
 * When token usage is itself absent, the cost is genuinely UNKNOWN — we say so
 * explicitly rather than pretending it is zero, and downstream budgeting must
 * refuse to claim a maxCost ceiling was verified.
 */

export const DEEPSEEK_COST_POLICY_VERSION = "2026-07-16" as const;

/**
 * Offline DeepSeek price snapshot. Values mirror the probe's constants so both
 * paths quote the same reproducible basis. USD per one million tokens.
 */
export const DEEPSEEK_PRICING = {
  cacheHitInputUsdPerMillionTokens: 0.0028,
  cacheMissInputUsdPerMillionTokens: 0.14,
  outputUsdPerMillionTokens: 0.28,
  /** A deliberately conservative CNY/USD rate for a CNY upper-bound quote. */
  conservativeCnyPerUsd: 7.5,
  source: "https://api-docs.deepseek.com/quick_start/pricing",
  checkedAt: DEEPSEEK_COST_POLICY_VERSION,
} as const;

/**
 * Conservative USD upper bound: charge every input token at the cache-MISS rate
 * (the most expensive input tier) plus every output token at the output rate.
 * This is intentionally an upper bound so a maxCost comparison never
 * under-reports the real charge.
 */
export function estimateDeepSeekCostUsd(
  inputTokens: number,
  outputTokens: number,
): number {
  return (
    (inputTokens * DEEPSEEK_PRICING.cacheMissInputUsdPerMillionTokens +
      outputTokens * DEEPSEEK_PRICING.outputUsdPerMillionTokens) /
    1_000_000
  );
}

/** The reproducible pricing basis attached to every estimated cost record. */
export const DeepSeekPricingBasisSchema = z.strictObject({
  input: z.literal("cache-miss upper estimate"),
  officialPriceCurrency: z.literal("USD"),
  cacheHitInputUsdPerMillionTokens: z.number().nonnegative(),
  cacheMissInputUsdPerMillionTokens: z.number().nonnegative(),
  outputUsdPerMillionTokens: z.number().nonnegative(),
  conservativeCnyPerUsd: z.number().positive(),
  source: z.string().min(1),
  checkedAt: z.string().min(1),
  policyVersion: z.string().min(1),
});
export type DeepSeekPricingBasis = z.infer<typeof DeepSeekPricingBasisSchema>;

export function deepSeekPricingBasis(): DeepSeekPricingBasis {
  return {
    input: "cache-miss upper estimate",
    officialPriceCurrency: "USD",
    cacheHitInputUsdPerMillionTokens:
      DEEPSEEK_PRICING.cacheHitInputUsdPerMillionTokens,
    cacheMissInputUsdPerMillionTokens:
      DEEPSEEK_PRICING.cacheMissInputUsdPerMillionTokens,
    outputUsdPerMillionTokens: DEEPSEEK_PRICING.outputUsdPerMillionTokens,
    conservativeCnyPerUsd: DEEPSEEK_PRICING.conservativeCnyPerUsd,
    source: DEEPSEEK_PRICING.source,
    checkedAt: DEEPSEEK_PRICING.checkedAt,
    policyVersion: DEEPSEEK_COST_POLICY_VERSION,
  };
}

/**
 * Structured cost evidence carried on a model call's usage. It is the
 * truth-bearing field for cost: `estimated` records the reproducible
 * conservative upper bound and its basis; `unknown` explicitly declares that no
 * cost could be derived (so no maxCost ceiling may be claimed as verified).
 */
export const CostEvidenceSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("estimated"),
    currency: z.literal("USD"),
    estimatedCostUsd: z.number().nonnegative(),
    estimatedCostCnyUpper: z.number().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    pricingBasis: DeepSeekPricingBasisSchema,
  }),
  z.strictObject({
    kind: z.literal("unknown"),
    currency: z.literal("USD"),
    reason: z.string().trim().min(1).max(300),
  }),
]);
export type CostEvidence = z.infer<typeof CostEvidenceSchema>;

/**
 * Build reproducible estimated cost evidence from reported token usage. The
 * numeric `estimatedCostUsd` is the conservative USD upper bound that a budget
 * gate compares against maxCost.
 */
export function buildEstimatedCostEvidence(
  inputTokens: number,
  outputTokens: number,
): Extract<CostEvidence, { kind: "estimated" }> {
  const estimatedCostUsd = estimateDeepSeekCostUsd(inputTokens, outputTokens);
  return {
    kind: "estimated",
    currency: "USD",
    estimatedCostUsd,
    estimatedCostCnyUpper:
      estimatedCostUsd * DEEPSEEK_PRICING.conservativeCnyPerUsd,
    inputTokens,
    outputTokens,
    pricingBasis: deepSeekPricingBasis(),
  };
}

/** Explicit unknown-cost evidence (never a silent zero). */
export function buildUnknownCostEvidence(
  reason: string,
): Extract<CostEvidence, { kind: "unknown" }> {
  return { kind: "unknown", currency: "USD", reason };
}
