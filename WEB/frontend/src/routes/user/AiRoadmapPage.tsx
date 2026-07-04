import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  AiBrain03Icon,
  AiChat02Icon,
  AiMagicIcon,
  BookmarkAdd02Icon,
  CrownIcon,
  FileLinkIcon,
  Route03Icon,
  SidebarLeftIcon,
} from '@hugeicons/core-free-icons'
import AiRoadmapManager from '../../components/ai/AiRoadmapManager'
import { RoadmapGraph } from '../../components/ui/RoadmapGraph'
import {
  explainAiRoadmapTopic,
  fetchAiFeatureAccess,
  generateUserAiRoadmapDraft,
  saveUserAiRoadmap,
  type AiRoadmapDraft,
} from '../../libs/ai-api'
import { updateRoadmapVisibility, type RoadmapTemplate } from '../../libs/roadmaps-api'
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
  draft: AiRoadmapDraft | RoadmapTemplate
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
  const defaultPrompt = t('aiRoadmap.promptDefault')
  const previousDefaultPromptRef = useRef(defaultPrompt)
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [targetLevel, setTargetLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [durationWeeks, setDurationWeeks] = useState(8)
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(6)
  const [draft, setDraft] = useState<AiRoadmapDraft | RoadmapTemplate | null>(null)
  const [selectedStepKey, setSelectedStepKey] = useState('')
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [isManagerOpen, setIsManagerOpen] = useState(true)
  const [explanations, setExplanations] = useState<Record<string, TopicExplanationContent>>({})

  useEffect(() => {
    setPrompt((current) => (current === previousDefaultPromptRef.current ? defaultPrompt : current))
    previousDefaultPromptRef.current = defaultPrompt
  }, [defaultPrompt])

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

  const ownerOrCreator = useMemo(() => {
    if (!draft) return null
    if (draft.owner && typeof draft.owner === 'object') return draft.owner
    if (draft.createdBy && typeof draft.createdBy === 'object') return draft.createdBy
    return null
  }, [draft])

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
    onSuccess: async (data) => {
      toast.success(t('aiRoadmap.saved'))
      if (data?.template) {
        setDraft(data.template)
      }
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'public-ai'] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t('aiRoadmap.saveFailed'))
    },
  })

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ templateId, visibility }: { templateId: string; visibility: 'public' | 'private' }) => {
      await updateRoadmapVisibility(templateId, visibility)
      return { templateId, visibility }
    },
    onSuccess: async (data) => {
      toast.success(t('aiRoadmap.visibilityUpdated'))
      setDraft((current) => {
        if (!current) return null
        return {
          ...current,
          visibility: data.visibility,
        }
      })
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: ['roadmaps', 'public-ai'] })
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

  const isSaved = Boolean(draft && '_id' in draft)

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
        <section
          className={[
            'grid gap-5 rounded-2xl border border-(--border) bg-linear-to-b from-(--surface) to-(--surface-2) p-4 shadow-lg shadow-black/10 sm:p-6',
            isManagerOpen ? 'lg:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)]' : '',
          ].join(' ')}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-(--accent-border)/20 bg-(--accent-bg)/50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-(--accent)">
                <HugeiconsIcon icon={AiMagicIcon} size={14} className="animate-pulse" />
                {t('aiRoadmap.overline')}
              </div>
              {!isManagerOpen ? (
                <button
                  type="button"
                  onClick={() => setIsManagerOpen(true)}
                  className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-2 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border) hover:text-(--accent)"
                >
                  <HugeiconsIcon icon={SidebarLeftIcon} size={17} />
                  {t('aiRoadmap.showManager')}
                </button>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-(--text-h) sm:text-4xl">
              {t('aiRoadmap.title')}
            </h1>
            <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
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
                  className="min-h-32 resize-y rounded-squircle border border-(--border) bg-(--surface-2)/50 px-4 py-3 text-sm leading-7 text-(--text-h) outline-none transition duration-200 focus:border-(--accent-border) focus:bg-(--surface-2) focus:ring-1 focus:ring-(--accent)/30"
                  placeholder={t('aiRoadmap.promptPlaceholder')}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-(--text)">
                    {t('aiRoadmap.level')}
                  </span>
                  <select
                    value={targetLevel}
                    onChange={(event) => setTargetLevel(event.target.value as typeof targetLevel)}
                    className="rounded-squircle border border-(--border) bg-(--surface-2)/50 px-3 py-2.5 text-sm text-(--text-h) outline-none transition duration-200 focus:border-(--accent-border) focus:bg-(--surface-2)"
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
                    className="rounded-squircle border border-(--border) bg-(--surface-2)/50 px-3 py-2.5 text-sm text-(--text-h) outline-none transition duration-200 focus:border-(--accent-border) focus:bg-(--surface-2)"
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
                    className="rounded-squircle border border-(--border) bg-(--surface-2)/50 px-3 py-2.5 text-sm text-(--text-h) outline-none transition duration-200 focus:border-(--accent-border) focus:bg-(--surface-2)"
                  />
                </label>
              </div>

              {/* Pre-build AI Disclaimer */}
              <div className="flex items-start gap-3 rounded-xl border border-(--accent-border) bg-(--accent-bg) p-4 text-xs leading-5 text-(--text) backdrop-blur-sm">
                <HugeiconsIcon icon={Alert02Icon} size={18} className="text-(--accent) mt-0.5 shrink-0" />
                <p>
                  <strong className="font-semibold text-(--text-h)">{t('aiRoadmap.disclaimerTitle', { defaultValue: 'Note:' })}</strong>{' '}
                  {t('aiRoadmap.disclaimerText', {
                    defaultValue: 'AI-generated roadmaps are customized learning drafts. Because AI can make mistakes, please double check critical path steps and verify study resources.',
                  })}
                </p>
              </div>

              <button
                type="submit"
                disabled={generateMutation.isPending || (isAuthenticated && !access?.capabilities.canGenerateDraft)}
                className="relative inline-flex items-center gap-2 rounded-squircle bg-(--gd-primary) px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-(--gd-primary)/10 transition-all duration-200 hover:-translate-y-0.5  hover:bg-(--gd-primary-hover) hover:shadow-lg hover:shadow-(--gd-primary)/20 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <>
                    <svg className="size-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t('aiRoadmap.generating')}</span>
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={AiBrain03Icon} size={18} />
                    <span>{t('aiRoadmap.generate')}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {isManagerOpen ? (
            <AiRoadmapManager
              access={access}
              currentUser={authQuery.data}
              isAuthenticated={isAuthenticated}
              onToggle={() => setIsManagerOpen(false)}
            />
          ) : null}
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
                {ownerOrCreator && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="size-6 overflow-hidden rounded-full border border-white/10 bg-white/20">
                      {ownerOrCreator.avatarUrl ? (
                        <img src={ownerOrCreator.avatarUrl} alt={ownerOrCreator.Fname} className="size-full object-cover" />
                      ) : (
                        <span className="flex size-full items-center justify-center text-[10px] font-bold text-white bg-(--gd-primary)">
                          {((ownerOrCreator.Fname?.[0] || '') + (ownerOrCreator.Lname?.[0] || '')).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-(--text)">
                      {t('aiRoadmap.owner', 'Owner')}:{' '}
                      <span className="font-semibold text-(--text-h)">
                        {ownerOrCreator.Fname} {ownerOrCreator.Lname}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              {isSaved ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-1.5 text-xs text-(--text)">
                    <span className="font-semibold text-(--text-h)">{t('aiRoadmap.visibility')}:</span>
                    <span className="capitalize">{t(`aiRoadmap.${draft.visibility || 'private'}`)}</span>
                  </div>
                  <button
                    type="button"
                    disabled={updateVisibilityMutation.isPending}
                    onClick={() => {
                      if (draft && '_id' in draft) {
                        updateVisibilityMutation.mutate({
                          templateId: draft._id,
                          visibility: draft.visibility === 'public' ? 'private' : 'public',
                        })
                      }
                    }}
                    className="inline-flex items-center cursor-pointer gap-2 rounded-squircle bg-(--gd-primary) px-4 py-2 text-xs font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:opacity-50"
                  >
                    {draft.visibility === 'public' ? t('aiRoadmap.makePrivate') : t('aiRoadmap.makePublic')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (draft && !('_id' in draft)) {
                      saveMutation.mutate(draft)
                    }
                  }}
                  disabled={!canSave || saveMutation.isPending}
                  className={[
                    'inline-flex items-center cursor-pointer gap-2 rounded-squircle px-4 py-2.5 text-sm font-semibold transition',
                    canSave
                      ? 'bg-(--gd-primary) text-white hover:bg-(--gd-primary-hover)'
                      : 'cursor-not-allowed border border-(--border) bg-(--surface-2) text-(--text)',
                  ].join(' ')}
                >
                  <HugeiconsIcon icon={BookmarkAdd02Icon} size={18} />
                  {saveMutation.isPending ? t('aiRoadmap.saving') : t('aiRoadmap.save')}
                </button>
              )}
            </div>

            <div className={['grid gap-5', shouldShowPanel ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : ''].join(' ')}>
              <RoadmapGraph
                nodes={nodes}
                edges={edges}
                isLoading={generateMutation.isPending}
                stepCount={steps.length}
                isPanelOpen={shouldShowPanel}
                onTogglePanel={() => setIsPanelOpen((value) => !value)}
                isAiGenerated={true}
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
