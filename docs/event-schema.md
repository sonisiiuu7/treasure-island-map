# Replay event schema and deterministic emission contract

Phase 3 records explanations during the existing Tarjan DFS. GraphAnalyzer.analyze and AnalysisService.prepare retain their dependency boundaries. There is one traversal per analysis.

## Result envelope

AnalysisSummary preserves every Phase 2 field: nodes (parent/discovery/low), discoveryOrder, componentRoots, componentCount, treeEdgeIds, bridgeIds, and articulationIds.

AnalysisResult extends it with initialSnapshot, events, and finalSnapshot. The result, event array, summary records/arrays, event objects, payloads, focus objects, and snapshots are frozen. finalSnapshot is the exact object referenced by the last event's snapshot. Sharing that immutable final object is intentional.

## Event structure

Each ReplayEvent has:

| Field | Contract |
| --- | --- |
| index | Contiguous zero-based integer assigned at emission. |
| type | Discriminant selecting the corresponding typed details payload. |
| focus | nodeId plus optional edgeId and relatedNodeId; highlights the relevant object. |
| message | Deterministic, human-readable explanation including relevant numerical values. |
| details | Flat readonly primitive-valued proof/update data specific to the event type. |
| snapshot | Complete traversal state immediately after this event. |

No timestamps, random IDs, coordinates, display names, or input-array indexes enter the history. Event indexes describe replay order, not DFS discovery time.

## Payloads and effects

| Type | Details | State change before capture |
| --- | --- | --- |
| COMPONENT_START | rootId, oldCount, newCount | Increment component count; root remains unvisited. |
| DISCOVER | nodeId, parentId, discovery, low | Assign parent and global discovery/low; mark ACTIVE. |
| INSPECT_TREE | nodeId, neighborId, edgeId, childCount | Mark edge TREE and increment this node's DFS-tree child count. Child remains unvisited until DISCOVER. |
| INSPECT_PARENT | nodeId, neighborId, edgeId, low | No low change; explicitly explain skipping the parent. |
| INSPECT_VISITED | nodeId, neighborId, edgeId, oldLow, newLow, neighborDiscovery | Update low using neighbor discovery; mark a new non-tree connection NON_TREE. |
| RETURN_CHILD | nodeId (parent), childId, edgeId, oldLow, newLow, childLow | Propagate min(parent low, child low) after child completion. |
| CLASSIFY_EDGE | nodeId, childId, edgeId, parentDiscovery, childLow, isBridge, parentIsRoot, nonRootArticulation | Mark BRIDGE and add its ID iff childLow > parentDiscovery; otherwise retain TREE. |
| ARTICULATION | NON_ROOT_LOW proof: nodeId, childId, childLow, discovery; or ROOT_CHILD_COUNT proof: nodeId, childCount | Add a newly detected articulation ID. |
| FINISH_NODE | nodeId, discovery, low, childCount, isRoot, isArticulation | Mark FINISHED and report the articulation outcome. |
| COMPONENT_END | rootId, componentCount | Record completed component; its nodes are FINISHED. |

CLASSIFY_EDGE.nonRootArticulation is childLow >= parentDiscovery for a non-root parent. It is null for a root, whose rule depends on its final tree-child count. This candidate does not add an articulation marker until a subsequent ARTICULATION event.

## Exact ordering

1. Select the next unvisited root in sorted ASCII ID order. Emit COMPONENT_START, then DISCOVER.
2. For every sorted adjacency entry, emit exactly one inspection as TREE, PARENT, or VISITED.
3. INSPECT_TREE precedes recursive DISCOVER of the child. The child's entire subtree finishes before returning.
4. Immediately after FINISH_NODE for a child, emit RETURN_CHILD, then CLASSIFY_EDGE, then ARTICULATION if that non-root parent becomes newly marked.
5. After every neighbor of a root has been inspected, evaluate its DFS-tree child count. Emit ARTICULATION if the count is at least two, then FINISH_NODE.
6. Emit COMPONENT_END after the root's FINISH_NODE.

Each undirected edge receives two inspections, one per endpoint adjacency entry. Each DFS-tree edge receives exactly one return and one classification. A root/non-root articulation is marked only once. Non-root nodes already marked by another child still get later child-return and classification events.

Return and visited-inspection events are emitted even when oldLow equals newLow. Every tree-edge classification records true or false. Negative non-root articulation comparisons are in CLASSIFY_EDGE; root outcomes, including false with zero or one child, are in FINISH_NODE. ARTICULATION records positive new marks only.

## Snapshot model

Nodes map ID to parent, discovery, low, and status:

- UNVISITED: parent/discovery/low are null.
- ACTIVE: discovered, with numerical values; neighbor processing has not finished.
- FINISHED: all adjacency entries and descendants are complete.

Edges map original edge ID to UNINSPECTED, TREE, NON_TREE, or BRIDGE. A classified non-bridge tree edge stays TREE. Current-event focus is separate from persistent DFS status, so a finished child can remain relevant during a return explanation. Articulation markers come from articulationIds.

componentCount is the number of components started at that event, including the current one. bridgeIds and articulationIds contain only classifications reached so far and are sorted in ASCII order. Node/edge record keys are also sorted.

initialSnapshot has all nodes unvisited, all edges uninspected, component count zero, and empty critical summaries.

createTraversalSnapshot copies every node record, the edge record, and both summary arrays, then freezes all levels. It neither mutates nor freezes the caller's state. Earlier events therefore share no mutable working data with later traversal. Snapshot data is serializable and contains no Map/Set instances.

## Hand-derived one-edge trace

For islands A/B and edge ROAD:

| Index | Event | Focus |
| --- | --- | --- |
| 0 | COMPONENT_START | A |
| 1 | DISCOVER | A |
| 2 | INSPECT_TREE | A -> B, ROAD |
| 3 | DISCOVER | B |
| 4 | INSPECT_PARENT | B -> A, ROAD |
| 5 | FINISH_NODE | B |
| 6 | RETURN_CHILD | B -> A, ROAD; low[A] 0 -> 0 |
| 7 | CLASSIFY_EDGE | ROAD; 1 > 0 is true |
| 8 | FINISH_NODE | A; one tree child, not articulation |
| 9 | COMPONENT_END | A |

The exact ten-event trace is tested, along with every snapshot transition.

## Main-graph numerical examples

The main graph produces 54 events: 1 component start, 8 discoveries, 7 tree inspections, 7 parent inspections, 4 visited inspections, 7 returns, 7 classifications, 4 articulation marks, 8 node finishes, and 1 component end.

Payload excerpts below omit index/focus/message/snapshot for brevity; the executable tests verify the full corresponding events.

Return F -> E:

```json
{
  "type": "RETURN_CHILD",
  "details": {
    "nodeId": "E", "childId": "F", "edgeId": "EF",
    "oldLow": 4, "newLow": 3, "childLow": 3
  }
}
```

This explains low[E] = min(4, 3) = 3.

Classify DE:

```json
{
  "type": "CLASSIFY_EDGE",
  "details": {
    "nodeId": "D", "childId": "E", "edgeId": "DE",
    "parentDiscovery": 3, "childLow": 3,
    "isBridge": false, "parentIsRoot": false,
    "nonRootArticulation": true
  }
}
```

The next event marks D:

```json
{
  "type": "ARTICULATION",
  "details": {
    "rule": "NON_ROOT_LOW",
    "nodeId": "D", "childId": "E",
    "childLow": 3, "discovery": 3
  }
}
```

DE is not a bridge because 3 > 3 is false; D is an articulation because 3 >= 3 is true. Its marker appears in the ARTICULATION snapshot, after the classification event.

## Complexity and later integration

DFS calculations remain O(V+E); full snapshot creation adds O(number of events * (V+E)) copied data plus sorting/freezing overhead. This is appropriate for the required maximum of 12 nodes and 20 edges.

Phase 4 selects from these immutable snapshots with a cursor and retains the complete prepared history. Phase 5 renders that same snapshot and event focus in every panel, formats typed numerical details, and exposes only replayed history. Its integration tests verify all 54 demo events. Step, Run to End, Reset, rerenders, and history expansion never execute DFS. See replay-controller.md, ui-design.md, and phase-5-evidence.md.
