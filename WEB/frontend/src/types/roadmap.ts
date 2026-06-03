import type {
  RoadmapStepProgress,
  RoadmapTemplate,
  UserRoadmap,
} from '../libs/roadmaps-api'

export type RoadmapStep = NonNullable<RoadmapTemplate['steps']>[number]

export type StepStatus = RoadmapStepProgress['status']

export type StepNodeData = {
  step: RoadmapStep
  selected: boolean
  status: StepStatus
  isLocked: boolean
  completedDeps: boolean
  onSelect: (stepKey: string) => void
}

export type { RoadmapStepProgress, RoadmapTemplate, UserRoadmap }
