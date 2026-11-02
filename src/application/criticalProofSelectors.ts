import type { ClosureTarget } from '../domain/models/ClosureSimulation'
import type { ReplayEvent } from '../domain/models/ReplayEvent'
import type { ReplayView } from './replaySelectors'

/** Only select proofs already reached and classified in the selected snapshot. */
export function selectCriticalProof(view: ReplayView, requested: ClosureTarget | null = null): ReplayEvent | null {
  const snapshot = view.snapshot
  if (!snapshot) return null
  const available = requested?.kind === 'EDGE' ? snapshot.bridgeIds.includes(requested.id)
    : requested?.kind === 'NODE' ? snapshot.articulationIds.includes(requested.id) : false
  const target = available ? requested : snapshot.bridgeIds[0] !== undefined
    ? { kind: 'EDGE' as const, id: snapshot.bridgeIds[0] }
    : snapshot.articulationIds[0] !== undefined ? { kind: 'NODE' as const, id: snapshot.articulationIds[0] } : null
  if (!target) return null
  return view.history.find(event => target.kind === 'EDGE'
    ? event.type === 'CLASSIFY_EDGE' && event.details.edgeId === target.id && event.details.isBridge
    : event.type === 'ARTICULATION' && event.details.nodeId === target.id) ?? null
}
