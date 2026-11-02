// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { replayReducer } from '../application/replayReducer'
import { selectReplayView } from '../application/replaySelectors'
import { PrintSafetySummary } from '../presentation/components/PrintSafetySummary'
import { MAIN_GRAPH_ORACLE } from './fixtures/mainGraphOracle'
import { graphFromConnections } from './helpers/graphFixtures'
import { completedReplay, failedReplay, readyReplay, stepTo } from './helpers/replayFixtures'

afterEach(cleanup)

describe('PrintSafetySummary', () => {
  it('prints the completed independent reference table and every recorded critical proof', () => {
    render(<PrintSafetySummary view={selectReplayView(completedReplay())} />)
    const report = screen.getByTestId('print-report')
    expect(report).not.toBeVisible()
    expect(report).toHaveTextContent('8 islands · 9 connections · 54 recorded events')
    expect(report.querySelectorAll('.print-totals dd')[0]).toHaveTextContent('1')
    expect(report.querySelectorAll('.print-totals dd')[1]).toHaveTextContent('CD, EG, GH')
    expect(report.querySelectorAll('.print-totals dd')[2]).toHaveTextContent('C, D, E, G')
    const rows = [...report.querySelectorAll('tbody tr')].map(row => [...row.children].map(cell => cell.textContent))
    expect(rows.map(row => [row[0], row[2], row[3], row[4]])).toEqual(
      Object.entries(MAIN_GRAPH_ORACLE.nodes).map(([id, node]) => [id, node.parent ?? '—', String(node.discovery), String(node.low)]),
    )
    expect(report.querySelectorAll('[data-proof-type="CLASSIFY_EDGE"]')).toHaveLength(3)
    expect(report.querySelectorAll('[data-proof-type="ARTICULATION"]')).toHaveLength(4)
    expect(report).toHaveTextContent('3 > 2 = true')
    expect(report).toHaveTextContent('6 > 4 = true')
    expect(report).toHaveTextContent('7 > 6 = true')
    expect(report).toHaveTextContent('3 ≥ 3 = true')
    expect(report.querySelectorAll('.proof-formula')).toHaveLength(7)
  })

  it.each(['EMPTY', 'READY', 'RUNNING'] as const)('prints an incomplete notice without leaking results in %s', status => {
    const ready = readyReplay()
    const state = status === 'EMPTY' ? replayReducer(ready, { type: 'RESET' })
      : status === 'RUNNING' ? stepTo(ready, 30) : ready
    render(<PrintSafetySummary view={selectReplayView(state)} />)
    const report = screen.getByTestId('print-report')
    expect(report).toHaveTextContent('Final report unavailable')
    expect(report.querySelector('table')).not.toBeInTheDocument()
    expect(report.querySelector('.print-totals')).not.toBeInTheDocument()
    expect(report.querySelector('[data-proof-type]')).not.toBeInTheDocument()
  })

  it('clears the printable final results after failure and after Reset', () => {
    const { rerender } = render(<PrintSafetySummary view={selectReplayView(completedReplay())} />)
    expect(screen.getByTestId('print-report').querySelector('table')).toBeInTheDocument()
    rerender(<PrintSafetySummary view={selectReplayView(failedReplay())} />)
    expect(screen.getByTestId('print-report')).toHaveTextContent('Final report unavailable')
    expect(screen.getByTestId('print-report').querySelector('table')).not.toBeInTheDocument()
    rerender(<PrintSafetySummary view={selectReplayView(replayReducer(completedReplay(), { type: 'RESET' }))} />)
    expect(screen.getByTestId('print-report').querySelector('[data-proof-type]')).not.toBeInTheDocument()
    expect(screen.getByTestId('print-report').querySelector('.print-totals')).not.toBeInTheDocument()
  })

  it('prints a completed cycle with no critical items and sorted island rows', () => {
    const graph = graphFromConnections(['C', 'B', 'A'], [['AB', 'A', 'B'], ['BC', 'B', 'C'], ['AC', 'A', 'C']])
    const state = replayReducer(readyReplay(graph), { type: 'RUN_TO_END' })
    render(<PrintSafetySummary view={selectReplayView(state)} />)
    const report = screen.getByTestId('print-report')
    expect(report).toHaveTextContent('3 islands · 3 connections')
    expect([...report.querySelectorAll('tbody th')].map(cell => cell.textContent)).toEqual(['A', 'B', 'C'])
    expect(report.querySelectorAll('[data-proof-type]')).toHaveLength(0)
    expect(report).toHaveTextContent('None. No single connection removal increases the component count.')
    expect(report).toHaveTextContent('None. No single island removal increases the component count.')
  })

  it('prints the recorded root child-count proof on a branching graph', () => {
    const graph = graphFromConnections(['C', 'A', 'B'], [['AC', 'A', 'C'], ['AB', 'A', 'B']])
    const state = replayReducer(readyReplay(graph), { type: 'RUN_TO_END' })
    render(<PrintSafetySummary view={selectReplayView(state)} />)
    const report = screen.getByTestId('print-report')
    expect(report).toHaveTextContent('Articulation island · A')
    expect(report).toHaveTextContent('2 ≥ 2 = true')
    expect(report).toHaveTextContent('Root A has at least two DFS-tree children.')
    expect(report.querySelectorAll('[data-proof-type="CLASSIFY_EDGE"]')).toHaveLength(2)
    expect(report.querySelectorAll('[data-proof-type="ARTICULATION"]')).toHaveLength(1)
  })
})
