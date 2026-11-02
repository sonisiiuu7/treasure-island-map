import type { Graph } from '../models/Graph'
import type { ValidationError, ValidationResult } from '../models/ValidationResult'

const ID_PATTERN = /^[A-Z][A-Z0-9_-]{0,15}$/
const MIN_NODES = 1
const MAX_NODES = 12
const MAX_EDGES = 20
const MIN_COORDINATE = 0
const MAX_COORDINATE = 100

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

function isCoordinate(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= MIN_COORDINATE &&
    value <= MAX_COORDINATE
  )
}

/**
 * Runtime boundary: accept unknown input, return a typed graph only after every
 * check succeeds. Invalid inputs never produce partial analysis or retained state.
 * Errors follow input order; traversal sorting belongs to the adjacency builder.
 */
export function validateGraph(input: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!isRecord(input)) {
    return {
      valid: false,
      errors: [{ code: 'INVALID_GRAPH', path: '$', message: 'Graph must be an object.' }],
    }
  }

  const nodes: unknown = input.nodes
  const edges: unknown = input.edges

  if (!Array.isArray(nodes)) {
    errors.push({
      code: 'INVALID_NODES',
      path: 'nodes',
      message: 'Graph nodes must be an array.',
    })
  }
  if (!Array.isArray(edges)) {
    errors.push({
      code: 'INVALID_EDGES',
      path: 'edges',
      message: 'Graph edges must be an array.',
    })
  }
  // Shape errors are collected together before element-dependent checks.
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return { valid: false, errors }
  }

  if (nodes.length < MIN_NODES || nodes.length > MAX_NODES) {
    errors.push({
      code: 'NODE_COUNT_OUT_OF_RANGE',
      path: 'nodes',
      message: `Graph must contain 1 through 12 nodes; received ${nodes.length}.`,
    })
  }
  if (edges.length > MAX_EDGES) {
    errors.push({
      code: 'EDGE_COUNT_OUT_OF_RANGE',
      path: 'edges',
      message: `Graph must contain 0 through 20 edges; received ${edges.length}.`,
    })
  }

  const nodeIds = new Set<string>()
  for (const [index, value] of nodes.entries()) {
    const path = `nodes[${index}]`
    if (!isRecord(value)) {
      errors.push({ code: 'INVALID_NODE', path, message: 'Each node must be an object.' })
      continue
    }

    const nodeId = typeof value.id === 'string' ? value.id : undefined
    if (!isId(value.id)) {
      errors.push({
        code: 'INVALID_NODE_ID',
        path: `${path}.id`,
        nodeId,
        message: 'Node ID must match [A-Z][A-Z0-9_-]{0,15}.',
      })
    } else if (nodeIds.has(value.id)) {
      errors.push({
        code: 'DUPLICATE_NODE_ID',
        path: `${path}.id`,
        nodeId,
        message: `Node ID ${nodeId} is already present.`,
      })
    } else {
      nodeIds.add(value.id)
    }

    if (typeof value.name !== 'string' || value.name.trim().length === 0) {
      errors.push({
        code: 'INVALID_NODE_NAME',
        path: `${path}.name`,
        nodeId,
        message: 'Node name must contain non-whitespace text.',
      })
    }

    for (const coordinate of ['x', 'y'] as const) {
      if (!isCoordinate(value[coordinate])) {
        errors.push({
          code: 'INVALID_COORDINATE',
          path: `${path}.${coordinate}`,
          nodeId,
          message: `Node ${nodeId ?? path}: ${coordinate} must be a finite number from 0 through 100.`,
        })
      }
    }
  }

  const edgeIds = new Set<string>()
  const connections = new Map<string, string>()
  for (const [index, value] of edges.entries()) {
    const path = `edges[${index}]`
    if (!isRecord(value)) {
      errors.push({ code: 'INVALID_EDGE', path, message: 'Each edge must be an object.' })
      continue
    }

    const edgeId = typeof value.id === 'string' ? value.id : undefined
    if (!isId(value.id)) {
      errors.push({
        code: 'INVALID_EDGE_ID',
        path: `${path}.id`,
        edgeId,
        message: 'Edge ID must match [A-Z][A-Z0-9_-]{0,15}.',
      })
    } else if (edgeIds.has(value.id)) {
      errors.push({
        code: 'DUPLICATE_EDGE_ID',
        path: `${path}.id`,
        edgeId,
        message: `Edge ID ${edgeId} is already present.`,
      })
    } else {
      edgeIds.add(value.id)
    }

    const checkEndpoint = (endpoint: 'source' | 'target'): string | undefined => {
      const endpointValue: unknown = value[endpoint]
      if (!isId(endpointValue)) {
        errors.push({
          code: 'INVALID_ENDPOINT',
          path: `${path}.${endpoint}`,
          edgeId,
          endpointId: typeof endpointValue === 'string' ? endpointValue : undefined,
          message: `Edge ${edgeId ?? path}: ${endpoint} must be a valid node ID.`,
        })
        return undefined
      }
      if (!nodeIds.has(endpointValue)) {
        errors.push({
          code: 'UNKNOWN_ENDPOINT',
          path: `${path}.${endpoint}`,
          edgeId,
          endpointId: endpointValue,
          message: `Edge ${edgeId ?? path}: ${endpoint} node ${endpointValue} does not exist.`,
        })
        return undefined
      }
      return endpointValue
    }

    const source = checkEndpoint('source')
    const target = checkEndpoint('target')
    if (source === undefined || target === undefined) continue

    if (source === target) {
      errors.push({
        code: 'SELF_LOOP',
        path,
        edgeId,
        endpointId: source,
        message: `Edge ${edgeId ?? path} connects node ${source} to itself.`,
      })
      continue
    }

    // Serialized sorted pairs are unambiguous even when IDs contain "-" or "_".
    const pairKey = JSON.stringify([source, target].sort())
    const firstConnection = connections.get(pairKey)
    if (firstConnection !== undefined) {
      errors.push({
        code: 'DUPLICATE_CONNECTION',
        path,
        edgeId,
        message: `Edge ${edgeId ?? path} repeats the undirected ${source}-${target} connection from ${firstConnection}.`,
      })
    } else {
      connections.set(pairKey, edgeId ?? path)
    }
  }

  if (errors.length > 0) return { valid: false, errors }

  // All required fields, IDs, bounds and connections have been checked above.
  return { valid: true, graph: input as unknown as Graph, errors: [] }
}
