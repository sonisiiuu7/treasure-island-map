# Replay state, selectors, and controller

Phase 4 implements Load, Step, Run to End, and Reset over the immutable history prepared in Phase 3. Phase 5 now renders the map, buttons, and panels from the selected ReplayView without changes to this controller contract.

## Responsibilities and dependencies

| Module | Responsibility |
| --- | --- |
| domain/graph/copyGraph.ts | Make independently owned, deeply frozen graph values; preserve original array order. |
| domain/replay/createInitialTraversalSnapshot.ts | Build a frozen unvisited preview without traversal or analysis. |
| application/ReplayState.ts | Discriminated lifecycle state and typed actions. |
| application/replayReducer.ts | Pure initialization and state transitions. |
| application/replaySelectors.ts | Derive a single immutable ReplayView from stored state. |
| presentation/hooks/useReplayController.ts | Connect React useReducer and user operations to an injected prepare service. |

Application modules have no React imports. The hook depends only on AnalysisService's public prepare method via Pick<AnalysisService, 'prepare'>; it constructs no analyzer. GraphAnalyzer and AnalysisService retain their existing implementation and injection boundary.

## Lifecycle

| Status | Stored state | Visible state and controls |
| --- | --- | --- |
| EMPTY | Original demo; result null; cursor -1; errors empty | Original unvisited snapshot; Load available. |
| READY | Prepared graph/result; cursor -1; errors empty | result.initialSnapshot; Step, Run, Load, Reset available. |
| RUNNING | Prepared graph/result; selected non-final event | Selected event/snapshot and replayed prefix; Step, Run, Load, Reset available. |
| COMPLETED | Same prepared result; final event selected | Final snapshot and complete retained history; Load/Reset available. |
| ERROR | Current graph/result null; cursor -1; validation errors | No traversal graph, snapshot, event, focus, history, or progress; Load/Reset available. |

RUNNING means a manual replay has advanced, not that a timer/animation is active. All analysis/loading is synchronous.

The state union prevents unloaded/error states from carrying an active analysis. READY has cursor -1 at the type level. Active cursor bounds are maintained by the reducer.

originalDemoGraph and originalSnapshot remain stable for the controller's lifetime. Reset restores them rather than whichever graph was loaded most recently.

## Action contract

| Action | Transition |
| --- | --- |
| LOAD_SUCCESS(graph, result) | Own frozen graph values, retain the prepared immutable result, clear errors, enter READY at -1. |
| LOAD_FAILURE(errors) | Copy/freeze identifiable errors; clear current graph/result/cursor atomically; enter ERROR. Preserve original demo/preview. |
| STEP | In READY/RUNNING, increment by exactly one and enter COMPLETED at the final index. |
| RUN_TO_END | In READY/RUNNING, select the final existing event and enter COMPLETED. |
| RESET | Restore the original graph and preview; discard prepared result/history and errors; enter EMPTY. |

STEP and RUN_TO_END return the same state in EMPTY, ERROR, and COMPLETED. RESET in EMPTY is idempotent and returns the same state. Loading another valid graph from any status starts a fresh READY replay.

Reducers receive trusted prepared results. Complete validation and DFS occur in AnalysisService before LOAD_SUCCESS. The reducer never invokes validation or analysis.

## Data ownership and pure initialization

createInitialReplayState accepts the trusted candidate-created Graph, copies its contract fields and array order, freezes the new records/arrays, and creates an unvisited snapshot. Caller data is not frozen or mutated. Initialization has no service calls, effects, counters, or I/O.

The hook owns a successful graph before dispatching it, preventing caller edits from changing an action waiting in React's batched queue. The reducer also copies graph values at its state boundary, protecting direct action callers. Both operations are small O(V+E) copies under the 12-node/20-edge limit.

The stored original graph and preview are reused on Reset. Parent prop changes and edits to caller-owned original/custom graph records cannot alter the saved original or visible loaded graph.

Prepared history is retained by identity and never copied, shortened, rerun, or mutated by navigation. Error arrays and records are copied/frozen on failure.

## ReplayView

The hook exposes one view with:

- status, graph, eventIndex.
- snapshot, currentEvent, focus.
- history containing only events already reached.
- progress.completedEvents and progress.totalEvents.
- errors and controls (canLoad/canStep/canRunToEnd/canReset).

At EMPTY, snapshot is originalSnapshot. At READY, it is the exact result.initialSnapshot object. During/after replay, it is the exact currentEvent.snapshot object. ERROR has snapshot null.

No stored future result/summary is exposed through ReplayView. A prepared total event count may be displayed, but node values and critical items come only from the selected snapshot.

For an intermediate index i, history is a frozen events.slice(0, i + 1). At completion it is the exact original full events array. Every event remains available for read-only inspection. Focus is the selected event's focus object.

Selectors do not mutate state or calculate discovery/low values. Returned wrappers, progress, controls, and intermediate history arrays are frozen. The hook memoizes the view by state and keeps callbacks stable across ordinary rerenders.

Navigation transitions are O(1). An intermediate view copies its history prefix, O(i); completed history is reused without copying. Original preview creation and graph copying do not execute DFS.

## Hook API

useReplayController(analysisService, originalDemoGraph?) returns:

- view
- load()
- load(input)
- step()
- runToEnd()
- reset()

load() uses the saved original graph. load(input) validates the explicit input as supplied; load(undefined) is therefore an invalid input, distinct from no-argument load(). This distinction is represented by a zero-or-one-argument tuple type.

The optional originalDemoGraph argument is trusted candidate data captured at initialization; untrusted/custom inputs belong in load(input), through AnalysisService.

Use a stable service instance supplied by the composition root. A replacement injected service is used on the next explicit load, never automatically on rerender. The hook invokes prepare only inside load and dispatches one success/failure action.

Unexpected exceptions from prepare propagate without committing a new replay state; they are not mislabeled as graph validation errors. This preserves AnalysisService's existing exception semantics.

## StrictMode and React integration

StrictMode may repeat pure initializer/reducer work. Copies/freezes affect only newly owned data. There is no mount effect that triggers analysis, so an explicit Load still invokes analysis once.

ReplayControls explicitly calls load() for the original demo, so the click event is never forwarded as graph input. Every map/table/event/history/summary component consumes the same controller.view.

The hook and Phase 5 presentation tests use React Testing Library with file-scoped jsdom annotations. The global test environment remains Node for domain/application tests.

See phase-4-evidence.md for the controller checks and reset/invalid-load demonstrations. Phase-5-evidence.md adds complete UI synchronization, browser captures, and invalid-load DOM clearing/recovery.
