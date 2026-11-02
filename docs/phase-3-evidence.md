# Phase 3 verification evidence

Phase 3 adds the documented replay envelope to the existing Strategy analyzer while preserving all Phase 2 calculation fields and the AnalysisService dependency boundary.

## New focused tests

Command:

```powershell
npm.cmd run test:run -- src/tests/ReplayEvents.test.ts src/tests/TraversalSnapshot.test.ts
```

Actual result:

```text
RUN v5.0.5
Test Files  2 passed (2)
     Tests  41 passed (41)
```

ReplayEvents.test.ts has 36 cases; TraversalSnapshot.test.ts has 5.

New coverage includes exact event order, a ten-event one-edge trace, the 54-event main history, two inspections per edge, numerical low changes, negative/equality outcomes, child completion before classification, root/non-root rules, deduplication, focus consistency, zero future-result leakage, runtime immutability, snapshot ownership, repeated/shuffled histories, coordinate/name/orientation independence, service gating, and the 12-node/20-edge limit.

One new test independently interprets and checks every event transition for all 75 simple undirected graphs on one through four nodes. It verifies unchanged fields as well as the intended effect. This is one automated test containing 75 generated graph cases.

The existing Phase 2 exhaustive test also still checks calculated safety results against edge/node-removal connectivity for all 1,099 simple graphs on one through five nodes.

## Full regression suite

Command: npm.cmd run test:run

Final actual result:

```text
RUN v5.0.5
Test Files  7 passed (7)
     Tests  190 passed (190)
```

All 149 existing tests remain present. Calculation assertions still compare exactly against the hand-derived Phase 2 summary; their helpers/mocks were adapted to the extended result. The 41 new tests inspect the complete replay envelope.

## Numerical demonstrations

Passing tests verified:

- Return F -> E: oldLow = 4, childLow = 3, newLow = 3. The explanation includes 4 -> 3.
- CLASSIFY_EDGE for DE: childLow = 3, parentDiscovery = 3, isBridge = false, nonRootArticulation = true.
- The immediately following ARTICULATION event marks D with rule NON_ROOT_LOW and proof 3 >= 3.
- Root A finishes with one DFS-tree child and isArticulation = false.
- The final snapshot is the exact last-event snapshot and matches the independent parent/discovery/low table, component count 1, bridges CD/EG/GH, and articulation IDs C/D/E/G.

## Build and lint

Final commands:

```powershell
npm.cmd run build
npm.cmd run lint
```

Both exited successfully. TypeScript checked the production code and tests, Vite built successfully, and Oxlint completed without warnings.

During the first final check, TypeScript found one unused Graph type import in the new test file. It was removed, then the full suite, build, and lint were rerun. No algorithm/event test failures occurred.

## Architecture and scope

- New event/snapshot types and snapshot copying live in the pure TypeScript domain.
- Events are emitted in the existing DFS, with no second analysis pass.
- GraphAnalyzer.analyze and AnalysisService.prepare keep the same entry points and dependency injection.
- Each invocation owns its working state. The result and all replay values are frozen and serializable.
- No application decision imports the documentation/test oracle.
- Replay reducers, selectors, controller hooks, and UI remain their later phases.

See [event-schema.md](event-schema.md) for exact payloads and ordering.
