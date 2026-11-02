// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AnalysisService } from '../application/AnalysisService'
import { TarjanLowLinkAnalyzer } from '../domain/algorithms/TarjanLowLinkAnalyzer'
import { graphFromConnections } from './helpers/graphFixtures'

afterEach(()=>{cleanup();vi.restoreAllMocks()})
function setup(){
  const analyzer=new TarjanLowLinkAnalyzer()
  const analyze=vi.spyOn(analyzer,'analyze')
  const service=new AnalysisService(analyzer)
  const prepare=vi.spyOn(service,'prepare')
  render(<App analysisService={service}/>)
  return{analyze,prepare}
}
function click(name:string){fireEvent.click(screen.getByRole('button',{name}))}
function run(){click('Run to End')}
function load(){click('Load My Archipelago')}
function example(id:string){fireEvent.change(screen.getByRole('combobox',{name:'Load example graph'}),{target:{value:id}})}
function openClosures(){fireEvent.click(screen.getByText(/^What-if closure/))}
function close(value:string){fireEvent.change(screen.getByRole('combobox',{name:'Simulate closure'}),{target:{value}})}
function table(){return screen.getByRole('table',{name:'Island traversal values'}).textContent}
function history(){return screen.getByRole('list',{name:'Replayed inspection events'}).textContent}

describe('graph examples and closure exploration',()=>{
  it.each([
    ['CYCLE','3 islands · 3 bridges','None','None','1'],
    ['BRANCHING','3 islands · 2 bridges','ABAC','A','1'],
    ['DISCONNECTED','6 islands · 3 bridges','ABACDE','A','3'],
  ])('loads %s through the injected analysis path and resets to the original', (id,count,bridges,islands,components)=>{
    const {analyze}=setup()
    example(id)
    expect(screen.getByText(count)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Ready to inspect')
    expect(screen.getByRole('combobox',{name:'Load example graph'})).toHaveValue('')
    run()
    expect(screen.getByTestId('critical-bridges').textContent?.replaceAll(' ','')).toBe(bridges)
    expect(screen.getByTestId('articulation-islands').textContent?.replaceAll(' ','')).toBe(islands)
    expect(screen.getByTestId('component-count')).toHaveTextContent(components)
    expect(analyze).toHaveBeenCalledTimes(1)
    click('Reset')
    expect(screen.getByText('8 islands · 9 bridges')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Not inspected')
    expect(screen.queryByRole('list',{name:'Replayed inspection events'})).not.toBeInTheDocument()
    load();run()
    expect(screen.getByTestId('critical-bridges')).toHaveTextContent('CDEGGH')
    expect(analyze).toHaveBeenCalledTimes(2)
  })
  it('keeps closure controls unavailable until completion',()=>{
    setup();openClosures()
    expect(screen.getByRole('combobox',{name:'Simulate closure'})).toBeDisabled()
    load();openClosures()
    expect(screen.getByRole('combobox',{name:'Simulate closure'})).toBeDisabled()
    click('Step')
    expect(screen.getByRole('combobox',{name:'Simulate closure'})).toBeDisabled()
    run()
    expect(screen.getByRole('combobox',{name:'Simulate closure'})).toBeEnabled()
  })
  it('compares CD, DE, and D without changing the replay, summary, printing, or analysis count',()=>{
    const {analyze,prepare}=setup();load();run()
    const originalTable=table(), originalHistory=history()
    const printReport=screen.getByTestId('print-report').textContent
    openClosures();close('EDGE:CD')
    expect(screen.getByTestId('closure-count')).toHaveTextContent('1 → 2')
    expect(screen.getByRole('list',{name:'Surviving components'})).toHaveTextContent('Component 1: A, B, C')
    expect(screen.getByRole('list',{name:'Surviving components'})).toHaveTextContent('Component 2: D, E, F, G, H')
    const map=screen.getByTestId('map-landscape')
    expect(within(map).getByTestId('bridge-CD')).toHaveAttribute('data-closed','true')
    expect(within(map).getByTestId('island-A')).toHaveAttribute('data-component','0')
    expect(within(map).getByTestId('island-D')).toHaveAttribute('data-component','1')
    close('EDGE:DE')
    expect(screen.getByTestId('closure-count')).toHaveTextContent('1 → 1')
    expect(within(map).getByTestId('bridge-CD')).toHaveAttribute('data-closed','false')
    close('NODE:D')
    expect(screen.getByTestId('closure-count')).toHaveTextContent('1 → 2')
    expect(within(map).getByTestId('island-D')).toHaveAttribute('data-closed','true')
    for(const id of ['CD','DE','DF'])expect(within(map).getByTestId('bridge-'+id)).toHaveAttribute('data-closed','true')
    expect(screen.getByTestId('component-count')).toHaveTextContent('1')
    expect(screen.getByText('Event 54 / 54')).toBeInTheDocument()
    expect(table()).toBe(originalTable)
    expect(history()).toBe(originalHistory)
    expect(screen.getByTestId('print-report').textContent).toBe(printReport)
    expect(analyze).toHaveBeenCalledTimes(1)
    expect(prepare).toHaveBeenCalledTimes(1)
    click('Clear simulation')
    expect(map.querySelectorAll('[data-closed="true"]')).toHaveLength(0)
    expect(map.querySelectorAll('[data-component]')).toHaveLength(0)
  })
  it('clears exploration on Reset, replacement load, and failure without resurrecting an old scenario',()=>{
    const {prepare,analyze}=setup();load();run();openClosures();close('NODE:D')
    click('Reset')
    expect(screen.queryByTestId('closure-count')).not.toBeInTheDocument()
    expect(screen.getByText(/^What-if closure/).closest('details')).not.toHaveAttribute('open')
    load();run();openClosures()
    expect(screen.getByRole('combobox',{name:'Simulate closure'})).toHaveValue('')
    close('EDGE:CD');example('CYCLE');run();openClosures()
    expect(screen.getByRole('combobox',{name:'Simulate closure'})).toHaveValue('')
    const invalid=new AnalysisService(new TarjanLowLinkAnalyzer()).prepare(null)
    prepare.mockReturnValueOnce(invalid);load()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByTestId('closure-count')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    load();run();openClosures()
    expect(screen.getByRole('combobox',{name:'Simulate closure'})).toHaveValue('')
    expect(analyze).toHaveBeenCalledTimes(4)
  })
  it('selects any reached proof using the keyboard without moving replay',async()=>{
    const {analyze}=setup();load();run()
    const originalTable=table(),originalHistory=history()
    screen.getByRole('button',{name:'Explain articulation island D'}).focus()
    await userEvent.setup().keyboard('{Enter}')
    const summary=screen.getByRole('region',{name:'Safety findings'})
    expect(within(summary).getByText('3 ≥ 3 = true')).toBeInTheDocument()
    expect(within(summary).getByText('Recorded event 40')).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'Explain articulation island D'})).toHaveAttribute('aria-pressed','true')
    click('Explain critical bridge EG')
    expect(within(summary).getByText('6 > 4 = true')).toBeInTheDocument()
    expect(screen.getByRole('button',{name:'Explain critical bridge EG'})).toHaveAttribute('aria-pressed','true')
    expect(table()).toBe(originalTable);expect(history()).toBe(originalHistory)
    expect(screen.getByText('Event 54 / 54')).toBeInTheDocument()
    expect(analyze).toHaveBeenCalledTimes(1)
    click('Reset');load();run()
    expect(screen.getByRole('button',{name:'Explain critical bridge CD'})).toHaveAttribute('aria-pressed','true')
  })
  it('uses native keyboard controls for examples and Escape closes exploration',async()=>{
    setup()
    const user=userEvent.setup()
    screen.getByRole('combobox',{name:'Load example graph'}).focus()
    await user.selectOptions(screen.getByRole('combobox',{name:'Load example graph'}),'BRANCHING')
    run()
    openClosures()
    const select=screen.getByRole('combobox',{name:'Simulate closure'})
    await user.selectOptions(select,'NODE:A')
    expect(screen.getByTestId('closure-count')).toHaveTextContent('1 → 2')
    await user.keyboard('{Escape}')
    expect(screen.getByText(/^What-if closure/).closest('details')).not.toHaveAttribute('open')
    expect(screen.getByText(/^What-if closure/)).toHaveFocus()
  })
  it('restores a supplied original demo after using a catalog example without mutating caller data',()=>{
    const original=graphFromConnections(['HOME','N'],[['LINK','HOME','N']])
    const before=JSON.stringify(original)
    render(<App originalDemoGraph={original}/>)
    example('CYCLE');run();click('Reset')
    expect(screen.getByText('2 islands · 1 bridges')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Not inspected')
    load();run()
    expect(screen.getByTestId('critical-bridges')).toHaveTextContent('LINK')
    expect(screen.getByTestId('component-count')).toHaveTextContent('1')
    expect(JSON.stringify(original)).toBe(before)
  })
})
