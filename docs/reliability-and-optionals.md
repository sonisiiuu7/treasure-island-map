# Reliability repair and optional requirements

Date: 2026-11-02. Starting checkpoint: 63780c2. The domain, application, and existing controller behavior remain unchanged.

## Test reliability

The focused all-events test reproduced the default failure at 8,346 ms with a 5,000 ms limit. Caching accessible containers and scoping DOM queries reduced a focused run to 802 ms. Every original per-event table, map, focus, summary, history, FE/DE/D, and analysis-count assertion remains.

Query optimization alone did not make five seconds reliable under load: a full run still reported 5,725 ms. Two workers alone also proved insufficient on this machine (10,019 ms for synchronization and 9,310 ms for stepped/repeated comparison). The final setup therefore combines:

- Cached/scoped queries, including the repeated-step comparison.
- maxWorkers: 2 with normal test isolation.
- A bounded 20-second budget only on the two exhaustive full-replay cases.
- The normal five-second limit for every other test.

There are no skipped assertions/events, no global timeout increase, no disabled isolation, and no changes to algorithm calculations. The larger per-test budget is a wall-clock allowance for complete React/jsdom replay checks, not a performance claim about DFS.

## Executed final checks

| Command | Result |
| --- | --- |
| Focused component/application/print tests | 42 passed in 3 files |
| npm.cmd run test:run — final run 1 | 303 passed in 13 files; 50.40 s |
| npm.cmd run test:run — final run 2 | 303 passed in 13 files; 43.52 s |
| npm.cmd run build | TypeScript and Vite production build passed |
| npm.cmd run lint | Oxlint passed without diagnostics |

Both final regression runs used the normal command without diagnostic timeout or worker flags. The 303 cases include all 293 prior cases and 10 additions: seven printable-report cases, two application printing cases, and one motion/live-region case.

## Optional features delivered

Gentle replay animation uses 220 ms event entry and 320 ms focus settling. It does not add timers or advance the event cursor. Browser checks confirmed that the cursor remains at event 0 after the animation, and that prefers-reduced-motion disables animation and transitions. The live region remains mounted while its animated content changes.

Print summary is available after completion. It invokes the browser print dialog and reads the selected completed snapshot/history. The print-only report contains component count, sorted bridge/articulation IDs, all seven critical-item proofs, and all eight final table rows. It does not rerun DFS or change progress/history. Incomplete states, invalid loads, and Reset expose no stale report values.

Tests also cover a completed cycle with no critical items, sorted custom graph rows, the branching-root proof, keyboard printing, failure clearing, and Reset.

## Actual browser evidence

Chrome 156.0.8078.74 checked the app at 1366 × 768 and 390 × 844, plus print media at the A4 content width. Both screen layouts had no horizontal overflow or measured name/bridge/badge text overlap. The desktop table ends at y=758 and safety summary at y=657, inside the laptop viewport.

The required FE, DE, and D proofs remained correct. Clicking Print summary invoked printing once while event index 53, all 54 history entries, and the table stayed unchanged. The print report contained eight rows/seven proofs and generated one A4 PDF page. Reset removed the report values; direct printing then showed an incomplete notice. Recorded page/console errors: zero.

- [Machine-readable browser checks](optional-browser-results.json)
- [Desktop completed interface](screenshots/optional/completed-desktop.png)
- [Mobile completed interface](screenshots/optional/completed-mobile.png)
- [Print layout](screenshots/optional/completed-print.png)
- [Incomplete print notice](screenshots/optional/incomplete-print.png)
- [Example browser-generated report](safety-summary-example.pdf)

The screen and print-media captures were visually inspected. PDF page count was checked; an independent PDF rasterizer and physical printer were unavailable. No physical-device, cross-browser, or screen-reader audit is claimed.

## How to demonstrate

Load, step through the mathematical examples, and Run to End. Click Print summary and use the browser's Print or Save as PDF option. Canceling preserves replay. Reset restores startup. Enable reduced motion in system/browser preferences to suppress the brief visual effects.

The history-type filter in the prompt collection remains a proposed exercise; it is not one of the problem statement's optional requirements. Both stated optional requirements are complete.
