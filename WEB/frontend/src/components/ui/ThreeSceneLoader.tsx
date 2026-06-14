import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type ThreeSceneLoaderProps = {
  className?: string
  cycleDurationMs?: number
}

function cssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback

  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim()

  return value || fallback
}

function buildThemeColors() {
  return {
    accent: cssVar('--gd-primary', '#1db954'),
    accentHover: cssVar('--gd-primary-hover', '#1ed760'),
    text: cssVar('--text-h', '#ffffff'),
    border: cssVar('--border', '#282828'),
  }
}

export default function ThreeSceneLoader({ className = '', cycleDurationMs = 1500 }: ThreeSceneLoaderProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 7.2)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const root = new THREE.Group()
    root.scale.setScalar(0.72)
    scene.add(root)

    const colors = buildThemeColors()
    scene.fog = new THREE.Fog(colors.border, 7, 15)

    const ambient = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambient)

    const keyLight = new THREE.PointLight(colors.accent, 12, 8)
    keyLight.position.set(1.8, 2.2, 2.4)
    scene.add(keyLight)

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.64, 2),
      new THREE.MeshStandardMaterial({
        color: colors.accent,
        emissive: colors.accent,
        emissiveIntensity: 0.55,
        roughness: 0.32,
        metalness: 0.22,
      }),
    )
    root.add(core)

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 32, 20),
      new THREE.MeshBasicMaterial({
        color: colors.accent,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    )
    root.add(halo)

    const rings = [1.15, 1.65, 2.1].map((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.012, 10, 112),
        new THREE.MeshBasicMaterial({
          color: index === 1 ? colors.accentHover : colors.accent,
          transparent: true,
          opacity: 0.42 - index * 0.07,
          depthWrite: false,
        }),
      )
      ring.rotation.x = Math.PI / 2 + index * 0.34
      ring.rotation.y = index * 0.72
      root.add(ring)
      return ring
    })

    const dots = Array.from({ length: 24 }, (_, index) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(index % 4 === 0 ? 0.045 : 0.032, 12, 8),
        new THREE.MeshBasicMaterial({
          color: index % 3 === 0 ? colors.text : colors.accent,
          transparent: true,
          opacity: index % 3 === 0 ? 0.56 : 0.78,
        }),
      )
      mesh.userData.radius = 1.05 + (index % 8) * 0.16
      mesh.userData.angle = index * 0.74
      mesh.userData.speed = 0.58 + (index % 5) * 0.08
      root.add(mesh)
      return mesh
    })

    const particles = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          Array.from({ length: 170 }, () => [
            (Math.random() - 0.5) * 5.5,
            (Math.random() - 0.5) * 3.6,
            (Math.random() - 0.5) * 4.8,
          ]).flat(),
          3,
        ),
      ),
      new THREE.PointsMaterial({
        color: colors.accent,
        size: 0.018,
        transparent: true,
        opacity: 0.36,
        depthWrite: false,
      }),
    )
    scene.add(particles)

    const applyColors = () => {
      const nextColors = buildThemeColors()
      scene.fog = new THREE.Fog(nextColors.border, 7, 15)
      keyLight.color.set(nextColors.accent)
      if (core.material instanceof THREE.MeshStandardMaterial) {
        core.material.color.set(nextColors.accent)
        core.material.emissive.set(nextColors.accent)
      }
      if (halo.material instanceof THREE.MeshBasicMaterial) {
        halo.material.color.set(nextColors.accent)
      }
      rings.forEach((ring, index) => {
        if (ring.material instanceof THREE.MeshBasicMaterial) {
          ring.material.color.set(index === 1 ? nextColors.accentHover : nextColors.accent)
        }
      })
      dots.forEach((dot, index) => {
        if (dot.material instanceof THREE.MeshBasicMaterial) {
          dot.material.color.set(index % 3 === 0 ? nextColors.text : nextColors.accent)
        }
      })
      if (particles.material instanceof THREE.PointsMaterial) {
        particles.material.color.set(nextColors.accent)
      }
    }

    const setSize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    const observer = new MutationObserver(applyColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] })

    window.addEventListener('resize', setSize)
    setSize()

    let frameId = 0
    const clock = new THREE.Clock()
    const speed = 1500 / Math.max(cycleDurationMs, 300)
    const animate = () => {
      const elapsed = clock.getElapsedTime() * speed
      root.rotation.y = elapsed * 0.55
      root.rotation.x = Math.sin(elapsed * 0.65) * 0.18
      core.rotation.x = elapsed * 0.9
      core.rotation.y = elapsed * 1.15
      core.scale.setScalar(1 + Math.sin(elapsed * 2.7) * 0.04)
      halo.scale.setScalar(1.05 + Math.sin(elapsed * 2.2) * 0.1)

      rings.forEach((ring, index) => {
        ring.rotation.z = elapsed * (0.28 + index * 0.08)
        ring.scale.setScalar(1 + Math.sin(elapsed * 1.7 + index) * 0.035)
      })

      dots.forEach((dot) => {
        const radius = Number(dot.userData.radius ?? 1.4)
        const angle = Number(dot.userData.angle ?? 0) + elapsed * Number(dot.userData.speed ?? 0.6)
        dot.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle * 1.35) * 0.32,
          Math.sin(angle) * radius,
        )
      })

      particles.rotation.y = elapsed * 0.08
      particles.rotation.x = Math.sin(elapsed * 0.22) * 0.12
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener('resize', setSize)
      renderer.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
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
  }, [cycleDurationMs])

  return <div ref={mountRef} className={`absolute inset-0 ${className}`} aria-hidden="true" />
}
