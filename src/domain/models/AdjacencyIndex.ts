/** One direction of an undirected connection; the reverse entry has the same edge ID. */
export interface AdjacentEdge {
  readonly neighborId: string
  readonly edgeId: string
}

/** Built from validated input; roots, map entries, and neighbors use ASCII ID order. */
export interface AdjacencyIndex {
  readonly nodeIds: readonly string[]
  readonly neighbors: ReadonlyMap<string, readonly AdjacentEdge[]>
}
