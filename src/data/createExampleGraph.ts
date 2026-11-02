import type { Graph } from '../domain/models/Graph'
import { createFestivalArchipelago } from './createFestivalArchipelago'

export const GRAPH_EXAMPLES = Object.freeze([
  Object.freeze({ id: 'FESTIVAL', label: 'Festival archipelago' }),
  Object.freeze({ id: 'CYCLE', label: 'Cycle only' }),
  Object.freeze({ id: 'BRANCHING', label: 'Branching root' }),
  Object.freeze({ id: 'DISCONNECTED', label: 'Disconnected + isolated' }),
] as const)
export type GraphExampleId = typeof GRAPH_EXAMPLES[number]['id']

export function createExampleGraph(id: GraphExampleId): Graph {
  if (id === 'FESTIVAL') return createFestivalArchipelago()
  if (id === 'CYCLE') return {
    nodes: [
      { id: 'A', name: 'Loop West', x: 12, y: 35 },
      { id: 'B', name: 'Loop North', x: 45, y: 15 },
      { id: 'C', name: 'Loop East', x: 82, y: 55 },
    ],
    edges: [
      { id: 'AB', source: 'A', target: 'B' },
      { id: 'AC', source: 'A', target: 'C' },
      { id: 'BC', source: 'B', target: 'C' },
    ],
  }
  if (id === 'BRANCHING') return {
    nodes: [
      { id: 'A', name: 'Root Dock', x: 12, y: 50 },
      { id: 'B', name: 'West Pier', x: 60, y: 15 },
      { id: 'C', name: 'East Pier', x: 60, y: 75 },
    ],
    edges: [{ id: 'AB', source: 'A', target: 'B' }, { id: 'AC', source: 'A', target: 'C' }],
  }
  if (id !== 'DISCONNECTED') throw new Error(`Unknown graph example ${id}.`)
  return {
    nodes: [
      { id: 'A', name: 'Root Dock', x: 8, y: 35 },
      { id: 'B', name: 'West Pier', x: 26, y: 15 },
      { id: 'C', name: 'East Pier', x: 26, y: 65 },
      { id: 'D', name: 'North Dock', x: 55, y: 35 },
      { id: 'E', name: 'North Pier', x: 72, y: 15 },
      { id: 'F', name: 'Quiet Isle', x: 92, y: 70 },
    ],
    edges: [
      { id: 'AB', source: 'A', target: 'B' },
      { id: 'AC', source: 'A', target: 'C' },
      { id: 'DE', source: 'D', target: 'E' },
    ],
  }
}
