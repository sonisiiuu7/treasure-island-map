import type { ReplayView } from '../../application/replaySelectors'
import { EventProof } from './EventProof'

/** Print-only presentation of the selected completed run; never prepares analysis. */
export function PrintSafetySummary({ view }: { view: ReplayView }) {
  const graph = view.graph
  const snapshot = view.snapshot
  const complete = view.status === 'COMPLETED' && graph !== null && snapshot !== null

  return (
    <section className="print-report" style={{ display: 'none' }} aria-label="Printable safety summary"
      data-testid="print-report">
      <header className="print-report-heading">
        <p>Treasure Island · Festival field guide</p>
        <h1>Bridge Safety Summary</h1>
      </header>
      {!complete ? (
        <p className="print-notice">Final report unavailable. Complete a valid inspection with Step or Run to End before printing.</p>
      ) : (
        <>
          <p className="print-subtitle">Completed inspection · {graph.nodes.length} islands · {graph.edges.length} connections · {view.history.length} recorded events</p>
          <dl className="print-totals">
            <div><dt>Components</dt><dd>{snapshot.componentCount}</dd></div>
            <div><dt>Critical bridges</dt><dd>{snapshot.bridgeIds.join(', ') || 'None'}</dd></div>
            <div><dt>Articulation islands</dt><dd>{snapshot.articulationIds.join(', ') || 'None'}</dd></div>
          </dl>
          <section aria-label="Critical bridge proofs">
            <h2>Critical bridges</h2>
            {snapshot.bridgeIds.length === 0 ? <p>None. No single connection removal increases the component count.</p> : (
              <ul className="print-proof-grid">
                {snapshot.bridgeIds.map((id) => {
                  const event = view.history.find((candidate) =>
                    candidate.type === 'CLASSIFY_EDGE' && candidate.details.edgeId === id && candidate.details.isBridge)
                  return <li key={id}>{event && <EventProof event={event} compact />}</li>
                })}
              </ul>
            )}
          </section>
          <section aria-label="Articulation island proofs">
            <h2>Articulation islands</h2>
            {snapshot.articulationIds.length === 0 ? <p>None. No single island removal increases the component count.</p> : (
              <ul className="print-proof-grid">
                {snapshot.articulationIds.map((id) => {
                  const event = view.history.find((candidate) =>
                    candidate.type === 'ARTICULATION' && candidate.details.nodeId === id)
                  return <li key={id}>{event && <EventProof event={event} compact />}</li>
                })}
              </ul>
            )}
          </section>
          <section>
            <h2>Final traversal values</h2>
            <table aria-label="Printed final traversal values">
              <thead><tr>
                <th scope="col">ID</th><th scope="col">Island</th><th scope="col">Parent</th>
                <th scope="col">Discovery</th><th scope="col">Low</th>
              </tr></thead>
              <tbody>{[...graph.nodes].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map((node) => {
                const state = snapshot.nodes[node.id]
                return <tr key={node.id}>
                  <th scope="row">{node.id}</th><td>{node.name}</td><td>{state.parent ?? '—'}</td>
                  <td>{state.discovery}</td><td>{state.low}</td>
                </tr>
              })}</tbody>
            </table>
          </section>
          <footer>
            <p>A critical bridge disconnects part of the network when removed. An articulation island separates surviving islands when removed.</p>
            <p>Discovery is the first-visit number. Low records the earliest discovery reachable through the DFS subtree and an alternate connection.</p>
            <p>This report contains the completed graph inspection; it does not assess the physical condition of a crossing.</p>
          </footer>
        </>
      )}
    </section>
  )
}
