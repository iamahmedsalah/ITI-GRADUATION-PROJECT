import { MarkerType, type Edge, type Node } from '@xyflow/react'
import type { RoadmapStep, StepNodeData, StepStatus } from '../types/roadmap'

/**
 * Builds a resolved dependency map so we can check
 * whether all deps of a step are completed.
 */
export function buildProgressMap(stepProgress: { stepKey: string; status: StepStatus }[]) {
  return new Map(stepProgress.map((p) => [p.stepKey, p.status]))
}

function getCompletedDepsStatus(
  step: RoadmapStep,
  progressMap: Map<string, StepStatus>,
  knownKeys: Set<string>,
): boolean {
  if (!step.dependsOn?.length) return true
  return step.dependsOn
    .filter((d) => knownKeys.has(d))
    .every((d) => progressMap.get(d) === 'completed')
}

/**
 * Improved graph builder:
 * - Vertical trunk for the main critical path
 * - Alternating side branches for non-milestone steps
 * - Consistent spacing and centred layout
 */
export function createGraph(
  steps: RoadmapStep[],
  selectedStepKey: string,
  progressMap: Map<string, StepStatus>,
  onSelect: (stepKey: string) => void,
  lockDependencies = true,
): { nodes: Node<StepNodeData>[]; edges: Edge[] } {
  const NODE_HEIGHT = 60
  const ROW_GAP = 100       // vertical gap between rows
  const BRANCH_OFFSET = 280 // horizontal offset for side branches

  const knownKeys = new Set(steps.map((s) => s.stepKey))

  /**
   * Layout strategy:
   * - Even indices (0, 2, 4…) → center column (x = 0)
   * - Odd indices alternating left/right
   * This creates a zigzag flow that's easy to follow.
   */
  const nodes: Node<StepNodeData>[] = steps.map((step, index) => {
    const isCenter = index % 3 === 0
    const side = index % 2 === 0 ? -1 : 1
    const x = isCenter ? 0 : side * BRANCH_OFFSET

    return {
      id: step.stepKey,
      type: 'roadmapStep',
      position: { x, y: index * (NODE_HEIGHT + ROW_GAP) },
      data: {
        step,
        selected: step.stepKey === selectedStepKey,
        status: progressMap.get(step.stepKey) ?? 'notStarted',
        isLocked: lockDependencies && !getCompletedDepsStatus(step, progressMap, knownKeys),
        completedDeps: getCompletedDepsStatus(step, progressMap, knownKeys),
        onSelect,
      },
    }
  })

  const edges: Edge[] = steps.flatMap((step, index) => {
    const deps = step.dependsOn?.filter((d) => knownKeys.has(d)) ?? []
    const sources = deps.length > 0 ? deps : index > 0 ? [steps[index - 1].stepKey] : []
    const isSelected =
      step.stepKey === selectedStepKey || sources.includes(selectedStepKey)
    const stepStatus = progressMap.get(step.stepKey) ?? 'notStarted'
    const isDone = stepStatus === 'completed'

    return sources.map((source) => {
      const sourceStatus = progressMap.get(source) ?? 'notStarted'
      const edgeDone = sourceStatus === 'completed' && isDone

      return {
        id: `${source}->${step.stepKey}`,
        source,
        target: step.stepKey,
        type: 'smoothstep',
        animated: isSelected && !edgeDone,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: edgeDone
            ? 'var(--gd-primary)'
            : isSelected
              ? 'var(--accent-border)'
              : 'var(--border)',
        },
        style: {
          stroke: edgeDone
            ? 'var(--gd-primary)'
            : isSelected
              ? 'var(--accent-border)'
              : 'var(--border)',
          strokeWidth: isSelected ? 2.5 : 1.5,
          strokeDasharray: deps.length ? '6 4' : undefined,
          opacity: isSelected ? 1 : 0.6,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        },
      }
    })
  })

  return { nodes, edges }
}

export function normalizeSteps(template: { steps?: RoadmapStep[] }) {
  const steps = [...(template.steps ?? [])]
  return steps.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function calculateProgress(
  steps: RoadmapStep[],
  progressMap: Map<string, StepStatus>,
  enrolledProgressPercent?: number,
) {
  if (typeof enrolledProgressPercent === 'number') {
    return Math.round(enrolledProgressPercent)
  }
  if (!steps.length) return 0
  const completed = steps.filter((s) => progressMap.get(s.stepKey) === 'completed').length
  return Math.round((completed / steps.length) * 100)
}
