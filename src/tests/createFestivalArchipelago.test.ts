import { describe, expect, it } from 'vitest'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { validateGraph } from '../domain/validation/GraphValidator'

describe('createFestivalArchipelago', () => {
  it('creates a valid demonstration with eight islands and nine bridges', () => {
    const graph = createFestivalArchipelago()
    expect(graph.nodes).toHaveLength(8)
    expect(graph.edges).toHaveLength(9)
    expect(validateGraph(graph).valid).toBe(true)
  })

  it('returns the same graph values on repeated calls', () => {
    expect(createFestivalArchipelago()).toEqual(createFestivalArchipelago())
  })

  it('shares no mutable graph objects between calls', () => {
    const first = createFestivalArchipelago()
    const second = createFestivalArchipelago()
    expect(first).not.toBe(second)
    expect(first.nodes).not.toBe(second.nodes)
    expect(first.edges).not.toBe(second.edges)
    first.nodes.forEach((node, index) => expect(node).not.toBe(second.nodes[index]))
    first.edges.forEach((edge, index) => expect(edge).not.toBe(second.edges[index]))
  })

  it('remains deterministic across a failed validation attempt', () => {
    const original = createFestivalArchipelago()
    validateGraph({ nodes: [], edges: [] })
    expect(createFestivalArchipelago()).toEqual(original)
  })
})
