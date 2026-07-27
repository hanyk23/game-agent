# Contract Module Provenance

These two files are byte-identical copies of the real product modules in `src/modules/`.
They exist here because Cocos Creator's rollup compiler requires all compiled scripts
to reside under the project's `assets/` directory (soft-links to `../../src` trigger
TS6059 "not under rootDir").

| File                            | Source                                      |
| ------------------------------- | ------------------------------------------- |
| game-module-safe-counter.ts     | src/modules/game-module-safe-counter.ts     |
| game-module-entity-directory.ts | src/modules/game-module-entity-directory.ts |

Byte-equality must be maintained. The guard test
`tests/samples/golden-cocos-baseline.test.ts` already enforces byte-equality for the
golden sample. A parallel guard for the template will be added in Phase 3-C.
