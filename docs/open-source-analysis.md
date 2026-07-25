# Open-source Project Analysis

Research date: 2026-07-15. This is a source-level architectural survey for the proposal stage; no repository was copied or vendored.

## Summary comparison

| Project        | Role                                                      | License                                             | What to adopt                                                                                     | What not to adopt wholesale                                        | Decision                                                      |
| -------------- | --------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| OpenCode       | Code-agent runtime and supported integration surface      | MIT                                                 | SDK/server, structured output, sessions/events, permissions, project Skills/tools/plugins         | Core fork or dependence on undocumented internals                  | Adopt through supported SDK and project extensions            |
| OpenGame       | Reference architecture for end-to-end web-game generation | Apache-2.0                                          | Stable templates, accumulated debug knowledge, headless validation, separation of asset/GDD tools | Whole runtime, model stack, or repository copy                     | Design reference only; inspect narrow reusable pieces later   |
| PlayCoder      | Behavioral evaluation and repair research framework       | Apache-2.0; vendored subtrees have separate notices | Exec/Pass/Play layering, screenshot/interaction feedback, diagnosis-patch-validation loop         | Desktop-centric automation stack and full multi-agent benchmark    | Adapt evaluation concepts to Playwright/web games             |
| clip-retrieval | Large-scale CLIP embedding/index/query system             | MIT                                                 | Image/text embeddings, cosine retrieval, metadata-aware reranking concepts                        | Billion-scale services, distributed index, remote LAION dependency | Use concepts; build a much smaller local index                |
| img2dataset    | URL-to-image dataset downloader                           | MIT                                                 | Metadata, hashes, resize modes, retries/failure logs, incremental jobs, opt-out headers           | High-concurrency/distributed crawling defaults                     | Optional acquisition tool after license allowlisting          |
| Phaser         | HTML5 2D game framework                                   | MIT                                                 | Scene lifecycle, loader, unified pointer input, physics, groups/pools, scaling                    | Unpinned major-version APIs                                        | Adopt; proposed MVP pin is Phaser 3.90.0 pending confirmation |

## OpenCode

- Repository: https://github.com/anomalyco/opencode
- Documentation: https://opencode.ai/docs
- Latest release observed: v1.18.1, released 2026-07-14
- License: MIT
- Maturity: high and rapidly evolving; the integration must pin and capability-check a tested version.

### Verified supported surfaces

- `@opencode-ai/sdk` is a type-safe JS/TS client for the OpenCode server.
- `createOpencode()` starts a local server and client; `createOpencodeClient()` connects to an existing server.
- Session APIs create, prompt, abort, summarize, inspect messages, and respond to permission requests.
- Prompts support JSON Schema structured output with validation retries, directly useful for `ShooterGameSpec` extraction.
- Server-sent events expose session and tool progress for run logs and timeout supervision.
- Project-local Skills live under `.opencode/skills/`; custom tools under `.opencode/tools/`; plugins under `.opencode/plugins/`.
- Plugins can observe session, permission, file, LSP, command, and tool events.
- Permissions can allow, ask, or deny actions at granular tool/path/command patterns; external-directory access and `.env` reads receive special protection.
- `AGENTS.md` is a documented project-rules mechanism.

### Architectural use

Use the SDK for programmatic sessions and structured outputs. Provide narrowly scoped project Skills and tools for game composition and verification. Keep generation state and policy in this repository's orchestrator so runs survive OpenCode session replacement and can be independently audited.

### Non-adoption

Do not fork core. Do not build the product solely as a plugin hook chain: plugins are useful extension points, but the pipeline needs a deterministic domain state machine, explicit artifact store, retry budgets, and resumability outside a single OpenCode session.

Primary sources:

- https://github.com/anomalyco/opencode
- https://github.com/anomalyco/opencode/releases/tag/v1.18.1
- https://opencode.ai/docs/sdk
- https://opencode.ai/docs/server
- https://opencode.ai/docs/permissions
- https://opencode.ai/docs/plugins
- https://opencode.ai/docs/custom-tools
- https://opencode.ai/docs/skills

## OpenGame

- Repository: https://github.com/leigest519/OpenGame
- License: Apache-2.0
- Public release noted in README: 2026-04-21
- Maturity: promising research framework with limited public commit history at review time; benchmark release status should be rechecked before depending on it.

### Verified design

OpenGame describes a reusable Game Skill containing:

- a Template Skill that accumulates stable project skeletons; and
- a Debug Skill that records verified integration fixes.

Its README describes one-shot headless generation, sandbox/runtime checks, browser-based evaluation, configurable asset/GDD providers, and an OpenGame-Bench concept measuring build health, visual usability, and intent alignment. The repository currently extends a qwen-code/Gemini-CLI lineage rather than OpenCode.

### Architectural lessons

- Begin from a tested template and preserve cross-file coherence.
- Treat debug knowledge as a maintained capability, not ad hoc prompt history.
- Evaluate build, visual quality, and intent separately.
- Isolate provider integrations and keep headless permissions explicit.

### Non-adoption

- Do not copy the repository, its CLI runtime, or provider stack.
- Do not assume its Template/Debug Skill APIs are OpenCode-compatible.
- Do not depend on its announced benchmark until the actual released artifacts and licenses are verified.
- Its broad multi-engine generation scope is unnecessary for the first vertical-shooter template.

Primary sources:

- https://github.com/leigest519/OpenGame
- https://github.com/leigest519/OpenGame/blob/main/LICENSE

## PlayCoder

- Repository: https://github.com/Tencent/PlayCoder
- License: Apache-2.0 for PlayCoder; `THIRD_PARTY_NOTICES.md` governs vendored/baseline subtrees separately.
- Maturity: research implementation with only a small public commit history at review time; useful as a method reference, not an embeddable production dependency.

### Verified design

PlayCoder separates repository-aware generation, behavioral GUI testing, and automated repair. Its evaluation hierarchy is:

1. Exec@k: program executes without runtime failure.
2. Pass@k: unit tests pass.
3. Play@k: interactive behavior is correct.

Its repair flow is diagnosis, patch generation, and validation, repeated with feedback. The PlayTester uses screenshots and interaction sequences to catch silent behavioral faults that compilation and unit tests miss.

### Architectural use

Adapt the hierarchy as Build/Runtime, Assertions, and Play behavior gates. For web games, use deterministic Playwright input and an in-game test bridge before adding VLM-based free-form judging. Store every diagnosis, patch, and recheck as a run artifact.

### Non-adoption

Do not import the whole Python/Desktop GUI automation and benchmark corpus. Its environment, accessibility, and macOS/desktop assumptions do not match H5 browser games. Avoid unnecessary multi-agent roles; a bounded state machine plus a code-agent session is sufficient for MVP.

Primary sources:

- https://github.com/Tencent/PlayCoder
- https://github.com/Tencent/PlayCoder/blob/master/LICENSE.txt
- https://github.com/Tencent/PlayCoder/blob/master/THIRD_PARTY_NOTICES.md

## clip-retrieval

- Repository: https://github.com/rom1504/clip-retrieval
- License: MIT
- Maturity: established tooling designed for very large datasets.

### Verified design

The project provides CLIP inference, FAISS indexing, text/image/embedding queries, filtering, metadata storage, and optional backend/frontend services. It can copy top semantic matches and combine with `img2dataset`.

### Architectural use

Borrow the embedding/query abstraction, but use a local catalog suitable for 300-500 images:

1. hard-filter category, license, technical compatibility, and permitted use;
2. rank text/image similarity with a local embedding model only if keyword ranking is insufficient;
3. rerank for visual-style and palette consistency;
4. return explanations and provenance with each result.

For this corpus size, brute-force cosine search over normalized vectors or a lightweight local vector table is sufficient; FAISS is optional rather than mandatory.

Primary sources:

- https://github.com/rom1504/clip-retrieval
- https://github.com/rom1504/clip-retrieval/blob/main/LICENSE

## img2dataset

- Repository: https://github.com/rom1504/img2dataset
- License: MIT
- Maturity: established high-throughput acquisition utility.

### Verified design

The tool downloads, validates, resizes, encodes, and shards images; records URL, caption, success/error, dimensions, EXIF, and statistics; computes hashes; supports retries and incremental runs; and by default honors `X-Robots-Tag` directives such as `noai`, `noindex`, `noimageai`, and `noimageindex`.

### Architectural use

Use only after creating a human-reviewed allowlist of sources and licenses. Run at low concurrency, preserve source metadata and failure logs, and quarantine files until license, format, dimensions, hash, and content checks pass.

### Non-adoption

Do not treat successful download as permission to redistribute. Do not use large public dataset URLs as a shortcut for rights review. Distributed modes and large sharded formats are unnecessary for 300-500 assets.

Primary sources:

- https://github.com/rom1504/img2dataset
- https://github.com/rom1504/img2dataset/blob/main/LICENSE

## Phaser

- Repository: https://github.com/phaserjs/phaser
- Documentation: https://docs.phaser.io
- License: MIT
- Current project README at review time references Phaser 4.2.1; Phaser 4 is a recent major release. Phaser 3.90.0 remains documented and mature.
- Maturity: high.

### Verified capabilities

- Desktop/mobile WebGL and Canvas rendering with TypeScript support.
- Scene-based lifecycle and comprehensive loader.
- Arcade and Matter physics; Arcade is sufficient for bullet-hell overlap checks.
- Keyboard, mouse, and touch input; pointer input unifies mouse and touch.
- Scale Manager for responsive canvas behavior.
- Groups/pools suitable for bullets and enemies.

### Version recommendation

Pin Phaser 3.90.0 for the MVP because it has stable, versioned documentation and a longer ecosystem history, while Phaser 4 was only recently released. Re-evaluate Phaser 4 after a template spike or at the first planned major-version review. This is a risk-control proposal, not a claim that Phaser 4 is unsuitable.

Primary sources:

- https://github.com/phaserjs/phaser
- https://github.com/phaserjs/phaser/blob/master/LICENSE.md
- https://docs.phaser.io/api-documentation/3.90.0
- https://docs.phaser.io/phaser/concepts/input
- https://docs.phaser.io/api-documentation/3.90.0/class/scale-scalemanager

## License handling conclusion

The six projects use permissive MIT or Apache-2.0 licenses at their roots, but that does not automatically license third-party examples, vendored code, generated media, model weights, or downloaded assets. Before any code reuse, record exact file paths, upstream revision, license, notices, modifications, and compatibility. Every asset receives independent rights review.
