import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HugeiconsIcon } from '@hugeicons/react'
import { AiMagicIcon, CourseIcon, Route03Icon, StarIcon } from '@hugeicons/core-free-icons'
import * as THREE from 'three'
import { useTheme } from '../../context/ThemeContext'
import { addAnimatedGltfModel, addAnimatedLogoModel } from '../../utils/threeLogoModel'
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
  starred: '#1db954',
  roadmap: '#4da3ff',
  course: '#f08f45',
  ai: '#8b5cf6',
}

const nodeModelUrls: Record<ConstellationNode['kind'], string> = {
  starred: '/blender/star_premium_animated.glb',
  roadmap: '/blender/roadmaps_premium_animated.glb',
  course: '/blender/courses_premium_sharp_edges_v2.glb',
  ai: '/blender/ai_premium_double_sparkle.glb',
}

const nodeModelSettings: Record<ConstellationNode['kind'], {
  rotation: THREE.Euler
  size: number
  spin: number
  tintStrength: number
}> = {
  starred: {
    rotation: new THREE.Euler(Math.PI / 2, 0, 0),
    size: 0.72,
    spin: 0,
    tintStrength: 0.88,
  },
  roadmap: {
    rotation: new THREE.Euler(0.18, -0.2, 0),
    size: 0.62,
    spin: 0.35,
    tintStrength: 0.76,
  },
  course: {
    rotation: new THREE.Euler(0.16, -0.18, 0),
    size: 0.58,
    spin: 0.25,
    tintStrength: 0.74,
  },
  ai: {
    rotation: new THREE.Euler(0.12, -0.14, 0),
    size: 0.7,
    spin: 0.18,
    tintStrength: 1,
  },
}

const SCENE_OFFSET_X = -0.08
const SCENE_OFFSET_Y = 1
const SCENE_SCALE = 0.6
const CAMERA_START_X = 1
const CAMERA_START_Y = -1.25
const CAMERA_START_Z = 7.6
const INITIAL_YAW = -0.28
const INITIAL_PITCH = 0.46

const sceneThemes = {
  dark: {
    shellBg: '#07110c',
    shellText: '#ffffff',
    shellMuted: 'rgba(255,255,255,0.72)',
    border: '#1f3328',
    panelBg: 'rgba(0,0,0,0.46)',
    panelBorder: 'rgba(255,255,255,0.15)',
    legendGradient: 'linear-gradient(180deg, rgba(7,17,12,0.94), transparent)',
    shadow: 'inset 0 0 120px rgba(29,185,84,0.12)',
    fog: '#111511',
    particle: '#1db954',
    particleOpacity: 0.42,
    ring: '#2c2c2c',
    ringOpacity: 0.9,
    core: '#1db954',
    spark: '#ffffff',
    ambient: 1.4,
    pointIntensity: 18,
  },
  light: {
    shellBg: '#f7fbf6',
    shellText: '#0d1510',
    shellMuted: 'rgba(13,21,16,0.68)',
    border: '#d5eadc',
    panelBg: 'rgba(255,255,255,0.76)',
    panelBorder: 'rgba(29,185,84,0.22)',
    legendGradient: 'linear-gradient(180deg, rgba(247,251,246,0.96), transparent)',
    shadow: 'inset 0 0 120px rgba(29,185,84,0.09)',
    fog: '#dcefe3',
    particle: '#168f43',
    particleOpacity: 0.32,
    ring: '#a8d6b7',
    ringOpacity: 0.54,
    core: '#169b48',
    spark: '#103818',
    ambient: 1.85,
    pointIntensity: 11,
  },
} as const

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
  const { t, i18n } = useTranslation()
  const { resolvedTheme } = useTheme()
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
  const sceneTheme = sceneThemes[resolvedTheme]
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? nodes[0]
  const hoveredNode = nodes.find((node) => node.id === hoveredId) ?? null
  const previewNode = hoveredNode ?? selectedNode
  const progress = Math.min(100, Math.max(0, Math.round(selectedNode?.progress ?? 0)))
  const isRtl = i18n.dir() === 'rtl'

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
    scene.fog = new THREE.Fog(sceneTheme.fog, 6, 13)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(CAMERA_START_X, CAMERA_START_Y, CAMERA_START_Z)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    mount.appendChild(renderer.domElement)

    const root = new THREE.Group()
    root.position.set(SCENE_OFFSET_X, SCENE_OFFSET_Y, 0.9)
    root.scale.setScalar(SCENE_SCALE)
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
        color: sceneTheme.particle,
        size: 0.018,
        transparent: true,
        opacity: sceneTheme.particleOpacity,
        depthWrite: false,
      }),
    )
    scene.add(particles)

    const ambientLight = new THREE.AmbientLight(0xffffff, sceneTheme.ambient)
    scene.add(ambientLight)
    const pointLight = new THREE.PointLight(sceneTheme.core, sceneTheme.pointIntensity, 9)
    pointLight.position.set(1.6, 2.5, 2.5)
    scene.add(pointLight)

    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 32, 24),
      new THREE.MeshBasicMaterial({
        color: sceneTheme.core,
        transparent: true,
        opacity: resolvedTheme === 'dark' ? 0.16 : 0.12,
        depthWrite: false,
      }),
    )
    root.add(coreGlow)

    const pulseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.06, 0.012, 10, 96),
      new THREE.MeshBasicMaterial({
        color: sceneTheme.core,
        transparent: true,
        opacity: resolvedTheme === 'dark' ? 0.52 : 0.38,
      }),
    )
    pulseRing.rotation.x = Math.PI / 2
    root.add(pulseRing)

    const logoModel = addAnimatedLogoModel({
      parent: root,
      size: 1.18,
      position: new THREE.Vector3(0, 0.02, 0.24),
      rotation: new THREE.Euler(0.08, -0.18, 0),
    })

    const nodeMeshes: THREE.Mesh[] = []
    const nodeModels: ReturnType<typeof addAnimatedGltfModel>[] = []
    const pickableObjects: THREE.Object3D[] = []
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
          color: sceneTheme.ring,
          transparent: true,
          opacity: sceneTheme.ringOpacity,
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
      const modelSettings = nodeModelSettings[node.kind]
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(size, 24, 18),
        new THREE.MeshBasicMaterial({
          color: palette[node.kind],
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      )
      mesh.position.copy(nodePosition(indexOnRing, countOnRing, node.radius))
      mesh.userData.nodeId = node.id
      mesh.userData.radius = node.radius
      mesh.userData.baseAngle = baseAngle
      mesh.userData.orbitSpeed = 0.07 + indexOnRing * 0.012 + node.radius * 0.006
      mesh.userData.wavePhase = indexOnRing * 1.9 + node.radius
      nodeMeshes.push(mesh)
      pickableObjects.push(mesh)
      root.add(mesh)

      const nodeModel = addAnimatedGltfModel({
        parent: root,
        url: nodeModelUrls[node.kind],
        size: modelSettings.size,
        position: mesh.position.clone(),
        rotation: modelSettings.rotation,
        tintColor: palette[node.kind],
        tintStrength: modelSettings.tintStrength,
        userData: { nodeId: node.id },
      })
      nodeModel.group.userData.baseScale = 1
      nodeModel.group.userData.baseRotationX = modelSettings.rotation.x
      nodeModel.group.userData.baseRotationY = modelSettings.rotation.y
      nodeModel.group.userData.baseRotationZ = modelSettings.rotation.z
      nodeModel.group.userData.spin = modelSettings.spin
      nodeModels.push(nodeModel)
      pickableObjects.push(nodeModel.group)

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
          color: index % 2 === 0 ? sceneTheme.core : sceneTheme.spark,
          transparent: true,
          opacity: resolvedTheme === 'dark' ? 0.6 : 0.5,
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
      yaw: INITIAL_YAW,
      pitch: INITIAL_PITCH,
      zoom: CAMERA_START_Z,
    }
    const sceneMetrics = {
      targetY: SCENE_OFFSET_Y,
      cameraY: CAMERA_START_Y,
      minZoom: 5.6,
      maxZoom: 9.2,
    }

    const setSize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      const isCompact = width < 520
      const isTablet = width < 760
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isCompact ? 1.35 : 2))
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.fov = isCompact ? 48 : isTablet ? 43 : 38
      camera.updateProjectionMatrix()
      root.scale.setScalar(isCompact ? 0.38 : isTablet ? 0.48 : SCENE_SCALE)
      sceneMetrics.targetY = isCompact ? 0.16 : isTablet ? 0.55 : SCENE_OFFSET_Y
      sceneMetrics.cameraY = isCompact ? -0.45 : isTablet ? -0.82 : CAMERA_START_Y
      sceneMetrics.minZoom = isCompact ? 6.4 : 5.6
      sceneMetrics.maxZoom = isCompact ? 10.4 : 9.2
      root.position.set(SCENE_OFFSET_X, sceneMetrics.targetY, isCompact ? 0.45 : 0.9)
      pointerState.zoom = Math.max(sceneMetrics.minZoom, Math.min(sceneMetrics.maxZoom, pointerState.zoom))
    }

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    const pickNodeId = (event: PointerEvent) => {
      updatePointer(event)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(pickableObjects, true)[0]
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
      const hit = raycaster.intersectObjects(pickableObjects, true)[0]
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
      pointerState.zoom = Math.max(sceneMetrics.minZoom, Math.min(sceneMetrics.maxZoom, pointerState.zoom + event.deltaY * 0.005))
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', setSize)
    const resizeObserver = new ResizeObserver(setSize)
    resizeObserver.observe(mount)
    setSize()

    let frameId = 0
    const clock = new THREE.Clock()
    const animate = () => {
      const delta = clock.getDelta()
      const elapsed = clock.elapsedTime
      root.rotation.y = pointerState.yaw + elapsed * 0.08
      root.rotation.x = pointerState.pitch
      logoModel.update(delta)
      logoModel.group.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.025)
      coreGlow.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.04)
      pulseRing.scale.setScalar(1 + Math.sin(elapsed * 2.2) * 0.1)
      pulseRing.rotation.z = elapsed * 0.35
      particles.rotation.y = elapsed * 0.025
      particles.rotation.x = Math.sin(elapsed * 0.18) * 0.08
      camera.position.z += (pointerState.zoom - camera.position.z) * 0.08
      camera.position.y += (sceneMetrics.cameraY - camera.position.y) * 0.08
      camera.lookAt(SCENE_OFFSET_X, sceneMetrics.targetY, 0)
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

        const nodeModel = nodeModels[index]
        if (nodeModel) {
          const modelPulse = 1 + Math.sin(elapsed * 2.8 + index) * 0.07
          const spin = Number(nodeModel.group.userData.spin ?? 0)
          nodeModel.update(delta)
          nodeModel.group.position.copy(mesh.position)
          nodeModel.group.position.y += 0.02
          nodeModel.group.position.z += 0.2
          nodeModel.group.scale.setScalar(activeScale * modelPulse)
          nodeModel.group.rotation.set(
            Number(nodeModel.group.userData.baseRotationX ?? 0),
            Number(nodeModel.group.userData.baseRotationY ?? 0) + Math.sin(elapsed * 0.8 + index) * spin,
            Number(nodeModel.group.userData.baseRotationZ ?? 0) + Math.sin(elapsed * 1.2 + index) * 0.06,
          )
        }

        mesh.rotation.y = elapsed * 0.7 + index
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
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      logoModel.dispose()
      nodeModels.forEach((nodeModel) => nodeModel.dispose())
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
      mount.removeChild(renderer.domElement)
    }
  }, [nodes, resolvedTheme, sceneTheme])

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
    <section
      className="relative min-h-130 overflow-hidden rounded-none border-y sm:min-h-136"
      style={{
        borderColor: sceneTheme.border,
        background: sceneTheme.shellBg,
        color: sceneTheme.shellText,
        boxShadow: sceneTheme.shadow,
      }}
    >
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
      <div
        className={`pointer-events-none absolute inset-x-4 top-24 z-10 grid max-w-[calc(100%-2rem)] gap-2 rounded-squircle border p-3 shadow-lg backdrop-blur-md sm:inset-x-auto sm:top-16 sm:max-w-sm sm:p-6 ${isRtl ? 'text-right sm:right-7' : 'text-left sm:left-7'}`}
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{
          borderColor: sceneTheme.panelBorder,
          background: sceneTheme.panelBg,
          color: sceneTheme.shellText,
          boxShadow: resolvedTheme === 'dark' ? '0 24px 70px rgba(0,0,0,0.32)' : '0 24px 70px rgba(41,92,57,0.14)',
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--accent) sm:text-xs sm:tracking-[0.22em]">{t('dashboard.constellation.overline')}</p>
        <div className="min-w-0">
          <h2 className="wrap-break-word text-base font-semibold leading-6 sm:text-2xl sm:leading-8" style={{ color: sceneTheme.shellText }}>
            {previewNode?.title ?? t('dashboard.constellation.emptyTitle')}
          </h2>
          <p className="mt-1 line-clamp-2 wrap-break-word text-xs capitalize sm:text-sm" style={{ color: sceneTheme.shellMuted }}>
            {previewNode ? `${kindLabels[previewNode.kind]} / ${previewNode.detail}` : t('dashboard.constellation.emptyDetail')}
          </p>
        </div>
        {selectedNode ? (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.14em]" style={{ color: sceneTheme.shellMuted }}>
              <span>{t('dashboard.constellation.selectedProgress')}</span>
              <span style={{ color: sceneTheme.shellText }}>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full" style={{ background: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(13,21,16,0.12)' }}>
              <div
                className="h-full rounded-full bg-(--gd-primary)"
                style={{
                  width: `${progress}%`,
                  marginInlineStart: isRtl ? 'auto' : undefined,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 py-4 sm:px-7 sm:py-5" style={{ background: sceneTheme.legendGradient }}>
        <div className={`flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] sm:gap-2 sm:text-xs sm:tracking-[0.12em] ${isRtl ? 'justify-start' : 'justify-end'}`} dir={isRtl ? 'rtl' : 'ltr'}>
          {legendItems.map((item) => (
            <span
              key={item.kind}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-md sm:gap-2 sm:px-3 sm:py-1.5"
              style={{
                borderColor: sceneTheme.panelBorder,
                background: sceneTheme.panelBg,
                color: sceneTheme.shellText,
              }}
            >
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
