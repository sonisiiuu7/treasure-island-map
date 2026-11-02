import type { GraphAnalyzer } from '../contracts/GraphAnalyzer'
import type { AdjacencyIndex } from '../models/AdjacencyIndex'
import type { AnalysisResult, NodeAnalysis } from '../models/AnalysisResult'
import type { ReplayEvent, ReplayEventDescription } from '../models/ReplayEvent'
import type { EdgeStatus, NodeStatus, TraversalSnapshot } from '../models/TraversalSnapshot'
import { createTraversalSnapshot } from '../replay/createTraversalSnapshot'

interface WorkingNode {
  parent: string | null
  discovery: number
  low: number
  status: NodeStatus
}

/** Stateless strategy: calculate and record explanations during the same DFS. */
export class TarjanLowLinkAnalyzer implements GraphAnalyzer {
  analyze(adjacency: AdjacencyIndex): AnalysisResult {
    const working = new Map<string, WorkingNode>(
      adjacency.nodeIds.map((id) => [
        id, { parent: null, discovery: -1, low: -1, status: 'UNVISITED' },
      ]),
    )
    const edgeIds = [...new Set(
      [...adjacency.neighbors.values()].flatMap((entries) => entries.map((entry) => entry.edgeId)),
    )].sort()
    const edges: Record<string, EdgeStatus> = Object.fromEntries(
      edgeIds.map((id) => [id, 'UNINSPECTED']),
    )
    const discoveryOrder: string[] = []
    const componentRoots: string[] = []
    const treeEdgeIds: string[] = []
    const bridgeIds = new Set<string>()
    const articulationIds = new Set<string>()
    const events: ReplayEvent[] = []
    let clock = 0

    const stateFor = (id: string): WorkingNode => {
      const state = working.get(id)
      if (state === undefined) throw new Error(`Adjacency index references unknown node ${id}.`)
      return state
    }

    const captureSnapshot = (): TraversalSnapshot => createTraversalSnapshot({
      nodes: Object.fromEntries(adjacency.nodeIds.map((id) => {
        const state = stateFor(id)
        return [id, {
          parent: state.parent,
          discovery: state.discovery === -1 ? null : state.discovery,
          low: state.low === -1 ? null : state.low,
          status: state.status,
        }]
      })),
      edges,
      componentCount: componentRoots.length,
      bridgeIds: [...bridgeIds],
      articulationIds: [...articulationIds],
    })

    const emit = (description: ReplayEventDescription): void => {
      // Descriptions are fresh internal objects containing only primitive values.
      Object.freeze(description.focus)
      Object.freeze(description.details)
      events.push(Object.freeze({
        ...description,
        index: events.length,
        snapshot: captureSnapshot(),
      }))
    }

    const initialSnapshot = captureSnapshot()

    const visit = (nodeId: string, parentId: string | null): void => {
      const state = stateFor(nodeId)
      state.parent = parentId
      state.discovery = clock
      state.low = clock
      state.status = 'ACTIVE'
      clock += 1
      discoveryOrder.push(nodeId)
      let childCount = 0
      emit({
        type: 'DISCOVER',
        focus: { nodeId },
        details: { nodeId, parentId, discovery: state.discovery, low: state.low },
        message: `Discover ${nodeId} from ${parentId ?? 'component root'}: discovery[${nodeId}] = low[${nodeId}] = ${state.discovery}.`,
      })

      const neighbors = adjacency.neighbors.get(nodeId)
      if (neighbors === undefined) {
        throw new Error(`Adjacency index is missing neighbors for node ${nodeId}.`)
      }

      for (const { neighborId, edgeId } of neighbors) {
        const focus = { nodeId, edgeId, relatedNodeId: neighborId }
        // Parallel edges are rejected by validation, so parent ID is sufficient.
        if (neighborId === parentId) {
          emit({
            type: 'INSPECT_PARENT',
            focus,
            details: { nodeId, neighborId, edgeId, low: state.low },
            message: `Inspect ${edgeId}, ${nodeId} -> parent ${neighborId}: skip the parent connection; low[${nodeId}] stays ${state.low}.`,
          })
          continue
        }

        const neighbor = stateFor(neighborId)
        if (neighbor.discovery === -1) {
          childCount += 1
          treeEdgeIds.push(edgeId)
          edges[edgeId] = 'TREE'
          emit({
            type: 'INSPECT_TREE',
            focus,
            details: { nodeId, neighborId, edgeId, childCount },
            message: `Inspect ${edgeId}, ${nodeId} -> unvisited ${neighborId}: tree edge; DFS child count of ${nodeId} becomes ${childCount}.`,
          })
          visit(neighborId, nodeId)

          const oldLow = state.low
          state.low = Math.min(state.low, neighbor.low)
          emit({
            type: 'RETURN_CHILD',
            focus,
            details: { nodeId, childId: neighborId, edgeId, oldLow, newLow: state.low, childLow: neighbor.low },
            message: `Return ${neighborId} -> ${nodeId}: low[${nodeId}] = min(${oldLow}, low[${neighborId}] = ${neighbor.low}) = ${state.low} (${oldLow} -> ${state.low}).`,
          })

          const isBridge = neighbor.low > state.discovery
          const nonRootArticulation = parentId === null ? null : neighbor.low >= state.discovery
          if (isBridge) {
            bridgeIds.add(edgeId)
            edges[edgeId] = 'BRIDGE'
          }
          emit({
            type: 'CLASSIFY_EDGE',
            focus,
            details: {
              nodeId, childId: neighborId, edgeId,
              parentDiscovery: state.discovery, childLow: neighbor.low,
              isBridge, parentIsRoot: parentId === null, nonRootArticulation,
            },
            message: `Classify ${edgeId}: low[${neighborId}] = ${neighbor.low} > discovery[${nodeId}] = ${state.discovery} is ${isBridge}; ${isBridge ? 'bridge' : 'not a bridge'}. ${nonRootArticulation === null ? 'Root articulation waits for the final child count.' : `Non-root articulation test: ${neighbor.low} >= ${state.discovery} is ${nonRootArticulation}.`}`,
          })

          if (nonRootArticulation && !articulationIds.has(nodeId)) {
            articulationIds.add(nodeId)
            emit({
              type: 'ARTICULATION',
              focus,
              details: {
                rule: 'NON_ROOT_LOW', nodeId, childId: neighborId,
                childLow: neighbor.low, discovery: state.discovery,
              },
              message: `Mark non-root ${nodeId} as articulation: low[${neighborId}] = ${neighbor.low} >= discovery[${nodeId}] = ${state.discovery} is true.`,
            })
          }
        } else {
          const oldLow = state.low
          // Use discovery[neighbor], never its propagated low value.
          state.low = Math.min(state.low, neighbor.discovery)
          if (edges[edgeId] === 'UNINSPECTED') edges[edgeId] = 'NON_TREE'
          emit({
            type: 'INSPECT_VISITED',
            focus,
            details: {
              nodeId, neighborId, edgeId, oldLow, newLow: state.low,
              neighborDiscovery: neighbor.discovery,
            },
            message: `Inspect visited connection ${edgeId}, ${nodeId} -> ${neighborId}: low[${nodeId}] = min(${oldLow}, discovery[${neighborId}] = ${neighbor.discovery}) = ${state.low} (${oldLow} -> ${state.low}).`,
          })
        }
      }

      if (parentId === null && childCount >= 2) {
        articulationIds.add(nodeId)
        emit({
          type: 'ARTICULATION',
          focus: { nodeId },
          details: { rule: 'ROOT_CHILD_COUNT', nodeId, childCount },
          message: `Mark root ${nodeId} as articulation: ${childCount} DFS-tree children >= 2 is true.`,
        })
      }
      state.status = 'FINISHED'
      emit({
        type: 'FINISH_NODE',
        focus: { nodeId },
        details: {
          nodeId, discovery: state.discovery, low: state.low, childCount,
          isRoot: parentId === null, isArticulation: articulationIds.has(nodeId),
        },
        message: `Finish ${nodeId}: discovery = ${state.discovery}, low = ${state.low}. ${parentId === null ? `Root child-count rule: ${childCount} >= 2 is ${childCount >= 2}.` : `Articulation: ${articulationIds.has(nodeId)}.`}`,
      })
    }

    for (const rootId of adjacency.nodeIds) {
      if (stateFor(rootId).discovery !== -1) continue
      const oldCount = componentRoots.length
      componentRoots.push(rootId)
      emit({
        type: 'COMPONENT_START',
        focus: { nodeId: rootId },
        details: { rootId, oldCount, newCount: componentRoots.length },
        message: `Start component at ${rootId}: component count ${oldCount} -> ${componentRoots.length}.`,
      })
      visit(rootId, null)
      emit({
        type: 'COMPONENT_END',
        focus: { nodeId: rootId },
        details: { rootId, componentCount: componentRoots.length },
        message: `Complete component rooted at ${rootId}; component count = ${componentRoots.length}.`,
      })
    }

    const lastEvent = events.at(-1)
    if (lastEvent === undefined) {
      throw new Error('Analysis requires a validated graph with at least one node.')
    }
    const finalSnapshot = lastEvent.snapshot
    const nodes: Record<string, NodeAnalysis> = Object.fromEntries(
      adjacency.nodeIds.map((id) => {
        const state = stateFor(id)
        return [id, Object.freeze({
          parent: state.parent, discovery: state.discovery, low: state.low,
        })]
      }),
    )
    return Object.freeze({
      nodes: Object.freeze(nodes),
      discoveryOrder: Object.freeze(discoveryOrder),
      componentRoots: Object.freeze(componentRoots),
      componentCount: componentRoots.length,
      treeEdgeIds: Object.freeze(treeEdgeIds),
      bridgeIds: finalSnapshot.bridgeIds,
      articulationIds: finalSnapshot.articulationIds,
      initialSnapshot,
      events: Object.freeze(events),
      finalSnapshot,
    })
  }
}
