import type { Graph } from '../models/Graph'
import type { ClosureTarget, ConnectivityPartition } from '../models/ClosureSimulation'

/** Trusted validated graph. Flood fill is separate from Tarjan and replay. */
export function partitionGraph(graph: Graph, closure: ClosureTarget | null = null): ConnectivityPartition {
  const nodeIds = graph.nodes.map(node => node.id)
    .filter(id => !(closure?.kind === 'NODE' && id === closure.id)).sort()
  const neighbors = new Map(nodeIds.map(id => [id, [] as string[]]))
  for (const edge of graph.edges) {
    if (closure?.kind === 'EDGE' && edge.id === closure.id) continue
    if (closure?.kind === 'NODE' && (edge.source === closure.id || edge.target === closure.id)) continue
    const source = neighbors.get(edge.source)
    const target = neighbors.get(edge.target)
    if (!source || !target) throw new Error('Connectivity requires validated graph endpoints.')
    source.push(edge.target)
    target.push(edge.source)
  }
  const seen = new Set<string>()
  const groups: (readonly string[])[] = []
  const groupByNode: Record<string, number> = {}
  for (const root of nodeIds) {
    if (seen.has(root)) continue
    const pending = [root]
    const group: string[] = []
    seen.add(root)
    while (pending.length > 0) {
      const id = pending.pop()!
      group.push(id)
      for (const neighbor of neighbors.get(id)!) {
        if (!seen.has(neighbor)) { seen.add(neighbor); pending.push(neighbor) }
      }
    }
    group.sort()
    for (const id of group) groupByNode[id] = groups.length
    groups.push(Object.freeze(group))
  }
  return Object.freeze({
    groups: Object.freeze(groups), componentCount: groups.length,
    groupByNode: Object.freeze(groupByNode),
  })
}
