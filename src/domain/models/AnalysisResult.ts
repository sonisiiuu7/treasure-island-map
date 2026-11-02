import type { ReplayEvent } from './ReplayEvent'
import type { TraversalSnapshot } from './TraversalSnapshot'

export interface NodeAnalysis {
  readonly parent: string | null
  readonly discovery: number
  readonly low: number
}

/** Phase 2's algorithmic values, preserved unchanged in the enriched result. */
export interface AnalysisSummary {
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

export interface AnalysisResult extends AnalysisSummary {
  readonly initialSnapshot: TraversalSnapshot
  readonly events: readonly ReplayEvent[]
  /** The exact same object as the last event's snapshot, not a separately calculated result. */
  readonly finalSnapshot: TraversalSnapshot
}
