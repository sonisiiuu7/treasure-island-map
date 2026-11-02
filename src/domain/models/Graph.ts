/** Domain values are readonly; layout coordinates never affect traversal. */
export interface Island {
  readonly id: string
  readonly name: string
  readonly x: number
  readonly y: number
}

export interface Bridge {
  readonly id: string
  readonly source: string
  readonly target: string
}

export interface Graph {
  readonly nodes: readonly Island[]
  readonly edges: readonly Bridge[]
}
