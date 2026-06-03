import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react';
import type { RoadmapStep, StepStatus } from '../../types/roadmap'
import { Cancel02Icon } from '@hugeicons/core-free-icons';
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
          <ul className="mt-3 grid gap-2" role="list">
            {resources.map((resource) => (
              <li key={`${resource.title ?? resource.url}`}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className={[
                    'flex flex-col rounded-squircle border border-(--border) bg-(--surface-2)',
                    'px-4 py-3 text-sm text-(--text-h)',
                    'transition hover:border-(--accent-border) hover:-translate-y-0.5',
                  ].join(' ')}
                >
                  <span className="font-semibold leading-snug">
                    {resource.title || resource.url}
                  </span>
                  {resource.url && (
                    <span className="mt-1 truncate text-xs text-(--text)">
                      {resource.url}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
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
