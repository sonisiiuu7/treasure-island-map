import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReplayState } from '../application/ReplayState'
import { createInitialReplayState, replayReducer } from '../application/replayReducer'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { TarjanLowLinkAnalyzer } from '../domain/algorithms/TarjanLowLinkAnalyzer'
import { copyGraph } from '../domain/graph/copyGraph'
import { createInitialTraversalSnapshot } from '../domain/replay/createInitialTraversalSnapshot'
import { deepFreeze, graphFromConnections } from './helpers/graphFixtures'
import {
  completedReplay, failedReplay, preparedGraph, readyReplay, stepTo, validationErrors,
} from './helpers/replayFixtures'

afterEach(() => vi.restoreAllMocks())

describe('replay initialization and data ownership', () => {
  it('starts EMPTY with a complete original unvisited preview and no prepared result', () => {
    const graph = createFestivalArchipelago()
    const state = createInitialReplayState(graph)
    expect(state.status).toBe('EMPTY')
    expect(state.currentGraph).toEqual(graph)
    expect(state.currentGraph).toBe(state.originalDemoGraph)
    expect(state.result).toBeNull()
    expect(state.eventIndex).toBe(-1)
    expect(state.errors).toEqual([])
    expect(state.originalSnapshot.componentCount).toBe(0)
    expect(state.originalSnapshot.bridgeIds).toEqual([])
    expect(state.originalSnapshot.articulationIds).toEqual([])
    expect(Object.values(state.originalSnapshot.nodes).every((node) =>
      node.status === 'UNVISITED' && node.discovery === null && node.low === null,
    )).toBe(true)
    expect(Object.values(state.originalSnapshot.edges)).toEqual(Array(9).fill('UNINSPECTED'))
  })

  it('creates the same preview as analysis without executing DFS during initialization', () => {
    const graph = createFestivalArchipelago()
    const prepared = preparedGraph(graph)
    const spy = vi.spyOn(TarjanLowLinkAnalyzer.prototype, 'analyze')
    expect(createInitialReplayState(graph).originalSnapshot).toEqual(prepared.result.initialSnapshot)
    expect(createInitialTraversalSnapshot(graph)).toEqual(prepared.result.initialSnapshot)
    expect(spy).not.toHaveBeenCalled()
  })

  it('preserves original source order and shares no caller-owned graph objects', () => {
    const graph = createFestivalArchipelago()
    const input = { nodes: [...graph.nodes].reverse(), edges: [...graph.edges].reverse() }
    const state = createInitialReplayState(input)
    expect(state.originalDemoGraph).toEqual(input)
    expect(state.originalDemoGraph).not.toBe(input)
    expect(state.originalDemoGraph.nodes).not.toBe(input.nodes)
    expect(state.originalDemoGraph.edges).not.toBe(input.edges)
    input.nodes.forEach((node, index) => expect(state.originalDemoGraph.nodes[index]).not.toBe(node))
    input.edges.forEach((edge, index) => expect(state.originalDemoGraph.edges[index]).not.toBe(edge))
    expect(Object.isFrozen(input)).toBe(false)
    expect(Object.isFrozen(input.nodes[0])).toBe(false)
  })

  it('freezes graph records/arrays and the initial state without freezing caller values', () => {
    const graph = createFestivalArchipelago()
    const state = createInitialReplayState(graph)
    expect(Object.isFrozen(state)).toBe(true)
    expect(Object.isFrozen(state.originalDemoGraph)).toBe(true)
    expect(Object.isFrozen(state.originalDemoGraph.nodes)).toBe(true)
    expect(Object.isFrozen(state.originalDemoGraph.nodes[0])).toBe(true)
    expect(Object.isFrozen(state.originalDemoGraph.edges)).toBe(true)
    expect(Object.isFrozen(state.originalDemoGraph.edges[0])).toBe(true)
    expect(Reflect.set(state.originalDemoGraph.nodes[0], 'x', 99)).toBe(false)
    expect(Reflect.set(graph.nodes[0], 'x', 99)).toBe(true)
    expect(state.originalDemoGraph.nodes[0].x).toBe(12)
  })

  it('produces independent immutable copies even from an already-frozen graph', () => {
    const graph = deepFreeze(createFestivalArchipelago())
    const copy = copyGraph(graph)
    expect(copy).toEqual(graph)
    expect(copy).not.toBe(graph)
    expect(copy.nodes[0]).not.toBe(graph.nodes[0])
    expect(copy.edges[0]).not.toBe(graph.edges[0])
  })
})

describe('replayReducer: load and progress transitions', () => {
  it('loads prepared data as READY without selecting any event', () => {
    const initial = createInitialReplayState(createFestivalArchipelago())
    const prepared = preparedGraph()
    const state = replayReducer(initial, {
      type: 'LOAD_SUCCESS', graph: prepared.graph, result: prepared.result,
    })
    expect(state.status).toBe('READY')
    expect(state.eventIndex).toBe(-1)
    expect(state.result).toBe(prepared.result)
    expect(state.currentGraph).toEqual(prepared.graph)
    expect(state.originalDemoGraph).toBe(initial.originalDemoGraph)
    expect(state.originalSnapshot).toBe(initial.originalSnapshot)
    expect(state.errors).toEqual([])
    expect(initial.status).toBe('EMPTY')
    expect(initial.result).toBeNull()
  })

  it('owns loaded graph values independently of later caller edits', () => {
    const graph = graphFromConnections(['Z'])
    const prepared = preparedGraph(graph)
    const state = replayReducer(readyReplay(), {
      type: 'LOAD_SUCCESS', graph, result: prepared.result,
    })
    Reflect.set(graph.nodes[0], 'id', 'EDITED')
    expect(state.currentGraph?.nodes[0].id).toBe('Z')
    expect(state.result?.initialSnapshot.nodes.Z.discovery).toBeNull()
  })

  it('replaces a partially replayed graph and clears its cursor and old result', () => {
    const previous = stepTo(readyReplay(), 8)
    const graph = graphFromConnections(['Z'])
    const prepared = preparedGraph(graph)
    const next = replayReducer(previous, { type: 'LOAD_SUCCESS', graph, result: prepared.result })
    expect(next.status).toBe('READY')
    expect(next.eventIndex).toBe(-1)
    expect(next.result).toBe(prepared.result)
    expect(Object.keys(next.result?.nodes ?? {})).toEqual(['Z'])
    expect(next.originalDemoGraph).toBe(previous.originalDemoGraph)
    expect(previous.eventIndex).toBe(8)
  })

  it('clears errors on a successful replacement after a failed load', () => {
    const previous = failedReplay()
    const prepared = preparedGraph()
    const next = replayReducer(previous, {
      type: 'LOAD_SUCCESS', graph: prepared.graph, result: prepared.result,
    })
    expect(next.status).toBe('READY')
    expect(next.errors).toEqual([])
    expect(next.eventIndex).toBe(-1)
    expect(previous.status).toBe('ERROR')
    expect(previous.errors).not.toEqual([])
  })

  it('advances READY to RUNNING at event zero', () => {
    const ready = readyReplay()
    const next = replayReducer(ready, { type: 'STEP' })
    expect(next.status).toBe('RUNNING')
    expect(next.eventIndex).toBe(0)
    expect(next.result).toBe(ready.result)
    expect(ready.eventIndex).toBe(-1)
  })

  it('advances exactly one event on every Step through final completion', () => {
    let state = readyReplay()
    if (state.result === null) throw new Error('Expected prepared history')
    const result = state.result
    for (let index = 0; index < result.events.length; index++) {
      const previous = state
      state = replayReducer(state, { type: 'STEP' })
      expect(state.eventIndex).toBe(previous.eventIndex + 1)
      expect(state.eventIndex).toBe(index)
      expect(state.status).toBe(index === result.events.length - 1 ? 'COMPLETED' : 'RUNNING')
      expect(state.result).toBe(result)
    }
  })

  it('runs directly from READY to the final recorded event', () => {
    const ready = readyReplay()
    const next = replayReducer(ready, { type: 'RUN_TO_END' })
    expect(next.status).toBe('COMPLETED')
    expect(next.eventIndex).toBe(53)
    expect(next.result).toBe(ready.result)
  })

  it('runs from an intermediate position using the same result and graph', () => {
    const partial = stepTo(readyReplay(), 7)
    const next = replayReducer(partial, { type: 'RUN_TO_END' })
    expect(next.status).toBe('COMPLETED')
    expect(next.eventIndex).toBe(53)
    expect(next.result).toBe(partial.result)
    expect(next.currentGraph).toBe(partial.currentGraph)
    expect(partial.eventIndex).toBe(7)
  })

  it.each(['STEP', 'RUN_TO_END'] as const)('clamps %s after completion without changing history', (type) => {
    const complete = completedReplay()
    const next = replayReducer(complete, { type })
    expect(next).toBe(complete)
    expect(next.result?.events).toHaveLength(54)
  })

  it.each(['STEP', 'RUN_TO_END'] as const)('ignores %s in EMPTY', (type) => {
    const initial = createInitialReplayState(createFestivalArchipelago())
    expect(replayReducer(initial, { type })).toBe(initial)
  })

  it.each(['STEP', 'RUN_TO_END'] as const)('ignores %s in ERROR', (type) => {
    const error = failedReplay()
    expect(replayReducer(error, { type })).toBe(error)
  })

  it('reaches the same final state through stepping and Run to End', () => {
    const ready = readyReplay()
    const run = replayReducer(ready, { type: 'RUN_TO_END' })
    const stepped = stepTo(ready, 53)
    expect(stepped).toEqual(run)
    expect(stepped.result?.events).toBe(run.result?.events)
  })
})

describe('replayReducer: atomic failures and exact Reset', () => {
  it('clears the graph, analysis, and cursor together after a completed run fails validation', () => {
    const complete = completedReplay()
    const errors = validationErrors()
    const next = replayReducer(complete, { type: 'LOAD_FAILURE', errors })
    expect(next.status).toBe('ERROR')
    expect(next.currentGraph).toBeNull()
    expect(next.result).toBeNull()
    expect(next.eventIndex).toBe(-1)
    expect(next.errors).toEqual(errors)
    expect(next.originalDemoGraph).toBe(complete.originalDemoGraph)
    expect(next.originalSnapshot).toBe(complete.originalSnapshot)
    expect(complete.status).toBe('COMPLETED')
    expect(complete.result?.events).toHaveLength(54)
  })

  it('copies and freezes validation errors without mutating the source error objects', () => {
    const errors = validationErrors()
    const next = replayReducer(readyReplay(), { type: 'LOAD_FAILURE', errors })
    expect(next.errors).not.toBe(errors)
    expect(next.errors[0]).not.toBe(errors[0])
    expect(Object.isFrozen(next.errors)).toBe(true)
    expect(Object.isFrozen(next.errors[0])).toBe(true)
    Reflect.set(errors[0], 'message', 'Caller changed this')
    expect(next.errors[0].message).not.toBe('Caller changed this')
    expect(Reflect.set(next.errors[0], 'message', 'Attempted mutation')).toBe(false)
  })

  it.each(['READY', 'RUNNING', 'COMPLETED', 'ERROR'] as const)(
    'restores startup exactly when Reset is applied in %s',
    (status) => {
      const ready = readyReplay()
      const initial = replayReducer(ready, { type: 'RESET' })
      const states: Record<typeof status, ReplayState> = {
        READY: ready,
        RUNNING: replayReducer(ready, { type: 'STEP' }),
        COMPLETED: replayReducer(ready, { type: 'RUN_TO_END' }),
        ERROR: replayReducer(ready, { type: 'LOAD_FAILURE', errors: validationErrors() }),
      }
      const reset = replayReducer(states[status], { type: 'RESET' })
      expect(reset).toEqual(initial)
      expect(reset.originalDemoGraph).toBe(initial.originalDemoGraph)
      expect(reset.originalSnapshot).toBe(initial.originalSnapshot)
      expect(reset.currentGraph).toBe(reset.originalDemoGraph)
      expect(reset.result).toBeNull()
      expect(reset.errors).toEqual([])
    },
  )

  it('is idempotent when Reset is repeated', () => {
    const reset = replayReducer(completedReplay(), { type: 'RESET' })
    expect(replayReducer(reset, { type: 'RESET' })).toBe(reset)
    expect(replayReducer(replayReducer(reset, { type: 'RESET' }), { type: 'RESET' })).toBe(reset)
  })

  it('restores the original demo rather than the most recently loaded graph', () => {
    const initial = createInitialReplayState(createFestivalArchipelago())
    const prepared = preparedGraph(graphFromConnections(['Z']))
    const custom = replayReducer(initial, {
      type: 'LOAD_SUCCESS', graph: prepared.graph, result: prepared.result,
    })
    const reset = replayReducer(replayReducer(custom, { type: 'RUN_TO_END' }), { type: 'RESET' })
    expect(reset).toEqual(initial)
    expect(reset.currentGraph?.nodes.map((node) => node.id)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
  })

  it('keeps the original demo after caller mutation, a custom load, and a failure', () => {
    const original = createFestivalArchipelago()
    const initial = createInitialReplayState(original)
    Reflect.set(original.nodes[0], 'x', 99)
    Reflect.set(original.edges[0], 'target', 'Z')
    const prepared = preparedGraph(graphFromConnections(['Z']))
    const custom = replayReducer(initial, {
      type: 'LOAD_SUCCESS', graph: prepared.graph, result: prepared.result,
    })
    const failed = replayReducer(custom, { type: 'LOAD_FAILURE', errors: validationErrors() })
    expect(replayReducer(failed, { type: 'RESET' })).toEqual(initial)
    expect(initial.originalDemoGraph.nodes[0].x).toBe(12)
    expect(initial.originalDemoGraph.edges[0].target).toBe('B')
  })

  it('never mutates previous frozen state or the prepared history', () => {
    const ready = deepFreeze(readyReplay())
    const before = JSON.stringify(ready)
    const partial = replayReducer(ready, { type: 'STEP' })
    const complete = replayReducer(partial, { type: 'RUN_TO_END' })
    replayReducer(complete, { type: 'RESET' })
    expect(JSON.stringify(ready)).toBe(before)
    expect(partial.result).toBe(ready.result)
    expect(complete.result).toBe(ready.result)
  })

  it('does not call the analyzer for Step, Run to End, Reset, or failure transitions', () => {
    const ready = readyReplay()
    const spy = vi.spyOn(TarjanLowLinkAnalyzer.prototype, 'analyze')
    const partial = replayReducer(ready, { type: 'STEP' })
    const complete = replayReducer(partial, { type: 'RUN_TO_END' })
    const failed = replayReducer(complete, { type: 'LOAD_FAILURE', errors: validationErrors() })
    replayReducer(failed, { type: 'RESET' })
    expect(spy).not.toHaveBeenCalled()
  })
})
