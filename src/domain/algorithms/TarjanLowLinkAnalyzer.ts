import type { GraphAnalyzer } from '../contracts/GraphAnalyzer'
import type { AdjacencyIndex } from '../models/AdjacencyIndex'
import type { AnalysisResult, NodeAnalysis } from '../models/AnalysisResult'

interface WorkingNode {
  parent: string | null
  discovery: number
  low: number
}

/** Stateless strategy: every invocation owns its discovery clock and working maps. */
export class TarjanLowLinkAnalyzer implements GraphAnalyzer {
  analyze(adjacency: AdjacencyIndex): AnalysisResult {
    const working = new Map<string, WorkingNode>(
      adjacency.nodeIds.map((id) => [id, { parent: null, discovery: -1, low: -1 }]),
    )
    const discoveryOrder: string[] = []
    const componentRoots: string[] = []
    const treeEdgeIds: string[] = []
    const bridgeIds = new Set<string>()
    const articulationIds = new Set<string>()
    let clock = 0

    const stateFor = (id: string): WorkingNode => {
      const state = working.get(id)
      if (state === undefined) {
        throw new Error(`Adjacency index references unknown node ${id}.`)
      }
      return state
    }

    const visit = (nodeId: string, parentId: string | null): void => {
      const state = stateFor(nodeId)
      state.parent = parentId
      state.discovery = clock
      state.low = clock
      clock += 1
      discoveryOrder.push(nodeId)
      let childCount = 0

      const neighbors = adjacency.neighbors.get(nodeId)
      if (neighbors === undefined) {
        throw new Error(`Adjacency index is missing neighbors for node ${nodeId}.`)
      }

      for (const { neighborId, edgeId } of neighbors) {
        // Parallel edges are rejected by validation, so the parent ID is sufficient.
        if (neighborId === parentId) continue

        const neighbor = stateFor(neighborId)
        if (neighbor.discovery === -1) {
          childCount += 1
          treeEdgeIds.push(edgeId)
          visit(neighborId, nodeId)

          state.low = Math.min(state.low, neighbor.low)
          if (neighbor.low > state.discovery) bridgeIds.add(edgeId)
          if (parentId !== null && neighbor.low >= state.discovery) {
            articulationIds.add(nodeId)
          }
        } else {
          // Use the neighbor's discovery time, never its propagated low value.
          state.low = Math.min(state.low, neighbor.discovery)
        }
      }

      if (parentId === null && childCount >= 2) articulationIds.add(nodeId)
    }

    for (const rootId of adjacency.nodeIds) {
      if (stateFor(rootId).discovery !== -1) continue
      componentRoots.push(rootId)
      visit(rootId, null)
    }

    // Copy into serializable readonly result values, ordered by sorted node ID.
    const nodes: Record<string, NodeAnalysis> = Object.fromEntries(
      adjacency.nodeIds.map((id) => [id, { ...stateFor(id) }]),
    )
    return {
      nodes,
      discoveryOrder,
      componentRoots,
      componentCount: componentRoots.length,
      treeEdgeIds,
      bridgeIds: [...bridgeIds].sort(),
      articulationIds: [...articulationIds].sort(),
    }
  }
}
