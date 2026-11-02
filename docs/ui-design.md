# Presentation design

## One selected view

App.tsx is the composition root. It creates a stable AnalysisService with the Tarjan strategy, accepts an optional injected prepare service/original graph for integration tests, and calls useReplayController. Every page component receives the exact same ReplayView.

| Component | Visible responsibility |
| --- | --- |
| IslandMap | Resolve graph endpoints by node ID; draw islands/bridges from graph coordinates; apply selected snapshot states and current event focus. |
| ReplayControls | Native buttons with derived availability; explicit zero-argument load() callback; replay progress. |
| EventPanel | Current event number, human title, recorded message, typed numerical proof; clear EMPTY/READY/ERROR guidance. |
| EventProof | Format recorded values and outcomes without computing graph classifications. |
| EventHistory | Already-replayed ordered prefix with native details/summary expansion; retain all entries after completion. |
| NodeTable | ASCII-sorted IDs, full names, parent/discovery/low/status from the selected snapshot; em dashes for unset values. |
| SafetySummary | Snapshot component/critical IDs, provisional/final/unavailable distinction, and a proof from reached history. |

No component imports the analyzer or calculates low-link values. History expansion does not change the cursor or selected snapshot. A past entry is labeled as a recorded event so it is distinct from the current event panel.

## Map layout

Both responsive SVG layouts use the graph's original coordinates. Landscape maps (x, y) to (72 + 8.2x, 40 + 2.2y) in a 960 × 300 viewBox. Portrait maps it to (120 + 2.15y, 48 + 4.2x) in a 380 × 520 viewBox. This is an affine display projection; graph objects, adjacency order, traversal values, and history are never altered.

Edges resolve endpoint IDs through a lookup, independent of source-array ordering. Label orientation is normalized by endpoint ID. Name placement and diagonal bridge-label offsets reserve space for persistent badges. The original demo's full names fit; exceptionally long map names are shortened visually, with full names retained in SVG titles and the table.

The desktop dashboard has two columns: map/table and event/summary/history. At 1366 × 768 all eight table rows and the map/current event/summary fit together. History has a bounded keyboard-focusable scroll area. On small screens panels flow vertically: map, current event, summary, table, history. The portrait map keeps the demo's IDs and names readable without horizontal scrolling.

## State and accessibility

| Meaning | Additional indication beyond color |
| --- | --- |
| Unvisited island | Dotted marker outline and accessible unvisited state. |
| Current island | Separate outer ring and NOW badge. |
| DFS-tree edge | Solid line; accessible DFS-tree description. |
| Inspected non-tree edge | Dotted line; accessible non-tree description. |
| Uninspected edge | Longer dotted line; accessible uninspected description. |
| Critical bridge | Dashed line, ! prefix, and accessible critical description. |
| Articulation island | Separate ring and AP badge. |

Current focus is a separate overlay, so it never replaces a bridge/AP marker. The legend explains these symbols. Each SVG has a unique title/description pair; CSS hides the inactive responsive layout. Node/edge titles include IDs and state, and node titles include traversal values.

Native buttons and details/summary controls support keyboard operation. Focus outlines are visible. The page status and current event use polite live announcements; validation failures use an accessible alert with structured error identifiers and paths.

Startup/READY values remain unset. Incomplete empty findings say Not inspected or None detected yet and remain Provisional. Completed empty findings say None. ERROR removes map SVGs, the traversal table, event proof, findings counts/chips, and history, showing unavailable/error guidance instead.

## Verification boundary

React Testing Library checks accessible names, keyboard controls, SVG state attributes/styles, all 54 synchronized transitions, errors/recovery, repeatability, and selected numerical proof. Real Chrome checks cover the original demo at desktop and mobile sizes; actual screenshots and measurements are in phase-5-evidence.md. The layout does not implement a general collision-solving graph renderer for arbitrary custom coordinates.

## Optional animation and print presentation

Event entry fades/moves slightly over 220 ms; focus strokes settle over 320 ms. Short color transitions accompany map state changes. These are CSS effects with no timers, DFS calls, or cursor changes. The event live region stays mounted. Reduced-motion and print media disable animations.

SafetySummary provides Print summary, enabled only at completion. App also composes PrintSafetySummary with the same ReplayView. Its inline screen-hidden style keeps it out of the visible page; print CSS exposes it and hides the interactive dashboard. Final reports include sorted IDs, every recorded critical-item proof, and the final node table. Before completion or after failure/Reset it renders an incomplete notice without stale findings. Browser print/Save as PDF uses A4 styling; the original demo fits one page.

See [reliability and optional-feature evidence](reliability-and-optionals.md) for actual checks and captures.

## Visual refinement

The presentation now uses a restrained charcoal/green system with 4–5 px corners, no panel shadows, stronger secondary text, tabular numeric values, and consistent 2 px keyboard focus. The desktop inspector is one surface divided into current event, findings, and history sections. Mobile preserves the existing section order with larger touch targets.

The graph retains its original display projection, names, state patterns, focus overlays, and critical badges. Decorative waves/compass/shore layers were removed, and node/edge colors were refined for clarity. Current proof styling uses a quiet inset area and a single rule rather than another rounded card. Existing event handlers, models, replay, print, and reduced-motion behavior are unchanged.

See [the UI audit and verification](ui-polish-evidence.md) for checks, limitations, and current screenshots.
