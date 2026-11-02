import type { AdjacencyIndex } from '../../domain/models/AdjacencyIndex'
import type { Graph } from '../../domain/models/Graph'

export type TestConnection = readonly [edgeId: string, source: string, target: string]

export function graphFromConnections(
  nodeIds: readonly string[],
  connections: readonly TestConnection[] = [],
): Graph {
  return {
    nodes: nodeIds.map((id) => ({ id, name: `Island ${id}`, x: 50, y: 50 })),
    edges: connections.map(([id, source, target]) => ({ id, source, target })),
  }
}

export function allConnections(nodeIds: readonly string[]): TestConnection[] {
  const connections: TestConnection[] = []
  for (let source = 0; source < nodeIds.length; source++) {
    for (let target = source + 1; target < nodeIds.length; target++) {
      connections.push([`E${connections.length}`, nodeIds[source], nodeIds[target]])
    }
  }
  return connections
}

/** Seeded Fisher-Yates permutations keep shuffle regressions reproducible. */
export function shuffled<T>(values: readonly T[], seed: number): T[] {
  const result = [...values]
  let state = seed >>> 0
  for (let index = result.length - 1; index > 0; index--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const target = state % (index + 1)
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export function adjacencyValues(adjacency: AdjacencyIndex) {
  return {
    nodeIds: [...adjacency.nodeIds],
    neighbors: Object.fromEntries(
      [...adjacency.neighbors].map(([id, entries]) => [
        id,
        entries.map((entry) => ({ ...entry })),
      ]),
    ),
  }
}

export function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  if (value instanceof Map) {
    for (const child of value.values()) deepFreeze(child)
  } else {
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
