import type { AdjacencyIndex } from '../models/AdjacencyIndex'
import type { AnalysisResult } from '../models/AnalysisResult'

/** Strategies preserve the same deterministic traversal and result semantics. */
export interface GraphAnalyzer {
  analyze(adjacency: AdjacencyIndex): AnalysisResult
}
