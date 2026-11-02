import type { AnalysisResult } from '../../domain/models/AnalysisResult'

/** Hand-derived oracle from docs/reference-graph.md; production never imports this. */
export const MAIN_GRAPH_ORACLE: AnalysisResult = {
  nodes: {
    A: { parent: null, discovery: 0, low: 0 },
    B: { parent: 'A', discovery: 1, low: 0 },
    C: { parent: 'B', discovery: 2, low: 0 },
    D: { parent: 'C', discovery: 3, low: 3 },
    E: { parent: 'D', discovery: 4, low: 3 },
    F: { parent: 'E', discovery: 5, low: 3 },
    G: { parent: 'E', discovery: 6, low: 6 },
    H: { parent: 'G', discovery: 7, low: 7 },
  },
  discoveryOrder: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
  componentRoots: ['A'],
  componentCount: 1,
  treeEdgeIds: ['AB', 'BC', 'CD', 'DE', 'EF', 'EG', 'GH'],
  bridgeIds: ['CD', 'EG', 'GH'],
  articulationIds: ['C', 'D', 'E', 'G'],
}
