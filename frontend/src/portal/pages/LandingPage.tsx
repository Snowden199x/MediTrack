import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import ScrollProgress from '../components/ScrollProgress'
import SplashIntro from '../components/SplashIntro'

// Splash fades out from 2.5s to 3.1s; content starts entering at 2.6s so the
// landing materialises as the splash dissolves.
const CONTENT_START_MS = 2600
const SPLASH_UNMOUNT_MS = 3200

function LandingPage({ go }) {
  const mainRef = useRef<HTMLElement>(null)

  // Intro plays once per session, and never for reduced-motion users.
  const [introActive] = useState(() => {
    if (typeof window === 'undefined') return false
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    try { return sessionStorage.getItem('meditrack-intro-seen') !== '1' } catch { return true }
  })
  const [showSplash, setShowSplash] = useState(introActive)
  const [contentStarted, setContentStarted] = useState(!introActive)

  useEffect(() => {
    if (!introActive) return
    try { sessionStorage.setItem('meditrack-intro-seen', '1') } catch { /* ignore */ }
    const start = window.setTimeout(() => setContentStarted(true), CONTENT_START_MS)
    const unmount = window.setTimeout(() => setShowSplash(false), SPLASH_UNMOUNT_MS)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(unmount)
    }
  }, [introActive])

  // Reveal-on-scroll is opt-in via a class so that, if this effect never runs,
  // the page still renders fully visible instead of stuck at opacity 0.
  useLayoutEffect(() => {
    const root = mainRef.current
    if (!root || !contentStarted) return

    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!items.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    root.classList.add('reveal-ready')

    // Each element parks itself well outside its resting spot (translated off
    // screen), so an IntersectionObserver would measure the *moved* box and could
    // report an off-screen element as never intersecting — leaving it hidden
    // forever. Instead measure the resting position directly: the parked offset
    // is static CSS, so capture it once and subtract it from the live rect.
    const parkedOffset = (element: HTMLElement) => {
      const matrix = window.getComputedStyle(element).transform
      if (!matrix || matrix === 'none') return 0
      const match = matrix.match(/matrix\(([^)]+)\)/)
      if (!match) return 0
      return Number(match[1].split(',')[5]) || 0
    }
    const offsets = new Map<HTMLElement, number>(
      items.map((item) => [item, parkedOffset(item)]),
    )

    let frame = 0

    const sweep = () => {
      frame = 0
      const trigger = window.innerHeight - 60
      let remaining = 0

      for (const item of items) {
        if (item.classList.contains('is-revealed')) continue
        const rect = item.getBoundingClientRect()
        const offset = offsets.get(item) || 0
        const top = rect.top - offset
        const bottom = rect.bottom - offset
        if (top < trigger && bottom > 0) item.classList.add('is-revealed')
        else remaining++
      }

      if (!remaining) {
        window.removeEventListener('scroll', schedule)
        window.removeEventListener('resize', schedule)
      }
    }

    function schedule() {
      if (frame) return
      frame = requestAnimationFrame(sweep)
    }
    
    sweep()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })

    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [contentStarted])

  return <main ref={mainRef} className={contentStarted ? 'landing-root' : 'landing-root intro-parked'}>
    {showSplash && <SplashIntro />}
    <ScrollProgress />
    <section className="landing-intro page-container">
      <div className="landing-copy">
        <h1 data-reveal>Health follow-up for the barangay</h1>
        <p data-reveal>MediTrack gives residents a place to report concerns and helps barangay health teams keep visits, requests, and follow-ups organized.</p>
        <div className="actions" data-reveal><button className="button" onClick={() => go('/register')}>Create a resident account</button><button className="button secondary" onClick={() => go('/login')}>Log in</button></div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-card hero-card-main" data-reveal>
          <div className="hero-card-head"><strong>Blood pressure check</strong><span className="badge badge-scheduled">scheduled</span></div>
          <p>Tomorrow, 9:00 AM at the barangay health center</p>
          <svg className="pulse" viewBox="0 0 260 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 34h64l12-24 18 46 16-36 10 14h136" /></svg>
        </div>
        <div className="hero-card hero-card-report" data-reveal><strong>Symptom report sent</strong><p>Your BHW will review it.</p></div>
        <div className="hero-card hero-card-follow" data-reveal><div className="hero-card-head"><strong>Follow-up</strong><span className="badge badge-completed">completed</span></div><p>Resident reached and advised.</p></div>
      </div>
    </section>
    <section className="landing-section page-container">
      <h2 data-reveal>How it works</h2>
      <ol className="steps">
        <li data-reveal><strong>Residents share a concern</strong><span>Answer short questions or send a request to the health team.</span></li>
        <li data-reveal><strong>Health workers review it</strong><span>BHWs record visits, schedules, and follow-up actions.</span></li>
        <li data-reveal><strong>The health center sees trends</strong><span>Authorized staff review area-level signals before taking action.</span></li>
      </ol>
    </section>
    <section className="landing-section page-container">
      <h2 data-reveal>Made for everyday health-center work</h2>
      <div className="feature-columns">
        <article data-reveal><svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg><h3>For residents</h3><p>See reminders, report symptoms in a guided form, and receive a response to requests.</p></article>
        <article data-reveal><svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 11h6M9 15h4" /></svg><h3>For BHWs</h3><p>Keep resident records, record visits, and follow up on missed checkups or new concerns.</p></article>
        <article data-reveal><svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg><h3>For health-center staff</h3><p>Publish announcements and review aggregated symptom trends for possible follow-up.</p></article>
      </div>
      <p className="safety-copy" data-reveal>Symptom reporting helps describe a concern and decide who to contact next. It does not provide a diagnosis.</p>
    </section>
  </main>
}

export default LandingPage