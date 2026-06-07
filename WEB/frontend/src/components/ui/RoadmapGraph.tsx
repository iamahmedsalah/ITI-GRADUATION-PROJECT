import { useRef, useCallback } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslation } from 'react-i18next'
import { StepNode } from './StepNode'
import type { StepNodeData } from '../../types/roadmap'

const nodeTypes = { roadmapStep: StepNode }

const emptyGraphNodes = [
  {
    key: 'discover',
    titleKey: 'roadmapDetail.emptyGraph.nodes.discover',
    fallbackTitle: 'Discover path',
    labelKey: 'roadmapDetail.emptyGraph.labels.pending',
    fallbackLabel: 'Waiting for content',
    position: 'left-[7%] top-18 sm:left-[15%]',
  },
  {
    key: 'skills',
    titleKey: 'roadmapDetail.emptyGraph.nodes.skills',
    fallbackTitle: 'Skills map',
    labelKey: 'roadmapDetail.emptyGraph.labels.empty',
    fallbackLabel: 'No steps yet',
    position: 'right-[7%] top-38 sm:right-[17%]',
  },
  {
    key: 'projects',
    titleKey: 'roadmapDetail.emptyGraph.nodes.projects',
    fallbackTitle: 'Projects',
    labelKey: 'roadmapDetail.emptyGraph.labels.empty',
    fallbackLabel: 'No steps yet',
    position: 'left-[9%] bottom-28 sm:left-[20%]',
  },
  {
    key: 'finish',
    titleKey: 'roadmapDetail.emptyGraph.nodes.finish',
    fallbackTitle: 'Finish line',
    labelKey: 'roadmapDetail.emptyGraph.labels.pending',
    fallbackLabel: 'Waiting for content',
    position: 'right-[9%] bottom-10 sm:right-[22%]',
  },
]

function EmptyRoadmapGraph() {
  const { t } = useTranslation()
  const motionPath = 'M22 22 C75 18 75 35 56 44 C25 58 28 72 45 78 C58 84 68 86 78 90'

  return (
    <div className="relative min-h-120 flex-1 overflow-hidden bg-(--surface)">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(var(--accent-border) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-(--accent-border)/50 opacity-30 animate-ping" />
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.07] animate-pulse"
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={motionPath}
          fill="none"
          stroke="var(--border)"
          strokeWidth="0.8"
          strokeDasharray="2.2 2.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d={motionPath}
          fill="none"
          stroke="var(--gd-primary)"
          strokeWidth="0.8"
          strokeDasharray="8 110"
          strokeLinecap="round"
          opacity="0.9"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-118"
            dur="4.5s"
            repeatCount="indefinite"
          />
        </path>
        <circle r="1.2" fill="var(--gd-primary)" opacity="0.9">
          <animateMotion dur="5s" repeatCount="indefinite" path={motionPath} />
        </circle>
      </svg>

      <div className="pointer-events-none absolute inset-x-5 top-3 text-center sm:top-5">
        <p className="mx-auto mt-1 max-w-md text-xs leading-5  sm:text-sm text-(--text)">
                    {t(
            'roadmapDetail.emptyGraph.subtitle',
            'This roadmap has no visible steps yet. Once content is added, the path will appear here.',
          )}
        </p>
      </div>

      {emptyGraphNodes.map((node, index) => (
        <div
          key={node.key}
          className={[
            'absolute flex min-h-18 w-48 items-center gap-3 overflow-hidden rounded-squircle',
            'border border-dashed border-(--accent-border) bg-(--surface-2) px-4 py-3',
            'shadow-(--shadow) transition-transform duration-500',
            index % 2 === 0 ? 'animate-pulse' : '',
            node.position,
          ].join(' ')}
          style={{ animationDelay: `${index * 160}ms` }}
        >
          <img
            src="/logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-2 top-1/2 size-16 -translate-y-1/2 object-contain opacity-[0.05]"
          />
          <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-(--accent-bg) text-xs font-bold text-(--gd-primary)">
            {index + 1}
          </span>
          <div className="relative min-w-0">
            <p className="truncate text-sm font-semibold text-(--text-h)">
              {t(node.titleKey, node.fallbackTitle)}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-(--text)">
              {t(node.labelKey, node.fallbackLabel)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// MiniMap node colour based on status (accessed via node.data.status)
function miniMapNodeColor(node: Node<StepNodeData>) {
  const status = (node.data as StepNodeData)?.status
  if (status === 'completed') return 'var(--gd-primary)'
  if (status === 'inProgress') return 'var(--accent-border)'
  return 'var(--border)'
}

type Props = {
  nodes: Node[]
  edges: Edge[]
  isLoading: boolean
  stepCount: number
  isPanelOpen: boolean
  onTogglePanel: () => void
}

export function RoadmapGraph({
  nodes,
  edges,
  isLoading,
  stepCount,
  isPanelOpen,
  onTogglePanel,
}: Props) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasNodes = nodes.length > 0

  // Fit view when panel opens/closes
  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 50)
  }, [])

  return (
    <section
      ref={containerRef}
      className="flex min-h-130 flex-col overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-(--shadow) lg:min-h-175"
      aria-label="Roadmap graph"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-(--border) px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-(--text-h)">
            {t('roadmapDetail.steps')}
          </span>
          <span className="rounded-full bg-(--surface-2) px-2.5 py-0.5 text-xs font-medium text-(--text)">
            {stepCount}
          </span>
        </div>

        {/* Legend */}
        <div className="hidden items-center gap-4 text-xs text-(--text) sm:flex">
          {[
            { color: 'bg-(--border)', label: 'Not started' },
            { color: 'bg-(--accent-border)', label: 'In progress' },
            { color: 'bg-(--gd-primary)', label: 'Done' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`inline-block size-2.5 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onTogglePanel}
          disabled={!hasNodes}
          className={[
            'rounded-squircle border border-(--border) bg-(--surface-2) px-3 py-1.5 text-xs font-medium text-(--text-h) transition',
            hasNodes
              ? 'cursor-pointer hover:border-(--accent-border)'
              : 'cursor-not-allowed opacity-50',
          ].join(' ')}
        >
          {isPanelOpen ? t('roadmapDetail.hidePanel') : t('roadmapDetail.showPanel')}
        </button>
      </div>

      {/* Graph canvas */}
      {isLoading ? (
        <div className="grid min-h-120 flex-1 place-items-center">
          <div className="flex flex-col items-center gap-3 text-(--text)">
            {/* Spinner */}
            <svg
              className="size-6 animate-spin text-(--accent)"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="31.416"
                strokeDashoffset="10"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm">{t('roadmapDetail.loading')}</span>
          </div>
        </div>
      ) : !hasNodes ? (
        <EmptyRoadmapGraph />
      ) : (
        <div className="min-h-120 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.4 }}
            minZoom={0.2}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
            onInit={onInit}
            className="h-full bg-(--surface)"
            // Improve UX: prevent accidental graph scrolling while page scrolling
            zoomOnScroll={false}
            panOnScroll
            selectionOnDrag={false}
          >
            <Background
              color="var(--accent-border)"
              gap={10}
              size={5}
              style={{ opacity: 0.3 }}
            />
            <Controls
              showInteractive={false}
              className="[&>button]:border! [&>button]:m-0.5 [&>button]:rounded-lg! [&>button]:border-(--border)! [&>button]:bg-(--surface-2)! [&>button]:shadow-(--shadow)!"
            />
            <MiniMap
              nodeColor={miniMapNodeColor}
              className="rounded-squircle border! border-(--accent-border)! bg-(--text)/20!"
              nodeStrokeWidth={0}
              pannable
              zoomable
            />
          </ReactFlow>
        </div>
      )}
    </section>
  )
}
