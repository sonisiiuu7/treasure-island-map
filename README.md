# Treasure-Island Bridge Safety Map

A local React + TypeScript application for explaining bridge and articulation-point analysis across a festival archipelago.

## Current checkpoint

Phase 1 is complete: configuration, readonly graph models, fresh demo graph data, runtime validation, and focused tests. The React page is the Vite starter; the interactive safety map is scheduled for Phase 5.

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

The Phase 1 gate passed: 91 tests across two files, the TypeScript/production build, and lint. See [verification evidence](docs/phase-1-evidence.md).

## Architecture

- src/domain/models/Graph.ts: readonly Island, Bridge, and Graph definitions.
- src/domain/models/ValidationResult.ts: structured errors and a discriminated result.
- src/domain/validation/GraphValidator.ts: stateless validation with no React dependencies.
- src/data/createFestivalArchipelago.ts: fresh eight-node, nine-edge demo data.
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

Expected DFS values and critical IDs are documentation-only at this checkpoint. The later analyzer will calculate them from graph input.
