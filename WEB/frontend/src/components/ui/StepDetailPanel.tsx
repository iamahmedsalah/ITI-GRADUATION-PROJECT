import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react';
import type { RoadmapStep, StepStatus } from '../../types/roadmap'
import {
  Cancel02Icon,
  FileLinkIcon,
  LinkSquare02Icon,
  PlayCircleIcon,
  YoutubeIcon,
} from '@hugeicons/core-free-icons';
import CustomDropdown, { type DropdownOption } from './CustomDropdown'

type Props = {
  step: RoadmapStep
  status: StepStatus
  disabled: boolean
  isUpdating: boolean
  onStatusChange: (status: StepStatus) => void
  onClose: () => void
}

const STATUS_OPTIONS: { value: StepStatus; labelKey: string }[] = [
  { value: 'notStarted', labelKey: 'roadmapDetail.pending' },
  { value: 'inProgress', labelKey: 'roadmapDetail.inProgress' },
  { value: 'completed', labelKey: 'roadmapDetail.done' },
  { value: 'skipped', labelKey: 'roadmapDetail.skip' },
]

type StepResource = NonNullable<RoadmapStep['resources']>[number]

function getResourceUrl(resource: StepResource) {
  return String(resource.url || '').trim()
}

function getResourceHost(resource: StepResource) {
  const url = getResourceUrl(resource)

  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isVideoResource(resource: StepResource) {
  const url = getResourceUrl(resource).toLowerCase()
  const title = String(resource.title || '').toLowerCase()

  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    title.includes('youtube') ||
    title.includes('video')
  )
}

function getResourceTitle(resource: StepResource, fallback: string) {
  return String(resource.title || '').trim() || getResourceHost(resource) || fallback
}

function ResourceSection({
  title,
  resources,
  variant,
}: {
  title: string
  resources: StepResource[]
  variant: 'docs' | 'videos'
}) {
  const { t } = useTranslation()
  const Icon = variant === 'videos' ? YoutubeIcon : FileLinkIcon
  const actionIcon = variant === 'videos' ? PlayCircleIcon : LinkSquare02Icon
  const actionLabel = variant === 'videos' ? t('roadmapDetail.watchResource') : t('roadmapDetail.openResource')

  if (!resources.length) return null

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-(--text)">
        <HugeiconsIcon icon={Icon} size={16} className="text-(--accent)" />
        <span>{title}</span>
      </div>
      <ul className="grid gap-2" role="list">
        {resources.map((resource) => {
          const host = getResourceHost(resource)
          const href = getResourceUrl(resource) || undefined

          return (
            <li key={`${resource.title ?? ''}-${resource.url ?? ''}`}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={[
                  'group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3',
                  'rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3',
                  'text-sm text-(--text-h) transition hover:-translate-y-0.5 hover:border-(--accent-border)',
                ].join(' ')}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-squircle bg-(--surface-3) text-(--accent)">
                  <HugeiconsIcon icon={Icon} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold leading-snug">
                    {getResourceTitle(resource, title)}
                  </span>
                  {host ? (
                    <span className="mt-1 block truncate text-xs text-(--text)">
                      {host}
                    </span>
                  ) : null}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-(--border) px-2 py-1 text-xs font-semibold text-(--text) transition group-hover:border-(--accent-border) group-hover:text-(--accent)">
                  <HugeiconsIcon icon={actionIcon} size={14} />
                  <span className="hidden sm:inline">{actionLabel}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function StepDetailPanel({
  step,
  status,
  disabled,
  isUpdating,
  onStatusChange,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const resources = step.resources?.filter((r) => r.title || r.url) ?? []
  const videoResources = resources.filter(isVideoResource)
  const docResources = resources.filter((resource) => !isVideoResource(resource))
  const statusOptions: DropdownOption<StepStatus>[] = STATUS_OPTIONS.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey),
  }))

  return (
    <aside
      className="flex flex-col gap-5 rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow)"
      aria-label="Step details"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-(--accent)">
            {t('roadmapDetail.selectedStep')}
          </p>
          <h2 className="mt-2 text-xl font-bold leading-snug text-(--text-h)">
            {step.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="mt-1 shrink-0 cursor-pointer rounded-squircle border border-(--border) p-1.5 text-(--text) transition hover:border-(--accent-border) hover:text-(--text-h)"
        >
          <HugeiconsIcon icon={Cancel02Icon} size={18} />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm leading-7 text-(--text)">
        {step.description || t('roadmapDetail.emptyDescription')}
      </p>

      {/* Status selector */}
      <div className="rounded-2xl border border-(--border) bg-(--surface-2) p-4">
        <CustomDropdown<StepStatus>
          id="step-status"
          label={t('roadmapDetail.status')}
          value={status}
          options={statusOptions}
          disabled={disabled || isUpdating}
          onChange={onStatusChange}
        />

        {isUpdating && (
          <p className="mt-2 text-xs text-(--accent)">Saving…</p>
        )}
        {disabled && !isUpdating && (
          <p className="mt-3 text-xs leading-5 text-(--text)">
            {t('roadmapDetail.loginRequired')}
          </p>
        )}
      </div>

      {/* Resources */}
      <section>
        <h3 className="text-sm mb-2 font-semibold text-(--text-h)">
          {t('roadmapDetail.resources')}
        </h3>

        {resources.length ? (
          <div className="mt-3 grid gap-4">
            <ResourceSection title={t('roadmapDetail.docsResources')} resources={docResources} variant="docs" />
            <ResourceSection title={t('roadmapDetail.videoResources')} resources={videoResources} variant="videos" />
          </div>
        ) : (
          <p className="mt-3 rounded-squircle border border-(--border) bg-(--surface-2) px-4 py-3 text-sm text-(--text)">
            {t('roadmapDetail.emptyResources')}
          </p>
        )}
      </section>

      {/* Dependencies notice */}
      {step.dependsOn?.length ? (
        <p className="text-xs text-(--text) opacity-60">
          Requires: {step.dependsOn.join(', ')}
        </p>
      ) : null}
    </aside>
  )
}
