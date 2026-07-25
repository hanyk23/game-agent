# Requirements

## Source and scope

- Source: `C:\Users\15311\Desktop\计院夏令营题目-2027.pdf`
- Reviewed: 2026-07-15
- Relevant section: 题目 2“面向小游戏生成的 AI 代码生成智能体” on PDF pages 1-2
- Review method: full text extraction plus visual inspection of both rendered PDF pages

This document distinguishes source requirements from project-added constraints. When they conflict, the PDF is authoritative.

## Source requirements from the PDF

### Background and objective

Build an end-to-end system that turns a natural-language description into a runnable small game. The research scope includes requirement understanding, task planning, gameplay decomposition, code generation, asset use, runtime testing, and optionally error repair. It should explore code templates, logic completion, image/audio generation or retrieval, front-end engine integration, and iteration from runtime feedback.

### Input and output

- Input: a short natural-language description containing the intended game.
- Output: a complete H5 small game that can run in a PC or mobile browser.
- The user-facing generation system must be based on OpenCode or another open-source/general-purpose agent.

### Game category

Choose exactly one of: platform jumping, bullet-hell shooting, role-playing, puzzle, tower defense, sports/racing, card/board entertainment, or interactive film.

Project choice: vertical bullet-hell shooting.

### Asset corpus and retrieval

- Crawl approximately 300-500 relevant game images.
- Organize at least by character, scene, item, UI element, and effect.
- Create necessary text descriptions, tags, and a retrieval index.
- Select assets according to the user's theme, gameplay, and visual style; selection must not be random.

### H5 game behavior and quality

- Run in a PC or mobile browser.
- Provide complete start, play, end, and restart flows.
- Have no program error that blocks gameplay.
- Main controls, collision, scoring, win/loss determination, and level flow must follow the design.
- Maintain basic visual consistency: coordinated asset style, reasonable layout, and readable text/buttons.
- Adapt to common PC and mobile browser resolutions.

### Delivery and acceptance

- Report progress weekly using PPT or an intelligent document.
- Produce a final technical summary report and presentation deck.
- During final acceptance, generate 3-5 small games within a prescribed time and demonstrate the results.
- The final project report should be about ten pages and include required libraries, run instructions, feature description, demo screenshots, and result analysis.
- Submit complete source code and a report containing runtime screenshots.

### Engine guidance

For games requiring a physics engine, the PDF suggests Unity or Godot. It also notes that templates can improve efficiency and quality for games of the same type. This is guidance, not a mandate. Phaser is appropriate for the selected lightweight H5 bullet-hell scope because it directly targets desktop and mobile web browsers.

### API, server, budget, and credentials

- Cursor, Trae, and similar coding IDEs may be used, but usage must be disclosed in the final report; membership costs are self-funded.
- Existing LLM/VLM APIs are allowed only from OpenAI, Doubao, or DeepSeek series according to the PDF.
- Remove personal API tokens before code submission.
- Online students cannot use Zhejiang University internal servers; model API and GPU server rental must be self-arranged.
- Reimbursement after the camp is capped at CNY 500 for model APIs only, or CNY 2,000 when model API and GPU server rental are both involved, subject to invoices.

## Project-added target-product constraints

The following describe required properties of the finished product, not the
current development step. They are deliberate project decisions or proposals,
not verbatim PDF requirements:

- Support both PC and mobile browsers, although the PDF says PC **or** mobile.
- Use Phaser + TypeScript for generated games.
- Require a bounded automated repair cycle in the MVP, although the PDF marks error repair as optional research scope.
- Preserve the versioned `ShooterGameSpec` and stable template as the verified
  compatibility baseline. The active architecture uses a thin Phaser runtime
  kernel, a broad executable base-module library, and a data-only
  `GameAssemblySpec`. Normal generation reuses the library first; an in-scope
  coverage gap may enter a bounded API-model module-development workflow whose
  output is independently validated before run-local admission.
- Separate player intent, locomotion, targeting, attack trigger, attack
  delivery, combat interaction, progression/loadout, encounter, companion,
  scoring, and outcome capabilities. Normal generation is single-player;
  multiplayer, networking, split-screen, PvP, and synchronization are outside
  the active product scope.
- Track asset provenance, author, license, hashes, modification rights, and redistribution rights.
- Treat audio as a later asset-system extension; the 300-500 hard count in the PDF explicitly concerns game images.
- Require reproducible run manifests, layered verification, and long-term handoff documentation.

## Differences between the startup prompt and the PDF

No direct contradiction was found. The startup prompt strengthens or specializes several items:

| Topic          | PDF                                          | Startup project scope                  | Interpretation                                                            |
| -------------- | -------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Browser target | PC or mobile                                 | PC and mobile                          | Stronger acceptance target                                                |
| Repair         | Optional research method                     | Required bounded MVP loop              | Stronger project target                                                   |
| Engine         | Unity/Godot suggested when physics is needed | Phaser + TypeScript preferred          | Compatible because the suggestion is conditional and non-binding          |
| Game type      | Choose one of eight types                    | Vertical bullet-hell                   | Valid specialization                                                      |
| Asset metadata | Categories, descriptions, tags, index        | Detailed provenance and license schema | Stronger governance requirement                                           |
| API providers  | OpenAI, Doubao, or DeepSeek                  | Not yet selected                       | Must remain within PDF allowance unless the source requirement is amended |

## Acceptance criteria derived for this project

### Verified fixed-template baseline

1. Convert one vertical bullet-hell prompt into a valid, versioned `ShooterGameSpec`.
2. Compose a runnable game from one stable Phaser template.
3. Support player movement, auto-fire, ordinary enemy waves, a multi-phase boss, at least three constrained bullet patterns, health, score, win/loss, and start/end/restart.
4. Support keyboard and touch controls with responsive scaling.
5. Retrieve assets from a small license-cleared corpus by category, theme, and style.
6. Pass schema, static, build, runtime, core play, and basic visual checks.
7. Execute at least one recorded, bounded repair based on actual runtime feedback.

These criteria describe the completed compatibility baseline. ADRs 0022-0024,
`docs/ROADMAP.md`, and `docs/BASE_MODULE_LIBRARY_PLAN.md` define the active
module-library migration; the source PDF does not require either architecture.

### Final acceptance

1. Expand to 300-500 curated images with provenance and retrieval metadata.
2. Generate 3-5 materially distinct vertical bullet-hell games within a user-confirmed time budget.
3. Demonstrate required gameplay flows on representative desktop and mobile viewports.
4. Submit complete source, reproducible run instructions, verification evidence, runtime screenshots, a roughly ten-page report, and a presentation deck.

## Unresolved requirement details

- The prescribed generation time for 3-5 games is not specified in the PDF.
- Target browser/version matrix and minimum mobile device performance are not specified.
- Whether all 300-500 images must be crawled from third-party sites, or whether original/generated assets can count, needs confirmation.
- Required weekly reporting day, format, and audience are not specified.
- The preferred allowed API provider and budget allocation are not specified.
