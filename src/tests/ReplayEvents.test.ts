import { describe, expect, it, vi } from 'vitest'
import { AnalysisService } from '../application/AnalysisService'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { TarjanLowLinkAnalyzer } from '../domain/algorithms/TarjanLowLinkAnalyzer'
import { buildSortedAdjacency } from '../domain/graph/SortedAdjacencyBuilder'
import type { ReplayEvent } from '../domain/models/ReplayEvent'
import { MAIN_GRAPH_ORACLE } from './fixtures/mainGraphOracle'
import { analysisSummary } from './helpers/analysisSummary'
import { allConnections, graphFromConnections, shuffled } from './helpers/graphFixtures'
import { assertReplayTransitions } from './helpers/replayAssertions'

function analyze(graph = createFestivalArchipelago(), analyzer = new TarjanLowLinkAnalyzer()) {
  return analyzer.analyze(buildSortedAdjacency(graph))
}

describe('replay: exact ordering and numerical proof', () => {
  it('starts with unset values, unvisited nodes, uninspected edges, and empty summaries', () => {
    const result = analyze()
    expect(result.initialSnapshot.componentCount).toBe(0)
    expect(result.initialSnapshot.bridgeIds).toEqual([])
    expect(result.initialSnapshot.articulationIds).toEqual([])
    for (const node of Object.values(result.initialSnapshot.nodes)) {
      expect(node).toEqual({ parent: null, discovery: null, low: null, status: 'UNVISITED' })
    }
    expect(Object.values(result.initialSnapshot.edges)).toEqual(Array(9).fill('UNINSPECTED'))
    expect(result.events[0].snapshot.componentCount).toBe(1)
    expect(result.events[0].snapshot.nodes.A.discovery).toBeNull()
  })

  it('matches the complete hand-derived ten-event trace for one edge', () => {
    const graph = graphFromConnections(['B', 'A'], [['ROAD', 'B', 'A']])
    const result = analyze(graph)
    expect(result.events.map((event) => [
      event.index, event.type, event.focus.nodeId, event.focus.edgeId ?? null,
    ])).toEqual([
      [0, 'COMPONENT_START', 'A', null],
      [1, 'DISCOVER', 'A', null],
      [2, 'INSPECT_TREE', 'A', 'ROAD'],
      [3, 'DISCOVER', 'B', null],
      [4, 'INSPECT_PARENT', 'B', 'ROAD'],
      [5, 'FINISH_NODE', 'B', null],
      [6, 'RETURN_CHILD', 'A', 'ROAD'],
      [7, 'CLASSIFY_EDGE', 'A', 'ROAD'],
      [8, 'FINISH_NODE', 'A', null],
      [9, 'COMPONENT_END', 'A', null],
    ])
    expect(result.events[2].snapshot.nodes.B.discovery).toBeNull()
    expect(result.events[2].snapshot.edges.ROAD).toBe('TREE')
    expect(result.events[5].snapshot.nodes.B.status).toBe('FINISHED')
    expect(result.events[6].details).toMatchObject({ oldLow: 0, newLow: 0, childLow: 1 })
    expect(result.events[6].snapshot.bridgeIds).toEqual([])
    expect(result.events[7].snapshot.bridgeIds).toEqual(['ROAD'])
    assertReplayTransitions(graph, result)
  })

  it('records an isolated root and the negative zero-child root outcome', () => {
    const graph = graphFromConnections(['Z'])
    const result = analyze(graph)
    expect(result.events.map((event) => event.type)).toEqual([
      'COMPONENT_START', 'DISCOVER', 'FINISH_NODE', 'COMPONENT_END',
    ])
    expect(result.events[2].details).toMatchObject({
      nodeId: 'Z', childCount: 0, isRoot: true, isArticulation: false,
    })
    assertReplayTransitions(graph, result)
  })

  it('records the main graph in exactly 54 events with contiguous zero-based indexes', () => {
    const result = analyze()
    const counts = Object.fromEntries(
      [...new Set(result.events.map((event) => event.type))].map((type) => [
        type, result.events.filter((event) => event.type === type).length,
      ]),
    )
    expect(counts).toEqual({
      COMPONENT_START: 1,
      DISCOVER: 8,
      INSPECT_TREE: 7,
      INSPECT_PARENT: 7,
      INSPECT_VISITED: 4,
      RETURN_CHILD: 7,
      CLASSIFY_EDGE: 7,
      ARTICULATION: 4,
      FINISH_NODE: 8,
      COMPONENT_END: 1,
    })
    expect(result.events.map((event) => event.index)).toEqual(
      Array.from({ length: 54 }, (_, index) => index),
    )
  })

  it('inspects each undirected edge exactly once from each endpoint', () => {
    const graph = createFestivalArchipelago()
    const inspections = analyze(graph).events.filter((event) => event.type.startsWith('INSPECT_'))
    for (const edge of graph.edges) {
      const directions = inspections
        .filter((event) => event.focus.edgeId === edge.id)
        .map((event) => `${event.focus.nodeId}>${event.focus.relatedNodeId}`)
        .sort()
      expect(directions).toEqual([`${edge.source}>${edge.target}`, `${edge.target}>${edge.source}`].sort())
    }
  })

  it('classifies every tree edge once, immediately after return from a finished child', () => {
    const result = analyze()
    const classifications = result.events.filter((event) => event.type === 'CLASSIFY_EDGE')
    expect(classifications.map((event) => event.details.edgeId).sort())
      .toEqual([...result.treeEdgeIds].sort())
    for (const event of classifications) {
      const returned = result.events[event.index - 1]
      const finished = result.events[event.index - 2]
      expect(returned.type).toBe('RETURN_CHILD')
      expect(returned.focus.edgeId).toBe(event.details.edgeId)
      expect(finished.type).toBe('FINISH_NODE')
      expect(finished.focus.nodeId).toBe(event.details.childId)
    }
  })

  it('explains return F -> E as low[E] changing from 4 to 3', () => {
    const event = analyze().events.filter((candidate) => candidate.type === 'RETURN_CHILD')
      .find((candidate) => candidate.details.nodeId === 'E' && candidate.details.childId === 'F')
    expect(event).toBeDefined()
    if (event === undefined) throw new Error('Missing F -> E return')
    expect(event.details).toEqual({
      nodeId: 'E', childId: 'F', edgeId: 'EF', oldLow: 4, newLow: 3, childLow: 3,
    })
    expect(event.snapshot.nodes.E.low).toBe(3)
    expect(event.message).toContain('Return F -> E')
    expect(event.message).toContain('4 -> 3')
  })

  it('explains a back connection using discovery[neighbor] rather than low[neighbor]', () => {
    const graph = graphFromConnections(['A', 'B', 'C', 'D', 'E'], [
      ['AB', 'A', 'B'], ['AC', 'A', 'C'], ['BC', 'B', 'C'],
      ['CD', 'C', 'D'], ['CE', 'C', 'E'], ['DE', 'D', 'E'],
    ])
    const result = analyze(graph)
    const event = result.events.filter((candidate) => candidate.type === 'INSPECT_VISITED')
      .find((candidate) => candidate.details.nodeId === 'E' && candidate.details.neighborId === 'C')
    expect(event?.details).toMatchObject({ neighborDiscovery: 2, oldLow: 4, newLow: 2 })
    expect(event?.snapshot.nodes.C.low).toBe(0)
    expect(event?.snapshot.nodes.E.low).toBe(2)
    assertReplayTransitions(graph, result)
  })

  it('retains unchanged low updates as explicit return and visited events', () => {
    const result = analyze()
    expect(result.events.filter((event) => event.type === 'RETURN_CHILD')
      .some((event) => event.details.oldLow === event.details.newLow)).toBe(true)
    expect(result.events.filter((event) => event.type === 'INSPECT_VISITED')
      .some((event) => event.details.oldLow === event.details.newLow)).toBe(true)
    expect(result.events.filter((event) => event.type === 'INSPECT_PARENT')).toHaveLength(7)
  })

  it('explains DE as non-bridge at equality and then marks D as non-root articulation', () => {
    const result = analyze()
    const event = result.events.filter((candidate) => candidate.type === 'CLASSIFY_EDGE')
      .find((candidate) => candidate.details.edgeId === 'DE')
    if (event === undefined) throw new Error('Missing DE classification')
    expect(event.details).toMatchObject({
      nodeId: 'D', childId: 'E', parentDiscovery: 3, childLow: 3,
      isBridge: false, parentIsRoot: false, nonRootArticulation: true,
    })
    expect(event.message).toContain('not a bridge')
    expect(event.message).toContain('3 >= 3 is true')
    expect(event.snapshot.bridgeIds).not.toContain('DE')
    expect(event.snapshot.articulationIds).not.toContain('D')
    const articulation = result.events[event.index + 1]
    expect(articulation.type).toBe('ARTICULATION')
    expect(articulation.details).toEqual({
      rule: 'NON_ROOT_LOW', nodeId: 'D', childId: 'E', childLow: 3, discovery: 3,
    })
    expect(articulation.snapshot.articulationIds).toContain('D')
    expect(articulation.message).toContain('>= discovery[D] = 3 is true')
  })

  it('records both true and false bridge and non-root articulation outcomes', () => {
    const events = analyze().events.filter((event) => event.type === 'CLASSIFY_EDGE')
    expect(events.some((event) => event.details.isBridge)).toBe(true)
    expect(events.some((event) => !event.details.isBridge)).toBe(true)
    expect(events.some((event) => event.details.nonRootArticulation === true)).toBe(true)
    expect(events.some((event) => event.details.nonRootArticulation === false)).toBe(true)
    expect(events.some((event) => event.details.nonRootArticulation === null)).toBe(true)
  })

  it('marks a branching root after its children and immediately before its finish event', () => {
    const graph = graphFromConnections(['A', 'B', 'C'], [['AB', 'A', 'B'], ['AC', 'A', 'C']])
    const result = analyze(graph)
    const event = result.events.find((candidate) => candidate.type === 'ARTICULATION')
    if (event === undefined) throw new Error('Missing root articulation')
    expect(event.details).toEqual({ rule: 'ROOT_CHILD_COUNT', nodeId: 'A', childCount: 2 })
    expect(event.snapshot.nodes.A.status).toBe('ACTIVE')
    expect(event.snapshot.nodes.B.status).toBe('FINISHED')
    expect(event.snapshot.nodes.C.status).toBe('FINISHED')
    expect(result.events[event.index + 1].type).toBe('FINISH_NODE')
    assertReplayTransitions(graph, result)
  })

  it('explains why a root with graph degree two but one DFS child is not an articulation', () => {
    const result = analyze()
    const finished = result.events.filter((event) => event.type === 'FINISH_NODE')
      .find((event) => event.details.nodeId === 'A')
    expect(finished?.details).toMatchObject({ isRoot: true, childCount: 1, isArticulation: false })
    expect(finished?.message).toContain('1 >= 2 is false')
    expect(result.events.filter((event) => event.type === 'ARTICULATION')
      .some((event) => event.focus.nodeId === 'A')).toBe(false)
  })

  it('emits one articulation mark even when several children satisfy the rule', () => {
    const graph = graphFromConnections(['A', 'B', 'C', 'D'], [
      ['AB', 'A', 'B'], ['BC', 'B', 'C'], ['BD', 'B', 'D'],
    ])
    const result = analyze(graph)
    expect(result.events.filter((event) => event.type === 'CLASSIFY_EDGE')
      .filter((event) => event.details.nonRootArticulation === true)).toHaveLength(2)
    expect(result.events.filter((event) => event.type === 'ARTICULATION')).toHaveLength(1)
    assertReplayTransitions(graph, result)
  })

  it('records later component roots, count changes, and a continuous global discovery clock', () => {
    const graph = graphFromConnections(['F', 'E', 'D', 'C', 'B', 'A'], [
      ['AB', 'A', 'B'], ['AC', 'A', 'C'], ['DE', 'D', 'E'],
    ])
    const result = analyze(graph)
    expect(result.events.filter((event) => event.type === 'COMPONENT_START')
      .map((event) => event.details)).toEqual([
      { rootId: 'A', oldCount: 0, newCount: 1 },
      { rootId: 'D', oldCount: 1, newCount: 2 },
      { rootId: 'F', oldCount: 2, newCount: 3 },
    ])
    expect(result.events.filter((event) => event.type === 'DISCOVER')
      .map((event) => event.details.discovery)).toEqual([0, 1, 2, 3, 4, 5])
    assertReplayTransitions(graph, result)
  })

  it('shows critical IDs only when the corresponding classification or mark is emitted', () => {
    const result = analyze()
    for (const event of result.events) {
      if (event.type === 'CLASSIFY_EDGE' && event.details.isBridge) {
        expect(result.events[event.index - 1].snapshot.bridgeIds).not.toContain(event.details.edgeId)
        expect(event.snapshot.bridgeIds).toContain(event.details.edgeId)
      }
      if (event.type === 'ARTICULATION') {
        expect(result.events[event.index - 1].snapshot.articulationIds).not.toContain(event.details.nodeId)
        expect(event.snapshot.articulationIds).toContain(event.details.nodeId)
      }
    }
  })

  it('matches every main-history state transition, numerical proof, focus, and unchanged value', () => {
    const graph = createFestivalArchipelago()
    assertReplayTransitions(graph, analyze(graph))
  })

  it('records cycle-only inspection without inventing any critical item', () => {
    const graph = graphFromConnections(['A', 'B', 'C'], [
      ['AB', 'A', 'B'], ['BC', 'B', 'C'], ['AC', 'A', 'C'],
    ])
    const result = analyze(graph)
    expect(result.events).toHaveLength(18)
    expect(result.events.filter((event) => event.type === 'ARTICULATION')).toEqual([])
    expect(result.events.every((event) => event.snapshot.bridgeIds.length === 0)).toBe(true)
    assertReplayTransitions(graph, result)
  })

  it('validates complete event transitions for every simple graph on one through four nodes', () => {
    let checked = 0
    for (let size = 1; size <= 4; size++) {
      const ids = Array.from({ length: size }, (_, index) => String.fromCharCode(65 + index))
      const candidates = allConnections(ids)
      for (let mask = 0; mask < 2 ** candidates.length; mask++) {
        const graph = graphFromConnections([...ids].reverse(),
          candidates.filter((_, index) => (mask & (1 << index)) !== 0).reverse())
        assertReplayTransitions(graph, analyze(graph))
        checked += 1
      }
    }
    expect(checked).toBe(75)
  })
})

describe('replay: immutable snapshots and final consistency', () => {
  it('keeps finalSnapshot identical to the last event snapshot and consistent with the reference table', () => {
    const result = analyze()
    expect(result.finalSnapshot).toBe(result.events.at(-1)?.snapshot)
    expect(analysisSummary(result)).toEqual(MAIN_GRAPH_ORACLE)
    expect(result.finalSnapshot.componentCount).toBe(1)
    expect(result.finalSnapshot.bridgeIds).toEqual(MAIN_GRAPH_ORACLE.bridgeIds)
    expect(result.finalSnapshot.articulationIds).toEqual(MAIN_GRAPH_ORACLE.articulationIds)
    for (const [id, node] of Object.entries(MAIN_GRAPH_ORACLE.nodes)) {
      expect(result.finalSnapshot.nodes[id]).toEqual({ ...node, status: 'FINISHED' })
    }
  })

  it('retains DFS-tree, non-tree, and bridge states in the final map data', () => {
    expect(analyze().finalSnapshot.edges).toEqual({
      AB: 'TREE', AC: 'NON_TREE', BC: 'TREE', CD: 'BRIDGE', DE: 'TREE',
      DF: 'NON_TREE', EF: 'TREE', EG: 'BRIDGE', GH: 'BRIDGE',
    })
  })

  it('freezes the full history, metadata, summaries, and every snapshot level', () => {
    const result = analyze()
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.events)).toBe(true)
    expect(Object.isFrozen(result.nodes.A)).toBe(true)
    for (const event of result.events) {
      expect(Object.isFrozen(event)).toBe(true)
      expect(Object.isFrozen(event.focus)).toBe(true)
      expect(Object.isFrozen(event.details)).toBe(true)
      expect(Object.isFrozen(event.snapshot)).toBe(true)
      expect(Object.isFrozen(event.snapshot.nodes)).toBe(true)
      expect(Object.isFrozen(event.snapshot.edges)).toBe(true)
      expect(Object.isFrozen(event.snapshot.bridgeIds)).toBe(true)
      expect(Object.isFrozen(event.snapshot.articulationIds)).toBe(true)
      for (const node of Object.values(event.snapshot.nodes)) expect(Object.isFrozen(node)).toBe(true)
    }
  })

  it('owns independent nested values in successive snapshots even when values are unchanged', () => {
    const result = analyze()
    let previous = result.initialSnapshot
    for (const event of result.events) {
      expect(event.snapshot).not.toBe(previous)
      expect(event.snapshot.nodes).not.toBe(previous.nodes)
      expect(event.snapshot.nodes.A).not.toBe(previous.nodes.A)
      expect(event.snapshot.edges).not.toBe(previous.edges)
      expect(event.snapshot.bridgeIds).not.toBe(previous.bridgeIds)
      expect(event.snapshot.articulationIds).not.toBe(previous.articulationIds)
      previous = event.snapshot
    }
  })

  it('cannot mutate an earlier node, edge, metadata object, or history array', () => {
    const result = analyze()
    const first = result.events[0]
    const before = JSON.stringify(result)
    expect(Reflect.set(first.snapshot.nodes.A, 'low', 99)).toBe(false)
    expect(Reflect.set(first.snapshot.edges, 'AB', 'BRIDGE')).toBe(false)
    expect(Reflect.set(first.focus, 'nodeId', 'Z')).toBe(false)
    expect(Reflect.set(first.details, 'newCount', 99)).toBe(false)
    expect(() => (result.events as ReplayEvent[]).push(first)).toThrow(TypeError)
    expect(JSON.stringify(result)).toBe(before)
  })

  it('does not allow later traversal to overwrite earlier discovery and edge values', () => {
    const result = analyze()
    const discoveredA = result.events.find((event) => event.type === 'DISCOVER')
    expect(discoveredA?.snapshot.nodes.B.discovery).toBeNull()
    expect(discoveredA?.snapshot.nodes.B.status).toBe('UNVISITED')
    expect(discoveredA?.snapshot.edges.AB).toBe('UNINSPECTED')
    expect(result.finalSnapshot.nodes.B.discovery).toBe(1)
    expect(discoveredA?.snapshot.nodes.B.discovery).toBeNull()
  })

  it('remains unchanged when the caller later edits its own graph objects', () => {
    const graph = createFestivalArchipelago()
    const result = analyze(graph)
    const before = JSON.stringify(result)
    Reflect.set(graph.nodes[0], 'id', 'Z')
    Reflect.set(graph.edges[0], 'id', 'EDITED')
    expect(JSON.stringify(result)).toBe(before)
  })

  it('records complete consistent snapshots at the maximum 12-node/20-edge limit', () => {
    const ids = Array.from({ length: 12 }, (_, index) => String.fromCharCode(65 + index))
    const graph = graphFromConnections(ids, allConnections(ids).slice(0, 20))
    const result = analyze(graph)
    expect(Object.keys(result.initialSnapshot.nodes)).toHaveLength(12)
    expect(Object.keys(result.initialSnapshot.edges)).toHaveLength(20)
    expect(Object.values(result.finalSnapshot.edges)).not.toContain('UNINSPECTED')
    assertReplayTransitions(graph, result)
  })
})

describe('replay: repeatability and service integration', () => {
  it('produces identical serialized histories on repeated calls to the same analyzer', () => {
    const analyzer = new TarjanLowLinkAnalyzer()
    const first = analyze(createFestivalArchipelago(), analyzer)
    analyze(graphFromConnections(['Z']), analyzer)
    const second = analyze(createFestivalArchipelago(), analyzer)
    expect(JSON.stringify(second)).toBe(JSON.stringify(first))
    expect(first.events).not.toBe(second.events)
    expect(first.events[0].snapshot.nodes.A).not.toBe(second.events[0].snapshot.nodes.A)
  })

  it('produces the same full history when both source arrays are reversed', () => {
    const graph = createFestivalArchipelago()
    const reversed = { nodes: [...graph.nodes].reverse(), edges: [...graph.edges].reverse() }
    expect(JSON.stringify(analyze(reversed))).toBe(JSON.stringify(analyze(graph)))
  })

  it.each([1, 17, 42, 99])('produces the same serialized history under permutation %s', (seed) => {
    const graph = createFestivalArchipelago()
    const permuted = { nodes: shuffled(graph.nodes, seed), edges: shuffled(graph.edges, seed + 1) }
    expect(JSON.stringify(analyze(permuted))).toBe(JSON.stringify(analyze(graph)))
  })

  it('is independent of coordinates, display names, and endpoint orientation', () => {
    const graph = createFestivalArchipelago()
    const changed = {
      nodes: graph.nodes.map((node) => ({ ...node, name: 'Changed', x: 100 - node.x, y: 100 - node.y })),
      edges: graph.edges.map((edge) => ({ ...edge, source: edge.target, target: edge.source })),
    }
    expect(JSON.stringify(analyze(changed))).toBe(JSON.stringify(analyze(graph)))
  })

  it('returns the prepared history through the injected service after one analysis call', () => {
    const analyzer = new TarjanLowLinkAnalyzer()
    const spy = vi.spyOn(analyzer, 'analyze')
    const service = new AnalysisService(analyzer)
    const load = service.prepare(graphFromConnections(['A', 'B'], [['ROAD', 'A', 'B']]))
    expect(load.ok).toBe(true)
    if (!load.ok) throw new Error('Expected a valid prepared history')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(load.result.events).toHaveLength(10)
    expect(load.result.finalSnapshot).toBe(load.result.events.at(-1)?.snapshot)
  })

  it('returns no history on invalid input and preserves an earlier immutable result', () => {
    const analyzer = new TarjanLowLinkAnalyzer()
    const spy = vi.spyOn(analyzer, 'analyze')
    const service = new AnalysisService(analyzer)
    const valid = service.prepare(createFestivalArchipelago())
    if (!valid.ok) throw new Error('Expected initial success')
    const before = JSON.stringify(valid.result)
    const invalid = service.prepare({ nodes: [], edges: [] })
    expect(invalid.ok).toBe(false)
    expect(invalid).not.toHaveProperty('result')
    expect(invalid).not.toHaveProperty('events')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(valid.result)).toBe(before)
  })
})
