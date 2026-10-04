import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { ArrowUpRight, Menu, X, ArrowUp, Leaf } from 'lucide-react'
import Home from '@/pages/Home'
import { AboutPage, ContactPage, IndustriesPage, NotFoundPage, ServicesPage, WorkPage } from '@/pages/InnerPages'
import { CursorHalo, RouteEffects } from '@/components/ui/interactive'

const TargetCursor = lazy(() => import('@/components/ui/target-cursor'))

function PageCursor() {
  const { pathname } = useLocation()
  if (pathname.replace(/\/+$/, '') !== '/services') return <CursorHalo />
  return <Suspense fallback={null}><TargetCursor targetSelector=".services-page .ip-service-card, .services-page .ip-social-list > div, a[href], button:not(:disabled)" spinDuration={2} parallaxOn /></Suspense>
}

function Brand() {
  return <Link to="/" className="brand" aria-label="Pearl Panda home"><span className="brand-icon"><img src="/favicon.svg" width="38" height="38" alt="" /></span><span>pearl panda<span className="brand-period">.</span><small>THOUGHTFULLY DIGITAL</small></span></Link>
}
function Header() {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const nav = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = nav.current?.querySelector<HTMLAnchorElement>('a'); first?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggle.current?.focus() }
      if (e.key === 'Tab') {
        const links = nav.current?.querySelectorAll<HTMLAnchorElement>('a')
        if (!links?.length) return
        const last = links[links.length - 1]
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); toggle.current?.focus() }
        else if (e.shiftKey && document.activeElement === toggle.current) { e.preventDefault(); last.focus() }
      }
    }
    const wide = matchMedia('(min-width: 901px)')
    const closeWide = () => { if (wide.matches) setOpen(false) }
    wide.addEventListener('change', closeWide)
    window.addEventListener('keydown', key)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); wide.removeEventListener('change', closeWide) }
  }, [open])
  return <header className="site-header"><Brand /><nav id="main-nav" ref={nav} className={`main-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">{[['/', 'Home'], ['/services', 'Services'], ['/industries', 'Industries'], ['/work', 'Our work'], ['/about', 'About us']].map(([path, label]) => <NavLink key={path} to={path} end={path === '/'}>{label}</NavLink>)}<Link to="/contact" className="mobile-contact">Let’s talk <ArrowUpRight size={17} /></Link></nav><Link className="header-cta" to="/contact">Let’s talk <ArrowUpRight size={17} /></Link><button ref={toggle} className="menu-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(v => !v)}>{open ? <X /> : <Menu />}</button></header>
}
function Footer() {
  return <footer className="site-footer container"><div className="footer-top"><div><Brand /><p>A little different.<br />A lot of heart.</p></div><div className="footer-links"><span>TAKE A LOOK AROUND</span><Link to="/services">Services</Link><Link to="/industries">Industries</Link><Link to="/work">Our work</Link><Link to="/about">About us</Link></div><div className="footer-hello"><span>BIG THINGS START SMALL</span><Link to="/contact">Say hello. <ArrowUpRight size={30} /></Link><p><Leaf size={14} /> Let’s make your next chapter a good one.</p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Pearl Panda. Made with care.</span><span>CLEAN. FRIENDLY. MODERN. MEMORABLE.</span><div className="footer-controls"><button onClick={() => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>Back to top <ArrowUp size={15} /></button></div></div></footer>
}
export default function App() {
  return <><a className="skip-link" href="#main-content">Skip to content</a><RouteEffects /><Header /><div id="main-content"><Routes><Route path="/" element={<Home />} /><Route path="/services" element={<ServicesPage />} /><Route path="/industries" element={<IndustriesPage />} /><Route path="/work" element={<WorkPage />} /><Route path="/about" element={<AboutPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="*" element={<NotFoundPage />} /></Routes></div><Footer /><PageCursor /></>
}
