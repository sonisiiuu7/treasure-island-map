import { describe, expect, it } from 'vitest'
import { createExampleGraph, GRAPH_EXAMPLES, type GraphExampleId } from '../data/createExampleGraph'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { validateGraph } from '../domain/validation/GraphValidator'
import { preparedGraph } from './helpers/replayFixtures'

describe('example catalog', () => {
  it.each(GRAPH_EXAMPLES)('provides a valid deterministic $label graph', ({id}) => {
    const first=createExampleGraph(id)
    expect(validateGraph(first).valid).toBe(true)
    expect(preparedGraph(first).result).toEqual(preparedGraph(createExampleGraph(id)).result)
  })
  it('retains the original festival graph exactly', () => {
    expect(createExampleGraph('FESTIVAL')).toEqual(createFestivalArchipelago())
  })
  it('provides a cycle-only example with no critical items', () => {
    const result=preparedGraph(createExampleGraph('CYCLE')).result
    expect(result.componentCount).toBe(1)
    expect(result.bridgeIds).toEqual([])
    expect(result.articulationIds).toEqual([])
  })
  it('provides a root with two DFS-tree children', () => {
    const result=preparedGraph(createExampleGraph('BRANCHING')).result
    expect(result.articulationIds).toEqual(['A'])
    expect(result.bridgeIds).toEqual(['AB','AC'])
    expect(result.events.find(e=>e.type==='ARTICULATION')?.details).toEqual({rule:'ROOT_CHILD_COUNT',nodeId:'A',childCount:2})
  })
  it('combines branching root, a second component, and an isolated node', () => {
    const result=preparedGraph(createExampleGraph('DISCONNECTED')).result
    expect(result.componentCount).toBe(3)
    expect(result.componentRoots).toEqual(['A','D','F'])
    expect(result.discoveryOrder).toEqual(['A','B','C','D','E','F'])
    expect(result.nodes.F).toEqual({parent:null,discovery:5,low:5})
  })
  it('owns fresh graph values and rejects unknown catalog IDs', () => {
    const first=createExampleGraph('CYCLE')
    const second=createExampleGraph('CYCLE')
    expect(second).not.toBe(first)
    expect(second.nodes[0]).not.toBe(first.nodes[0])
    expect(second.edges[0]).not.toBe(first.edges[0])
    expect(() => createExampleGraph('UNKNOWN' as GraphExampleId)).toThrow('Unknown graph example')
  })
})
