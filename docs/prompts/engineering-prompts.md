# Engineering prompts

Prompts for planning the solution, working through each implementation phase, checking the results, and making focused changes. See [development notes](../ai-prompts.md) for decisions, issues, and verification evidence.

## Planning and design

```text
Before we start coding, help me break this problem into five phases with a
clear result and a test checkpoint for each one. I want to get the graph
logic right before adding replay or drawing the map.

My proposed split is domain, application, and presentation. Keep validation,
adjacency, DFS, and the event models in pure TypeScript. Let the application
layer prepare an analysis and manage replay, and let React render it.

For LLD, use a small GraphAnalyzer interface and inject it into
AnalysisService. App can choose the actual Tarjan implementation. Explain
where SRP, OCP, LSP, ISP, and DIP apply to these choices. If a helper works
well as a function, don't add an interface just to use another pattern.

Use React, TypeScript, Vite, Tailwind, native SVG, useReducer, and Vitest.
Draw the UML and the Load, failure, Step, Run, and Reset sequences so I can
check the responsibilities and data flow.

Also point out the trade-offs. Is recursive DFS reasonable for 12 nodes?
What does storing a full snapshot for every event cost? Which parts of this
design would need to change if the graph became much larger?
```

## Phase 1 — graph models and validation

```text
Let's implement the graph models and validator first. The graph is coming
from runtime data, so the validator should accept unknown, not assume that
a TypeScript interface makes the input valid.

Return either a fully validated Graph or structured errors with a code,
field path, and relevant node/edge/endpoint. I don't want a partial graph
getting through to DFS. Collect useful independent errors, but skip checks
whose required fields are already invalid.

Check the exact limits: 1–12 nodes, 0–20 edges, valid unique IDs,
non-empty names, finite coordinates in [0,100], and existing distinct
endpoints. Reject self-loops and repeated undirected connections. AB and BA
must count as the same connection. Be careful about using a separator in
the pair key because IDs themselves can contain "-" and "_".

Create a fresh eight-island demo with two loops and a few exposed branches.
Document its expected adjacency and traversal table separately from the app.

Test malformed input, NaN/Infinity, boundary values, duplicate/reversed
connections, and repeated calls. Confirm validation doesn't mutate the
input and two calls to the demo factory don't share mutable objects.
```

## Phase 2 — deterministic DFS

```text
Now implement the Tarjan analyzer behind GraphAnalyzer. AnalysisService
should validate the complete input, build adjacency, and only then call
the injected analyzer.

Build adjacency using node IDs. Sort both component roots and neighbors
by ASCII node ID, preserve the actual edge IDs, and include isolated nodes.
Reversing the source arrays or moving islands on the map must not affect
the calculation.

Use one discovery clock starting at zero across all components. For a
completed tree child v, update low[u] from low[v]. For a visited non-parent
neighbor, use discovery[neighbor], not its propagated low value.

I want focused tests for the easy-to-confuse rules: a bridge uses
low[v] > discovery[u], a non-root articulation uses >=, and a root needs
two DFS-tree children rather than just two neighbors.

Use DE and D to demonstrate the equality case. Also check that F reaching D
makes low[F] = 3, then returning from F changes low[E] from 4 to 3.

Compare the main result with the separate reference table. Test a cycle,
a path, shuffled arrays, and one graph combining a branching root,
another component, and an isolated node.

For another check, remove each edge/node and recount components with
flood fill. Keep that oracle independent of Tarjan's low-link conditions.
Explain the DFS cost separately from sorting and the later replay cost.
```

## Phase 3 — events and immutable snapshots

```text
Add explanations during the existing DFS. Don't run a second traversal
just to reconstruct what happened, and preserve all the current results.

Each event needs a deterministic index, a type, node/edge focus, a readable
message, typed numerical details, and the complete state just after it.
Use a discriminated union so the details match the event type.

Record component start/end, discovery, tree/parent/visited inspections,
child returns, classifications, articulation marks, and node completion.
Inspect both adjacency entries of each undirected edge.

After a child finishes, emit RETURN_CHILD, then CLASSIFY_EDGE, then any
new articulation mark. Check root child count before FINISH_NODE.
Include unchanged low updates and false classifications too; otherwise
the explanation would only show the successful outcomes.

Copy and freeze the nested snapshot data. readonly alone isn't runtime
protection, and freezing an outer object won't stop a later DFS update
from changing an earlier node record.

Test an exact one-edge trace, old/new low values, event order,
articulation deduplication, mutation attempts, and repeated serialized
histories. Check that a snapshot contains only progress reached so far.
Show FE's 4 -> 3 update, DE's false bridge test, and D's subsequent
articulation event. The final snapshot should be the last event's snapshot.
```

## Phase 4 — replay behavior

```text
Build replay around the prepared history. Step should move a cursor, not
execute DFS again.

Use EMPTY, READY, RUNNING, COMPLETED, and ERROR as a discriminated state
union. Write down how LOAD_SUCCESS, LOAD_FAILURE, STEP, RUN_TO_END, and
RESET behave in each state before implementing the reducer.

At READY the cursor is -1 and the initial snapshot is selected. Step moves
one event, Run selects the last event, and further navigation at completion
does nothing. A failed load must clear the current graph, result, history,
and cursor together, rather than leave old results behind an error banner.

Keep an independently owned original demo. Reset must restore that original
even after loading a different graph or receiving invalid input. Caller
mutations and rerenders shouldn't change what Reset restores.

Expose one ReplayView for every panel, including the selected snapshot,
current event/focus, replayed history prefix, progress, errors, and controls.
Don't expose final findings before their events have been replayed.

Use useReducer in the React hook and inject the prepare service. Keep
initialization pure under StrictMode. Check that only Load calls analysis,
including the difference between load() and an explicit load(undefined).

Test every transition, invalid-state actions, snapshot identity, history
boundaries, two different invalid loads after completion, recovery, and
identical stepped versus Run-to-End histories.
```

## Phase 5 — the volunteer interface

```text
Connect the existing controller to the actual page. Pass the same
ReplayView to the map, controls, event panel, history, table, and summary.
The components shouldn't calculate low values or keep their own traversal
cursor.

Use native SVG with endpoint-ID lookup and the graph's coordinates.
Responsive display transforms are fine, but don't change graph input to
make the map fit. Show readable names and edge IDs, a legend, keyboard
focus, and accessible descriptions.

Use line patterns, text, and badges as well as color. A current-focus ring
must not erase an articulation badge or a critical-bridge marker.

Have Load explicitly call load(), so a click event isn't treated as graph
input. Keep values unset before discovery. Label incomplete findings as
provisional, and display proof only from events already reached.
Keep all history entries inspectable after Run to End.

Test every one of the 54 demo events against the selected snapshot across
the map, table, summary, focus, and history. Use injected validation failures
to check that stale content clears; don't add testing controls to the page.

Check the running browser on a laptop and a small screen. Keep the main
panels visible together on the laptop, and inspect labels for clipping and
collisions. Capture the FE, DE, and D explanations and the final result.

Run focused tests, the full suite, build, and lint. Report the actual results
and any limitations, then update the documentation and save a checkpoint.
```

## Verification review

Completed review: query scoping, two-worker execution, and bounded per-test budgets preserve every assertion. The normal command passes 303 tests. See [verification evidence](../reliability-and-optionals.md).

```text
The all-events App test is exceeding its five-second limit. It happened in
the full suite and when the test ran alone. With a 15-second timeout and
one worker, all 293 cases passed.

Please investigate the test's repeated queries and the runner setup.
Preserve every event assertion; don't skip events, remove checks, or
change the analyzer just to get a green run.

If the test needs a larger budget, justify a limit for this specific test
instead of disabling timeouts globally. Check whether repeated DOM queries
can be made cheaper first.

Run the normal documented command after the change and repeat the check
to assess the timing issue. Report the exact flags and durations. A pass
with diagnostic settings doesn't establish that the default command is fixed.
```

## History filter extension

Proposed extension: an event-type filter. This feature is not implemented.

```text
Add a filter so I can show only one event type in the history, for example
just the low-value updates. First explain which layer should own it.

This should be presentation state. Filtering must not change the replay
cursor, selected snapshot, progress, map, table, or summary. Filter only the
history already replayed, and keep the original event numbers.

Use an accessible select with All events as the default. Show a useful
message if there are no matches. Clearing the filter after completion
should show all events again.

Decide how the filter resets so Reset still returns the page to its startup
appearance. Check keyboard operation, no future events, unchanged replay
state, and no extra analysis calls. Keep the implementation small enough
to explain and verify during a live modification.
```

## Examples and what-if exploration

```text
Make the edge cases easy to demonstrate: add selectable cycle-only,
branching-root, and disconnected/isolated graphs. Load them through the
existing service, and keep Reset tied to the original demo.

After completion, let me close one bridge or island and compare the
surviving components. Use a separate pure connectivity calculation; don't
rerun or replace the original replay. Check CD, DE, D, disconnected graphs,
and removal of the last island. Keep results immutable and deterministic.

Make each critical chip show its recorded numerical proof and event number.
Use only events already reached and leave the selected replay event alone.

Add repository checks for locked installation, tests, build, and lint.
Keep the workflow simple, and distinguish local results from a hosted run.

Verify keyboard access, stale clearing, custom-original Reset, printing,
component grouping, and unchanged analysis-call counts. Keep the same
domain/application/presentation boundaries and preserve existing tests.
```
