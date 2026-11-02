export type NodeStatus = 'UNVISITED' | 'ACTIVE' | 'FINISHED'
export type EdgeStatus = 'UNINSPECTED' | 'TREE' | 'NON_TREE' | 'BRIDGE'

export interface ReplayNodeState {
  readonly parent: string | null
  readonly discovery: number | null
  readonly low: number | null
  readonly status: NodeStatus
}

/** Complete visible traversal values; current highlighting comes from the event focus. */
export interface TraversalSnapshot {
  readonly nodes: Readonly<Record<string, ReplayNodeState>>
  readonly edges: Readonly<Record<string, EdgeStatus>>
  readonly componentCount: number
  readonly bridgeIds: readonly string[]
  readonly articulationIds: readonly string[]
}
