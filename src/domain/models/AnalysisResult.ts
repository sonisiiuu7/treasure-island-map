export interface NodeAnalysis {
  readonly parent: string | null
  readonly discovery: number
  readonly low: number
}

/**
 * Phase 2's deterministic algorithmic outcome. Phase 3 adds the replay envelope
 * (initialSnapshot, events, finalSnapshot) around these calculated values.
 */
export interface AnalysisResult {
  readonly nodes: Readonly<Record<string, NodeAnalysis>>
  readonly discoveryOrder: readonly string[]
  readonly componentRoots: readonly string[]
  readonly componentCount: number
  /** DFS discovery order, retaining original graph edge IDs. */
  readonly treeEdgeIds: readonly string[]
  /** Final critical IDs are sorted in ascending ASCII order. */
  readonly bridgeIds: readonly string[]
  readonly articulationIds: readonly string[]
}
