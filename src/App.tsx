import { useMemo } from 'react'
import { AnalysisService } from './application/AnalysisService'
import { TarjanLowLinkAnalyzer } from './domain/algorithms/TarjanLowLinkAnalyzer'
import type { Graph } from './domain/models/Graph'
import { useReplayController } from './presentation/hooks/useReplayController'
import { statusLabels } from './presentation/replayPresentation'
import { IslandMap } from './presentation/components/IslandMap'
import { ReplayControls } from './presentation/components/ReplayControls'
import { EventPanel } from './presentation/components/EventPanel'
import { EventHistory } from './presentation/components/EventHistory'
import { NodeTable } from './presentation/components/NodeTable'
import { SafetySummary } from './presentation/components/SafetySummary'
import './App.css'

interface AppProps {
  readonly analysisService?: Pick<AnalysisService, 'prepare'>
  readonly originalDemoGraph?: Graph
}

/** Composition root: choose the strategy here; panels receive the same selected view. */
export default function App({ analysisService, originalDemoGraph }: AppProps) {
  const service = useMemo(
    () => analysisService ?? new AnalysisService(new TarjanLowLinkAnalyzer()),
    [analysisService],
  )
  const controller = useReplayController(service, originalDemoGraph)
  const { view } = controller

  return (
    <main className="app-shell mx-auto" data-replay-status={view.status}>
      <a className="skip-link" href="#inspection">Skip to inspection</a>
      <header className="app-header">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 44 44" aria-hidden="true">
            <rect width="44" height="44" rx="13" fill="currentColor" />
            <circle cx="22" cy="22" r="13" fill="none" stroke="#b7d6c7" strokeWidth="1" />
            <path d="M27 12 L24 24 L13 31 L19 18 Z" fill="#f4e1ae" />
            <path d="M27 12 L24 24 L19 18 Z" fill="#fff9e9" />
          </svg>
          <div>
            <p className="eyebrow">Treasure Island · Festival field guide</p>
            <h1 aria-label="Treasure-Island Bridge Safety Map">Bridge Safety Map</h1>
            <p className="subtitle">A festival connected. A plan you can explain.</p>
          </div>
        </div>
        <div className="header-status">
          <span className={`status-badge status-${view.status.toLowerCase()}`} role="status">{statusLabels[view.status]}</span>
          <span className="header-note">Your original festival plan</span>
        </div>
      </header>

      <ReplayControls controller={controller} />

      {view.errors.length > 0 && (
        <section className="validation-alert" role="alert" aria-labelledby="validation-title">
          <h2 id="validation-title">Map needs attention</h2>
          <ul>{view.errors.map((error, index) => (
            <li key={`${error.path}-${index}`}>{error.message} <code>{error.path}</code></li>
          ))}</ul>
        </section>
      )}

      <div className="dashboard" id="inspection">
        <div className="map-column">
          <IslandMap view={view} />
          <NodeTable view={view} />
        </div>
        <div className="inspection-column">
          <EventPanel view={view} />
          <SafetySummary view={view} />
          <EventHistory view={view} />
        </div>
      </div>
    </main>
  )
}
