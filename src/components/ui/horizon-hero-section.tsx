import { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Pause, Play, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './horizon-hero-section.css'

// Pearl Panda adaptation of the user's Horizon Hero: a single, scoped cinematic
// scroll journey. The original global-document progress and repeated refs are
// replaced with hero-local progress, accessible chapters and reversible cleanup.
gsap.registerPlugin(ScrollTrigger)
const HorizonScene = lazy(() => import('./horizon-scene'))
const CHAPTERS = [
  { name: 'Welcome', kicker: 'WELCOME TO YOUR NEXT CHAPTER', title: 'Welcome to', accent: 'pearl panda.', description: 'Thoughtful websites. A social presence with soul. A whole universe of possibility for your business.', quote: 'Your ambition. Our creativity. A bigger tomorrow.', link: '/contact', cta: 'Let’s grow together', label: 'A LITTLE DIFFERENT. A LOT OF HEART.' },
  { name: 'Create', kicker: '01 / GIVE YOUR BUSINESS A HOME', title: 'Make a lasting', accent: 'impression.', description: 'From your first portfolio to a fully connected platform. We build the digital foundation for what comes next.', quote: 'Strong roots. Thoughtful design. Room to grow.', link: '/services#websites', cta: 'Explore websites', label: 'BEAUTIFULLY BUILT. PURPOSEFULLY YOURS.' },
  { name: 'Connect', kicker: '02 / YOUR BRAND, IN BLOOM', title: 'Be seen.', accent: 'Be remembered.', description: 'Ideas, stories and social creatives that help the right people find you—and give them a reason to stay.', quote: 'Real connection is where meaningful growth begins.', link: '/services#social', cta: 'Find your social side', label: 'A LITTLE MORE CONNECTION.' },
  { name: 'Together', kicker: '03 / ONE CONNECTED WORLD', title: 'One story.', accent: 'Everywhere.', description: 'Your website and social media, moving in the same direction. One creative partnership that sees the bigger picture.', quote: 'When every touchpoint connects, your brand grows stronger.', link: '/services#together', cta: 'Better, together', label: 'YOUR BRAND. PERFECTLY IN SYNC.' },
  { name: 'Your world', kicker: '04 / DIFFERENT DREAMS, THE SAME CARE', title: 'Your business.', accent: 'Our curiosity.', description: 'The corner café. The next big launch. The place someone calls home. We find what makes your world, yours.', quote: 'Big potential lives in businesses of every size.', link: '/industries', cta: 'Explore your possibilities', label: 'BUILT AROUND YOUR WORLD.' },
  { name: 'Grow', kicker: '05 / YOUR NEXT HORIZON', title: 'Small beginnings.', accent: 'Big possibilities.', description: 'Bring your idea, your ambition, your what-if. We’ll bring the creativity and care to help it take shape.', quote: 'We build your presence, so you can grow your business.', link: '/contact', cta: 'Tell us your idea', label: 'LET’S GROW SOMETHING GOOD.' },
] as const
const clamp = (value: number) => Math.max(0, Math.min(1, value))
const ease = (value: number) => value * value * (3 - 2 * value)

export default function HorizonHeroSection() {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef(0)
  const jumpRef = useRef<(index: number) => void>(() => {})
  const [active, setActive] = useState(0)
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [paused, setPaused] = useState(false)

  useLayoutEffect(() => {
    const root = rootRef.current!
    const stage = stageRef.current!
    const panels = [...stage.querySelectorAll<HTMLElement>('[data-chapter]')]
    const media = gsap.matchMedia()
    const movement = { progress: 0 }
    let current = -1

    const paint = (progress: number, isReduced: boolean) => {
      const raw = clamp(progress) * (CHAPTERS.length - 1)
      const index = Math.min(Math.floor(raw), CHAPTERS.length - 2)
      const fraction = ease(clamp((raw - index - .15) / .70))
      const coordinate = isReduced ? 0 : index + fraction
      progressRef.current = coordinate / (CHAPTERS.length - 1)
      const selected = Math.round(coordinate)
      if (selected !== current) { current = selected; setActive(selected) }
      panels.forEach((panel, panelIndex) => {
        const distance = Math.abs(coordinate - panelIndex)
        const opacity = ease(clamp((.58 - distance) / .32))
        panel.style.opacity = String(opacity)
        panel.style.visibility = opacity < .015 ? 'hidden' : 'visible'
        panel.style.transform = `translate3d(0,${(1 - opacity) * 30}px,0)`
        panel.style.filter = `blur(${(1 - opacity) * 5}px)`
        panel.inert = panelIndex !== selected
        panel.setAttribute('aria-hidden', String(panelIndex !== selected))
      })
      stage.style.setProperty('--horizon-progress', String(progressRef.current))
      stage.dataset.chapter = String(selected)
      stage.dataset.progress = progressRef.current.toFixed(4)
    }

    media.add({ reduce: '(prefers-reduced-motion: reduce)', animate: '(prefers-reduced-motion: no-preference)' }, context => {
      const isReduced = Boolean(context.conditions?.reduce)
      setReduced(isReduced)
      root.dataset.reduced = String(isReduced)
      movement.progress = 0
      paint(0, isReduced)
      if (isReduced) {
        jumpRef.current = () => document.getElementById('services')?.scrollIntoView({ behavior: 'instant' })
        return
      }
      const top = () => parseFloat(getComputedStyle(stage).top) || 0
      const distance = () => Math.max(1, root.offsetHeight - stage.offsetHeight)
      const tween = gsap.to(movement, {
        progress: 1, ease: 'none',
        onUpdate: () => paint(movement.progress, false),
        scrollTrigger: {
          trigger: root, start: () => `top ${top()}px`, end: () => `+=${distance()}`,
          scrub: .32, invalidateOnRefresh: true,
        },
      })
      const entrance = gsap.timeline({ defaults: { ease: 'power3.out' } })
      entrance.from(stage.querySelectorAll('[data-entrance]'), { y: 15, opacity: 0, stagger: .1, duration: .8 })
        .from(stage.querySelectorAll('[data-chapter="0"] .horizon-title-char'), { yPercent: 105, opacity: 0, stagger: .035, duration: .95 }, .12)
      jumpRef.current = chapter => {
        const start = window.scrollY + root.getBoundingClientRect().top - top()
        window.scrollTo({ top: start + chapter / (CHAPTERS.length - 1) * distance(), behavior: 'smooth' })
      }
      // Refresh this hero only when its real geometry changes, not each frame.
      const resize = new ResizeObserver(() => tween.scrollTrigger?.refresh())
      resize.observe(stage)
      return () => { resize.disconnect(); entrance.revert(); tween.kill(); tween.scrollTrigger?.kill() }
    }, root)
    return () => { media.revert(); jumpRef.current = () => {} }
  }, [])

  return <section className="horizon-hero" ref={rootRef} aria-label="Pearl Panda: a universe of growth">
    <div className="horizon-stage" ref={stageRef}>
      <div className="horizon-world" aria-hidden="true">
        <Suspense fallback={<div className="horizon-loading-art"><img src="/media/logo.svg" alt="" /></div>}>
          <HorizonScene progressRef={progressRef} reducedMotion={reduced} paused={paused} />
        </Suspense>
      </div>
      <div className="horizon-vignette" aria-hidden="true" />
      <div className="horizon-topline" data-entrance><span><Sparkles size={12} /> THOUGHTFULLY DIGITAL. NATURALLY DIFFERENT.</span><span className="horizon-available"><i /> Open for good projects</span></div>
      <div className="horizon-side-label" aria-hidden="true">ROOTED IN IDEAS <span /> GROWING POSSIBILITIES</div>
      {CHAPTERS.map((chapter, index) => {
        const Title = index === 0 ? 'h1' : 'h2'
        return <article className={`horizon-panel${index % 2 ? ' horizon-panel-right' : ''}`} key={chapter.name} data-chapter={index} aria-hidden={index !== 0} inert={index !== 0}>
          <p className="horizon-eyebrow"><span />{chapter.kicker}</p>
          <Title className={`horizon-title${index === 0 ? ' horizon-welcome-title' : ''}`}>
            <span className="horizon-title-line">{index === 0 ? <><span className="sr-only">{chapter.title}</span><span aria-hidden="true">{Array.from(chapter.title).map((character, i) => <span className="horizon-title-char" key={i}>{character === ' ' ? '\u00a0' : character}</span>)}</span></> : chapter.title}</span>
            <span className="horizon-title-accent">{index === 0 ? <><span className="sr-only">{chapter.accent}</span><span aria-hidden="true">{Array.from(chapter.accent).map((character, i) => <span className="horizon-title-char" key={i}>{character === ' ' ? '\u00a0' : character}</span>)}</span></> : chapter.accent}</span>
          </Title>
          <p className="horizon-description">{chapter.description}</p>
          <div className="horizon-actions"><Link to={chapter.link} className="horizon-cta">{chapter.cta}<ArrowUpRight size={18} /></Link>{index === 0 && <Link to="/work" className="horizon-work-link">Explore our work <ArrowUpRight size={15} /></Link>}</div>
          <blockquote className="horizon-quote"><span aria-hidden="true">“</span><p>{chapter.quote}</p></blockquote>
        </article>
      })}
      <div className="horizon-bottom" data-entrance>
        <button type="button" className="horizon-scroll" onClick={() => reduced || active === CHAPTERS.length - 1 ? document.getElementById('services')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' }) : jumpRef.current(active + 1)}><span><ArrowDown size={18} /></span><div>SCROLL TO EXPLORE<small>A little curiosity goes a long way.</small></div></button>
        <div className="horizon-navigation"><div className="horizon-nav-caption"><span>{CHAPTERS[active].name}</span><span>{String(active + 1).padStart(2, '0')} <i>/</i> 06</span></div><nav aria-label="Hero story chapters">{CHAPTERS.map((chapter, index) => <button type="button" key={chapter.name} aria-label={`Scene ${index + 1}: ${chapter.name}`} aria-current={active === index ? 'step' : undefined} onClick={() => jumpRef.current(index)}><span /></button>)}</nav></div>
        <button type="button" className="horizon-motion" aria-label={paused ? 'Resume ambient motion' : 'Pause ambient motion'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14} /> : <Pause size={14} />}<span>{paused ? 'Resume motion' : 'Pause motion'}</span></button>
      </div>
      <div className="horizon-progress" aria-hidden="true"><span /></div>
    </div>
  </section>
}

// Retain the pasted component's named import for consumers of the example.
export { HorizonHeroSection as Component }
