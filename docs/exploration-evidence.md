# Graph exploration verification

Verification: 2026-11-02; record finalized 2026-11-03. Starting local checkpoint: 98dd794.

## Delivered changes

Selectable examples, single bridge/island closure comparison, clickable reached critical-item proofs, and a GitHub Actions quality workflow are implemented. The original analyzer, validator, service, replay reducer/selectors, controller, original graph factory, and all 303 existing test assertions remain unchanged.

## Automated checks executed

| Check | Result |
| --- | --- |
| Four focused new suites | 34 passed |
| npm.cmd run test:run | 337 passed in 17 files; 16.42 s initially and 51.65 s on the final run |
| npm.cmd run build | TypeScript/Vite passed |
| npm.cmd run lint | Oxlint passed |
| Git whitespace check | Passed |

New tests: ClosureSimulation 11, ExampleGraphs 9, CriticalProofSelectors 5, GraphExploration 9. These include every single removal over all 75 simple graphs with 1..4 nodes, comparing the independent connectivity method with Tarjan's critical sets.

Specific cases cover CD/DE/D, a leaf, the last island, already disconnected graphs, unknown targets, frozen independent results, permutations/coordinate independence, example semantics, future-proof prevention, keyboard selection, stale clearing/recovery, original Reset, printing, and unchanged replay/analysis-call counts.

## Browser verification

Chrome 156.0.8078.74 ran at 1366 × 768, 390 × 844, and 320 × 760, plus print media.

- Closing CD: 1 → 2; groups ABC and DEFGH.
- Closing DE: 1 → 1; all islands remain in one group.
- Closing D: 1 → 2; groups ABC and EFGH; CD/DE/DF are marked closed.
- Clicked D shows 3 ≥ 3 = true at recorded event 40 while the selected final index remains 53.
- Cycle/root/disconnected examples produce the expected summaries. Reset returns the original unvisited graph; Load My Archipelago reproduces its exact final table/history/print report.
- The original table, history, and print report stay unchanged across closures.
- Default desktop map/table/current-event/summary still fit in 768 px: table bottom 761, summary bottom 653.
- Mobile pages have no horizontal overflow; the 390 px popover spans x=78..378.
- All 240 replay states across four examples in both graph layouts, plus six closure layouts, have no measured name/bridge/badge text intersection or out-of-bounds island name.
- Print media hides the toolbar/exploration and retains eight rows/seven original proofs.
- Native keyboard input selected the cycle example, selected D's proof, chose CD using arrow keys, and closed the disclosure with Escape.
- Recorded page/console errors: zero.

[Browser measurements](exploration-browser-results.json)

Captures:

- [Completed desktop](screenshots/exploration/completed-desktop.png)
- [Selected D proof](screenshots/exploration/selected-D-proof.png)
- [CD closure](screenshots/exploration/EDGE-CD-desktop.png)
- [CD overlay with the popover closed](screenshots/exploration/CD-overlay-desktop.png)
- [DE closure](screenshots/exploration/EDGE-DE-desktop.png)
- [D closure](screenshots/exploration/NODE-D-desktop.png)
- [Cycle example](screenshots/exploration/cycle-desktop.png)
- [Root example](screenshots/exploration/branching-desktop.png)
- [Disconnected example](screenshots/exploration/disconnected-desktop.png)
- [Mobile closure](screenshots/exploration/closure-mobile.png)
- [Small mobile closure](screenshots/exploration/closure-small-mobile.png)
- [Print view](screenshots/exploration/completed-print.png)

The desktop CD and small-mobile closure captures were visually inspected. Coverage is Chrome with viewport emulation; no physical-device, cross-browser, screen-reader, or physical-printer audit is claimed.

## CI status

The quality workflow is configured for pushes, pull requests, and manual runs. Local tests/build/lint passed. No Git remote is configured and no GitHub repository was created or pushed, so hosted execution, npm ci on a clean hosted runner, and Linux behavior are not yet verified. No hosted green badge is claimed.
