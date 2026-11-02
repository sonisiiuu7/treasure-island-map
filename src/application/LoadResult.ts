import type { AnalysisResult } from '../domain/models/AnalysisResult'
import type { Graph } from '../domain/models/Graph'
import type { ValidationError } from '../domain/models/ValidationResult'

/** Invalid loads never carry a graph, a result, or partial analysis. */
export type LoadResult =
  | {
      readonly ok: true
      readonly graph: Graph
      readonly result: AnalysisResult
    }
  | {
      readonly ok: false
      readonly errors: readonly ValidationError[]
    }
