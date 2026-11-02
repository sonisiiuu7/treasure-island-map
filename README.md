# Treasure-Island Bridge Safety Map

A local React + TypeScript application for explaining bridge and articulation-point analysis across a festival archipelago.

## Current checkpoint

Phases 1 through 4 are complete: configuration, models/data, validation, deterministic adjacency, Tarjan analysis, immutable replay events/snapshots, the pure replay reducer/selectors, and the injected React controller. The React page is the Vite starter; the interactive map and page components are scheduled for Phase 5.

## Run locally

Run these commands in this project folder using PowerShell:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. On a fresh checkout, use npm.cmd ci to reproduce dependency versions from package-lock.json.

## Verification

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run lint
```

Use npm.cmd test for Vitest watch mode.

The full gate passed: 261 tests across ten files, the TypeScript/production build, and lint without warnings. All 190 earlier cases and 71 new Phase 4 cases passed together, including hook integration under jsdom/StrictMode, exhaustive safety checks over 1,099 small graphs, and history-transition checks over 75 small graphs. See [Phase 4 evidence](docs/phase-4-evidence.md), [Phase 3 evidence](docs/phase-3-evidence.md), [Phase 2 evidence](docs/phase-2-evidence.md), and [Phase 1 evidence](docs/phase-1-evidence.md).

## Architecture

- src/domain/models/Graph.ts: readonly Island, Bridge, and Graph definitions.
- src/domain/models/ValidationResult.ts: structured errors and a discriminated result.
- src/domain/validation/GraphValidator.ts: stateless validation with no React dependencies.
- src/data/createFestivalArchipelago.ts: fresh eight-node, nine-edge demo data.
- src/domain/models/AdjacencyIndex.ts and AnalysisResult.ts: readonly graph-index and traversal-result contracts.
- src/domain/graph/SortedAdjacencyBuilder.ts: ASCII-sorted roots/neighbors with original edge IDs.
- src/domain/contracts/GraphAnalyzer.ts: the small Strategy interface.
- src/domain/algorithms/TarjanLowLinkAnalyzer.ts: stateless DFS across all components.
- src/domain/models/ReplayEvent.ts and TraversalSnapshot.ts: discriminated event payloads and complete visible state.
- src/domain/replay/createTraversalSnapshot.ts: independent copies and runtime freezing of every snapshot level.
- src/application/AnalysisService.ts and LoadResult.ts: validation-first orchestration and success/failure results.
- src/application/ReplayState.ts, replayReducer.ts, and replaySelectors.ts: lifecycle transitions and the single visible ReplayView.
- src/presentation/hooks/useReplayController.ts: injected prepare service, useReducer, memoized view, and Load/Step/Run/Reset callbacks.
- src/domain/graph/copyGraph.ts and domain/replay/createInitialTraversalSnapshot.ts: original graph ownership and pure startup preview creation.
- src/tests/: validation boundaries, graph integrity, non-mutation, repeatability, and independent factory data.

React, TypeScript, Vite, Tailwind, Vitest, React Testing Library, and jsdom dependencies are installed. Domain/application tests keep the Node environment; the controller test file opts into jsdom. Map component tests and the manual browser demonstration are Phase 5.

## Validation boundary

validateGraph(input: unknown) accepts runtime data. Success has valid: true, an empty errors array, and a typed graph. Failure has valid: false and structured errors with code, message, field path, and relevant node/edge/endpoint IDs. A failure never exposes a graph for analysis.

The validator returns successful input by reference and does not mutate, clone, freeze, or cache it. Replay initialization now captures an independent frozen original graph and preview; successful loads capture independently owned graph values before queued actions. Reset reuses the saved original and clears progress/history/errors without analysis.

The engine limits apply: 1..12 nodes and 0..20 undirected edges. Disconnected graphs and isolated nodes are valid. Node and edge ID uniqueness are checked within their respective collections.

## Interview documentation

- [Five-phase implementation plan](docs/implementation-plan.md)
- [Independent reference graph and DFS oracle](docs/reference-graph.md)
- [Architecture, UML, and sequences](docs/design.md)
- [Actual requests and implementation brief](docs/ai-prompts.md)
- [Phase 1 verification evidence](docs/phase-1-evidence.md)
- [Phase 2 implementation and SOLID boundaries](docs/phase-2-design.md)
- [Phase 2 verification evidence](docs/phase-2-evidence.md)
- [Event payloads, ordering, snapshots, and examples](docs/event-schema.md)
- [Phase 3 verification evidence](docs/phase-3-evidence.md)
- [Replay state, selectors, and controller contract](docs/replay-controller.md)
- [Phase 4 verification evidence](docs/phase-4-evidence.md)

Expected DFS values remain in documentation/tests only. Production analysis calculates discovery/low values, component count, bridges, and articulations from graph input.

## Using the analysis service

```ts
import { AnalysisService } from './src/application/AnalysisService'
import { createFestivalArchipelago } from './src/data/createFestivalArchipelago'
import { TarjanLowLinkAnalyzer } from './src/domain/algorithms/TarjanLowLinkAnalyzer'

const service = new AnalysisService(new TarjanLowLinkAnalyzer())
const load = service.prepare(createFestivalArchipelago())
if (load.ok) {
  // load.result.nodes contains parent/discovery/low for every island.
  // load.result.bridgeIds is ['CD', 'EG', 'GH'] for the original demo.
  // load.result.articulationIds is ['C', 'D', 'E', 'G'].
} else {
  // load.errors identifies invalid graph fields; no partial result is returned.
}
```

The prepared result also exposes initialSnapshot, events, and finalSnapshot. The original graph produces 54 deterministic events. finalSnapshot references the last event's snapshot; every event and snapshot is frozen. See event-schema.md for the numerical explanation of F -> E and the DE/D equality boundary.

The controller now exposes load(), load(input), step(), runToEnd(), reset(), and one view. Load invokes AnalysisService; navigation/reset/rerender do not rerun DFS. Selectors expose only the chosen snapshot and already-replayed history. Map rendering, page controls, and component integration remain Phase 5.
