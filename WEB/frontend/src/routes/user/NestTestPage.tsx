import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BookOpen01Icon,
  Compass01Icon,
  MapPinIcon,
  Route03Icon,
} from '@hugeicons/core-free-icons'
import { useLanguage } from '../../context/LanguageContext'
import {
  fetchNestRoadmaps,
  fetchNestRoadmapTree,
  type NestRoadmap,
  type NestRoadmapTreeResponse,
  type NestTopicTree,
} from '../../libs/roadmaps-api'

export default function NestTestPage() {
  const { t } = useTranslation()
  const { direction } = useLanguage()

  // State
  const [roadmaps, setRoadmaps] = useState<NestRoadmap[]>([])
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('')
  const [roadmapTree, setRoadmapTree] = useState<NestRoadmapTreeResponse | null>(null)
  const [selectedNode, setSelectedNode] = useState<NestTopicTree | null>(null)
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false)
  const [loadingTree, setLoadingTree] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Collapsed state map for tree nodes
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({})

  // Debug Panel Logs
  const [debugLogs, setDebugLogs] = useState<
    Array<{ timestamp: string; type: 'info' | 'success' | 'error'; message: string; details?: any }>
  >([])

  const addLog = (type: 'info' | 'success' | 'error', message: string, details?: any) => {
    setDebugLogs((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
        details,
      },
      ...prev.slice(0, 49), // Keep last 50 logs
    ])
  }

  // Load all roadmaps from NestJS via Express proxy on mount
  useEffect(() => {
    async function loadRoadmaps() {
      setLoadingRoadmaps(true)
      setErrorMessage(null)
      addLog('info', 'Initiating request: GET /api/v1/roadmaps via Express Gateway Proxy')

      try {
        const data = await fetchNestRoadmaps()
        setRoadmaps(data)
        addLog('success', `Fetched ${data.length} roadmaps successfully from NestJS service`, data)

        if (data.length > 0) {
          // Auto-select first roadmap
          setSelectedRoadmapId(data[0].id)
        }
      } catch (err: any) {
        const msg = err.message || 'Failed to load roadmaps from NestJS'
        setErrorMessage(msg)
        addLog('error', 'Error calling GET /api/v1/roadmaps', err)
      } finally {
        setLoadingRoadmaps(false)
      }
    }

    loadRoadmaps()
  }, [])

  // Load roadmap tree when selection changes
  useEffect(() => {
    if (!selectedRoadmapId) {
      setRoadmapTree(null)
      setSelectedNode(null)
      return
    }

    async function loadRoadmapTree() {
      setLoadingTree(true)
      setSelectedNode(null)
      addLog('info', `Initiating request: GET /api/v1/roadmaps/${selectedRoadmapId} via Express Gateway Proxy`)

      try {
        const tree = await fetchNestRoadmapTree(selectedRoadmapId)
        setRoadmapTree(tree)
        if (tree) {
          addLog('success', `Loaded roadmap tree: "${tree.name}"`, tree)
          // Default inspect the first starting topic if available
          if (tree.childTopics && tree.childTopics.length > 0) {
            setSelectedNode(tree.childTopics[0])
          }
        } else {
          addLog('error', `Roadmap tree for ${selectedRoadmapId} returned empty/null`)
        }
      } catch (err: any) {
        addLog('error', `Error calling GET /api/v1/roadmaps/${selectedRoadmapId}`, err)
      } finally {
        setLoadingTree(false)
      }
    }

    loadRoadmapTree()
  }, [selectedRoadmapId])

  // Toggle node expand/collapse
  const toggleCollapse = (topicId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }))
  }

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: NestTopicTree, depth = 0) => {
    const hasChildren = node.childTopics && node.childTopics.length > 0
    const isCollapsed = !!collapsedNodes[node.topicId]
    const isSelected = selectedNode?.topicId === node.topicId

    return (
      <div key={node.topicId} className="select-none">
        {/* Node header bar */}
        <div
          onClick={() => setSelectedNode(node)}
          className={`group flex cursor-pointer items-center gap-2 rounded-xl py-2 px-3 transition-all ${
            isSelected
              ? 'bg-(--surface-3) border-l-4 border-(--accent) text-(--text-h)'
              : 'hover:bg-(--surface-soft-hover) text-(--text)'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
        >
          {/* Collapse/Expand Toggle Button */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleCollapse(node.topicId)
              }}
              className="flex size-6 items-center justify-center rounded-lg hover:bg-(--surface-2) text-(--text-secondary) transition-colors"
            >
              <span className={`text-[10px] transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}>
                ▶
              </span>
            </button>
          ) : (
            <span className="size-6 flex items-center justify-center text-xs opacity-40">•</span>
          )}

          {/* Node Icon Badge */}
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs transition-colors ${
              node.type === 'topic'
                ? 'bg-[rgba(29,185,84,0.08)] border-[rgba(29,185,84,0.25)] text-(--accent)'
                : 'bg-[rgba(59,130,246,0.08)] border-[rgba(59,130,246,0.25)] text-blue-400'
            }`}
          >
            {node.type === 'topic' ? 'T' : 'S'}
          </span>

          {/* Node name info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{node.label}</p>
            <p className="truncate text-[10px] text-(--text-secondary) opacity-80">
              ID: {node.topicId}
            </p>
          </div>

          {/* Hover Inspect Indicator */}
          <span className="opacity-0 transition-opacity group-hover:opacity-100 text-xs text-(--accent) font-semibold">
            Inspect →
          </span>
        </div>

        {/* Child Topics list */}
        {hasChildren && !isCollapsed && (
          <div className="mt-1 relative">
            {/* Guide vertical link line */}
            <div
              className="absolute top-0 bottom-3 w-[1px] bg-(--border)"
              style={{ left: `${depth * 16 + 24}px` }}
            />
            <div className="space-y-1">
              {node.childTopics.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-(--bg) px-4 py-8 text-(--text-h) sm:px-6 lg:px-8" dir={direction}>
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Page Header */}
        <header className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(29,185,84,0.1)] px-3 py-1 text-xs font-semibold text-(--accent)">
                <span className="size-2 rounded-full bg-(--accent) animate-pulse" />
                NestJS Microservice Integration Validator
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-(--text-h)">
                Gateway Proxy Tester
              </h1>
              <p className="mt-2 text-sm text-(--text)">
                Verify end-to-end communication between the frontend client, the Express reverse proxy, and the NestJS roadmap microservice.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-(--text-secondary)">
                Gateway: <code className="bg-(--surface-2) px-2 py-1 rounded text-xs text-(--accent)">http://localhost:5000/api/v1</code>
              </span>
              <span className="text-sm font-semibold text-(--text-secondary)">
                NestJS: <code className="bg-(--surface-2) px-2 py-1 rounded text-xs text-blue-400">http://localhost:3000/api</code>
              </span>
            </div>
          </div>
        </header>

        {/* Roadmap Selector Cards */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HugeiconsIcon icon={Route03Icon} className="text-(--accent)" size={20} />
            1. Select a Roadmap Template from NestJS DB
          </h2>

          {loadingRoadmaps ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-(--border) bg-(--surface-2) p-5 h-28" />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-5 text-red-400">
              <p className="font-semibold">Failed to fetch NestJS Roadmaps</p>
              <p className="text-sm mt-1">{errorMessage}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex items-center justify-center rounded-squircle bg-red-900/35 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-red-900/50"
              >
                Retry
              </button>
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="rounded-2xl border border-(--border) bg-(--surface-2) p-6 text-center text-(--text-secondary)">
              <p>No roadmaps found in the NestJS collections.</p>
              <p className="text-xs mt-1">Please ensure the database seed script has been executed successfully.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roadmaps.map((rm) => {
                const isSelected = selectedRoadmapId === rm.id
                return (
                  <button
                    key={rm.id}
                    onClick={() => setSelectedRoadmapId(rm.id)}
                    className={`flex flex-col text-left rounded-2xl border p-5 transition-all hover:scale-[1.01] ${
                      isSelected
                        ? 'bg-[radial-gradient(circle_at_top_left,rgba(29,185,84,0.12),rgba(255,255,255,0.01))] border-(--accent) shadow-[0_10px_30px_rgba(29,185,84,0.1)]'
                        : 'bg-(--surface) border-(--border) hover:bg-(--surface-2)'
                    }`}
                  >
                    <span className="text-xs uppercase tracking-widest text-(--text-secondary) opacity-70">
                      ID: {rm.id}
                    </span>
                    <span className="mt-2 text-lg font-bold text-(--text-h) line-clamp-1">
                      {rm.name}
                    </span>
                    <span className="mt-4 text-xs text-(--text-secondary)">
                      Created: {rm.createdAt ? new Date(rm.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Tree Navigator and Node Inspector */}
        {selectedRoadmapId && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HugeiconsIcon icon={Compass01Icon} className="text-(--accent)" size={20} />
              2. Inspect Roadmap Tree & Topic Nodes
            </h2>

            <div className="grid gap-6 lg:grid-cols-12">
              
              {/* Tree View Panel */}
              <div className="lg:col-span-7 rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-sm flex flex-col min-h-[450px]">
                <div className="border-b border-(--border) pb-4 mb-4">
                  <h3 className="text-lg font-bold text-(--text-h)">
                    {roadmapTree ? roadmapTree.name : 'Loading tree...'}
                  </h3>
                  <p className="text-xs text-(--text-secondary) mt-1">
                    Click arrow to expand children. Click row to inspect details.
                  </p>
                </div>

                {loadingTree ? (
                  <div className="flex-1 flex items-center justify-center text-(--text-secondary)">
                    <div className="animate-spin size-8 border-4 border-(--accent) border-t-transparent rounded-full mr-2" />
                    <span>Fetching hierarchical tree...</span>
                  </div>
                ) : roadmapTree && roadmapTree.childTopics.length > 0 ? (
                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[500px] pr-2">
                    {roadmapTree.childTopics.map((node) => renderTreeNode(node))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-(--text-secondary)">
                    No topic nodes seeded for this roadmap tree.
                  </div>
                )}
              </div>

              {/* Inspector Panel */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Node Detail Card */}
                <div className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-sm flex-1 flex flex-col">
                  <div className="border-b border-(--border) pb-4 mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-(--text-h)">Node Inspector</h3>
                    {selectedNode && (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        selectedNode.type === 'topic'
                          ? 'bg-[rgba(29,185,84,0.15)] text-(--accent)'
                          : 'bg-[rgba(59,130,246,0.15)] text-blue-400'
                      }`}>
                        {selectedNode.type}
                      </span>
                    )}
                  </div>

                  {selectedNode ? (
                    <div className="flex-1 space-y-5">
                      <div>
                        <span className="text-xs text-(--text-secondary) uppercase tracking-wider block">
                          Display Label
                        </span>
                        <h4 className="text-xl font-bold text-(--text-h) mt-1">{selectedNode.label}</h4>
                      </div>

                      <div>
                        <span className="text-xs text-(--text-secondary) uppercase tracking-wider block">
                          Technical Name
                        </span>
                        <code className="text-sm bg-(--surface-2) text-(--text-h) px-2 py-1 rounded mt-1 inline-block">
                          {selectedNode.name}
                        </code>
                      </div>

                      <div>
                        <span className="text-xs text-(--text-secondary) uppercase tracking-wider block">
                          Canvas Position Coordinates
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-(--surface-2) border border-(--border) px-3 py-1 text-sm text-(--text-h) mt-1.5">
                          <HugeiconsIcon icon={MapPinIcon} size={15} className="text-(--accent)" />
                          X: {selectedNode.position.x}px, Y: {selectedNode.position.y}px
                        </span>
                      </div>

                      <div>
                        <span className="text-xs text-(--text-secondary) uppercase tracking-wider block">
                          Description
                        </span>
                        <p className="text-sm text-(--text) leading-relaxed mt-2 p-3 bg-(--surface-2) rounded-xl border border-(--border)">
                          {selectedNode.description || 'No description provided.'}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs text-(--text-secondary) uppercase tracking-wider block">
                          Resources & Links ({selectedNode.resources?.length ?? 0})
                        </span>
                        {selectedNode.resources && selectedNode.resources.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {selectedNode.resources.map((res, i) => (
                              <a
                                key={i}
                                href={res.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-(--surface-2) hover:bg-(--surface-3) rounded-xl border border-(--border) transition group"
                              >
                                <span className="flex size-8 items-center justify-center bg-(--surface) text-(--accent) rounded-lg border border-(--border)">
                                  <HugeiconsIcon icon={BookOpen01Icon} size={16} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-(--text-h) group-hover:text-(--accent)">
                                    {res.title}
                                  </p>
                                  <p className="truncate text-[10px] text-(--text-secondary)">
                                    Type: {res.type}
                                  </p>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-(--text-secondary) mt-2 italic">
                            No learning links linked to this topic node.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-(--text-secondary)">
                      <p>Select a node from the tree to inspect its parameters.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Live Debug Panel */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="size-3 rounded-full bg-orange-500" />
            3. Gateway Logs & Response Audits
          </h2>

          <div className="rounded-3xl border border-(--border) bg-(--surface) p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-(--border) pb-4">
              <span className="text-sm text-(--text-secondary)">
                This log captures HTTP requests originating from this page through the proxy server.
              </span>
              <button
                type="button"
                onClick={() => setDebugLogs([])}
                className="text-xs font-semibold text-(--text-secondary) hover:text-(--text-h) transition"
              >
                Clear Log
              </button>
            </div>

            <div className="font-mono text-xs rounded-2xl bg-black/40 border border-(--border) p-4 h-[250px] overflow-y-auto space-y-3">
              {debugLogs.length === 0 ? (
                <div className="text-(--text-secondary) italic text-center pt-20">
                  No active logs. Select/load roadmaps to trigger API calls.
                </div>
              ) : (
                debugLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-white/[0.03] pb-2 last:border-b-0">
                    <div className="flex items-start gap-2">
                      <span className="text-(--text-secondary)">[{log.timestamp}]</span>
                      <span
                        className={`font-bold ${
                          log.type === 'success'
                            ? 'text-(--accent)'
                            : log.type === 'error'
                            ? 'text-red-400'
                            : 'text-blue-400'
                        }`}
                      >
                        [{log.type.toUpperCase()}]
                      </span>
                      <span className="text-(--text-h) flex-1">{log.message}</span>
                    </div>
                    {log.details && (
                      <pre className="mt-2 ml-14 p-2 bg-white/[0.02] border border-white/[0.05] rounded text-[10px] text-(--text) overflow-x-auto max-w-full">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
