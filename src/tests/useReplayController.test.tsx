// @vitest-environment jsdom
import { StrictMode } from 'react'
import type { PropsWithChildren } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnalysisService } from '../application/AnalysisService'
import { createFestivalArchipelago } from '../data/createFestivalArchipelago'
import { TarjanLowLinkAnalyzer } from '../domain/algorithms/TarjanLowLinkAnalyzer'
import { useReplayController } from '../presentation/hooks/useReplayController'
import { MAIN_GRAPH_ORACLE } from './fixtures/mainGraphOracle'
import { graphFromConnections } from './helpers/graphFixtures'
import { preparedGraph } from './helpers/replayFixtures'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function services() {
  const analyzer = new TarjanLowLinkAnalyzer()
  const analyze = vi.spyOn(analyzer, 'analyze')
  const service = new AnalysisService(analyzer)
  const prepare = vi.spyOn(service, 'prepare')
  return { service, prepare, analyze }
}

function StrictWrapper({ children }: PropsWithChildren) {
  return <StrictMode>{children}</StrictMode>
}

describe('useReplayController: load and stored-history navigation', () => {
  it('initializes the original EMPTY preview without preparing or analyzing a graph', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    expect(result.current.view.status).toBe('EMPTY')
    expect(result.current.view.graph).toEqual(createFestivalArchipelago())
    expect(result.current.view.snapshot?.nodes.A.discovery).toBeNull()
    expect(result.current.view.history).toEqual([])
    expect(result.current.view.progress).toEqual({ completedEvents: 0, totalEvents: 0 })
    expect(prepare).not.toHaveBeenCalled()
    expect(analyze).not.toHaveBeenCalled()
  })

  it('loads the original graph exactly once and shows READY without leaking final results', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    act(() => result.current.load())
    expect(prepare).toHaveBeenCalledExactlyOnceWith(createFestivalArchipelago())
    expect(analyze).toHaveBeenCalledTimes(1)
    expect(result.current.view.status).toBe('READY')
    expect(result.current.view.eventIndex).toBe(-1)
    expect(result.current.view.snapshot?.nodes.B.discovery).toBeNull()
    expect(result.current.view.snapshot?.bridgeIds).toEqual([])
    expect(result.current.view.snapshot?.articulationIds).toEqual([])
    expect(result.current.view.history).toEqual([])
    expect(result.current.view.progress).toEqual({ completedEvents: 0, totalEvents: 54 })
  })

  it('advances exactly one recorded event per Step without preparing or analyzing again', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    act(() => result.current.load())
    for (let index = 0; index < 54; index++) {
      act(() => result.current.step())
      expect(result.current.view.eventIndex).toBe(index)
      expect(result.current.view.currentEvent?.index).toBe(index)
      expect(result.current.view.history).toHaveLength(index + 1)
      expect(result.current.view.status).toBe(index === 53 ? 'COMPLETED' : 'RUNNING')
    }
    expect(result.current.view.snapshot?.nodes).toMatchObject(MAIN_GRAPH_ORACLE.nodes)
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('runs from READY to the complete retained history without a second DFS', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    act(() => result.current.load())
    act(() => result.current.runToEnd())
    expect(result.current.view.status).toBe('COMPLETED')
    expect(result.current.view.currentEvent?.type).toBe('COMPONENT_END')
    expect(result.current.view.progress).toEqual({ completedEvents: 54, totalEvents: 54 })
    expect(result.current.view.history).toHaveLength(54)
    expect(result.current.view.snapshot).toBe(result.current.view.history.at(-1)?.snapshot)
    expect(result.current.view.snapshot?.bridgeIds).toEqual(['CD', 'EG', 'GH'])
    expect(result.current.view.snapshot?.articulationIds).toEqual(['C', 'D', 'E', 'G'])
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('runs from a partial replay using the already prepared history', () => {
    const { service, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    act(() => result.current.load())
    act(() => { result.current.step(); result.current.step() })
    const firstEvent = result.current.view.history[0]
    expect(result.current.view.eventIndex).toBe(1)
    act(() => result.current.runToEnd())
    expect(result.current.view.history[0]).toBe(firstEvent)
    expect(result.current.view.eventIndex).toBe(53)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('processes batched load and Step actions in order without a stale cursor', () => {
    const { service, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    act(() => {
      result.current.load()
      result.current.step()
      result.current.step()
      result.current.step()
    })
    expect(result.current.view.status).toBe('RUNNING')
    expect(result.current.view.eventIndex).toBe(2)
    expect(result.current.view.history).toHaveLength(3)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('keeps invalid-state and repeated completion actions harmless', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    const initial = result.current.view
    act(() => { result.current.step(); result.current.runToEnd(); result.current.reset() })
    expect(result.current.view).toBe(initial)
    expect(prepare).not.toHaveBeenCalled()
    act(() => { result.current.load(); result.current.runToEnd() })
    const completed = result.current.view
    act(() => { result.current.step(); result.current.step(); result.current.runToEnd() })
    expect(result.current.view).toBe(completed)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('restores the exact startup view after completion and repeated Reset without analysis', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    const startup = result.current.view
    act(() => { result.current.load(); result.current.runToEnd() })
    act(() => result.current.reset())
    expect(result.current.view).toEqual(startup)
    expect(result.current.view.snapshot).toBe(startup.snapshot)
    expect(result.current.view.graph).toBe(startup.graph)
    const reset = result.current.view
    act(() => { result.current.reset(); result.current.reset() })
    expect(result.current.view).toBe(reset)
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('keeps callbacks and the selected view stable on ordinary rerenders', () => {
    const { service, prepare, analyze } = services()
    const { result, rerender } = renderHook(() => useReplayController(service))
    act(() => result.current.load())
    const controller = result.current
    rerender()
    rerender()
    expect(result.current).toBe(controller)
    expect(result.current.view).toBe(controller.view)
    expect(result.current.load).toBe(controller.load)
    expect(result.current.step).toBe(controller.step)
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('is pure under StrictMode and analyzes once per explicit load', () => {
    const { service, prepare, analyze } = services()
    const { result, rerender } = renderHook(() => useReplayController(service), { wrapper: StrictWrapper })
    const startup = result.current.view
    expect(analyze).not.toHaveBeenCalled()
    act(() => result.current.load())
    expect(result.current.view.eventIndex).toBe(-1)
    act(() => result.current.step())
    expect(result.current.view.eventIndex).toBe(0)
    act(() => result.current.runToEnd())
    expect(result.current.view.eventIndex).toBe(53)
    rerender()
    act(() => result.current.reset())
    expect(result.current.view).toEqual(startup)
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(analyze).toHaveBeenCalledTimes(1)
    act(() => result.current.load())
    expect(prepare).toHaveBeenCalledTimes(2)
    expect(analyze).toHaveBeenCalledTimes(2)
  })
})

describe('useReplayController: invalid loads and recovery', () => {
  it('recovers through valid -> invalid -> valid without old history or errors', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    act(() => { result.current.load(); result.current.runToEnd() })
    const history = JSON.stringify(result.current.view.history)
    act(() => result.current.load(null))
    expect(result.current.view.status).toBe('ERROR')
    expect(result.current.view.graph).toBeNull()
    expect(result.current.view.snapshot).toBeNull()
    expect(result.current.view.history).toEqual([])
    act(() => result.current.load())
    expect(result.current.view.status).toBe('READY')
    expect(result.current.view.errors).toEqual([])
    expect(result.current.view.eventIndex).toBe(-1)
    expect(result.current.view.snapshot?.nodes.A.discovery).toBeNull()
    act(() => result.current.runToEnd())
    expect(JSON.stringify(result.current.view.history)).toBe(history)
    expect(prepare).toHaveBeenCalledTimes(3)
    expect(analyze).toHaveBeenCalledTimes(2)
  })

  const invalidInputs = [
    {
      label: 'out-of-range coordinate',
      code: 'INVALID_COORDINATE',
      makeInput: () => {
        const graph = createFestivalArchipelago()
        return { ...graph, nodes: graph.nodes.map((node, index) => index === 0 ? { ...node, x: 101 } : node) }
      },
    },
    {
      label: 'duplicate node ID',
      code: 'DUPLICATE_NODE_ID',
      makeInput: () => {
        const graph = createFestivalArchipelago()
        return { ...graph, nodes: [...graph.nodes, { ...graph.nodes[0] }] }
      },
    },
  ]

  it.each(invalidInputs)('clears all completed visible output on $label', ({ makeInput, code }) => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    const startup = result.current.view
    act(() => { result.current.load(); result.current.runToEnd() })
    expect(result.current.view.snapshot?.bridgeIds).toEqual(['CD', 'EG', 'GH'])
    act(() => result.current.load(makeInput()))
    const error = result.current.view
    expect(error.status).toBe('ERROR')
    expect(error.graph).toBeNull()
    expect(error.snapshot).toBeNull()
    expect(error.currentEvent).toBeNull()
    expect(error.focus).toBeNull()
    expect(error.history).toEqual([])
    expect(error.eventIndex).toBe(-1)
    expect(error.progress).toEqual({ completedEvents: 0, totalEvents: 0 })
    expect(error.errors).toContainEqual(expect.objectContaining({ code, nodeId: 'A' }))
    expect(error.controls).toEqual({ canLoad: true, canReset: true, canStep: false, canRunToEnd: false })
    act(() => { result.current.step(); result.current.runToEnd() })
    expect(result.current.view).toBe(error)
    act(() => result.current.reset())
    expect(result.current.view).toEqual(startup)
    expect(prepare).toHaveBeenCalledTimes(2)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('validates an explicitly supplied undefined instead of treating it as no argument', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    act(() => result.current.load(undefined))
    expect(result.current.view.status).toBe('ERROR')
    expect(result.current.view.errors[0].code).toBe('INVALID_GRAPH')
    expect(prepare).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(analyze).not.toHaveBeenCalled()
  })

  it('propagates unexpected service exceptions without corrupting the committed view', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    act(() => { result.current.load(); result.current.runToEnd() })
    const previous = result.current.view
    const error = new Error('Unexpected strategy failure')
    prepare.mockImplementationOnce(() => { throw error })
    expect(() => act(() => result.current.load())).toThrow(error)
    expect(result.current.view).toBe(previous)
    expect(result.current.view.errors).toEqual([])
    expect(analyze).toHaveBeenCalledTimes(1)
  })
})

describe('useReplayController: original graph ownership and reproducibility', () => {
  it('restores the original demo after a custom graph and loads that original by default', () => {
    const { service, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    const original = result.current.view
    const custom = graphFromConnections(['Z'])
    act(() => { result.current.load(custom); result.current.runToEnd() })
    expect(result.current.view.graph).toEqual(custom)
    expect(result.current.view.history).toHaveLength(4)
    act(() => result.current.reset())
    expect(result.current.view).toEqual(original)
    act(() => result.current.load())
    expect(result.current.view.graph).toEqual(createFestivalArchipelago())
    expect(result.current.view.progress.totalEvents).toBe(54)
    expect(analyze).toHaveBeenCalledTimes(2)
  })

  it('captures independent original values without freezing caller-owned props', () => {
    const { service, analyze } = services()
    const original = createFestivalArchipelago()
    const { result } = renderHook(() => useReplayController(service, original), { wrapper: StrictWrapper })
    const startup = result.current.view
    expect(Object.isFrozen(original)).toBe(false)
    expect(Reflect.set(original.nodes[0], 'x', 99)).toBe(true)
    expect(Reflect.set(original.edges[0], 'target', 'Z')).toBe(true)
    expect(result.current.view.graph?.nodes[0].x).toBe(12)
    expect(result.current.view.graph?.edges[0].target).toBe('B')
    act(() => result.current.load())
    expect(result.current.view.status).toBe('READY')
    act(() => result.current.reset())
    expect(result.current.view).toEqual(startup)
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('preserves the original demo for the controller lifetime when props change', () => {
    const { service, prepare, analyze } = services()
    const original = createFestivalArchipelago()
    const { result, rerender } = renderHook(
      ({ demo }) => useReplayController(service, demo),
      { initialProps: { demo: original } },
    )
    const startup = result.current.view
    rerender({ demo: graphFromConnections(['Z']) })
    expect(result.current.view).toBe(startup)
    expect(prepare).not.toHaveBeenCalled()
    act(() => result.current.load())
    expect(result.current.view.graph).toEqual(createFestivalArchipelago())
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('owns a successful graph before queued React actions run', () => {
    const { service, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    const graph = graphFromConnections(['Z'])
    act(() => {
      result.current.load(graph)
      Reflect.set(graph.nodes[0], 'id', 'EDITED')
      Reflect.set(graph.nodes[0], 'name', 'Caller changed this')
      result.current.step()
    })
    expect(result.current.view.graph?.nodes[0].id).toBe('Z')
    expect(result.current.view.graph?.nodes[0].name).toBe('Island Z')
    expect(result.current.view.focus?.nodeId).toBe('Z')
    expect(Object.keys(result.current.view.snapshot?.nodes ?? {})).toEqual(['Z'])
    expect(analyze).toHaveBeenCalledTimes(1)
  })

  it('accepts a narrow injected prepare service without constructing an analyzer in the hook', () => {
    const prepared = preparedGraph()
    const prepare = vi.fn(() => prepared)
    const { result } = renderHook(() => useReplayController({ prepare }))
    expect(prepare).not.toHaveBeenCalled()
    act(() => result.current.load())
    expect(prepare).toHaveBeenCalledTimes(1)
    expect(result.current.view.status).toBe('READY')
    expect(result.current.view.snapshot).toBe(prepared.result.initialSnapshot)
  })

  it('uses a replacement injected service only on the next explicit load', () => {
    const first = services()
    const second = services()
    const { result, rerender } = renderHook(
      ({ service }) => useReplayController(service),
      { initialProps: { service: first.service } },
    )
    act(() => result.current.load())
    const previous = result.current.view
    rerender({ service: second.service })
    expect(result.current.view).toBe(previous)
    expect(second.prepare).not.toHaveBeenCalled()
    act(() => result.current.load())
    expect(first.analyze).toHaveBeenCalledTimes(1)
    expect(second.analyze).toHaveBeenCalledTimes(1)
    expect(result.current.view.status).toBe('READY')
    expect(result.current.view.eventIndex).toBe(-1)
  })

  it('reproduces identical histories/results across Reset, stepped, and complete runs', () => {
    const { service, prepare, analyze } = services()
    const { result } = renderHook(() => useReplayController(service))
    const startup = result.current.view
    act(() => result.current.load())
    for (let index = 0; index < 54; index++) act(() => result.current.step())
    const history = result.current.view.history
    const serialized = JSON.stringify(history)
    const finalSnapshot = JSON.stringify(result.current.view.snapshot)

    for (let run = 0; run < 2; run++) {
      act(() => result.current.reset())
      expect(result.current.view).toEqual(startup)
      act(() => { result.current.load(); result.current.runToEnd() })
      expect(JSON.stringify(result.current.view.history)).toBe(serialized)
      expect(JSON.stringify(result.current.view.snapshot)).toBe(finalSnapshot)
      expect(result.current.view.history).not.toBe(history)
    }
    expect(prepare).toHaveBeenCalledTimes(3)
    expect(analyze).toHaveBeenCalledTimes(3)
  })
})
