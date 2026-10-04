import * as THREE from 'three'

type FloatingObject = { object: THREE.Object3D; origin: THREE.Vector3; phase: number }

/** A procedural, fully dimensional interpretation of the Pearl Panda brand mark. */
export function createPanda() {
  const root = new THREE.Group()
  const materials = {
    porcelain: new THREE.MeshPhysicalMaterial({ color: '#efefdd', roughness: 0.62, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.6 }),
    green: new THREE.MeshPhysicalMaterial({ color: '#073b2c', roughness: 0.64, metalness: 0, clearcoat: 0.08, clearcoatRoughness: 0.6 }),
    bamboo: new THREE.MeshPhysicalMaterial({ color: '#4f8c48', roughness: 0.59, clearcoat: 0.08, clearcoatRoughness: 0.55 }),
    node: new THREE.MeshPhysicalMaterial({ color: '#90b774', roughness: 0.44 }),
    leaf: new THREE.MeshPhysicalMaterial({ color: '#37703d', roughness: 0.62, clearcoat: 0.06, side: THREE.DoubleSide }),
    leafLight: new THREE.MeshPhysicalMaterial({ color: '#729150', roughness: 0.4, side: THREE.DoubleSide }),
    pupil: new THREE.MeshPhysicalMaterial({ color: '#071b13', roughness: 0.2, clearcoat: 0.35 }),
    shine: new THREE.MeshBasicMaterial({ color: '#fffef1' }),
    pad: new THREE.MeshPhysicalMaterial({ color: '#6c8a62', roughness: 0.5 }),
  }
  const sphereGeometry = new THREE.SphereGeometry(1, 48, 32)
  const sphere = (parent: THREE.Object3D, material: THREE.Material, position: number[], scale: number[], rotation = 0) => {
    const mesh = new THREE.Mesh(sphereGeometry, material)
    mesh.position.set(position[0], position[1], position[2])
    mesh.scale.set(scale[0], scale[1], scale[2])
    mesh.rotation.z = rotation
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  const curve = (parent: THREE.Object3D, points: number[][], radius: number, material: THREE.Material, segments = 32) => {
    const path = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point as [number, number, number])))
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, segments, radius, 12, false), material)
    mesh.castShadow = true
    mesh.receiveShadow = true
    parent.add(mesh)
    return mesh
  }
  const leaf = (parent: THREE.Object3D, position: number[], length: number, width: number, angle: number, twist = 0) => {
    const group = new THREE.Group()
    group.position.set(position[0], position[1], position[2])
    group.rotation.set(twist, 0.15, angle)
    const positions: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    const slices = 18
    const across = 6
    for (let i = 0; i <= slices; i++) {
      const t = i / slices
      const halfWidth = Math.pow(Math.sin(Math.PI * t), 0.85) * width * 0.5
      for (let j = 0; j <= across; j++) {
        const u = (j / across) * 2 - 1
        positions.push(t * length, halfWidth * u, Math.sin(Math.PI * t) * 0.07 * (1 - Math.abs(u)) + t * t * 0.12)
        uvs.push(t, j / across)
        if (i < slices && j < across) {
          const a = i * (across + 1) + j
          const b = a + across + 1
          indices.push(a, b, a + 1, b, b + 1, a + 1)
        }
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    const mesh = new THREE.Mesh(geometry, materials.leaf)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    curve(group, [[0, 0, 0.004], [length * 0.45, 0, 0.096], [length * 0.9, 0, 0.115]], 0.007, materials.leafLight, 16)
    parent.add(group)
    return group
  }

  // A slightly tilted, hand-glazed bamboo stem gives the mascot its familiar silhouette.
  const bamboo = new THREE.Group()
  bamboo.position.set(-0.77, -0.02, 0.03)
  bamboo.rotation.z = 0.13
  root.add(bamboo)
  for (let i = 0; i < 6; i++) {
    const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.125 + i * 0.003, 0.137 + i * 0.003, 0.565, 32), materials.bamboo)
    cylinder.position.y = -1.44 + i * 0.56
    cylinder.castShadow = true
    cylinder.receiveShadow = true
    bamboo.add(cylinder)
    const node = new THREE.Mesh(new THREE.TorusGeometry(0.143 + i * 0.002, 0.025, 10, 32), materials.node)
    node.position.y = -1.69 + i * 0.56
    node.rotation.x = Math.PI / 2
    node.castShadow = true
    bamboo.add(node)
  }
  curve(bamboo, [[0, 1.45, 0], [0.16, 1.79, 0], [0.31, 2.17, -0.03]], 0.025, materials.bamboo)
  curve(bamboo, [[0, 0.58, 0], [-0.4, 0.89, 0.01], [-0.73, 1.13, -0.02]], 0.023, materials.bamboo)
  curve(bamboo, [[0, -0.2, 0], [-0.34, -0.14, 0.03], [-0.73, -0.27, 0.04]], 0.021, materials.bamboo)
  const leaves = [
    leaf(bamboo, [0.24, 2.0, 0], 0.76, 0.3, 1.08, 0.18),
    leaf(bamboo, [0.13, 1.79, 0], 0.82, 0.29, 0.36, -0.25),
    leaf(bamboo, [-0.02, 1.37, 0], 0.86, 0.34, 2.09, 0.2),
    leaf(bamboo, [-0.35, 0.88, 0], 0.75, 0.31, 2.08, -0.15),
    leaf(bamboo, [-0.58, 1.04, 0], 0.65, 0.28, 2.65, 0.35),
    leaf(bamboo, [-0.3, -0.17, 0.02], 0.92, 0.36, 3.71, -0.12),
    leaf(bamboo, [-0.58, -0.23, 0.03], 0.71, 0.3, 2.86, 0.32),
    leaf(bamboo, [-0.11, -0.2, 0.07], 0.59, 0.23, 4.65, -0.35),
  ]

  // Every visible part is a volume, including the facial patches and tiny eye glints.
  sphere(root, materials.porcelain, [0.1, -0.53, -0.04], [0.66, 0.84, 0.55], -0.13)
  sphere(root, materials.porcelain, [0.67, -0.73, -0.34], [0.22, 0.23, 0.21])
  sphere(root, materials.green, [-0.34, -1.03, 0.04], [0.35, 0.44, 0.39], -0.28)
  sphere(root, materials.green, [-0.34, -1.31, 0.28], [0.4, 0.24, 0.45], -0.1)
  sphere(root, materials.green, [0.57, -0.94, 0.22], [0.45, 0.52, 0.48], -0.18)
  sphere(root, materials.green, [0.42, -1.31, 0.5], [0.44, 0.25, 0.42], -0.16)
  sphere(root, materials.pad, [0.42, -1.33, 0.865], [0.19, 0.115, 0.016], -0.13)
  for (let i = 0; i < 3; i++) {
    sphere(root, materials.pad, [0.24 + i * 0.145, -1.18 + Math.sin(i) * 0.035, 0.839], [0.048, 0.048, 0.02])
  }
  curve(root, [[-0.12, -0.32, -0.17], [-0.59, -0.1, -0.18], [-0.89, 0.07, 0.01]], 0.205, materials.green)
  sphere(root, materials.green, [-0.89, 0.1, 0.06], [0.21, 0.22, 0.23])

  const head = new THREE.Group()
  head.position.set(0.28, 0.65, 0.15)
  head.rotation.z = -0.19
  root.add(head)
  sphere(head, materials.green, [-0.63, 0.59, -0.04], [0.31, 0.32, 0.24], 0.22)
  sphere(head, materials.green, [0.67, 0.52, -0.03], [0.31, 0.32, 0.24], -0.22)
  sphere(head, materials.porcelain, [0, 0, 0], [0.84, 0.76, 0.65])
  sphere(head, materials.green, [-0.29, 0.03, 0.573], [0.195, 0.262, 0.11], -0.35)
  sphere(head, materials.green, [0.29, 0.03, 0.573], [0.195, 0.262, 0.11], 0.35)
  sphere(head, materials.pupil, [-0.245, 0.054, 0.678], [0.075, 0.087, 0.029])
  sphere(head, materials.pupil, [0.245, 0.054, 0.678], [0.075, 0.087, 0.029])
  sphere(head, materials.shine, [-0.266, 0.083, 0.704], [0.025, 0.028, 0.012])
  sphere(head, materials.shine, [0.224, 0.083, 0.704], [0.025, 0.028, 0.012])
  sphere(head, materials.shine, [-0.22, 0.025, 0.705], [0.009, 0.01, 0.006])
  sphere(head, materials.shine, [0.27, 0.025, 0.705], [0.009, 0.01, 0.006])
  sphere(head, materials.porcelain, [-0.076, -0.224, 0.608], [0.145, 0.105, 0.075])
  sphere(head, materials.porcelain, [0.076, -0.224, 0.608], [0.145, 0.105, 0.075])
  sphere(head, materials.green, [0, -0.175, 0.701], [0.081, 0.052, 0.033])
  curve(head, [[0, -0.2, 0.71], [0, -0.26, 0.696], [-0.056, -0.293, 0.676], [-0.104, -0.27, 0.669]], 0.011, materials.green, 18)
  curve(head, [[0, -0.26, 0.696], [0.056, -0.293, 0.676], [0.104, -0.27, 0.669]], 0.011, materials.green, 18)
  curve(root, [[0.65, -0.09, 0.25], [0.23, -0.24, 0.59], [-0.28, -0.14, 0.63], [-0.74, 0.22, 0.4]], 0.22, materials.green, 40)
  sphere(root, materials.green, [-0.76, 0.25, 0.38], [0.24, 0.26, 0.22], -0.25)

  const floaters: FloatingObject[] = []
  const pearlMaterial = new THREE.MeshPhysicalMaterial({ color: '#edf0cf', roughness: 0.16, metalness: 0.1, clearcoat: 0.9, iridescence: 0.5, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 300] })
  ;[
    [-1.74, -0.97, 0.25, 0.105],
    [1.4, 0.95, -0.2, 0.17],
    [1.25, -0.78, 0.15, 0.07],
    [-1.45, 1.83, -0.4, 0.065],
  ].forEach((position, index) => {
    const object = sphere(root, pearlMaterial, position.slice(0, 3), [position[3], position[3], position[3]])
    floaters.push({ object, origin: object.position.clone(), phase: index * 1.8 })
  })
  return { root, head, leaves, floaters }
}
