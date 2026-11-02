import type { TraversalSnapshot } from './TraversalSnapshot'

export interface EventFocus {
  readonly nodeId: string
  readonly edgeId?: string
  readonly relatedNodeId?: string
}

interface ConnectionDetails {
  readonly nodeId: string
  readonly neighborId: string
  readonly edgeId: string
}

type ArticulationProof =
  | {
      readonly rule: 'NON_ROOT_LOW'
      readonly nodeId: string
      readonly childId: string
      readonly childLow: number
      readonly discovery: number
    }
  | {
      readonly rule: 'ROOT_CHILD_COUNT'
      readonly nodeId: string
      readonly childCount: number
    }

type EventPayload =
  | {
      readonly type: 'COMPONENT_START'
      readonly details: { readonly rootId: string; readonly oldCount: number; readonly newCount: number }
    }
  | {
      readonly type: 'DISCOVER'
      readonly details: {
        readonly nodeId: string
        readonly parentId: string | null
        readonly discovery: number
        readonly low: number
      }
    }
  | {
      readonly type: 'INSPECT_TREE'
      readonly details: ConnectionDetails & { readonly childCount: number }
    }
  | {
      readonly type: 'INSPECT_PARENT'
      readonly details: ConnectionDetails & { readonly low: number }
    }
  | {
      readonly type: 'INSPECT_VISITED'
      readonly details: ConnectionDetails & {
        readonly oldLow: number
        readonly newLow: number
        readonly neighborDiscovery: number
      }
    }
  | {
      readonly type: 'RETURN_CHILD'
      readonly details: {
        readonly nodeId: string
        readonly childId: string
        readonly edgeId: string
        readonly oldLow: number
        readonly newLow: number
        readonly childLow: number
      }
    }
  | {
      readonly type: 'CLASSIFY_EDGE'
      readonly details: {
        readonly nodeId: string
        readonly childId: string
        readonly edgeId: string
        readonly parentDiscovery: number
        readonly childLow: number
        readonly isBridge: boolean
        readonly parentIsRoot: boolean
        /** Root articulation is evaluated after all root children finish. */
        readonly nonRootArticulation: boolean | null
      }
    }
  | { readonly type: 'ARTICULATION'; readonly details: ArticulationProof }
  | {
      readonly type: 'FINISH_NODE'
      readonly details: {
        readonly nodeId: string
        readonly discovery: number
        readonly low: number
        readonly childCount: number
        readonly isRoot: boolean
        readonly isArticulation: boolean
      }
    }
  | {
      readonly type: 'COMPONENT_END'
      readonly details: { readonly rootId: string; readonly componentCount: number }
    }

/** Every payload field is primitive; focus and payload objects are frozen at emission. */
export type ReplayEventDescription = EventPayload & {
  readonly focus: EventFocus
  readonly message: string
}

export type ReplayEvent = ReplayEventDescription & {
  readonly index: number
  readonly snapshot: TraversalSnapshot
}

export type EventType = ReplayEvent['type']
