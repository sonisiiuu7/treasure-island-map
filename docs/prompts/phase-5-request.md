# Actual Phase 5 request

The following text was supplied by the user in the attached request.

```text
Complete Phase 5 of my Treasure-Island Bridge Safety Map project.

Project:
C:\Users\UDAY\Documents\Codex\2026-11-02\x20\outputs\treasure-island-map

Current checkpoint:
- Phases 1–4 are complete.
- All 261 tests pass.
- Build and lint pass.
- Latest local commit: 85b1d15.
- The graph engine, immutable replay history, reducer, selectors,
  and React controller are implemented and tested.

First read the design, implementation plan, reference graph,
event schema, replay-controller contract, and Phase 4 evidence.

Goal:
Build the complete browser interface so a festival volunteer can
inspect the island network, follow DFS, and explain why a bridge
or island is critical using visible numerical proof.

Architecture constraints:
- Preserve the existing domain and application layers.
- Keep GraphAnalyzer and AnalysisService dependency injection.
- Compose the service and useReplayController in the application root.
- All presentation components must consume the controller's ReplayView.
- Read traversal values and classifications from its selected snapshot.
- Keep calculations and replay transitions in their existing modules.
- Use React, TypeScript, Tailwind CSS, and native SVG.
- Keep the application local and frontend-only.

Implement these presentation components:

1. IslandMap
- Render every island and bridge using the original graph coordinates.
- Resolve endpoints by node ID.
- Show readable island IDs, names, and bridge IDs.
- Highlight the current event's relevant node and edge.
- Distinguish unvisited, current, DFS-tree, inspected non-tree,
  critical bridge, and articulation states.
- Use text, symbols, badges, or line styles in addition to color.
- Preserve critical markers when an item also has current focus.
- Include an understandable legend and accessible SVG description.
- Keep labels readable and inside the map at different screen sizes.

2. ReplayControls
Provide:
- Load My Archipelago
- Step
- Run to End
- Reset

Use the controller callbacks and derived control availability.
Call load() explicitly from the Load button so a click event is
not accidentally passed as graph input.

3. EventPanel and event history
- Show the current event number, explanation, focus, and numerical proof.
- Clearly display old/new low values and classification comparisons.
- Display the already-replayed history.
- Keep the full history inspectable after Run to End.
- Preserve synchronization with the selected snapshot.
- Handle startup and READY states clearly.

4. NodeTable
- Show ID, display name, parent, discovery, low, and traversal status.
- Sort rows by ascending ASCII node ID.
- Display unset values clearly.
- Use the selected snapshot rather than final analysis values.

5. SafetySummary
- Show component count and sorted bridge/articulation IDs.
- Clearly distinguish analysis in progress from completed results.
- An empty incomplete summary must not imply that the network is safe.
- Make at least one bridge result explainable directly from the screen,
  including its child low value and parent discovery value.
- Use only classifications and events already reached in the replay.

6. Application integration and visual design
- Replace the starter page with the actual application.
- Keep the map, current explanation, table, and summary visible together
  on a typical laptop; history may use its own scrollable area.
- Use a clean, readable festival/island visual theme with consistent
  spacing, typography, contrast, and visible keyboard focus.
- Support smaller screens without clipped labels or horizontal overflow.
- Display identifiable validation errors in an accessible alert.
- Clear stale map/table/event/summary content when the view is ERROR.
- Reset must restore the original unvisited graph and startup appearance.
- Update the browser title and project documentation.

Testing requirements:

Preserve all existing 261 tests.

Add meaningful component and full-application integration tests using
React Testing Library with file-scoped jsdom where appropriate.

Cover:
- Original map and startup state.
- Load prepares the history and shows unset initial traversal values.
- Step advances exactly one event and synchronizes every panel.
- Current node/edge highlighting and numerical explanations.
- Run to End displays the correct final table and critical items.
- Final history remains available for inspection.
- Reset restores the exact startup view.
- Repeated stepped and complete runs produce identical results/history.
- Invalid loads after completed analysis clear all stale visible output.
- Recovery after validation failure.
- Accessible names, button availability, and keyboard operation.
- Text/symbol/style distinctions for map states, beyond color.

Use dependency injection or a test harness to exercise invalid loads.
Keep developer-only testing controls out of the volunteer interface.

Explicitly verify these demonstrations:
- Return F → E changes low[E] from 4 to 3.
- DE is not a bridge because 3 > 3 is false.
- D is an articulation point because 3 >= 3 is true.
- Final bridges: CD, EG, GH.
- Final articulation islands: C, D, E, G.
- Final component count: 1.

Verification and handoff:
- Run focused UI tests and the complete regression suite.
- Run the production build and lint; fix failures.
- Verify the running application in a browser at desktop and small-screen sizes.
- Capture actual screenshots or browser-check evidence where tooling permits.
- Report exactly which checks were executed and any verification limitations.
- Update the README, implementation plan, actual AI prompting record,
  and final verification evidence.
- Include clear commands and a short interview demonstration walkthrough.
- Save a local Git checkpoint after successful verification.

Finish by reporting the completed interface, new and total test counts,
build/lint/browser results, local application URL, evidence locations,
and commit hash.
```
