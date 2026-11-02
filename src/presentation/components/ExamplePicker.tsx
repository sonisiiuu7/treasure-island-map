import type { Graph } from '../../domain/models/Graph'
import { createExampleGraph, GRAPH_EXAMPLES } from '../../data/createExampleGraph'

export function ExamplePicker({ onLoad }: { onLoad: (graph: Graph) => void }) {
  return (
    <label className="example-picker">
      <span className="sr-only">Load example graph</span>
      <select value="" onChange={event => {
        const example = GRAPH_EXAMPLES.find(item => item.id === event.currentTarget.value)
        if (example) onLoad(createExampleGraph(example.id))
      }}>
        <option value="" disabled>Load an example…</option>
        {GRAPH_EXAMPLES.map(example => <option key={example.id} value={example.id}>{example.label}</option>)}
      </select>
    </label>
  )
}
