# UI refinement verification

Date: 2026-11-02. Starting checkpoint: 40a265a. This change refines presentation in place.

## Audit and direction

The existing layout repeated rounded bordered panels, relied on several 9–11 px labels, boxed the current proof as another card, and included decorative waves/compass/shore layers around the graph. Functional controls also carried unnecessary decorative glyphs.

The refinement keeps the same application structure, panel order, island names, graph geometry, controls, event handlers, state models, and features:

- Use a consistent restrained charcoal/green palette with amber for focus/articulation and red for critical bridges.
- Group the desktop inspector into one flat surface with section dividers.
- Reduce corner radii to 4–5 px, remove panel shadows, and reserve a small shadow for the explanatory popover.
- Improve label/body type, numeric alignment, button states, keyboard focus, and table density.
- Simplify decorative SVG layers without removing state markers, IDs, descriptions, or numerical information.
- Position the current-focus badge away from names and edge IDs, with a portrait boundary clamp.
- Keep the brand compass compact and replace the marketing subtitle with a short description of the analysis.
- Preserve the existing brief animation, reduced-motion behavior, mobile ordering, and print stylesheet.

Production edits are limited to App.css, index.css, and small JSX presentation changes in App, IslandMap, EventPanel, and ReplayControls. No domain/application/data/controller code, tests, dependencies, configuration, or event-handler behavior changed.

## Regression checks

| Check | Actual result |
| --- | --- |
| npm.cmd run test:run | 303 tests passed in 13 files; 38.40 s initially, 13.36 s after the final focus-badge adjustment |
| npm.cmd run build | TypeScript/Vite production build passed |
| npm.cmd run lint | Oxlint passed without diagnostics |
| Scope check | Domain/application/data/controller, existing tests, dependency files, and test configuration unchanged |
| Git whitespace check | Passed |

No tests were weakened or added for styling details. The existing mathematical, immutable-history, controller, invalid-load, keyboard, printing, and integration assertions remain.

## Browser checks

Installed Chrome 156.0.8078.74 was used with a disposable local headless profile. The owned preview ran at http://127.0.0.1:5177/. No external publishing was performed.

| View | Verified behavior |
| --- | --- |
| 1366 × 768 desktop | Map, all eight table rows, current event, and summary fit together. Table ends at y=761; summary at y=634. History has an independent scroll area. |
| 390 × 844 mobile | Single-column layout, full graph labels, no horizontal overflow. |
| 320 × 760 small mobile | No horizontal overflow or measured name/bridge/badge text intersections; explanatory popover stays within x=55..295. |
| All 54 events in desktop and portrait layouts | 108 selected states checked; no name/bridge/badge text intersections or out-of-bounds island names. |
| Keyboard | Native Space activation loads/steps; focused Load has a visible 2 px outline. |
| History | Expanding event 21 shows 4 → 3 while the selected final index stays 53. |
| Reduced motion | Event/focus animations are none; map transition duration is zero. |
| Print | Same eight rows/seven proofs, one A4 page, dashboard hidden; print action preserves event index, history, and table. |
| Reset | Printable final values clear and an incomplete notice is shown. |

Required proofs remain unchanged: FE 4 → 3; DE 3 > 3 = false; D 3 ≥ 3 = true. No page/console errors were recorded in the browser walkthrough.

Measured contrast for selected tokens:

| Use | Foreground / background | Ratio |
| --- | --- | --- |
| Body | #26372c / #ffffff | 12.61:1 |
| Secondary | #5d7062 / #f4f6f3 | 4.88:1 |
| Primary button | #ffffff / #246b52 | 6.36:1 |
| Critical labels | #9d322a / #fff2ee | 6.56:1 |
| Articulation labels | #754f0c / #fff5dd | 6.72:1 |
| Graph names | #334c3e / #f8faf9 | 8.93:1 |
| Uninspected edge | #7e8f85 / #f8faf9 | 3.25:1 |

These measurements are selected token checks, not a complete accessibility certification. Body/label tokens exceed 4.5:1, and the uninspected connection exceeds 3:1. Existing accessible names, native control semantics, SVG descriptions, non-color state distinctions, and live-region behavior are preserved.

## Captures and evidence

- [Browser results](ui-polish-browser-results.json)
- [Desktop startup](screenshots/ui-polish/startup-desktop.png)
- [Desktop ready state](screenshots/ui-polish/ready-desktop.png)
- [Keyboard focus](screenshots/ui-polish/keyboard-focus-desktop.png)
- [F → E return](screenshots/ui-polish/return-F-E-desktop.png)
- [DE classification](screenshots/ui-polish/classify-DE-desktop.png)
- [D articulation](screenshots/ui-polish/articulation-D-desktop.png)
- [Desktop completion](screenshots/ui-polish/completed-desktop.png)
- [Mobile completion](screenshots/ui-polish/completed-mobile.png)
- [Small mobile completion](screenshots/ui-polish/completed-small-mobile.png)
- [Print layout](screenshots/ui-polish/completed-print.png)
- [Incomplete print notice](screenshots/ui-polish/incomplete-print.png)

Desktop/mobile completion and the focused D view were visually reviewed. The focused-state review exposed a NOW badge covering a name; its position was adjusted and all 108 selected states were checked again. Browser scope is Chrome with viewport emulation; physical devices, other browser engines, screen readers, and physical printers were not audited.
