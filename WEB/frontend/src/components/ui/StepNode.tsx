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
  const { step, selected, status, isLocked, onSelect, isCore = true, branchSide } = data
  const { t } = useTranslation()

  // Custom styling classes for Core vs Branch nodes to create hierarchy
  const nodeStyles = isCore
    ? [
        'min-w-52 max-w-60 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold',
        statusStyles[status],
      ].join(' ')
    : [
        'min-w-44 max-w-50 rounded-lg border px-3.5 py-2.5 text-xs font-medium bg-(--surface-2) opacity-90',
        status === 'completed'
          ? 'border-transparent bg-(--gd-primary) text-white shadow-sm'
          : status === 'inProgress'
            ? 'border-(--accent-border) bg-(--accent-bg) text-(--text-h)'
            : 'border-(--border) bg-(--surface) text-(--text) hover:border-(--accent-border)',
      ].join(' ')

  const statusIndicatorClass = isCore ? 'size-7 text-base' : 'size-5.5 text-xs'

  return (
    <button
      type="button"
      onClick={() => !isLocked && onSelect(step.stepKey)}
      disabled={isLocked}
      aria-pressed={selected}
      aria-label={`${step.title} — ${status}`}
      className={[
        'group relative cursor-pointer flex items-center gap-2.5 text-left shadow-(--shadow) outline-none transition-all duration-200 ease-out',
        nodeStyles,
        isLocked
          ? 'cursor-not-allowed border-(--border) bg-(--surface-2) opacity-50'
          : '',
        selected && !isLocked
          ? 'ring-2 ring-(--gd-primary) ring-offset-2 ring-offset-(--bg) scale-[1.03]'
          : 'hover:-translate-y-0.5 hover:scale-[1.01]',
      ].join(' ')}
    >
      {/* Conditional Handles based on core vs branch classification */}
      {isCore ? (
        <>
          <Handle
            type="target"
            position={Position.Top}
            id="core-top"
            className="size-2 border-0 bg-(--gd-primary) opacity-0"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="core-bottom"
            className="size-2 border-0 bg-(--gd-primary) opacity-0"
          />
          <Handle
            type="source"
            position={Position.Left}
            id="core-left"
            className="size-2 border-0 bg-(--gd-primary) opacity-0"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="core-right"
            className="size-2 border-0 bg-(--gd-primary) opacity-0"
          />
        </>
      ) : (
        <>
          {branchSide === 'right' ? (
            <Handle
              type="target"
              position={Position.Left}
              id="branch-left"
              className="size-2 border-0 bg-(--gd-primary) opacity-0"
            />
          ) : (
            <Handle
              type="target"
              position={Position.Right}
              id="branch-right"
              className="size-2 border-0 bg-(--gd-primary) opacity-0"
            />
          )}
        </>
      )}

      {/* Status indicator */}
      <span
        className={[
          'flex shrink-0 items-center justify-center rounded-full text-center leading-none transition-colors duration-200',
          statusIndicatorClass,
          status === 'completed'
            ? 'bg-white/20 text-white'
            : status === 'inProgress'
              ? 'bg-(--accent-border)/20 text-(--accent)'
              : 'bg-(--surface-2) text-(--text)',
        ].join(' ')}
        aria-hidden="true"
      >
        {isLocked ? (
          <HugeiconsIcon icon={SquareLock02Icon} size={isCore ? 20 : 16} />
        ) : (
          statusIcon[status]
        )}
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <span className="block truncate font-semibold leading-snug">
          {step.title}
        </span>
        <span
          className={[
            'mt-0.5 block text-[10px] font-medium leading-none',
            status === 'completed' ? 'text-white/70' : 'opacity-60',
          ].join(' ')}
        >
          {isLocked
            ? t('roadmapDetail.locked', 'Locked')
            : t(`roadmapDetail.statusLabels.${status}`)}
        </span>
      </div>
    </button>
  )
}
