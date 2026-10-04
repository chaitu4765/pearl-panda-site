import { useEffect, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createPanda } from './panda-model'

export type HorizonSceneProps = {
  progressRef: RefObject<number>
  reducedMotion?: boolean
  paused?: boolean
}

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value = Math.imul(1664525, value) + 1013904223 | 0
    return (value >>> 0) / 4294967296
  }
}

const planeVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** Three depth layers adapted from the supplied Horizon starfield. */
function createStars(count: number, layer: number, dpr: number) {
  const random = seededRandom(6803 + layer * 913)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const palette = [new THREE.Color('#f7f5d9'), new THREE.Color('#bbd09b'), new THREE.Color('#d4b87b')]
  for (let index = 0; index < count; index++) {
    positions[index * 3] = (random() - 0.5) * 148
    positions[index * 3 + 1] = (random() - 0.42) * 87
    positions[index * 3 + 2] = -7 - random() * 126 - layer * 4
    const color = palette[random() < 0.7 ? 0 : random() < 0.7 ? 1 : 2]
    const intensity = 0.65 + random() * 1.6
    colors[index * 3] = color.r * intensity
    colors[index * 3 + 1] = color.g * intensity
    colors[index * 3 + 2] = color.b * intensity
    sizes[index] = 0.5 + random() * 1.3
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uDpr: { value: dpr }, uLayer: { value: layer } },
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      uniform float uTime;
      uniform float uDpr;
      uniform float uLayer;
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        vec3 point = position;
        float drift = uTime * (0.002 - uLayer * 0.0003);
        point.xy = mat2(cos(drift), -sin(drift), sin(drift), cos(drift)) * point.xy;
        vec4 mv = modelViewMatrix * vec4(point, 1.0);
        gl_PointSize = clamp(aSize * uDpr * (62.0 / max(1.0, -mv.z)), 0.8, 4.6 * uDpr);
        gl_Position = projectionMatrix * mv;
        vColor = aColor;
        vTwinkle = 0.73 + 0.27 * sin(uTime * 0.7 + position.x * 0.9 + position.y);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vTwinkle;
      void main() {
        float distanceToCenter = length(gl_PointCoord - 0.5);
        if (distanceToCenter > 0.5) discard;
        float alpha = (1.0 - smoothstep(0.045, 0.5, distanceToCenter)) * vTwinkle;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return new THREE.Points(geometry, material)
}

function createAurora() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uProgress: { value: 0 } },
    vertexShader: planeVertex,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uProgress;
      float hash(vec2 point) {
        return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 point) {
        vec2 cell = floor(point);
        vec2 f = fract(point);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(cell), hash(cell + vec2(1., 0.)), f.x),
          mix(hash(cell + vec2(0., 1.)), hash(cell + vec2(1., 1.)), f.x), f.y);
      }
      void main() {
        vec2 uv = vUv;
        float flow = uTime * 0.035;
        float ribbonY = 0.47 + sin(uv.x * 4.2 + flow) * 0.115 + sin(uv.x * 8.0 - flow * 0.7) * 0.025;
        float ribbonDistance = (uv.y - ribbonY) * 10.5;
        float upperDistance = (uv.y - ribbonY - 0.1) * 6.8;
        float ribbon = exp(-ribbonDistance * ribbonDistance);
        float upper = exp(-upperDistance * upperDistance);
        float cloud = noise(uv * vec2(7.0, 11.0) + vec2(flow, 0.0));
        cloud += noise(uv * vec2(17.0, 22.0) - vec2(flow * 0.7, 0.0)) * 0.4;
        float curtain = 0.65 + 0.35 * sin(uv.x * 69.0 + cloud * 5.0 + flow);
        float edge = smoothstep(0.0, 0.12, uv.x) * (1.0 - smoothstep(0.88, 1.0, uv.x));
        edge *= smoothstep(0.03, 0.25, uv.y) * (1.0 - smoothstep(0.8, 1.0, uv.y));
        vec3 moss = vec3(0.19, 0.32, 0.105);
        vec3 bamboo = vec3(0.31, 0.32, 0.11);
        vec3 color = mix(moss, bamboo, smoothstep(0.55, 0.95, uv.x + uProgress * 0.18));
        float strength = (ribbon * curtain * 0.8 + upper * 0.2) * (0.32 + cloud * 0.6) * edge;
        gl_FragColor = vec4(color, strength * 0.53);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(175, 100), material)
  mesh.position.set(0, 15, -90)
  return mesh
}

function createLandscape() {
  const landscape = new THREE.Group()
  const random = seededRandom(90210)
  const layers = [
    { z: -58, base: -16, height: 6.2, color: '#264531' },
    { z: -40, base: -13, height: 4.4, color: '#1b3b2a' },
    { z: -24, base: -9.5, height: 3.2, color: '#102e22' },
    { z: -12, base: -7.2, height: 2.4, color: '#09241a' },
  ]
  layers.forEach((layer, layerIndex) => {
    const shape = new THREE.Shape()
    const segments = 90
    for (let index = 0; index <= segments; index++) {
      const x = (index / segments - 0.5) * 180
      const y = layer.base + Math.sin(index * 0.29 + layerIndex * 0.8) * layer.height * 0.38
        + Math.sin(index * 0.105 + layerIndex) * layer.height * 0.65 + random() * 0.18
      if (index === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    shape.lineTo(90, -70)
    shape.lineTo(-90, -70)
    shape.closePath()
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: layer.color, side: THREE.DoubleSide }))
    mesh.position.z = layer.z
    landscape.add(mesh)
  })
  // Narrow bamboo silhouettes frame the lower edges of the night landscape.
  const leafShape = new THREE.Shape()
  leafShape.moveTo(0, 0)
  leafShape.quadraticCurveTo(0.7, 0.29, 1.3, 0.06)
  leafShape.quadraticCurveTo(0.62, -0.24, 0, 0)
  const leafGeometry = new THREE.ShapeGeometry(leafShape)
  const stemGeometry = new THREE.PlaneGeometry(0.055, 1)
  const nodeGeometry = new THREE.PlaneGeometry(0.085, 0.026)
  const material = new THREE.MeshBasicMaterial({ color: '#163b27', side: THREE.DoubleSide })
  for (const side of [-1, 1]) {
    for (let index = 0; index < 5; index++) {
      const bamboo = new THREE.Group()
      bamboo.position.set(side * (11 + index * 1.25), -12.5, -15 - index * 3)
      bamboo.rotation.z = side * (0.05 + random() * 0.13)
      const height = 4.8 + random() * 4
      for (let segment = 0; segment < 7; segment++) {
        const stem = new THREE.Mesh(stemGeometry, material)
        stem.scale.y = height / 7
        stem.position.y = (segment + 0.5) * height / 7
        bamboo.add(stem)
        const node = new THREE.Mesh(nodeGeometry, material)
        node.position.y = segment * height / 7
        bamboo.add(node)
        if (segment < 3) continue
        for (const direction of [-1, 1]) {
          const leaf = new THREE.Mesh(leafGeometry, material)
          leaf.position.set(0, segment * height / 7, 0.02)
          leaf.rotation.z = direction === 1 ? 0.2 + random() * 0.45 : Math.PI - 0.2 - random() * 0.45
          leaf.scale.setScalar(0.6 + random() * 0.4)
          bamboo.add(leaf)
        }
      }
      landscape.add(bamboo)
    }
  }
  return landscape
}

/** One renderer carries the original panda through the pasted Horizon camera effect. */
export default function HorizonScene({ progressRef, reducedMotion = false, paused = false }: HorizonSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sourceRef = useRef(progressRef)
  const preferencesRef = useRef({ reducedMotion, paused })
  const wakeRef = useRef<() => void>(() => {})
  const [fallback, setFallback] = useState(false)

  useEffect(() => { sourceRef.current = progressRef; wakeRef.current() }, [progressRef])
  useEffect(() => { preferencesRef.current = { reducedMotion, paused }; wakeRef.current() }, [reducedMotion, paused])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      container.dataset.ready = 'fallback'
      container.dataset.mobile = String(container.clientWidth < 760)
      setFallback(true)
      return
    }
    const initialMobile = container.clientWidth < 760
    const dpr = Math.min(window.devicePixelRatio, initialMobile ? 1.3 : 1.65)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor('#061a13', 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.16

    const world = new THREE.Scene()
    world.background = new THREE.Color('#061a13')
    world.fog = new THREE.FogExp2('#061a13', 0.0055)
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200)
    camera.position.set(0, 0.5, 10)
    world.add(camera)

    const composer = new EffectComposer(renderer)
    const renderPass = new RenderPass(world, camera)
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.16, 0.45, 2.0)
    const output = new OutputPass()
    composer.addPass(renderPass)
    composer.addPass(bloom)
    composer.addPass(output)

    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    let environment = pmrem.fromScene(room, 0.035)
    world.environment = environment.texture
    world.environmentIntensity = 0.5
    room.dispose()
    pmrem.dispose()

    const stars = [0, 1, 2].map(layer => createStars(initialMobile ? 300 : 800, layer, dpr))
    stars.forEach(star => world.add(star))
    const aurora = createAurora()
    world.add(aurora)
    world.add(createLandscape())

    const panda = createPanda()
    // The night scene needs a softer finish than the original light-background
    // product lighting, so emerald patches retain their deep brand color.
    const pandaMaterials = new Set<THREE.MeshPhysicalMaterial>()
    panda.root.traverse(object => {
      if (object instanceof THREE.Mesh && object.material instanceof THREE.MeshPhysicalMaterial) pandaMaterials.add(object.material)
    })
    pandaMaterials.forEach(material => {
      material.clearcoat *= 0.45
      material.roughness = Math.max(material.roughness, 0.36)
      material.envMapIntensity = 0.55
    })
    panda.root.position.set(0.27, -0.54, 0)
    const sculpture = new THREE.Group()
    sculpture.add(panda.root)
    const viewRig = new THREE.Group()
    viewRig.add(sculpture)
    camera.add(viewRig)

    const halo = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.ShaderMaterial({
      vertexShader: planeVertex,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          float radius = length((vUv - 0.5) * vec2(1.0, 1.0));
          float glow = exp(-radius * radius * 14.0) * (1.0 - smoothstep(0.26, 0.5, radius));
          gl_FragColor = vec4(0.21, 0.35, 0.10, glow * 0.19);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
    halo.position.set(0, 0.1, -1.1)
    viewRig.add(halo)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.006, 6, 144), new THREE.MeshBasicMaterial({ color: '#9caf79', transparent: true, opacity: 0.28, depthWrite: false }))
    ring.position.set(0, 0.04, -0.95)
    ring.rotation.set(0.22, 0.26, -0.23)
    viewRig.add(ring)

    const key = new THREE.DirectionalLight('#fff6d7', 2.0)
    key.position.set(-5, 6, -1)
    key.target = viewRig
    camera.add(key)
    const fill = new THREE.DirectionalLight('#d6e8b8', 0.45)
    fill.position.set(5, 1, -3)
    fill.target = viewRig
    camera.add(fill)
    const rim = new THREE.DirectionalLight('#b9d69a', 1.65)
    rim.position.set(1, 4, -14)
    rim.target = viewRig
    camera.add(rim)
    world.add(new THREE.AmbientLight('#d9e5be', 0.25))

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(pointer: fine)')
    const pointer = new THREE.Vector2()
    const easedPointer = new THREE.Vector2()
    const neutral = new THREE.Vector2()
    const leafRotations = panda.leaves.map(leaf => leaf.rotation.z)
    let mobile = initialMobile
    let visible = true
    let disposed = false
    let lost = false
    let frameId = 0
    let lastTime = 0
    let elapsed = 0
    let scrollWakeUntil = 0
    let lastProgress = -1
    let stageWidth = 1
    let stageHeight = 1
    let renders = 0
    const mascotDistance = 9
    const isReduced = () => preferencesRef.current.reducedMotion || media.matches
    const stopFrame = () => {
      cancelAnimationFrame(frameId)
      frameId = 0
      lastTime = 0
    }
    const wake = () => {
      if (!frameId && !disposed && !lost && visible && !document.hidden) frameId = requestAnimationFrame(animate)
    }
    wakeRef.current = wake
    const animate = (time: number) => {
      frameId = 0
      if (disposed || lost || !visible || document.hidden) { lastTime = 0; return }
      const delta = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 1 / 60
      lastTime = time
      const reduced = isReduced()
      const pausedNow = preferencesRef.current.paused
      const ambient = !reduced && !pausedNow
      if (ambient) elapsed += delta
      const progress = reduced ? 0 : THREE.MathUtils.clamp(sourceRef.current.current || 0, 0, 1)
      const local = progress * 5
      const chapter = Math.min(5, Math.floor(local))
      const fraction = local - chapter
      const side = THREE.MathUtils.lerp(chapter % 2 === 0 ? 1 : -1, (chapter + 1) % 2 === 0 ? 1 : -1, chapter === 5 ? 0 : fraction)
      easedPointer.lerp(ambient ? pointer : neutral, ambient ? 1 - Math.exp(-delta * 4) : 1)

      // The world camera flies through depth; the panda stays composed in its own
      // camera-relative foreground, so neither side ever collides with the copy.
      camera.position.set(Math.sin(progress * Math.PI * 1.5) * 2.2 + easedPointer.x * 0.3,
        0.5 + Math.sin(progress * Math.PI) * 1.65 - easedPointer.y * 0.19,
        10 - progress * 29)
      const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * mascotDistance
      const viewWidth = viewHeight * camera.aspect
      const shortMobile = mobile && stageHeight < 720
      const mascotScale = mobile
        ? Math.min(viewHeight * (shortMobile ? 0.30 : 0.34) / 4.5, viewWidth * 0.76 / 3.8)
        : Math.min(viewHeight * 0.68 / 4.5, viewWidth * 0.37 / 3.8)
      const xNdc = mobile ? side * 0.045 : side * 0.51
      const yNdc = mobile ? (shortMobile ? -0.48 : -0.44) : -0.045
      viewRig.position.set(xNdc * viewWidth * 0.5, yNdc * viewHeight * 0.5, -mascotDistance)
      viewRig.scale.setScalar(mascotScale)
      sculpture.rotation.set(easedPointer.y * 0.045,
        side * -0.14 + Math.sin(progress * Math.PI * 2) * 0.24 + easedPointer.x * 0.15,
        Math.sin(progress * Math.PI * 2) * 0.04)
      sculpture.position.y = ambient ? Math.sin(elapsed * 0.85) * 0.04 : 0
      panda.head.rotation.z = -0.19 + (ambient ? Math.sin(elapsed * 0.65) * 0.012 : 0)
      panda.leaves.forEach((leaf, index) => { leaf.rotation.z = leafRotations[index] + (ambient ? Math.sin(elapsed * 1.1 + index * 0.6) * 0.02 : 0) })
      panda.floaters.forEach(({ object, origin, phase }) => {
        object.position.y = origin.y + (ambient ? Math.sin(elapsed * 0.7 + phase) * 0.08 : 0)
      })
      stars.forEach(star => { star.material.uniforms.uTime.value = reduced ? 0 : elapsed })
      aurora.material.uniforms.uTime.value = reduced ? 0 : elapsed
      aurora.material.uniforms.uProgress.value = progress
      ring.rotation.z = -0.23 + progress * 0.55
      composer.render(delta)
      renders++
      canvas.dataset.frames = String(renders)
      if (Math.abs(progress - lastProgress) > 0.00005 || lastProgress < 0) {
        canvas.dataset.progress = progress.toFixed(4)
        canvas.dataset.chapter = String(Math.round(local) + 1)
        lastProgress = progress
      }
      container.dataset.ready = 'true'
      container.dataset.motion = reduced ? 'reduced' : pausedNow ? 'paused' : 'live'
      if (ambient || (!reduced && time < scrollWakeUntil)) frameId = requestAnimationFrame(animate)
      else lastTime = 0
    }
    const resize = () => {
      const bounds = container.getBoundingClientRect()
      stageWidth = Math.max(1, bounds.width)
      stageHeight = Math.max(1, bounds.height)
      mobile = stageWidth < 760
      const resizedDpr = Math.min(window.devicePixelRatio, mobile ? 1.3 : 1.65)
      if (renderer.getPixelRatio() !== resizedDpr) {
        renderer.setPixelRatio(resizedDpr)
        composer.setPixelRatio(resizedDpr)
      }
      stars.forEach(star => {
        star.geometry.setDrawRange(0, Math.min(star.geometry.getAttribute('position').count, mobile ? 300 : 800))
        star.material.uniforms.uDpr.value = resizedDpr
      })
      camera.aspect = stageWidth / stageHeight
      camera.updateProjectionMatrix()
      renderer.setSize(stageWidth, stageHeight, false)
      composer.setSize(stageWidth, stageHeight)
      container.dataset.mobile = String(mobile)
      wake()
    }
    const onPointer = (event: PointerEvent) => {
      if (!finePointer.matches || isReduced() || preferencesRef.current.paused || !visible) return
      const bounds = container.getBoundingClientRect()
      pointer.set(THREE.MathUtils.clamp((event.clientX - bounds.left) / stageWidth * 2 - 1, -1, 1),
        THREE.MathUtils.clamp((event.clientY - bounds.top) / stageHeight * 2 - 1, -1, 1))
      canvas.dataset.pointer = `${pointer.x.toFixed(3)},${pointer.y.toFixed(3)}`
    }
    const onPointerLeave = () => { pointer.set(0, 0); canvas.dataset.pointer = '0,0' }
    const onScroll = () => {
      if (isReduced()) return
      // A short bounded tail catches the parent's scroll easing while paused.
      scrollWakeUntil = performance.now() + 550
      wake()
    }
    const onVisibility = () => { if (document.hidden) stopFrame(); else wake() }
    const onContextLost = (event: Event) => {
      event.preventDefault()
      lost = true
      stopFrame()
      container.dataset.ready = 'fallback'
      setFallback(true)
    }
    const onContextRestored = () => {
      lost = false
      // Render targets lose their contents with the context, including the PMREM.
      const restoredPmrem = new THREE.PMREMGenerator(renderer)
      const restoredRoom = new RoomEnvironment()
      environment.dispose()
      environment = restoredPmrem.fromScene(restoredRoom, 0.035)
      world.environment = environment.texture
      restoredRoom.dispose()
      restoredPmrem.dispose()
      setFallback(false)
      resize()
      wake()
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting)
      if (visible) wake()
      else stopFrame()
    }, { threshold: 0, rootMargin: '60px' })
    observer.observe(container)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)
    media.addEventListener('change', wake)
    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    resize()

    return () => {
      disposed = true
      wakeRef.current = () => {}
      stopFrame()
      observer.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      media.removeEventListener('change', wake)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      const geometries = new Set<THREE.BufferGeometry>()
      const materials = new Set<THREE.Material>()
      world.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          geometries.add(object.geometry)
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material)
        }
      })
      geometries.forEach(geometry => geometry.dispose())
      materials.forEach(material => material.dispose())
      environment.dispose()
      renderPass.dispose()
      bloom.dispose()
      output.dispose()
      composer.dispose()
      renderer.dispose()
      container.dataset.ready = 'false'
    }
  }, [])

  return (
    <div ref={containerRef} className="horizon-scene" data-ready="false" style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#061a13' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Pearl Panda's ivory 3D panda and bamboo float through a green aurora and pearl stars. The camera travels through the forest horizon as you scroll."
        data-progress="0"
        data-pointer="0,0"
        style={{ width: '100%', height: '100%', display: 'block', opacity: fallback ? 0 : 1 }}
      />
      {fallback && (
        <div role="img" aria-label="Pearl Panda bamboo logo beneath a green night sky" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 74% 45%, #38513288, transparent 56%)' }}>
          <style>{'.horizon-scene[data-mobile="true"] .horizon-fallback-logo{width:55%!important;right:22.5%!important;top:53%!important}'}</style>
          <img className="horizon-fallback-logo" src="/media/logo.svg" alt="" style={{ position: 'absolute', width: 'min(28vw, 310px)', height: 'auto', right: '11%', top: '32%', borderRadius: '48%', opacity: 0.86 }} />
        </div>
      )}
    </div>
  )
}
