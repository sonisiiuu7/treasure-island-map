import { describe, expect, it } from 'vitest'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { buildSortedAdjacency } from '../domain/graph/SortedAdjacencyBuilder'
import { adjacencyValues, deepFreeze, graphFromConnections, shuffled } from './helpers/graphFixtures'

describe('buildSortedAdjacency', () => {
  it('matches the independently documented main adjacency lists', () => {
    expect(adjacencyValues(buildSortedAdjacency(createFestivalArchipelago()))).toEqual({
      nodeIds: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      neighbors: {
        A: [{ neighborId: 'B', edgeId: 'AB' }, { neighborId: 'C', edgeId: 'AC' }],
        B: [{ neighborId: 'A', edgeId: 'AB' }, { neighborId: 'C', edgeId: 'BC' }],
        C: [
          { neighborId: 'A', edgeId: 'AC' },
          { neighborId: 'B', edgeId: 'BC' },
          { neighborId: 'D', edgeId: 'CD' },
        ],
        D: [
          { neighborId: 'C', edgeId: 'CD' },
          { neighborId: 'E', edgeId: 'DE' },
          { neighborId: 'F', edgeId: 'DF' },
        ],
        E: [
          { neighborId: 'D', edgeId: 'DE' },
          { neighborId: 'F', edgeId: 'EF' },
          { neighborId: 'G', edgeId: 'EG' },
        ],
        F: [{ neighborId: 'D', edgeId: 'DF' }, { neighborId: 'E', edgeId: 'EF' }],
        G: [{ neighborId: 'E', edgeId: 'EG' }, { neighborId: 'H', edgeId: 'GH' }],
        H: [{ neighborId: 'G', edgeId: 'GH' }],
      },
    })
  })

  it('keeps isolated nodes and both directions of an edge with its original ID', () => {
    const graph = graphFromConnections(['C', 'B', 'A'], [['ROAD', 'B', 'A']])
    expect(adjacencyValues(buildSortedAdjacency(graph))).toEqual({
      nodeIds: ['A', 'B', 'C'],
      neighbors: {
        A: [{ neighborId: 'B', edgeId: 'ROAD' }],
        B: [{ neighborId: 'A', edgeId: 'ROAD' }],
        C: [],
      },
    })
  })

  it('uses ASCII order for roots, map iteration, and neighbors rather than edge IDs', () => {
    const ids = ['A_', 'B', 'A0', 'A-', 'A']
    const graph = graphFromConnections(ids, [
      ['Z', 'A', 'A_'],
      ['Y', 'A', 'A0'],
      ['X', 'A', 'A-'],
      ['W', 'A', 'B'],
    ])
    const result = buildSortedAdjacency(graph)
    expect(result.nodeIds).toEqual(['A', 'A-', 'A0', 'A_', 'B'])
    expect([...result.neighbors.keys()]).toEqual(result.nodeIds)
    expect(result.neighbors.get('A')).toEqual([
      { neighborId: 'A-', edgeId: 'X' },
      { neighborId: 'A0', edgeId: 'Y' },
      { neighborId: 'A_', edgeId: 'Z' },
      { neighborId: 'B', edgeId: 'W' },
    ])
  })

  it('is unchanged when both source arrays are reversed', () => {
    const graph = createFestivalArchipelago()
    const reversed = { nodes: [...graph.nodes].reverse(), edges: [...graph.edges].reverse() }
    expect(adjacencyValues(buildSortedAdjacency(reversed))).toEqual(
      adjacencyValues(buildSortedAdjacency(graph)),
    )
  })

  it.each([1, 2, 3, 17, 42, 99])('is unchanged by seeded permutation %s', (seed) => {
    const graph = createFestivalArchipelago()
    const permuted = { nodes: shuffled(graph.nodes, seed), edges: shuffled(graph.edges, seed + 1) }
    expect(adjacencyValues(buildSortedAdjacency(permuted))).toEqual(
      adjacencyValues(buildSortedAdjacency(graph)),
    )
  })

  it('ignores coordinates, display names, and endpoint direction', () => {
    const graph = createFestivalArchipelago()
    const changed = {
      nodes: graph.nodes.map((node) => ({ ...node, name: 'Festival', x: 100 - node.x, y: 100 - node.y })),
      edges: graph.edges.map((edge) => ({ ...edge, source: edge.target, target: edge.source })),
    }
    expect(adjacencyValues(buildSortedAdjacency(changed))).toEqual(
      adjacencyValues(buildSortedAdjacency(graph)),
    )
  })

  it('does not reorder or mutate even deeply frozen graph data', () => {
    const original = createFestivalArchipelago()
    const graph = deepFreeze({ nodes: [...original.nodes].reverse(), edges: [...original.edges].reverse() })
    const before = structuredClone(graph)
    buildSortedAdjacency(graph)
    expect(graph).toEqual(before)
  })

  it('returns independent index arrays, maps, lists, and entries on each call', () => {
    const graph = createFestivalArchipelago()
    const first = buildSortedAdjacency(graph)
    const second = buildSortedAdjacency(graph)
    expect(first).not.toBe(second)
    expect(first.nodeIds).not.toBe(second.nodeIds)
    expect(first.neighbors).not.toBe(second.neighbors)
    for (const id of first.nodeIds) {
      expect(first.neighbors.get(id)).not.toBe(second.neighbors.get(id))
    }
    expect(first.neighbors.get('A')?.[0]).not.toBe(second.neighbors.get('A')?.[0])
  })

  it('rejects accidental internal use with an unknown endpoint', () => {
    expect(() =>
      buildSortedAdjacency(graphFromConnections(['A'], [['BROKEN', 'A', 'Z']])),
    ).toThrow('validated graph endpoints')
  })
})
