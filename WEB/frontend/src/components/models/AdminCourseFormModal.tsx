import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileUploadIcon, ImageUploadIcon } from '@hugeicons/core-free-icons'
import CustomDropdown from '../ui/CustomDropdown'
import type { AdminCourseRow } from '../../libs/admin-api'

type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

type CoursePayload = {
  title: string
  slug: string
  description: string
  shortDescription?: string
  level?: CourseLevel
  language?: string
  tags?: string[]
  category?: string
  thumbnailUrl?: string | null
  bannerUrl?: string | null
  durationMinutes?: number
  sections?: CourseSectionPayload[]
  prerequisites?: string[]
  learningOutcomes?: string[]
  isPublished?: boolean
  isFeatured?: boolean
}

type CourseLessonPayload = {
  lessonKey: string
  title: string
  summary?: string
  durationMinutes?: number
  videoUrl?: string
  resourceUrl?: string
  isPreview?: boolean
  order?: number
}

type CourseSectionPayload = {
  sectionKey: string
  title: string
  description?: string
  order?: number
  lessons?: CourseLessonPayload[]
}

type AdminCourseFormModalProps = {
  open: boolean
  mode: 'create' | 'update'
  course?: AdminCourseRow | null
  isPending?: boolean
  onClose: () => void
  onSubmit: (payload: CoursePayload) => void
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const splitLines = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

const joinLines = (value?: string[]) => value?.join('\n') ?? ''

const readTextFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read course file.'))
    reader.readAsText(file)
  })

const toStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item ?? '').trim()).filter(Boolean)
    : []

const toOptionalUrl = (value: unknown) => {
  const url = String(value ?? '').trim()
  return url ? url : undefined
}

const getJsonSections = (value: unknown): CourseSectionPayload[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((section, sectionIndex) => {
      const record = section && typeof section === 'object' ? section as Record<string, unknown> : {}
      const title = String(record.title ?? `Section ${sectionIndex + 1}`).trim()
      const sectionKey = slugify(String(record.sectionKey ?? title ?? `section-${sectionIndex + 1}`)) || `section-${sectionIndex + 1}`
      const lessons = Array.isArray(record.lessons)
        ? record.lessons.map((lesson, lessonIndex) => {
            const lessonRecord = lesson && typeof lesson === 'object' ? lesson as Record<string, unknown> : {}
            const lessonTitle = String(lessonRecord.title ?? `Lesson ${lessonIndex + 1}`).trim()

            return {
              lessonKey: slugify(String(lessonRecord.lessonKey ?? lessonTitle ?? `lesson-${lessonIndex + 1}`)) || `lesson-${lessonIndex + 1}`,
              title: lessonTitle,
              summary: String(lessonRecord.summary ?? '').trim() || undefined,
              durationMinutes: Number(lessonRecord.durationMinutes) || undefined,
              videoUrl: toOptionalUrl(lessonRecord.videoUrl),
              resourceUrl: toOptionalUrl(lessonRecord.resourceUrl),
              isPreview: Boolean(lessonRecord.isPreview),
              order: Number(lessonRecord.order ?? lessonIndex) || lessonIndex,
            }
          })
        : []

      return {
        sectionKey,
        title,
        description: String(record.description ?? '').trim() || undefined,
        order: Number(record.order ?? sectionIndex) || sectionIndex,
        lessons,
      }
    })
    .filter((section) => section.title.length >= 3)
}

export default function AdminCourseFormModal({
  open,
  mode,
  course,
  isPending = false,
  onClose,
  onSubmit,
}: AdminCourseFormModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(course?.title ?? '')
  const [slug, setSlug] = useState(course?.slug ?? '')
  const [description, setDescription] = useState(course?.description ?? '')
  const [shortDescription, setShortDescription] = useState(course?.shortDescription ?? '')
  const [level, setLevel] = useState<CourseLevel>((course?.level as CourseLevel) ?? 'beginner')
  const [language, setLanguage] = useState(course?.language ?? 'en')
  const [tagsText, setTagsText] = useState(joinLines(course?.tags))
  const [category, setCategory] = useState(course?.category ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course?.thumbnailUrl ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(course?.bannerUrl ?? null)
  const [durationMinutes, setDurationMinutes] = useState(String(course?.durationMinutes ?? ''))
  const [prerequisitesText, setPrerequisitesText] = useState(joinLines(course?.prerequisites))
  const [learningOutcomesText, setLearningOutcomesText] = useState(joinLines(course?.learningOutcomes))
  const [sections, setSections] = useState<CourseSectionPayload[]>(getJsonSections(course?.sections))
  const [importFileName, setImportFileName] = useState('')
  const [published, setPublished] = useState(course?.isPublished ?? false)
  const [featured, setFeatured] = useState(course?.isFeatured ?? false)
  const formKey = `${open ? 'open' : 'closed'}:${mode}:${course?._id ?? 'new'}`
  const [loadedFormKey, setLoadedFormKey] = useState(formKey)

  if (loadedFormKey !== formKey) {
    setLoadedFormKey(formKey)
    setTitle(course?.title ?? '')
    setSlug(course?.slug ?? '')
    setDescription(course?.description ?? '')
    setShortDescription(course?.shortDescription ?? '')
    setLevel((course?.level as CourseLevel) ?? 'beginner')
    setLanguage(course?.language ?? 'en')
    setTagsText(joinLines(course?.tags))
    setCategory(course?.category ?? '')
    setThumbnailUrl(course?.thumbnailUrl ?? null)
    setBannerUrl(course?.bannerUrl ?? null)
    setDurationMinutes(String(course?.durationMinutes ?? ''))
    setPrerequisitesText(joinLines(course?.prerequisites))
    setLearningOutcomesText(joinLines(course?.learningOutcomes))
    setSections(getJsonSections(course?.sections))
    setImportFileName('')
    setPublished(course?.isPublished ?? false)
    setFeatured(course?.isFeatured ?? false)
  }

  const levelOptions = [
    { value: 'beginner' as const, label: t('adminUi.levels.beginner') },
    { value: 'intermediate' as const, label: t('adminUi.levels.intermediate') },
    { value: 'advanced' as const, label: t('adminUi.levels.advanced') },
  ]

  const readImageFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Could not read image file.'))
      reader.readAsDataURL(file)
    })

  const handleImageChange = async (
    file: File | undefined,
    setter: (value: string | null) => void,
  ) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatar.invalidType'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('adminUi.courses.form.imageTooLarge', { defaultValue: 'Course image must be 5MB or smaller.' }))
      return
    }

    try {
      setter(await readImageFile(file))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('adminUi.courses.updateFailed'))
    }
  }

  const handleCourseJsonChange = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.json')) {
      toast.error(t('adminUi.courses.form.invalidJsonFile', { defaultValue: 'Upload a course JSON file.' }))
      return
    }

    try {
      const parsed = JSON.parse(await readTextFile(file)) as Record<string, unknown>
      const importedTitle = String(parsed.title ?? '').trim()
      const importedSlug = String(parsed.slug ?? slugify(importedTitle)).trim()
      const importedDescription = String(parsed.description ?? '').trim()
      const importedSections = getJsonSections(parsed.sections)

      if (importedTitle.length < 3 || importedSlug.length < 3 || importedDescription.length < 10) {
        toast.error(t('adminUi.courses.form.invalidJson', { defaultValue: 'Course JSON must include title, slug, and description.' }))
        return
      }

      setTitle(importedTitle)
      setSlug(slugify(importedSlug))
      setDescription(importedDescription)
      setShortDescription(String(parsed.shortDescription ?? '').trim())
      setLevel((['beginner', 'intermediate', 'advanced'].includes(String(parsed.level)) ? parsed.level : 'beginner') as CourseLevel)
      setLanguage(String(parsed.language ?? 'en').trim() || 'en')
      setTagsText(toStringArray(parsed.tags).join('\n'))
      setCategory(String(parsed.category ?? '').trim())
      setDurationMinutes(parsed.durationMinutes === undefined ? '' : String(Number(parsed.durationMinutes) || 0))
      setPrerequisitesText(toStringArray(parsed.prerequisites).join('\n'))
      setLearningOutcomesText(toStringArray(parsed.learningOutcomes).join('\n'))
      setSections(importedSections)
      if (typeof parsed.thumbnailUrl === 'string') setThumbnailUrl(parsed.thumbnailUrl)
      if (typeof parsed.bannerUrl === 'string') setBannerUrl(parsed.bannerUrl)
      if (typeof parsed.isPublished === 'boolean') setPublished(parsed.isPublished)
      if (typeof parsed.isFeatured === 'boolean') setFeatured(parsed.isFeatured)
      setImportFileName(file.name)
      toast.success(t('adminUi.courses.form.jsonImported', { defaultValue: 'Course JSON imported.' }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('adminUi.courses.form.invalidJson', { defaultValue: 'Could not read course JSON.' }))
    }
  }

  const renderImagePicker = ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: string | null
    onChange: (value: string | null) => void
  }) => (
    <div className="grid gap-3 rounded-3xl border border-(--border) bg-(--surface-2) p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-(--text-h)">{label}</span>
        {value ? (
          <button type="button" className="text-xs font-semibold text-(--error)" onClick={() => onChange(null)}>
            {t('adminUi.common.clear', { defaultValue: 'Clear' })}
          </button>
        ) : null}
      </div>
      <div className="grid aspect-video place-items-center overflow-hidden rounded-squircle border border-dashed border-(--border) bg-(--surface)">
        {value ? (
          <img src={value} alt={label} className="size-full object-cover" />
        ) : (
          <span className="text-sm text-(--text)">{t('adminUi.courses.form.noImage', { defaultValue: 'No image selected' })}</span>
        )}
      </div>
      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-squircle border border-(--border) px-4 py-2.5 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border)">
        <HugeiconsIcon icon={ImageUploadIcon} size={16} />
        {t('profile.avatar.choose')}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => {
            void handleImageChange(event.target.files?.[0], onChange)
            event.target.value = ''
          }}
        />
      </label>
    </div>
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-8">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-(--text)">{t('adminUi.courses.overline')}</p>
            <h2 className="mt-1 text-xl font-semibold text-(--text-h)">
              {mode === 'create' ? t('adminUi.courses.form.create') : t('adminUi.courses.form.update')}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-squircle cursor-pointer border border-(--border) px-3 py-2 text-sm text-(--text-h)">
            {t('adminUi.common.close')}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="grid gap-3 rounded-3xl border border-(--border) bg-(--surface-2) p-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-(--text-h)">
                  {t('adminUi.courses.form.importJson', { defaultValue: 'Import course JSON' })}
                </p>
                <p className="mt-1 text-xs leading-5 text-(--text)">
                  {t('adminUi.courses.form.importJsonHint', { defaultValue: 'Use a JSON file with course sections, lessons, prerequisites, and outcomes.' })}
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-squircle border border-(--border) px-4 py-2.5 text-sm font-semibold text-(--text-h) transition hover:border-(--accent-border)">
                <HugeiconsIcon icon={FileUploadIcon} size={16} />
                {t('adminUi.courses.form.chooseJson', { defaultValue: 'Choose JSON' })}
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => {
                    void handleCourseJsonChange(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
            </div>
            {importFileName || sections.length ? (
              <div className="flex flex-wrap gap-2 text-xs text-(--text)">
                {importFileName ? (
                  <span className="rounded-md border border-(--border) bg-(--surface) px-2 py-1">{importFileName}</span>
                ) : null}
                <span className="rounded-md border border-(--accent-border) bg-(--accent-bg) px-2 py-1 font-semibold text-(--accent)">
                  {t('adminUi.courses.form.importedSections', {
                    count: sections.length,
                    lessons: sections.reduce((total, section) => total + (section.lessons?.length ?? 0), 0),
                    defaultValue: `${sections.length} section(s) imported`,
                  })}
                </span>
              </div>
            ) : null}
          </div>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('adminUi.courses.form.title')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder={t('adminUi.courses.form.slug')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('adminUi.courses.form.description')} rows={3} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <input value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} placeholder={t('adminUi.courses.form.shortDescription')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder={t('adminUi.courses.form.category')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={language} onChange={(event) => setLanguage(event.target.value)} placeholder={t('adminUi.courses.form.language', { defaultValue: 'Language' })} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value.replace(/[^\d]/g, ''))} placeholder={t('adminUi.courses.form.duration', { defaultValue: 'Duration minutes' })} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <CustomDropdown<CourseLevel> value={level} options={levelOptions} onChange={setLevel} buttonClassName="bg-(--surface-2)! px-4! py-3! overflow-y " />
          <div className="flex items-center gap-4 rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h)">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="admin-checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />
              <span>{t('adminUi.courses.form.published')}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="admin-checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
              <span>{t('adminUi.courses.form.featured')}</span>
            </label>
          </div>
          <textarea value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder={t('adminUi.courses.form.tags', { defaultValue: 'Tags, one per line or comma separated' })} rows={3} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <textarea value={prerequisitesText} onChange={(event) => setPrerequisitesText(event.target.value)} placeholder={t('adminUi.courses.form.prerequisites', { defaultValue: 'Prerequisites' })} rows={3} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <textarea value={learningOutcomesText} onChange={(event) => setLearningOutcomesText(event.target.value)} placeholder={t('adminUi.courses.form.outcomes', { defaultValue: 'Learning outcomes' })} rows={3} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            {renderImagePicker({
              label: t('adminUi.courses.form.thumbnail', { defaultValue: 'Thumbnail image' }),
              value: thumbnailUrl,
              onChange: setThumbnailUrl,
            })}
            {renderImagePicker({
              label: t('adminUi.courses.form.banner', { defaultValue: 'Banner image' }),
              value: bannerUrl,
              onChange: setBannerUrl,
            })}
          </div>
          <button
            type="button"
            disabled={isPending}
            className="inline-flex cursor-pointer items-center justify-center rounded-squircle bg-(--gd-primary) px-5 py-3 text-sm font-semibold text-white transition hover:bg-(--gd-primary-hover) disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
            onClick={() => {
              if (title.trim().length < 3 || slug.trim().length < 3 || description.trim().length < 10) {
                toast.error(t('adminUi.courses.form.invalid'))
                return
              }
              onSubmit({
                title: title.trim(),
                slug: slug.trim(),
                description: description.trim(),
                shortDescription: shortDescription.trim() || undefined,
                category: category.trim() || undefined,
                level,
                language: language.trim() || undefined,
                tags: splitLines(tagsText),
                thumbnailUrl,
                bannerUrl,
                durationMinutes: durationMinutes.trim() ? Number(durationMinutes) : undefined,
                sections,
                prerequisites: splitLines(prerequisitesText),
                learningOutcomes: splitLines(learningOutcomesText),
                isPublished: published,
                isFeatured: featured,
              })
            }}
          >
            {isPending ? t('adminUi.common.saving') : mode === 'create' ? t('adminUi.courses.form.create') : t('adminUi.courses.form.update')}
          </button>
        </div>
      </section>
    </div>
  )
}
