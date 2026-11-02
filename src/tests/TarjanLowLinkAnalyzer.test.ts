import { describe, expect, it } from 'vitest'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { TarjanLowLinkAnalyzer } from '../domain/algorithms/TarjanLowLinkAnalyzer'
import { buildSortedAdjacency } from '../domain/graph/SortedAdjacencyBuilder'
import type { Graph } from '../domain/models/Graph'
import { MAIN_GRAPH_ORACLE } from './fixtures/mainGraphOracle'
import { connectivityOracle } from './helpers/connectivityOracle'
import {
  adjacencyValues,
  allConnections,
  deepFreeze,
  graphFromConnections,
  shuffled,
} from './helpers/graphFixtures'

function analyze(graph: Graph, analyzer = new TarjanLowLinkAnalyzer()) {
  return analyzer.analyze(buildSortedAdjacency(graph))
}

describe('TarjanLowLinkAnalyzer: hand-derived and focused results', () => {
  it('matches every main-graph parent, discovery, low, component, and critical ID', () => {
    expect(analyze(createFestivalArchipelago())).toEqual(MAIN_GRAPH_ORACLE)
  })

  it('finds no critical item in a cycle-only triangle', () => {
    const result = analyze(graphFromConnections(['C', 'B', 'A'], [
      ['AC', 'A', 'C'], ['BC', 'B', 'C'], ['AB', 'A', 'B'],
    ]))
    expect(result).toEqual({
      nodes: {
        A: { parent: null, discovery: 0, low: 0 },
        B: { parent: 'A', discovery: 1, low: 0 },
        C: { parent: 'B', discovery: 2, low: 0 },
      },
      discoveryOrder: ['A', 'B', 'C'],
      componentRoots: ['A'],
      componentCount: 1,
      treeEdgeIds: ['AB', 'BC'],
      bridgeIds: [],
      articulationIds: [],
    })
  })

  it('handles a single isolated island with discovery zero', () => {
    expect(analyze(graphFromConnections(['Z']))).toEqual({
      nodes: { Z: { parent: null, discovery: 0, low: 0 } },
      discoveryOrder: ['Z'],
      componentRoots: ['Z'],
      componentCount: 1,
      treeEdgeIds: [],
      bridgeIds: [],
      articulationIds: [],
    })
  })

  it('skips the parent connection and preserves an edge ID unrelated to its endpoints', () => {
    const result = analyze(graphFromConnections(['B', 'A'], [['ROAD', 'B', 'A']]))
    expect(result.nodes).toEqual({
      A: { parent: null, discovery: 0, low: 0 },
      B: { parent: 'A', discovery: 1, low: 1 },
    })
    expect(result.bridgeIds).toEqual(['ROAD'])
    expect(result.articulationIds).toEqual([])
  })

  it('classifies each path edge and its internal articulation nodes', () => {
    const result = analyze(graphFromConnections(['D', 'C', 'B', 'A'], [
      ['ZROAD', 'A', 'B'], ['AROAD', 'B', 'C'], ['MROAD', 'C', 'D'],
    ]))
    expect(result.nodes).toEqual({
      A: { parent: null, discovery: 0, low: 0 },
      B: { parent: 'A', discovery: 1, low: 1 },
      C: { parent: 'B', discovery: 2, low: 2 },
      D: { parent: 'C', discovery: 3, low: 3 },
    })
    expect(result.bridgeIds).toEqual(['AROAD', 'MROAD', 'ZROAD'])
    expect(result.articulationIds).toEqual(['B', 'C'])
  })

  it('propagates a back connection through multiple returning ancestors', () => {
    const result = analyze(graphFromConnections(['A', 'B', 'C', 'D'], [
      ['AB', 'A', 'B'], ['BC', 'B', 'C'], ['CD', 'C', 'D'], ['AD', 'A', 'D'],
    ]))
    expect(Object.values(result.nodes).map((node) => node.low)).toEqual([0, 0, 0, 0])
    expect(result.bridgeIds).toEqual([])
    expect(result.articulationIds).toEqual([])
  })

  it('propagates F-D into low[F] and then low[E] in the main graph', () => {
    const result = analyze(createFestivalArchipelago())
    expect(result.nodes.F).toEqual({ parent: 'E', discovery: 5, low: 3 })
    expect(result.nodes.E).toEqual({ parent: 'D', discovery: 4, low: 3 })
    expect(result.bridgeIds).not.toContain('EF')
  })

  it('uses strict > for bridges when low[child] equals discovery[parent]', () => {
    const result = analyze(createFestivalArchipelago())
    expect(result.nodes.E.low).toBe(result.nodes.D.discovery)
    expect(result.bridgeIds).not.toContain('DE')
  })

  it('uses >= for non-root articulation when the child can only return to that parent', () => {
    const result = analyze(graphFromConnections(['A', 'B', 'C', 'D'], [
      ['AB', 'A', 'B'], ['BC', 'B', 'C'], ['CD', 'C', 'D'], ['BD', 'B', 'D'],
    ]))
    expect(result.nodes.C.low).toBe(result.nodes.B.discovery)
    expect(result.nodes.B.parent).toBe('A')
    expect(result.bridgeIds).toEqual(['AB'])
    expect(result.articulationIds).toEqual(['B'])
  })

  it('uses a visited neighbor discovery time rather than its lower low value', () => {
    // Two cycles share C. C already reaches A, but D/E can only return to C.
    const result = analyze(graphFromConnections(['A', 'B', 'C', 'D', 'E'], [
      ['AB', 'A', 'B'], ['AC', 'A', 'C'], ['BC', 'B', 'C'],
      ['CD', 'C', 'D'], ['CE', 'C', 'E'], ['DE', 'D', 'E'],
    ]))
    expect(result.nodes.C.low).toBe(0)
    expect(result.nodes.C.discovery).toBe(2)
    expect(result.nodes.D.low).toBe(2)
    expect(result.nodes.E.low).toBe(2)
    expect(result.bridgeIds).toEqual([])
    expect(result.articulationIds).toEqual(['C'])
  })

  it('marks a DFS root with two tree children', () => {
    const result = analyze(graphFromConnections(['C', 'B', 'A'], [
      ['AC', 'A', 'C'], ['AB', 'A', 'B'],
    ]))
    expect(result.nodes.B.parent).toBe('A')
    expect(result.nodes.C.parent).toBe('A')
    expect(result.articulationIds).toEqual(['A'])
  })

  it('does not confuse a root graph degree of two with two DFS-tree children', () => {
    const result = analyze(createFestivalArchipelago())
    expect(result.nodes.B.parent).toBe('A')
    expect(result.nodes.C.parent).toBe('B')
    expect(result.articulationIds).not.toContain('A')
  })

  it('deduplicates a non-root articulation triggered by multiple children', () => {
    const result = analyze(graphFromConnections(['A', 'B', 'C', 'D'], [
      ['AB', 'A', 'B'], ['BC', 'B', 'C'], ['BD', 'B', 'D'],
    ]))
    expect(result.articulationIds).toEqual(['B'])
    expect(result.bridgeIds).toEqual(['AB', 'BC', 'BD'])
  })

  it('combines a branching root, another component, and an isolated node with a global clock', () => {
    const result = analyze(graphFromConnections(['F', 'E', 'D', 'C', 'B', 'A'], [
      ['DE', 'D', 'E'], ['AC', 'A', 'C'], ['AB', 'A', 'B'],
    ]))
    expect(result).toEqual({
      nodes: {
        A: { parent: null, discovery: 0, low: 0 },
        B: { parent: 'A', discovery: 1, low: 1 },
        C: { parent: 'A', discovery: 2, low: 2 },
        D: { parent: null, discovery: 3, low: 3 },
        E: { parent: 'D', discovery: 4, low: 4 },
        F: { parent: null, discovery: 5, low: 5 },
      },
      discoveryOrder: ['A', 'B', 'C', 'D', 'E', 'F'],
      componentRoots: ['A', 'D', 'F'],
      componentCount: 3,
      treeEdgeIds: ['AB', 'AC', 'DE'],
      bridgeIds: ['AB', 'AC', 'DE'],
      articulationIds: ['A'],
    })
  })

  it('applies the root child-count rule in later components too', () => {
    const result = analyze(graphFromConnections(['E', 'D', 'C', 'B', 'A'], [
      ['AB', 'A', 'B'], ['CD', 'C', 'D'], ['CE', 'C', 'E'],
    ]))
    expect(result.componentRoots).toEqual(['A', 'C'])
    expect(result.nodes.C).toEqual({ parent: null, discovery: 2, low: 2 })
    expect(result.articulationIds).toEqual(['C'])
  })

  it('handles the maximum 12 isolated nodes', () => {
    const ids = Array.from({ length: 12 }, (_, index) => String.fromCharCode(65 + index))
    const result = analyze(graphFromConnections([...ids].reverse()))
    expect(result.componentRoots).toEqual(ids)
    expect(result.discoveryOrder).toEqual(ids)
    expect(result.componentCount).toBe(12)
    expect(result.bridgeIds).toEqual([])
    expect(result.articulationIds).toEqual([])
    ids.forEach((id, index) => {
      expect(result.nodes[id]).toEqual({ parent: null, discovery: index, low: index })
    })
  })

  it('agrees with removal-based connectivity at the 12-node, 20-edge engine limit', () => {
    const ids = Array.from({ length: 12 }, (_, index) => String.fromCharCode(65 + index))
    const graph = graphFromConnections(ids, allConnections(ids).slice(0, 20))
    const result = analyze(graph)
    expect(graph.edges).toHaveLength(20)
    expect({
      componentCount: result.componentCount,
      bridgeIds: result.bridgeIds,
      articulationIds: result.articulationIds,
    }).toEqual(connectivityOracle(graph))
    expect(result.discoveryOrder).toHaveLength(12)
  })

  it('finds no critical item in a dense six-node complete graph', () => {
    const ids = ['A', 'B', 'C', 'D', 'E', 'F']
    const result = analyze(graphFromConnections(ids, allConnections(ids)))
    expect(result.componentCount).toBe(1)
    expect(result.bridgeIds).toEqual([])
    expect(result.articulationIds).toEqual([])
  })

  it('sorts final bridge IDs by ASCII rather than discovery or locale order', () => {
    const result = analyze(graphFromConnections(['A', 'A-', 'A0', 'A_', 'B', 'C'], [
      ['E_', 'A', 'B'], ['E2', 'B', 'A-'], ['E10', 'B', 'A0'],
      ['E-', 'B', 'A_'], ['E0', 'B', 'C'],
    ]))
    expect(result.bridgeIds).toEqual(['E-', 'E0', 'E10', 'E2', 'E_'])
    expect(result.articulationIds).toEqual(['B'])
  })

  it('sorts final articulation IDs by ASCII rather than completion order', () => {
    const result = analyze(graphFromConnections(['B', 'A_', 'A0', 'A-', 'A'], [
      ['E0', 'A', 'A-'], ['E1', 'A-', 'A0'], ['E2', 'A0', 'A_'], ['E3', 'A_', 'B'],
    ]))
    expect(result.articulationIds).toEqual(['A-', 'A0', 'A_'])
  })

  it('chooses mixed-format component roots in ASCII order', () => {
    const result = analyze(graphFromConnections(['B', 'A_', 'A0', 'A-', 'A']))
    expect(result.componentRoots).toEqual(['A', 'A-', 'A0', 'A_', 'B'])
    expect(result.discoveryOrder).toEqual(result.componentRoots)
  })
})

describe('TarjanLowLinkAnalyzer: determinism and state isolation', () => {
  it('produces the same complete result when both input arrays are reversed', () => {
    const graph = createFestivalArchipelago()
    expect(analyze({ nodes: [...graph.nodes].reverse(), edges: [...graph.edges].reverse() }))
      .toEqual(MAIN_GRAPH_ORACLE)
  })

  it.each([1, 2, 3, 17, 42, 99])('preserves values and serialized ordering under permutation %s', (seed) => {
    const graph = createFestivalArchipelago()
    const result = analyze({ nodes: shuffled(graph.nodes, seed), edges: shuffled(graph.edges, seed + 1) })
    expect(result).toEqual(MAIN_GRAPH_ORACLE)
    expect(JSON.stringify(result)).toBe(JSON.stringify(analyze(graph)))
  })

  it('is independent of endpoint orientation, display names, and map coordinates', () => {
    const graph = createFestivalArchipelago()
    const changed = {
      nodes: graph.nodes.map((node) => ({ ...node, name: 'Changed', x: 100 - node.x, y: 100 - node.y })),
      edges: graph.edges.map((edge) => ({ ...edge, source: edge.target, target: edge.source })),
    }
    expect(analyze(changed)).toEqual(MAIN_GRAPH_ORACLE)
  })

  it('does not mutate its frozen adjacency index or original graph', () => {
    const graph = deepFreeze(createFestivalArchipelago())
    const beforeGraph = structuredClone(graph)
    const index = deepFreeze(buildSortedAdjacency(graph))
    const beforeIndex = adjacencyValues(index)
    expect(new TarjanLowLinkAnalyzer().analyze(index)).toEqual(MAIN_GRAPH_ORACLE)
    expect(graph).toEqual(beforeGraph)
    expect(adjacencyValues(index)).toEqual(beforeIndex)
  })

  it('starts a new clock and critical sets on every call to the same strategy', () => {
    const analyzer = new TarjanLowLinkAnalyzer()
    const first = deepFreeze(analyze(createFestivalArchipelago(), analyzer))
    const isolated = analyze(graphFromConnections(['Z']), analyzer)
    expect(isolated.nodes.Z.discovery).toBe(0)
    expect(isolated.bridgeIds).toEqual([])
    expect(isolated.articulationIds).toEqual([])
    const repeated = analyze(createFestivalArchipelago(), analyzer)
    expect(repeated).toEqual(first)
    expect(repeated).not.toBe(first)
    expect(repeated.nodes.A).not.toBe(first.nodes.A)
    expect(repeated.discoveryOrder).not.toBe(first.discoveryOrder)
    expect(repeated.bridgeIds).not.toBe(first.bridgeIds)
    expect(repeated.articulationIds).not.toBe(first.articulationIds)
  })
})

describe('TarjanLowLinkAnalyzer: independent exhaustive correctness', () => {
  it('matches edge/node removal for all 1,099 simple graphs with one through five nodes', () => {
    let checked = 0
    for (let size = 1; size <= 5; size++) {
      const ids = Array.from({ length: size }, (_, index) => String.fromCharCode(65 + index))
      const candidates = allConnections(ids)
      for (let mask = 0; mask < 2 ** candidates.length; mask++) {
        const connections = candidates.filter((_, index) => (mask & (1 << index)) !== 0)
        const graph = graphFromConnections([...ids].reverse(), [...connections].reverse())
        const result = analyze(graph)
        const context = `nodes=${size}, edge-mask=${mask}`
        expect({
          componentCount: result.componentCount,
          bridgeIds: result.bridgeIds,
          articulationIds: result.articulationIds,
        }, context).toEqual(connectivityOracle(graph))
        expect(result.treeEdgeIds.length, context).toBe(size - result.componentCount)
        expect(
          Object.values(result.nodes).map((node) => node.discovery).sort((a, b) => a - b),
          context,
        ).toEqual(Array.from({ length: size }, (_, index) => index))
        checked += 1
      }
    }
    expect(checked).toBe(1099)
  })
})
