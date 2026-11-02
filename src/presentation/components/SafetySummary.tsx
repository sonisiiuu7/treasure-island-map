import type { ReplayView } from '../../application/replaySelectors'
import { EventProof } from './EventProof'
import { useState } from 'react'
import type { ClosureTarget } from '../../domain/models/ClosureSimulation'
import { selectCriticalProof } from '../../application/criticalProofSelectors'

export function SafetySummary({ view }: { view: ReplayView }) {
  const snapshot = view.snapshot
  const complete = view.status === 'COMPLETED'
  const pending = view.status === 'EMPTY' || view.status === 'READY'
  const emptyText = complete ? 'None' : pending ? 'Not inspected' : 'None detected yet'
  const [requested, setRequested] = useState<{ graph: ReplayView['graph']; target: ClosureTarget } | null>(null)
  const proof = selectCriticalProof(view, requested?.graph === view.graph ? requested.target : null)
  const selectedKey = proof?.type === 'CLASSIFY_EDGE' ? `EDGE:${proof.details.edgeId}`
    : proof?.type === 'ARTICULATION' ? `NODE:${proof.details.nodeId}` : null

  return (
    <section className="panel summary-panel" aria-labelledby="summary-title">
      <div className="panel-heading">
        <h2 id="summary-title">Safety findings</h2>
        <div className="summary-actions">
          <button type="button" className="print-button" disabled={!complete} onClick={() => window.print()}>Print summary</button>
          <span className={`summary-stage ${complete ? 'is-final' : ''}`}>{view.status === 'ERROR' ? 'Unavailable' : complete ? 'Final' : 'Provisional'}</span>
        </div>
      </div>
      {!snapshot ? <p className="empty-note">Findings unavailable. Resolve the map errors and load again.</p> : (
        <div className="summary-content">
          <dl className="findings-list">
            <div><dt>{complete ? 'Components' : 'Components started'}</dt><dd data-testid="component-count">{snapshot.componentCount}</dd></div>
            <div><dt>Critical bridges</dt><dd data-testid="critical-bridges">{snapshot.bridgeIds.length > 0
              ? snapshot.bridgeIds.map((id) => <button type="button" className="finding-chip bridge-chip" key={id}
                aria-label={`Explain critical bridge ${id}`} aria-pressed={selectedKey === `EDGE:${id}`}
                onClick={() => setRequested({ graph: view.graph, target: { kind: 'EDGE', id } })}>{id}</button>)
              : <span className="finding-empty">{emptyText}</span>}</dd></div>
            <div><dt>Articulation islands</dt><dd data-testid="articulation-islands">{snapshot.articulationIds.length > 0
              ? snapshot.articulationIds.map((id) => <button type="button" className="finding-chip articulation-chip" key={id}
                aria-label={`Explain articulation island ${id}`} aria-pressed={selectedKey === `NODE:${id}`}
                onClick={() => setRequested({ graph: view.graph, target: { kind: 'NODE', id } })}>{id}</button>)
              : <span className="finding-empty">{emptyText}</span>}</dd></div>
          </dl>
          {proof ? (
            <div className="summary-proof">
              <span className="proof-kicker">The reason, in numbers</span>
              <EventProof event={proof} compact />
              <span className="recorded-proof-event">Recorded event {proof.index + 1}</span>
              <p>{proof.type === 'CLASSIFY_EDGE' ? `Removing ${proof.details.edgeId} disconnects its branch from the rest of the network.` : 'Removing this island separates parts of the network.'}</p>
            </div>
          ) : <p className="summary-note">{complete
            ? 'No single bridge or island removal increases the component count.'
            : 'Findings are provisional until the inspection finishes.'}</p>}
        </div>
      )}
    </section>
  )
}
