# Phase 4 verification evidence

Phase 4 implements replay state, reducer, selectors, graph ownership, and the injected React controller. Existing domain analysis and replay-event assertions were preserved without source changes.

## Focused application tests

Command:

```powershell
npm.cmd run test:run -- src/tests/replayReducer.test.ts src/tests/replaySelectors.test.ts
```

Actual result:

```text
Test Files  2 passed (2)
     Tests  49 passed (49)
```

- replayReducer.test.ts: 31 cases covering initialization/ownership, successful and replacement loads, exact Step transitions, Run to End, invalid/completed no-ops, atomic failures, error copying, Reset in all statuses, non-mutation, and absence of analyzer calls.
- replaySelectors.test.ts: 18 cases covering exact snapshot/event/focus identity, initial and replayed-prefix boundaries, no premature proof values/critical markers, completed retained history, error clearing, reset/replacement views, controls, and selector purity/immutability.

## Focused controller tests

Command:

```powershell
npm.cmd run test:run -- src/tests/useReplayController.test.tsx
```

Actual result:

```text
Test Files  1 passed (1)
     Tests  22 passed (22)
```

The hook file uses a file-scoped jsdom environment and React Testing Library renderHook/act. Explicit cleanup and mock restoration isolate cases. All other tests keep the existing Node environment.

Passing checks include:

- Zero prepare/analyze calls at startup.
- One prepare/analyze call per explicit valid load.
- No additional analysis during 54 Steps, Run to End, Reset, or ordinary rerenders.
- StrictMode purity and a single analysis call for each explicit load.
- Correct queued Load/Step ordering and caller mutation protection before React flushes.
- All stale visible graph/snapshot/event/focus/history/progress cleared after a completed run receives an invalid coordinate or a duplicate node ID.
- Identifiable errors for those two materially different invalid cases.
- Valid -> invalid -> valid recovery, with analysis called twice across three prepare calls.
- Original graph restored after custom loads, caller edits, and changed props.
- Replacement injected service used only at the next load.
- Unexpected service exceptions propagate without corrupting the committed view.
- A stepped run and two Reset/reload/Run cycles produce identical full serialized histories and final snapshots, using exactly three analyses for three loads.

## Full regression

Command: npm.cmd run test:run

Actual result:

```text
RUN v5.0.5
Test Files  10 passed (10)
     Tests  261 passed (261)
```

This contains all 190 existing cases plus 71 new Phase 4 cases. The earlier 1,099-graph safety oracle and 75-graph event-transition checks remain part of the passing suite.

## Build and lint

npm.cmd run build exited with status 0: strict TypeScript checking and Vite 8.3.5 production build succeeded.

npm.cmd run lint exited with status 0: Oxlint completed without warnings.

All focused tests, the full suite, build, and lint passed without implementation/test fixes in this phase. No dependency additions or Vite test-environment configuration changes were required.

## Scope

The public replay controller and its headless DOM integration tests are complete. The user-facing SVG map, buttons/panels, and manual browser demonstration remain Phase 5. The Vite page continues to show its starter UI until that integration.

See replay-controller.md for the action, selector, ownership, and StrictMode contracts.
