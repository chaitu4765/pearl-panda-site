import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Code2, MousePointer2, Sparkles } from 'lucide-react'
import { easeHero, heroTransfer } from '@/lib/hero-transfer'
import { DecryptText } from './decrypt-text'

const PandaScene = lazy(() => import('./panda-scene'))
const NAV = ['Hello', 'Websites', 'Social', 'Together', 'Your world', 'Let’s grow']
const clamp = (x: number) => Math.max(0, Math.min(1, x))

// Adapted from the user's Lycoris Specimen and Dealate's LogoSpecimen.
// The original six-frame dwell/ease timeline drives a real panda sculpture.
function sceneCoord(progress: number) {
  const t = clamp(progress) * (NAV.length - 1)
  const i = Math.min(Math.floor(t), NAV.length - 2)
  return i + clamp((t - i - .17) / .66)
}
const KEYS = [[73, 48, 1], [27, 47, .88], [73, 47, .86], [27, 48, .95], [73, 46, .82], [27, 47, .94]]
const MOBILE_KEYS = [[59, 67, .78], [41, 67, .70], [59, 67, .72], [41, 67, .74], [59, 68, .68], [41, 67, .75]]
const GROWTH_QUOTES = [
  'Your ambition. Our creativity. A bigger tomorrow.',
  'Small beginnings. Thoughtful steps. Lasting growth.',
  'We build your presence, so you can grow your business.',
]

export default function LycorisSpecimen() {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const objectRef = useRef<HTMLDivElement>(null)
  const atomizationRef = useRef(0)
  const jumpRef = useRef<(index: number) => void>(() => {})
  const [active, setActive] = useState(0)
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [motionPaused, setMotionPaused] = useState(false)
  const [quote, setQuote] = useState(0)

  useEffect(() => {
    const root = rootRef.current!, stage = stageRef.current!, object = objectRef.current!
    const panels = Array.from(stage.querySelectorAll<HTMLElement>('[data-scene]'))
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, coord = 0, prevTime = 0, lastScene = -1, visible = true
    let previousTarget = 0
    let direction: 1 | -1 = 1
    let travel = 1
    const measure = () => { travel = Math.max(1, root.offsetHeight - stage.clientHeight); wake() }
    function paint() {
      const i = Math.min(Math.floor(coord), NAV.length - 2), f = coord - i
      const keys = stage.clientWidth < 760 ? MOBILE_KEYS : KEYS
      // Keep the departure pose while dissolving, cross only as atoms, then rebuild.
      // Mobile uses a smaller lateral excursion below its vertically stacked copy.
      const transfer = heroTransfer(f, Math.abs(KEYS[i + 1][0] - KEYS[i][0]) > 20, direction)
      atomizationRef.current = media.matches ? 0 : transfer.atoms
      object.dataset.transferPhase = transfer.phase
      object.dataset.atomization = atomizationRef.current.toFixed(4)
      const v = keys[i].map((n, j) => n + (keys[i + 1][j] - n) * transfer.position)
      object.style.left = `${v[0]}%`; object.style.top = `${v[1]}%`
      object.style.transform = `translate(-50%,-50%) scale(${v[2]})`
      stage.style.setProperty('--panda-x', `${v[0]}%`)
      stage.style.setProperty('--panda-solid', String(1 - transfer.atoms))
      const textCoord = i + easeHero(f)
      const index = Math.round(textCoord)
      if (index !== lastScene) { lastScene = index; setActive(index) }
      panels.forEach((panel, n) => {
        // As in the motion reference, copy yields to the particle crossing.
        // The new chapter becomes readable as the mascot reforms beside it.
        const positionOpacity = n === i ? 1 - easeHero(clamp(transfer.position / .28))
          : n === i + 1 ? easeHero(clamp((transfer.position - .72) / .28)) : 0
        const opacity = positionOpacity * (1 - transfer.atoms * .35)
        panel.style.opacity = String(opacity)
        panel.style.visibility = opacity < .01 ? 'hidden' : 'visible'
        panel.style.transform = `translateY(${(1 - opacity) * (n > textCoord ? 24 : -24)}px)`
        panel.style.filter = `blur(${(1 - opacity) * 5}px)`
        panel.inert = n !== index
        panel.setAttribute('aria-hidden', String(n !== index))
      })
      stage.style.setProperty('--scene-progress', String(coord / (NAV.length - 1)))
    }
    function tick(now: number) {
      frame = 0
      if (!visible || document.hidden || media.matches) return
      const offset = parseFloat(getComputedStyle(stage).top) || 0
      const target = sceneCoord((offset - root.getBoundingClientRect().top) / travel)
      if (Math.abs(target - previousTarget) > .0001) direction = target > previousTarget ? 1 : -1
      previousTarget = target
      const dt = Math.min(50, now - (prevTime || now - 16)); prevTime = now
      coord += (target - coord) * (1 - Math.exp(-dt / 72))
      if (Math.abs(coord - target) < .0001) coord = target
      paint()
      if (Math.abs(coord - target) > .0001) wake()
    }
    function wake() { if (!frame && visible && !document.hidden && !media.matches) frame = requestAnimationFrame(tick) }
    const sync = () => {
      setReduced(media.matches)
      root.dataset.reduced = String(media.matches)
      if (media.matches) { coord = 0; paint() }
      measure()
    }
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); else { cancelAnimationFrame(frame); frame = 0 } })
    io.observe(root)
    const ro = new ResizeObserver(measure); ro.observe(stage)
    jumpRef.current = index => {
      const offset = parseFloat(getComputedStyle(stage).top) || 0
      window.scrollTo({ top: scrollY + root.getBoundingClientRect().top - offset + index / 5 * travel, behavior: media.matches ? 'instant' : 'smooth' })
    }
    window.addEventListener('scroll', wake, { passive: true })
    document.addEventListener('visibilitychange', wake)
    media.addEventListener('change', sync)
    sync(); paint()
    return () => { cancelAnimationFrame(frame); io.disconnect(); ro.disconnect(); window.removeEventListener('scroll', wake); document.removeEventListener('visibilitychange', wake); media.removeEventListener('change', sync) }
  }, [])

  return <section ref={rootRef} className="specimen" aria-label="Meet Pearl Panda: an interactive six-scene story">
    <div className="specimen-stage" ref={stageRef}>
      <div className="hero-grain" aria-hidden="true" />
      <div className="hero-orbit orbit-one" aria-hidden="true" /><div className="hero-orbit orbit-two" aria-hidden="true" />
      <span className="hero-coordinate" aria-hidden="true">THOUGHTFULLY DIGITAL. NATURALLY DIFFERENT.</span>
      <div className="hero-availability"><span className="status-dot" /> Open for good projects</div>
      <div className="panda-object" ref={objectRef}>
        <Suspense fallback={<img className="panda-fallback" src="/media/logo.svg" alt="Pearl Panda holding bamboo" />}>
          <PandaScene scene={active} reducedMotion={reduced || motionPaused} atomizationRef={atomizationRef} />
        </Suspense>
      </div>
      <article className="hero-panel hero-cover" data-scene="0">
        <p className="eyebrow"><span className="mini-star">✳</span> YOUR NEXT CHAPTER STARTS HERE</p>
        <h1 className="hero-welcome"><DecryptText as="span" text="Welcome to" trigger="mount" loop={false} stagger={42} startDelay={160} retriggerOnHover={false} reducedMotion={motionPaused || reduced} /><DecryptText as="span" className="serif-word hero-welcome-brand" text="pearl panda." trigger="mount" loop={false} stagger={55} startDelay={500} retriggerOnHover reducedMotion={motionPaused || reduced} /></h1>
        <p className="hero-description">Thoughtful websites. Scroll-stopping social.<br />A little creativity. A lot of room to <em>grow.</em></p>
        <div className="hero-actions"><Link to="/contact" className="button magnetic">Let’s grow together <ArrowUpRight size={18} /></Link><Link to="/work" className="text-link">Explore our world <ArrowUpRight size={16} /></Link></div>
        <div className="hero-growth-note">
          <div className="hero-growth-label"><span>OUR KIND OF GROWTH</span><div className="growth-quote-controls" role="group" aria-label="Growth messages">{GROWTH_QUOTES.map((message, index) => <button type="button" key={message} aria-label={`Growth message ${index + 1}: ${message}`} aria-pressed={quote === index} onClick={() => setQuote(index)}><span /></button>)}</div></div>
          <blockquote><DecryptText as="p" text={GROWTH_QUOTES[quote]} trigger="inview" loop={false} stagger={17} startDelay={250} retriggerOnHover={false} reducedMotion={motionPaused || reduced} /></blockquote>
        </div>
      </article>
      <article className="hero-panel hero-panel-right" data-scene="1" aria-hidden="true">
        <p className="eyebrow">01 / WEBSITES WITH PERSONALITY</p><h2>Built to click.<br />Made to <span className="serif-word">last.</span></h2>
        <p className="hero-description">From a beautiful first impression to a fully connected platform. Your next chapter starts here.</p>
        <div className="hero-chips"><span>Portfolio websites</span><span>Dynamic websites</span><span>Web applications</span></div>
        <Link className="button" to="/services#websites">Find your website <Code2 size={18} /></Link>
      </article>
      <article className="hero-panel" data-scene="2" aria-hidden="true">
        <p className="eyebrow">02 / SOCIAL WITH SOMETHING TO SAY</p><h2>Less noise.<br />More <span className="serif-word">connection.</span></h2>
        <p className="hero-description">Fresh ideas, thoughtful creatives and a consistent presence. We keep your story moving, month after month.</p>
        <Link className="button" to="/services#social">Meet your social side <ArrowUpRight size={18} /></Link>
      </article>
      <article className="hero-panel hero-panel-right" data-scene="3" aria-hidden="true">
        <p className="eyebrow">03 / BETTER TOGETHER</p><h2>One brand.<br />A whole <span className="serif-word">world.</span></h2>
        <p className="hero-description">Your website and social media, speaking the same language. One thoughtful creative partnership.</p>
        <Link className="button" to="/services#together">Discover the combination <Sparkles size={18} /></Link>
      </article>
      <article className="hero-panel" data-scene="4" aria-hidden="true">
        <p className="eyebrow">04 / YOUR WORLD, REIMAGINED</p><h2>Different dreams.<br />Same <span className="serif-word">care.</span></h2>
        <p className="hero-description">The corner café. The next big launch. The place someone calls home. We find what makes your business, yours.</p>
        <Link className="button" to="/industries">Find your industry <ArrowUpRight size={18} /></Link>
      </article>
      <article className="hero-panel hero-panel-right" data-scene="5" aria-hidden="true">
        <p className="eyebrow">05 / BIG THINGS START SMALL</p><h2>A good idea.<br />A great <span className="serif-word">beginning.</span></h2>
        <p className="hero-description">Bring your ambition. We’ll bring the curiosity, creativity and care to help it grow.</p>
        <Link className="button" to="/contact">Tell us your idea <ArrowUpRight size={18} /></Link>
      </article>
      <div className="panda-caption"><span className="tiny-orbit">✦</span> A little curious. Just like us.<span className="caption-line" /></div>
      <div className="hero-bottom">
        <button className="scroll-prompt" onClick={() => reduced ? document.getElementById('services')?.scrollIntoView() : active === 5 ? document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) : jumpRef.current(active + 1)}><span className="scroll-circle"><ArrowDown size={17} /></span> Scroll to grow <span className="scroll-hairline" /></button>
        <nav className="scene-nav" aria-label="Hero story chapters">{NAV.map((name, i) => <button key={name} aria-label={`Scene ${i + 1}: ${name}`} aria-current={active === i ? 'step' : undefined} onClick={() => jumpRef.current(i)}><span>{String(i + 1).padStart(2, '0')}</span><i /></button>)}</nav>
        <button className="motion-toggle" onClick={() => setMotionPaused(v => !v)} aria-pressed={motionPaused}>{motionPaused ? 'Resume motion' : <><MousePointer2 size={13} /> Move, drag & discover</>}</button>
      </div>
      <div className="scene-progress" aria-hidden="true" />
    </div>
  </section>
}
