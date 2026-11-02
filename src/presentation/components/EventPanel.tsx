import type { ReplayView } from '../../application/replaySelectors'
import { eventTitles } from '../replayPresentation'
import { EventProof } from './EventProof'

export function EventPanel({ view }: { view: ReplayView }) {
  const event = view.currentEvent
  return (
    <section className="panel event-panel" aria-labelledby="event-title"
      data-event-type={event?.type ?? ''} data-event-index={view.eventIndex}
      data-node-id={view.focus?.nodeId ?? ''} data-edge-id={view.focus?.edgeId ?? ''}
      data-related-node-id={view.focus?.relatedNodeId ?? ''}>
      <div className="panel-heading">
        <h2 id="event-title">Current inspection event</h2>
        <span className="section-number">{event ? String(event.index + 1).padStart(2, '0') : '—'}</span>
      </div>
      <div className="event-content" aria-live="polite" aria-atomic="true">
        {event ? (
          <div key={event.index} className="replay-event-enter">
            <h3>{eventTitles[event.type]}</h3>
            <EventProof event={event} />
            <p className="event-message">{event.message}</p>
          </div>
        ) : (
          <div className="event-welcome">
            <span className="welcome-symbol" aria-hidden="true">⌁</span>
            <h3>{view.status === 'ERROR' ? 'Inspection unavailable' : view.status === 'READY' ? 'Ready for the first step' : 'Your inspection starts here'}</h3>
            <p>{view.status === 'ERROR'
              ? 'Correct the map errors, then load the plan again.'
              : view.status === 'READY'
                ? 'Press Step to start at the first island, or Run to End to see the complete inspection.'
                : 'Load your archipelago, then follow the inspection one event at a time.'}</p>
          </div>
        )}
      </div>
    </section>
  )
}
