import type { Graph } from '../domain/models/Graph'
import type { ClosureSimulation, ClosureTarget } from '../domain/models/ClosureSimulation'
import { partitionGraph } from '../domain/graph/partitionGraph'

/** Graph is owned by the validated replay. A closure may leave zero surviving nodes. */
export function simulateClosure(graph: Graph, target: ClosureTarget): ClosureSimulation {
  const exists = target.kind === 'EDGE'
    ? graph.edges.some(edge => edge.id === target.id)
    : graph.nodes.some(node => node.id === target.id)
  if (!exists) throw new Error(`Unknown closure target ${target.kind} ${target.id}.`)
  const before = partitionGraph(graph)
  const after = partitionGraph(graph, target)
  const removedEdgeIds = graph.edges
    .filter(edge => target.kind === 'EDGE' ? edge.id === target.id : edge.source === target.id || edge.target === target.id)
    .map(edge => edge.id).sort()
  return Object.freeze({
    target: Object.freeze({ ...target }), before, after,
    removedNodeId: target.kind === 'NODE' ? target.id : null,
    removedEdgeIds: Object.freeze(removedEdgeIds),
    increasesComponents: after.componentCount > before.componentCount,
  })
}
