import type { ReplayController } from '../hooks/useReplayController'

export function ReplayControls({ controller }: { controller: ReplayController }) {
  const { view, load, step, runToEnd, reset } = controller
  const { completedEvents, totalEvents } = view.progress
  return (
    <section className="replay-toolbar" aria-label="Inspection controls">
      <div className="control-buttons">
        <button className="button button-load" type="button" onClick={() => load()} disabled={!view.controls.canLoad}>
          Load My Archipelago
        </button>
        <button className="button button-step" type="button" onClick={step} disabled={!view.controls.canStep}>
          Step
        </button>
        <button className="button button-run" type="button" onClick={runToEnd} disabled={!view.controls.canRunToEnd}>
          Run to End
        </button>
        <button className="button button-reset" type="button" onClick={reset} disabled={!view.controls.canReset}>
          Reset
        </button>
      </div>
      <div className="replay-progress">
        <span>{totalEvents > 0 ? `Event ${completedEvents} / ${totalEvents}` : 'Ready when you are'}</span>
        <progress aria-label="Replay progress" value={completedEvents} max={totalEvents || 1} />
      </div>
    </section>
  )
}
