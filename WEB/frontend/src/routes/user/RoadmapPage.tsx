import { useCallback, useMemo, useState } from 'react'
import { useLoaderData } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { RoadmapHeader } from '../../components/ui/RoadmapHeader'
import { RoadmapGraph } from '../../components/ui/RoadmapGraph'
import { StepDetailPanel } from '../../components/ui/StepDetailPanel'
import {
  useAuthQuery,
  useRoadmapProgress,
  useRoadmapTemplate,
  useUpdateStepStatus,
  useUserRoadmaps,
} from '../../hooks/useRoadmapData'
import { fallbackTemplate } from '../../utils/fallbackTemplate'
import {
  buildProgressMap,
  calculateProgress,
  createGraph,
  normalizeSteps,
} from '../../utils/graphBuilder'
import type { StepStatus } from '../../types/roadmap'
import type { RoadmapLoaderData } from '../../utils/route-utils'

export default function RoadmapPage() {
  const { slug } = useLoaderData() as RoadmapLoaderData
  const { t } = useTranslation()
  const [selectedStepKey, setSelectedStepKey] = useState('')
  const [isPanelOpen, setIsPanelOpen] = useState(true)

  // ─── Data fetching ────────────────────────────────────────────────────
  const authQuery = useAuthQuery()
  const templateQuery = useRoadmapTemplate(slug)
  const userRoadmapsQuery = useUserRoadmaps(Boolean(authQuery.data))

  const template = templateQuery.data ?? (templateQuery.isFetched ? fallbackTemplate : null)
  const enrolledRoadmap = userRoadmapsQuery.data?.find(
    (r) => r.template?._id === template?._id,
  )

  const progressQuery = useRoadmapProgress(
    enrolledRoadmap?._id,
    Boolean(authQuery.data && enrolledRoadmap?._id),
  )

  // ─── Derived state ────────────────────────────────────────────────────
  const steps = useMemo(
    () => (template ? normalizeSteps(template, fallbackTemplate.steps ?? []) : []),
    [template],
  )

  const progressMap = useMemo(
    () => buildProgressMap(progressQuery.data?.stepProgress ?? []),
    [progressQuery.data],
  )

  // Resolve the active step — defaults to first step
  const activeStepKey = selectedStepKey || steps[0]?.stepKey || ''
  const selectedStep = steps.find((s) => s.stepKey === activeStepKey) ?? steps[0]
  const selectedStatus: StepStatus = selectedStep
    ? (progressMap.get(selectedStep.stepKey) ?? 'notStarted')
    : 'notStarted'

  const progressPercent = calculateProgress(
    steps,
    progressMap,
    enrolledRoadmap?.progressPercent,
  )

  // ─── Mutations ────────────────────────────────────────────────────────
  const { updateMutation, isPending } = useUpdateStepStatus({
    templateId: template?._id,
    enrolledRoadmapId: enrolledRoadmap?._id,
    isAuthenticated: Boolean(authQuery.data),
  })

  // ─── Graph data ───────────────────────────────────────────────────────
  const handleSelectStep = useCallback((key: string) => {
    setSelectedStepKey(key)
    if (!isPanelOpen) setIsPanelOpen(true)
  }, [isPanelOpen])

  const { nodes, edges } = useMemo(
    () => createGraph(steps, activeStepKey, progressMap, handleSelectStep),
    [steps, activeStepKey, progressMap, handleSelectStep],
  )

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleStatusChange = (nextStatus: StepStatus) => {
    if (!selectedStep) return
    updateMutation.mutate({ stepKey: selectedStep.stepKey, status: nextStatus })
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-(--bg) px-4 py-6 text-(--text-h) sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        {/* Hero header */}
        <RoadmapHeader
          template={template}
          progressPercent={progressPercent}
          isAuthenticated={Boolean(authQuery.data)}
        />

        {/* Graph + detail panel */}
        <div
          className={[
            'grid gap-5',
            isPanelOpen ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : '',
          ].join(' ')}
        >
          <RoadmapGraph
            nodes={nodes}
            edges={edges}
            isLoading={templateQuery.isLoading}
            stepCount={steps.length}
            isPanelOpen={isPanelOpen}
            onTogglePanel={() => setIsPanelOpen((v) => !v)}
          />

          {isPanelOpen && (
            selectedStep ? (
              <StepDetailPanel
                step={selectedStep}
                status={selectedStatus}
                disabled={!authQuery.data}
                isUpdating={isPending}
                onStatusChange={handleStatusChange}
                onClose={() => setIsPanelOpen(false)}
              />
            ) : (
              <aside className="rounded-xl border border-(--border) bg-(--surface) p-6 text-(--text)">
                {t('roadmapDetail.emptySteps')}
              </aside>
            )
          )}
        </div>
      </div>
    </main>
  )
}
