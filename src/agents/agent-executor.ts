import type {
  AgentArtifactRef,
  AgentBudget,
  AgentInvocation,
  AgentModelCall,
  AgentRole,
  AgentToolCategory,
} from "./agent-envelope.js";

/**
 * agent-executor — the six model-backed Agent seams the Orchestrator invokes.
 *
 * Each executor is a dependency-injected async function, mirroring the pattern
 * already proven in run-spec-stage.ts (`deps.analyze`). Production wiring passes
 * a closure over a model client (e.g. analyzeRequirementWithMetadata(client,…));
 * unit tests pass a deterministic stub. Keeping the executor a *dependency* is
 * what keeps the Orchestrator model-free: the Orchestrator only calls executors,
 * validates their output, checks reference integrity, records hashes/budget, and
 * advances or rejects state. It never designs, selects modules, writes code,
 * plans verification, or diagnoses on the Agent's behalf.
 *
 * Wiring status: these are the frozen seam types. The concrete production
 * executors (except the pre-existing Spec analyzer closure) are NOT yet
 * implemented, and none is threaded into the full pipeline. That is intentional
 * for this round and reported as incomplete rather than presented as done.
 */

/** Common context every executor receives from the Orchestrator. */
export type AgentExecutionContext = Readonly<{
  invocationId: string;
  attempt: number;
  /** Hash-bound inputs the Orchestrator resolved for this stage. */
  inputs: readonly AgentArtifactRef[];
  budget: AgentBudget;
  /** Injected clock so tests stay deterministic. */
  now: () => Date;
}>;

/**
 * The value a model-backed executor returns for a successful call. The
 * Orchestrator turns this into a validated {@link AgentInvocation} record; the
 * executor itself only reports what it produced, the model provenance, and the
 * deterministic tools it drove — it does NOT advance state.
 */
export type AgentExecutorSuccess<Artifact> = Readonly<{
  status: "succeeded";
  /** The in-memory artifact the Agent produced (Orchestrator hashes it). */
  artifact: Artifact;
  /** Contract name of the artifact (e.g. "GameSpec", "VerificationPlan"). */
  kind: string;
  modelCall: AgentModelCall;
  tools: readonly AgentToolCategory[];
  provenanceNotes?: readonly string[];
}>;

export type AgentExecutorFailure = Readonly<{
  status: "failed";
  name: string;
  message: string;
  code?: string;
  retryable: boolean;
  /** Provenance even on failure: which model was consulted, at what cost. */
  modelCall: AgentModelCall;
  tools?: readonly AgentToolCategory[];
}>;

export type AgentExecutorResult<Artifact> =
  AgentExecutorSuccess<Artifact> | AgentExecutorFailure;

/**
 * The generic executor shape. `Input` is the fully-typed, already-validated
 * upstream artifact(s) the Agent reasons over; `Artifact` is what it produces.
 */
export type AgentExecutor<Input, Artifact> = (
  input: Input,
  context: AgentExecutionContext,
) => Promise<AgentExecutorResult<Artifact>>;

// ---------------------------------------------------------------------------
// Role-specific executor seams.
//
// Inputs/outputs are declared as opaque `unknown`-typed contract slots on
// purpose: this module freezes the *envelope and invocation* contract without
// coupling to each downstream artifact schema, which land as their consumers
// migrate. Concrete stage wiring will refine these generics with the real
// GameSpec / GameDesign / ModuleAssembly / CandidateAssembly / VerificationPlan
// / RepairDiagnosis types once each seam is threaded in.
// ---------------------------------------------------------------------------

/** Request → GameSpec. The one seam with a working production closure today. */
export type SpecAgentExecutor<
  Request = unknown,
  GameSpec = unknown,
> = AgentExecutor<Request, GameSpec>;

/** GameSpec → GameDesign. Design Agent produces data only; never code. */
export type DesignAgentExecutor<
  GameSpec = unknown,
  GameDesign = unknown,
> = AgentExecutor<GameSpec, GameDesign>;

/** GameDesign → ModuleAssembly. Selects admitted modules from the registry. */
export type ModuleAgentExecutor<
  DesignInput = unknown,
  ModuleAssembly = unknown,
> = AgentExecutor<DesignInput, ModuleAssembly>;

/**
 * ModuleAssembly → CandidateAssembly. The ONLY Agent permitted to write
 * candidate game code, always inside a sandboxed workspace the Orchestrator
 * later re-validates against the allowlist and hashes.
 */
export type CodeAgentExecutor<
  AssemblyInput = unknown,
  CandidateAssembly = unknown,
> = AgentExecutor<AssemblyInput, CandidateAssembly>;

/**
 * (GameSpec, GameDesign, ModuleAssembly, CandidateAssembly) → VerificationPlan.
 * The Verifier Agent uses a model to understand THIS game and emit a strict,
 * hash-referencing plan. It never signs off directly: a deterministic runner
 * executes the plan, and the Orchestrator approves or rejects on the evidence.
 */
export type VerifierAgentExecutor<
  VerifierInput = unknown,
  VerificationPlan = unknown,
> = AgentExecutor<VerifierInput, VerificationPlan>;

/**
 * VerificationEvidence → RepairDiagnosis. The Repair Agent only diagnoses; the
 * diagnosis carries findings/root-cause/targets/invariants but NO applicable
 * raw patches. Turning a diagnosis into a code change is the Code Agent's job.
 */
export type RepairAgentExecutor<
  EvidenceInput = unknown,
  RepairDiagnosis = unknown,
> = AgentExecutor<EvidenceInput, RepairDiagnosis>;

/**
 * The full set of production executors the Orchestrator depends on. Wiring
 * injects real, model-backed executors here; tests inject deterministic stubs.
 * The model client lives inside these closures, never inside the Orchestrator.
 */
export type AgentExecutorRegistry = Readonly<{
  spec: SpecAgentExecutor;
  design: DesignAgentExecutor;
  module: ModuleAgentExecutor;
  code: CodeAgentExecutor;
  verifier: VerifierAgentExecutor;
  repair: RepairAgentExecutor;
}>;

/** Map an executor result's role/kind pairing for the invocation record. */
export type AgentInvocationDraft = Readonly<{
  role: AgentRole;
  invocation: AgentInvocation;
}>;

export type { AgentInvocation };
