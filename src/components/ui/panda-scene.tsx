import { useEffect, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createPandaAtoms } from './panda-atoms'
import { createPanda } from './panda-model'

type PandaSceneProps = {
  className?: string
  reducedMotion?: boolean
  scene?: number
  atomizationRef?: RefObject<number>
}


export default function PandaScene({ className = '', reducedMotion = false, scene = 0, atomizationRef }: PandaSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef(scene)
  const reducedMotionRef = useRef(reducedMotion)
  const atomizationSourceRef = useRef(atomizationRef)
  const wakeRef = useRef<() => void>(() => {})
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => { sceneRef.current = scene; wakeRef.current() }, [scene])
  useEffect(() => { reducedMotionRef.current = reducedMotion; wakeRef.current() }, [reducedMotion])
  useEffect(() => { atomizationSourceRef.current = atomizationRef; wakeRef.current() }, [atomizationRef])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!canvas || !container) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
    } catch {
      setUnavailable(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.42
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const world = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
    camera.position.set(0, 0.55, 8.3)
    camera.lookAt(-0.2, 0.45, 0)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const environmentRoom = new RoomEnvironment()
    const environment = pmrem.fromScene(environmentRoom, 0.035)
    world.environment = environment.texture
    world.environmentIntensity = 0.7
    environmentRoom.dispose()
    pmrem.dispose()

    const key = new THREE.DirectionalLight('#fff9dc', 4)
    key.position.set(-3, 5, 5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -4
    key.shadow.camera.right = 4
    key.shadow.camera.top = 4
    key.shadow.camera.bottom = -4
    key.shadow.normalBias = 0.035
    key.shadow.bias = -0.0002
    key.shadow.radius = 5
    world.add(key)
    const fill = new THREE.DirectionalLight('#d0ebc5', 2)
    fill.position.set(3, 1, 4)
    world.add(fill)
    const rim = new THREE.DirectionalLight('#e8eecc', 3.5)
    rim.position.set(1, 3, -4)
    world.add(rim)
    world.add(new THREE.AmbientLight('#ffffff', 0.3))

    const panda = createPanda()
    const atoms = createPandaAtoms(panda.root, window.matchMedia('(max-width: 700px), (pointer: coarse)').matches ? 700 : 1450)
    const sculpture = new THREE.Group()
    sculpture.add(panda.root)
    sculpture.add(atoms.mesh)
    sculpture.rotation.y = -0.12
    world.add(sculpture)

    // A real shadow receiver anchors the floating porcelain sculpture to the page.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ color: '#16331f', opacity: 0.12 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.85
    floor.receiveShadow = true
    world.add(floor)

    const pointer = new THREE.Vector2()
    const currentPointer = new THREE.Vector2()
    const neutralPointer = new THREE.Vector2()
    let userRotation = 0
    let dragStart = 0
    let dragRotation = 0
    let dragging = false
    let visible = true
    let disposed = false
    let contextLost = false
    let frame = 0
    let lastTime = 0
    let elapsed = 0
    let displayedAtomization = 0
    const leafRotations = panda.leaves.map(object => object.rotation.z)
    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      // Portrait containers retain the whole bamboo silhouette without tiny desktops.
      camera.position.z = Math.max(8.3, 6.65 / camera.aspect)
      camera.updateProjectionMatrix()
      draw()
    }
    const draw = () => {
      if (!disposed && !contextLost) renderer.render(world, camera)
    }
    const onPointerMove = (event: PointerEvent) => {
      pointer.set((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2)
      if (dragging) {
        userRotation = dragRotation + (event.clientX - dragStart) * 0.008
        wakeRef.current()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      dragging = true
      dragStart = event.clientX
      dragRotation = userRotation
      canvas.setPointerCapture(event.pointerId)
      canvas.style.cursor = 'grabbing'
      wakeRef.current()
    }
    const onPointerUp = () => { dragging = false; canvas.style.cursor = 'grab' }
    const onPointerLeave = () => { pointer.set(0, 0) }
    const onReset = () => { userRotation = 0; pointer.set(0, 0); wakeRef.current() }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        userRotation += event.key === 'ArrowLeft' ? -0.22 : 0.22
        wakeRef.current()
      } else if (event.key === 'Home' || event.key === 'Escape') onReset()
    }
    const animate = (time: number) => {
      frame = 0
      if (disposed || !visible || document.hidden || contextLost) { lastTime = 0; return }
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0.016
      lastTime = time
      const reduced = reducedMotionRef.current
      const targetAtomization = reduced ? 0 : THREE.MathUtils.clamp(atomizationSourceRef.current?.current ?? 0, 0, 1)
      // Disperse with scroll, then rebuild within 200ms of arrival even when
      // scrolling stops. Increases are immediate so only atoms travel sideways.
      displayedAtomization = reduced || targetAtomization >= displayedAtomization
        ? targetAtomization : Math.max(targetAtomization, displayedAtomization - delta / .2)
      const atomization = displayedAtomization
      canvas.dataset.atomization = atomization.toFixed(4)
      if (!reduced) elapsed += delta
      const smooth = 1 - Math.exp(-delta * 4)
      currentPointer.lerp(reduced ? neutralPointer : pointer, smooth)
      const sceneRotations = [-0.12, 0.23, -0.2, 0.28, -0.16, 0.08]
      const restingRotation = (sceneRotations[sceneRef.current % sceneRotations.length] || 0) + userRotation
      const targetRotation = restingRotation + currentPointer.x * 0.18
      sculpture.rotation.y = THREE.MathUtils.lerp(sculpture.rotation.y, targetRotation, smooth)
      sculpture.rotation.x = THREE.MathUtils.lerp(sculpture.rotation.x, currentPointer.y * 0.055, smooth)
      sculpture.position.y = reduced ? 0 : Math.sin(elapsed * 1.1) * 0.055
      panda.head.rotation.z = -0.19 + (reduced ? 0 : Math.sin(elapsed * 0.65) * 0.016)
      panda.leaves.forEach((object, index) => {
        object.rotation.z = leafRotations[index] + (reduced ? 0 : Math.sin(elapsed * 1.3 + index * 0.6) * 0.025)
      })
      panda.floaters.forEach(({ object, origin, phase }) => {
        object.position.y = origin.y + (reduced ? 0 : Math.sin(elapsed * 0.8 + phase) * 0.09)
        object.position.x = origin.x + (reduced ? 0 : Math.cos(elapsed * 0.55 + phase) * 0.045)
      })
      atoms.update(atomization, elapsed)
      floor.material.opacity = 0.12 * (1 - atomization * 0.85)
      const settled = reduced
        && Math.abs(sculpture.rotation.y - restingRotation) < 0.0001
        && Math.abs(sculpture.rotation.x) < 0.0001
        && currentPointer.lengthSq() < 0.000001
      if (settled) {
        currentPointer.copy(neutralPointer)
        sculpture.rotation.y = restingRotation
        sculpture.rotation.x = 0
        lastTime = 0
      }
      draw()
      // Reduced motion renders only until user/scene rotation settles, then sleeps.
      if (!settled) frame = requestAnimationFrame(animate)
    }
    const resume = () => {
      if (!frame && visible && !document.hidden && !disposed && !contextLost) frame = requestAnimationFrame(animate)
    }
    wakeRef.current = resume
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0 } else resume()
    }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      contextLost = true
      cancelAnimationFrame(frame)
      frame = 0
      setUnavailable(true)
    }
    const onContextRestored = () => {
      contextLost = false
      setUnavailable(false)
      resize()
      resume()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    const observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true
      if (visible) resume()
      else { cancelAnimationFrame(frame); frame = 0; lastTime = 0 }
    }, { rootMargin: '100px' })
    observer.observe(container)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('dblclick', onReset)
    canvas.addEventListener('keydown', onKeyDown)
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    resize()
    resume()

    return () => {
      disposed = true
      wakeRef.current = () => {}
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('dblclick', onReset)
      canvas.removeEventListener('keydown', onKeyDown)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      world.traverse(object => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry)
          ;(Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material))
        }
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      atoms.dispose()
      environment.dispose()
      key.shadow.map?.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive 3D Pearl Panda: an ivory ceramic panda hugging green bamboo, dissolving into pearl-like atoms between scenes. Drag or use the left and right arrow keys to rotate. Double-click or press Home to reset."
        tabIndex={0}
        style={{ display: unavailable ? 'none' : 'block', width: '100%', height: '100%', cursor: 'grab', touchAction: 'pan-y' }}
      />
      {unavailable && (
        <img src="/media/logo.svg" alt="Pearl Panda hugging a leafy bamboo stem" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
      )}
    </div>
  )
}
