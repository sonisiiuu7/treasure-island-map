import type { Graph } from '../../domain/models/Graph'

/**
 * Independent reference: scan original edges and flood-fill surviving nodes.
 * No low-link values, DFS parent rules, or production adjacency builder are used.
 */
function countComponents(graph: Graph, removedNode?: string, removedEdge?: string): number {
  const visited = new Set<string>()
  let count = 0

  for (const node of graph.nodes) {
    if (node.id === removedNode || visited.has(node.id)) continue
    count += 1
    const pending = [node.id]
    visited.add(node.id)

    while (pending.length > 0) {
      const current = pending.pop()
      for (const edge of graph.edges) {
        if (edge.id === removedEdge) continue
        const neighbor =
          edge.source === current
            ? edge.target
            : edge.target === current
              ? edge.source
              : undefined
        if (neighbor === undefined || neighbor === removedNode || visited.has(neighbor)) continue
        visited.add(neighbor)
        pending.push(neighbor)
      }
    }
  }
  return count
}

export function connectivityOracle(graph: Graph) {
  const componentCount = countComponents(graph)
  return {
    componentCount,
    bridgeIds: graph.edges
      .filter((edge) => countComponents(graph, undefined, edge.id) > componentCount)
      .map((edge) => edge.id)
      .sort(),
    articulationIds: graph.nodes
      .filter((node) => countComponents(graph, node.id) > componentCount)
      .map((node) => node.id)
      .sort(),
  }
}
