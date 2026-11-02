import { useId } from 'react'
import type { ReplayView } from '../../application/replaySelectors'
import type { Island } from '../../domain/models/Graph'
import type { EdgeStatus } from '../../domain/models/TraversalSnapshot'

interface Point { x: number; y: number }
const edgeLabels: Record<EdgeStatus, string> = {
  UNINSPECTED: 'uninspected', TREE: 'DFS-tree', NON_TREE: 'inspected non-tree', BRIDGE: 'critical bridge',
}
const edgeDash: Record<EdgeStatus, string | undefined> = {
  UNINSPECTED: '3 6', TREE: undefined, NON_TREE: '2 5', BRIDGE: '9 5',
}

function point(node: Island, portrait: boolean): Point {
  // Layout transformation only. The original graph/algorithm coordinates are never changed.
  return portrait ? { x: 120 + node.y * 2.15, y: 48 + node.x * 4.2 } : { x: 72 + node.x * 8.2, y: 40 + node.y * 2.2 }
}

function namePosition(node: Island, p: Point, portrait: boolean) {
  const displayName = node.name.length > 19 ? `${node.name.slice(0, 18)}…` : node.name
  const width = displayName.length * 7.2
  if (portrait) {
    if (node.y >= 55 && p.x + 32 + width < 368) return { x: p.x + 32, y: p.y + 5, anchor: 'start' as const, displayName }
    if (p.x - 32 - width > 10) return { x: p.x - 32, y: p.y + 5, anchor: 'end' as const, displayName }
    if (p.x + 48 + width < 368) return { x: p.x + 48, y: p.y - 24, anchor: 'start' as const, displayName }
    return {
      x: Math.max(width / 2 + 12, Math.min(368 - width / 2, p.x)),
      y: p.y < 65 ? p.y + 35 : p.y - 32,
      anchor: 'middle' as const,
      displayName,
    }
  }
  const above = node.y <= 30 || (node.x >= 45 && node.x <= 55 && node.y < 55) || (node.x >= 75 && node.y <= 40) || p.y > 252
  return {
    x: Math.max(80, Math.min(880, p.x)),
    y: above ? Math.max(24, p.y - 30) : p.y + 39,
    anchor: 'middle' as const,
    displayName,
  }
}

function MapDrawing({ view, portrait }: { view: ReplayView; portrait: boolean }) {
  const instance = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const graph = view.graph
  const snapshot = view.snapshot
  if (!graph || !snapshot) return null
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
  const width = portrait ? 380 : 960
  const height = portrait ? 520 : 300
  const mode = portrait ? 'portrait' : 'landscape'

  return (
    <svg className={`island-svg map-${mode}`} viewBox={`0 0 ${width} ${height}`}
      role="img" aria-labelledby={`map-title-${instance}`} aria-describedby={`map-description-${instance}`}
      data-testid={`map-${mode}`}>
      <title id={`map-title-${instance}`}>Festival archipelago, {mode} layout</title>
      <desc id={`map-description-${instance}`}>
        {graph.nodes.length} islands and {graph.edges.length} undirected bridges.
        Dashed bridges with ! are critical; AP badges mark articulation islands.
        A ring and NOW label identify the current island; an arrow identifies the current bridge.
        {view.status === 'COMPLETED' ? ` Final critical bridges: ${snapshot.bridgeIds.join(', ') || 'none'}. Articulation islands: ${snapshot.articulationIds.join(', ') || 'none'}.` : ' Inspection is not complete.'}
      </desc>
      <defs>
        <pattern id={`sea-grid-${instance}`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#b6cfca" opacity=".55" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="#edf5f1" />
      <rect width={width} height={height} fill={`url(#sea-grid-${instance})`} />
      <path d={portrait ? 'M20 280 Q60 268 100 280 M270 80 Q310 68 350 80' : 'M35 233 Q100 217 170 233 M715 48 Q785 32 855 48'}
        fill="none" stroke="#cfdfd8" strokeWidth="2" aria-hidden="true" />
      <g aria-hidden="true" className="map-compass" transform={`translate(${width - 36} ${height - 34})`}>
        <path d="M0 -14 L5 6 L0 2 L-5 6 Z" fill="#70958d" />
        <text x="0" y="-20" textAnchor="middle">N</text>
      </g>

      {graph.edges.map((edge) => {
        // Normalize label orientation by ID; endpoint source order affects no layout decision.
        const first = nodeById.get(edge.source < edge.target ? edge.source : edge.target)
        const second = nodeById.get(edge.source < edge.target ? edge.target : edge.source)
        if (!first || !second) return null
        const a = point(first, portrait)
        const b = point(second, portrait)
        const dx = b.x - a.x
        const dy = b.y - a.y
        const length = Math.hypot(dx, dy) || 1
        const outsidePortraitBend = portrait && dx > 0 && dy > 0
        const direction = outsidePortraitBend ? -1 : 1
        const offset = portrait ? (outsidePortraitBend && dx > dy / 2 ? 30 : 16) : -12
        const labelX = (a.x + b.x) / 2 + (-dy / length) * offset * direction
        const labelY = (a.y + b.y) / 2 + (dx / length) * offset * direction
        const state = snapshot.edges[edge.id]
        const current = view.focus?.edgeId === edge.id
        const label = `${current ? '› ' : ''}${state === 'BRIDGE' ? '! ' : ''}${edge.id}`
        const labelWidth = Math.max(30, label.length * 7.5 + 12)
        return (
          <g key={edge.id} className={`map-edge edge-${state.toLowerCase()}`}
            data-testid={`bridge-${edge.id}`} data-state={state} data-current={current}
            aria-label={`Bridge ${edge.id}: ${edgeLabels[state]}${current ? '; current' : ''}`}>
            <title>{`Bridge ${edge.id}: ${edgeLabels[state]}${current ? '; current inspection' : ''}`}</title>
            {current && <line key={view.eventIndex} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="current-edge-halo" />}
            <line data-role="connection" x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              strokeDasharray={edgeDash[state]} className="connection-line" />
            <g className="bridge-label" transform={`translate(${labelX} ${labelY})`}>
              <rect x={-labelWidth / 2} y="-10" width={labelWidth} height="20" rx="6" />
              <text textAnchor="middle" y="4">{label}</text>
            </g>
          </g>
        )
      })}

      {graph.nodes.map((node) => {
        const p = point(node, portrait)
        const name = namePosition(node, p, portrait)
        const state = snapshot.nodes[node.id]
        const current = view.focus?.nodeId === node.id
        const articulation = snapshot.articulationIds.includes(node.id)
        return (
          <g key={node.id} className={`map-node node-${state.status.toLowerCase()}`}
            data-testid={`island-${node.id}`} data-state={state.status}
            data-current={current} data-articulation={articulation}
            aria-label={`Island ${node.id}, ${node.name}: ${state.status.toLowerCase()}${articulation ? '; articulation island' : ''}${current ? '; current' : ''}`}>
            <title>{`${node.id} · ${node.name}. ${state.status.toLowerCase()}. Discovery ${state.discovery ?? 'unset'}, low ${state.low ?? 'unset'}.${articulation ? ' Articulation island.' : ''}${current ? ' Current focus.' : ''}`}</title>
            <ellipse cx={p.x + 1} cy={p.y + 3} rx="28" ry="20" className="island-shore" />
            <ellipse cx={p.x} cy={p.y} rx="23" ry="16" className="island-land" />
            {current && <circle key={view.eventIndex} cx={p.x} cy={p.y} r="30" className="current-node-ring" />}
            {articulation && <circle cx={p.x} cy={p.y} r="20" className="articulation-ring" />}
            <circle cx={p.x} cy={p.y} r="14" className="island-marker" />
            <text x={p.x} y={p.y + 5} textAnchor="middle" className="island-id">{node.id}</text>
            <text x={name.x} y={name.y} textAnchor={name.anchor} className="map-island-name">{name.displayName}</text>
            {articulation && <g className="articulation-badge" transform={`translate(${p.x + 23} ${p.y + 16})`}>
              <rect x="-12" y="-8" width="24" height="15" rx="5" /><text textAnchor="middle" y="3">AP</text>
            </g>}
            {current && <g className="current-badge" transform={`translate(${p.x + (portrait ? 29 : 0)} ${p.y - 28})`}>
              <rect x="-16" y="-9" width="32" height="14" rx="5" /><text textAnchor="middle" y="1">NOW</text>
            </g>}
          </g>
        )
      })}
    </svg>
  )
}

export function IslandMap({ view }: { view: ReplayView }) {
  return (
    <section className="panel map-panel" aria-labelledby="archipelago-title">
      <div className="panel-heading">
        <h2 id="archipelago-title">Your archipelago</h2>
        <span className="muted">{view.graph ? `${view.graph.nodes.length} islands · ${view.graph.edges.length} bridges` : 'Map unavailable'}</span>
      </div>
      {view.graph && view.snapshot ? (
        <div className="map-canvas">
          <MapDrawing view={view} portrait={false} />
          <MapDrawing view={view} portrait />
        </div>
      ) : <div className="map-empty"><span aria-hidden="true">⌁</span><p>No map is available for this inspection.</p></div>}
      <ul className="map-legend" aria-label="Map legend">
        <li><span className="legend-node" aria-hidden="true" />Unvisited</li>
        <li><span className="legend-current" aria-hidden="true">›</span>Current</li>
        <li><span className="legend-line legend-tree" aria-hidden="true" />DFS tree</li>
        <li><span className="legend-line legend-non-tree" aria-hidden="true" />Non-tree</li>
        <li><span className="legend-line legend-bridge" aria-hidden="true">!</span>Critical bridge</li>
        <li><span className="legend-articulation" aria-hidden="true">AP</span>Articulation</li>
      </ul>
    </section>
  )
}
