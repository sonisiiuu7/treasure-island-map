import type { ReplayView } from '../../application/replaySelectors'

const nodeStatus = { UNVISITED: 'Unvisited', ACTIVE: 'Active', FINISHED: 'Finished' } as const

export function NodeTable({ view }: { view: ReplayView }) {
  const graph = view.graph
  const snapshot = view.snapshot
  return (
    <section className="panel table-panel" aria-labelledby="table-title">
      <div className="panel-heading">
        <h2 id="table-title">Island inspection values</h2>
        <details className="number-help">
          <summary>What do the numbers mean?</summary>
          <p><strong>Discovery</strong> is the first-visit number. <strong>Low</strong> is the earliest discovery reachable through the DFS subtree and an alternate connection. A root has no parent. A dash means a value is unset.</p>
        </details>
      </div>
      {!graph || !snapshot ? <p className="empty-note">No traversal values available.</p> : (
        <table aria-label="Island traversal values">
          <thead><tr>
            <th scope="col">ID</th><th scope="col">Island</th><th scope="col">Parent</th>
            <th scope="col" aria-label="Discovery"><abbr title="Discovery">Disc.</abbr></th>
            <th scope="col">Low</th><th scope="col">State</th>
          </tr></thead>
          <tbody>
            {[...graph.nodes].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map((node) => {
              const state = snapshot.nodes[node.id]
              return (
                <tr key={node.id} data-node-id={node.id} data-current={view.focus?.nodeId === node.id}>
                  <th scope="row">{node.id}</th><td className="island-name">{node.name}</td>
                  <td className="numeric">{state.parent ?? '—'}</td>
                  <td className="numeric">{state.discovery ?? '—'}</td>
                  <td className="numeric">{state.low ?? '—'}</td>
                  <td><span className={`node-state node-state-${state.status.toLowerCase()}`}>{nodeStatus[state.status]}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
