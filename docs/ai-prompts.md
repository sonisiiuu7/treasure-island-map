# Development process and AI use

The project was split into five phases so graph correctness could be checked before adding replay and presentation. Each phase produced working code, focused tests, and a checkpoint.

The [engineering prompts](prompts/engineering-prompts.md) cover the implementation, review, and extension tasks. The [implementation plan](implementation-plan.md) tracks the phase gates, and the [discussion guide](interview-discussion.md) connects the design to code and evidence.

## AI tools and workflow

Tools: the OpenAI assistant in chat and the Codex desktop workspace. AI assistance covered design discussion, code, test development, documentation, and investigation of failures.

The workflow was to give the assistant a bounded task, preserve the existing contracts, inspect the result, and verify it before proceeding. Commands ran locally using Vitest, TypeScript/Vite, and Oxlint. React tests used Testing Library and jsdom. Chrome DevTools supplied actual browser screenshots and measurements.

The main controls on AI-generated code were explicit algorithm rules, a separate reference graph, an independent removal-based oracle, and regression tests across phases. The oracle is independent in method: it uses flood fill after removing edges or nodes rather than reusing Tarjan's conditions.

## Implementation checkpoints

| Phase | Main result | Recorded gate |
| --- | --- | --- |
| 1 | Graph models, fresh demo data, runtime validation | [91 tests](phase-1-evidence.md) |
| 2 | Sorted adjacency, Tarjan strategy, injected analysis service | [149 total tests](phase-2-evidence.md) |
| 3 | Typed events and independent immutable snapshots | [190 total tests](phase-3-evidence.md) |
| 4 | Pure reducer/selectors and React controller | [261 total tests](phase-4-evidence.md) |
| 5 | SVG map, controls, numerical explanations, history, table, summary | [293 total tests and browser evidence](phase-5-evidence.md) |

These are checkpoint results. The reliability follow-up adds 10 tests (303 total) and both optional features; see [the follow-up evidence](reliability-and-optionals.md).

## Design decisions

**Separate calculation from replay.** Load validates and analyzes once. Step and Run select from the prepared event sequence. Reset and rerenders do not run DFS. This keeps the explanation repeatable and makes replay transitions testable without React.

**Keep dependencies small.** AnalysisService receives GraphAnalyzer through its constructor. App supplies TarjanLowLinkAnalyzer. The React hook needs only the service's prepare method. Validation and adjacency construction remain functions.

**Use explicit states.** The state union prevents combinations such as ERROR carrying a prepared result. READY has cursor -1; reducer logic enforces active cursor bounds. A failed load clears the visible analysis atomically.

**Own historical data.** readonly protects TypeScript callers, while copied nested values and Object.freeze protect captured state at runtime. The saved original demo remains stable for Reset. Validation itself does not freeze caller-owned objects.

**Choose full snapshots for this small engine.** With at most 12 nodes and 20 edges, full snapshots make synchronized rendering straightforward. The cost is O(K(V+E)) copied snapshot data for K events, plus sorting/freezing work. The complete history is more expensive than the O(V+E) DFS core.

**Use the smallest local UI stack needed.** Native SVG supports the map and labels directly. One controller owns replay, so a backend, external map service, and global state library are unnecessary for the required workflow.

See [the design and diagrams](design.md) and [the replay contract](replay-controller.md).

## Issues and how they were handled

| Issue | Action | Result |
| --- | --- | --- |
| A typed Graph parameter did not cover malformed runtime input. | Make the validator accept unknown and return a typed graph only after all checks succeed. | Structural and numerical validation is covered by [Phase 1 tests](phase-1-evidence.md). |
| An unused test type import failed the Phase 3 build. | Remove the unused import and rerun verification. | [Phase 3 checks passed](phase-3-evidence.md). |
| SVG and page heading names did not match the intended accessible names. | Separate SVG title/description associations and provide the intended heading name. | Focused accessibility tests passed; see [Phase 5 evidence](phase-5-evidence.md). |
| The table extended beyond the laptop viewport and some map labels collided. | Tighten spacing and adjust display projection, name placement, and bridge-label offsets. | Refreshed [browser measurements](browser-check-results.json) show the main panels fitting and no measured label text overlaps at the tested sizes. |
| Set-Location failed in Command Prompt. | Use cd /d in Command Prompt; reserve Set-Location for PowerShell. | Both shell instructions appear in the [demo guide](demo-walkthrough.md). |
| The 54-event integration test exceeded its five-second timeout. | Cache/scoped DOM queries, limit workers to two, and give only the two exhaustive full-replay cases a bounded 20-second budget. | All assertions retained. The normal command passed all 303 tests twice; see [evidence](reliability-and-optionals.md). |

## Algorithm risks checked explicitly

These are correctness risks covered by tests, rather than a list of bugs found in production.

- A visited connection contributes discovery[neighbor], not low[neighbor].
- Bridges use strict >; non-root articulations use >=.
- A root needs two DFS-tree children, not merely two neighbors.
- Source order, coordinates, and names cannot affect traversal.
- Earlier snapshots cannot change when DFS progresses.
- Final classifications must not appear before their replay events.

The demo illustrates the equality rules: F reaches D, then the return F → E changes low[E] from 4 to 3. DE is not a bridge because 3 > 3 is false. D is an articulation because 3 >= 3 is true. Root A has two neighbors but only one DFS-tree child.

## Verification and current limitations

The independent checks include the reference parent/discovery/low table, removal-based component counting over all 1,099 simple graphs on node-set sizes 1..5, and event-transition checks over 75 graphs on sizes 1..4. The generated graphs are checked within automated tests; they are not additional Vitest test counts.

The timeout investigation recorded 292 passes and one timeout with the normal suite. The focused all-events test also exceeded five seconds. This diagnostic command passed all 293 tests in 12 files:

```cmd
npm.cmd run test:run -- --testTimeout=15000 --maxWorkers=1
```

The permanent follow-up retains all assertions, removes repeated whole-page role queries, caps workers at two, and scopes a 20-second budget to the two exhaustive 54-step tests. All other tests retain the five-second default. The normal command passed 303 tests twice (50.40 s and 43.52 s); build and lint passed. The diagnostic command above records the investigation, not the current launch requirement.

Browser evidence covers Chrome at 1366 × 768 and mobile viewport emulation at 390 × 844. It does not establish physical-device, cross-browser, screen-reader, or arbitrary-coordinate label-collision coverage.

The [verification prompt](prompts/engineering-prompts.md#verification-review) describes the investigation; its completed repair is documented in [the follow-up evidence](reliability-and-optionals.md). The [history-filter prompt](prompts/engineering-prompts.md#history-filter-extension) describes a possible extension; that feature is not implemented.

## Optional features

Replay now uses brief event/focus transitions without timers or automatic cursor advancement. Reduced-motion settings disable them. The live announcement region stays mounted as its animated content changes.

Print summary is enabled only after completion. A print-only component reads the same selected ReplayView and recorded proofs. It includes component count, sorted critical IDs, all bridge/articulation proofs, and the final node table. Printing does not call analysis or move the cursor. Reset/failure clears the report; direct printing before completion shows an incomplete notice. Browser checks produced one A4 page for the demo.

## Graph exploration and repository checks

The next extension exposed the cycle-only, branching-root, and disconnected/isolated cases as selectable examples. They use the existing load/validation/service path and do not change the saved original demo.

A separate pure flood-fill operation compares component partitions after closing one edge or node. A graph-bound hook enables it only after completion, so an explicit scenario cannot leak future findings during replay. The map shows a simulation overlay; baseline traversal values and classifications stay intact. Closing the only island yields an empty surviving partition without changing the engine's input limits.

Critical chips now select a proof from the reached history. Selection is tied to the current graph and clears visibly on Reset/replacement/error. The event cursor stays unchanged.

Tests cover CD/DE/D, disconnected and empty-survivor cases, unknown targets, frozen values, input permutations, and agreement with Tarjan for all single removals over 75 small graphs. UI tests verify keyboard interaction, example loading, stale clearing, printing, and unchanged analysis counts. All 34 new cases and all 303 previous cases passed: 337 total.

GitHub Actions is configured to install from the lockfile, run tests, build, and lint. The local equivalents passed; hosted execution is pending publication because the repository currently has no remote. See [design](exploration.md) and [actual evidence](exploration-evidence.md).
