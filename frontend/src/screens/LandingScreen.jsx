import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import AuthScreen from './AuthScreen'
import { useStore } from '../store'

/* ── animated counter ─────────────────────────────────────────────────── */
function Counter({ to, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = to / 60
    const timer = setInterval(() => {
      start += step
      if (start >= to) { setCount(to); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, to])
  return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>
}

/* ── typewriter ───────────────────────────────────────────────────────── */
const SUBTITLES = [
  'Real-time movement analysis.',
  'Injury prevention intelligence.',
  'AI-powered form coaching.',
  'Biomechanics at a glance.',
]
function Typewriter() {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const target = SUBTITLES[idx]
    if (!deleting && displayed.length < target.length) {
      const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 48)
      return () => clearTimeout(t)
    }
    if (!deleting && displayed.length === target.length) {
      const t = setTimeout(() => setDeleting(true), 1800)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 24)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length === 0) { setDeleting(false); setIdx(i => (i + 1) % SUBTITLES.length) }
  }, [displayed, deleting, idx])
  return (
    <span className="text-accent-primary">
      {displayed}
      <span className="border-r-2 border-accent-primary ml-0.5 animate-[blink_0.75s_step-end_infinite]" />
    </span>
  )
}

/* ── features ─────────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: '🦴', title: 'Pose Estimation',      desc: 'Frame-by-frame 33-point skeletal tracking.' },
  { icon: '⚡', title: 'Risk Scoring',         desc: 'Multi-dimensional injury risk model per session.' },
  { icon: '🤖', title: 'AI Coaching',          desc: 'Personalised drill cues and warm-up plans.' },
  { icon: '🎥', title: 'Live Camera',          desc: 'Webcam analysis with real-time skeleton overlay.' },
  { icon: '📊', title: 'Progress Tracking',    desc: 'Streak gamification and trend charts.' },
  { icon: '🔬', title: 'Biomechanics Engine',  desc: 'Joint angles, velocity curves and fatigue indexes.' },
]

const STEPS = [
  { n: '01', title: 'Upload or Record', desc: 'Drop a video or use your webcam.' },
  { n: '02', title: 'Auto-Analyse',     desc: 'Our engine scores every rep and risk factor.' },
  { n: '03', title: 'Act on Insights',  desc: 'Follow AI coaching cues and track improvement.' },
]

/* ── main ───────────────────────────────────────────────────────────────── */
export default function LandingScreen({ onGetStarted, onSignIn }) {
  const [scrolled, setScrolled] = useState(false)
  const [authPanel, setAuthPanel] = useState('none')
  const [demoLoading, setDemoLoading] = useState(false)
  const loginAsDemo = useStore((s) => s.loginAsDemo)

  const handleDemo = () => {
    setDemoLoading(true)
    setTimeout(() => { loginAsDemo(); setDemoLoading(false) }, 600)
  }

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // when store triggers login, these callbacks fire
  const openSignup = () => setAuthPanel('signup')
  const openLogin  = () => setAuthPanel('login')

  return (
    <div className="min-h-screen bg-bg-base overflow-x-hidden">

      {/* ── ambient orbs ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[
          { w: 700, h: 700, t: '-20%', l: '-15%', c: 'rgba(79,70,229,0.07)', dx: 18, dy: -30, dur: 16, delay: 0 },
          { w: 500, h: 500, t: '55%',  r: '-8%',  c: 'rgba(124,58,237,0.05)', dx: -14, dy: 24, dur: 12, delay: 2 },
          { w: 380, h: 380, t: '25%',  l: '40%',  c: 'rgba(8,145,178,0.04)',  dx: 8,  dy: -20, dur: 18, delay: 4 },
        ].map((o, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width: o.w, height: o.h, top: o.t, left: o.l, right: o.r,
                     background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
                     filter: 'blur(80px)' }}
            animate={{ y: [0, o.dy, 0], x: [0, o.dx, 0] }}
            transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut', delay: o.delay }}
          />
        ))}
      </div>

      {/* ── NAV ───────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16"
        style={{
          background: scrolled ? 'rgba(248,250,252,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(15,23,42,0.07)' : 'none',
          transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent-primary to-accent-secondary shadow-md shadow-accent-primary/20">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="font-bold text-text-primary text-base tracking-tight">InjuryLens</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openLogin}
            className="text-sm font-medium px-4 py-2 rounded-lg text-text-secondary hover:text-text-primary transition-colors">
            Sign in
          </button>
          <motion.button onClick={openSignup} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 2px 12px rgba(79,70,229,0.28)' }}>
            Get started
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className={`grid gap-12 items-center ${authPanel !== 'none' ? 'md:grid-cols-2' : 'md:grid-cols-1 text-center'}`}>

            {/* left: copy */}
            <div className={authPanel !== 'none' ? '' : 'flex flex-col items-center'}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 text-xs font-semibold
                           uppercase tracking-wide glass border border-accent-primary/20 text-accent-primary shadow-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary" />
                </span>
                AI-powered injury prevention
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="text-5xl md:text-6xl font-extrabold leading-[1.08] tracking-tight text-text-primary mb-5"
              >
                Move smarter.{' '}
                <span className="gradient-text">Stay injury-free.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-lg text-text-secondary max-w-lg min-h-[1.75rem] mb-8"
              >
                <Typewriter />
              </motion.p>

              <AnimatePresence>
                {authPanel === 'none' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col sm:flex-row items-center gap-4"
                  >
                    <motion.button onClick={openSignup} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
                      className="px-8 py-3.5 rounded-xl font-bold text-white text-base"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 20px rgba(79,70,229,0.30)' }}>
                      Start free analysis
                    </motion.button>
                    <motion.button onClick={openLogin} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="px-8 py-3.5 rounded-xl font-semibold text-base glass border border-border-accent text-accent-primary hover:bg-accent-primary/8 transition-colors">
                      Sign in →
                    </motion.button>
                    <motion.button onClick={handleDemo} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      disabled={demoLoading}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-text-secondary border border-border-subtle glass hover:border-warning/40 hover:text-warning transition-all"
                      style={{ boxShadow: demoLoading ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                      {demoLoading
                        ? <span className="w-4 h-4 border-2 border-warning/40 border-t-warning rounded-full animate-spin" />
                        : '⚡'}
                      Try Demo
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* right: auth card — slides in when activated */}
            <AnimatePresence>
              {authPanel !== 'none' && (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: 40, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0,  scale: 1    }}
                  exit={{    opacity: 0, x: 40, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.16,1,0.3,1] }}
                >
                  <AuthScreen defaultTab={authPanel} onClose={() => setAuthPanel('none')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* scroll hint — only when no auth panel */}
        {authPanel === 'none' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
              className="w-5 h-8 rounded-full border-2 border-border-accent flex items-start justify-center p-1">
              <div className="w-1 h-2 rounded-full bg-accent-primary" />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Videos analysed',   value: 12400, suffix: '+' },
            { label: 'Accuracy',          value: 94,    suffix: '%' },
            { label: 'Movements tracked', value: 30,    suffix: '+' },
            { label: 'Happy athletes',    value: 3200,  suffix: '+' },
          ].map((s) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="glass-elevated rounded-2xl flex flex-col items-center py-6 px-4 text-center border border-border-subtle shadow-sm">
              <span className="text-3xl font-extrabold gradient-text"><Counter to={s.value} suffix={s.suffix} /></span>
              <span className="mt-1 text-xs text-text-muted uppercase tracking-widest">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-extrabold text-text-primary mb-4">
              Everything you need to <span className="gradient-text">perform better</span>
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">Professional-grade analysis, accessible to every athlete.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group glass rounded-2xl p-6 border border-border-subtle shadow-sm hover:shadow-card-lift hover:border-border-accent transition-shadow">
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-text-primary mb-1.5">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-bg-surface">
        <div className="max-w-5xl mx-auto">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-text-primary text-center mb-14">
            How it works
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div key={step.n}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative flex flex-col items-start p-7 rounded-2xl glass border border-border-subtle shadow-sm">
                <span className="text-5xl font-black mb-4 leading-none gradient-text opacity-30">{step.n}</span>
                <h3 className="font-bold text-text-primary text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto rounded-3xl p-10 md:p-14 border border-accent-primary/15"
          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.05), rgba(124,58,237,0.03))', boxShadow: '0 0 60px rgba(79,70,229,0.06)' }}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4">Ready to analyse your movement?</h2>
          <p className="text-text-secondary mb-8">Get started free. No credit card required.</p>
          <motion.button onClick={openSignup} whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
            className="px-10 py-4 rounded-xl font-bold text-white text-base"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 20px rgba(79,70,229,0.28)' }}>
            Start free analysis
          </motion.button>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="py-8 text-center text-xs text-text-muted border-t border-border-subtle">
        © {new Date().getFullYear()} InjuryLens. All rights reserved.
      </footer>
    </div>
  )
}
