# Implementation plan and testing gates

Follow the agreed five-phase baseline. Implement, test, verify, and record each checkpoint before moving forward.

| Phase | Responsibilities | Verification gate | Status |
| --- | --- | --- | --- |
| 1 | Models, graph factory, validation, tooling | Graph integrity, bounds, runtime structure, non-mutation, independent factory values; build/lint | Complete: 91 tests passed |
| 2 | Sorted adjacency, GraphAnalyzer, AnalysisService, Tarjan DFS | Main oracle, shuffled arrays, cycles, low propagation, inequalities, root count, components/isolated nodes | Complete: 58 new tests; 149 total passed |
| 3 | Explanatory events and immutable snapshots | Event order, numerical proof, snapshot independence, identical repeated histories | Planned |
| 4 | Replay reducer, selectors, controller hook | One event per Step, Run to End, Reset, final clamp, invalid-load stale-output clearing | Planned |
| 5 | SVG map, controls, event/history panel, table, summary | Synchronized UI, accessible states, component tests, regression suite, build, manual demo | Planned |

## Phase 1 order

1. Configure the installed Vite project with Tailwind/Vitest.
2. Add readonly graph models and a fresh eight-island factory.
3. Add structured results and a stateless validator.
4. Add focused tests and independent reference/design documentation.
5. Run tests, production build, and lint; record actual evidence.

## Design refinement

The UML illustrated validation with a Graph argument. The implementation accepts unknown at the runtime boundary and returns a typed Graph only on success. This supports structural validation and future imported data; existing typed callers remain compatible.

Validation stays a simple function. Phase 2 introduced the Strategy interface and injected analysis service with the actual analyzer.

Phase 2 implements the core AnalysisResult table, discovery order, component roots/count, tree edges, and sorted critical IDs. The final UML's replay envelope (initialSnapshot, events, finalSnapshot) remains the planned Phase 3 addition. The domain/application dependency boundary and analyze/prepare entry points stay the same.

## Phase 2 verification

All 58 new adjacency/analyzer/service cases passed, including removal-based checks of all 1,099 simple graphs with up to five nodes. All 91 Phase 1 tests also passed. Build and lint passed. See phase-2-evidence.md.

## Deferred integration checks

Phase 1 proves invalid data returns no successful graph or partial analysis and cannot contaminate later validation calls. Phase 4 will prove LOAD_FAILURE also clears earlier replay/results atomically.

Readonly models and fresh graph instances support Reset. The actual Reset transition and repeated replay-history tests belong to Phase 4.
