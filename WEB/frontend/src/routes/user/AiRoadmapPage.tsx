import { type FormEvent, useCallback, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiBrain03Icon,
  AiChat02Icon,
  AiMagicIcon,
  CrownIcon,
  FileLinkIcon,
  FileStarIcon,
  Route03Icon,
} from '@hugeicons/core-free-icons'
import { RoadmapGraph } from '../../components/ui/RoadmapGraph'
import {
  explainAiRoadmapTopic,
  fetchAiFeatureAccess,
  generateUserAiRoadmapDraft,
  saveUserAiRoadmap,
  type AiRoadmapDraft,
} from '../../libs/ai-api'
import { createGraph, normalizeSteps } from '../../utils/graphBuilder'
import type { RoadmapStep, StepStatus } from '../../types/roadmap'
import { authQueryKey, fetchCurrentUser } from '../../libs/react-query'
import { useLanguage } from '../../context/LanguageContext'

const emptyProgressMap = new Map<string, StepStatus>()

type TopicExplanationContent = {
  summary: string
  keyPoints: string[]
  practice: string[]
  commonMistakes: string[]
}

function getResourceHost(url?: string) {
  try {
    return new URL(String(url || '')).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function StepPreviewPanel({
  draft,
  step,
  canExplain,
  isExplaining,
  explanation,
  onExplain,
}: {
  draft: AiRoadmapDraft
  step?: RoadmapStep
  canExplain: boolean
  isExplaining: boolean
  explanation?: {
    summary: string
    keyPoints: string[]
    practice: string[]
    commonMistakes: string[]
  }
  onExplain: () => void
}) {
  const { t } = useTranslation()
  const resources = step?.resources?.filter((resource) => resource.title || resource.url) ?? []

  return (
    <aside className="grid gap-5 rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
          {t('aiRoadmap.topicLabel')}
        </p>
        <h2 className="mt-2 text-xl font-bold leading-snug text-(--text-h)">
          {step?.title ?? draft.title}
        </h2>
      </div>

      <p className="text-sm leading-7 text-(--text)">
        {step?.description || draft.description || t('roadmapDetail.emptyDescription')}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExplain}
          disabled={!step || !canExplain || isExplaining}
          className={[
            'inline-flex items-center gap-2 cursor-pointer rounded-squircle px-4 py-2 text-sm font-semibold transition',
            canExplain
              ? 'bg-(--gd-primary) text-white hover:bg-(--gd-primary-hover)/50'
              : 'cursor-not-allowed border border-(--border) bg-(--surface-2) text-(--text)',
          ].join(' ')}
        >
          <HugeiconsIcon icon={AiChat02Icon} size={18} />
          {isExplaining ? t('aiRoadmap.explaining') : t('aiRoadmap.explainTopic')}
        </button>
        {!canExplain ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-(--border) px-2 py-1 text-xs font-semibold text-(--text)">
            <HugeiconsIcon icon={CrownIcon} size={14} />
            {t('aiRoadmap.proOnly')}
          </span>
        ) : null}
      </div>

      {explanation ? (
        <section className="grid gap-4 rounded-3xl border border-(--border) bg-(--surface-2) p-4">
          <p className="text-sm leading-7 text-(--text-h)">{explanation.summary}</p>
          {[
            { title: t('aiRoadmap.keyPoints'), items: explanation.keyPoints },
            { title: t('aiRoadmap.practice'), items: explanation.practice },
            { title: t('aiRoadmap.commonMistakes'), items: explanation.commonMistakes },
          ].map(({ title, items }) =>
            items.length ? (
              <div key={title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-(--text)">
                  {title}
                </h3>
                <ul className="mt-2 grid gap-2 text-sm leading-6 text-(--text)">
                  {items.map((item) => (
                    <li key={item} className="rounded-md bg-(--surface) px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </section>
      ) : null}

      <section>
        <h3 className="text-sm font-semibold text-(--text-h)">
          {t('roadmapDetail.resources')}
        </h3>
        {resources.length ? (
          <ul className="mt-3 grid gap-2">
            {resources.map((resource) => {
              const host = getResourceHost(resource.url)
              return (
                <li key={`${resource.title ?? ''}-${resource.url ?? ''}`}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm transition hover:border-(--accent-border)"
                  >
                    <span className="grid size-9 place-items-center rounded-squircle bg-(--surface-3) text-(--accent)">
                      <HugeiconsIcon icon={FileLinkIcon} size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-(--text-h)">
                        {resource.title || host || t('roadmapDetail.resources')}
                      </span>
                      {host ? <span className="block truncate text-xs text-(--text)">{host}</span> : null}
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-3 rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text)">
            {t('roadmapDetail.emptyResources')}
          </p>
        )}
      </section>
    </aside>
  )
}

export default function AiRoadmapPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const queryClient = useQueryClient()
  const [prompt, setPrompt] = useState('Become a React frontend developer in 8 weeks')
  const [targetLevel, setTargetLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [durationWeeks, setDurationWeeks] = useState(8)
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(6)
  const [draft, setDraft] = useState<AiRoadmapDraft | null>(null)
  const [selectedStepKey, setSelectedStepKey] = useState('')
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [explanations, setExplanations] = useState<Record<string, TopicExplanationContent>>({})

  const authQuery = useQuery({
    queryKey: authQueryKey,
    queryFn: fetchCurrentUser,
    staleTime: 0,
  })

  const accessQuery = useQuery({
    queryKey: ['ai', 'feature-access'],
    queryFn: fetchAiFeatureAccess,
    staleTime: 30_000,
    enabled: Boolean(authQuery.data),
  })

  const generateMutation = useMutation({
    mutationFn: generateUserAiRoadmapDraft,
    onSuccess: (payload) => {
      setDraft(payload.draft)
      setSelectedStepKey(payload.draft.steps?.[0]?.stepKey ?? '')
      setExplanations({})
      if (payload.access) {
        queryClient.setQueryData(['ai', 'feature-access'], payload.access)
      }
      toast.success(t('aiRoadmap.generated'))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aiRoadmap.generateFailed'))
    },
  })

  const saveMutation = useMutation({
    mutationFn: saveUserAiRoadmap,
    onSuccess: async () => {
      toast.success(t('aiRoadmap.saved'))
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aiRoadmap.saveFailed'))
    },
  })

  const explainMutation = useMutation({
    mutationFn: explainAiRoadmapTopic,
    onSuccess: (payload, variables) => {
      setExplanations((current) => ({
        ...current,
        [variables.stepTitle]: payload.explanation,
      }))
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aiRoadmap.explainFailed'))
    },
  })

  const steps = useMemo(() => (draft ? normalizeSteps({ steps: draft.steps }) : []), [draft])
  const activeStepKey = selectedStepKey || steps[0]?.stepKey || ''
  const selectedStep = steps.find((step) => step.stepKey === activeStepKey) ?? steps[0]
  const shouldShowPanel = Boolean(draft && selectedStep && isPanelOpen)

  const handleSelectStep = useCallback((stepKey: string) => {
    setSelectedStepKey(stepKey)
    setIsPanelOpen(true)
  }, [])

  const { nodes, edges } = useMemo(
    () => createGraph(steps, activeStepKey, emptyProgressMap, handleSelectStep, false),
    [steps, activeStepKey, handleSelectStep],
  )

  const access = accessQuery.data
  const isAuthenticated = Boolean(authQuery.data)
  const canSave = Boolean(access?.capabilities.canSaveRoadmap)
  const canExplain = Boolean(access?.capabilities.canExplainTopic)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAuthenticated) {
      setIsLoginPromptOpen(true)
      return
    }
    generateMutation.mutate({
      prompt,
      targetLevel,
      durationWeeks,
      weeklyStudyHours,
    })
  }

  const handleExplain = () => {
    if (!draft || !selectedStep) return

    explainMutation.mutate({
      roadmapTitle: draft.title,
      roadmapGoal: draft.goal,
      stepTitle: selectedStep.title,
      stepDescription: selectedStep.description,
    })
  }

  return (
    <main className="min-h-screen bg-(--bg) px-4 py-6 text-(--text-h) sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5">
        <section className="grid gap-5 rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow) lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
              <HugeiconsIcon icon={AiMagicIcon} size={18} />
              {t('aiRoadmap.overline')}
            </div>
            <h1 className="mt-3 text-3xl font-bold text-(--text-h) sm:text-4xl">
              {t('aiRoadmap.title')}
            </h1>
            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-(--text-h)">
                  {t('aiRoadmap.promptLabel')}
                </span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  minLength={10}
                  maxLength={500}
                  rows={4}
                  className="min-h-32 resize-y rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm leading-7 text-(--text-h) outline-none transition focus:border-(--accent-border)"
                  placeholder={t('aiRoadmap.promptPlaceholder')}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-(--text)">
                    {t('aiRoadmap.level')}
                  </span>
                  <select
                    value={targetLevel}
                    onChange={(event) => setTargetLevel(event.target.value as typeof targetLevel)}
                    className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-2.5 text-sm text-(--text-h) outline-none focus:border-(--accent-border)"
                  >
                    <option value="beginner">{t('landing.levels.beginner')}</option>
                    <option value="intermediate">{t('landing.levels.intermediate')}</option>
                    <option value="advanced">{t('landing.levels.advanced')}</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-(--text)">
                    {t('aiRoadmap.durationWeeks')}
                  </span>
                  <input
                    type="number"
                    min={4}
                    max={12}
                    value={durationWeeks}
                    onChange={(event) => setDurationWeeks(Number(event.target.value))}
                    className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-2.5 text-sm text-(--text-h) outline-none focus:border-(--accent-border)"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-(--text)">
                    {t('aiRoadmap.weeklyHours')}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={weeklyStudyHours}
                    onChange={(event) => setWeeklyStudyHours(Number(event.target.value))}
                    className="rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-2.5 text-sm text-(--text-h) outline-none focus:border-(--accent-border)"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={generateMutation.isPending || (isAuthenticated && !access?.capabilities.canGenerateDraft)}
                className="inline-flex w-fit items-center gap-2 rounded-squircle bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HugeiconsIcon icon={AiBrain03Icon} size={18} />
                {generateMutation.isPending ? t('aiRoadmap.generating') : t('aiRoadmap.generate')}
              </button>
            </form>
          </div>

          <div className="grid content-start gap-3 rounded-4xl border border-(--border) bg-(--surface-2) p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-(--text-h)">
              <HugeiconsIcon icon={CrownIcon} size={18} />
              {t('aiRoadmap.planTitle')}
            </div>
            <p className="text-sm leading-6 text-(--text)">
              {!isAuthenticated
                ? t('aiRoadmap.guestPlan')
                : access?.subscription.isSubscriber
                  ? t('aiRoadmap.proPlan')
                  : t('aiRoadmap.freePlan')}
            </p>
            {isAuthenticated ? (
              <div className="rounded-squircle bg-(--surface) px-3 py-2 text-sm text-(--text)">
                {t('aiRoadmap.draftsLeft', {
                  count: access?.usage.draftsRemaining ?? 0,
                  limit: access?.usage.draftLimit ?? access?.usage.freeDraftLimit ?? 0,
                })}
              </div>
            ) : null}
            {isAuthenticated && access && !access.capabilities.canGenerateDraft ? (
              <p className="rounded-md border border-(--border) px-3 py-2 text-sm text-(--text)">
                {t('aiRoadmap.limitReached')}
              </p>
            ) : null}
          </div>
        </section>

        {draft ? (
          <section className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--border) bg-(--surface) px-5 py-4 shadow-(--shadow)">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-(--accent)">
                  <HugeiconsIcon icon={Route03Icon} size={16} />
                  {t('aiRoadmap.generatedRoadmap')}
                </div>
                <h2 className="mt-1 truncate text-xl font-bold text-(--text-h)">
                  {draft.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => saveMutation.mutate(draft)}
                disabled={!canSave || saveMutation.isPending}
                className={[
                  'inline-flex items-center cursor-pointer gap-2 rounded-squircle px-4 py-2.5 text-sm font-semibold transition',
                  canSave
                    ? 'bg-(--gd-primary) text-white hover:bg-(--gd-primary-hover)'
                    : 'cursor-not-allowed border border-(--border) bg-(--surface-2) text-(--text)',
                ].join(' ')}
              >
                <HugeiconsIcon icon={FileStarIcon} size={18} />
                {saveMutation.isPending ? t('aiRoadmap.saving') : t('aiRoadmap.save')}
              </button>
            </div>

            <div className={['grid gap-5', shouldShowPanel ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''].join(' ')}>
              <RoadmapGraph
                nodes={nodes}
                edges={edges}
                isLoading={generateMutation.isPending}
                stepCount={steps.length}
                isPanelOpen={shouldShowPanel}
                onTogglePanel={() => setIsPanelOpen((value) => !value)}
              />
              {shouldShowPanel ? (
                <StepPreviewPanel
                  draft={draft}
                  step={selectedStep}
                  canExplain={canExplain}
                  isExplaining={explainMutation.isPending}
                  explanation={selectedStep ? explanations[selectedStep.title] : undefined}
                  onExplain={handleExplain}
                />
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
      {isLoginPromptOpen ? (
        <div className="fixed inset-0 z-60 grid place-items-center bg-black/70 px-4">
          <section className="grid max-w-md gap-4 rounded-3xl border border-(--border) bg-(--surface) p-6 text-(--text-h) shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-(--accent)">
              <HugeiconsIcon icon={AiMagicIcon} size={18} />
              {t('aiRoadmap.loginRequiredTitle')}
            </div>
            <p className="text-sm leading-7 text-(--text)">
              {t('aiRoadmap.loginRequiredText')}
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-squircle border border-(--border) px-4 py-2 text-sm font-semibold text-(--text-h)"
                onClick={() => setIsLoginPromptOpen(false)}
              >
                {t('aiRoadmap.cancel')}
              </button>
              <Link
                to={`/${language}/login`}
                className="rounded-squircle bg-(--gd-primary) px-4 py-2 text-sm font-semibold text-white"
              >
                {t('navbar.login')}
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
