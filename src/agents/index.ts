/**
 * src/agents — the frozen, unified Agent seam contract.
 *
 * See agent-envelope.ts for the design constraints. This barrel re-exports the
 * pure-data contract (envelope, invocation, model-call, failure), the six
 * model-backed executor seams, and the Orchestrator-side runner that validates
 * one executor call into a hash-bound invocation record.
 *
 * Nothing here calls a model or advances pipeline state; the Orchestrator uses
 * these to validate, account for, and either advance or reject an Agent's work.
 */
export * from "./agent-envelope.js";
export * from "./agent-executor.js";
export * from "./run-agent-invocation.js";
