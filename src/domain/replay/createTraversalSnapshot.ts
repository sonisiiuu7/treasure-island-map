import type { TraversalSnapshot } from '../models/TraversalSnapshot'

/** Copy only plain serializable values, then freeze every nested record and array. */
export function createTraversalSnapshot(state: TraversalSnapshot): TraversalSnapshot {
  const nodes = Object.fromEntries(
    Object.keys(state.nodes).sort().map((id) => [id, Object.freeze({ ...state.nodes[id] })]),
  )
  const edges = Object.fromEntries(
    Object.keys(state.edges).sort().map((id) => [id, state.edges[id]]),
  )
  return Object.freeze({
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    componentCount: state.componentCount,
    bridgeIds: Object.freeze([...state.bridgeIds].sort()),
    articulationIds: Object.freeze([...state.articulationIds].sort()),
  })
}
