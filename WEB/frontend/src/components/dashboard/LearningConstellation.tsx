import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, CourseIcon, Route03Icon, StarIcon } from '@hugeicons/core-free-icons'
import * as THREE from 'three'
import type {
  AiRecommendationsData,
  DashboardCourse,
  DashboardRoadmap,
} from '../../libs/user-api'

type LearningConstellationProps = {
  roadmaps: DashboardRoadmap[]
  courses: DashboardCourse[]
  recommendations?: AiRecommendationsData
}

type ConstellationNode = {
  id: string
  title: string
  kind: 'starred' | 'roadmap' | 'course' | 'ai'
  progress: number
  radius: number
  detail: string
}

type ConstellationLabels = {
  starredRoadmap: string
  readyToStart: string
  roadmap: string
  inProgress: string
  course: string
  aiRecommendation: string
  match: string
}

const palette: Record<ConstellationNode['kind'], string> = {
  starred: '#f4c542',
  roadmap: '#4da3ff',
  course: '#f08f45',
  ai: '#8b5cf6',
}

function buildNodes({
  roadmaps,
  courses,
  recommendations,
}: LearningConstellationProps, labels: ConstellationLabels): ConstellationNode[] {
  const starred = roadmaps
    .filter((roadmap) => roadmap.status === 'assigned')
    .slice(0, 4)
    .map((roadmap) => ({
      id: `starred-${roadmap._id}`,
      title: roadmap.template?.title ?? labels.starredRoadmap,
      kind: 'starred' as const,
      progress: Math.round(roadmap.progressPercent ?? 0),
      radius: 1.8,
      detail: roadmap.template?.targetLevel ?? labels.readyToStart,
    }))

  const activeRoadmaps = roadmaps
    .filter((roadmap) => roadmap.status !== 'assigned')
    .slice(0, 5)
    .map((roadmap) => ({
      id: `roadmap-${roadmap._id}`,
      title: roadmap.template?.title ?? labels.roadmap,
      kind: 'roadmap' as const,
      progress: Math.round(roadmap.progressPercent ?? 0),
      radius: 2.75,
      detail: roadmap.status ?? labels.inProgress,
    }))

  const activeCourses = courses.slice(0, 4).map((course) => ({
    id: `course-${course._id}`,
    title: course.course?.title ?? labels.course,
    kind: 'course' as const,
    progress: Math.round(course.progressPercent ?? 0),
    radius: 3.55,
    detail: course.course?.category ?? course.status ?? labels.course,
  }))

  const aiNodes = recommendations?.recommendations.roadmaps.slice(0, 3).map((item) => ({
    id: `ai-${item.roadmap._id}`,
    title: item.roadmap.title ?? labels.aiRecommendation,
    kind: 'ai' as const,
    progress: item.matchScore,
    radius: 4.35,
    detail: `${item.matchScore}% ${labels.match}`,
  })) ?? []

  return [...starred, ...activeRoadmaps, ...activeCourses, ...aiNodes].slice(0, 16)
}

function nodePosition(index: number, count: number, radius: number) {
  const angle = (index / Math.max(count, 1)) * Math.PI * 2
  const wave = Math.sin(angle * 2.3) * 0.35

  return new THREE.Vector3(
    Math.cos(angle) * radius,
    wave,
    Math.sin(angle) * radius,
  )
}

export default function LearningConstellation({
  roadmaps,
  courses,
  recommendations,
}: LearningConstellationProps) {
  const { t } = useTranslation()
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  const hoveredIdRef = useRef<string | null>(null)
  const labels = useMemo<ConstellationLabels>(() => ({
    starredRoadmap: t('dashboard.constellation.fallbacks.starredRoadmap'),
    readyToStart: t('dashboard.constellation.fallbacks.readyToStart'),
    roadmap: t('dashboard.constellation.fallbacks.roadmap'),
    inProgress: t('dashboard.constellation.fallbacks.inProgress'),
    course: t('dashboard.constellation.fallbacks.course'),
    aiRecommendation: t('dashboard.constellation.fallbacks.aiRecommendation'),
    match: t('dashboard.constellation.fallbacks.match'),
  }), [t])
  const kindLabels = useMemo<Record<ConstellationNode['kind'], string>>(() => ({
    starred: t('dashboard.constellation.legend.starred'),
    roadmap: t('dashboard.constellation.legend.roadmaps'),
    course: t('dashboard.constellation.legend.courses'),
    ai: t('dashboard.constellation.legend.ai'),
  }), [t])
  const nodes = useMemo(
    () => buildNodes({ roadmaps, courses, recommendations }, labels),
    [courses, labels, recommendations, roadmaps],
  )
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0]
  const hoveredNode = nodes.find((node) => node.id === hoveredId) ?? null
  const previewNode = hoveredNode ?? selectedNode
  const progress = Math.min(100, Math.max(0, Math.round(selectedNode?.progress ?? 0)))

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    hoveredIdRef.current = hoveredId
  }, [hoveredId])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#111511', 6, 13)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 1.6, 6.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const root = new THREE.Group()
    root.scale.setScalar(1.12)
    scene.add(root)

    const particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          Array.from({ length: 240 }, () => [
            (Math.random() - 0.5) * 11,
            (Math.random() - 0.5) * 4.5,
            (Math.random() - 0.5) * 8,
          ]).flat(),
          3,
        ),
      ),
      new THREE.PointsMaterial({
        color: '#1db954',
        size: 0.018,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    )
    scene.add(particles)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(0x1db954, 18, 9)
    pointLight.position.set(1.6, 2.5, 2.5)
    scene.add(pointLight)

    const logoTexture = new THREE.TextureLoader().load('/logo.png')
    logoTexture.colorSpace = THREE.SRGBColorSpace

    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 32, 24),
      new THREE.MeshBasicMaterial({
        color: '#1db954',
        transparent: true,
        opacity: 0.16,
      }),
    )
    root.add(coreGlow)

    const pulseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.06, 0.012, 10, 96),
      new THREE.MeshBasicMaterial({
        color: '#1db954',
        transparent: true,
        opacity: 0.52,
      }),
    )
    pulseRing.rotation.x = Math.PI / 2
    root.add(pulseRing)

    const logoCore = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: logoTexture,
        transparent: true,
      }),
    )
    logoCore.scale.set(1.2, 1.2, 1)
    root.add(logoCore)

    const nodeMeshes: THREE.Mesh[] = []
    const linkLines: THREE.Line[] = []
    const sparkMeshes: THREE.Mesh[] = []
    const nodeCountsByRadius = new Map<number, number>()
    nodes.forEach((node) => {
      nodeCountsByRadius.set(node.radius, (nodeCountsByRadius.get(node.radius) ?? 0) + 1)
    })
    const nodeIndexByRadius = new Map<number, number>()

    Array.from(nodeCountsByRadius.keys()).forEach((radius) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.008, 8, 96),
        new THREE.MeshBasicMaterial({
          color: '#2c2c2c',
          transparent: true,
          opacity: 0.9,
        }),
      )
      ring.rotation.x = Math.PI / 2
      root.add(ring)
    })

    nodes.forEach((node) => {
      const indexOnRing = nodeIndexByRadius.get(node.radius) ?? 0
      nodeIndexByRadius.set(node.radius, indexOnRing + 1)
      const countOnRing = nodeCountsByRadius.get(node.radius) ?? 1
      const baseAngle = (indexOnRing / countOnRing) * Math.PI * 2
      const size = 0.12 + Math.min(0.16, node.progress / 500)
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 24, 18),
        new THREE.MeshStandardMaterial({
          color: palette[node.kind],
          emissive: palette[node.kind],
          emissiveIntensity: 0.55,
          roughness: 0.36,
          metalness: 0.18,
        }),
      )
      mesh.position.copy(nodePosition(indexOnRing, countOnRing, node.radius))
      mesh.userData.nodeId = node.id
      mesh.userData.radius = node.radius
      mesh.userData.baseAngle = baseAngle
      mesh.userData.orbitSpeed = 0.07 + indexOnRing * 0.012 + node.radius * 0.006
      mesh.userData.wavePhase = indexOnRing * 1.9 + node.radius
      nodeMeshes.push(mesh)
      root.add(mesh)

      const linkGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), mesh.position.clone()])
      const link = new THREE.Line(
        linkGeometry,
        new THREE.LineBasicMaterial({
          color: palette[node.kind],
          transparent: true,
          opacity: 0.12,
        }),
      )
      link.userData.nodeId = node.id
      linkLines.push(link)
      root.add(link)
    })

    Array.from({ length: 18 }).forEach((_, index) => {
      const radius = [1.8, 2.75, 3.55, 4.35][index % 4]
      const spark = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 8),
        new THREE.MeshBasicMaterial({
          color: index % 2 === 0 ? '#1db954' : '#ffffff',
          transparent: true,
          opacity: 0.6,
        }),
      )
      spark.userData.radius = radius
      spark.userData.angle = index * 1.7
      spark.userData.speed = 0.32 + (index % 5) * 0.08
      sparkMeshes.push(spark)
      root.add(spark)
    })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let lastHoveredNodeId: string | null = null
    const pointerState = {
      dragging: false,
      moved: false,
      x: 0,
      y: 0,
      yaw: -0.25,
      pitch: 0.18,
      zoom: 6.2,
    }

    const setSize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    const pickNodeId = (event: PointerEvent) => {
      updatePointer(event)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(nodeMeshes, false)[0]
      return typeof hit?.object.userData.nodeId === 'string' ? hit.object.userData.nodeId : null
    }

    const onPointerDown = (event: PointerEvent) => {
      pointerState.dragging = true
      pointerState.moved = false
      pointerState.x = event.clientX
      pointerState.y = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(nodeMeshes, false)[0]
      const nodeId = typeof hit?.object.userData.nodeId === 'string' ? hit.object.userData.nodeId : null
      renderer.domElement.style.cursor = hit ? 'pointer' : pointerState.dragging ? 'grabbing' : 'grab'

      if (nodeId !== lastHoveredNodeId) {
        lastHoveredNodeId = nodeId
        setHoveredId(nodeId)
      }

      if (!pointerState.dragging) return

      const dx = event.clientX - pointerState.x
      const dy = event.clientY - pointerState.y
      if (Math.abs(dx) + Math.abs(dy) > 3) pointerState.moved = true
      pointerState.yaw += dx * 0.006
      pointerState.pitch = Math.max(-0.55, Math.min(0.7, pointerState.pitch + dy * 0.004))
      pointerState.x = event.clientX
      pointerState.y = event.clientY
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!pointerState.moved) {
        const nodeId = pickNodeId(event)
        if (nodeId) setSelectedId(nodeId)
      }
      pointerState.dragging = false
      renderer.domElement.releasePointerCapture(event.pointerId)
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      pointerState.zoom = Math.max(4.5, Math.min(8.2, pointerState.zoom + event.deltaY * 0.005))
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', setSize)
    setSize()

    let frameId = 0
    const clock = new THREE.Clock()
    const animate = () => {
      const elapsed = clock.getElapsedTime()
      root.rotation.y = pointerState.yaw + elapsed * 0.08
      root.rotation.x = pointerState.pitch
      coreGlow.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.04)
      pulseRing.scale.setScalar(1 + Math.sin(elapsed * 2.2) * 0.1)
      pulseRing.rotation.z = elapsed * 0.35
      particles.rotation.y = elapsed * 0.025
      particles.rotation.x = Math.sin(elapsed * 0.18) * 0.08
      camera.position.z += (pointerState.zoom - camera.position.z) * 0.08
      nodeMeshes.forEach((mesh, index) => {
        const nodeId = String(mesh.userData.nodeId ?? '')
        const radius = Number(mesh.userData.radius ?? 1)
        const angle = Number(mesh.userData.baseAngle ?? 0) + elapsed * Number(mesh.userData.orbitSpeed ?? 0.08)
        const wavePhase = Number(mesh.userData.wavePhase ?? 0)
        mesh.position.set(
          Math.cos(angle) * radius,
          Math.sin(elapsed * 1.1 + wavePhase) * 0.42,
          Math.sin(angle) * radius,
        )
        const activeScale = nodeId === selectedIdRef.current ? 1.55 : nodeId === hoveredIdRef.current ? 1.35 : 1
        const pulse = activeScale + Math.sin(elapsed * 2 + index) * 0.07
        mesh.scale.setScalar(pulse)
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.emissiveIntensity = nodeId === selectedIdRef.current || nodeId === hoveredIdRef.current ? 0.95 : 0.55
        }
      })
      linkLines.forEach((line) => {
        const nodeId = String(line.userData.nodeId ?? '')
        const mesh = nodeMeshes.find((candidate) => candidate.userData.nodeId === nodeId)
        const position = line.geometry.getAttribute('position') as THREE.BufferAttribute
        if (mesh) {
          position.setXYZ(0, 0, 0, 0)
          position.setXYZ(1, mesh.position.x, mesh.position.y, mesh.position.z)
          position.needsUpdate = true
        }
        const material = line.material
        if (material instanceof THREE.LineBasicMaterial) {
          material.opacity = nodeId === selectedIdRef.current || nodeId === hoveredIdRef.current ? 0.45 : 0.12
        }
      })
      sparkMeshes.forEach((spark) => {
        const radius = Number(spark.userData.radius ?? 2)
        const angle = Number(spark.userData.angle ?? 0) + elapsed * Number(spark.userData.speed ?? 0.3)
        spark.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle * 1.7) * 0.22,
          Math.sin(angle) * radius,
        )
      })
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', setSize)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      renderer.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
        if (object instanceof THREE.Sprite) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
        if (object instanceof THREE.Points) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
        if (object instanceof THREE.Line) {
          object.geometry.dispose()
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })
      logoTexture.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [nodes])

  const legendItems: Array<{
    kind: ConstellationNode['kind']
    label: string
    icon: typeof Route03Icon
  }> = [
    { kind: 'starred', label: t('dashboard.constellation.legend.starred'), icon: StarIcon },
    { kind: 'roadmap', label: t('dashboard.constellation.legend.roadmaps'), icon: Route03Icon },
    { kind: 'course', label: t('dashboard.constellation.legend.courses'), icon: CourseIcon },
    { kind: 'ai', label: t('dashboard.constellation.legend.ai'), icon: AiMagicIcon },
  ]

  return (
    <section className="relative min-h-[34rem] overflow-hidden rounded-none border-y border-[#1f3328] bg-[#07110c] text-white shadow-[inset_0_0_120px_rgba(29,185,84,0.12)]">
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute left-5 top-5 z-10 grid max-w-sm gap-3 rounded-2xl border border-white/15 bg-black/45 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-md sm:left-7 sm:top-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1ed760]">{t('dashboard.constellation.overline')}</p>
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold text-white">
            {previewNode?.title ?? t('dashboard.constellation.emptyTitle')}
          </h2>
          <p className="mt-1 text-sm capitalize text-white/70">
            {previewNode ? `${kindLabels[previewNode.kind]} / ${previewNode.detail}` : t('dashboard.constellation.emptyDetail')}
          </p>
        </div>
        {selectedNode ? (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              <span>{t('dashboard.constellation.selectedProgress')}</span>
              <span className="text-white">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-(--gd-primary)" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(180deg,transparent,rgba(7,17,12,0.94))] px-5 py-5 sm:px-7">
        <div className="flex flex-wrap justify-center gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
          {legendItems.map((item) => (
            <span key={item.kind} className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/40 px-3 py-1.5 text-white backdrop-blur-md">
              <HugeiconsIcon
                icon={item.icon}
                size={15}
                className={item.kind === 'starred' ? 'star-toggle-icon star-toggle-icon-active' : undefined}
                style={{ color: item.kind === 'starred' ? '#1db954' : palette[item.kind] }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
