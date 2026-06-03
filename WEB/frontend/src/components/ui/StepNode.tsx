import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react';
import type { StepNodeData, StepStatus } from '../../types/roadmap'
import {
  SquareLock02Icon,
} from '@hugeicons/core-free-icons';

const statusStyles: Record<StepStatus, string> = {
  notStarted:
    'border-(--border) bg-(--surface) text-(--text-h) hover:border-(--accent-border)',
  inProgress:
    'border-(--accent-border) bg-(--accent-bg) text-(--text-h)',
  completed:
    'border-transparent bg-(--gd-primary) text-white shadow-md',
  skipped:
    'border-(--border) bg-(--surface-2) text-(--text) opacity-60',
}

const statusIcon: Record<StepStatus, string> = {
  notStarted: '○',
  inProgress: '◑',
  completed: '✓',
  skipped: '⊘',
}

export function StepNode({ data }: NodeProps<Node<StepNodeData>>) {
  const { step, selected, status, isLocked, onSelect } = data
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={() => !isLocked && onSelect(step.stepKey)}
      disabled={isLocked}
      aria-pressed={selected}
      aria-label={`${step.title} — ${status}`}
      className={[
        'group relative cursor-pointer flex min-w-50 max-w-55 items-center gap-3',
        'rounded-squircle border-2 px-4 py-3 text-left text-sm font-medium',
        'shadow-(--shadow) outline-none',
        'transition-all duration-200 ease-out',
        'focus-visible:ring-2 focus-visible:ring-(--gd-primary) focus-visible:ring-offset-2',
        isLocked
          ? 'cursor-not-allowed border-(--border) bg-(--surface-2) opacity-50'
          : statusStyles[status],
        selected && !isLocked
          ? 'ring-2 ring-(--gd-primary) ring-offset-2 ring-offset-(--bg) scale-[1.03]'
          : 'hover:-translate-y-0.5 hover:scale-[1.01]',
      ].join(' ')}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="size-2 border-0 bg-(--gd-primary) opacity-0"
      />

      {/* Status indicator */}
      <span
        className={[
          'flex size-7 shrink-0 items-center justify-center rounded-full text-base',
          'transition-colors duration-200',
          status === 'completed'
            ? 'bg-white/20 text-white'
            : status === 'inProgress'
              ? 'bg-(--accent-border)/20 text-(--accent)'
              : 'bg-(--surface-2) text-(--text)',
        ].join(' ')}
        aria-hidden="true"
      >
        {isLocked ? <HugeiconsIcon icon={SquareLock02Icon}  size={24}/> : statusIcon[status]}
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <span className="block truncate font-semibold leading-snug">
          {step.title}
        </span>
        <span
          className={[
            'mt-0.5 block text-[11px] font-medium',
            status === 'completed' ? 'text-white/70' : 'opacity-60',
          ].join(' ')}
        >
          {isLocked
            ? t('roadmapDetail.locked', 'Locked')
            : t(`roadmapDetail.statusLabels.${status}`)}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="size-2 border-0 bg-(--gd-primary) opacity-0"
      />
    </button>
  )
}
