import type { ReplayView } from '../../application/replaySelectors'
import { EventProof } from './EventProof'

export function SafetySummary({ view }: { view: ReplayView }) {
  const snapshot = view.snapshot
  const complete = view.status === 'COMPLETED'
  const pending = view.status === 'EMPTY' || view.status === 'READY'
  const emptyText = complete ? 'None' : pending ? 'Not inspected' : 'None detected yet'
  const firstBridge = snapshot?.bridgeIds[0]
  const proof = firstBridge === undefined
    ? view.history.find((event) => event.type === 'ARTICULATION' && event.details.nodeId === snapshot?.articulationIds[0])
    : view.history.find((event) => event.type === 'CLASSIFY_EDGE' && event.details.edgeId === firstBridge && event.details.isBridge)

  return (
    <section className="panel summary-panel" aria-labelledby="summary-title">
      <div className="panel-heading">
        <h2 id="summary-title">Safety findings</h2>
        <span className={`summary-stage ${complete ? 'is-final' : ''}`}>{view.status === 'ERROR' ? 'Unavailable' : complete ? 'Final' : 'Provisional'}</span>
      </div>
      {!snapshot ? <p className="empty-note">Findings unavailable. Resolve the map errors and load again.</p> : (
        <div className="summary-content">
          <dl className="findings-list">
            <div><dt>{complete ? 'Components' : 'Components started'}</dt><dd data-testid="component-count">{snapshot.componentCount}</dd></div>
            <div><dt>Critical bridges</dt><dd data-testid="critical-bridges">{snapshot.bridgeIds.length > 0
              ? snapshot.bridgeIds.map((id) => <span className="finding-chip bridge-chip" key={id}>{id}</span>)
              : <span className="finding-empty">{emptyText}</span>}</dd></div>
            <div><dt>Articulation islands</dt><dd data-testid="articulation-islands">{snapshot.articulationIds.length > 0
              ? snapshot.articulationIds.map((id) => <span className="finding-chip articulation-chip" key={id}>{id}</span>)
              : <span className="finding-empty">{emptyText}</span>}</dd></div>
          </dl>
          {proof ? (
            <div className="summary-proof">
              <span className="proof-kicker">The reason, in numbers</span>
              <EventProof event={proof} compact />
              <p>{firstBridge ? `Removing ${firstBridge} disconnects its branch from the rest of the network.` : 'Removing this island separates parts of the network.'}</p>
            </div>
          ) : <p className="summary-note">{complete
            ? 'No single bridge or island removal increases the component count.'
            : 'Findings are provisional until the inspection finishes.'}</p>}
        </div>
      )}
    </section>
  )
}
