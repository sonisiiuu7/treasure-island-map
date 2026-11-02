# Implementation plan and testing gates

Follow the agreed five-phase baseline. Implement, test, verify, and record each checkpoint before moving forward.

| Phase | Responsibilities | Verification gate | Status |
| --- | --- | --- | --- |
| 1 | Models, graph factory, validation, tooling | Graph integrity, bounds, runtime structure, non-mutation, independent factory values; build/lint | Complete: 91 tests passed |
| 2 | Sorted adjacency, GraphAnalyzer, AnalysisService, Tarjan DFS | Main oracle, shuffled arrays, cycles, low propagation, inequalities, root count, components/isolated nodes | Complete: 58 new tests; 149 total passed |
| 3 | Explanatory events and immutable snapshots | Event order, numerical proof, snapshot independence, identical repeated histories | Complete: 41 new tests; 190 total passed |
| 4 | Replay reducer, selectors, controller hook | One event per Step, Run to End, Reset, final clamp, invalid-load stale-output clearing | Complete: 71 new tests; 261 total passed |
| 5 | SVG map, controls, event/history panel, table, summary | Synchronized UI, accessible states, component tests, regression suite, build, browser demo | Complete: 32 new tests; 293 total passed |

## Phase 1 order

1. Configure the installed Vite project with Tailwind/Vitest.
2. Add readonly graph models and a fresh eight-island factory.
3. Add structured results and a stateless validator.
4. Add focused tests and independent reference/design documentation.
5. Run tests, production build, and lint; record actual evidence.

## Design refinement

The UML illustrated validation with a Graph argument. The implementation accepts unknown at the runtime boundary and returns a typed Graph only on success. This supports structural validation and future imported data; existing typed callers remain compatible.

Validation stays a simple function. Phase 2 introduced the Strategy interface and injected analysis service with the actual analyzer.

Phase 2 implemented the core result table, discovery order, component roots/count, tree edges, and sorted critical IDs. Phase 3 preserves those fields as AnalysisSummary and extends AnalysisResult with the final UML's initialSnapshot, events, and finalSnapshot envelope. The domain/application boundary and analyze/prepare entry points stay the same.

## Phase 2 verification

All 58 new adjacency/analyzer/service cases passed, including removal-based checks of all 1,099 simple graphs with up to five nodes. All 91 Phase 1 tests also passed. Build and lint passed. See phase-2-evidence.md.

## Phase 3 implementation and verification

1. Read the design, plan, reference graph, and Phase 2 evidence; preserve the existing algorithm contract.
2. Define typed event/snapshot models and a pure copying/freezing helper.
3. Emit deterministic events and post-event snapshots during the existing DFS.
4. Keep all 149 calculation/validation tests and add exact traces, mathematical proof, snapshot integrity, and history repeatability tests.
5. Run the focused tests, full suite, build, and lint; document actual results and save the checkpoint.

All 41 new cases passed, including every history transition across all 75 simple graphs with 1..4 nodes. All 190 tests passed together. Build and lint passed after removing one unused test import. The main history has 54 events. See event-schema.md and phase-3-evidence.md.

## Phase 4 implementation and verification

1. Read the lifecycle design, event contract, and Phase 3 evidence.
2. Add independently owned graph copies, a pure original preview, discriminated state/actions, and the pure reducer.
3. Derive one selected ReplayView, prefix history, progress, errors, and controls.
4. Connect useReducer to the injected prepare service; verify application tests before React hook integration.
5. Run focused Node/jsdom tests, all regressions, build, and lint; document results and save the local checkpoint.

All 49 reducer/selector cases and 22 controller cases passed. All 261 tests passed together, with successful build and lint. StrictMode, batched actions, two invalid-load clearing cases, caller mutation, custom graph Reset, and identical stepped/complete histories are verified. See replay-controller.md and phase-4-evidence.md.

## Phase 5 implementation and verification

Phase 4 now proves LOAD_FAILURE clears earlier graph/result/cursor state atomically and exposes no stale graph, snapshot, event, focus, history, or progress. Reset restores the independently owned original values after custom/invalid loads.

Phase 5 now renders the native SVG map, controls, current proof, expandable history, node table, and summary from the same ReplayView.

1. Compose the existing service/controller at App without changing domain/application/controller behavior.
2. Add accessible components and numerical formatting of recorded event details.
3. Add 22 component and 10 complete application cases, including all 54 selected snapshots and two distinct invalid-load recoveries.
4. Verify the actual browser at laptop/mobile sizes; correct table height and text collisions; retain screenshots and measurements.
5. Run focused UI checks, all 293 tests, production build, lint, and Git whitespace checks; record the local checkpoint.

All 32 new cases and all 261 earlier cases passed. Build/lint passed. Chrome checked the required F → E, DE, and D proofs, final values, history retention, keyboard Step, and Reset. Desktop primary panels fit at 1366 × 768; mobile at 390 × 844 has no horizontal overflow. See phase-5-evidence.md, ui-design.md, and demo-walkthrough.md.

All five planned implementation phases are complete. GitHub publication and deployment were not part of this local phase.

## Development notes and open items

The [engineering prompts](prompts/engineering-prompts.md) describe the layer boundaries, algorithm rules, ownership decisions, and verification tasks. The [development notes](ai-prompts.md) record actual issues and results, and the [discussion guide](interview-discussion.md) covers the design questions.

The counts above are historical checkpoint results. The reliability follow-up now passes 303 tests in 13 files with the normal command, repeated twice. It retains all 54-event assertions, uses cached/scoped queries and two workers, and assigns 20 seconds only to the two exhaustive full-replay cases. Other tests keep the default five seconds. Build and lint pass.

The history-type filter is a proposed extension. It has not been implemented.

## Optional requirements complete

Gentle presentation-only replay animation and the printable safety summary are implemented. Motion respects reduced-motion settings. Printing consumes the completed selected view and leaves the event model, cursor, and analysis untouched. Ten new tests cover report content, incomplete/error/Reset clearing, alternate graphs, printing actions, keyboard operation, and animation/live-region behavior. See [the actual verification record](reliability-and-optionals.md).

## Graph exploration extension

The five-phase baseline is preserved. Additional work now exposes selectable graph examples, single-closure connectivity, reached critical-item proof selection, and automated repository checks.

The domain owns connectivity partitioning and immutable closure models. Application functions orchestrate closure comparison and proof queries. A graph-bound presentation hook and native controls manage exploration without changing replay actions, history, or DFS. Existing GraphAnalyzer/AnalysisService/controller contracts remain.

Verification: 34 new tests; 337 total across 17 files; production build and lint pass. Browser checks cover CD/DE/D, all example outcomes, desktop/mobile/print, and 240 event layouts plus six closure layouts. GitHub Actions is configured but has not run on GitHub because no remote is set. See [exploration evidence](exploration-evidence.md).

## Publication follow-up — 2026-11-03

The owner authorized GitHub publication and deployment. The private repository was created as [sonisiiuu7/treasure-island-map](https://github.com/sonisiiuu7/treasure-island-map), and the complete existing history was pushed to main. The first GitHub Actions run passed clean npm ci, all 337 tests, build, and lint on Ubuntu. The earlier pending-hosted-check statements describe the local checkpoints before this publication.

The owner selected My Workspace on Render. After private repository access continued to fail, the owner explicitly authorized making the repository public. Render created the static site and its deployment reached live. Production browser checks passed Load, Step, completion, the 54-event history, numerical proofs, CD/DE/D closures, the cycle example, Reset, desktop/mobile layout, and print media with no page errors. The [live application](https://treasure-island-map.onrender.com/) and [deployment evidence](deployment.md) are available.
