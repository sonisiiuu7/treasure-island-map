import type { Graph } from '../domain/models/Graph'
import type { EventFocus, ReplayEvent } from '../domain/models/ReplayEvent'
import type { TraversalSnapshot } from '../domain/models/TraversalSnapshot'
import type { ValidationError } from '../domain/models/ValidationResult'
import type { ReplayState, ReplayStatus } from './ReplayState'

export interface ControlAvailability {
  readonly canLoad: boolean
  readonly canStep: boolean
  readonly canRunToEnd: boolean
  readonly canReset: boolean
}

/** The future UI consumes this view, never the stored future calculation summaries. */
export interface ReplayView {
  readonly status: ReplayStatus
  readonly graph: Graph | null
  readonly snapshot: TraversalSnapshot | null
  readonly currentEvent: ReplayEvent | null
  readonly focus: EventFocus | null
  readonly history: readonly ReplayEvent[]
  readonly eventIndex: number
  readonly progress: {
    readonly completedEvents: number
    readonly totalEvents: number
  }
  readonly errors: readonly ValidationError[]
  readonly controls: ControlAvailability
}

const NO_HISTORY: readonly ReplayEvent[] = Object.freeze([])

export function selectCurrentEvent(state: ReplayState): ReplayEvent | null {
  if (state.result === null || state.eventIndex === -1) return null
  const event = state.result.events[state.eventIndex]
  if (event === undefined) throw new Error('Replay cursor is outside its prepared history.')
  return event
}

export function selectReplayView(state: ReplayState): ReplayView {
  const currentEvent = selectCurrentEvent(state)
  const canAdvance = state.status === 'READY' || state.status === 'RUNNING'
  const snapshot = state.status === 'ERROR'
    ? null
    : state.result === null
      ? state.originalSnapshot
      : currentEvent?.snapshot ?? state.result.initialSnapshot
  const history = state.status === 'COMPLETED'
    ? state.result.events
    : state.result === null || state.eventIndex === -1
      ? NO_HISTORY
      : Object.freeze(state.result.events.slice(0, state.eventIndex + 1))

  return Object.freeze({
    status: state.status,
    graph: state.currentGraph,
    snapshot,
    currentEvent,
    focus: currentEvent?.focus ?? null,
    history,
    eventIndex: state.eventIndex,
    progress: Object.freeze({
      completedEvents: state.eventIndex + 1,
      totalEvents: state.result?.events.length ?? 0,
    }),
    errors: state.errors,
    controls: Object.freeze({
      canLoad: true,
      canStep: canAdvance,
      canRunToEnd: canAdvance,
      canReset: state.status !== 'EMPTY',
    }),
  })
}
