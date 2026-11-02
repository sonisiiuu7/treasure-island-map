# Treasure-Island Bridge Safety Map

A local React + TypeScript application for explaining bridge and articulation-point analysis across a festival archipelago.

## Current checkpoint

Phases 1 through 3 are complete: configuration, models/data, validation, deterministic adjacency, Tarjan analysis, the injected application service, and explanatory replay events with deeply immutable snapshots. The React page is the Vite starter; the interactive map is scheduled for Phase 5.

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

The full gate passed: 190 tests across seven files, the TypeScript/production build, and lint without warnings. This includes all 149 earlier cases plus 41 new replay/snapshot cases, exhaustive safety checks over 1,099 small graphs, and complete history-transition checks over 75 small graphs. See [Phase 3 evidence](docs/phase-3-evidence.md), [Phase 2 evidence](docs/phase-2-evidence.md), and [Phase 1 evidence](docs/phase-1-evidence.md).

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
- src/tests/: validation boundaries, graph integrity, non-mutation, repeatability, and independent factory data.

React, TypeScript, Vite, Tailwind, Vitest, and React Testing Library dependencies are installed. Vite is configured with React/Tailwind and Vitest's Node environment. Component/browser testing is part of Phase 5.

## Validation boundary

validateGraph(input: unknown) accepts runtime data. Success has valid: true, an empty errors array, and a typed graph. Failure has valid: false and structured errors with code, message, field path, and relevant node/edge/endpoint IDs. A failure never exposes a graph for analysis.

The validator returns successful input by reference and does not mutate, clone, freeze, or cache it. Readonly TypeScript models prevent ordinary compile-time mutation; the factory provides independent object ownership. Later loading/replay code will preserve its original graph separately.

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

Step/Run/Reset are Phase 4; map rendering and component integration are Phase 5.
