# Phase 2 verification evidence

Phase 2 implements deterministic graph analysis while preserving the agreed domain/application/presentation boundaries. All verification commands below exited with status 0.

## Focused Phase 2 tests

Command:

```powershell
npm.cmd run test:run -- src/tests/SortedAdjacencyBuilder.test.ts src/tests/TarjanLowLinkAnalyzer.test.ts src/tests/AnalysisService.test.ts
```

Actual result:

```text
RUN v5.0.5
Test Files  3 passed (3)
     Tests  58 passed (58)
```

| Test file | Cases | Coverage |
| --- | --- | --- |
| SortedAdjacencyBuilder.test.ts | 14 | Reference adjacency, ASCII order, edge IDs, bidirectional entries, isolated nodes, reversal/seeded permutations, layout/orientation independence, non-mutation and fresh index data. |
| TarjanLowLinkAnalyzer.test.ts | 32 | Main table, cycle, path, root/non-root rules, strict/equality boundaries, back propagation, visited discovery versus low, components/global clock, limits, sorting, determinism, repeated calls, and exhaustive correctness. |
| AnalysisService.test.ts | 12 | Injected strategy, validated/sorted input, real integration, invalid-input gating, no stale/partial output, recovery, non-mutation, permutation invariance, and strategy exception propagation. |

## Independent exhaustive oracle

One of the 58 test cases generates every simple undirected graph on each labeled node set of size 1 through 5:

- 1 node: 1 graph.
- 2 nodes: 2 graphs.
- 3 nodes: 8 graphs.
- 4 nodes: 64 graphs.
- 5 nodes: 1,024 graphs.
- Total: 1,099 generated graphs.

For every generated graph, the test compares component count, bridge IDs, and articulation IDs with a separate flood-fill oracle. The oracle removes each original edge or node and recounts components. It never uses low-link values, DFS-parent rules, or the production adjacency builder.

The same test checks that tree-edge count equals node count minus component count and that discovery times cover exactly 0..V-1. These 1,099 generated graphs are part of one automated test, not an additional claim of 1,099 Vitest cases.

## Full regression suite

Command: npm.cmd run test:run

```text
RUN v5.0.5
Test Files  5 passed (5)
     Tests  149 passed (149)
```

All 91 Phase 1 tests and all 58 Phase 2 tests passed together.

## Main graph result

Both the analyzer test and the real AnalysisService integration matched the independent reference:

| Node | Parent | Discovery | Low |
| --- | --- | --- | --- |
| A | null | 0 | 0 |
| B | A | 1 | 0 |
| C | B | 2 | 0 |
| D | C | 3 | 3 |
| E | D | 4 | 3 |
| F | E | 5 | 3 |
| G | E | 6 | 6 |
| H | G | 7 | 7 |

Discovery order: A, B, C, D, E, F, G, H.

Component roots: A. Component count: 1.

DFS-tree edge IDs: AB, BC, CD, DE, EF, EG, GH.

Sorted bridge IDs: CD, EG, GH.

Sorted articulation IDs: C, D, E, G.

Focused tests prove that low[E] equals discovery[D], so DE is not a bridge, while D is an articulation point. A separate two-cycle graph verifies that an already visited neighbor contributes its discovery value, not its propagated low value.

## Build and lint

npm.cmd run build ran tsc -b and Vite 8.3.5 successfully.

npm.cmd run lint ran Oxlint successfully.

No dependency additions or configuration changes were required.

## Architectural review and remaining phases

- Domain modules contain no React, presentation, application, or test-fixture imports.
- AnalysisService imports GraphAnalyzer as a type, not the concrete Tarjan strategy.
- Complete validation precedes adjacency construction and analyzer invocation.
- Production decisions never import the documented/test oracle.
- Per-call working data and copied result records prevent cross-run contamination.
- The algorithmic result is implemented now; the final UML's replay envelope and immutable per-event snapshots are scheduled for Phase 3.
- Replay state transitions and stale-UI clearing remain Phase 4; the rendered map and browser/component checks remain Phase 5.
