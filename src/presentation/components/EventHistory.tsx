import type { ReplayView } from '../../application/replaySelectors'
import { eventTitles } from '../replayPresentation'
import { EventProof } from './EventProof'

export function EventHistory({ view }: { view: ReplayView }) {
  return (
    <section className="panel history-panel" aria-labelledby="history-title">
      <div className="panel-heading">
        <h2 id="history-title">Inspection history</h2>
        <span className="muted">{view.history.length} recorded</span>
      </div>
      <div className="history-scroll" tabIndex={0} aria-label="Scrollable inspection history">
        {view.history.length === 0 ? (
          <p className="empty-note">{view.status === 'ERROR' ? 'No active inspection history.' : 'Each completed step will appear here.'}</p>
        ) : (
          <ol className="history-list" aria-label="Replayed inspection events">
            {view.history.map((event) => (
              <li key={event.index} data-history-index={event.index}>
                <details>
                  <summary>
                    <span className="history-index">{String(event.index + 1).padStart(2, '0')}</span>
                    <span>{eventTitles[event.type]}</span>
                    <span className="history-focus">{event.focus.edgeId ?? event.focus.nodeId}</span>
                  </summary>
                  <div className="history-detail">
                    <p>Recorded event {event.index + 1}: {event.message}</p>
                    <EventProof event={event} compact />
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
