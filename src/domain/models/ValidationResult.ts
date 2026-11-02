import type { Graph } from './Graph'

export type ValidationErrorCode =
  | 'INVALID_GRAPH'
  | 'INVALID_NODES'
  | 'INVALID_EDGES'
  | 'NODE_COUNT_OUT_OF_RANGE'
  | 'EDGE_COUNT_OUT_OF_RANGE'
  | 'INVALID_NODE'
  | 'INVALID_NODE_ID'
  | 'DUPLICATE_NODE_ID'
  | 'INVALID_NODE_NAME'
  | 'INVALID_COORDINATE'
  | 'INVALID_EDGE'
  | 'INVALID_EDGE_ID'
  | 'DUPLICATE_EDGE_ID'
  | 'INVALID_ENDPOINT'
  | 'UNKNOWN_ENDPOINT'
  | 'SELF_LOOP'
  | 'DUPLICATE_CONNECTION'

export interface ValidationError {
  readonly code: ValidationErrorCode
  readonly message: string
  readonly path: string
  readonly nodeId?: string
  readonly edgeId?: string
  readonly endpointId?: string
}

/** Only a successful result exposes a graph that application services may analyze. */
export type ValidationResult =
  | {
      readonly valid: true
      readonly graph: Graph
      readonly errors: readonly []
    }
  | {
      readonly valid: false
      readonly errors: readonly ValidationError[]
    }
