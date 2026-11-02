import type { GraphAnalyzer } from '../domain/contracts/GraphAnalyzer'
import { buildSortedAdjacency } from '../domain/graph/SortedAdjacencyBuilder'
import { validateGraph } from '../domain/validation/GraphValidator'
import type { LoadResult } from './LoadResult'

/** Orchestration depends on the strategy contract, with no React or concrete DFS import. */
export class AnalysisService {
  private readonly analyzer: GraphAnalyzer

  constructor(analyzer: GraphAnalyzer) {
    this.analyzer = analyzer
  }

  prepare(input: unknown): LoadResult {
    const validation = validateGraph(input)
    if (!validation.valid) return { ok: false, errors: validation.errors }

    const adjacency = buildSortedAdjacency(validation.graph)
    const result = this.analyzer.analyze(adjacency)
    return { ok: true, graph: validation.graph, result }
  }
}
