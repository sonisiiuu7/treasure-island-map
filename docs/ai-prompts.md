# AI-assisted development record

Actual user messages and the assistant's implementation brief are recorded separately. No separate coding-tool session or unexecuted verification is claimed.

## Actual user requests

> so let's build phase 1.....tell me the exact steps to follow

The user subsequently installed the Vite React/TypeScript scaffold, Tailwind, Vitest, React Testing Library, and jsdom.

> what link i need to give you so that you complete phase 1 yourself?

The assistant found the existing local project and completed its Phase 1 code and checks.

## Assistant's implementation brief

The following constraints guided this implementation; this is a summary of the brief rather than a claim that it was submitted to another assistant:

- Follow the agreed lightweight Clean Architecture and five phases.
- Complete local models, graph data, validation, configuration, and focused tests.
- Keep domain code independent of React, rendering, and future replay state.
- Use readonly models and fresh graph objects.
- Validate unknown runtime input completely before exposing a typed graph.
- Return structured errors identifying affected fields and items.
- Enforce counts, IDs, names, finite coordinates, endpoints, self-loop rejection, and unordered connection uniqueness.
- Collect independent errors and safely skip checks with invalid prerequisites.
- Test boundaries, materially different failures, simultaneous errors, non-mutation, repeatability, and factory independence.
- Keep the hand-derived oracle outside production code.
- Preserve analyzer/replay/UI phase boundaries.
- Verify the installed Vitest suite, TypeScript/build, and Oxlint.

## Decisions

The validator uses new Sets/Maps on every call and exposes no graph on failure. Serialized sorted endpoint pairs avoid ambiguous keys for IDs containing hyphens or underscores. Every array slot is inspected, including holes in sparse arrays.

See [Phase 1 evidence](phase-1-evidence.md) for the original checkpoint.

## Phase 2 request and implementation

Actual user request:

> keep in mind the architecture and complete phase 2 with all the tests

The assistant implemented sorted adjacency, the GraphAnalyzer interface, a stateless Tarjan strategy, and AnalysisService using constructor injection. The service validates the complete graph before indexing or analysis and returns no graph/result on failure.

The implementation brief preserved the same ASCII ordering, global discovery clock, low-link rules, root distinction, original edge IDs, and domain/application boundaries discussed in the design. Replay instrumentation remains Phase 3.

Verification used the hand-derived reference table, focused equality/root/component/permutation tests, and an independent edge/node-removal oracle over all 1,099 small graphs with up to five nodes. All 58 new tests and the full 149-test suite passed; build and lint passed. See [Phase 2 evidence](phase-2-evidence.md).

## Phase 3 request and implementation

The actual user request began:

> Complete Phase 3 of my Treasure-Island Bridge Safety Map project.

The complete submitted prompt is preserved in [prompts/phase-3-request.md](prompts/phase-3-request.md).

The implementation kept calculation and replay values in the domain, preserved GraphAnalyzer and AnalysisService injection, and instrumented the existing DFS. AnalysisSummary keeps all earlier values; AnalysisResult adds initialSnapshot/events/finalSnapshot. Every snapshot owns copied and frozen records/arrays. Event payloads explicitly show negative outcomes and unchanged numerical updates.

All 149 original cases were retained, with summary projections and extended mocks preserving their exact numerical assertions. Forty-one new cases check exact traces, proofs, runtime mutation rejection, deterministic histories, and independent per-event transitions over all 75 simple graphs up to four nodes.

The first final build found one unused test type import. It was removed, and the full suite, build, and lint were rerun successfully: 190 tests passed, build passed, lint passed without warnings. See [Phase 3 evidence](phase-3-evidence.md). Replay reducer/controller/UI implementation remains in later phases.

## Phase 4 request and implementation

The actual user request began:

> Complete Phase 4 of my Treasure-Island Bridge Safety Map project.

The full submitted prompt is preserved in [prompts/phase-4-request.md](prompts/phase-4-request.md).

The implementation kept lifecycle state, reducer, and selectors in the application layer and React useReducer/callbacks in the presentation hook. The prepare service is injected through its narrow public method; existing domain algorithms and all 190 prior test assertions were preserved without source changes.

Graph copies protect original/reset data and capture successful values before React queues an action. One immutable ReplayView exposes only the selected snapshot and replayed history. StrictMode does not trigger analysis; only explicit load calls do.

The application gate passed 49 new tests, followed by 22 hook tests using file-scoped jsdom. All 261 tests passed together; build and lint passed without warnings. There were no implementation/test failures during this phase. The actual invalid-coordinate and duplicate-ID recovery checks, batched updates, and repeatability evidence are in [phase-4-evidence.md](phase-4-evidence.md).

## Phase 5 request and implementation

The actual request began:

> Complete Phase 5 of my Treasure-Island Bridge Safety Map project.

The complete submitted text is preserved in [prompts/phase-5-request.md](prompts/phase-5-request.md). This is the user's supplied implementation request, not a reconstructed prompt.

The implementation preserved the domain, application, and existing controller sources. App now composes the injected service/controller and passes one ReplayView to the native SVG map, controls, current event, expandable history, table, and safety summary. EventProof formats recorded typed values and outcomes without calculating traversal classifications.

The local-development guidance in the Sites skill was used for preview/check/teardown only. Work remained in the existing checkout; nothing was registered, uploaded, or published. No separate AI coding session or delegated implementation is claimed.

Twenty-two component cases and ten application cases were added. Existing test assertions were retained. The application test traverses all 54 events and compares every visible table row, edge state, current focus, findings, and history boundary against the selected snapshot. Two invalid-load scenarios use injected real validation failures after completion and verify stale output clearing followed by recovery.

Focused UI tests caught accessible-name issues in the SVG description and page heading; both were fixed. Browser review caught table height and map text collisions. Compact spacing, responsive coordinate projection, name placement, and bridge-label offsets were refined, then actual screenshots and geometry measurements were refreshed.

The local browser was driven with Chrome DevTools using Node's built-in WebSocket, without adding dependencies. A disposable headless profile was used after the default browser configuration failed in the restricted execution environment. Real browser Space input advanced Step. The recorded proofs show F → E at event 21, DE at 39, and D at 40; completion shows all expected final values and retains all 54 entries.

The final checks passed: 32 focused UI tests, 293 complete tests, production build, and lint. Desktop/mobile browser captures and machine-readable results are saved in [Phase 5 evidence](phase-5-evidence.md). Browser scope is Chrome plus viewport emulation, with error recovery tested in React integration. The [walkthrough](demo-walkthrough.md) explains local startup, the interview demonstration, architectural boundaries, and the AI assistance record.
