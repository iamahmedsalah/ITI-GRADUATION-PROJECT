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

function getNodePosition(index: number, totalSteps: number) {
  const NODE_HEIGHT = 60

  if (totalSteps >= 25) {
    const columns =
      totalSteps >= 500
        ? 10
        : totalSteps >= 250
          ? 8
          : totalSteps >= 120
            ? 6
            : totalSteps >= 90
              ? 4
              : totalSteps >= 50
                ? 3
                : 2
    const COLUMN_GAP = totalSteps >= 250 ? 290 : 320
    const ROW_GAP = totalSteps >= 250 ? 105 : 120
    const row = Math.floor(index / columns)
    const rawColumn = index % columns
    const column = row % 2 === 0 ? rawColumn : columns - 1 - rawColumn

    return {
      x: (column - (columns - 1) / 2) * COLUMN_GAP,
      y: row * ROW_GAP,
    }
  }

  const ROW_GAP = 100
  const BRANCH_OFFSET = 280
  const isCenter = index % 3 === 0
  const side = index % 2 === 0 ? -1 : 1

  return {
    x: isCenter ? 0 : side * BRANCH_OFFSET,
    y: index * (NODE_HEIGHT + ROW_GAP),
  }
}

/**
 * Improved graph builder:
 * - Compact multi-column layout for large imported roadmaps
 * - Zigzag path for smaller roadmaps
 * - Dependency-aware step order before positioning
 */
export function createGraph(
  steps: RoadmapStep[],
  selectedStepKey: string,
  progressMap: Map<string, StepStatus>,
  onSelect: (stepKey: string) => void,
  lockDependencies = true,
): { nodes: Node<StepNodeData>[]; edges: Edge[] } {
  const knownKeys = new Set(steps.map((s) => s.stepKey))

  /**
   * Layout strategy:
   * - Even indices (0, 2, 4…) → center column (x = 0)
   * - Odd indices alternating left/right
   * This creates a zigzag flow that's easy to follow.
   */
  const nodes: Node<StepNodeData>[] = steps.map((step, index) => {
    return {
      id: step.stepKey,
      type: 'roadmapStep',
      position: getNodePosition(index, steps.length),
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

function sortStepsByDependencies(steps: RoadmapStep[]) {
  const orderedSteps = [...steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const stepByKey = new Map(orderedSteps.map((step) => [step.stepKey, step]))
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const sorted: RoadmapStep[] = []

  const visit = (step: RoadmapStep) => {
    if (visited.has(step.stepKey)) return
    if (visiting.has(step.stepKey)) return

    visiting.add(step.stepKey)

    ;(step.dependsOn ?? [])
      .map((dependency) => stepByKey.get(dependency))
      .filter(Boolean)
      .sort((a, b) => ((a as RoadmapStep).order ?? 0) - ((b as RoadmapStep).order ?? 0))
      .forEach((dependency) => visit(dependency as RoadmapStep))

    visiting.delete(step.stepKey)
    visited.add(step.stepKey)
    sorted.push(step)
  }

  orderedSteps.forEach(visit)

  return sorted
}

export function normalizeSteps(template: { steps?: RoadmapStep[] }) {
  return sortStepsByDependencies(template.steps ?? [])
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
