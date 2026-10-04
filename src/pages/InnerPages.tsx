import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CheckCheck, Code2, Coffee, Download, Home, Layers3, Lightbulb, Megaphone, Monitor, MousePointer2, Palette, Rocket, Save, ShoppingBag, Sparkles, Sprout, Users, X } from 'lucide-react';
import './inner-pages.css';

function PageIntro({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent?: string; children: ReactNode }) {
  const introRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = introRef.current?.closest('main')?.querySelectorAll<HTMLElement>('.ip-service-card, .ip-industry-card, .ip-process-grid article, .ip-about-story, .ip-social-list > div, .ip-cta');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ip-is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    elements?.forEach((element, index) => {
      element.classList.add('ip-scroll-reveal');
      element.style.setProperty('--ip-reveal-delay', `${index % 3 * 65}ms`);
      observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return <section ref={introRef} className="ip-intro container"><p className="eyebrow"><span />{eyebrow}</p><h1>{title}{accent && <><br /><em>{accent}</em></>}</h1><div className="ip-intro-bottom"><p>{children}</p><span className="ip-intro-symbol" aria-hidden="true"><ArrowDown strokeWidth={1.3} /></span></div></section>;
}

function ProjectCta({ title = 'A good idea deserves a great presence.' }: { title?: string }) {
  return <section className="ip-cta container"><div><p className="eyebrow">LET’S MAKE IT HAPPEN</p><h2>{title}</h2><p>Your next chapter starts with a conversation.</p></div><Link className="button" to="/contact">Let’s work together <ArrowUpRight size={18} /></Link><span className="ip-cta-orbit" aria-hidden="true" /></section>;
}

const websiteServices = [
  { no: '01', icon: Monitor, name: 'Basic Portfolio', tag: 'YOUR FIRST IMPRESSION, SORTED.', text: 'A beautiful, focused home for your brand. Everything people need to discover you, understand your work, and take the next step.', features: ['Responsive informational pages', 'Clear navigation and brand storytelling', 'Work, services, and contact sections', 'Website deployment'], note: 'For portfolios, service brands, and a confident start.' },
  { no: '02', icon: Layers3, name: 'Website with Backend', tag: 'BEAUTY WITH A WORKING BRAIN.', text: 'A website that does more behind the scenes. Connect your frontend with a backend and database built around your business.', features: ['Custom frontend and backend', 'Database integration', 'Dynamic content and forms', 'A connected, responsive experience'], note: 'For businesses ready for a more capable website.' },
  { no: '03', icon: Code2, name: 'Full Backend Website', tag: 'FROM WEBSITE TO EXPERIENCE.', text: 'When your idea needs more than pages. A complete web experience with the logic, accounts, and functionality that bring it to life.', features: ['Login and authentication', 'Application functionality', 'Frontend, backend, and database', 'Scope built around your requirements'], note: 'For platforms, applications, and bigger ambitions.' },
];

export function ServicesPage() {
  return <main className="inner-page services-page"><PageIntro eyebrow="WHAT WE DO" title="Good design." accent="Real possibilities.">From your first website to your everyday social presence, we help your business look the part and move forward.</PageIntro>
    <section id="websites" className="container ip-services-section" aria-labelledby="website-services"><div className="ip-section-top"><div><p className="eyebrow">01 / WEB DESIGN & DEVELOPMENT</p><h2 id="website-services">Built for where<br />you’re going.</h2></div><p>Three ways to build. One thoughtful approach.<br />Choose the foundation that fits your next step.</p></div><div className="ip-service-grid">{websiteServices.map(({ no, icon: Icon, name, tag, text, features, note }) => <article className="ip-service-card" key={no}><div className="ip-card-top"><Icon size={27} strokeWidth={1.5} /><span>{no}</span></div><p className="ip-small-label">{tag}</p><h3>{name}</h3><p>{text}</p><ul>{features.map(feature => <li key={feature}><Check size={16} />{feature}</li>)}</ul><p className="ip-service-note">{note}</p><Link to={`/contact?service=${encodeURIComponent(name)}`} className="ip-text-link">Explore your project <ArrowUpRight size={17} /></Link></article>)}</div><p className="ip-pricing-note">Every business is different. <Link to="/contact">Get in touch for current rates</Link> and a scope that makes sense for yours.</p></section>
    <section id="social" className="ip-social-section"><div className="container ip-social-layout"><div><p className="eyebrow">02 / MONTHLY SOCIAL MEDIA</p><h2>A presence that<br />doesn’t go quiet.</h2><p>A consistent social presence takes more than a good post. We bring the plan, the creativity, and the care that help your brand show up month after month.</p><Link className="button" to="/contact?service=Monthly%20Social%20Media">Let’s find your rhythm <ArrowUpRight size={18} /></Link></div><div className="ip-social-list">{[{ title: 'Content Planning', text: 'A clear direction for what you share, and why.' }, { title: 'Social Creatives', text: 'Visuals that feel like you and belong together.' }, { title: 'Captions & Copy', text: 'Words with a point of view and a purpose.' }, { title: 'Scheduling & Publishing', text: 'Approved content, published where agreed.' }, { title: 'Monthly Overview', text: 'A look at the month and what comes next.' }].map((item, i) => <div key={item.title}><span>0{i + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowUpRight size={21} /></div>)}</div></div></section>
    <section id="together" className="container ip-combo"><span className="ip-combo-icon"><Sparkles size={34} strokeWidth={1.5} /></span><div><p className="eyebrow">BETTER TOGETHER</p><h2>Your website. Your socials.<br />One very good team.</h2><p>Pair a one-time website project with monthly social media support. A cohesive first impression, followed by a consistent presence.</p></div><Link className="button button-secondary" to="/contact?service=Website%20%2B%20Social%20Media">Build your combination <ArrowUpRight size={18} /></Link></section><ProjectCta /></main>;
}

const industries = [
  { name: 'Cafes & Restaurants', icon: Coffee, line: 'Make them hungry for more.', description: 'Bring your atmosphere online with a welcoming website and social content that gives people a taste of your brand.', tags: ['Menus & experiences', 'Everyday stories'], className: 'cafe' },
  { name: 'Events', icon: Sparkles, line: 'Build the anticipation.', description: 'Give your event a memorable digital home and keep the excitement going with a consistent, considered social presence.', tags: ['Event websites', 'Social campaigns'], className: 'events' },
  { name: 'Real Estate', icon: Home, line: 'Create a sense of place.', description: 'Present spaces with clarity, tell the story behind your business, and make the next inquiry feel effortless.', tags: ['Property showcases', 'Brand visibility'], className: 'realestate' },
  { name: 'Retail & Local Businesses', icon: ShoppingBag, line: 'Your neighbourhood. And beyond.', description: 'A digital presence with all the personality of your business, designed to help more people discover what makes you special.', tags: ['Business websites', 'Local presence'], className: 'retail' },
  { name: 'Creators & Personal Brands', icon: Users, line: 'An online world that’s yours.', description: 'Give your work, perspective, and personality a distinctive home. Create a recognizable presence across your channels.', tags: ['Personal portfolios', 'Content identity'], className: 'creators' },
  { name: 'Startups & Small Businesses', icon: Rocket, line: 'Start with a strong foundation.', description: 'Turn your idea into a clear and credible online presence, with the website and social support your next stage calls for.', tags: ['Launch websites', 'Brand consistency'], className: 'startups' },
];

export function IndustriesPage() {
  return <main className="inner-page"><PageIntro eyebrow="WHO WE BUILD FOR" title="Different businesses." accent="Same big care.">Small details. Big personalities. We create digital experiences around the people, places, and ideas that make your business yours.</PageIntro><section className="container ip-industry-grid" aria-label="Industries we work with">{industries.map(({ name, icon: Icon, line, description, tags, className }, index) => <article id={`industry-${index}`} className={`ip-industry-card ip-industry-${className}`} key={name}><div className="ip-industry-art" aria-hidden="true"><span className="ip-art-circle" /><span className="ip-art-circle ip-art-circle-two" /><Icon size={62} strokeWidth={1.2} /><span className="ip-art-number">0{index + 1}</span></div><div className="ip-industry-copy"><p className="ip-small-label">{line}</p><h2>{name}</h2><p>{description}</p><div className="ip-tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div><Link className="ip-text-link" to={`/contact?industry=${encodeURIComponent(name)}`}>Let’s talk about your business <ArrowUpRight size={17} /></Link></div></article>)}</section><section className="container ip-industry-note"><Sprout size={31} strokeWidth={1.4} /><p>Don’t see your industry? Good ideas don’t fit into boxes.<br /><Link to="/contact">Tell us what you have in mind <ArrowUpRight size={16} /></Link></p></section><ProjectCta title="Let’s make your business feel like you." /></main>;
}

const process = [{ name: 'Discover', text: 'We start with your business, your audience, and what you want to achieve.', icon: Lightbulb }, { name: 'Find the right fit', text: 'Together, we choose the website, social media support, or combination you need.', icon: MousePointer2 }, { name: 'Make a clear plan', text: 'We agree on the scope, deliverables, and timeline before the work begins.', icon: CheckCheck }, { name: 'Create & develop', text: 'We bring the direction to life through thoughtful design and development.', icon: Palette }, { name: 'Review & refine', text: 'You see the work, share your feedback, and help us get the details right.', icon: Megaphone }, { name: 'Ready, set, launch', text: 'We prepare the final experience for launch and set up agreed ongoing support.', icon: Rocket }];

export function AboutPage() {
  return <main className="inner-page"><PageIntro eyebrow="A LITTLE ABOUT US" title="Small details." accent="Panda-sized heart.">We’re Pearl Panda. A creative partner for businesses that want a thoughtful website, a consistent social presence, and a brand that feels like them.</PageIntro><section className="container ip-about-story"><div className="ip-brand-tile"><div className="ip-brand-halo" /><img src="/media/logo.svg" alt="Pearl Panda brand mark" /><span className="ip-brand-caption">CREATIVE BY NATURE.</span><span className="ip-tile-sparkle ip-tile-sparkle-one">✳</span><span className="ip-tile-sparkle ip-tile-sparkle-two">✳</span></div><div><p className="eyebrow">THOUGHTFUL WORK. HUMAN CONNECTION.</p><h2>Your business has a story.<br />Let’s help it show.</h2><p>Some brands need their first place on the internet. Others need a website that works harder, or social content that finally feels connected. We meet you where you are.</p><p>We bring web design, development, and social media together with one simple intention: to make your digital presence feel clear, considered, and unmistakably yours.</p><div className="ip-about-values"><span><Check size={16} /> Clear communication</span><span><Check size={16} /> Purposeful design</span><span><Check size={16} /> Consistent care</span></div></div></section><section className="ip-process-section"><div className="container"><div className="ip-section-top"><div><p className="eyebrow">HOW WE MAKE IT HAPPEN</p><h2>A clear path.<br />Room for good ideas.</h2></div><p>You stay part of the process.<br />Here’s what working together looks like.</p></div><div className="ip-process-grid">{process.map(({ name, text, icon: Icon }, index) => <article key={name}><div><span>0{index + 1}</span><Icon size={26} strokeWidth={1.4} /></div><h3>{name}</h3><p>{text}</p></article>)}</div></div></section><ProjectCta title="Let’s make something worth caring about." /></main>;
}

type Concept = { id: string; category: 'Websites' | 'Social'; label: string; title: string; subtitle: string; description: string; scope: string[]; className: string };
const concepts: Concept[] = [
  { id: 'slow-morning', category: 'Websites', label: 'CAFE WEBSITE CONCEPT', title: 'Slow Morning', subtitle: 'A little pause. A better coffee.', description: 'An imagined neighbourhood cafe with a warm, welcoming digital home. The concept pairs expressive typography with a simple menu journey and a focus on the everyday ritual of a good cup.', scope: ['Art direction', 'Responsive homepage concept', 'Menu and visit journey'], className: 'coffee' },
  { id: 'after-hours', category: 'Social', label: 'EVENT SOCIAL CONCEPT', title: 'After Hours', subtitle: 'Out of office. Into the night.', description: 'A social identity exploration for an imagined evening event series. Bold type, electric colour, and a flexible visual system make room for announcements, artist moments, and the countdown to doors opening.', scope: ['Visual identity exploration', 'Social post system', 'Campaign copy direction'], className: 'event' },
  { id: 'good-spaces', category: 'Websites', label: 'REAL ESTATE WEBSITE CONCEPT', title: 'Good Spaces', subtitle: 'Find your kind of place.', description: 'An imagined property studio presented with an editorial approach. Architectural shapes, generous space, and quiet details create a considered starting point for a property showcase and inquiry experience.', scope: ['Visual direction', 'Property showcase concept', 'Inquiry journey'], className: 'spaces' },
];

function ConceptArt({ concept }: { concept: Concept }) {
  return <div className={`ip-concept-art ip-concept-${concept.className}`} aria-hidden="true">{concept.className === 'coffee' ? <><div className="ip-mock-browser"><div className="ip-mock-nav"><span>slow morning®</span><span>our story &nbsp; menu &nbsp; visit us ↗</span></div><div className="ip-coffee-copy"><span>A LITTLE PAUSE, EVERY DAY.</span><strong>Good things<br />take a little<br /><em>slow.</em></strong><span className="ip-mock-pill">Find your morning ↗</span></div><div className="ip-coffee-cup"><span /><i /></div><span className="ip-coffee-star">✳</span></div></> : concept.className === 'event' ? <><div className="ip-event-poster"><span>THE NIGHT IS STILL YOUNG.</span><strong>AFTER<br /><em>HOURS</em></strong><div className="ip-event-star">✳</div><div className="ip-event-bottom"><span>GOOD MUSIC.<br />BETTER COMPANY.</span><span>VOL.<br />001 ↗</span></div></div><div className="ip-event-small">STAY<br /><em>A LITTLE</em><br />LONGER ↗</div></> : <><div className="ip-space-browser"><div className="ip-mock-nav"><span>good spaces.</span><span>Spaces &nbsp; About &nbsp; ↗</span></div><strong>Somewhere<br />you belong.</strong><div className="ip-architecture"><span /><span /><span /><i /></div><span className="ip-space-bottom">SPACES FOR THE WAY YOU LIVE. <ArrowUpRight size={16} /></span></div></>}</div>;
}

export function WorkPage() {
  const [filter, setFilter] = useState<'All' | 'Websites' | 'Social'>('All');
  const [selected, setSelected] = useState<Concept | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (selected) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [selected]);
  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected]);
  const closeDialog = () => setSelected(null);
  return <main className="inner-page"><PageIntro eyebrow="THE POSSIBILITIES" title="Ideas with" accent="a little personality.">A peek into what thoughtful design can feel like. These self-initiated concept explorations show creative possibilities for the businesses we build for.</PageIntro><section className="container ip-work-section" aria-label="Concept explorations"><div className="ip-work-toolbar"><p><span className="ip-status-dot" /> Concept explorations <span className="ip-concept-note">/ Not client projects</span></p><div className="ip-filter-group" role="group" aria-label="Filter concepts">{(['All', 'Websites', 'Social'] as const).map(type => <button key={type} type="button" aria-pressed={filter === type} className={filter === type ? 'is-active' : ''} onClick={() => setFilter(type)}>{type}</button>)}</div></div><div className="ip-work-grid">{concepts.filter(concept => filter === 'All' || concept.category === filter).map(concept => <article className="ip-work-card" key={concept.id}><button type="button" className="ip-work-button" onClick={() => setSelected(concept)} aria-label={`View ${concept.title} concept`}><ConceptArt concept={concept} /><span className="ip-work-caption"><span><span className="ip-small-label">{concept.label}</span><span className="ip-work-title">{concept.title}</span></span><span className="ip-work-arrow"><ArrowUpRight size={23} /></span></span></button></article>)}</div><p className="ip-work-disclosure">These are original design concepts for fictional brands, created to explore visual directions. They are not commissioned projects or client endorsements.</p></section><ProjectCta title="Your business could be our next good idea." /><dialog ref={dialogRef} className="ip-case-dialog" onCancel={closeDialog} onClick={event => { if (event.target === event.currentTarget) closeDialog(); }} aria-labelledby="ip-case-title">{selected && <div className="ip-case-content"><button type="button" className="ip-dialog-close" onClick={closeDialog} aria-label="Close concept details" autoFocus><X size={23} /></button><ConceptArt concept={selected} /><div className="ip-case-copy"><p className="eyebrow">SELF-INITIATED CONCEPT / {selected.category.toUpperCase()}</p><h2 id="ip-case-title">{selected.title}</h2><p className="ip-case-subtitle">{selected.subtitle}</p><p>{selected.description}</p><div className="ip-tags">{selected.scope.map(item => <span key={item}>{item}</span>)}</div><p className="ip-case-disclaimer">A fictional brand and design exploration, not a client project.</p><Link className="button" onClick={closeDialog} to="/contact">Explore a direction for your brand <ArrowUpRight size={18} /></Link></div></div>}</dialog></main>;
}

type Brief = { name: string; email: string; business: string; service: string; project: string; consent: boolean };
const emptyBrief: Brief = { name: '', email: '', business: '', service: '', project: '', consent: false };
const serviceOptions = ['Basic Portfolio', 'Website with Backend', 'Full Backend Website', 'Monthly Social Media', 'Website + Social Media', 'Help me choose'];
const draftKey = 'pearl-panda-project-brief';
const contactEndpoint = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env.VITE_CONTACT_ENDPOINT?.trim();
const contactEmail = 'chaitu4765@gmail.com';
const formSubmitAction = `https://formsubmit.co/${contactEmail}`;

export function ContactPage() {
  const [brief, setBrief] = useState<Brief>(() => {
    const draft = { ...emptyBrief };
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const values = parsed as Record<string, unknown>;
          const limits = { name: 120, email: 254, business: 160, service: 100, project: 6000 };
          for (const field of ['name', 'email', 'business', 'service', 'project'] as const) {
            const value = values[field];
            if (typeof value === 'string') draft[field] = value.slice(0, limits[field]);
          }
          if (!serviceOptions.includes(draft.service)) draft.service = '';
        }
      }
    } catch { /* A blocked storage setting must not block the form. */ }
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service');
    if (service && serviceOptions.includes(service)) draft.service = service;
    const industry = params.get('industry');
    if (industry && industries.some(item => item.name === industry) && !draft.project) draft.project = `My business is in ${industry}. `;
    return draft;
  });
  const [status, setStatus] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error' | 'info'>('info');
  const [sending, setSending] = useState(false);
  const updateField = (key: keyof Brief, value: string | boolean) => { setBrief(current => ({ ...current, [key]: value })); setStatus(''); };
  const saveDraft = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ...brief, consent: false }));
      setStatusKind('success');
      setStatus('Draft saved on this device. You can come back and finish it here.');
    } catch {
      setStatusKind('error');
      setStatus('Your browser could not save this draft. You can still download your completed brief.');
    }
  };
  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
      setStatusKind('info');
      setStatus('Saved draft removed from this device. The details in your form are still here.');
    } catch {
      setStatusKind('error');
      setStatus('Your browser could not remove the saved draft. Check your browser’s site storage settings.');
    }
  };
  const downloadBrief = () => {
    const text = `PEARL PANDA — PROJECT BRIEF\n\nName: ${brief.name.trim()}\nEmail: ${brief.email.trim()}\nBusiness / brand: ${brief.business.trim() || 'Not specified'}\nInterested in: ${brief.service}\n\nABOUT THE PROJECT\n${brief.project.trim()}\n\nPrepared on ${new Date().toLocaleDateString('en-IN')}\n\nThis copy was downloaded locally. Downloading does not send a message to Pearl Panda.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pearl-panda-project-brief.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    if (!event.currentTarget.checkValidity() || !brief.name.trim() || !brief.project.trim() || !brief.consent || !serviceOptions.includes(brief.service)) {
      event.preventDefault();
      setStatusKind('error');
      setStatus('Please complete the required fields and agree to share your brief.');
      return;
    }
    if (!contactEndpoint) {
      // Let the browser make the native POST so FormSubmit can show its security
      // check and actual delivery/activation result. Never claim local success.
      setStatusKind('info');
      setStatus('Continue through FormSubmit’s security check to send your brief.');
      return;
    }
    event.preventDefault();
    setSending(true);
    setStatus('');
    try {
      const response = await fetch(contactEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...brief, source: 'pearl-panda-website' }) });
      if (!response.ok) throw new Error('Contact request failed');
      setStatusKind('success');
      setStatus('Your project brief has been accepted. Thank you for sharing your idea.');
    } catch {
      setStatusKind('error');
      setStatus('Your brief could not be sent. Save your draft or download a copy, and try again later.');
    } finally { setSending(false); }
  };
  return <main className="inner-page">
    <PageIntro eyebrow="LET’S START SOMETHING" title="Big idea?" accent="We’re all ears.">Tell us about your business. Build a brief to start the conversation, whether you know exactly what you need or you’re figuring it out.</PageIntro>
    <section className="container ip-contact-layout">
      <aside className="ip-contact-aside">
        <span className="ip-contact-sparkle" aria-hidden="true">✳</span>
        <h2>Plan something<br /><em>good.</em></h2>
        <p>A little context goes a long way. Share what you’re building, what you need, and what a great result would look like.</p>
        <div className="ip-contact-checklist"><p><Check size={17} /> Websites with personality</p><p><Check size={17} /> A consistent social presence</p><p><Check size={17} /> A plan that fits your business</p></div>
        <div className="ip-contact-note"><Sprout size={23} strokeWidth={1.5} /><p>Send your completed brief to Pearl Panda, or email us directly:<br /><a className="ip-contact-email" href={`mailto:${contactEmail}`}>{contactEmail}</a><br />Saved drafts stay on this device until you choose to send.</p></div>
      </aside>
      <form className="ip-brief-form" action={contactEndpoint || formSubmitAction} method="POST" onSubmit={submit} aria-describedby="ip-delivery-note">
        {!contactEndpoint && <>
          <input type="hidden" name="_subject" value="Pearl Panda — New project brief" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_replyto" value={brief.email.trim()} />
          <input type="text" name="_honey" className="ip-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        </>}
        <input type="hidden" name="source" value="pearl-panda-website" />
        <div className="ip-form-heading"><span>YOUR NEXT CHAPTER</span><span>01 — LET’S GET TO KNOW YOU</span></div>
        <div className="ip-form-row">
          <label>Your name <span>*</span><input name="name" required autoComplete="name" value={brief.name} onChange={event => updateField('name', event.target.value)} placeholder="What should we call you?" maxLength={120} /></label>
          <label>Email address <span>*</span><input name="email" required type="email" autoComplete="email" value={brief.email} onChange={event => updateField('email', event.target.value)} placeholder="you@yourbrand.com" maxLength={254} /></label>
        </div>
        <label>Business / brand name <span className="ip-optional">(optional)</span><input name="business" autoComplete="organization" value={brief.business} onChange={event => updateField('business', event.target.value)} placeholder="Your business, your idea, your next big thing" maxLength={160} /></label>
        <label>What can we help you with? <span>*</span><select name="service" value={brief.service} required onChange={event => updateField('service', event.target.value)}><option value="" disabled>Choose a service</option>{serviceOptions.map(service => <option key={service}>{service}</option>)}</select></label>
        <label>A little about your project <span>*</span><textarea name="project" value={brief.project} onChange={event => updateField('project', event.target.value)} required rows={5} maxLength={6000} placeholder="Tell us about your business, your goals, and any timeline you have in mind…" /></label>
        <label className="ip-consent"><input name="consent" value="Agreed to share this brief for a project inquiry" type="checkbox" required checked={brief.consent} onChange={event => updateField('consent', event.target.checked)} /><span>{contactEndpoint ? 'I agree to share these details with Pearl Panda for a response to my project inquiry.' : 'I agree to send these details to Pearl Panda via FormSubmit for a response to my project inquiry.'}</span></label>
        <div className="ip-form-actions">
          <button className="button" type="submit" disabled={sending}>{sending ? 'Sending your brief…' : 'Send project brief'}<ArrowUpRight size={18} /></button>
          <button className="ip-save-button" type="button" onClick={saveDraft}><Save size={16} />Save draft</button>
        </div>
        <div className="ip-form-secondary"><button type="button" onClick={clearDraft}>Remove saved draft</button><button type="button" onClick={() => { downloadBrief(); setStatusKind('success'); setStatus('A copy of your current brief is ready to download. Downloading does not send a message.'); }}><Download size={12} />Download a copy</button></div>
        <div className={`ip-form-status ip-form-status-${statusKind}`} role={statusKind === 'error' ? 'alert' : 'status'} aria-live="polite">{status}</div>
        <p id="ip-delivery-note" className="ip-form-footnote">{contactEndpoint ? 'Send shares your completed brief with Pearl Panda. Saving or downloading a draft does not send anything.' : <>Send opens FormSubmit’s security check. <a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">FormSubmit</a> processes your details to email them to Pearl Panda. Saving or downloading a draft does not send anything.</>}</p>
      </form>
    </section>
  </main>;
}

export function NotFoundPage() {
  return <main className="inner-page"><section className="container ip-not-found"><span className="ip-not-found-mark" aria-hidden="true">404</span><p className="eyebrow">A LITTLE OFF THE BEATEN PATH</p><h1>This page wandered off.</h1><p>Let’s get you back to something good.</p><Link className="button" to="/">Back to the good stuff <ArrowRight size={18} /></Link></section></main>;
}
