import React from 'react'
import { Activity, History, BarChart3, Video, Users, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

export default function Navbar() {
  const screen    = useStore((s) => s.screen)
  const reset     = useStore((s) => s.reset)
  const setScreen = useStore((s) => s.setScreen)
  const history   = useStore((s) => s.history)
  const streak    = useStore((s) => s.streak)

  const isResults = screen === 'results'

  const navItems = [
    { label: 'Live',     icon: Video,     target: 'live'                        },
    { label: 'History',  icon: History,   target: 'history',  badge: history.length },
    { label: 'Progress', icon: BarChart3, target: 'dashboard'                   },
    { label: 'Profiles', icon: Users,     target: 'profiles'                    },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Gradient bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(79,70,229,0.30) 30%, rgba(124,58,237,0.22) 70%, transparent 100%)',
        }}
      />

      <div
        className="bg-bg-base/90 backdrop-blur-3xl"
        style={{
          WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <button
            onClick={reset}
            className="group flex items-center gap-3 flex-shrink-0"
            aria-label="InjuryLens — go to home"
          >
            {/* Logo icon */}
            <div className="relative w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center
                            bg-gradient-to-br from-accent-primary to-accent-secondary
                            shadow-lg shadow-accent-primary/20
                            group-hover:shadow-accent-primary/40 group-hover:scale-105
                            transition-all duration-300">
              <Activity size={17} className="text-white relative z-10" aria-hidden />
              {/* Shine overlay */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/15 pointer-events-none" />
            </div>

            {/* Brand text */}
            <div className="hidden sm:block leading-none">
              <p className="text-sm font-bold gradient-text tracking-tight">InjuryLens</p>
              <p className="text-[10px] text-text-muted mt-0.5 tracking-wide">AI Movement Analysis</p>
            </div>
            <span className="sm:hidden text-base font-bold gradient-text tracking-tight">InjuryLens</span>
          </button>

          {/* Center status badge — wide screens */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-text-muted px-3 py-1.5 rounded-full glass border border-border-subtle select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
            Gemini 2.0 Flash · MediaPipe Pose
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {screen === 'upload' && (
              <a
                href="#how-it-works"
                className="hidden sm:flex items-center text-xs text-text-secondary hover:text-text-primary
                           transition-colors px-3 py-2 rounded-lg hover:bg-white/5 mr-1"
              >
                How it works
              </a>
            )}

            {navItems.map(({ label, icon: Icon, target, badge }) => {
              const isActive = screen === target
              return (
                <button
                  key={target}
                  onClick={() => setScreen(target)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm
                              transition-all duration-200 select-none ${
                    isActive
                      ? 'text-accent-primary bg-accent-primary/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} aria-hidden />
                  <span className="hidden sm:inline font-medium">{label}</span>

                  {/* Badge */}
                  <AnimatePresence>
                    {badge > 0 && !isActive && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full
                                   bg-accent-primary text-white text-[9px] font-bold
                                   flex items-center justify-center
                                   border-2 border-white"
                      >
                        {badge > 9 ? '9+' : badge}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Sliding active underline indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute -bottom-px left-2 right-2 h-0.5 rounded-full
                                 bg-gradient-to-r from-accent-primary to-accent-secondary"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}

            {/* Streak badge */}
            {streak >= 2 && (
              <div className="hidden sm:flex items-center gap-1 ml-1 px-2 py-1.5 rounded-lg
                              bg-warning/8 border border-warning/15 select-none">
                <span className="text-sm leading-none">🔥</span>
                <span className="text-xs font-bold text-warning">{streak}</span>
              </div>
            )}

            {/* New Analysis CTA — only on results */}
            <AnimatePresence>
              {isResults && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.88, x: 8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.88, x: 8 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  onClick={reset}
                  className="ml-2 flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg
                             bg-gradient-to-r from-accent-primary to-accent-secondary text-white
                             shadow-md shadow-accent-primary/25
                             hover:brightness-110 hover:shadow-lg hover:shadow-accent-primary/35
                             active:scale-95 transition-all duration-200"
                >
                  <Plus size={13} aria-hidden />
                  <span className="hidden sm:inline">New Analysis</span>
                </motion.button>
              )}
            </AnimatePresence>
          </nav>
        </div>
      </div>
    </header>
  )
}
