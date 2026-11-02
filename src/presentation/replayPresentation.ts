import type { ReplayStatus } from '../application/ReplayState'
import type { EventType } from '../domain/models/ReplayEvent'

export const statusLabels: Record<ReplayStatus, string> = {
  EMPTY: 'Not inspected',
  READY: 'Ready to inspect',
  RUNNING: 'Inspection in progress',
  COMPLETED: 'Inspection complete',
  ERROR: 'Check map input',
}

export const eventTitles: Record<EventType, string> = {
  COMPONENT_START: 'Start a component',
  DISCOVER: 'Discover an island',
  INSPECT_TREE: 'Follow a tree edge',
  INSPECT_PARENT: 'Skip the parent connection',
  INSPECT_VISITED: 'Inspect an alternate connection',
  RETURN_CHILD: 'Return from a child',
  CLASSIFY_EDGE: 'Check a bridge',
  ARTICULATION: 'Mark an articulation island',
  FINISH_NODE: 'Finish an island',
  COMPONENT_END: 'Complete a component',
}
