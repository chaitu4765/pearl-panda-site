"use client"

import { useLayoutEffect, useMemo, useRef, type HTMLAttributes, type Ref } from 'react'
import { cn } from '@/lib/utils'
import './decrypt-text.css'

/* Decrypt Text — adapted from Motiq (https://motiq.dev/components/decrypt-text).
   MIT licensed. Original left-to-right decrypt and seeded glyph timing retained;
   Pearl Panda adaptation adds stable glyph widths and resumable lifecycle control. */

export type DecryptTextTrigger = 'mount' | 'inview' | 'hover'

export interface DecryptTextProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  text: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div'
  glyphs?: string
  speed?: number
  stagger?: number
  startDelay?: number
  jitter?: number
  trigger?: DecryptTextTrigger
  retriggerOnHover?: boolean
  loop?: number | false
  seed?: number
  /** Forces static text. False never overrides the operating system preference. */
  reducedMotion?: boolean
  onDecrypted?: () => void
}

const DEFAULT_GLYPHS = '#%&@$?!*+=/{}[]<>~^'
const HOVER_COOLDOWN = 1500
const CYCLE_SPREAD = 35

function makeRng(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) | 0
    let next = Math.imul(value ^ (value >>> 15), 1 | value)
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

/** Readable text is always available; only the aria-hidden glyphs are animated. */
export function DecryptText({
  text,
  as: Tag = 'p',
  glyphs = DEFAULT_GLYPHS,
  speed = 45,
  stagger = 55,
  startDelay = 350,
  jitter = 120,
  trigger = 'inview',
  retriggerOnHover = true,
  loop = 7000,
  seed = 1,
  reducedMotion = false,
  onDecrypted,
  className,
  ...rest
}: DecryptTextProps) {
  const rootRef = useRef<HTMLElement | null>(null)
  const charRefs = useRef<Array<HTMLSpanElement | null>>([])
  const callbackRef = useRef(onDecrypted)

  useLayoutEffect(() => { callbackRef.current = onDecrypted }, [onDecrypted])

  const { tokens, total } = useMemo(() => {
    let index = 0
    const tokens = text.split(/(\s+)/).filter(Boolean).map(token => {
      if (/^\s+$/.test(token)) return { whitespace: token, characters: [] }
      return { whitespace: '', characters: Array.from(token, character => ({ character, index: index++ })) }
    })
    return { tokens, total: index }
  }, [text])

  const pool = useMemo(() => {
    const characters = Array.from(glyphs).filter(character => !/\s/.test(character))
    return characters.length ? characters : Array.from(DEFAULT_GLYPHS)
  }, [glyphs])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    charRefs.current.length = total
    const cells = charRefs.current.filter((element): element is HTMLSpanElement => element !== null)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const bounds = root.getBoundingClientRect()
    let onScreen = bounds.bottom > 0 && bounds.top < window.innerHeight
      && bounds.right > 0 && bounds.left < window.innerWidth && bounds.width > 0 && bounds.height > 0
    let tabVisible = document.visibilityState !== 'hidden'
    let status: 'idle' | 'running' | 'completed' = 'idle'
    let disposed = false
    let frameId = 0
    let timerId = 0
    let timerStarted = 0
    let loopRemaining = typeof loop === 'number' ? Math.max(0, loop) : 0
    let elapsed = 0
    let lastFrame = 0
    let lastStart = -Infinity
    let run = 0
    let remaining = 0
    let random = makeRng(seed)
    let lockAt = new Float64Array(cells.length)
    let nextAt = new Float64Array(cells.length)
    let locked = new Uint8Array(cells.length)

    const shouldReduce = () => reducedMotion || media.matches
    const canAnimate = () => !disposed && onScreen && tabVisible && !shouldReduce()
    const resolveAll = () => {
      for (const element of cells) {
        element.textContent = element.dataset.decryptChar ?? ''
        element.dataset.state = 'plain'
      }
    }
    const pause = () => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = 0
      lastFrame = 0
      if (timerId) {
        clearTimeout(timerId)
        loopRemaining = Math.max(0, loopRemaining - (performance.now() - timerStarted))
      }
      timerId = 0
    }
    const scheduleLoop = () => {
      if (loop === false || loop <= 0 || timerId || status !== 'completed' || !canAnimate()) return
      timerStarted = performance.now()
      timerId = window.setTimeout(() => {
        timerId = 0
        loopRemaining = loop
        if (canAnimate()) startRun()
      }, loopRemaining)
    }
    const animate = (time: number) => {
      frameId = 0
      if (!canAnimate()) { lastFrame = 0; return }
      if (lastFrame) elapsed += Math.min(time - lastFrame, 64)
      lastFrame = time
      for (let index = 0; index < cells.length; index++) {
        if (locked[index]) continue
        const element = cells[index]
        if (elapsed >= lockAt[index]) {
          element.textContent = element.dataset.decryptChar ?? ''
          element.dataset.state = 'lock'
          locked[index] = 1
          remaining--
        } else if (elapsed >= nextAt[index]) {
          element.textContent = pool[Math.floor(random() * pool.length)]
          nextAt[index] = elapsed + Math.max(16, speed) + random() * CYCLE_SPREAD
        }
      }
      if (remaining === 0) {
        status = 'completed'
        lastFrame = 0
        callbackRef.current?.()
        scheduleLoop()
      } else frameId = requestAnimationFrame(animate)
    }
    const resumeRun = () => {
      if (!frameId && canAnimate()) frameId = requestAnimationFrame(animate)
    }
    function startRun() {
      if (!canAnimate() || !cells.length) return
      pause()
      random = makeRng(seed + run++ * 7919)
      lockAt = new Float64Array(cells.length)
      nextAt = new Float64Array(cells.length)
      locked = new Uint8Array(cells.length)
      elapsed = 0
      lastStart = performance.now()
      remaining = cells.length
      status = 'running'
      loopRemaining = typeof loop === 'number' ? Math.max(0, loop) : 0
      cells.forEach((element, index) => {
        lockAt[index] = Math.max(0, startDelay + index * Math.max(0, stagger) + (random() * 2 - 1) * Math.max(0, jitter))
        element.dataset.state = 'scramble'
        element.textContent = pool[Math.floor(random() * pool.length)]
      })
      resumeRun()
    }
    const synchronize = () => {
      const reduced = shouldReduce()
      root.dataset.motion = reduced ? 'static' : 'animated'
      root.dataset.paused = !onScreen || !tabVisible ? 'true' : 'false'
      if (reduced) {
        pause()
        resolveAll()
        status = 'completed'
      } else if (!canAnimate()) pause()
      else if (status === 'running') resumeRun()
      else if (status === 'idle' && trigger !== 'hover') startRun()
      else if (status === 'completed') scheduleLoop()
    }
    const onPointerEnter = () => {
      if (!canAnimate() || status === 'running') return
      if (status === 'idle' && trigger === 'hover') { startRun(); return }
      if (retriggerOnHover && performance.now() - lastStart >= HOVER_COOLDOWN) startRun()
    }
    const onVisibility = () => {
      tabVisible = document.visibilityState !== 'hidden'
      synchronize()
    }
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      onScreen = entries.some(entry => entry.isIntersecting)
      synchronize()
    }, { threshold: 0.12 })
    observer?.observe(root)
    root.addEventListener('pointerenter', onPointerEnter)
    document.addEventListener('visibilitychange', onVisibility)
    media.addEventListener('change', synchronize)
    synchronize()

    return () => {
      disposed = true
      pause()
      observer?.disconnect()
      root.removeEventListener('pointerenter', onPointerEnter)
      document.removeEventListener('visibilitychange', onVisibility)
      media.removeEventListener('change', synchronize)
      // A StrictMode cleanup must not leave a cancelled run frozen in its scramble.
      // Every new effect owns fresh run state, including when the text changes.
      resolveAll()
    }
  }, [text, total, pool, speed, stagger, startDelay, jitter, trigger, retriggerOnHover, loop, seed, reducedMotion])

  return (
    <Tag ref={rootRef as Ref<never>} className={cn('decrypt-text', className)} {...rest}>
      <span className="decrypt-text__accessible">{text}</span>
      <span aria-hidden="true" className="decrypt-text__visual">
        {tokens.map((token, tokenIndex) => token.whitespace || (
          <span className="decrypt-text__word" key={tokenIndex}>
            {token.characters.map(({ character, index }) => (
              <span className="decrypt-text__cell" key={index}>
                <span className="decrypt-text__measure">{character}</span>
                <span
                  ref={element => { charRefs.current[index] = element }}
                  className="decrypt-text__glyph"
                  data-decrypt-char={character}
                  data-state="plain"
                >{character}</span>
              </span>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  )
}

export default DecryptText
