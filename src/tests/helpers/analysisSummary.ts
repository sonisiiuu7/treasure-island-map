import type { AnalysisResult, AnalysisSummary } from '../../domain/models/AnalysisResult'

/** Keep the original Phase 2 assertions exact while testing replay separately. */
export function analysisSummary(result: AnalysisResult): AnalysisSummary {
  return {
    nodes: result.nodes,
    discoveryOrder: result.discoveryOrder,
    componentRoots: result.componentRoots,
    componentCount: result.componentCount,
    treeEdgeIds: result.treeEdgeIds,
    bridgeIds: result.bridgeIds,
    articulationIds: result.articulationIds,
  }
}
