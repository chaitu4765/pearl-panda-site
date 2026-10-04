import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function TiltCard({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`tilt-card ${className}`} onPointerMove={e => {
    if (e.pointerType !== 'mouse' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - .5
    const y = (e.clientY - rect.top) / rect.height - .5
    e.currentTarget.style.setProperty('--tilt-x', `${-y * 7}deg`)
    e.currentTarget.style.setProperty('--tilt-y', `${x * 7}deg`)
    e.currentTarget.style.setProperty('--spot-x', `${(x + .5) * 100}%`)
    e.currentTarget.style.setProperty('--spot-y', `${(y + .5) * 100}%`)
  }} onPointerLeave={e => { e.currentTarget.style.setProperty('--tilt-x', '0deg'); e.currentTarget.style.setProperty('--tilt-y', '0deg') }}>{children}</div>
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }, { threshold: .08 })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>
}

export function CursorHalo() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fine = matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)')
    if (!fine.matches) return
    let frame = 0
    let x = -100, y = -100
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (ref.current) {
          ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
          ref.current.dataset.active = String(!!(e.target as Element).closest('a,button,canvas,[data-interactive]'))
        }
      })
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(frame) }
  }, [])
  return <div className="cursor-halo" ref={ref} aria-hidden="true"><span /></div>
}

export function RouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const titles: Record<string, string> = { '/': 'Small panda. Big possibilities.', '/services': 'Thoughtful digital services', '/industries': 'Your world. Our playground.', '/about': 'Good people. Thoughtful work.', '/work': 'Concept explorations', '/contact': 'Let’s grow something good' }
    document.title = `Pearl Panda — ${titles[pathname] || 'Page not found'}`
    if (hash) requestAnimationFrame(() => {
      let id = hash.slice(1)
      try { id = decodeURIComponent(id) } catch { /* Invalid fragments simply have no target. */ }
      document.getElementById(id)?.scrollIntoView()
    })
    else window.scrollTo({ top: 0, behavior: 'instant' })
    const main = document.querySelector('main')
    if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }) }
  }, [pathname, hash])
  return null
}
