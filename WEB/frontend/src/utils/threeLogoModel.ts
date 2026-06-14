import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type LogoModelOptions = {
  parent: THREE.Object3D
  size: number
  position?: THREE.Vector3
  rotation?: THREE.Euler
}

type AnimatedModelOptions = LogoModelOptions & {
  url: string
  tintColor?: string
  tintStrength?: number
  paletteColors?: string[]
  userData?: Record<string, unknown>
}

export type LogoModelHandle = {
  group: THREE.Group
  update: (delta: number) => void
  dispose: () => void
}

const LOGO_MODEL_URL = '/blender/logo_3d_model_v1_animated.glb'

function normalizeModel(model: THREE.Object3D, targetSize: number) {
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDimension = Math.max(size.x, size.y, size.z, 1)
  const scale = targetSize / maxDimension

  model.scale.setScalar(scale)
  model.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
}

function disposeObjectMaterials(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}

function tintMaterial(material: THREE.Material, tintColor: string, strength: number) {
  if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
    const color = new THREE.Color(tintColor)

    material.color.lerp(color, strength)

    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive.lerp(color, Math.min(0.5, strength * 0.45))
      material.emissiveIntensity = Math.max(material.emissiveIntensity, strength * 0.28)
    }

    material.needsUpdate = true
  }
}

function cloneMaterial(material: THREE.Material) {
  return material.clone()
}

export function addAnimatedGltfModel({
  parent,
  size,
  url,
  tintColor,
  tintStrength = 0.72,
  paletteColors,
  userData,
  position = new THREE.Vector3(),
  rotation = new THREE.Euler(),
}: AnimatedModelOptions): LogoModelHandle {
  const group = new THREE.Group()
  const mixers: THREE.AnimationMixer[] = []
  const loader = new GLTFLoader()
  let isDisposed = false

  if (userData) {
    Object.assign(group.userData, userData)
  }

  group.position.copy(position)
  group.rotation.copy(rotation)
  parent.add(group)

  loader.load(url, (gltf) => {
    if (isDisposed) {
      disposeObjectMaterials(gltf.scene)
      return
    }

    const model = gltf.scene
    let meshIndex = 0

    normalizeModel(model, size)
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const color = paletteColors?.[meshIndex % paletteColors.length] ?? tintColor

        object.frustumCulled = false
        object.castShadow = false
        object.receiveShadow = false
        if (userData) {
          Object.assign(object.userData, userData)
        }

        if (Array.isArray(object.material)) {
          object.material = object.material.map(cloneMaterial)
        } else {
          object.material = cloneMaterial(object.material)
        }

        if (color) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => tintMaterial(material, color, paletteColors ? 1 : tintStrength))
          } else {
            tintMaterial(object.material, color, paletteColors ? 1 : tintStrength)
          }
        }
        meshIndex += 1
      } else if (userData) {
        Object.assign(object.userData, userData)
      }
    })

    group.add(model)

    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model)
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play()
      })
      mixers.push(mixer)
    }
  })

  return {
    group,
    update(delta) {
      mixers.forEach((mixer) => mixer.update(delta))
    },
    dispose() {
      isDisposed = true
      parent.remove(group)
      mixers.forEach((mixer) => mixer.stopAllAction())
      disposeObjectMaterials(group)
    },
  }
}

export function addAnimatedLogoModel(options: LogoModelOptions): LogoModelHandle {
  return addAnimatedGltfModel({
    ...options,
    url: LOGO_MODEL_URL,
    paletteColors: ['#13d7b1', '#35d76f', '#b8ef54'],
  })
}
