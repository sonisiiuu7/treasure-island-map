# Independent reference graph

This reference was derived by inspecting the graph before implementing DFS. It is a documentation/test oracle. Application modules must never import it or use its expected values as decisions.

## Original archipelago

| ID | Festival location | x | y |
| --- | --- | --- | --- |
| A | Anchor Bay | 12 | 35 |
| B | Buccaneer Bites | 26 | 15 |
| C | Coral Stage | 35 | 45 |
| D | Driftwood Dock | 50 | 45 |
| E | Ember Market | 67 | 30 |
| F | First Aid | 62 | 65 |
| G | Games Grove | 82 | 35 |
| H | Harmony Isle | 93 | 60 |

Edge IDs/endpoints: AB, AC, BC, CD, DE, DF, EF, EG, GH. Every edge ID names its endpoints; the graph is undirected. There are eight islands and nine bridges.

The graph is connected. A-B-C-A and D-E-F-D form cycles. CD joins them, EG attaches the G-H branch, and GH reaches the final island. Coordinates affect presentation only.

## Sorted adjacency

```text
A: B (AB), C (AC)
B: A (AB), C (BC)
C: A (AC), B (BC), D (CD)
D: C (CD), E (DE), F (DF)
E: D (DE), F (EF), G (EG)
F: D (DF), E (EF)
G: E (EG), H (GH)
H: G (GH)
```

## Hand-derived DFS oracle

Choose roots and neighbors by ascending ASCII node ID; use one discovery clock beginning at zero.

Discovery order: A -> B -> C -> D -> E -> F -> G -> H.

DFS-tree edges: AB, BC, CD, DE, EF, EG, GH. Non-tree edges: AC, DF.

| Node | Parent | Discovery | Final low |
| --- | --- | --- | --- |
| A | null | 0 | 0 |
| B | A | 1 | 0 |
| C | B | 2 | 0 |
| D | C | 3 | 3 |
| E | D | 4 | 3 |
| F | E | 5 | 3 |
| G | E | 6 | 6 |
| H | G | 7 | 7 |

Connected component count: 1.

Sorted critical bridge IDs: CD, EG, GH.

Sorted articulation node IDs: C, D, E, G.

## Numerical reasoning

- C inspects A, making low[C] = min(2, 0) = 0. Returning from C eventually makes low[B] = 0.
- F inspects D, making low[F] = min(5, 3) = 3. On return F -> E, low[E] changes from 4 to 3.
- For DE, low[E] = discovery[D] = 3. DE is not a bridge because 3 > 3 is false. Non-root D is an articulation because 3 >= 3 is true.
- For CD, low[D] = 3 > discovery[C] = 2, so CD is a bridge.
- For EG, low[G] = 6 > discovery[E] = 4, so EG is a bridge.
- For GH, low[H] = 7 > discovery[G] = 6, so GH is a bridge.
- Root A has one DFS-tree child B, so A is not an articulation even though its graph degree is two.

Removing CD, EG, or GH visibly separates a branch. Removing C, D, E, or G separates surviving islands. The triangles provide alternate routes for internal edges.

Phase 2 will compare calculated results with this oracle and verify shuffled-input independence.
