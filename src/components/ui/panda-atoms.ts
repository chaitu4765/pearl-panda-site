import * as THREE from 'three'

type Surface = {
  mesh: THREE.Mesh
  distribution: Float32Array
  area: number
  cumulativeArea: number
  color: THREE.Color
}

const smoothstep = (value: number, from: number, to: number) => THREE.MathUtils.smoothstep(value, from, to)

/** Samples the actual transformed sculpture, so its atoms retain the brand's colors and shape. */
export function createPandaAtoms(sculpture: THREE.Group, count: number) {
  let seed = 4765
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const triangle = new THREE.Triangle(a, b, c)
  const surfaces: Surface[] = []
  const solidMaterials = new Set<THREE.Material>()
  const dissolve = { value: 0 }
  let totalArea = 0
  sculpture.updateMatrixWorld(true)

  // A shared deterministic dissolve also runs in the shadow pass. The remaining
  // solid does not leave a full panda-shaped shadow behind the dispersing atoms.
  const decorateMaterial = (material: THREE.Material) => {
    material.onBeforeCompile = shader => {
      shader.uniforms.uPandaDissolve = dissolve
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
        varying vec3 vPandaAtomPosition;`)
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vPandaAtomPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`)
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
        uniform float uPandaDissolve;
        varying vec3 vPandaAtomPosition;`)
      shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        if (uPandaDissolve > 0.0) {
          vec3 cell = floor(vPandaAtomPosition * 17.0);
          float grain = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          if (grain < uPandaDissolve) discard;
        }`)
    }
    material.customProgramCacheKey = () => 'pearl-panda-atom-dissolve-v1'
    material.needsUpdate = true
  }
  const depthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })
  decorateMaterial(depthMaterial)

  sculpture.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return
    const geometry = object.geometry
    const positions = geometry.getAttribute('position')
    const indices = geometry.index
    const faceCount = (indices ? indices.count : positions.count) / 3
    const distribution = new Float32Array(faceCount)
    let area = 0
    for (let face = 0; face < faceCount; face++) {
      const offset = face * 3
      a.fromBufferAttribute(positions, indices ? indices.getX(offset) : offset).applyMatrix4(object.matrixWorld)
      b.fromBufferAttribute(positions, indices ? indices.getX(offset + 1) : offset + 1).applyMatrix4(object.matrixWorld)
      c.fromBufferAttribute(positions, indices ? indices.getX(offset + 2) : offset + 2).applyMatrix4(object.matrixWorld)
      area += triangle.getArea()
      distribution[face] = area
    }
    const material = Array.isArray(object.material) ? object.material[0] : object.material
    const color = 'color' in material && material.color instanceof THREE.Color ? material.color.clone() : new THREE.Color('#f8f8e9')
    totalArea += area
    surfaces.push({ mesh: object, distribution, area, cumulativeArea: totalArea, color })
    ;(Array.isArray(object.material) ? object.material : [object.material]).forEach(item => solidMaterials.add(item))
    object.customDepthMaterial = depthMaterial
  })
  solidMaterials.forEach(decorateMaterial)

  const origins = new Float32Array(count * 3)
  const targets = new Float32Array(count * 3)
  const phases = new Float32Array(count)
  const radii = new Float32Array(count)
  const mesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshPhysicalMaterial({ roughness: 0.24, metalness: 0.075, clearcoat: 0.7, clearcoatRoughness: 0.17, iridescence: 0.16 }),
    count,
  )
  mesh.name = 'Pearl Panda surface atoms'
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  mesh.frustumCulled = false
  mesh.visible = false
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const color = new THREE.Color()

  for (let index = 0; index < count; index++) {
    const selection = random() * totalArea
    const surface = surfaces.find(item => item.cumulativeArea >= selection) ?? surfaces[surfaces.length - 1]
    const faceSelection = random() * surface.area
    let low = 0
    let high = surface.distribution.length - 1
    while (low < high) {
      const middle = (low + high) >>> 1
      if (surface.distribution[middle] < faceSelection) low = middle + 1
      else high = middle
    }
    const positions = surface.mesh.geometry.getAttribute('position')
    const indices = surface.mesh.geometry.index
    const offset = low * 3
    a.fromBufferAttribute(positions, indices ? indices.getX(offset) : offset)
    b.fromBufferAttribute(positions, indices ? indices.getX(offset + 1) : offset + 1)
    c.fromBufferAttribute(positions, indices ? indices.getX(offset + 2) : offset + 2)
    const root = Math.sqrt(random())
    const barycentric = random()
    position.copy(a).multiplyScalar(1 - root).addScaledVector(b, root * (1 - barycentric)).addScaledVector(c, root * barycentric)
    position.applyMatrix4(surface.mesh.matrixWorld).toArray(origins, index * 3)
    const angle = random() * Math.PI * 2
    const ribbon = random()
    const radius = 0.58 + Math.pow(ribbon, 0.55) * 1.15
    targets[index * 3] = Math.cos(angle) * radius - 0.08
    targets[index * 3 + 1] = Math.sin(angle) * radius * 0.88 + 0.37
    targets[index * 3 + 2] = Math.sin(angle * 2.0 + ribbon * 3.0) * 0.55 + (random() - 0.5) * 0.48
    phases[index] = random() * Math.PI * 2
    radii[index] = 0.023 + Math.pow(random(), 2) * 0.032
    // Tiny color variation preserves the sampled green/ivory while catching the light.
    color.copy(surface.color).multiplyScalar(0.9 + random() * 0.2)
    mesh.setColorAt(index, color)
    matrix.makeScale(0, 0, 0)
    matrix.setPosition(position)
    mesh.setMatrixAt(index, matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true

  return {
    mesh,
    update(amount: number, elapsed: number) {
      const progress = THREE.MathUtils.clamp(amount, 0, 1)
      dissolve.value = smoothstep(progress, 0.06, 0.68)
      sculpture.visible = progress < 0.68
      mesh.visible = progress > 0.002
      if (!mesh.visible) return
      const spread = smoothstep(progress, 0.08, 1)
      const spin = spread * 1.5
      const cos = Math.cos(spin)
      const sin = Math.sin(spin)
      const arc = Math.sin(spread * Math.PI)
      for (let index = 0; index < count; index++) {
        const offset = index * 3
        const phase = phases[index]
        const tx = targets[offset]
        const ty = targets[offset + 1] - 0.37
        const x = tx * cos - ty * sin
        const y = tx * sin + ty * cos + 0.37
        const drift = Math.sin(elapsed * 0.58 + phase) * 0.04 * spread
        position.set(
          THREE.MathUtils.lerp(origins[offset], x, spread) + Math.sin(phase) * arc * 0.22,
          THREE.MathUtils.lerp(origins[offset + 1], y, spread) + Math.cos(phase) * arc * 0.22 + drift,
          THREE.MathUtils.lerp(origins[offset + 2], targets[offset + 2], spread) + Math.sin(phase + spread * 4) * arc * 0.3,
        )
        const reveal = smoothstep(progress, (phase / (Math.PI * 2)) * 0.25, 0.38)
        const scale = radii[index] * reveal * (0.82 + spread * 0.18)
        matrix.makeScale(scale, scale, scale)
        matrix.setPosition(position)
        mesh.setMatrixAt(index, matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    },
    dispose() {
      // Geometry and the visible material are disposed by PandaScene's traversal.
      depthMaterial.dispose()
      mesh.dispose()
    },
  }
}
