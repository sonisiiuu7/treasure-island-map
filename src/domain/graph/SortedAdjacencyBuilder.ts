import type { AdjacentEdge, AdjacencyIndex } from '../models/AdjacencyIndex'
import type { Graph } from '../models/Graph'

/**
 * Internal precondition: the complete graph has passed validateGraph.
 * AnalysisService enforces that boundary before calling this pure builder.
 */
export function buildSortedAdjacency(graph: Graph): AdjacencyIndex {
  const nodeIds = graph.nodes.map((node) => node.id).sort()
  const neighbors = new Map<string, AdjacentEdge[]>(
    nodeIds.map((id) => [id, []]),
  )

  for (const edge of graph.edges) {
    const source = neighbors.get(edge.source)
    const target = neighbors.get(edge.target)
    if (source === undefined || target === undefined) {
      throw new Error('Adjacency construction requires validated graph endpoints.')
    }
    source.push({ neighborId: edge.target, edgeId: edge.id })
    target.push({ neighborId: edge.source, edgeId: edge.id })
  }

  for (const entries of neighbors.values()) {
    entries.sort((first, second) =>
      first.neighborId < second.neighborId
        ? -1
        : first.neighborId > second.neighborId
          ? 1
          : 0,
    )
  }

  return { nodeIds, neighbors }
}
