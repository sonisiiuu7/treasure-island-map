import type { Graph } from '../models/Graph'

/** Own a deeply frozen graph value while preserving the candidate's original array order. */
export function copyGraph(graph: Graph): Graph {
  return Object.freeze({
    nodes: Object.freeze(graph.nodes.map(({ id, name, x, y }) =>
      Object.freeze({ id, name, x, y }),
    )),
    edges: Object.freeze(graph.edges.map(({ id, source, target }) =>
      Object.freeze({ id, source, target }),
    )),
  })
}
