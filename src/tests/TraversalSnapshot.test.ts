import { describe, expect, it } from 'vitest'
import type { TraversalSnapshot } from '../domain/models/TraversalSnapshot'
import { createTraversalSnapshot } from '../domain/replay/createTraversalSnapshot'

function state(): TraversalSnapshot {
  return {
    nodes: {
      B: { parent: 'A', discovery: 1, low: 1, status: 'FINISHED' },
      A: { parent: null, discovery: 0, low: 0, status: 'ACTIVE' },
    },
    edges: { ZROAD: 'BRIDGE', AROAD: 'TREE' },
    componentCount: 1,
    bridgeIds: ['ZROAD', 'AROAD'],
    articulationIds: ['B', 'A'],
  }
}

describe('createTraversalSnapshot', () => {
  it('sorts keys and critical summaries without mutating or freezing the caller data', () => {
    const input = state()
    const before = structuredClone(input)
    const result = createTraversalSnapshot(input)
    expect(Object.keys(result.nodes)).toEqual(['A', 'B'])
    expect(Object.keys(result.edges)).toEqual(['AROAD', 'ZROAD'])
    expect(result.bridgeIds).toEqual(['AROAD', 'ZROAD'])
    expect(result.articulationIds).toEqual(['A', 'B'])
    expect(input).toEqual(before)
    expect(Object.isFrozen(input)).toBe(false)
    expect(Object.isFrozen(input.nodes.A)).toBe(false)
  })

  it('copies every nested record and array', () => {
    const input = state()
    const result = createTraversalSnapshot(input)
    expect(result).not.toBe(input)
    expect(result.nodes).not.toBe(input.nodes)
    expect(result.nodes.A).not.toBe(input.nodes.A)
    expect(result.edges).not.toBe(input.edges)
    expect(result.bridgeIds).not.toBe(input.bridgeIds)
    expect(result.articulationIds).not.toBe(input.articulationIds)
  })

  it('freezes every reachable snapshot object', () => {
    const result = createTraversalSnapshot(state())
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.nodes)).toBe(true)
    expect(Object.isFrozen(result.edges)).toBe(true)
    expect(Object.isFrozen(result.nodes.A)).toBe(true)
    expect(Object.isFrozen(result.bridgeIds)).toBe(true)
    expect(Object.isFrozen(result.articulationIds)).toBe(true)
  })

  it('rejects mutation at each nested level', () => {
    const result = createTraversalSnapshot(state())
    expect(Reflect.set(result, 'componentCount', 99)).toBe(false)
    expect(Reflect.set(result.nodes.A, 'low', 99)).toBe(false)
    expect(Reflect.set(result.edges, 'ZROAD', 'UNINSPECTED')).toBe(false)
    expect(() => (result.bridgeIds as string[]).push('FAKE')).toThrow(TypeError)
    expect(result.nodes.A.low).toBe(0)
  })

  it('is unaffected by later writes to caller-owned records and arrays', () => {
    const input = state()
    const result = createTraversalSnapshot(input)
    const before = JSON.stringify(result)
    Reflect.set(input.nodes.A, 'low', 99)
    Reflect.set(input.edges, 'ZROAD', 'UNINSPECTED')
    ;(input.bridgeIds as string[]).push('FAKE')
    expect(JSON.stringify(result)).toBe(before)
  })
})
