// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialReplayState, replayReducer } from '../application/replayReducer'
import { selectReplayView } from '../application/replaySelectors'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import type { ReplayEvent } from '../domain/models/ReplayEvent'
import { IslandMap } from '../presentation/components/IslandMap'
import { EventPanel } from '../presentation/components/EventPanel'
import { EventHistory } from '../presentation/components/EventHistory'
import { NodeTable } from '../presentation/components/NodeTable'
import { SafetySummary } from '../presentation/components/SafetySummary'
import { ReplayControls } from '../presentation/components/ReplayControls'
import { MAIN_GRAPH_ORACLE } from './fixtures/mainGraphOracle'
import { graphFromConnections } from './helpers/graphFixtures'
import { completedReplay, failedReplay, readyReplay, stepTo } from './helpers/replayFixtures'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

function initialView() {
  return selectReplayView(createInitialReplayState(createFestivalArchipelago()))
}
function viewAt(predicate: (event: ReplayEvent) => boolean) {
  const state = readyReplay()
  const event = state.result?.events.find(predicate)
  if (!event) throw new Error('Missing fixture event')
  return selectReplayView(stepTo(state, event.index))
}
function completedView() { return selectReplayView(completedReplay()) }

describe('IslandMap', () => {
  it('renders both responsive native SVG layouts with eight islands and nine ID-resolved edges', () => {
    render(<IslandMap view={initialView()} />)
    for (const mode of ['landscape', 'portrait']) {
      const map = screen.getByTestId(`map-${mode}`)
      expect(map.tagName.toLowerCase()).toBe('svg')
      expect(map).toHaveAccessibleName(`Festival archipelago, ${mode} layout`)
      expect(map.querySelectorAll('.map-node')).toHaveLength(8)
      expect(map.querySelectorAll('.map-edge')).toHaveLength(9)
      expect(within(map).getByTestId('island-A')).toHaveAccessibleName(/Anchor Bay.*unvisited/)
      expect(within(map).getByTestId('bridge-CD')).toHaveAttribute('data-state', 'UNINSPECTED')
    }
  })

  it('uses line patterns and textual symbols alongside color for all map states', () => {
    render(<IslandMap view={completedView()} />)
    const map = screen.getByTestId('map-landscape')
    const tree = within(map).getByTestId('bridge-AB')
    const nonTree = within(map).getByTestId('bridge-AC')
    const bridge = within(map).getByTestId('bridge-CD')
    expect(tree).toHaveAttribute('data-state', 'TREE')
    expect(tree.querySelector('[data-role=connection]')).not.toHaveAttribute('stroke-dasharray')
    expect(nonTree.querySelector('[data-role=connection]')).toHaveAttribute('stroke-dasharray', '2 5')
    expect(bridge.querySelector('[data-role=connection]')).toHaveAttribute('stroke-dasharray', '9 5')
    expect(bridge.querySelector('.bridge-label')).toHaveTextContent('! CD')
    expect(within(map).getByTestId('island-D').querySelector('.articulation-badge')).toHaveTextContent('AP')
    const legend = screen.getByRole('list', { name: 'Map legend' })
    for (const label of ['Unvisited', 'Current', 'DFS tree', 'Non-tree', 'Critical bridge', 'Articulation']) {
      expect(within(legend).getByText(label)).toBeInTheDocument()
    }
  })

  it('preserves a critical bridge marker while highlighting that edge as current', () => {
    const view = viewAt((event) => event.type === 'CLASSIFY_EDGE' && event.details.edgeId === 'CD')
    render(<IslandMap view={view} />)
    const edge = within(screen.getByTestId('map-landscape')).getByTestId('bridge-CD')
    expect(edge).toHaveAttribute('data-current', 'true')
    expect(edge).toHaveAttribute('data-state', 'BRIDGE')
    expect(edge.querySelector('.current-edge-halo')).toBeInTheDocument()
    expect(edge.querySelector('.bridge-label')).toHaveTextContent('› ! CD')
    expect(edge.querySelector('[data-role=connection]')).toHaveAttribute('stroke-dasharray', '9 5')
  })

  it('preserves the articulation badge and ring while its island has current focus', () => {
    render(<IslandMap view={viewAt((event) => event.type === 'ARTICULATION' && event.details.nodeId === 'D')} />)
    const island = within(screen.getByTestId('map-landscape')).getByTestId('island-D')
    expect(island).toHaveAttribute('data-current', 'true')
    expect(island).toHaveAttribute('data-articulation', 'true')
    expect(island).toHaveAccessibleName(/articulation island; current/)
    expect(island.querySelector('.current-node-ring')).toBeInTheDocument()
    expect(island.querySelector('.articulation-ring')).toBeInTheDocument()
    expect(island.querySelector('.current-badge')).toHaveTextContent('NOW')
    expect(island.querySelector('.articulation-badge')).toHaveTextContent('AP')
  })

  it('resolves endpoints by ID when graph arrays and endpoint directions are reversed', () => {
    const graph = createFestivalArchipelago()
    const reversed = {
      nodes: [...graph.nodes].reverse(),
      edges: [...graph.edges].reverse().map((edge) => ({ ...edge, source: edge.target, target: edge.source })),
    }
    const { rerender } = render(<IslandMap view={initialView()} />)
    const line = () => within(screen.getByTestId('map-landscape')).getByTestId('bridge-CD').querySelector('line')
    const before = ['x1', 'y1', 'x2', 'y2'].map((attribute) => line()?.getAttribute(attribute))
    rerender(<IslandMap view={selectReplayView(readyReplay(reversed))} />)
    expect(['x1', 'y1', 'x2', 'y2'].map((attribute) => line()?.getAttribute(attribute))).toEqual(before)
  })

  it('renders no stale SVG map after a failed load', () => {
    render(<IslandMap view={selectReplayView(failedReplay())} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('No map is available for this inspection.')).toBeInTheDocument()
  })
})

describe('NodeTable', () => {
  it('sorts rows by ID and displays unset values without final-answer leakage', () => {
    const graph = createFestivalArchipelago()
    render(<NodeTable view={selectReplayView(readyReplay({ nodes: [...graph.nodes].reverse(), edges: graph.edges }))} />)
    const rows = screen.getByRole('table', { name: 'Island traversal values' }).querySelectorAll('tbody tr')
    expect([...rows].map((row) => row.getAttribute('data-node-id'))).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    expect([...rows[1].querySelectorAll('td')].map((cell) => cell.textContent)).toEqual([
      'Buccaneer Bites', '—', '—', '—', 'Unvisited',
    ])
  })

  it('highlights the current row and uses its actual selected numerical values', () => {
    render(<NodeTable view={viewAt((event) => event.type === 'DISCOVER' && event.details.nodeId === 'A')} />)
    const row = screen.getByRole('rowheader', { name: 'A' }).closest('tr')
    expect(row).toHaveAttribute('data-current', 'true')
    expect([...row!.querySelectorAll('td')].map((cell) => cell.textContent)).toEqual([
      'Anchor Bay', '—', '0', '0', 'Active',
    ])
  })

  it('matches the independent final parent/discovery/low table', () => {
    render(<NodeTable view={completedView()} />)
    const table = screen.getByRole('table', { name: 'Island traversal values' }) as HTMLTableElement
    for (const [index, [id, node]] of Object.entries(MAIN_GRAPH_ORACLE.nodes).entries()) {
      const cells = table.rows[index + 1].cells
      expect([cells[0].textContent, cells[2].textContent, cells[3].textContent, cells[4].textContent, cells[5].textContent])
        .toEqual([id, node.parent ?? '—', String(node.discovery), String(node.low), 'Finished'])
    }
  })

  it('removes stale table values in ERROR', () => {
    render(<NodeTable view={selectReplayView(failedReplay())} />)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('No traversal values available.')).toBeInTheDocument()
  })
})

describe('EventPanel', () => {
  it('explains startup and READY before any event is selected', () => {
    const { rerender } = render(<EventPanel view={initialView()} />)
    expect(screen.getByText('Your inspection starts here')).toBeInTheDocument()
    rerender(<EventPanel view={selectReplayView(readyReplay())} />)
    expect(screen.getByText('Ready for the first step')).toBeInTheDocument()
    expect(screen.queryByText(/Critical bridge ·/)).not.toBeInTheDocument()
  })

  it('shows the recorded F -> E low change from 4 to 3', () => {
    render(<EventPanel view={viewAt((event) =>
      event.type === 'RETURN_CHILD' && event.details.nodeId === 'E' && event.details.childId === 'F',
    )} />)
    expect(screen.getByText('4 → 3')).toBeInTheDocument()
    expect(screen.getByText('low[E] = min(4, low[F] = 3) = 3')).toBeInTheDocument()
  })

  it('shows DE strict inequality and the subsequent D articulation equality proof', () => {
    const { rerender } = render(<EventPanel view={viewAt((event) =>
      event.type === 'CLASSIFY_EDGE' && event.details.edgeId === 'DE',
    )} />)
    expect(screen.getByText('Not a bridge · DE')).toBeInTheDocument()
    expect(screen.getByText('3 > 3 = false')).toBeInTheDocument()
    rerender(<EventPanel view={viewAt((event) => event.type === 'ARTICULATION' && event.details.nodeId === 'D')} />)
    expect(screen.getByText('Articulation island · D')).toBeInTheDocument()
    expect(screen.getByText('3 ≥ 3 = true')).toBeInTheDocument()
  })

  it('shows the negative root child-count outcome', () => {
    render(<EventPanel view={viewAt((event) => event.type === 'FINISH_NODE' && event.details.nodeId === 'A')} />)
    expect(screen.getByText('Root rule: 1 ≥ 2 = false')).toBeInTheDocument()
  })
})

describe('SafetySummary and history', () => {
  it('labels incomplete findings provisionally instead of implying a safe completed result', () => {
    render(<SafetySummary view={initialView()} />)
    expect(screen.getByText('Provisional')).toBeInTheDocument()
    expect(screen.getAllByText('Not inspected')).toHaveLength(2)
    expect(screen.getByText('Findings are provisional until the inspection finishes.')).toBeInTheDocument()
    expect(screen.queryByText('None')).not.toBeInTheDocument()
  })

  it('exposes only a bridge already classified in the history prefix', () => {
    render(<SafetySummary view={viewAt((event) => event.type === 'CLASSIFY_EDGE' && event.details.edgeId === 'GH')} />)
    expect(screen.getByTestId('critical-bridges')).toHaveTextContent('GH')
    expect(screen.getByTestId('critical-bridges')).not.toHaveTextContent('CD')
    expect(screen.getByText('Critical bridge · GH')).toBeInTheDocument()
  })

  it('shows sorted final items and a bridge proof directly on screen', () => {
    render(<SafetySummary view={completedView()} />)
    expect(screen.getByText('Final')).toBeInTheDocument()
    expect(screen.getByTestId('component-count')).toHaveTextContent('1')
    expect([...screen.getByTestId('critical-bridges').children].map((item) => item.textContent)).toEqual(['CD', 'EG', 'GH'])
    expect([...screen.getByTestId('articulation-islands').children].map((item) => item.textContent)).toEqual(['C', 'D', 'E', 'G'])
    expect(screen.getByText('Critical bridge · CD')).toBeInTheDocument()
    expect(screen.getByText('3 > 2 = true')).toBeInTheDocument()
    expect(screen.getByText('Removing CD disconnects its branch from the rest of the network.')).toBeInTheDocument()
  })

  it('distinguishes a completed cycle with no critical items from an incomplete analysis', () => {
    const graph = graphFromConnections(['A', 'B', 'C'], [['AB', 'A', 'B'], ['BC', 'B', 'C'], ['AC', 'A', 'C']])
    const completed = replayReducer(readyReplay(graph), { type: 'RUN_TO_END' })
    render(<SafetySummary view={selectReplayView(completed)} />)
    expect(screen.getByText('Final')).toBeInTheDocument()
    expect(screen.getAllByText('None')).toHaveLength(2)
    expect(screen.getByText('No single bridge or island removal increases the component count.')).toBeInTheDocument()
  })

  it('clears all stale counts and proofs after failure', () => {
    render(<SafetySummary view={selectReplayView(failedReplay())} />)
    expect(screen.queryByTestId('component-count')).not.toBeInTheDocument()
    expect(screen.queryByTestId('critical-bridges')).not.toBeInTheDocument()
    expect(screen.queryByText('Critical bridge · CD')).not.toBeInTheDocument()
    expect(screen.getByText(/Findings unavailable/)).toBeInTheDocument()
  })

  it('exposes only replayed events and retains all 54 inspectable entries after completion', async () => {
    const { rerender } = render(<EventHistory view={selectReplayView(stepTo(readyReplay(), 2))} />)
    expect(screen.getByRole('list', { name: 'Replayed inspection events' }).children).toHaveLength(3)
    expect(screen.queryByText(/Return F -> E/)).not.toBeInTheDocument()
    const completed = completedView()
    rerender(<EventHistory view={completed} />)
    const list = screen.getByRole('list', { name: 'Replayed inspection events' })
    expect(list.children).toHaveLength(54)
    const event = completed.history.find((candidate) =>
      candidate.type === 'RETURN_CHILD' && candidate.details.nodeId === 'E' && candidate.details.childId === 'F',
    )
    if (!event) throw new Error('Missing return')
    const entry = list.querySelector(`[data-history-index="${event.index}"]`)!
    await userEvent.setup().click(entry.querySelector('summary')!)
    expect(entry.querySelector('details')).toHaveAttribute('open')
    expect(within(entry as HTMLElement).getByText('4 → 3')).toBeVisible()
  })
})

describe('ReplayControls', () => {
  it('has accessible actions and calls Load with zero graph arguments', async () => {
    const load = vi.fn()
    const step = vi.fn()
    const runToEnd = vi.fn()
    const reset = vi.fn()
    render(<ReplayControls controller={{ view: selectReplayView(readyReplay()), load, step, runToEnd, reset }} />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Load My Archipelago' }))
    expect(load).toHaveBeenCalledExactlyOnceWith()
    await user.click(screen.getByRole('button', { name: 'Step' }))
    await user.click(screen.getByRole('button', { name: 'Run to End' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(step).toHaveBeenCalledTimes(1)
    expect(runToEnd).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
  })

  it('disables actions from the derived initial availability', () => {
    const step = vi.fn()
    render(<ReplayControls controller={{ view: initialView(), load: vi.fn(), step, runToEnd: vi.fn(), reset: vi.fn() }} />)
    expect(screen.getByRole('button', { name: 'Load My Archipelago' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Step' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run to End' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Step' }))
    expect(step).not.toHaveBeenCalled()
  })
})
