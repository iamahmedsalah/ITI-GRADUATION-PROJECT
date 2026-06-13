import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { ImageUploadIcon } from '@hugeicons/core-free-icons'
import CustomDropdown from '../ui/CustomDropdown'
import type { AdminCourseRow } from '../../libs/admin-api'

type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

type CoursePayload = {
  title: string
  slug: string
  description: string
  shortDescription?: string
  level?: CourseLevel
  category?: string
  thumbnailUrl?: string | null
  bannerUrl?: string | null
  isPublished?: boolean
  isFeatured?: boolean
}

type AdminCourseFormModalProps = {
  open: boolean
  mode: 'create' | 'update'
  course?: AdminCourseRow | null
  isPending?: boolean
  onClose: () => void
  onSubmit: (payload: CoursePayload) => void
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
  const [category, setCategory] = useState(course?.category ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(course?.thumbnailUrl ?? null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(course?.bannerUrl ?? null)
  const [published, setPublished] = useState(course?.isPublished ?? false)
  const [featured, setFeatured] = useState(course?.isFeatured ?? false)

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
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('adminUi.courses.form.title')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder={t('adminUi.courses.form.slug')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('adminUi.courses.form.description')} rows={3} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none md:col-span-2" />
          <input value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} placeholder={t('adminUi.courses.form.shortDescription')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
          <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder={t('adminUi.courses.form.category')} className="rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text-h) outline-none" />
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
                thumbnailUrl,
                bannerUrl,
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
