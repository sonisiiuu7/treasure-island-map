import { describe, expect, it } from 'vitest'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import type { Bridge, Graph, Island } from '../domain/models/Graph'
import type { ValidationErrorCode } from '../domain/models/ValidationResult'
import { validateGraph } from '../domain/validation/GraphValidator'

function makeGraph(nodeCount: number, edgeCount = 0): Graph {
  const nodes: Island[] = Array.from({ length: nodeCount }, (_, index) => ({
    id: `N${index}`,
    name: `Island ${index}`,
    x: 50,
    y: 50,
  }))
  const edges: Bridge[] = []
  for (let source = 0; source < nodeCount && edges.length < edgeCount; source++) {
    for (let target = source + 1; target < nodeCount && edges.length < edgeCount; target++) {
      edges.push({ id: `E${edges.length}`, source: `N${source}`, target: `N${target}` })
    }
  }
  return { nodes, edges }
}

function withFirstNode(changes: Record<string, unknown>) {
  const graph = createFestivalArchipelago()
  return {
    ...graph,
    nodes: graph.nodes.map((node, index) => (index === 0 ? { ...node, ...changes } : node)),
  }
}

function withFirstEdge(changes: Record<string, unknown>) {
  const graph = createFestivalArchipelago()
  return {
    ...graph,
    edges: graph.edges.map((edge, index) => (index === 0 ? { ...edge, ...changes } : edge)),
  }
}

function expectInvalid(input: unknown, code: ValidationErrorCode, path?: string) {
  const result = validateGraph(input)
  expect(result.valid).toBe(false)
  if (result.valid) throw new Error('Expected validation failure')
  expect(result.errors).toContainEqual(expect.objectContaining({ code, ...(path ? { path } : {}) }))
  expect(result).not.toHaveProperty('graph')
  return result.errors
}

function deepFreeze(value: unknown): void {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return
  Object.freeze(value)
  for (const child of Object.values(value)) deepFreeze(child)
}

describe('validateGraph: accepted graphs and boundaries', () => {
  it('accepts the original eight-island, nine-edge archipelago', () => {
    const graph = createFestivalArchipelago()
    expect(validateGraph(graph)).toEqual({ valid: true, graph, errors: [] })
  })

  it('accepts one island with no edges', () => {
    expect(validateGraph(makeGraph(1)).valid).toBe(true)
  })

  it('accepts 12 islands and 20 distinct edges', () => {
    const graph = makeGraph(12, 20)
    expect(graph.edges).toHaveLength(20)
    expect(validateGraph(graph).valid).toBe(true)
  })

  it('accepts a disconnected graph and isolated islands', () => {
    expect(validateGraph(makeGraph(5, 1)).valid).toBe(true)
  })

  it.each([0, 100])('accepts coordinate boundary %s for both axes', (coordinate) => {
    expect(validateGraph(withFirstNode({ x: coordinate, y: coordinate })).valid).toBe(true)
  })

  it.each(['A', 'A0_-', 'A'.repeat(16)])('accepts valid node ID %s', (id) => {
    const graph = { nodes: [{ id, name: 'Festival', x: 0, y: 100 }], edges: [] }
    expect(validateGraph(graph).valid).toBe(true)
  })

  it.each(['A', 'A0_-', 'A'.repeat(16)])('accepts valid edge ID %s', (id) => {
    expect(validateGraph(withFirstEdge({ id })).valid).toBe(true)
  })

  it('allows a node and an edge to share an ID across their separate collections', () => {
    expect(validateGraph(withFirstEdge({ id: 'A' })).valid).toBe(true)
  })

  it('allows repeated display names and positions', () => {
    const graph = makeGraph(2, 1)
    expect(
      validateGraph({ ...graph, nodes: graph.nodes.map((node) => ({ ...node, name: 'Festival' })) }).valid,
    ).toBe(true)
  })
})

describe('validateGraph: graph size and runtime shape', () => {
  it('rejects zero islands', () => {
    expectInvalid(makeGraph(0), 'NODE_COUNT_OUT_OF_RANGE', 'nodes')
  })

  it('rejects 13 islands', () => {
    expectInvalid(makeGraph(13), 'NODE_COUNT_OUT_OF_RANGE', 'nodes')
  })

  it('rejects 21 otherwise valid edges', () => {
    const graph = makeGraph(12, 21)
    expect(graph.edges).toHaveLength(21)
    expectInvalid(graph, 'EDGE_COUNT_OUT_OF_RANGE', 'edges')
  })

  it.each([null, undefined, 42, 'graph', []])('rejects malformed graph %j', (input) => {
    expectInvalid(input, 'INVALID_GRAPH', '$')
  })

  it('reports both missing arrays together', () => {
    const errors = expectInvalid({}, 'INVALID_NODES', 'nodes')
    expect(errors).toContainEqual(expect.objectContaining({ code: 'INVALID_EDGES', path: 'edges' }))
  })

  it('rejects an invalid nodes collection', () => {
    expectInvalid({ nodes: {}, edges: [] }, 'INVALID_NODES', 'nodes')
  })

  it('rejects an invalid edges collection', () => {
    expectInvalid({ nodes: makeGraph(1).nodes, edges: null }, 'INVALID_EDGES', 'edges')
  })

  it('rejects a malformed node without throwing', () => {
    expectInvalid({ nodes: [null], edges: [] }, 'INVALID_NODE', 'nodes[0]')
  })

  it('rejects a malformed edge without throwing', () => {
    expectInvalid({ nodes: makeGraph(1).nodes, edges: [null] }, 'INVALID_EDGE', 'edges[0]')
  })

  it('rejects an empty slot in a sparse nodes array', () => {
    expectInvalid({ nodes: new Array(1), edges: [] }, 'INVALID_NODE', 'nodes[0]')
  })

  it('rejects an empty slot in a sparse edges array', () => {
    expectInvalid({ nodes: makeGraph(1).nodes, edges: new Array(1) }, 'INVALID_EDGE', 'edges[0]')
  })
})

describe('validateGraph: IDs and names', () => {
  const invalidIds = ['', 'a', '1A', 'A B', 'A.B', 'A\n', 'A'.repeat(17), null, 7]

  it.each(invalidIds)('rejects invalid node ID %j', (id) => {
    expectInvalid(withFirstNode({ id }), 'INVALID_NODE_ID', 'nodes[0].id')
  })

  it.each(invalidIds)('rejects invalid edge ID %j', (id) => {
    expectInvalid(withFirstEdge({ id }), 'INVALID_EDGE_ID', 'edges[0].id')
  })

  it('identifies the second occurrence of a duplicate node ID', () => {
    const graph = createFestivalArchipelago()
    const input = { ...graph, nodes: [...graph.nodes, { ...graph.nodes[0] }] }
    const errors = expectInvalid(input, 'DUPLICATE_NODE_ID', 'nodes[8].id')
    expect(errors).toContainEqual(expect.objectContaining({ nodeId: 'A' }))
  })

  it('identifies duplicate edge IDs on different connections', () => {
    const graph = createFestivalArchipelago()
    const input = {
      ...graph,
      edges: graph.edges.map((edge, index) => (index === 1 ? { ...edge, id: 'AB' } : edge)),
    }
    const errors = expectInvalid(input, 'DUPLICATE_EDGE_ID', 'edges[1].id')
    expect(errors).toContainEqual(expect.objectContaining({ edgeId: 'AB' }))
    expect(errors.some((error) => error.code === 'DUPLICATE_CONNECTION')).toBe(false)
  })

  it.each(['', '  ', '\n\t', null, 42])('rejects invalid display name %j', (name) => {
    expectInvalid(withFirstNode({ name }), 'INVALID_NODE_NAME', 'nodes[0].name')
  })
})

describe.each(['x', 'y'] as const)('validateGraph: %s coordinate', (axis) => {
  it.each([-1, 101, NaN, Infinity, -Infinity, '50', null, undefined, true])(
    'rejects invalid coordinate %s',
    (value) => {
      const errors = expectInvalid(
        withFirstNode({ [axis]: value }),
        'INVALID_COORDINATE',
        `nodes[0].${axis}`,
      )
      expect(errors).toContainEqual(expect.objectContaining({ nodeId: 'A' }))
    },
  )
})

describe('validateGraph: endpoints and undirected connections', () => {
  it.each(['source', 'target'] as const)('rejects an unknown %s endpoint', (endpoint) => {
    const errors = expectInvalid(
      withFirstEdge({ [endpoint]: 'Z' }),
      'UNKNOWN_ENDPOINT',
      `edges[0].${endpoint}`,
    )
    expect(errors).toContainEqual(expect.objectContaining({ edgeId: 'AB', endpointId: 'Z' }))
  })

  it.each(['source', 'target'] as const)('rejects an invalid %s endpoint ID', (endpoint) => {
    expectInvalid(withFirstEdge({ [endpoint]: 'bad id' }), 'INVALID_ENDPOINT', `edges[0].${endpoint}`)
  })

  it.each([null, undefined, 12])('rejects a non-string endpoint %j', (source) => {
    expectInvalid(withFirstEdge({ source }), 'INVALID_ENDPOINT', 'edges[0].source')
  })

  it('rejects a self-loop and identifies its edge and node', () => {
    const errors = expectInvalid(withFirstEdge({ target: 'A' }), 'SELF_LOOP', 'edges[0]')
    expect(errors).toContainEqual(expect.objectContaining({ edgeId: 'AB', endpointId: 'A' }))
  })

  it.each([
    { source: 'A', target: 'B' },
    { source: 'B', target: 'A' },
  ])('rejects the repeated undirected connection $source-$target', (connection) => {
    const graph = createFestivalArchipelago()
    const errors = expectInvalid(
      { ...graph, edges: [...graph.edges, { id: 'REPEATED', ...connection }] },
      'DUPLICATE_CONNECTION',
      'edges[9]',
    )
    expect(errors).toContainEqual(expect.objectContaining({ edgeId: 'REPEATED' }))
  })

  it('does not confuse distinct connections whose IDs contain separators', () => {
    const nodes = ['A', 'B-C', 'A-B', 'C'].map((id) => ({ id, name: id, x: 50, y: 50 }))
    const edges = [
      { id: 'FIRST', source: 'A', target: 'B-C' },
      { id: 'SECOND', source: 'A-B', target: 'C' },
    ]
    expect(validateGraph({ nodes, edges }).valid).toBe(true)
  })
})

describe('validateGraph: complete, stateless validation', () => {
  it('collects independent node and edge errors in one result', () => {
    const graph = createFestivalArchipelago()
    const input = {
      nodes: [...graph.nodes, { ...graph.nodes[0], x: 101 }],
      edges: [...graph.edges, { id: 'BROKEN', source: 'A', target: 'Z' }],
    }
    const result = validateGraph(input)
    expect(result.valid).toBe(false)
    if (result.valid) throw new Error('Expected validation failure')
    expect(result.errors.map((error) => error.code)).toEqual([
      'DUPLICATE_NODE_ID',
      'INVALID_COORDINATE',
      'UNKNOWN_ENDPOINT',
    ])
    expect(result).not.toHaveProperty('graph')
  })

  it('does not mutate even a deeply frozen graph', () => {
    const graph = createFestivalArchipelago()
    const before = structuredClone(graph)
    deepFreeze(graph)
    expect(validateGraph(graph).valid).toBe(true)
    expect(graph).toEqual(before)
  })

  it('does not retain errors from an invalid call during a later valid call', () => {
    const invalid = withFirstNode({ x: 101 })
    const failure = validateGraph(invalid)
    expect(failure.valid).toBe(false)
    expect(validateGraph(createFestivalArchipelago()).valid).toBe(true)
    expect(validateGraph(invalid)).toEqual(failure)
  })

  it('returns identical errors for repeated invalid inputs', () => {
    const input = withFirstEdge({ source: 'Z', target: 'Z' })
    expect(validateGraph(input)).toEqual(validateGraph(input))
  })
})
