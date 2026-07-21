# Batch 1 Runtime ABI 1.2 Implementation Specification

Status: implementation companion to accepted ADR 0026  
Version: 1.0.0  
Owner: `docs/decisions/0026-batch-1-runtime-abi-remediation.md`

This file assigns append-only child rule IDs before ABI 1.2 code changes. The
ADR remains authoritative. A row is complete only when its implementation and
both positive and rejection evidence exist; an incomplete cell is never gate evidence.

| Rule ID             | Public contract                     | Implementation owner                | Positive evidence                | Boundary evidence                      |
| ------------------- | ----------------------------------- | ----------------------------------- | -------------------------------- | -------------------------------------- |
| ABI26-VER-001.1     | Manifest 1.2                        | `game-module-contract.ts`           | ABI 1.2 contract tests           | legacy byte/version rejection tests    |
| ABI26-VER-001.2     | Assembly 1.1                        | `game-module-contract.ts`           | ABI 1.2 contract tests           | cross-version rejection tests          |
| ABI26-VER-001.3     | Graph 1.2 readiness                 | `game-module-resolver.ts`           | resolver readiness tests         | blocked graph tests                    |
| ABI26-LOAD-001.1    | loader-minted executable handle     | `game-module-executable-loader.ts`  | loader admission tests           | forged handle/function rejection       |
| ABI26-LOAD-001.2    | closure and side-effect admission   | `game-module-executable-loader.ts`  | pure closure test                | forbidden syntax/import tests          |
| ABI26-LOAD-001.3    | immutable catalog evidence          | `game-module-runtime-catalog.ts`    | catalog generation test          | drift/mutation/TOCTOU tests            |
| ABI26-MAN-001.1     | scoped dependencies                 | `game-module-contract.ts`, resolver | owner/assembly match tests       | optional ambiguity/cycle tests         |
| ABI26-MAN-001.2     | asset requirements                  | `game-module-contract.ts`, resolver | exact/optional asset tests       | mismatch/ambiguity tests               |
| ABI26-MAN-001.3     | runtime descriptor                  | `game-module-contract.ts`           | descriptor golden test           | duplicate/undeclared ID tests          |
| ABI26-MAN-001.4     | authoritative service identities    | `game-module-runtime-abi-v12.ts`    | identity table golden test       | collision/fallback rejection           |
| ABI26-ASSET-001.1   | strict asset bindings               | resolver                            | binding resolution tests         | evidence/sharing mismatch tests        |
| ABI26-ASSET-001.2   | host texture namespace              | `game-module-runtime-abi-v12.ts`    | derived key test                 | pre-existing key rejection             |
| ABI26-READY-001.1   | pure readiness report               | resolver                            | ready report test                | missing/mismatched executable tests    |
| ABI26-LIFE-001.1    | top-level transition guard          | `game-module-runtime-abi-v12.ts`    | lifecycle sequence test          | reentrancy-before-side-effect test     |
| ABI26-LIFE-001.2    | inherited event transaction         | `game-module-runtime-abi-v12.ts`    | nested ordered event test        | cycle/depth/reentry tests              |
| ABI26-LIFE-001.3    | terminal cleanup                    | `game-module-runtime-abi-v12.ts`    | clean destroy test               | primary/cleanup aggregation test       |
| ABI26-TIME-001.1    | deterministic module clock          | `game-module-runtime-abi-v12.ts`    | delta/pause/resume tests         | invalid delta rejection                |
| ABI26-UPD-001.1     | provider-first update               | `game-module-runtime-abi-v12.ts`    | order test                       | update terminal-failure test           |
| ABI26-STATE-001.1   | retained replay barrier             | `game-module-runtime-abi-v12.ts`    | replay-before-start test         | start publication/side-effect tests    |
| ABI26-PHASE-001.1   | service permission matrix           | `game-module-runtime-abi-v12.ts`    | every allowed cell test          | every forbidden cell test              |
| ABI26-LEASE-001.1   | host-owned lease accounting         | `game-module-runtime-abi-v12.ts`    | exact zero-residue test          | undeclared/one-over tests              |
| ABI26-TIMER-001.1   | exact host timer slots              | `game-module-runtime-abi-v12.ts`    | zero/exact/reuse tests           | one-over test                          |
| ABI26-TIMER-001.2   | timer mode semantics                | `game-module-runtime-abi-v12.ts`    | once/repeat/interval/order tests | zero-interval/infinite-frame tests     |
| ABI26-ENTITY-001.1  | activation quarantine reservation   | `game-module-runtime-abi-v12.ts`    | reserve/release/transfer tests   | capacity exhaustion test               |
| ABI26-ENTITY-001.2  | session quarantine lifecycle        | `game-module-runtime-abi-v12.ts`    | final cleanup/report test        | new graph/verify/package rejection     |
| ABI26-OBS-001.1     | namespaced multi-reader snapshot    | `game-module-runtime-abi-v12.ts`    | stable atomic snapshot test      | phase/reentrancy/thenable tests        |
| ABI26-OBS-001.2     | bounded JSON observation            | `game-module-runtime-abi-v12.ts`    | exact-limit tests                | one-over/cycle/invalid-value tests     |
| ABI26-CONTACT-001.1 | prepare capability                  | `game-module-runtime-abi-v12.ts`    | mutation-free prepare test       | duplicate/cross-token tests            |
| ABI26-CONTACT-001.2 | token finalizer                     | `game-module-runtime-abi-v12.ts`    | abandoned abort test             | slot/duplicate/evidence-hole tests     |
| ABI26-CONTACT-001.3 | source-first commit                 | `game-module-runtime-abi-v12.ts`    | fixed delivery order test        | indeterminate mutation quarantine test |
| ABI26-BATCH1-001.1  | movement arbiter contract           | `game-module-contract.ts`           | shared contract golden test      | malformed capability rejection         |
| ABI26-BATCH1-001.2  | projectile delivery contract        | `game-module-contract.ts`           | shared contract golden test      | capacity/role rejection                |
| ABI26-BATCH1-001.3  | contact identity and mutation state | payloads/contract                   | identity round-trip test         | collision/missing lineage test         |
| ABI26-BATCH1-001.4  | canonical input/policy semantics    | `game-module-contract.ts`           | semantics golden test            | contradictory selection test           |
| ABI26-BROWSER-001.1 | Node-free browser closure           | browser boundary tests              | root/isolated build              | forbidden import scan                  |
| ABI26-TRACE-001.1   | complete matrix                     | this file + governance test         | complete-cell test               | missing-cell test                      |
| ABI26-GATE-001.1    | preserved fixed-template path       | existing template                   | desktop/mobile regression        | immutable report/package gates         |

## Frozen constants

```text
MAX_EVENT_TRANSACTION_DEPTH = 32
MAX_PREPARES_PER_EVENT_TRANSACTION = 64
MAX_OBSERVATION_READERS_PER_INSTANCE = 8
MAX_OBSERVATION_VALUE_DEPTH = 8
MAX_OBSERVATION_ENTRIES_PER_READER = 128
MAX_OBSERVATION_ENTRIES_PER_SNAPSHOT = 2048
MAX_OBSERVATION_CANONICAL_BYTES = 262144
MAX_OBSERVATION_STRING_CODE_UNITS = 4096
```

Timer `finite-repeat.executions` is the total number of executions. A timer
scheduled by a callback cannot execute until a later frame. Cancellation before
the due-timer snapshot wins; cancellation during a running callback affects only
future executions. Zero-delay interval timers execute at most once per frame.
