# Interview discussion and evidence guide

Use this guide to explain the actual system and rehearse follow-up questions. The answers describe implemented behavior; they are study material, not a record that an interview or live modification has already occurred.

The [prompt portfolio](prompts/refined-engineering-prompts.md) contains refined implementation prompts. The [development record](ai-prompts.md) connects decisions to observed results.

## Opening explanation

Suggested wording to adapt after reviewing the code:

> The main correctness risk was explaining DFS while keeping every visible
> panel at the same point in time. I separated graph analysis from replay:
> Load validates and performs one deterministic traversal, recording typed
> events with immutable post-event snapshots. A pure reducer then moves an
> event cursor. All React panels render the same selected view. AI assisted
> the implementation and documentation; correctness checks include a graph
> removal oracle, exact traces, state-transition tests, and browser review.

Follow this with the visible FE/DE/D demonstration. Explain the numbers before discussing patterns.

## Questions about LLD

| Interviewer question | Defensible answer and code to inspect |
| --- | --- |
| Why an analyzer interface for one implementation? | It isolates the calculation contract from orchestration and permits injected test strategies. Inspect AnalysisService and GraphAnalyzer. It does not justify an interface for every helper. |
| Where is dependency injection? | App constructs TarjanLowLinkAnalyzer and supplies it to AnalysisService; the hook receives only the public prepare capability. Inspect App.tsx and useReplayController.ts. |
| What makes a replacement analyzer valid? | It must preserve ordering, numerical results, event semantics, and snapshot ownership. Type compatibility and matching final bridge IDs alone are insufficient. |
| Why a reducer? | Replay has explicit transitions with invalid-state/no-op behavior and atomic failure clearing. Pure tests can exercise those transitions without mounting React. |
| Do types prevent every invalid state? | The union prevents combinations such as ERROR carrying a prepared result and fixes READY at -1; runtime reducer logic enforces numeric cursor bounds. |
| Why copy and freeze? | readonly is compile-time protection. Copying separates ownership; freezing rejects runtime writes to captured nested values. A freeze alone can retain shared references or freeze caller data. |
| Why no backend or global store? | The calculation is local, bounded, and owned by one controller. These dependencies are not needed for the required workflow. |

For concrete relationships and lifecycles, use [the UML and sequence diagrams](design.md) and [the replay contract](replay-controller.md).

## SOLID mapped to implementation

| Principle | Concrete application | Limit to explain |
| --- | --- | --- |
| Single Responsibility | Validator checks input, builder constructs adjacency, analyzer calculates/emits, reducer transitions, components render. | A file per function is not the goal; keep reasons to change separate. |
| Open/Closed | A behaviorally compatible analyzer can be supplied without modifying AnalysisService or presentation panels. | The composition root still chooses the implementation; a new event contract may require consumers to change. |
| Liskov Substitution | An analyzer substitute must preserve deterministic ordering, numerical/event semantics, and immutable snapshot behavior. | TypeScript structural compatibility alone cannot establish those properties. |
| Interface Segregation | GraphAnalyzer exposes analyze; the hook accepts only the service's prepare capability. | Do not force simple helpers into interfaces without a useful consumer/substitution need. |
| Dependency Inversion | Application orchestration refers to GraphAnalyzer; App wires in the concrete Tarjan strategy. | Dependency injection is the wiring mechanism; the abstraction dependency is the design principle. |

Use pattern names precisely. The demo factory is a function returning fresh values, not a class-based Factory Method hierarchy. Reducer actions are Command-inspired, not a full GoF Command implementation. The immutable replay history is not a durable event-sourcing system with persistence, versioning, and recovery guarantees.

## Questions about the algorithm

**Why does a visited connection use discovery[neighbor]?** That edge reaches the neighbor directly. Its propagated low value describes an additional path computed elsewhere and is not the contracted contribution of this inspection. Inspect the dedicated two-cycle test, not only the final demo result.

**Why is DE not a bridge while D is an articulation?** F can return to D, so E's subtree reaches D and DE has an alternate D–F–E route. It does not reach an ancestor of D. Removing DE preserves that loop; removing D separates the E/F/G/H side from A/B/C. The values are low[E] = discovery[D] = 3.

**Why is A not an articulation when it has two neighbors?** Sorted DFS enters B, and C is discovered through B. A has one DFS-tree child, although its graph degree is two. A root needs at least two tree children.

**What changes with parallel edges?** The current validator rejects them, making parent-ID skipping sufficient. Supporting them would require identifying the parent edge and revisiting adjacency, inspection, and classification contracts; changing only the validator would be unsafe.

**What is the actual complexity?** The DFS core is O(V+E). Sorting adjacency adds overhead. Storing K full snapshots needs O(K(V+E)) copied data, plus snapshot sorting/freezing work. Intermediate selectors copy a history prefix. The whole application should not be described as linear-space DFS.

Recompute the [reference table](reference-graph.md) yourself, especially F → E, DE/D, and root A, before giving these explanations in your own words.

## Questions about AI and verification

**How were AI-generated results checked?** The final IDs are compared against an edge/node-removal flood-fill oracle, which does not use Tarjan's low-link rules. All 1,099 labeled simple graphs across node-set sizes 1..5 are enumerated within a test. Exact numerical traces and history checks address correctness that component counts alone cannot establish.

**Did AI assistance introduce any problems?** The recorded iterations include an unused type import, accessible-name defects, and browser layout collisions. Their corrections and verification are documented. Do not claim that an incorrect bridge inequality was found in production; that is a risk covered by focused tests, not a recorded defect.

**What is still unresolved?** The later audit reproduced a five-second timeout in the 54-event integration test. All 293 cases passed with a 15-second limit and one worker, while build/lint passed. The default command still needs a permanent reliability fix. Report that qualification rather than substituting the historical checkpoint result.

**What was your contribution versus AI's?** State the collaboration accurately: requirements and staged requests were supplied through the conversation; the assistant helped draft detailed prompts, implement code/tests/docs, and execute checks. Explain the decisions and evidence you have personally reviewed. Do not claim that AI-assisted artifacts were written independently by hand.

## Presentation pacing

| Portion | Suggested time | Material |
| --- | --- | --- |
| Problem, plan, and constraints | 2 minutes | Five checkpoints, main graph, bounded local engine. |
| Working demo and mathematical proof | 4 minutes | Startup, Load, Step, FE at 21, DE at 39, D at 40, completion/history/Reset. |
| LLD, ownership, and trade-offs | 3 minutes | Dependency direction, Strategy, reducer, one view, snapshot cost. |
| AI decisions, iterations, and verification | 2 minutes | Refined prompts versus submitted requests; independent oracle; actual corrections and current timeout qualification. |

This leaves the rest of a 30–40 minute session for discussion and requested modifications. Keep the presentation selective rather than reading every document or prompt aloud.

## Live modification practice

Rehearse the proposed history-type filter in the portfolio on a separate checkpoint when ready. Before editing, identify the owner of the state and write the invariants that must survive. After editing, demonstrate behavior, inspect the diff, run focused tests, and explain any remaining verification limits.

The candidate should be able to identify the correct layer before asking AI for code, review the generated diff, and explain the effect of each change. A practiced example helps establish the workflow but does not predict the interviewer's requested modification.

For launch commands and the exact event walkthrough, use [the demo guide](demo-walkthrough.md).
