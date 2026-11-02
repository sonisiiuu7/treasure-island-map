# Engineering prompt portfolio

These prompts translate this project's requirements into implementation contracts. They were refined during interview preparation and are not verbatim historical submissions. Implementation outcomes and observed failures are recorded separately in [the development record](../ai-prompts.md).

Use each prompt with the repository and its current evidence available. A proposed task or repair is not a completed result.

## Planning and LLD prompt

```text
Read the problem statement and existing repository before implementation.
Translate every mandatory acceptance criterion into an observable behavior,
the layer that owns it, and a verification method.

Propose a five-step plan: contracts/validation, deterministic DFS, explanatory
history, replay lifecycle, and presentation. Give each step a reviewable
contract and a test gate before proceeding.

Use React, TypeScript, Vite, Tailwind CSS, native SVG, useReducer, Vitest, and
React Testing Library. Keep execution local. Separate pure domain logic,
application orchestration/state, and presentation.

Design the smallest useful abstractions. GraphAnalyzer is a Strategy with one
analyze method; AnalysisService receives that interface through its
constructor. App is the composition root. Keep helpers as functions where an
interface provides no useful substitution boundary.

Produce UML for domain/service contracts and replay responsibilities, plus
Load/failure and Step/Run/Reset sequences. Distinguish dependency direction,
data ownership, and control flow. Explain which SOLID principles these
boundaries support and what behavior a substitute analyzer must preserve.

Identify the central risks: wrong equality rules, layout-dependent traversal,
mutable historical state, future-result leakage, stale output after failure,
and Reset restoring the most recently loaded graph rather than the original.

Before coding, explain the complexity and trade-offs of recursive DFS,
sorted adjacency, and full snapshots under the 12-node/20-edge limit.
```

**Discussion point:** A narrow Strategy and a composition root establish a concrete substitution boundary. Pattern names should describe those dependencies, not create extra classes.

## Phase 1 prompt for runtime contracts and validation

```text
Implement the runtime graph boundary before traversal or UI.

Define readonly Island, Bridge, and Graph models. Accept unknown in the
validator; return a discriminated success with a typed Graph or failure with
structured errors. Include code, field path, and identifiable item/endpoint
where available. Do not mutate or freeze caller data in validation.

Enforce 1..12 nodes, 0..20 edges, ID pattern [A-Z][A-Z0-9_-]{0,15},
non-whitespace names, finite numeric x/y in [0,100], unique IDs within each
collection, existing distinct endpoints, and no repeated unordered pair.

Collect independent errors, but perform dependent checks only when their
prerequisites are valid. Handle malformed objects, non-arrays, sparse entries,
NaN/Infinity, and reversed duplicate connections. Use an unambiguous pair key:
joining endpoint IDs with a legal ID separator can create collisions.

Create a fresh deterministic demo with eight named islands and nine edges,
two cycles, exposed branches, and non-root articulation behavior. Keep the
reference adjacency/table in docs and tests; never import it into production.

Verify boundary values, malformed input, multiple errors, stateless repeated
calls, caller non-mutation, and independent graph factory objects. Complete
this gate without coupling validation to React or traversal.
```

**Discussion point:** TypeScript interfaces do not validate runtime input. Validation ownership is also different from the copying/freezing required when replay captures values.

## Phase 2 prompt for deterministic low-link analysis

```text
Implement analysis behind GraphAnalyzer, preserving the validation boundary.

Build adjacency by endpoint ID, insert both undirected directions, preserve
original edge IDs, include isolated nodes, and sort roots/neighbors by ASCII
node ID. Never mutate source arrays. Layout/name/array order must have no
effect on traversal values.

Use one zero-based clock across all components. On discovery set
discovery[u] = low[u] = clock, then increment it. After completing tree child
v, use low[u] = min(low[u], low[v]). For a visited non-parent neighbor w,
use discovery[w], not low[w]. Parent-ID skipping is valid because graph
validation rejects parallel edges.

Classify u-v as a bridge iff low[v] > discovery[u]. A non-root u is an
articulation iff some child satisfies low[v] >= discovery[u]. A root instead
requires at least two DFS-tree children. Explain these rules before coding.

Use DE/D as an equality counterexample and root A as a degree-versus-child
counterexample. Verify F-D propagates low[F] = 3 and then low[E] = 3.

AnalysisService must validate completely, build adjacency, and invoke its
injected strategy only on success. Working data and the clock are per call.
Sort final critical IDs by ASCII while retaining traversal order separately.

Check the independent reference table, reversed/seeded input permutations,
cycle-only/path graphs, visited-neighbor propagation, and a combined
branching-root/disconnected/isolated-node case. Add a structurally different
flood-fill oracle that removes each edge/node and compares component counts.
Do not copy Tarjan conditions into the oracle.
```

**Discussion point:** The strongest evidence is agreement with a different method, supplemented by tests that distinguish two superficially similar inequalities.

## Phase 3 prompt for explanatory history and ownership

```text
Extend the existing DFS without changing any calculated result or adding a
second explanatory traversal. Preserve GraphAnalyzer and service injection.

Define ReplayEvent as a discriminated union with contiguous index, typed
details, focus, explanation, and a complete snapshot immediately after the
event. Define discovery/low as unset until discovery, not as final values
hidden behind a visual style.

Emit COMPONENT_START, DISCOVER, INSPECT_TREE, INSPECT_PARENT,
INSPECT_VISITED, RETURN_CHILD, CLASSIFY_EDGE, ARTICULATION, FINISH_NODE,
and COMPONENT_END deterministically. Inspect each undirected adjacency entry.

After a child finishes, emit RETURN_CHILD -> CLASSIFY_EDGE -> a newly
detected non-root ARTICULATION. Evaluate root child count before FINISH_NODE.
Document unchanged low updates, false classifications, and articulation
deduplication rather than emitting only positive findings.

Preserve the original numerical result fields; add initialSnapshot, events,
and finalSnapshot, with finalSnapshot identical to the last event snapshot.
Copy and freeze every nested record/array. readonly and a shallow freeze do
not protect an earlier event from later working-state mutation.

Verify a hand-derived one-edge trace, two inspections per edge, child
completion order, old/new values, progress-only snapshots, runtime mutation
rejection, repeated serialized histories, and shuffled/coordinate-independent
histories. Explicitly prove F -> E changes 4 to 3, DE has 3 > 3 = false,
and D's subsequent articulation event has 3 >= 3 = true.

State the snapshot storage/copying cost separately from the linear DFS core.
```

**Discussion point:** An accurate final answer does not prove an accurate explanation history. Ordering and snapshot ownership need independent assertions.

## Phase 4 prompt for replay state and failure semantics

```text
Implement replay over the prepared history; do not put DFS inside navigation.

Model EMPTY, READY, RUNNING, COMPLETED, and ERROR with a discriminated union,
not a set of unrelated booleans. Define LOAD_SUCCESS, LOAD_FAILURE, STEP,
RUN_TO_END, and RESET. Write a transition table before reducer code.

READY has cursor -1 and selects initialSnapshot. STEP advances one event;
RUN_TO_END selects the existing last event. Completed and invalid-state
navigation is harmless. LOAD_FAILURE atomically removes current graph,
result/history/cursor and exposes identifiable errors.

Capture an independently owned original demo at initialization. RESET must
restore that original after custom, failed, or completed loads. Protect
against later mutation of caller-owned data and prop changes. Initialization
and reducer work must be pure under React StrictMode.

Selectors return one ReplayView: graph, selected snapshot, current event/
focus, replayed history prefix, progress, errors, and control availability.
Do not expose future classifications through full prepared result fields.
Retain the complete history internally and expose it at completion.

The injected hook coordinates prepare only on explicit Load. Navigation,
Reset, rerenders, and history inspection never call the analyzer. Preserve
load() versus load(undefined) semantics and own successful values before
queued React actions can observe later caller mutations.

Test transitions, completion clamping, previous-state/history non-mutation,
snapshot identity, prefix boundaries, two invalid loads after completion,
valid-invalid-valid recovery, stable original Reset, StrictMode, batched
actions, and identical stepped/complete histories. Spy on analysis to prove
the execution boundary.
```

**Discussion point:** ERROR is a state transition with ownership consequences. Displaying an error banner while retaining stale graph/results would violate the contract.

## Phase 5 prompt for synchronized presentation

```text
Compose the existing service/controller in App and pass the same ReplayView
to IslandMap, ReplayControls, EventPanel, EventHistory, NodeTable, and
SafetySummary. Presentation must not calculate low-link values or maintain
a second copy of traversal progress.

Render native SVG from graph coordinates with endpoint-ID lookup. Use a
display projection for responsive layout without changing graph/DFS input.
Preserve current-focus overlays and persistent critical markers together.
Use symbols, text, and line patterns in addition to color; include accessible
SVG descriptions, native keyboard controls, and visible focus.

Explicitly call load() from the Load button so React's click event cannot
be mistaken for graph input. Render unset table values at startup/READY.
Show provisional findings until completion, and choose any displayed proof
only from events already reached. Keep full completed history expandable
without moving the selected cursor.

Clear stale SVG, table, numerical proof, findings, and history in ERROR;
test failure via dependency injection without adding debug controls.

At every one of the 54 demo events compare map state/focus, every table row,
summary IDs/count, and history boundary to the selected snapshot. Verify the
independent final table, FE/DE/D proofs, keyboard workflow, Reset,
repeatability, and exactly one analysis per Load under StrictMode.

Check the actual browser at laptop and mobile sizes. Capture numerical
proofs and completed/startup screens; measure horizontal overflow and label
collisions. Make map, current explanation, table, and summary fit together on
a typical laptop. Distinguish observed browser coverage from untested devices.

Run focused and full tests, build, and lint. Record actual failures and
corrections before the checkpoint; do not report a command as passing merely
because an earlier checkpoint passed.
```

**Discussion point:** The selected ReplayView is the synchronization contract. A correct final table cannot justify exposing it before its discovery/classification events.

## Verification review prompt

Status: proposed repair/review task following the observed audit timeout; not yet implemented.

```text
Investigate the test at App.test.tsx that checks all 54 synchronized events.
The default five-second limit failed in the full suite and in isolation.
A diagnostic full run with --testTimeout=15000 --maxWorkers=1 passed 293 tests.
Keep those observations distinct; they do not prove the default is fixed.

Inspect test/query costs and runner scheduling. Identify avoidable repeated
DOM traversal, preserving every per-event/table/map/history assertion.
Choose a narrowly scoped improvement or a justified per-test time budget.
Do not globally disable timeouts, skip events, remove assertions, or alter
algorithm behavior just to make verification green.

Explain what the failure output establishes and what remains uncertain.
Separate assertion correctness from wall-clock reliability. Run the normal
documented command after the change, including repeat runs justified by the
timing concern. Report durations, exact flags, failures, and remaining limits.

Review architecture imports and confirm production does not read oracle
values. Treat a green suite as evidence for specified cases, not a proof of
all possible behavior. Update evidence with actual results only.
```

**Discussion point:** Reliable verification includes investigating a slow test and reporting the default command honestly, even when the underlying assertions pass with a larger budget.

## Live modification prompt

Status: rehearsal example; no history filter has been implemented.

```text
Add an event-type filter to the displayed replay history. First identify the
smallest layer that owns this change and list the invariants to preserve.

The filter is presentation state. It must not change the reducer cursor,
selected snapshot, progress, map/table/summary, event indexes, or analyzer
calls. Filter only the already-replayed prefix. At completion all prepared
events must remain available when the filter is cleared.

Use a labeled native select with All events as the default. Preserve original
one-based event numbers when entries are hidden, show visible/recorded counts
clearly, and provide a useful empty result message.

Define Reset behavior explicitly so resetting to the startup appearance also
clears the filter. Do not introduce an effect that reruns DFS or a second
traversal state model.

Test type filtering, empty matches, clearing at completion, no future events,
unchanged snapshot/cursor, Reset, keyboard access, and no additional analysis.
Keep the change reviewable, run focused checks and regression as appropriate,
and explain why it belongs outside the domain.
```

**Discussion point:** A small UI feature can still violate replay invariants. Scope, ownership, Reset semantics, and regression evidence should be explicit before editing.
