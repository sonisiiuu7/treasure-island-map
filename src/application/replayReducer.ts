import { copyGraph } from '../domain/graph/copyGraph'
import type { Graph } from '../domain/models/Graph'
import type { TraversalSnapshot } from '../domain/models/TraversalSnapshot'
import { createInitialTraversalSnapshot } from '../domain/replay/createInitialTraversalSnapshot'
import type { ReplayAction, ReplayState } from './ReplayState'

const NO_ERRORS = Object.freeze([] as const)

function emptyState(originalDemoGraph: Graph, originalSnapshot: TraversalSnapshot): ReplayState {
  return Object.freeze({
    status: 'EMPTY',
    originalDemoGraph,
    originalSnapshot,
    currentGraph: originalDemoGraph,
    result: null,
    eventIndex: -1,
    errors: NO_ERRORS,
  })
}

/** Capture original values once. Initialization has no observable effects on caller data. */
export function createInitialReplayState(demoGraph: Graph): ReplayState {
  const original = copyGraph(demoGraph)
  return emptyState(original, createInitialTraversalSnapshot(original))
}

/** Prepared result data is trusted; graph validation and DFS stay in AnalysisService. */
export function replayReducer(state: ReplayState, action: ReplayAction): ReplayState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return Object.freeze({
        status: 'READY',
        originalDemoGraph: state.originalDemoGraph,
        originalSnapshot: state.originalSnapshot,
        currentGraph: copyGraph(action.graph),
        result: action.result,
        eventIndex: -1,
        errors: NO_ERRORS,
      })

    case 'LOAD_FAILURE':
      return Object.freeze({
        status: 'ERROR',
        originalDemoGraph: state.originalDemoGraph,
        originalSnapshot: state.originalSnapshot,
        currentGraph: null,
        result: null,
        eventIndex: -1,
        errors: Object.freeze(action.errors.map((error) => Object.freeze({ ...error }))),
      })

    case 'STEP': {
      if (state.status !== 'READY' && state.status !== 'RUNNING') return state
      const lastIndex = state.result.events.length - 1
      const eventIndex = Math.min(state.eventIndex + 1, lastIndex)
      return Object.freeze({
        ...state,
        eventIndex,
        status: eventIndex === lastIndex ? 'COMPLETED' : 'RUNNING',
      })
    }

    case 'RUN_TO_END':
      if (state.status !== 'READY' && state.status !== 'RUNNING') return state
      return Object.freeze({
        ...state,
        status: 'COMPLETED',
        eventIndex: state.result.events.length - 1,
      })

    case 'RESET':
      return state.status === 'EMPTY'
        ? state
        : emptyState(state.originalDemoGraph, state.originalSnapshot)
  }
}
