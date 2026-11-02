import type { ReplayEvent } from '../../domain/models/ReplayEvent'

/** Format the recorded proof only; numerical decisions belong to the analyzer. */
export function EventProof({ event, compact = false }: { event: ReplayEvent; compact?: boolean }) {
  let label: string
  let formula: string
  let explanation: string

  switch (event.type) {
    case 'RETURN_CHILD':
      label = `Low update · ${event.details.nodeId}`
      formula = `${event.details.oldLow} → ${event.details.newLow}`
      explanation = `low[${event.details.nodeId}] = min(${event.details.oldLow}, low[${event.details.childId}] = ${event.details.childLow}) = ${event.details.newLow}`
      break
    case 'INSPECT_VISITED':
      label = `Low update · ${event.details.nodeId}`
      formula = `${event.details.oldLow} → ${event.details.newLow}`
      explanation = `low[${event.details.nodeId}] = min(${event.details.oldLow}, discovery[${event.details.neighborId}] = ${event.details.neighborDiscovery}) = ${event.details.newLow}`
      break
    case 'CLASSIFY_EDGE':
      label = event.details.isBridge ? `Critical bridge · ${event.details.edgeId}` : `Not a bridge · ${event.details.edgeId}`
      formula = `${event.details.childLow} > ${event.details.parentDiscovery} = ${event.details.isBridge}`
      explanation = `low[${event.details.childId}] > discovery[${event.details.nodeId}]`
      break
    case 'ARTICULATION':
      label = `Articulation island · ${event.details.nodeId}`
      if (event.details.rule === 'ROOT_CHILD_COUNT') {
        formula = `${event.details.childCount} ≥ 2 = true`
        explanation = `Root ${event.details.nodeId} has at least two DFS-tree children.`
      } else {
        formula = `${event.details.childLow} ≥ ${event.details.discovery} = true`
        explanation = `low[${event.details.childId}] ≥ discovery[${event.details.nodeId}]`
      }
      break
    case 'DISCOVER':
      label = `First visit · ${event.details.nodeId}`
      formula = `discovery = low = ${event.details.discovery}`
      explanation = `Parent: ${event.details.parentId ?? 'none (component root)'}`
      break
    case 'INSPECT_TREE':
      label = `Tree edge · ${event.details.edgeId}`
      formula = `DFS children of ${event.details.nodeId}: ${event.details.childCount}`
      explanation = `Next, discover ${event.details.neighborId}.`
      break
    case 'INSPECT_PARENT':
      label = `Parent connection · ${event.details.edgeId}`
      formula = `low[${event.details.nodeId}] stays ${event.details.low}`
      explanation = 'The parent connection does not provide an alternate route.'
      break
    case 'FINISH_NODE':
      label = `Island complete · ${event.details.nodeId}`
      formula = `discovery ${event.details.discovery} · low ${event.details.low}`
      explanation = event.details.isRoot
        ? `Root rule: ${event.details.childCount} ≥ 2 = ${event.details.isArticulation}`
        : `Articulation: ${event.details.isArticulation ? 'yes' : 'no'}`
      break
    case 'COMPONENT_START':
      label = `Component root · ${event.details.rootId}`
      formula = `Components: ${event.details.oldCount} → ${event.details.newCount}`
      explanation = 'The discovery clock continues across components.'
      break
    case 'COMPONENT_END':
      label = `Component complete · ${event.details.rootId}`
      formula = `Components: ${event.details.componentCount}`
      explanation = 'Every island in this component has been inspected.'
      break
  }

  return (
    <div className={`event-proof ${compact ? 'event-proof-compact' : ''}`} data-proof-type={event.type}>
      <span className="proof-label">{label}</span>
      <strong className="proof-formula">{formula}</strong>
      <span className="proof-explanation">{explanation}</span>
    </div>
  )
}
