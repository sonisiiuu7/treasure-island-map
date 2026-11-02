import type { Graph } from '../models/Graph'
import type { TraversalSnapshot } from '../models/TraversalSnapshot'
import { createTraversalSnapshot } from './createTraversalSnapshot'

/** Unvisited preview data only: no adjacency traversal, validation, or analysis. */
export function createInitialTraversalSnapshot(graph: Graph): TraversalSnapshot {
  return createTraversalSnapshot({
    nodes: Object.fromEntries(graph.nodes.map((node) => [node.id, {
      parent: null, discovery: null, low: null, status: 'UNVISITED' as const,
    }])),
    edges: Object.fromEntries(graph.edges.map((edge) => [edge.id, 'UNINSPECTED' as const])),
    componentCount: 0,
    bridgeIds: [],
    articulationIds: [],
  })
}
