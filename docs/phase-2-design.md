# Phase 2 implementation and architecture

## Dependency flow

Presentation composition (Phase 5) -> AnalysisService -> GraphAnalyzer interface -> injected TarjanLowLinkAnalyzer.

AnalysisService also calls the pure GraphValidator and SortedAdjacencyBuilder. Domain modules import only domain contracts/models. No React or application state enters DFS.

## Modules

| Module | Responsibility |
| --- | --- |
| domain/models/AdjacencyIndex.ts | Readonly sorted node IDs and neighbor entries containing original edge IDs. |
| domain/graph/SortedAdjacencyBuilder.ts | Create both undirected directions, include isolated nodes, and sort by ASCII node ID. |
| domain/models/AnalysisResult.ts | Readonly final node table, discovery order, component roots/count, tree edges, and critical IDs. |
| domain/contracts/GraphAnalyzer.ts | One analyze(adjacency) method and a substitutable deterministic-result contract. |
| domain/algorithms/TarjanLowLinkAnalyzer.ts | Traverse all components and calculate low-link classifications. |
| application/LoadResult.ts | Discriminated success(graph, result) or failure(errors), with no partial result on failure. |
| application/AnalysisService.ts | Validate unknown input, build adjacency, then invoke the injected analyzer. |

## Algorithm rules

The builder uses sorted copies, so source arrays are never reordered. Neighbors are sorted by neighbor ID, not by edge ID, names, positions, or locale rules. Map iteration also follows sorted node IDs.

The analyzer owns fresh working maps, result arrays, critical-item sets, and a zero-based clock inside each invocation. The -1 working sentinel marks an undiscovered node and is never exposed in a completed result.

For a new tree child v of u, DFS finishes v, propagates low[v], and classifies the edge with low[v] > discovery[u]. Non-root articulation uses low[v] >= discovery[u]. Each root uses only its own count of DFS-tree children. A visited non-parent neighbor contributes discovery[neighbor], not low[neighbor].

The clock continues across components. Final bridge/articulation IDs are sorted by ASCII order; discovery roots/order and tree-edge IDs retain deterministic traversal order. Original graph edge IDs are preserved throughout.

## SOLID and patterns

Single Responsibility is reflected in separate validation, index construction, analysis, and orchestration. GraphAnalyzer is a narrow Strategy contract. AnalysisService receives that interface through its constructor, supporting Dependency Inversion and compatible extensions.

A substitute must preserve traversal order, values, and result semantics; type compatibility alone does not establish Liskov Substitution. Validator and builder remain simple functions instead of acquiring unnecessary interface hierarchies.

## Phase 3 extension point

The final UML includes initialSnapshot, events, and finalSnapshot. Phase 2 implemented their core calculated outcome. Phase 3 has now preserved that core as AnalysisSummary and added the complete replay envelope to AnalysisResult at the same analyzer/service boundary. See event-schema.md and phase-3-evidence.md.

There are no placeholder event arrays or extra DFS runs. The deterministic visit/return/classification points now emit real events and immutable snapshots. All 149 original tests continue to protect the existing values; the full suite now contains 190 passing tests.

## Complexity and trust boundaries

The DFS core is O(V+E). Adjacency sorting adds O(V log V + sum(degree * log degree)); sorting final critical IDs adds the corresponding output-sort costs. Adjacency, working/result data, and recursion require O(V+E) space. Recursion depth is bounded by the 12-node engine contract.

AnalysisService.prepare is the public runtime-validation boundary. Builder/analyzer inputs are trusted internal representations, so they do not repeat graph validation. Guards identify accidental internal indexes with missing endpoints/nodes/lists. No state is cached by the service or analyzer.

Readonly models provide compile-time protection. The builder owns its arrays/maps/entries, and results copy working node records; tests verify non-mutation and cross-run isolation. Deeply immutable per-event snapshots arrive in Phase 3.
