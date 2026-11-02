# Treasure-Island Bridge Safety Map

A local React + TypeScript application that lets a festival volunteer inspect an island network and explain critical bridges and articulation islands using visible DFS evidence.

All five phases are complete. The interface includes the responsive native SVG map, Load/Step/Run to End/Reset controls, numerical event explanations, expandable history, traversal table, and safety summary.

![Completed desktop interface](docs/screenshots/ui-polish/completed-desktop.png)

## Run locally

In Windows PowerShell:

```powershell
Set-Location "C:\Users\UDAY\Documents\Codex\2026-11-02\x20\outputs\treasure-island-map"
npm.cmd ci
npm.cmd run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Open [the local application](http://127.0.0.1:5175/) after Vite starts. Existing installations can start with the final command. Stop the server with Ctrl+C. The verification server is stopped after the checks; this project is local and has not been published.

Click **Load My Archipelago**, then **Step** for one recorded event or **Run to End** for completion. **Reset** restores the original unvisited network. Expand history to inspect recorded proofs. After completion, **Print summary** opens the browser print dialog for a final safety report or Save as PDF. Steps have gentle visual transitions that respect the system's reduced-motion preference.

## Verification

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run lint
```

The current UI refinement passed **303 tests in 13 files** (13.36 s), production build, and lint using the normal commands. All existing tests were retained. See [UI refinement evidence and current captures](docs/ui-polish-evidence.md). The preceding reliability checkpoint also passed two consecutive normal runs.

The 54-event tests retain all assertions. Cached/scoped queries avoid repeated full-page accessibility searches; two-worker execution limits contention; only the two exhaustive full-replay tests have a 20-second budget. Other tests keep the five-second default.

Both optional requirements are implemented: gentle replay animation and a printable safety summary. Real Chrome checks cover desktop/mobile layout, reduced motion, unchanged replay during printing, seven critical-item proofs, eight final table rows, and a one-page A4 output.

See [reliability and optional-feature evidence](docs/reliability-and-optionals.md), [browser results](docs/optional-browser-results.json), and the [demo walkthrough](docs/demo-walkthrough.md). Browser coverage uses Chrome and mobile emulation; physical-device, cross-browser, screen-reader, and physical-printer checks were not performed.

## Architecture

- **Domain:** readonly graph contracts, runtime validation, sorted adjacency, the GraphAnalyzer Strategy, Tarjan DFS, typed events, and deeply immutable snapshots. No React imports.
- **Application:** AnalysisService with constructor-injected GraphAnalyzer; pure replay state, reducer, and selectors.
- **Presentation:** App composes the service and useReplayController. IslandMap, ReplayControls, EventPanel, EventHistory, NodeTable, and SafetySummary receive the same ReplayView. EventProof formats typed recorded details.
- **Data:** createFestivalArchipelago returns fresh original demo data. The controller captures independent original values for Reset.
- **Tests:** Node-based domain/application tests and file-scoped jsdom React tests; independent reference fixtures remain outside production code.

Only Load calls AnalysisService.prepare and executes DFS. Navigation, Reset, rerenders, and history expansion use the prepared immutable history. Panels read only the selected snapshot and already-replayed events; future classifications are never exposed early.

The stack is React, TypeScript, Vite, Tailwind CSS, native SVG, React useReducer, Vitest, React Testing Library, jsdom, and Oxlint. Phase 5 adds no dependencies or external services.

## Expected demonstration

The original eight-island network produces 54 deterministic events:

- Event 21: returning F → E changes low[E] from 4 to 3.
- Event 39: DE is not a bridge because 3 > 3 is false.
- Event 40: D becomes an articulation island because 3 ≥ 3 is true.
- Completion: bridges **CD, EG, GH**; articulation islands **C, D, E, G**; **1** component.

These numbers are calculated by the analyzer. The hand-derived expected table exists only in documentation/tests.

The engine accepts 1..12 nodes and 0..20 undirected edges, including disconnected graphs and isolated nodes. Validation errors identify their fields/items and clear all earlier visible analysis. The volunteer interface loads the original demo; dependency-injected tests exercise invalid input without adding testing controls to the page.

## Project documentation

- [Implementation plan and phase gates](docs/implementation-plan.md)
- [Architecture, UML, and sequences](docs/design.md)
- [Independent graph/reference table](docs/reference-graph.md)
- [Event schema and emission rules](docs/event-schema.md)
- [Replay/controller contract](docs/replay-controller.md)
- [Presentation design and accessibility](docs/ui-design.md)
- [UI refinement audit and verification](docs/ui-polish-evidence.md)
- [Reliability fix and optional-feature evidence](docs/reliability-and-optionals.md)
- [Development notes and AI use](docs/ai-prompts.md)
- [Engineering prompt collection](docs/prompts/engineering-prompts.md)
- [Interview discussion and follow-up questions](docs/interview-discussion.md)
- [Phase 1 evidence](docs/phase-1-evidence.md), [Phase 2 evidence](docs/phase-2-evidence.md), [Phase 3 evidence](docs/phase-3-evidence.md), [Phase 4 evidence](docs/phase-4-evidence.md), [Phase 5 evidence](docs/phase-5-evidence.md)
