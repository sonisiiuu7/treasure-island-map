import { describe, expect, it } from 'vitest'
import type { ReplayState } from '../application/ReplayState'
import { createInitialReplayState, replayReducer } from '../application/replayReducer'
import { selectCurrentEvent, selectReplayView } from '../application/replaySelectors'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import type { ReplayEvent } from '../domain/models/ReplayEvent'
import { deepFreeze, graphFromConnections } from './helpers/graphFixtures'
import {
  completedReplay, failedReplay, preparedGraph, readyReplay, stepTo, validationErrors,
} from './helpers/replayFixtures'

describe('replay selectors: snapshot and event identity', () => {
  it('selects the original startup snapshot and graph in EMPTY', () => {
    const state = createInitialReplayState(createFestivalArchipelago())
    const view = selectReplayView(state)
    expect(view.status).toBe('EMPTY')
    expect(view.graph).toBe(state.originalDemoGraph)
    expect(view.snapshot).toBe(state.originalSnapshot)
    expect(view.currentEvent).toBeNull()
    expect(view.focus).toBeNull()
    expect(view.history).toEqual([])
    expect(view.eventIndex).toBe(-1)
    expect(view.progress).toEqual({ completedEvents: 0, totalEvents: 0 })
    expect(selectCurrentEvent(state)).toBeNull()
  })

  it('selects initialSnapshot in READY and hides all final table values and summaries', () => {
    const state = readyReplay()
    if (state.result === null) throw new Error('Expected prepared result')
    const view = selectReplayView(state)
    expect(view.snapshot).toBe(state.result.initialSnapshot)
    expect(view.snapshot?.nodes.B.discovery).toBeNull()
    expect(state.result.nodes.B.discovery).toBe(1)
    expect(view.snapshot?.componentCount).toBe(0)
    expect(view.snapshot?.bridgeIds).toEqual([])
    expect(view.snapshot?.articulationIds).toEqual([])
    expect(view.history).toEqual([])
    expect(view.currentEvent).toBeNull()
    expect(view.focus).toBeNull()
    expect(view.progress).toEqual({ completedEvents: 0, totalEvents: 54 })
    expect(view).not.toHaveProperty('result')
  })

  it('uses the same stored snapshot/event/focus at every replay position', () => {
    let state = readyReplay()
    if (state.result === null) throw new Error('Expected prepared history')
    const result = state.result
    for (let index = 0; index < result.events.length; index++) {
      state = replayReducer(state, { type: 'STEP' })
      const view = selectReplayView(state)
      expect(view.currentEvent).toBe(result.events[index])
      expect(view.snapshot).toBe(result.events[index].snapshot)
      expect(view.focus).toBe(result.events[index].focus)
      expect(selectCurrentEvent(state)).toBe(view.currentEvent)
      expect(view.eventIndex).toBe(index)
      expect(view.progress).toEqual({ completedEvents: index + 1, totalEvents: 54 })
      expect(view.history).toEqual(result.events.slice(0, index + 1))
      expect(view.history.at(-1)).toBe(view.currentEvent)
    }
  })

  it('exposes just one history event after the first Step', () => {
    const view = selectReplayView(replayReducer(readyReplay(), { type: 'STEP' }))
    expect(view.history).toHaveLength(1)
    expect(view.currentEvent?.type).toBe('COMPONENT_START')
    expect(view.snapshot?.componentCount).toBe(1)
    expect(view.snapshot?.nodes.A.discovery).toBeNull()
    expect(view.snapshot?.bridgeIds).toEqual([])
  })

  it('does not reveal GH as a bridge until its classification event', () => {
    const ready = readyReplay()
    if (ready.result === null) throw new Error('Expected prepared history')
    const classification = ready.result.events.find((event) =>
      event.type === 'CLASSIFY_EDGE' && event.details.edgeId === 'GH',
    )
    if (classification === undefined) throw new Error('Expected GH classification')
    const before = stepTo(ready, classification.index - 1)
    expect(selectReplayView(before).snapshot?.bridgeIds).not.toContain('GH')
    const after = replayReducer(before, { type: 'STEP' })
    expect(selectReplayView(after).snapshot?.bridgeIds).toContain('GH')
    expect(selectReplayView(after).currentEvent).toBe(classification)
  })

  it('keeps D unmarked at DE classification and marks it at the next articulation event', () => {
    const ready = readyReplay()
    if (ready.result === null) throw new Error('Expected prepared history')
    const classification = ready.result.events.find((event) =>
      event.type === 'CLASSIFY_EDGE' && event.details.edgeId === 'DE',
    )
    if (classification === undefined) throw new Error('Expected DE classification')
    const classified = stepTo(ready, classification.index)
    const view = selectReplayView(classified)
    expect(view.snapshot?.nodes.E.low).toBe(3)
    expect(view.snapshot?.nodes.D.discovery).toBe(3)
    expect(view.snapshot?.bridgeIds).not.toContain('DE')
    expect(view.snapshot?.articulationIds).not.toContain('D')
    const marked = selectReplayView(replayReducer(classified, { type: 'STEP' }))
    expect(marked.currentEvent?.type).toBe('ARTICULATION')
    expect(marked.snapshot?.articulationIds).toContain('D')
  })

  it('retains the complete original history and exact final snapshot at completion', () => {
    const state = completedReplay()
    if (state.result === null) throw new Error('Expected prepared history')
    const view = selectReplayView(state)
    expect(view.history).toBe(state.result.events)
    expect(view.history).toHaveLength(54)
    expect(view.currentEvent).toBe(state.result.events.at(-1))
    expect(view.snapshot).toBe(state.result.finalSnapshot)
    expect(view.snapshot?.bridgeIds).toEqual(['CD', 'EG', 'GH'])
    expect(view.snapshot?.articulationIds).toEqual(['C', 'D', 'E', 'G'])
    expect(view.progress).toEqual({ completedEvents: 54, totalEvents: 54 })
  })

  it('exposes no stale graph, event, focus, snapshot, history, or progress in ERROR', () => {
    const state = failedReplay()
    const view = selectReplayView(state)
    expect(view.status).toBe('ERROR')
    expect(view.graph).toBeNull()
    expect(view.snapshot).toBeNull()
    expect(view.currentEvent).toBeNull()
    expect(view.focus).toBeNull()
    expect(view.history).toEqual([])
    expect(view.progress).toEqual({ completedEvents: 0, totalEvents: 0 })
    expect(view.eventIndex).toBe(-1)
    expect(view.errors).toBe(state.errors)
    expect(view.errors).toContainEqual(expect.objectContaining({
      code: 'INVALID_COORDINATE', path: 'nodes[0].x', nodeId: 'A',
    }))
    expect(selectCurrentEvent(state)).toBeNull()
  })

  it('restores the identical original snapshot and graph references after Reset', () => {
    const state = readyReplay()
    const initial = selectReplayView(replayReducer(state, { type: 'RESET' }))
    const reset = selectReplayView(replayReducer(
      replayReducer(state, { type: 'RUN_TO_END' }), { type: 'RESET' },
    ))
    expect(reset).toEqual(initial)
    expect(reset.snapshot).toBe(initial.snapshot)
    expect(reset.graph).toBe(initial.graph)
  })

  it('shows a replacement graph initial state without old replay history', () => {
    const completed = completedReplay()
    const before = selectReplayView(completed)
    const custom = preparedGraph(graphFromConnections(['Z']))
    const replacement = replayReducer(completed, {
      type: 'LOAD_SUCCESS', graph: custom.graph, result: custom.result,
    })
    const view = selectReplayView(replacement)
    expect(Object.keys(view.snapshot?.nodes ?? {})).toEqual(['Z'])
    expect(view.snapshot?.nodes.Z.discovery).toBeNull()
    expect(view.history).toEqual([])
    expect(view.progress).toEqual({ completedEvents: 0, totalEvents: 4 })
    expect(before.snapshot?.bridgeIds).toEqual(['CD', 'EG', 'GH'])
    expect(before.history).toHaveLength(54)
  })

  it('publishes fresh errors after replacing a previously completed view', () => {
    const state = replayReducer(completedReplay(), {
      type: 'LOAD_FAILURE', errors: validationErrors(),
    })
    const view = selectReplayView(state)
    expect(view.errors).toHaveLength(1)
    expect(view.errors[0].path).toBe('nodes[0].x')
    expect(view.snapshot).toBeNull()
    expect(view.history).toEqual([])
  })
})

describe('replay selectors: control availability and purity', () => {
  const cases: {
    status: ReplayState['status']
    make: () => ReplayState
    canStep: boolean
    canRunToEnd: boolean
    canReset: boolean
  }[] = [
    { status: 'EMPTY', make: () => createInitialReplayState(createFestivalArchipelago()), canStep: false, canRunToEnd: false, canReset: false },
    { status: 'READY', make: readyReplay, canStep: true, canRunToEnd: true, canReset: true },
    { status: 'RUNNING', make: () => replayReducer(readyReplay(), { type: 'STEP' }), canStep: true, canRunToEnd: true, canReset: true },
    { status: 'COMPLETED', make: completedReplay, canStep: false, canRunToEnd: false, canReset: true },
    { status: 'ERROR', make: failedReplay, canStep: false, canRunToEnd: false, canReset: true },
  ]

  it.each(cases)('derives controls for $status', ({ make, canStep, canRunToEnd, canReset, status }) => {
    const view = selectReplayView(make())
    expect(view.status).toBe(status)
    expect(view.controls).toEqual({ canLoad: true, canStep, canRunToEnd, canReset })
  })

  it('does not mutate frozen state or prepared data during repeated selection', () => {
    const state = deepFreeze(stepTo(readyReplay(), 7))
    const before = JSON.stringify(state)
    const first = selectReplayView(state)
    const second = selectReplayView(state)
    expect(first).toEqual(second)
    expect(first.snapshot).toBe(second.snapshot)
    expect(first.currentEvent).toBe(second.currentEvent)
    expect(JSON.stringify(state)).toBe(before)
  })

  it('freezes derived wrapper values and history prefixes', () => {
    const view = selectReplayView(stepTo(readyReplay(), 7))
    expect(Object.isFrozen(view)).toBe(true)
    expect(Object.isFrozen(view.history)).toBe(true)
    expect(Object.isFrozen(view.progress)).toBe(true)
    expect(Object.isFrozen(view.controls)).toBe(true)
    expect(Reflect.set(view.progress, 'completedEvents', 999)).toBe(false)
    expect(Reflect.set(view.controls, 'canLoad', false)).toBe(false)
    expect(() => (view.history as ReplayEvent[]).push(view.history[0])).toThrow(TypeError)
    expect(view.progress.completedEvents).toBe(8)
  })
})
