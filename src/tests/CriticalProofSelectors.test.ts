import { describe, expect, it } from 'vitest'
import { selectCriticalProof } from '../application/criticalProofSelectors'
import { replayReducer } from '../application/replayReducer'
import { selectReplayView } from '../application/replaySelectors'
import { createExampleGraph } from '../data/createExampleGraph'
import { completedReplay, failedReplay, readyReplay, stepTo } from './helpers/replayFixtures'

describe('reached critical proofs', () => {
  it('defaults to the first sorted reached bridge and returns its exact recorded event', () => {
    const view=selectReplayView(completedReplay())
    const event=selectCriticalProof(view)
    expect(event).toBe(view.history.find(e=>e.type==='CLASSIFY_EDGE'&&e.details.edgeId==='CD'))
  })
  it('selects every final bridge and articulation, preserving event identity', () => {
    const view=selectReplayView(completedReplay())
    for(const id of ['CD','EG','GH']){
      const event=selectCriticalProof(view,{kind:'EDGE',id})
      expect(event).toBe(view.history.find(e=>e.type==='CLASSIFY_EDGE'&&e.details.edgeId===id))
    }
    for(const id of ['C','D','E','G']){
      expect(selectCriticalProof(view,{kind:'NODE',id})).toBe(view.history.find(e=>e.type==='ARTICULATION'&&e.details.nodeId===id))
    }
  })
  it('does not expose a prepared future proof before its event', () => {
    const ready=readyReplay()
    const event=ready.result!.events.find(e=>e.type==='CLASSIFY_EDGE'&&e.details.edgeId==='GH')!
    const before=selectReplayView(stepTo(ready,event.index-1))
    expect(selectCriticalProof(before,{kind:'EDGE',id:'GH'})).toBeNull()
    const reached=selectReplayView(stepTo(ready,event.index))
    expect(selectCriticalProof(reached,{kind:'EDGE',id:'CD'})).toBe(event)
  })
  it('falls back for unknown/non-critical targets without manufacturing a proof', () => {
    const view=selectReplayView(completedReplay())
    expect(selectCriticalProof(view,{kind:'EDGE',id:'DE'})).toBe(selectCriticalProof(view))
    expect(selectCriticalProof(view,{kind:'NODE',id:'A'})).toBe(selectCriticalProof(view))
  })
  it('returns null for READY, ERROR, Reset, and a completed cycle', () => {
    const cycle=replayReducer(readyReplay(createExampleGraph('CYCLE')),{type:'RUN_TO_END'})
    for(const state of [readyReplay(),failedReplay(),replayReducer(completedReplay(),{type:'RESET'}),cycle])
      expect(selectCriticalProof(selectReplayView(state))).toBeNull()
  })
})
