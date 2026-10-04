import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import './target-cursor.css'

export type TargetCursorProps = {
  targetSelector?: string
  spinDuration?: number
  hideDefaultCursor?: boolean
  hoverDuration?: number
  parallaxOn?: boolean
  cursorColor?: string
  cursorColorOnTarget?: string
}

const POINTER_MEDIA = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
const REST_CORNERS = [{ x: -18, y: -18 }, { x: 6, y: -18 }, { x: 6, y: 6 }, { x: -18, y: 6 }]

/** React Bits TargetCursor, adapted for Pearl Panda's route and accessibility lifecycle. */
export default function TargetCursor({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
  cursorColor = '#174630',
  cursorColorOnTarget = '#477d36',
}: TargetCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = cursorRef.current
    if (!element) return
    const cursor: HTMLDivElement = element
    const dot = cursor.querySelector<HTMLDivElement>('.target-cursor-dot')!
    const corners = Array.from(cursor.querySelectorAll<HTMLDivElement>('.target-cursor-corner'))
    const media = gsap.matchMedia()

    media.add(POINTER_MEDIA, () => {
      // Invalid user-supplied selectors must not hide the operating-system cursor.
      try { document.querySelector(targetSelector) } catch { return }
      let disposed = false
      let visible = false
      let activeTarget: Element | null = null
      let tracking = false
      let layoutFrame = 0
      let spin: gsap.core.Tween | null = null
      let returning: gsap.core.Timeline | null = null
      const pointer = { x: 0, y: 0 }
      const speed = Number.isFinite(spinDuration) ? Math.max(0.1, spinDuration) : 2
      const hoverTime = Number.isFinite(hoverDuration) ? Math.max(0.01, hoverDuration) : 0.2
      const motion = { duration: 0.09, ease: 'power3.out' }
      const moveX = gsap.quickTo(cursor, 'x', motion)
      const moveY = gsap.quickTo(cursor, 'y', motion)
      const cornerMotion = { duration: parallaxOn ? hoverTime : Math.min(hoverTime, 0.12), ease: 'power3.out' }
      const cornerMoves = corners.map(corner => ({ x: gsap.quickTo(corner, 'x', cornerMotion), y: gsap.quickTo(corner, 'y', cornerMotion) }))
      const allQuickMoves = [moveX, moveY, ...cornerMoves.flatMap(move => [move.x, move.y])]
      cursor.dataset.enabled = 'true'
      cursor.dataset.visible = 'false'
      cursor.dataset.targeting = 'false'
      gsap.set(cursor, { x: -100, y: -100, rotation: 0, scale: 1 })
      gsap.set(dot, { scale: 1, backgroundColor: cursorColor })
      corners.forEach((corner, index) => gsap.set(corner, { ...REST_CORNERS[index], borderColor: cursorColor }))

      function stopSpin() { spin?.kill(); spin = null }
      function startSpin() {
        if (disposed || !visible || activeTarget) return
        stopSpin()
        spin = gsap.to(cursor, { rotation: '+=360', repeat: -1, duration: speed, ease: 'none' })
      }
      function stopTracking() {
        if (tracking) gsap.ticker.remove(trackTarget)
        tracking = false
      }
      function setTarget(target: Element | null) {
        if (target === activeTarget) return
        returning?.kill()
        returning = null
        stopSpin()
        stopTracking()
        activeTarget = target
        cursor.dataset.targeting = String(!!target)
        cornerMoves.forEach(move => { move.x.tween.pause(); move.y.tween.pause() })
        gsap.killTweensOf(corners, 'borderColor')
        gsap.to(corners, { borderColor: target ? cursorColorOnTarget : cursorColor, duration: 0.15, overwrite: 'auto' })
        gsap.to(dot, { backgroundColor: target ? cursorColorOnTarget : cursorColor, duration: 0.15, overwrite: 'auto' })
        if (target) {
          gsap.set(cursor, { rotation: 0 })
          tracking = true
          gsap.ticker.add(trackTarget)
          trackTarget()
        } else {
          returning = gsap.timeline({ onComplete: startSpin })
          corners.forEach((corner, index) => returning!.to(corner, { ...REST_CORNERS[index], duration: 0.22, ease: 'power3.out' }, 0))
        }
      }
      function hide() {
        visible = false
        cursor.dataset.visible = 'false'
        document.body.classList.remove('pp-target-cursor-active')
        setTarget(null)
        returning?.kill()
        returning = null
        stopSpin()
        stopTracking()
        allQuickMoves.forEach(move => move.tween.pause())
        gsap.killTweensOf([cursor, dot, ...corners])
        gsap.set(cursor, { rotation: 0 })
        gsap.set(dot, { scale: 1, backgroundColor: cursorColor })
        corners.forEach((corner, index) => gsap.set(corner, { ...REST_CORNERS[index], borderColor: cursorColor }))
      }
      function findTarget(element: Element | null) {
        const target = element?.closest(targetSelector) ?? null
        return target?.closest('[inert], [aria-hidden="true"]') ? null : target
      }
      function hitTest() {
        if (!visible || disposed) return
        const element = document.elementFromPoint(pointer.x, pointer.y)
        if (!element || element.closest(EDITABLE_SELECTOR)) { hide(); return }
        setTarget(findTarget(element))
      }
      function trackTarget() {
        if (!visible || !activeTarget || disposed) return
        if (!activeTarget.isConnected) { setTarget(null); return }
        // Bounds remain live while cards reveal, lift on hover, or change size.
        const rect = activeTarget.getBoundingClientRect()
        if (!rect.width || !rect.height) { setTarget(null); return }
        const x = Number(gsap.getProperty(cursor, 'x'))
        const y = Number(gsap.getProperty(cursor, 'y'))
        const px = parallaxOn ? Math.max(-1, Math.min(1, (pointer.x - rect.left) / rect.width - 0.5)) * 3 : 0
        const py = parallaxOn ? Math.max(-1, Math.min(1, (pointer.y - rect.top) / rect.height - 0.5)) * 3 : 0
        const positions = [
          { x: rect.left - 2, y: rect.top - 2 },
          { x: rect.right - 10, y: rect.top - 2 },
          { x: rect.right - 10, y: rect.bottom - 10 },
          { x: rect.left - 2, y: rect.bottom - 10 },
        ]
        positions.forEach((position, index) => {
          cornerMoves[index].x(position.x - x + px)
          cornerMoves[index].y(position.y - y + py)
        })
      }
      function onMove(event: PointerEvent) {
        if (event.pointerType !== 'mouse') { hide(); return }
        pointer.x = event.clientX
        pointer.y = event.clientY
        const element = document.elementFromPoint(pointer.x, pointer.y)
        if (!element || element.closest(EDITABLE_SELECTOR)) { hide(); return }
        if (!visible) {
          gsap.set(cursor, { x: pointer.x, y: pointer.y })
          visible = true
          cursor.dataset.visible = 'true'
          if (hideDefaultCursor) document.body.classList.add('pp-target-cursor-active')
          startSpin()
        }
        moveX(pointer.x)
        moveY(pointer.y)
        setTarget(findTarget(element))
      }
      function onLayout() {
        if (!visible || layoutFrame) return
        layoutFrame = requestAnimationFrame(() => { layoutFrame = 0; hitTest(); trackTarget() })
      }
      function onOver(event: PointerEvent) { if (event.pointerType === 'mouse') hitTest() }
      function onOut(event: PointerEvent) { if (!event.relatedTarget) hide() }
      function onDown(event: PointerEvent) {
        if (event.pointerType !== 'mouse') { hide(); return }
        if (visible) gsap.to(dot, { scale: 0.65, duration: 0.12, overwrite: 'auto' })
      }
      function onUp() { if (visible) gsap.to(dot, { scale: 1, duration: 0.18, ease: 'back.out(1.7)', overwrite: 'auto' }) }
      function onKey(event: KeyboardEvent) { if (event.key === 'Tab' || event.key === 'Escape') hide() }
      function onVisibility() { if (document.hidden) hide() }

      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerover', onOver, { passive: true })
      window.addEventListener('pointerout', onOut, { passive: true })
      window.addEventListener('pointerdown', onDown, { passive: true })
      window.addEventListener('pointerup', onUp, { passive: true })
      window.addEventListener('pointercancel', hide, { passive: true })
      window.addEventListener('scroll', onLayout, { passive: true, capture: true })
      window.addEventListener('resize', onLayout, { passive: true })
      window.addEventListener('blur', hide)
      window.addEventListener('keydown', onKey)
      document.addEventListener('visibilitychange', onVisibility)
      document.documentElement.addEventListener('pointerleave', hide)

      return () => {
        disposed = true
        hide()
        cancelAnimationFrame(layoutFrame)
        allQuickMoves.forEach(move => move.tween.kill())
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerover', onOver)
        window.removeEventListener('pointerout', onOut)
        window.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', hide)
        window.removeEventListener('scroll', onLayout, true)
        window.removeEventListener('resize', onLayout)
        window.removeEventListener('blur', hide)
        window.removeEventListener('keydown', onKey)
        document.removeEventListener('visibilitychange', onVisibility)
        document.documentElement.removeEventListener('pointerleave', hide)
        cursor.dataset.enabled = 'false'
        cursor.dataset.targeting = 'false'
      }
    })

    return () => {
      media.revert()
      document.body.classList.remove('pp-target-cursor-active')
    }
  }, [targetSelector, spinDuration, hideDefaultCursor, hoverDuration, parallaxOn, cursorColor, cursorColorOnTarget])

  if (typeof document === 'undefined') return null
  return createPortal(
    <div ref={cursorRef} className="target-cursor-wrapper" aria-hidden="true" data-enabled="false" data-visible="false" data-targeting="false">
      <div className="target-cursor-dot" style={{ backgroundColor: cursorColor }} />
      <div className="target-cursor-corner corner-tl" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-tr" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-br" style={{ borderColor: cursorColor }} />
      <div className="target-cursor-corner corner-bl" style={{ borderColor: cursorColor }} />
    </div>,
    document.body,
  )
}
