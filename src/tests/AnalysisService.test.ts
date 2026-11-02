import { describe, expect, it, vi } from 'vitest'
import { AnalysisService } from '../application/AnalysisService'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { TarjanLowLinkAnalyzer } from '../domain/algorithms/TarjanLowLinkAnalyzer'
import type { GraphAnalyzer } from '../domain/contracts/GraphAnalyzer'
import type { AnalysisResult } from '../domain/models/AnalysisResult'
import { MAIN_GRAPH_ORACLE } from './fixtures/mainGraphOracle'
import { deepFreeze, graphFromConnections } from './helpers/graphFixtures'

const twoNodeResult: AnalysisResult = {
  nodes: {
    A: { parent: null, discovery: 0, low: 0 },
    B: { parent: 'A', discovery: 1, low: 1 },
  },
  discoveryOrder: ['A', 'B'],
  componentRoots: ['A'],
  componentCount: 1,
  treeEdgeIds: ['ROAD'],
  bridgeIds: ['ROAD'],
  articulationIds: [],
}

describe('AnalysisService', () => {
  it('validates, builds a sorted adjacency index, and invokes the injected strategy once', () => {
    const analyze = vi.fn<GraphAnalyzer['analyze']>(() => twoNodeResult)
    const graph = graphFromConnections(['B', 'A'], [['ROAD', 'B', 'A']])
    const prepared = new AnalysisService({ analyze }).prepare(graph)
    expect(analyze).toHaveBeenCalledExactlyOnceWith({
      nodeIds: ['A', 'B'],
      neighbors: new Map([
        ['A', [{ neighborId: 'B', edgeId: 'ROAD' }]],
        ['B', [{ neighborId: 'A', edgeId: 'ROAD' }]],
      ]),
    })
    expect(prepared).toEqual({ ok: true, graph, result: twoNodeResult })
    if (!prepared.ok) throw new Error('Expected successful preparation')
    expect(prepared.result).toBe(twoNodeResult)
  })

  it('integrates the concrete Tarjan strategy without hardcoded expected application values', () => {
    const graph = createFestivalArchipelago()
    expect(new AnalysisService(new TarjanLowLinkAnalyzer()).prepare(graph)).toEqual({
      ok: true,
      graph,
      result: MAIN_GRAPH_ORACLE,
    })
  })

  const valid = createFestivalArchipelago()
  const invalidInputs = [
    { label: 'malformed graph', input: null, code: 'INVALID_GRAPH' },
    {
      label: 'out-of-range coordinate',
      input: { ...valid, nodes: valid.nodes.map((node, index) => index === 0 ? { ...node, x: 101 } : node) },
      code: 'INVALID_COORDINATE',
    },
    {
      label: 'duplicate node ID',
      input: { ...valid, nodes: [...valid.nodes, { ...valid.nodes[0] }] },
      code: 'DUPLICATE_NODE_ID',
    },
    {
      label: 'late unknown endpoint',
      input: { ...valid, edges: [...valid.edges, { id: 'BROKEN', source: 'A', target: 'Z' }] },
      code: 'UNKNOWN_ENDPOINT',
    },
    {
      label: 'self-loop',
      input: { ...valid, edges: [...valid.edges, { id: 'LOOP', source: 'A', target: 'A' }] },
      code: 'SELF_LOOP',
    },
  ]

  it.each(invalidInputs)('rejects $label before invoking any analyzer', ({ input, code }) => {
    const analyze = vi.fn<GraphAnalyzer['analyze']>(() => twoNodeResult)
    const result = new AnalysisService({ analyze }).prepare(input)
    expect(result.ok).toBe(false)
    expect(analyze).not.toHaveBeenCalled()
    expect(result).not.toHaveProperty('graph')
    expect(result).not.toHaveProperty('result')
    if (result.ok) throw new Error('Expected validation failure')
    expect(result.errors).toContainEqual(expect.objectContaining({ code }))
  })

  it('returns no old or partial analysis when a valid load is followed by an invalid load', () => {
    const analyze = vi.fn<GraphAnalyzer['analyze']>(() => twoNodeResult)
    const service = new AnalysisService({ analyze })
    expect(service.prepare(graphFromConnections(['A', 'B'], [['ROAD', 'A', 'B']])).ok).toBe(true)
    const failure = service.prepare({ nodes: [], edges: [] })
    expect(failure.ok).toBe(false)
    expect(failure).not.toHaveProperty('result')
    expect(failure).not.toHaveProperty('graph')
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('recovers after invalid input and calculates every later valid graph afresh', () => {
    const service = new AnalysisService(new TarjanLowLinkAnalyzer())
    expect(service.prepare(null).ok).toBe(false)
    const first = service.prepare(createFestivalArchipelago())
    expect(first.ok).toBe(true)
    expect(service.prepare({ nodes: [], edges: [] }).ok).toBe(false)
    const second = service.prepare(createFestivalArchipelago())
    expect(second).toEqual(first)
    if (!first.ok || !second.ok) throw new Error('Expected valid preparations')
    expect(second.result).not.toBe(first.result)
    expect(second.result.nodes).not.toBe(first.result.nodes)
  })

  it('does not mutate a frozen graph during validation, indexing, or analysis', () => {
    const graph = deepFreeze(createFestivalArchipelago())
    const before = structuredClone(graph)
    const result = new AnalysisService(new TarjanLowLinkAnalyzer()).prepare(graph)
    expect(result.ok).toBe(true)
    expect(graph).toEqual(before)
  })

  it('preserves application results when source order is reversed', () => {
    const graph = createFestivalArchipelago()
    const result = new AnalysisService(new TarjanLowLinkAnalyzer()).prepare({
      nodes: [...graph.nodes].reverse(),
      edges: [...graph.edges].reverse(),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('Expected valid graph')
    expect(result.result).toEqual(MAIN_GRAPH_ORACLE)
  })

  it('propagates programmer errors from a strategy rather than claiming a validation failure', () => {
    const error = new Error('Strategy failed')
    const service = new AnalysisService({ analyze: () => { throw error } })
    expect(() => service.prepare(createFestivalArchipelago())).toThrow(error)
  })
})
