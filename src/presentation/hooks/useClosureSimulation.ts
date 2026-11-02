import { useCallback, useMemo, useState } from 'react'
import type { Graph } from '../../domain/models/Graph'
import type { ClosureTarget } from '../../domain/models/ClosureSimulation'
import type { ReplayView } from '../../application/replaySelectors'
import { simulateClosure } from '../../application/simulateClosure'

export function useClosureSimulation(view: ReplayView) {
  const [selection, setSelection] = useState<{ graph: Graph; target: ClosureTarget } | null>(null)
  const graph = view.graph
  const enabled = view.status === 'COMPLETED' && graph !== null
  // Each successful load owns a new graph. Bind exploration to that run so
  // Reset, failure, and replacement loads never resurrect an old scenario.
  const simulation = useMemo(() => enabled && selection?.graph === graph
    ? simulateClosure(graph, selection.target) : null, [enabled, graph, selection])
  const selectClosure = useCallback((target: ClosureTarget | null) => {
    if (target === null) setSelection(null)
    else if (enabled) setSelection({ graph, target: { ...target } })
  }, [enabled, graph])
  return { simulation, selectClosure, enabled }
}
