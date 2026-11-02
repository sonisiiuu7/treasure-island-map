import { expect } from 'vitest'
import type { AnalysisResult } from '../../domain/models/AnalysisResult'
import type { Graph } from '../../domain/models/Graph'
import type { EdgeStatus, NodeStatus, TraversalSnapshot } from '../../domain/models/TraversalSnapshot'

interface ExpectedState {
  nodes: Record<string, {
    parent: string | null
    discovery: number | null
    low: number | null
    status: NodeStatus
  }>
  edges: Record<string, EdgeStatus>
  componentCount: number
  bridgeIds: string[]
  articulationIds: string[]
}

function numberValue(value: number | null): number {
  if (value === null) throw new Error('Expected an already-discovered node')
  return value
}

function copyState(state: TraversalSnapshot): ExpectedState {
  return {
    nodes: Object.fromEntries(Object.entries(state.nodes).map(([id, node]) => [id, { ...node }])),
    edges: { ...state.edges },
    componentCount: state.componentCount,
    bridgeIds: [...state.bridgeIds],
    articulationIds: [...state.articulationIds],
  }
}

/** Interpret required event effects independently; every unmentioned value must stay unchanged. */
export function assertReplayTransitions(graph: Graph, result: AnalysisResult): void {
  const initial: ExpectedState = {
    nodes: Object.fromEntries(graph.nodes.map((node) => node.id).sort().map((id) => [
      id, { parent: null, discovery: null, low: null, status: 'UNVISITED' },
    ])),
    edges: Object.fromEntries(graph.edges.map((edge) => edge.id).sort().map((id) => [id, 'UNINSPECTED'])),
    componentCount: 0,
    bridgeIds: [],
    articulationIds: [],
  }
  expect(result.initialSnapshot).toEqual(initial)
  let before = result.initialSnapshot
  let clock = 0
  const childCounts = new Map<string, number>()
  const candidates = new Set<string>()
  const classified = new Set<string>()
  const discovered: string[] = []
  const roots: string[] = []
  const treeEdges: string[] = []

  result.events.forEach((event, index) => {
    const expected = copyState(before)
    const previous = result.events[index - 1]
    expect(event.index).toBe(index)
    expect(event.message.length).toBeGreaterThan(0)
    expect(expected.nodes).toHaveProperty(event.focus.nodeId)
    if ('nodeId' in event.details) expect(event.focus.nodeId).toBe(event.details.nodeId)
    if ('rootId' in event.details) expect(event.focus.nodeId).toBe(event.details.rootId)
    if ('edgeId' in event.details) expect(event.focus.edgeId).toBe(event.details.edgeId)
    if ('neighborId' in event.details) expect(event.focus.relatedNodeId).toBe(event.details.neighborId)
    if ('childId' in event.details) expect(event.focus.relatedNodeId).toBe(event.details.childId)
    if (event.focus.edgeId !== undefined) {
      const edge = graph.edges.find((candidate) => candidate.id === event.focus.edgeId)
      expect(edge).toBeDefined()
      if (edge === undefined) throw new Error('Unknown focused edge')
      expect([edge.source, edge.target].sort()).toEqual(
        [event.focus.nodeId, event.focus.relatedNodeId].sort(),
      )
    }

    switch (event.type) {
      case 'COMPONENT_START': {
        const details = event.details
        const nextRoot = Object.keys(expected.nodes).find((id) => expected.nodes[id].status === 'UNVISITED')
        expect(details.rootId).toBe(nextRoot)
        expect(details.oldCount).toBe(expected.componentCount)
        expected.componentCount += 1
        expect(details.newCount).toBe(expected.componentCount)
        roots.push(details.rootId)
        break
      }
      case 'DISCOVER': {
        const details = event.details
        const node = expected.nodes[details.nodeId]
        expect(node.status).toBe('UNVISITED')
        expect(details.discovery).toBe(clock)
        expect(details.low).toBe(clock)
        if (previous?.type === 'INSPECT_TREE') {
          expect(details.parentId).toBe(previous.details.nodeId)
          expect(details.nodeId).toBe(previous.details.neighborId)
        } else {
          expect(previous?.type).toBe('COMPONENT_START')
          expect(details.parentId).toBeNull()
          expect(details.nodeId).toBe(roots.at(-1))
        }
        node.parent = details.parentId
        node.discovery = clock
        node.low = clock
        node.status = 'ACTIVE'
        discovered.push(details.nodeId)
        clock += 1
        break
      }
      case 'INSPECT_TREE': {
        const details = event.details
        expect(expected.nodes[details.nodeId].status).toBe('ACTIVE')
        expect(expected.nodes[details.neighborId].status).toBe('UNVISITED')
        expect(expected.edges[details.edgeId]).toBe('UNINSPECTED')
        const count = (childCounts.get(details.nodeId) ?? 0) + 1
        childCounts.set(details.nodeId, count)
        expect(details.childCount).toBe(count)
        expected.edges[details.edgeId] = 'TREE'
        treeEdges.push(details.edgeId)
        break
      }
      case 'INSPECT_PARENT': {
        const details = event.details
        expect(expected.nodes[details.nodeId].parent).toBe(details.neighborId)
        expect(details.low).toBe(expected.nodes[details.nodeId].low)
        break
      }
      case 'INSPECT_VISITED': {
        const details = event.details
        const node = expected.nodes[details.nodeId]
        const neighbor = expected.nodes[details.neighborId]
        const oldLow = numberValue(node.low)
        const neighborDiscovery = numberValue(neighbor.discovery)
        expect(node.parent).not.toBe(details.neighborId)
        expect(details.oldLow).toBe(oldLow)
        expect(details.neighborDiscovery).toBe(neighborDiscovery)
        node.low = Math.min(oldLow, neighborDiscovery)
        expect(details.newLow).toBe(node.low)
        if (expected.edges[details.edgeId] === 'UNINSPECTED') expected.edges[details.edgeId] = 'NON_TREE'
        break
      }
      case 'RETURN_CHILD': {
        const details = event.details
        expect(previous?.type).toBe('FINISH_NODE')
        expect(previous?.focus.nodeId).toBe(details.childId)
        const parent = expected.nodes[details.nodeId]
        const child = expected.nodes[details.childId]
        expect(parent.status).toBe('ACTIVE')
        expect(child.status).toBe('FINISHED')
        expect(child.parent).toBe(details.nodeId)
        const oldLow = numberValue(parent.low)
        const childLow = numberValue(child.low)
        expect(details.oldLow).toBe(oldLow)
        expect(details.childLow).toBe(childLow)
        parent.low = Math.min(oldLow, childLow)
        expect(details.newLow).toBe(parent.low)
        break
      }
      case 'CLASSIFY_EDGE': {
        const details = event.details
        expect(previous?.type).toBe('RETURN_CHILD')
        expect(previous?.focus.edgeId).toBe(details.edgeId)
        expect(classified.has(details.edgeId)).toBe(false)
        classified.add(details.edgeId)
        const parent = expected.nodes[details.nodeId]
        const child = expected.nodes[details.childId]
        expect(child.status).toBe('FINISHED')
        expect(child.parent).toBe(details.nodeId)
        const low = numberValue(child.low)
        const discovery = numberValue(parent.discovery)
        expect(details.childLow).toBe(low)
        expect(details.parentDiscovery).toBe(discovery)
        expect(details.isBridge).toBe(low > discovery)
        expect(details.parentIsRoot).toBe(parent.parent === null)
        expect(details.nonRootArticulation).toBe(parent.parent === null ? null : low >= discovery)
        if (parent.parent !== null && low >= discovery) candidates.add(details.nodeId)
        if (low > discovery) {
          expected.edges[details.edgeId] = 'BRIDGE'
          expected.bridgeIds.push(details.edgeId)
          expected.bridgeIds.sort()
        }
        break
      }
      case 'ARTICULATION': {
        const details = event.details
        expect(expected.articulationIds).not.toContain(details.nodeId)
        expect(expected.nodes[details.nodeId].status).toBe('ACTIVE')
        if (details.rule === 'NON_ROOT_LOW') {
          expect(previous?.type).toBe('CLASSIFY_EDGE')
          expect(previous?.focus.nodeId).toBe(details.nodeId)
          expect(expected.nodes[details.nodeId].parent).not.toBeNull()
          expect(details.childLow).toBe(expected.nodes[details.childId].low)
          expect(details.discovery).toBe(expected.nodes[details.nodeId].discovery)
          expect(details.childLow).toBeGreaterThanOrEqual(details.discovery)
        } else {
          expect(expected.nodes[details.nodeId].parent).toBeNull()
          expect(details.childCount).toBe(childCounts.get(details.nodeId))
          expect(details.childCount).toBeGreaterThanOrEqual(2)
          expect(result.events[index + 1]?.type).toBe('FINISH_NODE')
        }
        expected.articulationIds.push(details.nodeId)
        expected.articulationIds.sort()
        break
      }
      case 'FINISH_NODE': {
        const details = event.details
        const node = expected.nodes[details.nodeId]
        const count = childCounts.get(details.nodeId) ?? 0
        const isRoot = node.parent === null
        const isArticulation = isRoot ? count >= 2 : candidates.has(details.nodeId)
        expect(node.status).toBe('ACTIVE')
        expect(details.discovery).toBe(node.discovery)
        expect(details.low).toBe(node.low)
        expect(details.childCount).toBe(count)
        expect(details.isRoot).toBe(isRoot)
        expect(details.isArticulation).toBe(isArticulation)
        expect(expected.articulationIds.includes(details.nodeId)).toBe(isArticulation)
        node.status = 'FINISHED'
        break
      }
      case 'COMPONENT_END': {
        expect(previous?.type).toBe('FINISH_NODE')
        expect(previous?.focus.nodeId).toBe(event.details.rootId)
        expect(event.details.rootId).toBe(roots.at(-1))
        expect(event.details.componentCount).toBe(expected.componentCount)
        expect(Object.values(expected.nodes).some((node) => node.status === 'ACTIVE')).toBe(false)
        break
      }
    }

    expect(event.snapshot, `event ${index}: ${event.type}`).toEqual(expected)
    before = event.snapshot
  })

  expect(result.finalSnapshot).toBe(result.events.at(-1)?.snapshot)
  expect(result.finalSnapshot).toEqual(before)
  expect(Object.values(before.nodes).every((node) => node.status === 'FINISHED')).toBe(true)
  expect(result.discoveryOrder).toEqual(discovered)
  expect(result.componentRoots).toEqual(roots)
  expect(result.componentCount).toBe(roots.length)
  expect(result.treeEdgeIds).toEqual(treeEdges)
  expect([...classified].sort()).toEqual([...treeEdges].sort())
  expect(result.bridgeIds).toEqual(before.bridgeIds)
  expect(result.articulationIds).toEqual(before.articulationIds)
  expect(result.nodes).toEqual(Object.fromEntries(
    Object.entries(before.nodes).map(([id, node]) => [id, {
      parent: node.parent, discovery: node.discovery, low: node.low,
    }]),
  ))
}
