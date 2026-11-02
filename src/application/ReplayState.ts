import type { AnalysisResult } from '../domain/models/AnalysisResult'
import type { Graph } from '../domain/models/Graph'
import type { TraversalSnapshot } from '../domain/models/TraversalSnapshot'
import type { ValidationError } from '../domain/models/ValidationResult'

interface OriginalDemo {
  readonly originalDemoGraph: Graph
  readonly originalSnapshot: TraversalSnapshot
}

interface LoadedReplay {
  readonly currentGraph: Graph
  readonly result: AnalysisResult
  readonly errors: readonly []
}

/** Discriminants rule out an error with a stale graph/result or an unloaded active replay. */
export type ReplayState = OriginalDemo & (
  | {
      readonly status: 'EMPTY'
      readonly currentGraph: Graph
      readonly result: null
      readonly eventIndex: -1
      readonly errors: readonly []
    }
  | {
      readonly status: 'ERROR'
      readonly currentGraph: null
      readonly result: null
      readonly eventIndex: -1
      readonly errors: readonly ValidationError[]
    }
  | (LoadedReplay & { readonly status: 'READY'; readonly eventIndex: -1 })
  | (LoadedReplay & {
      readonly status: 'RUNNING' | 'COMPLETED'
      readonly eventIndex: number
    })
)

export type ReplayStatus = ReplayState['status']

export type ReplayAction =
  | { readonly type: 'LOAD_SUCCESS'; readonly graph: Graph; readonly result: AnalysisResult }
  | { readonly type: 'LOAD_FAILURE'; readonly errors: readonly ValidationError[] }
  | { readonly type: 'STEP' }
  | { readonly type: 'RUN_TO_END' }
  | { readonly type: 'RESET' }
