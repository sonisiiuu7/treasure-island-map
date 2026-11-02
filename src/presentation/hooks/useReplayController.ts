import { useCallback, useMemo, useReducer } from 'react'
import type { AnalysisService } from '../../application/AnalysisService'
import { createInitialReplayState, replayReducer } from '../../application/replayReducer'
import { selectReplayView } from '../../application/replaySelectors'
import type { ReplayView } from '../../application/replaySelectors'
import { createFestivalArchipelago } from '../../data/createFestivalArchipelago'
import { copyGraph } from '../../domain/graph/copyGraph'
import type { Graph } from '../../domain/models/Graph'

export interface ReplayController {
  readonly view: ReplayView
  /** No argument loads the original demo; an explicit argument is validated as supplied. */
  readonly load: (...input: [] | [unknown]) => void
  readonly step: () => void
  readonly runToEnd: () => void
  readonly reset: () => void
}

/** Service injection keeps React independent of a concrete analyzer implementation. */
export function useReplayController(
  analysisService: Pick<AnalysisService, 'prepare'>,
  originalDemoGraph?: Graph,
): ReplayController {
  const [state, dispatch] = useReducer(
    replayReducer,
    originalDemoGraph,
    (graph) => createInitialReplayState(graph ?? createFestivalArchipelago()),
  )
  const view = useMemo(() => selectReplayView(state), [state])

  const load = useCallback((...input: [] | [unknown]): void => {
    const prepared = analysisService.prepare(input.length === 0 ? state.originalDemoGraph : input[0])
    if (prepared.ok) {
      // Own the graph before React schedules the action, even inside a batched update.
      dispatch({ type: 'LOAD_SUCCESS', graph: copyGraph(prepared.graph), result: prepared.result })
    } else {
      dispatch({ type: 'LOAD_FAILURE', errors: prepared.errors })
    }
  }, [analysisService, state.originalDemoGraph])

  const step = useCallback(() => dispatch({ type: 'STEP' }), [dispatch])
  const runToEnd = useCallback(() => dispatch({ type: 'RUN_TO_END' }), [dispatch])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [dispatch])

  return useMemo(
    () => ({ view, load, step, runToEnd, reset }),
    [view, load, step, runToEnd, reset],
  )
}
