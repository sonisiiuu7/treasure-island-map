# Phase 5 verification evidence

Date: 2026-11-02. Starting local checkpoint: 85b1d15 (261 passing tests). This phase implements the complete local frontend and retains the existing domain/application/controller sources and all prior tests.

## Delivered behavior

App composes the injected service and controller. IslandMap, ReplayControls, EventPanel, EventHistory, NodeTable, and SafetySummary consume one ReplayView. EventProof renders recorded numerical details. The SVG map has coordinate-derived responsive layouts, endpoint-ID resolution, persistent critical markers plus focus overlays, a legend, and accessible descriptions.

The interface supports startup, READY, one-event Step, Run to End, complete expandable history, original-demo Reset, accessible validation errors, clearing of stale content, and recovery. It contains no developer testing controls or external service integration.

## Automated checks executed

| Check | Actual result |
| --- | --- |
| Focused UI: npm.cmd run test:run -- src/tests/PresentationComponents.test.tsx src/tests/App.test.tsx | 32 tests passed in 2 files |
| Full regression: npm.cmd run test:run | 293 tests passed in 12 files |
| Production: npm.cmd run build | TypeScript and Vite build passed |
| Lint: npm.cmd run lint | Oxlint passed, no diagnostics |
| Git whitespace check | git diff --check and staged equivalent passed |
| Documentation integrity | Local links, all five Mermaid source/block pairs, and the exact submitted request copy passed |

The full gate was also run as npm.cmd test -- --run, which invokes the same Vitest runner. The final checks were repeated after the responsive label adjustments.

| Suite added in Phase 5 | Tests |
| --- | --- |
| PresentationComponents.test.tsx | 22 |
| App.test.tsx | 10 |
| New total | 32 |
| All prior cases retained | 261 |
| Full total | 293 |

Component cases cover accessible map descriptions, both layouts, endpoint reversal, styles/symbols, persistent critical/focus composition, sorted/unset table values, current explanations, root outcomes, provisional/final summaries, reachable proofs, expandable history, unavailable views, and callback availability.

Application cases cover startup without analysis; Load/Step progress without future-result leakage; **every one of the 54 events** against the selected snapshot across table/map/findings/focus/history; final independent reference values; Reset; stepped versus complete repeatability; keyboard controls; StrictMode; and two invalid loads after completed analysis followed by valid recovery. Invalid cases are a coordinate outside bounds and a duplicate node ID. They use dependency injection and real validator failure results; all stale SVG/table/proof/findings/history are absent.

All earlier assertions remain unchanged, including the removal-based oracle over all 1,099 simple graphs with up to five nodes and event-transition checks over 75 graphs with up to four nodes.

## Required numerical demonstrations

Visible event numbers are one-based; domain indexes are zero-based.

| Visible event | Domain index | Proof observed in tests and Chrome |
| --- | --- | --- |
| 21, RETURN_CHILD F → E | 20 | low[E] changes 4 → 3; min(4, low[F] = 3) = 3. |
| 39, CLASSIFY_EDGE DE | 38 | 3 > 3 = false; DE remains a DFS-tree edge. D has not yet received its AP marker. |
| 40, ARTICULATION D | 39 | 3 ≥ 3 = true; D's articulation marker appears alongside focus. |
| 54, completion | 53 | Bridges CD/EG/GH, articulation islands C/D/E/G, component count 1, complete history of 54 events. |

The final table agrees with reference-graph.md: A 0/0, B 1/0, C 2/0, D 3/3, E 4/3, F 5/3, G 6/6, H 7/7 for discovery/low. Parent IDs agree as well. The summary directly explains critical bridge CD with 3 > 2 = true.

## Actual browser verification

A local Vite server ran at http://127.0.0.1:5175/. Installed Chrome **156.0.8078.74** was controlled through its DevTools protocol, using a disposable headless test profile. Screenshots are actual browser captures.

The workflow loaded the app, activated Step with a real browser Space key event, stepped through all required numerical demonstrations, ran to completion, captured desktop/mobile layouts, and reset. Recorded page/console errors: **0**.

| Measurement | Desktop | Mobile emulation |
| --- | --- | --- |
| Viewport | 1366 × 768 | 390 × 844 |
| Document width | 1351 (vertical scrollbar) | 390 |
| Horizontal overflow | None | None |
| Island-name bounds outside SVG | None | None |
| Island-name intersections with names/bridge labels/badge text at completion | None | None |
| Bridge-label text intersections with badge text at completion | None | None |

At desktop completion, the map ends at y=501, all eight table rows at y=758, current event at y=377, and summary at y=651. These primary panels fit together inside the 768-pixel viewport. History begins at y=664 and has its own scroll area. Mobile panels flow vertically and the document can be scrolled normally.

Reset returned EMPTY, zero history entries, and unset discovery/low values for every original node. Accessible-name and all-control keyboard tests were also executed in jsdom. The browser check itself confirms Space activation of Step.

Saved evidence:

- [Machine-readable browser results](browser-check-results.json)
- [Desktop startup](screenshots/startup-desktop.png)
- [F → E low update](screenshots/return-F-E-desktop.png)
- [DE negative bridge classification](screenshots/classify-DE-desktop.png)
- [D articulation proof](screenshots/articulation-D-desktop.png)
- [Desktop completion](screenshots/completed-desktop.png)
- [Mobile completion, full page](screenshots/completed-mobile.png)
- [Mobile Reset/startup, full page](screenshots/startup-mobile.png)

During verification, focused tests exposed SVG/page accessible-name issues; these were corrected. Browser review exposed a table extending below the laptop viewport and text collisions near badges/bridge labels. Spacing and display projection/label offsets were adjusted, the browser workflow was rerun, and these captures/measurements reflect the final layout.

## Scope and reproducibility limits

Real-browser checks use the original demo in Chrome and mobile viewport emulation. They do not establish physical-phone, cross-browser, screen-reader, or arbitrary-coordinate collision coverage. Error clearing/recovery is exercised through React integration tests rather than volunteer-facing browser testing controls. The disposable browser required a local headless configuration with its native sandbox disabled in this restricted environment.

No external publishing or GitHub upload occurred. The owned test browser/server are stopped after verification. Start the local app with the commands in README.md or [the interview walkthrough](demo-walkthrough.md). The local Git checkpoint can be identified with git log -1 --oneline.
