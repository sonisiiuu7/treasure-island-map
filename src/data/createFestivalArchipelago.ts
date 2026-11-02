import type { Graph } from '../domain/models/Graph'

/** Fresh values on every call keep the original demo recoverable for Reset. */
export function createFestivalArchipelago(): Graph {
  return {
    nodes: [
      { id: 'A', name: 'Anchor Bay', x: 12, y: 35 },
      { id: 'B', name: 'Buccaneer Bites', x: 26, y: 15 },
      { id: 'C', name: 'Coral Stage', x: 35, y: 45 },
      { id: 'D', name: 'Driftwood Dock', x: 50, y: 45 },
      { id: 'E', name: 'Ember Market', x: 67, y: 30 },
      { id: 'F', name: 'First Aid', x: 62, y: 65 },
      { id: 'G', name: 'Games Grove', x: 82, y: 35 },
      { id: 'H', name: 'Harmony Isle', x: 93, y: 60 },
    ],
    edges: [
      { id: 'AB', source: 'A', target: 'B' },
      { id: 'AC', source: 'A', target: 'C' },
      { id: 'BC', source: 'B', target: 'C' },
      { id: 'CD', source: 'C', target: 'D' },
      { id: 'DE', source: 'D', target: 'E' },
      { id: 'DF', source: 'D', target: 'F' },
      { id: 'EF', source: 'E', target: 'F' },
      { id: 'EG', source: 'E', target: 'G' },
      { id: 'GH', source: 'G', target: 'H' },
    ],
  }
}
