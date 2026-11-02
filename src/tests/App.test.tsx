// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { StrictMode } from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AnalysisService } from '../application/AnalysisService'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { TarjanLowLinkAnalyzer } from '../domain/algorithms/TarjanLowLinkAnalyzer'
import { MAIN_GRAPH_ORACLE } from './fixtures/mainGraphOracle'
import { preparedGraph } from './helpers/replayFixtures'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

function setup() {
  const analyzer = new TarjanLowLinkAnalyzer()
  const analyze = vi.spyOn(analyzer, 'analyze')
  const service = new AnalysisService(analyzer)
  const prepare = vi.spyOn(service, 'prepare')
  render(<App analysisService={service} />)
  return { service, analyze, prepare }
}
function load() { fireEvent.click(screen.getByRole('button', { name: 'Load My Archipelago' })) }
function step() { fireEvent.click(screen.getByRole('button', { name: 'Step' })) }
function run() { fireEvent.click(screen.getByRole('button', { name: 'Run to End' })) }
function reset() { fireEvent.click(screen.getByRole('button', { name: 'Reset' })) }
function rows(table = screen.getByRole('table', { name: 'Island traversal values' }) as HTMLTableElement) {
  return [...table.rows].slice(1).map((row) => [...row.cells].map((cell) => cell.textContent))
}
function chips(testId: string) {
  return [...screen.getByTestId(testId).querySelectorAll('.finding-chip')].map((chip) => chip.textContent)
}

// These two integration cases render all 54 events. Keep a bounded budget
// for slower laptops while retaining every assertion; other tests use 5 s.
const FULL_REPLAY_TIMEOUT = 20_000

describe('App: complete inspection workflow', () => {
  it('shows the original unvisited map and accessible startup controls without analysis', () => {
    const { analyze, prepare } = setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Treasure-Island Bridge Safety Map' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Not inspected')
    expect(screen.getByRole('button', { name: 'Load My Archipelago' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Step' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run to End' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    expect(screen.getByTestId('map-landscape').querySelectorAll('.map-node')).toHaveLength(8)
    expect(rows().every((row) => row[3] === '—' && row[4] === '—' && row[5] === 'Unvisited')).toBe(true)
    expect(prepare).not.toHaveBeenCalled()
    expect(analyze).not.toHaveBeenCalled()
  })

  it('loads READY and steps through component start/discovery without revealing final values', () => {
    const { prepare, analyze } = setup()
    load()
    expect(screen.getByRole('status')).toHaveTextContent('Ready to inspect')
    expect(screen.getByText('Ready for the first step')).toBeInTheDocument()
    expect(screen.getByText('Event 0 / 54')).toBeInTheDocument()
    expect(screen.getByTestId('critical-bridges')).toHaveTextContent('Not inspected')
    step()
    expect(screen.getByTestId('component-count')).toHaveTextContent('1')
    expect(rows()[0][3]).toBe('—')
    expect(screen.getByRole('list', { name: 'Replayed inspection events' }).children).toHaveLength(1)
    step()
    expect(rows()[0].slice(2)).toEqual(['—', '0', '0', 'Active'])
    const map = screen.getByTestId('map-landscape')
    expect(within(map).getByTestId('island-A')).toHaveAttribute('data-current', 'true')
    expect(screen.getByText('Event 2 / 54')).toBeInTheDocument()
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('keeps every panel synchronized for all 54 events and demonstrates the three required proofs', () => {
    const expected = preparedGraph().result.events
    const { prepare, analyze } = setup()
    load()
    const seen = new Set<string>()
    const stateLabels = { UNVISITED: 'Unvisited', ACTIVE: 'Active', FINISHED: 'Finished' }
    // Resolve accessible containers once. Repeating whole-page role/name queries
    // across an ever-growing history made this test CPU-bound in jsdom.
    const stepButton = screen.getByRole('button', { name: 'Step' })
    const panel = screen.getByRole('region', { name: 'Current inspection event' })
    const table = screen.getByRole('table', { name: 'Island traversal values' }) as HTMLTableElement
    const map = screen.getByTestId('map-landscape')
    const bridges = screen.getByTestId('critical-bridges')
    const articulations = screen.getByTestId('articulation-islands')
    const count = screen.getByTestId('component-count')
    const history = screen.getByRole('region', { name: 'Inspection history' })
    for (const event of expected) {
      fireEvent.click(stepButton)
      expect(panel).toHaveAttribute('data-event-index', String(event.index))
      expect(panel).toHaveAttribute('data-event-type', event.type)
      expect(rows(table).map((row) => [row[0], row[2], row[3], row[4], row[5]])).toEqual(
        Object.entries(event.snapshot.nodes).map(([id, node]) => [
          id, node.parent ?? '—', node.discovery === null ? '—' : String(node.discovery),
          node.low === null ? '—' : String(node.low), stateLabels[node.status],
        ]),
      )
      expect(map.querySelector('.map-node[data-current="true"]')).toHaveAttribute('data-testid', `island-${event.focus.nodeId}`)
      expect(Object.fromEntries([...map.querySelectorAll('.map-edge')].map((edge) => [
        edge.getAttribute('data-testid')!.replace('bridge-', ''), edge.getAttribute('data-state'),
      ]))).toEqual(event.snapshot.edges)
      expect([...bridges.querySelectorAll('.finding-chip')].map((chip) => chip.textContent)).toEqual(event.snapshot.bridgeIds)
      expect([...articulations.querySelectorAll('.finding-chip')].map((chip) => chip.textContent)).toEqual(event.snapshot.articulationIds)
      expect(count).toHaveTextContent(String(event.snapshot.componentCount))
      expect(history.querySelectorAll('.history-list > li')).toHaveLength(event.index + 1)

      if (event.type === 'RETURN_CHILD' && event.details.nodeId === 'E' && event.details.childId === 'F') {
        expect(within(panel).getByText('4 → 3')).toBeInTheDocument()
        expect(rows(table).find((row) => row[0] === 'E')?.[4]).toBe('3')
        seen.add('FE')
      }
      if (event.type === 'CLASSIFY_EDGE' && event.details.edgeId === 'DE') {
        expect(within(panel).getByText('3 > 3 = false')).toBeInTheDocument()
        expect(map.querySelector('[data-testid="bridge-DE"]')).toHaveAttribute('data-state', 'TREE')
        expect(map.querySelector('[data-testid="island-D"]')).toHaveAttribute('data-articulation', 'false')
        seen.add('DE')
      }
      if (event.type === 'ARTICULATION' && event.details.nodeId === 'D') {
        expect(within(panel).getByText('3 ≥ 3 = true')).toBeInTheDocument()
        expect(map.querySelector('[data-testid="island-D"]')).toHaveAttribute('data-articulation', 'true')
        seen.add('D')
      }
    }
    expect([...seen].sort()).toEqual(['D', 'DE', 'FE'])
    expect(screen.getByRole('status')).toHaveTextContent('Inspection complete')
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
  }, FULL_REPLAY_TIMEOUT)

  it('runs from a partial inspection to the final reference table, findings, and retained history', () => {
    const { prepare, analyze } = setup()
    load()
    step()
    step()
    run()
    expect(screen.getByRole('status')).toHaveTextContent('Inspection complete')
    expect(chips('critical-bridges')).toEqual(['CD', 'EG', 'GH'])
    expect(chips('articulation-islands')).toEqual(['C', 'D', 'E', 'G'])
    expect(screen.getByTestId('component-count')).toHaveTextContent('1')
    expect(rows().map((row) => [row[0], row[2], row[3], row[4]])).toEqual(
      Object.entries(MAIN_GRAPH_ORACLE.nodes).map(([id, node]) => [id, node.parent ?? '—', String(node.discovery), String(node.low)]),
    )
    expect(screen.getByRole('list', { name: 'Replayed inspection events' }).children).toHaveLength(54)
    const summary = screen.getByRole('region', { name: 'Safety findings' })
    expect(within(summary).getByText('3 > 2 = true')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Step' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run to End' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled()
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('restores the original map, unset values, empty history, and startup controls on Reset', () => {
    const { prepare, analyze } = setup()
    const startupRows = rows()
    const map = screen.getByTestId('map-landscape')
    load()
    run()
    reset()
    expect(screen.getByRole('status')).toHaveTextContent('Not inspected')
    expect(rows()).toEqual(startupRows)
    expect(screen.queryByRole('list', { name: 'Replayed inspection events' })).not.toBeInTheDocument()
    expect(screen.getByText('Your inspection starts here')).toBeInTheDocument()
    expect([...map.querySelectorAll('.map-edge')].every((edge) => edge.getAttribute('data-state') === 'UNINSPECTED')).toBe(true)
    expect([...map.querySelectorAll('.map-node')].every((node) =>
      node.getAttribute('data-state') === 'UNVISITED' && node.getAttribute('data-current') === 'false' && node.getAttribute('data-articulation') === 'false',
    )).toBe(true)
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('reproduces identical visible histories, table values, and findings for stepped and complete runs', () => {
    const { analyze } = setup()
    load()
    const stepButton = screen.getByRole('button', { name: 'Step' })
    for (let index = 0; index < 54; index++) fireEvent.click(stepButton)
    const history = screen.getByRole('list', { name: 'Replayed inspection events' }).textContent
    const table = rows()
    const findings = screen.getByRole('region', { name: 'Safety findings' }).textContent
    reset()
    load()
    run()
    expect(screen.getByRole('list', { name: 'Replayed inspection events' }).textContent).toBe(history)
    expect(rows()).toEqual(table)
    expect(screen.getByRole('region', { name: 'Safety findings' }).textContent).toBe(findings)
    expect(analyze).toHaveBeenCalledTimes(2)
  }, FULL_REPLAY_TIMEOUT)

  it('supports keyboard Load, Step, Run, and Reset with native buttons', async () => {
    setup()
    const user = userEvent.setup()
    screen.getByRole('button', { name: 'Load My Archipelago' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Ready to inspect')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Step' })).toHaveFocus()
    await user.keyboard('[Space]')
    expect(screen.getByText('Event 1 / 54')).toBeInTheDocument()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Run to End' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Inspection complete')
    screen.getByRole('button', { name: 'Reset' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('status')).toHaveTextContent('Not inspected')
  })

  it('analyzes once per Load under StrictMode and never on rerender or navigation', () => {
    const analyzer = new TarjanLowLinkAnalyzer()
    const analyze = vi.spyOn(analyzer, 'analyze')
    const service = new AnalysisService(analyzer)
    const { rerender } = render(<StrictMode><App analysisService={service} /></StrictMode>)
    expect(analyze).not.toHaveBeenCalled()
    load()
    rerender(<StrictMode><App analysisService={service} /></StrictMode>)
    step()
    run()
    reset()
    expect(analyze).toHaveBeenCalledTimes(1)
  })
})

describe('App: printable summary', () => {
  it('enables printing only at completion and prints without changing history or invoking analysis', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const { prepare, analyze } = setup()
    const printButton = screen.getByRole('button', { name: 'Print summary' })
    expect(printButton).toBeDisabled()
    load()
    expect(printButton).toBeDisabled()
    step()
    expect(printButton).toBeDisabled()
    run()
    const history = screen.getByRole('list', { name: 'Replayed inspection events' }).textContent
    const table = rows()
    expect(printButton).toBeEnabled()
    fireEvent.click(printButton)
    expect(print).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('list', { name: 'Replayed inspection events' }).textContent).toBe(history)
    expect(rows()).toEqual(table)
    expect(screen.getByText('Event 54 / 54')).toBeInTheDocument()
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
    reset()
    expect(printButton).toBeDisabled()
    expect(screen.getByTestId('print-report').querySelector('table')).not.toBeInTheDocument()
  })

  it('supports keyboard printing and clears printable output after an invalid load', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const { prepare, analyze } = setup()
    load()
    run()
    const printButton = screen.getByRole('button', { name: 'Print summary' })
    printButton.focus()
    await userEvent.setup().keyboard('{Enter}')
    expect(print).toHaveBeenCalledTimes(1)
    const invalid = new AnalysisService(new TarjanLowLinkAnalyzer()).prepare(null)
    prepare.mockReturnValueOnce(invalid)
    load()
    expect(printButton).toBeDisabled()
    expect(screen.getByTestId('print-report')).toHaveTextContent('Final report unavailable')
    expect(screen.getByTestId('print-report').querySelector('table')).not.toBeInTheDocument()
    expect(analyze).toHaveBeenCalledTimes(1)
  })
})

describe('App: invalid load recovery without developer controls', () => {
  const cases = [
    {
      label: 'invalid coordinate',
      makeInput: () => {
        const graph = createFestivalArchipelago()
        return { ...graph, nodes: graph.nodes.map((node, index) => index === 0 ? { ...node, x: 101 } : node) }
      },
      path: 'nodes[0].x',
    },
    {
      label: 'duplicate node ID',
      makeInput: () => {
        const graph = createFestivalArchipelago()
        return { ...graph, nodes: [...graph.nodes, { ...graph.nodes[0] }] }
      },
      path: 'nodes[8].id',
    },
  ]

  it.each(cases)('clears completed output and recovers after $label', ({ makeInput, path }) => {
    const { prepare, analyze } = setup()
    load()
    run()
    const history = screen.getByRole('list', { name: 'Replayed inspection events' }).textContent
    const invalid = new AnalysisService(new TarjanLowLinkAnalyzer()).prepare(makeInput())
    expect(invalid.ok).toBe(false)
    prepare.mockReturnValueOnce(invalid)
    load()
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Map needs attention')
    expect(alert).toHaveTextContent(path)
    expect(alert).toHaveTextContent('A')
    expect(screen.getByRole('status')).toHaveTextContent('Check map input')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Replayed inspection events' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('critical-bridges')).not.toBeInTheDocument()
    expect(screen.queryByTestId('component-count')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Current inspection event' }).querySelector('.event-proof')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Step' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Run to End' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset' })).toBeEnabled()
    load()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Ready to inspect')
    run()
    expect(screen.getByRole('list', { name: 'Replayed inspection events' }).textContent).toBe(history)
    expect(prepare).toHaveBeenCalledTimes(3)
    expect(analyze).toHaveBeenCalledTimes(2)
  })
})
