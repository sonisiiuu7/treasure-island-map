import type { ReplayView } from '../../application/replaySelectors'
import type { ClosureSimulation, ClosureTarget } from '../../domain/models/ClosureSimulation'
import { componentColors } from '../componentColors'
import { useEffect, useRef } from 'react'

interface Props {
  view: ReplayView
  simulation: ClosureSimulation | null
  onSelect: (target: ClosureTarget | null) => void
}
export function ClosurePanel({ view, simulation, onSelect }: Props) {
  const graph = view.graph
  const details = useRef<HTMLDetailsElement>(null)
  useEffect(() => { if (details.current) details.current.open = false }, [graph])
  const enabled = view.status === 'COMPLETED' && graph !== null
  const options = graph ? [
    ...[...graph.edges].sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(edge =>
      ({ key: `EDGE:${edge.id}`, label: `Close bridge ${edge.id}`, target: { kind: 'EDGE' as const, id: edge.id } })),
    ...[...graph.nodes].sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(node =>
      ({ key: `NODE:${node.id}`, label: `Close island ${node.id}`, target: { kind: 'NODE' as const, id: node.id } })),
  ] : []
  return (
    <details ref={details} className="closure-panel" onKeyDown={event => {
      if (event.key === 'Escape') {
        event.currentTarget.open = false
        event.currentTarget.querySelector('summary')?.focus()
      }
    }}>
      <summary>What-if closure{simulation ? ' · active' : ''}</summary>
      <div className="closure-popover">
        <h2>Explore a closure</h2>
        <p>Compare connectivity without changing the original inspection.</p>
        <label htmlFor="closure-target">Bridge or island</label>
        <select id="closure-target" aria-label="Simulate closure" disabled={!enabled}
          value={simulation ? `${simulation.target.kind}:${simulation.target.id}` : ""}
          onChange={event => onSelect(options.find(option => option.key === event.currentTarget.value)?.target ?? null)}>
          <option value="">Original network</option>
          {options.map(option => <option value={option.key} key={option.key}>{option.label}</option>)}
        </select>
        {!enabled ? <p>Complete the inspection to explore closures.</p> : !simulation
          ? <p>Choose a connection or island to see the surviving groups.</p> : (
            <div className="closure-result" aria-live="polite" aria-atomic="true">
              <strong data-testid="closure-count">Components: {simulation.before.componentCount} → {simulation.after.componentCount}</strong>
              <p>{simulation.increasesComponents ? 'The closure splits the network further.' : 'The closure does not create an additional split.'}</p>
              <ol aria-label="Surviving components">
                {simulation.after.groups.map((group, index) => <li key={group[0]}>
                  <span className="component-key" style={{ background: componentColors[index % componentColors.length].stroke }} aria-hidden="true" />
                  <span>Component {index + 1}: {group.join(', ')}</span>
                </li>)}
              </ol>
              {simulation.after.groups.length === 0 && <p>No islands remain.</p>}
              <button type="button" className="print-button" onClick={() => onSelect(null)}>Clear simulation</button>
            </div>
          )}
      </div>
    </details>
  )
}
