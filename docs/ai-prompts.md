# AI prompting strategy and engineering decisions

The development approach separated runtime validation, deterministic graph analysis, explanatory history, replay state, and rendering into five checkpoints. AI assistance contributed to implementation, tests, documentation, and prompt drafting. The engineering controls were explicit contracts, independent correctness checks, preserved regression assertions, and review of the running interface.

Use the [refined engineering prompt portfolio](prompts/refined-engineering-prompts.md) to present this approach. Its prompts are retrospective refinements written during interview preparation, not verbatim records of earlier submissions. They replace the basic request excerpts in this presentation document. The detailed submitted [Phase 3](prompts/phase-3-request.md), [Phase 4](prompts/phase-4-request.md), and [Phase 5](prompts/phase-5-request.md) requests remain available as source records.

## Tools and contribution

The development conversation used the OpenAI assistant and the Codex desktop workspace. Local commands inspected and changed the repository, ran Vitest, TypeScript/Vite, and Oxlint, and saved Git checkpoints. React Testing Library and jsdom exercised the React components. A disposable Chrome profile controlled through DevTools supplied actual browser screenshots and measurements.

The AI assistance was substantial: it helped articulate architecture, implement code, propose and implement tests, investigate failures, and prepare supporting documentation. The prompt portfolio is also AI-assisted. No use of GitHub Copilot, Claude, another coding assistant, or an external coding session is claimed.

The independently structured oracle is independent of the production algorithm: it removes edges/nodes and recounts components with flood fill. This is a different verification method, not a claim that its code or the reference table was created without AI assistance.

## Prompting method

Each implementation prompt should establish six things:

1. **Current context:** existing contracts, source documents, completed checkpoint, and regression assertions to preserve.
2. **Responsibility boundary:** which layer owns the change and which dependencies are permitted.
3. **Observable invariants:** numerical rules, ordering, ownership, and error behavior that determine correctness.
4. **Failure examples:** a concrete counterexample that would expose a plausible incorrect implementation.
5. **Verification:** checks whose expectations do not simply repeat the implementation.
6. **Completion evidence:** actual command results, limitations, documentation updates, and the local checkpoint.

A prompt is useful when it constrains an observable behavior. Naming a design pattern alone does not establish that behavior. For example, dependency injection is supported by AnalysisService accepting GraphAnalyzer and by tests that inject a substitute and confirm invalid input never reaches it.

## Phase decisions and evidence

| Phase | Engineering concern expressed in the prompt | Concrete result and evidence |
| --- | --- | --- |
| 1 — contracts and validation | Treat runtime input as unknown; expose Graph only after complete validation; identify errors without mutating caller data. | Readonly graph models, fresh demo factory, structured ValidationResult; [91 tests](phase-1-evidence.md). |
| 2 — low-link analysis | Sort IDs explicitly; separate DFS rules from layout; inject the analyzer; distinguish strict bridge and non-root articulation comparisons. | Sorted adjacency, stateless Tarjan strategy, AnalysisService; [58 new tests and removal-based oracle over 1,099 graphs](phase-2-evidence.md). |
| 3 — event semantics | Generate explanations during DFS; define event order; freeze independent post-event snapshots; preserve previous numerical results. | Typed events, immutable snapshots, exact traces and transition checks; [41 new tests](phase-3-evidence.md). |
| 4 — replay lifecycle | Model valid states with a discriminated union; move only a cursor; preserve an owned original graph; clear failures atomically. | Pure reducer/selectors and injected React hook; [71 new tests](phase-4-evidence.md). |
| 5 — synchronized presentation | Give every panel one selected ReplayView; render recorded proof; distinguish provisional findings; preserve critical and current markers together. | Native SVG and React panels, all-event integration checks, real browser captures; [32 new tests](phase-5-evidence.md). |

The original five-phase gates reached 91, 149, 190, 261, and 293 tests respectively. These are historical checkpoint results. Current verification qualifications appear below.

## LLD choices that can be defended

**Responsibility and dependency direction.** Domain code owns graph validation/indexing, DFS, and event/snapshot models. Application code owns preparation and replay transitions/selectors. Presentation composes the concrete service and renders the selected state. Domain modules import no React/application/test code.

**Strategy and Dependency Inversion.** AnalysisService receives GraphAnalyzer rather than constructing TarjanLowLinkAnalyzer. App selects the concrete strategy. A replacement must preserve the documented ordering, numerical values, event contract, and snapshot semantics; a matching TypeScript signature is not sufficient behavioral substitutability.

**Small interfaces and ordinary functions.** GraphAnalyzer needs one analyze method. The React hook needs only the service's prepare method. Validation and adjacency construction stay functions because separate interface hierarchies would add little value here.

**State modeling.** EMPTY/READY/RUNNING/COMPLETED/ERROR encode the replay lifecycle. ERROR carries errors and no current graph/result; READY fixes the cursor at -1. The discriminant constrains data combinations, while reducer logic maintains active cursor bounds. It does not make arbitrary numeric cursor values impossible at the type level.

**Ownership.** readonly protects TypeScript callers at compile time. Copies and nested Object.freeze calls protect captured graph/snapshot values at runtime. The reducer and hook capture successful graph values at their boundaries; Reset always uses the saved original. The validator itself returns valid input by reference and does not freeze caller-owned objects.

See [the architecture and UML](design.md) and [the replay contract](replay-controller.md) for the actual implementation boundaries.

## Algorithm reasoning behind the prompts

For tree parent u and child v, low[v] > discovery[u] means v's subtree cannot return to u or an ancestor without the tree edge. Removing that edge therefore disconnects it.

Equality has a different consequence for a non-root articulation: low[v] = discovery[u] permits a route back to u, but no route to an ancestor of u. Removing u still separates that subtree. A root requires at least two DFS-tree children; graph degree is not the test.

The demo makes this visible. F reaches D, propagating low[F] = 3 back to E, so low[E] changes 4 → 3. DE lies in the D–E–F loop and is not a bridge: 3 > 3 is false. D is still an articulation: 3 >= 3 is true. Root A has graph degree two but one DFS-tree child, so it is not an articulation.

The [reference graph](reference-graph.md) and focused tests make these explanations checkable. Production code never imports that oracle.

## Trade-offs and limits

| Decision | Reason in this project | Cost or extension boundary |
| --- | --- | --- |
| Recursive DFS | Direct mapping to discovery, child completion, return, and classification; recursion depth is bounded by 12 nodes. | A substantially larger engine may need an explicit stack. |
| Complete immutable event snapshots | Every panel can select the same already-computed state; earlier history cannot be overwritten. | O(K(V+E)) copied snapshot data for K events, plus sorting/freezing overhead. This is not an O(V+E)-space history implementation. |
| Sorted adjacency | Stable traversal regardless of source order, names, or layout. | Sorting adds work beyond the O(V+E) DFS core. |
| Precompute on Load, replay by cursor | Step/Run/Reset/rerenders never execute DFS. | Upfront preparation and stored history; intermediate selectors also copy a history prefix. |
| Native SVG and local React state | Small fixed graph, accessible text/line patterns, no external map service, and no global store required. | The responsive demo layout is not a general graph-label collision solver. |

## Actual iterations

These are observed development changes, not invented examples of AI mistakes.

| Observation | Response | Evidence |
| --- | --- | --- |
| The initial UML validation argument was too narrow for runtime input. | Implement validation(input: unknown) with a typed success result. | [Plan refinement](implementation-plan.md) and validator tests. |
| Phase 3's first final build found an unused test type import. | Remove the unused import and rerun the checks. | [Phase 3 evidence](phase-3-evidence.md). |
| UI tests exposed SVG/page accessible-name defects. | Separate SVG title/description associations and provide the intended page heading name. | [Phase 5 evidence](phase-5-evidence.md). |
| Browser review exposed table height and map text collisions. | Tighten spacing and refine display projection/name/edge-label placement; refresh actual captures. | [Browser results](browser-check-results.json) and screenshots linked from Phase 5 evidence. |
| The later requirements audit found a five-second timeout in the exhaustive 54-event UI test. | Reproduce it alone, then diagnose with a larger timeout and one worker. A permanent fix remains pending. | Commands and results below. |

The last audit obtained 292 passes and one timeout with the default suite; the focused 54-event test also exceeded five seconds. The diagnostic command below passed all 293 tests in 12 files:

```cmd
npm.cmd run test:run -- --testTimeout=15000 --maxWorkers=1
```

Build and lint passed in that audit. The diagnostic run does not establish that the default timeout issue has been fixed. This documentation revision changes no tests or application behavior. The [verification repair prompt](prompts/refined-engineering-prompts.md#verification-review-prompt) is a proposed next task.

## Presenting the work

Use the [interview discussion guide](interview-discussion.md) to connect each claim to code and evidence. Explain the AI contribution clearly, recompute the numerical examples yourself, and rehearse a focused change before describing yourself as ready for live modification. The refined live-change prompt is a rehearsal aid; it is not evidence that such a change has already been performed.
