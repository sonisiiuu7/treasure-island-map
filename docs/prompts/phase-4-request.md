# Actual Phase 4 implementation request

The user submitted the following prompt in this chat:

Complete Phase 4 of my Treasure-Island Bridge Safety Map project.

Project:
C:\Users\UDAY\Documents\Codex\2026-11-02\x20\outputs\treasure-island-map

Current checkpoint:
- Phases 1–3 are complete.
- All 190 tests pass.
- Build and lint pass.
- Latest local commit: 218f395.
- The analyzer produces deterministic events and deeply immutable snapshots.

First read the design, implementation plan, event schema, and Phase 3 verification evidence.

Goal:
Implement predictable Load, Step, Run to End, and Reset behavior using the prepared event history.

Preserve the existing architecture:
- Domain: graph validation, analysis, events, and snapshots.
- Application: replay state, pure reducer, and selectors.
- Presentation: useReplayController React hook.
- Preserve AnalysisService dependency injection.
- Keep map and component UI implementation in Phase 5.

Implementation:

1. Define replay state and actions.

Use a TypeScript discriminated union for:
EMPTY, READY, RUNNING, COMPLETED, ERROR.

Actions:
LOAD_SUCCESS(graph, result)
LOAD_FAILURE(errors)
STEP
RUN_TO_END
RESET

Keep a stable, independently owned original demo graph throughout the controller’s lifetime. Reset must restore this graph, including after a custom or invalid load.

2. Implement a pure replayReducer.

Required behavior:
- EMPTY: original unvisited graph preview; result null; cursor -1.
- LOAD_SUCCESS: store the prepared graph/history, clear errors,
  set cursor -1, and enter READY.
- STEP: advance exactly one event and derive the correct status.
- RUN_TO_END: select the final event from the existing history.
- COMPLETED: further Step/Run actions leave the final state unchanged.
- LOAD_FAILURE: atomically clear the current graph, analysis,
  history, and cursor; preserve identifiable validation errors.
- RESET: restore the original graph and startup state, clearing
  history, classifications, progress, and errors.
- STEP and RUN_TO_END are harmless in EMPTY and ERROR.

Keep validation and DFS outside the reducer.

3. Implement pure replay selectors.

Expose one ReplayView containing:
- Current graph.
- Selected snapshot.
- Current event and focus.
- Already-replayed history.
- Replay status and progress.
- Validation errors.
- Control availability.

At cursor -1 after loading, select initialSnapshot.
Otherwise select events[cursor].snapshot.

Expose only the already-replayed history prefix; retain the complete
prepared history internally. At completion, the entire history must
remain available for inspection.

All future UI panels must consume the same selected snapshot.
Final values must not appear before their corresponding events.

4. Implement useReplayController.

Use React useReducer and the injected analysis service.

Expose:
load(), step(), runToEnd(), reset(), and the derived ReplayView.

Load coordinates AnalysisService.prepare and dispatches either
LOAD_SUCCESS or LOAD_FAILURE.

Step, Run to End, Reset, and ordinary rerenders must never execute DFS.

Keep initialization pure and compatible with React StrictMode.
Preserve the original demo across rerenders and prevent caller-owned
graph mutations from changing Reset behavior.

Testing requirements:

Reducer:
- Initial state.
- Successful load and replacement load.
- Exactly one event per Step.
- Correct READY/RUNNING/COMPLETED transitions.
- Run to End from initial and intermediate positions.
- Safe completion clamping and invalid-state actions.
- Exact, repeatable, idempotent Reset.
- No mutation of previous state or prepared history.

Selectors:
- Initial and selected snapshot identity.
- Current event/focus consistency.
- History-prefix boundaries and full history at completion.
- No premature discovery values or critical summaries.
- Correct error view and control availability.

Controller:
- Use React Testing Library with a file-scoped jsdom environment.
- Verify loading invokes analysis once.
- Verify Step, Run, Reset, and rerenders do not invoke analysis.
- Verify behavior under StrictMode.
- Verify valid → invalid → valid recovery.
- Test at least two materially different invalid loads after
  completed analysis, confirming all stale visible output clears.
- Verify Reset restores the original demo after loading another graph.
- Verify a fully stepped run and Run to End reach identical results.
- Verify Reset, reload, and repeated runs produce identical histories.

Preserve every existing algorithm, validation, and event assertion.

Run focused tests, the complete regression suite, production build,
and lint. Fix failures before declaring completion.

Update the implementation plan, replay documentation, AI development
record, and verification evidence with actual results.

Save a local Git checkpoint after successful verification.

Finish by reporting what changed, new and total test counts,
check results, and the commit hash.
