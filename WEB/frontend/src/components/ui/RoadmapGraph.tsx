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
          className="rounded-squircle cursor-pointer border border-(--border) bg-(--surface-2) px-3 py-1.5 text-xs font-medium text-(--text-h) transition hover:border-(--accent-border)"
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
