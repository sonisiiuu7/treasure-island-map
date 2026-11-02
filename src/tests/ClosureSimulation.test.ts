import { describe, expect, it } from 'vitest'
import { simulateClosure } from '../application/simulateClosure'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { createExampleGraph } from '../data/createExampleGraph'
import { TarjanLowLinkAnalyzer } from '../domain/algorithms/TarjanLowLinkAnalyzer'
import { buildSortedAdjacency } from '../domain/graph/SortedAdjacencyBuilder'
import { allConnections, deepFreeze, graphFromConnections, shuffled } from './helpers/graphFixtures'

describe('single-closure connectivity', () => {
  it('closing CD separates ABC from DEFGH', () => {
    const result = simulateClosure(createFestivalArchipelago(), { kind: 'EDGE', id: 'CD' })
    expect(result.before.groups).toEqual([['A','B','C','D','E','F','G','H']])
    expect(result.after.groups).toEqual([['A','B','C'], ['D','E','F','G','H']])
    expect(result.increasesComponents).toBe(true)
    expect(result.removedEdgeIds).toEqual(['CD'])
    expect(result.removedNodeId).toBeNull()
    expect(result.after.groupByNode).toEqual({ A:0, B:0, C:0, D:1, E:1, F:1, G:1, H:1 })
  })
  it('closing DE preserves the D-F-E alternate connection', () => {
    const result = simulateClosure(createFestivalArchipelago(), { kind: 'EDGE', id: 'DE' })
    expect(result.before.componentCount).toBe(1)
    expect(result.after.componentCount).toBe(1)
    expect(result.after.groups).toEqual(result.before.groups)
    expect(result.increasesComponents).toBe(false)
  })
  it('closing D removes its incident edges and separates ABC from EFGH', () => {
    const result = simulateClosure(createFestivalArchipelago(), { kind: 'NODE', id: 'D' })
    expect(result.after.groups).toEqual([['A','B','C'],['E','F','G','H']])
    expect(result.removedNodeId).toBe('D')
    expect(result.removedEdgeIds).toEqual(['CD','DE','DF'])
    expect(result.after.groupByNode).not.toHaveProperty('D')
    expect(result.increasesComponents).toBe(true)
  })
  it('closing a leaf island leaves the surviving network connected', () => {
    const result = simulateClosure(createFestivalArchipelago(), { kind: 'NODE', id: 'H' })
    expect(result.after.groups).toEqual([['A','B','C','D','E','F','G']])
    expect(result.increasesComponents).toBe(false)
  })
  it('handles the last surviving island without relaxing the engine validator', () => {
    const result = simulateClosure(graphFromConnections(['A']), { kind: 'NODE', id: 'A' })
    expect(result.before.componentCount).toBe(1)
    expect(result.after).toEqual({ groups: [], componentCount: 0, groupByNode: {} })
    expect(result.increasesComponents).toBe(false)
  })
  it('compares against the original disconnected count, including removal of an isolated node', () => {
    const graph = createExampleGraph('DISCONNECTED')
    expect(simulateClosure(graph, {kind:'EDGE',id:'DE'}).after.groups).toEqual([['A','B','C'],['D'],['E'],['F']])
    const result = simulateClosure(graph, {kind:'NODE',id:'F'})
    expect(result.before.componentCount).toBe(3)
    expect(result.after.componentCount).toBe(2)
    expect(result.increasesComponents).toBe(false)
  })
  it.each(['EDGE','NODE'] as const)('rejects an unknown %s target', kind => {
    expect(() => simulateClosure(createFestivalArchipelago(), {kind,id:'MISSING'})).toThrow('Unknown closure target')
  })
  it('does not mutate graph/target, owns immutable results, and repeats deterministically', () => {
    const graph = deepFreeze(createFestivalArchipelago())
    const target = {kind:'EDGE' as const,id:'CD'}
    const before = JSON.stringify(graph)
    const result = simulateClosure(graph,target)
    expect(JSON.stringify(graph)).toBe(before)
    expect(result.target).not.toBe(target)
    target.id = 'DE'
    expect(result.target.id).toBe('CD')
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.after.groups[0])).toBe(true)
    expect(Object.isFrozen(result.after.groupByNode)).toBe(true)
    expect(Object.isFrozen(result.removedEdgeIds)).toBe(true)
    expect(() => { (result.after.groups[0] as string[]).push('X') }).toThrow()
    expect(simulateClosure(graph,{kind:'EDGE',id:'CD'})).toEqual(result)
  })
  it('is independent of source arrays, orientation, names, and coordinates', () => {
    const graph = createFestivalArchipelago()
    const changed = { nodes: shuffled(graph.nodes,42).map(node=>({...node,name:'Other',x:0,y:100})),
      edges: shuffled(graph.edges,17).map(edge=>({...edge,source:edge.target,target:edge.source})) }
    expect(simulateClosure(changed,{kind:'NODE',id:'D'})).toEqual(simulateClosure(graph,{kind:'NODE',id:'D'}))
  })
  it('agrees with Tarjan critical items for every single removal over all 75 graphs up to four nodes', () => {
    let graphs = 0
    for(let n=1;n<=4;n++){
      const ids=Array.from({length:n},(_,i)=>String.fromCharCode(65+i))
      const edges=allConnections(ids)
      for(let mask=0;mask<2**edges.length;mask++){
        const graph=graphFromConnections(ids,edges.filter((_,i)=>(mask&(1<<i))!==0))
        const original=new TarjanLowLinkAnalyzer().analyze(buildSortedAdjacency(graph))
        for(const edge of graph.edges){
          const result=simulateClosure(graph,{kind:'EDGE',id:edge.id})
          expect(result.before.componentCount).toBe(original.componentCount)
          expect(result.increasesComponents).toBe(original.bridgeIds.includes(edge.id))
          expect(result.after.groups.flat().sort()).toEqual(ids)
        }
        for(const node of graph.nodes){
          const result=simulateClosure(graph,{kind:'NODE',id:node.id})
          expect(result.increasesComponents).toBe(original.articulationIds.includes(node.id))
          expect(result.after.groups.flat().sort()).toEqual(ids.filter(id=>id!==node.id))
        }
        graphs++
      }
    }
    expect(graphs).toBe(75)
  })
})
