export type ClosureTarget =
  | { readonly kind: 'EDGE'; readonly id: string }
  | { readonly kind: 'NODE'; readonly id: string }

export interface ConnectivityPartition {
  readonly groups: readonly (readonly string[])[]
  readonly componentCount: number
  readonly groupByNode: Readonly<Record<string, number>>
}

export interface ClosureSimulation {
  readonly target: ClosureTarget
  readonly before: ConnectivityPartition
  readonly after: ConnectivityPartition
  readonly removedNodeId: string | null
  readonly removedEdgeIds: readonly string[]
  readonly increasesComponents: boolean
}
