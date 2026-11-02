# Actual Phase 3 implementation request

The user submitted the following prompt in this chat:

> Complete Phase 3 of my Treasure-Island Bridge Safety Map project.
>
> Project:
> C:\Users\UDAY\Documents\Codex\2026-11-02\x20\outputs\treasure-island-map
>
> Phases 1 and 2 are complete, with 149 passing tests. Preserve the agreed architecture and existing algorithm correctness.
>
> First read the project’s design, implementation plan, reference graph, and Phase 2 evidence documents.
>
> Goal:
> Extend the existing Tarjan analyzer to produce a deterministic, explanatory event history with immutable snapshots.
>
> Architecture constraints:
> - Keep graph analysis and replay models in the pure TypeScript domain layer.
> - Preserve the GraphAnalyzer Strategy interface and AnalysisService dependency injection.
> - Keep the analyzer independent of React.
> - Generate events during the existing DFS traversal.
> - Preserve all Phase 2 result fields and numerical behavior.
> - Keep replay controls and UI implementation in their later phases.
>
> Implementation:
>
> 1. Add typed ReplayEvent and TraversalSnapshot models.
>
> Each event must contain:
> - A deterministic event index.
> - A discriminated event type.
> - Relevant node/edge focus.
> - A readable explanation.
> - Typed numerical details and classification proofs.
> - The complete snapshot immediately after that event.
>
> 2. Instrument these events:
> COMPONENT_START
> DISCOVER
> INSPECT_TREE
> INSPECT_PARENT
> INSPECT_VISITED
> RETURN_CHILD
> CLASSIFY_EDGE
> ARTICULATION
> FINISH_NODE
> COMPONENT_END
>
> Inspect each undirected edge from both adjacency entries.
>
> After a child finishes, emit:
> RETURN_CHILD → CLASSIFY_EDGE → any newly detected ARTICULATION.
>
> Evaluate root articulation before FINISH_NODE. Document the exact emission rules, including unchanged low values and negative classification outcomes.
>
> 3. Extend AnalysisResult with:
> - initialSnapshot
> - events
> - finalSnapshot
>
> The initial snapshot must contain unvisited nodes, unset discovery/low values, uninspected edges, zero components, and empty critical summaries.
>
> finalSnapshot must reference the last event’s snapshot.
>
> 4. Make snapshots independent and deeply immutable at runtime.
> Copy and freeze nested records and arrays. Later traversal changes must never alter an earlier event.
>
> Include enough node and edge state for the future map, table, event panel, and summary to remain synchronized.
>
> Testing requirements:
> - Preserve all existing calculation assertions; adapt comparisons and mocks for the extended result.
> - Verify an exact event trace for a small graph.
> - Verify two inspections per undirected edge.
> - Verify numerical old/new low values.
> - Verify child completion precedes return and classification.
> - Verify strict bridge and non-root articulation equality rules.
> - Verify root child-count behavior and articulation deduplication.
> - Verify snapshots reflect only progress reached at that event.
> - Verify earlier snapshots cannot be mutated.
> - Verify identical serialized histories across repeated runs and shuffled inputs.
> - Verify coordinate independence and disconnected-component ordering.
> - Verify final snapshots agree with the independent reference table and results.
>
> Specifically demonstrate:
> - Return F → E changes low[E] from 4 to 3.
> - DE is not a bridge because 3 > 3 is false.
> - D is an articulation point because 3 >= 3 is true.
>
> Run the complete test suite, production build, and lint. Fix failures before declaring completion.
>
> Update the event-schema documentation, implementation plan, AI development record, and verification evidence with actual results. Save a Git checkpoint after successful verification.
>
> Finish by reporting what changed, test counts, check results, and the commit hash.
