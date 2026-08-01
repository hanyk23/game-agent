import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  AgentInvocationSchema,
  parseAgentInvocation,
  sha256Json,
  type AgentArtifactRef,
  type AgentBudget,
} from "../../src/agents/agent-envelope.js";
import type {
  AgentExecutionContext,
  SpecAgentExecutor,
} from "../../src/agents/agent-executor.js";
import { runAgentInvocation } from "../../src/agents/run-agent-invocation.js";

// Agent B — the unified, frozen Agent seam. These tests prove the contract is
// testable end-to-end WITHOUT threading a real model: a deterministic executor
// stub stands in for the production model-backed closure, exactly as the
// batch prompt requires ("production executor must be model-backed; tests allow
// a stub"). They also prove the Orchestrator-side runner is model-free and
// fails closed on invalid executor output.

const budget: AgentBudget = { maxAttempts: 2, maxCost: 1, maxTokens: 10_000 };

function fixedClock(): () => Date {
  const stamps = [
    new Date("2026-07-30T00:00:00.000Z"),
    new Date("2026-07-30T00:00:01.000Z"),
  ];
  let index = 0;
  return () => stamps[Math.min(index++, stamps.length - 1)]!;
}

const requestRef: AgentArtifactRef = {
  kind: "Request",
  sha256: "a".repeat(64),
};
const TestSpecSchema = z.strictObject({ title: z.string().min(1) });

describe("Agent envelope + invocation contract", () => {
  it("captures every required audit field on a successful invocation", async () => {
    // A deterministic Spec stub: production would close over a model client;
    // here we return a fixed artifact plus explicit "stub" model provenance.
    const specStub: SpecAgentExecutor<
      { prompt: string },
      { title: string }
    > = async (input, context: AgentExecutionContext) => {
      expect(context.inputs).toEqual([requestRef]);
      return {
        status: "succeeded",
        artifact: { title: `spec:${input.prompt}` },
        kind: "GameSpec",
        modelCall: {
          provider: "stub",
          model: "deterministic-spec",
          outputMode: "structured",
          usage: {
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
          },
        },
        tools: ["schema-validator"],
        provenanceNotes: ["stubbed for unit test"],
      };
    };

    const invocation = await runAgentInvocation({
      role: "spec",
      executor: specStub,
      input: { prompt: "白鹤对黑龙" },
      inputs: [requestRef],
      budget,
      parseArtifact: (value) => TestSpecSchema.parse(value),
      now: fixedClock(),
    });

    expect(invocation.role).toBe("spec");
    expect(invocation.attempt).toBe(1);
    expect(invocation.startedAt).toBe("2026-07-30T00:00:00.000Z");
    expect(invocation.completedAt).toBe("2026-07-30T00:00:01.000Z");
    expect(invocation.modelCall.provider).toBe("stub");
    expect(invocation.tools).toEqual(["schema-validator"]);
    expect(invocation.result.status).toBe("succeeded");
    if (invocation.result.status !== "succeeded") return;

    const output = invocation.result.output;
    expect(output.kind).toBe("GameSpec");
    // The output is hash-bound: recomputing the artifact hash must match.
    expect(output.sha256).toBe(sha256Json({ title: "spec:白鹤对黑龙" }).sha256);
    expect(output.producedBy.invocationId).toBe(invocation.invocationId);
    expect(output.producedBy.attempt).toBe(1);
    expect(output.provenance.inputs).toEqual([requestRef]);

    // The record round-trips through the strict schema.
    expect(() => parseAgentInvocation(invocation)).not.toThrow();
  });

  it("records a structured failure with model provenance instead of throwing", async () => {
    const failing: SpecAgentExecutor<
      { prompt: string },
      { title: string }
    > = async () => ({
      status: "failed",
      name: "RequirementAnalysisError",
      message: "request too short",
      retryable: false,
      modelCall: {
        provider: "stub",
        model: "deterministic-spec",
        usage: { cost: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0 },
      },
    });

    const invocation = await runAgentInvocation({
      role: "spec",
      executor: failing,
      input: { prompt: "x" },
      inputs: [requestRef],
      budget,
      parseArtifact: (value) => TestSpecSchema.parse(value),
      now: fixedClock(),
    });

    expect(invocation.result.status).toBe("failed");
    if (invocation.result.status !== "failed") return;
    expect(invocation.result.failure.name).toBe("RequirementAnalysisError");
    expect(invocation.result.failure.retryable).toBe(false);
  });

  it("converts a thrown executor error into a retryable structured failure", async () => {
    const throwing: SpecAgentExecutor<
      { prompt: string },
      { title: string }
    > = async () => {
      throw new Error("model client exploded");
    };

    const invocation = await runAgentInvocation({
      role: "spec",
      executor: throwing,
      input: { prompt: "x" },
      inputs: [requestRef],
      budget,
      parseArtifact: (value) => TestSpecSchema.parse(value),
      now: fixedClock(),
    });

    expect(invocation.result.status).toBe("failed");
    if (invocation.result.status !== "failed") return;
    expect(invocation.result.failure.retryable).toBe(false);
    expect(invocation.result.failure.message).toContain(
      "model client exploded",
    );
  });

  it("fails closed when an Agent returns an artifact outside its role schema", async () => {
    const invalid: SpecAgentExecutor<
      { prompt: string },
      { title: unknown }
    > = async () => ({
      status: "succeeded",
      artifact: { title: 42 },
      kind: "GameSpec",
      modelCall: {
        provider: "stub",
        model: "deterministic-spec",
        usage: {
          cost: 0,
          inputTokens: 0,
          outputTokens: 0,
          reasoningTokens: 0,
        },
      },
      tools: ["schema-validator"],
    });

    const invocation = await runAgentInvocation({
      role: "spec",
      executor: invalid,
      input: { prompt: "x" },
      inputs: [requestRef],
      budget,
      parseArtifact: (value) => TestSpecSchema.parse(value),
      now: fixedClock(),
    });

    expect(invocation.result.status).toBe("failed");
    if (invocation.result.status !== "failed") return;
    expect(invocation.result.failure.code).toBe("invalid_agent_artifact");
    expect(invocation.result.failure.retryable).toBe(false);
  });

  it("hashes semantically equal JSON independently of object key order", () => {
    expect(sha256Json({ b: 2, a: 1 })).toEqual(sha256Json({ a: 1, b: 2 }));
  });

  it("rejects an invocation whose attempt exceeds its budget", () => {
    expect(() =>
      AgentInvocationSchema.parse({
        invocationId: "00000000-0000-4000-8000-000000000000",
        role: "spec",
        attempt: 3,
        startedAt: "2026-07-30T00:00:00.000Z",
        completedAt: "2026-07-30T00:00:01.000Z",
        inputs: [requestRef],
        budget: { maxAttempts: 2 },
        tools: [],
        modelCall: {
          provider: "stub",
          model: "m",
          usage: {
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
          },
        },
        result: {
          status: "failed",
          failure: { name: "E", message: "m", retryable: true },
        },
      }),
    ).toThrow();
  });

  it("§三 rejects a maxCost-budgeted invocation whose cost is unknown", () => {
    // costKnown:false means the provider gave no settled charge and no basis to
    // estimate one; a maxCost ceiling can never be certified against it.
    expect(() =>
      AgentInvocationSchema.parse({
        invocationId: "00000000-0000-4000-8000-000000000000",
        role: "spec",
        attempt: 1,
        startedAt: "2026-07-30T00:00:00.000Z",
        completedAt: "2026-07-30T00:00:01.000Z",
        inputs: [requestRef],
        budget: { maxAttempts: 1, maxCost: 1 },
        tools: [],
        modelCall: {
          provider: "deepseek",
          model: "unknown",
          usage: {
            cost: 0,
            costKnown: false,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
          },
        },
        result: {
          status: "failed",
          failure: { name: "E", message: "m", retryable: true },
        },
      }),
    ).toThrow();
  });

  it("§三 accepts a known cost within a maxCost budget", () => {
    expect(() =>
      AgentInvocationSchema.parse({
        invocationId: "00000000-0000-4000-8000-000000000000",
        role: "spec",
        attempt: 1,
        startedAt: "2026-07-30T00:00:00.000Z",
        completedAt: "2026-07-30T00:00:01.000Z",
        inputs: [requestRef],
        budget: { maxAttempts: 1, maxCost: 1 },
        tools: [],
        modelCall: {
          provider: "deepseek",
          model: "deepseek-v4-flash",
          usage: {
            cost: 0.0001,
            costKnown: true,
            inputTokens: 100,
            outputTokens: 100,
            reasoningTokens: 0,
          },
        },
        result: {
          status: "failed",
          failure: { name: "E", message: "m", retryable: true },
        },
      }),
    ).not.toThrow();
  });

  it("rejects a success envelope attributed to a different invocation id", () => {
    expect(() =>
      AgentInvocationSchema.parse({
        invocationId: "00000000-0000-4000-8000-000000000000",
        role: "design",
        attempt: 1,
        startedAt: "2026-07-30T00:00:00.000Z",
        completedAt: "2026-07-30T00:00:01.000Z",
        inputs: [],
        budget: { maxAttempts: 1 },
        tools: [],
        modelCall: {
          provider: "stub",
          model: "m",
          usage: {
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
          },
        },
        result: {
          status: "succeeded",
          output: {
            role: "design",
            kind: "GameDesign",
            sha256: "b".repeat(64),
            bytes: 1,
            producedBy: {
              // Mismatched id → must be rejected.
              invocationId: "11111111-1111-4111-8111-111111111111",
              attempt: 1,
            },
            provenance: { inputs: [], tools: [], notes: [] },
          },
        },
      }),
    ).toThrow();
  });

  it("rejects a success envelope whose role disagrees with the invocation", () => {
    const id = "00000000-0000-4000-8000-000000000000";
    expect(() =>
      AgentInvocationSchema.parse({
        invocationId: id,
        role: "verifier",
        attempt: 1,
        startedAt: "2026-07-30T00:00:00.000Z",
        completedAt: "2026-07-30T00:00:01.000Z",
        inputs: [],
        budget: { maxAttempts: 1 },
        tools: ["browser-harness"],
        modelCall: {
          provider: "stub",
          model: "m",
          usage: {
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
          },
        },
        result: {
          status: "succeeded",
          output: {
            role: "code", // disagrees with invocation.role === "verifier"
            kind: "VerificationPlan",
            sha256: "c".repeat(64),
            bytes: 1,
            producedBy: { invocationId: id, attempt: 1 },
            provenance: { inputs: [], tools: [], notes: [] },
          },
        },
      }),
    ).toThrow();
  });

  it("compares timestamps by instant rather than ISO string order", () => {
    const id = "00000000-0000-4000-8000-000000000000";
    expect(() =>
      AgentInvocationSchema.parse({
        invocationId: id,
        role: "spec",
        attempt: 1,
        startedAt: "2026-07-30T08:00:00.000+08:00",
        completedAt: "2026-07-30T00:00:01.000Z",
        inputs: [],
        budget: { maxAttempts: 1 },
        tools: [],
        modelCall: {
          provider: "stub",
          model: "m",
          usage: {
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
          },
        },
        result: {
          status: "failed",
          failure: { name: "E", message: "m", retryable: false },
        },
      }),
    ).not.toThrow();
  });

  it("rejects provenance that disagrees with invocation inputs or tools", () => {
    const id = "00000000-0000-4000-8000-000000000000";
    expect(() =>
      AgentInvocationSchema.parse({
        invocationId: id,
        role: "spec",
        attempt: 1,
        startedAt: "2026-07-30T00:00:00.000Z",
        completedAt: "2026-07-30T00:00:01.000Z",
        inputs: [requestRef],
        budget: { maxAttempts: 1 },
        tools: ["schema-validator"],
        modelCall: {
          provider: "stub",
          model: "m",
          usage: {
            cost: 0,
            inputTokens: 0,
            outputTokens: 0,
            reasoningTokens: 0,
          },
        },
        result: {
          status: "succeeded",
          output: {
            role: "spec",
            kind: "GameSpec",
            sha256: "d".repeat(64),
            bytes: 1,
            producedBy: { invocationId: id, attempt: 1 },
            provenance: { inputs: [], tools: [], notes: [] },
          },
        },
      }),
    ).toThrow();
  });
});
