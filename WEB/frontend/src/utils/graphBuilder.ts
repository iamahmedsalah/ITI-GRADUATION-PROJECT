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

export function createGraph(
  steps: RoadmapStep[],
  selectedStepKey: string,
  progressMap: Map<string, StepStatus>,
  onSelect: (stepKey: string) => void,
  lockDependencies = true,
): { nodes: Node<StepNodeData>[]; edges: Edge[] } {
  const knownKeys = new Set(steps.map((s) => s.stepKey))

  // 1. Build a dependents map to count how many other nodes depend on each key
  const dependentsMap = new Map<string, string[]>()
  steps.forEach((step) => {
    step.dependsOn?.forEach((parentKey) => {
      if (knownKeys.has(parentKey)) {
        if (!dependentsMap.has(parentKey)) {
          dependentsMap.set(parentKey, [])
        }
        dependentsMap.get(parentKey)!.push(step.stepKey)
      }
    })
  })

  // 2. Classify steps into Core vs Branch
  const coreSteps: RoadmapStep[] = []
  const branchStepsMap = new Map<string, RoadmapStep[]>() // parentKey -> branch steps

  steps.forEach((step) => {
    const isLeaf = !dependentsMap.has(step.stepKey) || dependentsMap.get(step.stepKey)!.length === 0
    const hasSingleParent = step.dependsOn && step.dependsOn.length === 1

    // If it's a leaf node and has exactly one parent, treat it as a side branch of that parent
    if (isLeaf && hasSingleParent) {
      const parentKey = step.dependsOn![0]
      if (knownKeys.has(parentKey)) {
        if (!branchStepsMap.has(parentKey)) {
          branchStepsMap.set(parentKey, [])
        }
        branchStepsMap.get(parentKey)!.push(step)
        return
      }
    }
    // Otherwise it's part of the main core spine
    coreSteps.push(step)
  })

  // Fallback: if for some reason coreSteps is empty (e.g. no templates or they all have no parents),
  // make all steps core nodes.
  if (coreSteps.length === 0) {
    coreSteps.push(...steps)
    branchStepsMap.clear()
  }

  // 3. Compute coordinates for each core step and its branches
  const positionsMap = new Map<string, { x: number; y: number }>()
  const nodeLayoutDataMap = new Map<string, { isCore: boolean; branchSide?: 'left' | 'right' }>()

  let currentY = 0
  const CORE_X = 0
  const BRANCH_X_OFFSET = 300
  const BRANCH_Y_GAP = 85
  const CORE_Y_GAP_BASE = 150

  coreSteps.forEach((coreStep, index) => {
    const branches = branchStepsMap.get(coreStep.stepKey) ?? []
    const branchCount = branches.length

    // Determine Y coordinate for this core node
    // Spacing needs to account for branches of the previous node if they went below it,
    // and branches of the current node if they go above it.
    // Centering the stack vertically: branches are distributed from -(branchCount - 1)/2 * BRANCH_Y_GAP to +(branchCount - 1)/2 * BRANCH_Y_GAP.
    const currentHalfBranchHeight = branchCount > 0 ? ((branchCount - 1) / 2) * BRANCH_Y_GAP : 0

    if (index > 0) {
      const prevCoreStep = coreSteps[index - 1]
      const prevBranches = branchStepsMap.get(prevCoreStep.stepKey) ?? []
      const prevBranchCount = prevBranches.length
      const prevHalfBranchHeight = prevBranchCount > 0 ? ((prevBranchCount - 1) / 2) * BRANCH_Y_GAP : 0

      // Add a gap that is proportional to both half-heights
      const requiredGap = CORE_Y_GAP_BASE + prevHalfBranchHeight + currentHalfBranchHeight
      currentY += requiredGap
    }

    // Assign core node position
    positionsMap.set(coreStep.stepKey, { x: CORE_X, y: currentY })
    nodeLayoutDataMap.set(coreStep.stepKey, { isCore: true })

    // Assign branch node positions
    if (branchCount > 0) {
      // Alternate side: odd index on left, even index on right
      const defaultSide = index % 2 === 0 ? 'right' : 'left'

      branches.forEach((branchStep, branchIndex) => {
        // If there are many branches (e.g. > 4), we split them to balance both sides.
        let side: 'left' | 'right' = defaultSide
        let localIndex = branchIndex
        let groupSize = branchCount

        if (branchCount > 4) {
          const half = Math.ceil(branchCount / 2)
          if (branchIndex < half) {
            side = 'left'
            localIndex = branchIndex
            groupSize = half
          } else {
            side = 'right'
            localIndex = branchIndex - half
            groupSize = branchCount - half
          }
        }

        const x = side === 'right' ? BRANCH_X_OFFSET : -BRANCH_X_OFFSET
        // Center vertically relative to the core step
        const offset = (localIndex - (groupSize - 1) / 2) * BRANCH_Y_GAP
        positionsMap.set(branchStep.stepKey, { x, y: currentY + offset })
        nodeLayoutDataMap.set(branchStep.stepKey, { isCore: false, branchSide: side })
      })
    }
  })

  // 4. Generate Nodes
  const nodes: Node<StepNodeData>[] = steps.map((step) => {
    const layout = nodeLayoutDataMap.get(step.stepKey) ?? { isCore: true }
    const pos = positionsMap.get(step.stepKey) ?? { x: 0, y: 0 }

    return {
      id: step.stepKey,
      type: 'roadmapStep',
      position: pos,
      data: {
        step,
        selected: step.stepKey === selectedStepKey,
        status: progressMap.get(step.stepKey) ?? 'notStarted',
        isLocked: lockDependencies && !getCompletedDepsStatus(step, progressMap, knownKeys),
        completedDeps: getCompletedDepsStatus(step, progressMap, knownKeys),
        onSelect,
        isCore: layout.isCore,
        branchSide: layout.branchSide,
      },
    }
  })

  // 5. Generate Edges
  const edges: Edge[] = steps.flatMap((step) => {
    const deps = step.dependsOn?.filter((d) => knownKeys.has(d)) ?? []
    
    // In our layout:
    // - Branch nodes connect to their single parent core node.
    // - Core nodes connect to the next core node in the spine.
    const targetLayout = nodeLayoutDataMap.get(step.stepKey)
    const isBranch = !(targetLayout?.isCore ?? true)
    
    let sources: string[] = []
    if (isBranch) {
      sources = deps.slice(0, 1) // should have exactly 1 parent
    } else {
      // Find its dependencies that are also core nodes.
      const coreDeps = deps.filter(d => nodeLayoutDataMap.get(d)?.isCore ?? true)
      if (coreDeps.length > 0) {
        sources = coreDeps
      } else {
        // Fallback to previous core node in sequence to make sure center spine is fully continuous
        const myIndexInCore = coreSteps.findIndex(cs => cs.stepKey === step.stepKey)
        if (myIndexInCore > 0) {
          sources = [coreSteps[myIndexInCore - 1].stepKey]
        }
      }
    }

    const isSelected = step.stepKey === selectedStepKey || sources.includes(selectedStepKey)
    const stepStatus = progressMap.get(step.stepKey) ?? 'notStarted'
    const isDone = stepStatus === 'completed'

    return sources.map((source) => {
      const sourceStatus = progressMap.get(source) ?? 'notStarted'
      const edgeDone = sourceStatus === 'completed' && isDone

      let sourceHandleId = 'core-bottom'
      let targetHandleId = 'core-top'

      if (targetLayout && !targetLayout.isCore) {
        // Source is core, target is branch
        if (targetLayout.branchSide === 'right') {
          sourceHandleId = 'core-right'
          targetHandleId = 'branch-left'
        } else {
          sourceHandleId = 'core-left'
          targetHandleId = 'branch-right'
        }
      }
      const isCoreTarget = targetLayout?.isCore ?? true

      return {
        id: `${source}->${step.stepKey}`,
        source,
        target: step.stepKey,
        type: 'smoothstep',
        sourceHandle: sourceHandleId,
        targetHandle: targetHandleId,
        animated: isSelected && !edgeDone,
        borderRadius: 16,
        markerEnd: isCoreTarget
          ? {
              type: MarkerType.ArrowClosed,
              width: 12,
              height: 12,
              color: edgeDone
                ? 'var(--gd-primary)'
                : isSelected
                  ? 'var(--accent-border)'
                  : 'var(--border)',
            }
          : undefined,
        style: {
          stroke: edgeDone
            ? 'var(--gd-primary)'
            : isSelected
              ? 'var(--accent-border)'
              : 'var(--border)',
          strokeWidth: isSelected ? (isCoreTarget ? 3.5 : 2) : (isCoreTarget ? 2.5 : 1.5),
          strokeDasharray: !isCoreTarget ? '5 4' : undefined, // dashed connector lines for branches
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
