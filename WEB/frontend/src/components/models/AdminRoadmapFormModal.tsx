import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileUploadIcon } from '@hugeicons/core-free-icons'
import CustomDropdown from '../ui/CustomDropdown'
import { generateAdminRoadmapDraft } from '../../libs/admin-api'
import type { AdminRoadmapRow } from '../../libs/admin-api'

type RoleOption = 'student' | 'instructor' | 'admin' | 'jobSeeker' | 'careerSwitcher'
type LevelOption = 'beginner' | 'intermediate' | 'advanced'
type TemplateTypeOption = 'roleBased' | 'skillBased'

type RoadmapPayload = {
  title: string
  slug: string
  goal: string
  description?: string
  targetRole?: RoleOption
  targetLevel?: LevelOption
  templateType?: TemplateTypeOption
  tags?: string[]
  steps?: Array<{
    stepKey: string
    title: string
    description?: string
    resources?: Array<{ title?: string; url?: string }>
    order: number
    estimatedMinutes?: number
    required?: boolean
    dependsOn?: string[]
  }>
  source?: 'admin' | 'ai' | 'manual'
  estimatedTotalMinutes?: number
  contentFormat?: 'json' | 'markdown'
  contentMarkdown?: string
}

type AdminRoadmapFormModalProps = {
  open: boolean
  mode: 'create' | 'update'
  roadmap?: AdminRoadmapRow | null
  isPending?: boolean
  onClose: () => void
  onSubmit: (payload: RoadmapPayload) => void
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const readTextFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read roadmap file.'))
    reader.readAsText(file)
  })

const getJsonSteps = (value: unknown): RoadmapPayload['steps'] => {
  if (!Array.isArray(value)) return undefined

  return value
    .map((step, index) => {
      if (!step || typeof step !== 'object') return null
      const source = step as Record<string, unknown>
      const title = String(source.title ?? '').trim()
      if (title.length < 3) return null
      const stepKey = slugify(String(source.stepKey ?? title)) || `step-${index + 1}`
      const resources = Array.isArray(source.resources)
        ? source.resources
            .map((resource) => {
              if (!resource || typeof resource !== 'object') return null
              const item = resource as Record<string, unknown>
              const url = String(item.url ?? '').trim()
              const resourceTitle = String(item.title ?? '').trim()
              if (!url) return null
              return {
                title: resourceTitle || undefined,
                url,
              }
            })
            .filter(Boolean) as Array<{ title?: string; url?: string }>
        : undefined

      return {
        stepKey,
        title,
        description: String(source.description ?? '').trim() || undefined,
        resources,
        order: typeof source.order === 'number' ? source.order : index,
        estimatedMinutes: Number(source.estimatedMinutes) || undefined,
        required: source.required !== false,
        dependsOn: Array.isArray(source.dependsOn)
          ? source.dependsOn.map((dependency) => slugify(String(dependency))).filter(Boolean)
          : undefined,
      }
    })
    .filter(Boolean) as RoadmapPayload['steps']
}

export default function AdminRoadmapFormModal({
  open,
  mode,
  roadmap,
  isPending = false,
  onClose,
  onSubmit,
}: AdminRoadmapFormModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(roadmap?.title ?? '')
  const [slug, setSlug] = useState(roadmap?.slug ?? '')
  const [goal, setGoal] = useState(roadmap?.goal ?? '')
  const [description, setDescription] = useState(roadmap?.description ?? '')
  const [targetRole, setTargetRole] = useState<RoleOption>((roadmap?.targetRole as RoleOption) ?? 'student')
  const [targetLevel, setTargetLevel] = useState<LevelOption>((roadmap?.targetLevel as LevelOption) ?? 'beginner')
  const [templateType, setTemplateType] = useState<TemplateTypeOption>(roadmap?.templateType ?? 'roleBased')
  const [contentFormat, setContentFormat] = useState<'json' | 'markdown' | undefined>()
  const [markdown, setMarkdown] = useState('')
  const [importFileName, setImportFileName] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(8)
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(6)
  const [generatedTags, setGeneratedTags] = useState<string[]>([])
  const [generatedSteps, setGeneratedSteps] = useState<RoadmapPayload['steps']>()
  const [generatedEstimatedMinutes, setGeneratedEstimatedMinutes] = useState<number | undefined>()
  const [generatedSource, setGeneratedSource] = useState<'admin' | 'ai' | 'manual' | undefined>()
  const [isGenerating, setIsGenerating] = useState(false)

  if (!open) return null

  const roleOptions = [
    { value: 'student' as const, label: t('adminUi.roles.student') },
    { value: 'instructor' as const, label: t('adminUi.roles.instructor') },
    { value: 'admin' as const, label: t('adminUi.roles.admin') },
    { value: 'jobSeeker' as const, label: t('adminUi.roles.jobSeeker') },
    { value: 'careerSwitcher' as const, label: t('adminUi.roles.careerSwitcher') },
  ]
  const levelOptions = [
    { value: 'beginner' as const, label: t('adminUi.levels.beginner') },
    { value: 'intermediate' as const, label: t('adminUi.levels.intermediate') },
    { value: 'advanced' as const, label: t('adminUi.levels.advanced') },
  ]
  const typeOptions = [
    { value: 'roleBased' as const, label: t('adminUi.roadmapTypes.roleBased') },
    { value: 'skillBased' as const, label: t('adminUi.roadmapTypes.skillBased') },
  ]

  const handleRoadmapFileChange = async (file: File | undefined) => {
    if (!file) return

    const fileName = file.name
    const extension = fileName.split('.').pop()?.toLowerCase()

    if (!['json', 'md', 'markdown'].includes(extension ?? '')) {
      toast.error(t('adminUi.roadmaps.form.invalidFile', { defaultValue: 'Upload a .json, .md, or .markdown file.' }))
      return
    }

    if (file.size > 1024 * 1024) {
      toast.error(t('adminUi.roadmaps.form.fileTooLarge', { defaultValue: 'Roadmap file must be 1MB or smaller.' }))
      return
    }

    try {
      const text = await readTextFile(file)

      if (extension === 'json') {
        const parsed = JSON.parse(text) as Partial<RoadmapPayload>
        const importedSteps = getJsonSteps(parsed.steps)
        const importedTitle = String(parsed.title ?? '').trim()
        const importedSlug = String(parsed.slug ?? '').trim()
        const importedGoal = String(parsed.goal ?? '').trim()

        if (!importedTitle || !importedSlug || !importedGoal) {
          toast.error(t('adminUi.roadmaps.form.invalidJsonFile', { defaultValue: 'JSON roadmap must include title, slug, and goal.' }))
          return
        }

        if (!importedSteps?.length && !String(parsed.contentMarkdown ?? '').trim()) {
          toast.error(t('adminUi.roadmaps.form.invalidJsonSteps', { defaultValue: 'JSON roadmap must include steps or contentMarkdown.' }))
          return
        }

        setTitle(importedTitle)
        setSlug(slugify(importedSlug))
        setGoal(importedGoal)
        setDescription(String(parsed.description ?? '').trim())
        setTargetRole((parsed.targetRole as RoleOption) ?? targetRole)
        setTargetLevel((parsed.targetLevel as LevelOption) ?? targetLevel)
        setTemplateType((parsed.templateType as TemplateTypeOption) ?? templateType)
        setGeneratedTags(Array.isArray(parsed.tags) ? parsed.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean) : [])
        setGeneratedSteps(importedSteps)
        setGeneratedEstimatedMinutes(Number(parsed.estimatedTotalMinutes) || undefined)
        setGeneratedSource(parsed.source ?? 'manual')
        setMarkdown(String(parsed.contentMarkdown ?? '').trim())
        setContentFormat(importedSteps?.length ? 'json' : 'markdown')
        setImportFileName(fileName)
        toast.success(t('adminUi.roadmaps.form.fileImported', { defaultValue: 'Roadmap file imported.' }))
        return
      }

      const fallbackTitle = title.trim() || fileName.replace(/\.(md|markdown)$/i, '').replace(/[-_]+/g, ' ')
      setTitle(fallbackTitle)
      setSlug(slug || slugify(fallbackTitle))
      setMarkdown(text.trim())
      setGeneratedSteps(undefined)
      setGeneratedEstimatedMinutes(undefined)
      setGeneratedSource('manual')
      setContentFormat('markdown')
      setImportFileName(fileName)
      toast.success(t('adminUi.roadmaps.form.fileImported', { defaultValue: 'Roadmap file imported.' }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('adminUi.roadmaps.form.invalidFile', { defaultValue: 'Could not import roadmap file.' }))
    }
  }

  const hasCreateContent =
    mode !== 'create' ||
    (contentFormat === 'json' && Boolean(generatedSteps?.length)) ||
    (contentFormat === 'markdown' && markdown.trim().length >= 4)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-8">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-(--text)">{t('adminUi.roadmaps.overline')}</p>
            <h2 className="mt-1 text-xl font-semibold text-(--text-h)">
              {mode === 'create' ? t('adminUi.roadmaps.form.create') : t('adminUi.roadmaps.form.update')}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-squircle cursor-pointer border border-(--border) px-3 py-2 text-sm text-(--text-h)">
            {t('adminUi.common.close')}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('adminUi.roadmaps.form.title')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder={t('adminUi.roadmaps.form.slug')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder={t('adminUi.roadmaps.form.goal')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('adminUi.roadmaps.form.description')} rows={2} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <CustomDropdown<RoleOption> value={targetRole} options={roleOptions} onChange={setTargetRole} buttonClassName="bg-(--surface-2)! px-4! py-3!" />
          <CustomDropdown<LevelOption> value={targetLevel} options={levelOptions} onChange={setTargetLevel} buttonClassName="bg-(--surface-2)! px-4! py-3!" />
          <CustomDropdown<TemplateTypeOption> value={templateType} options={typeOptions} onChange={setTemplateType} className="md:col-span-2" buttonClassName="bg-(--surface-2)! px-4! py-3!" />
          {mode === 'create' ? (
            <div className="grid gap-3 rounded-squircle border border-(--border) bg-(--surface-muted) p-4 md:col-span-2 md:grid-cols-[10rem_10rem_1fr]">
              <input
                type="number"
                min={4}
                max={12}
                value={durationWeeks}
                onChange={(event) => setDurationWeeks(Number(event.target.value))}
                aria-label={t('adminUi.roadmaps.ai.durationWeeks')}
                className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none"
              />
              <input
                type="number"
                min={1}
                max={30}
                value={weeklyStudyHours}
                onChange={(event) => setWeeklyStudyHours(Number(event.target.value))}
                aria-label={t('adminUi.roadmaps.ai.weeklyStudyHours')}
                className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none"
              />
              <button
                type="button"
                disabled={isGenerating || goal.trim().length < 10}
                onClick={async () => {
                  setIsGenerating(true)
                  try {
                    const result = await generateAdminRoadmapDraft({
                      goal: goal.trim(),
                      targetRole,
                      targetLevel,
                      templateType,
                      durationWeeks,
                      weeklyStudyHours,
                    })

                    if (!result.ok || !result.data?.draft) {
                      toast.error(result.message)
                      return
                    }

                    const draft = result.data.draft
                    setTitle(draft.title)
                    setSlug(draft.slug)
                    setGoal(draft.goal)
                    setDescription(draft.description ?? '')
                    setTargetRole(draft.targetRole ?? targetRole)
                    setTargetLevel(draft.targetLevel ?? targetLevel)
                    setTemplateType(draft.templateType ?? templateType)
                    setMarkdown(draft.contentMarkdown ?? '')
                    setGeneratedTags(draft.tags ?? [])
                    setGeneratedSteps(draft.steps)
                    setGeneratedEstimatedMinutes(draft.estimatedTotalMinutes)
                    setGeneratedSource(draft.source)
                    setContentFormat(draft.steps?.length ? 'json' : 'markdown')
                    setImportFileName(t('adminUi.roadmaps.ai.generatedDraft', { defaultValue: 'AI generated draft' }))
                    toast.success(result.message)
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : t('adminUi.roadmaps.ai.failed'))
                  } finally {
                    setIsGenerating(false)
                  }
                }}
                className="inline-flex cursor-pointer items-center justify-center rounded-squircle border border-(--accent-border) px-4 py-3 text-sm font-semibold text-(--accent) transition hover:bg-(--accent-soft) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? t('adminUi.roadmaps.ai.generating') : t('adminUi.roadmaps.ai.generate')}
              </button>
            </div>
          ) : null}
          {mode === 'create' ? (
            <div className="grid gap-3 rounded-squircle border border-(--border) bg-(--surface-2) p-4 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-(--text-h)">
                    {t('adminUi.roadmaps.form.uploadRoadmap', { defaultValue: 'Upload roadmap file' })}
                  </p>
                  <p className="mt-1 text-xs text-(--text)">
                    {t('adminUi.roadmaps.form.uploadRoadmapHint', { defaultValue: 'Use .json for structured roadmap data or .md for markdown headings.' })}
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-squircle border border-(--accent-border) px-4 py-2.5 text-sm font-semibold text-(--accent) transition hover:bg-(--accent-soft)">
                  <HugeiconsIcon icon={FileUploadIcon} size={16} />
                  {t('adminUi.roadmaps.form.chooseFile', { defaultValue: 'Choose file' })}
                  <input
                    type="file"
                    accept=".json,.md,.markdown,application/json,text/markdown,text/plain"
                    className="hidden"
                    onChange={(event) => {
                      void handleRoadmapFileChange(event.target.files?.[0])
                      event.target.value = ''
                    }}
                  />
                </label>
              </div>
              <div className="rounded-squircle border border-dashed border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text)">
                {importFileName ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold text-(--text-h)">{importFileName}</span>
                    <span className="text-xs uppercase text-(--accent)">
                      {contentFormat === 'json'
                        ? t('adminUi.roadmaps.form.jsonImport', { defaultValue: 'JSON' })
                        : t('adminUi.roadmaps.form.markdownImport', { defaultValue: 'Markdown' })}
                      {generatedSteps?.length ? ` · ${generatedSteps.length} ${t('adminUi.roadmaps.form.steps', { defaultValue: 'steps' })}` : ''}
                    </span>
                  </div>
                ) : (
                  <span>{t('adminUi.roadmaps.form.noFileSelected', { defaultValue: 'No roadmap file selected.' })}</span>
                )}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            disabled={isPending}
            className="inline-flex cursor-pointer items-center justify-center rounded-squircle bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            onClick={() => {
              if (title.trim().length < 3 || slug.trim().length < 3 || goal.trim().length < 10 || !hasCreateContent) {
                toast.error(t('adminUi.roadmaps.form.invalid'))
                return
              }
              const finalContentFormat = contentFormat ?? (generatedSteps?.length ? 'json' : 'markdown')
              onSubmit({
                title: title.trim(),
                slug: slug.trim(),
                goal: goal.trim(),
                description: description.trim() || undefined,
                targetRole,
                targetLevel,
                templateType,
                ...(mode === 'create' ? {
                  tags: generatedTags.length ? generatedTags : undefined,
                  steps: generatedSteps,
                  source: generatedSource,
                  estimatedTotalMinutes: generatedEstimatedMinutes,
                  contentFormat: finalContentFormat,
                  contentMarkdown: markdown.trim() || undefined,
                } : {}),
              })
            }}
          >
            {isPending ? t('adminUi.common.saving') : mode === 'create' ? t('adminUi.roadmaps.form.create') : t('adminUi.roadmaps.form.update')}
          </button>
        </div>
      </section>
    </div>
  )
}
