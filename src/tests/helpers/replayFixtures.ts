import { AnalysisService } from '../../application/AnalysisService'
import type { ReplayState } from '../../application/ReplayState'
import { createInitialReplayState, replayReducer } from '../../application/replayReducer'
import { createFestivalArchipelago } from '../../data/createFestivalArchipelago'
import { TarjanLowLinkAnalyzer } from '../../domain/algorithms/TarjanLowLinkAnalyzer'
import type { Graph } from '../../domain/models/Graph'
import type { ValidationError } from '../../domain/models/ValidationResult'

export function preparedGraph(graph: Graph = createFestivalArchipelago()) {
  const prepared = new AnalysisService(new TarjanLowLinkAnalyzer()).prepare(graph)
  if (!prepared.ok) throw new Error('Expected a valid fixture')
  return prepared
}

export function readyReplay(graph: Graph = createFestivalArchipelago()): ReplayState {
  const prepared = preparedGraph(graph)
  return replayReducer(createInitialReplayState(createFestivalArchipelago()), {
    type: 'LOAD_SUCCESS', graph: prepared.graph, result: prepared.result,
  })
}

export function completedReplay(): ReplayState {
  return replayReducer(readyReplay(), { type: 'RUN_TO_END' })
}

export function validationErrors(): ValidationError[] {
  return [{
    code: 'INVALID_COORDINATE',
    path: 'nodes[0].x',
    nodeId: 'A',
    message: 'Node A: x must be a finite number from 0 through 100.',
  }]
}

export function failedReplay(): ReplayState {
  return replayReducer(completedReplay(), { type: 'LOAD_FAILURE', errors: validationErrors() })
}

export function stepTo(state: ReplayState, eventIndex: number): ReplayState {
  while (state.eventIndex < eventIndex) {
    const next = replayReducer(state, { type: 'STEP' })
    if (next === state) throw new Error('Fixture cursor cannot advance')
    state = next
  }
  return state
}
