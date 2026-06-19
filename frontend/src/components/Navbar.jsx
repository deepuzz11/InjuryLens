import React from 'react'
import { Activity, History, BarChart3, Video, Users } from 'lucide-react'
import { useStore } from '../store'

export default function Navbar() {
  const screen    = useStore((s) => s.screen)
  const reset     = useStore((s) => s.reset)
  const setScreen = useStore((s) => s.setScreen)
  const history   = useStore((s) => s.history)
  const streak    = useStore((s) => s.streak)

  const isHistory   = screen === 'history'
  const isDashboard = screen === 'dashboard'
  const isResults   = screen === 'results'
  const isLive      = screen === 'live'
  const isProfiles  = screen === 'profiles'

  const navBtn = (label, icon, targetScreen, current, badge) => (
    <button
      onClick={() => setScreen(targetScreen)}
      aria-current={current ? 'page' : undefined}
      className={`relative flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
        current
          ? 'bg-accent-primary/10 text-accent-primary'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge != null && badge > 0 && !current && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-primary text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <button onClick={() => reset()} className="flex items-center gap-2.5 flex-shrink-0" aria-label="InjuryLens — home">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <Activity size={16} className="text-white" aria-hidden />
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight select-none">InjuryLens</span>
        </button>

        {/* Centre tagline */}
        <span className="hidden md:block text-xs text-text-muted">AI-Powered Movement Analysis</span>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {screen === 'upload' && (
            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 hidden sm:block">
              How it works
            </a>
          )}

          {navBtn('Live', <Video size={14} aria-hidden />, 'live', isLive)}
          {navBtn('History', <History size={14} aria-hidden />, 'history', isHistory, history.length)}
          {navBtn('Progress', <BarChart3 size={14} aria-hidden />, 'dashboard', isDashboard)}
          {navBtn('Profiles', <Users size={14} aria-hidden />, 'profiles', isProfiles)}

          {/* Streak flame indicator */}
          {streak >= 2 && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-warning font-semibold px-2 py-1">
              🔥 {streak}
            </span>
          )}

          {isResults && (
            <button
              onClick={reset}
              className="ml-1 text-sm bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 px-4 py-1.5 rounded-lg transition-all duration-200"
            >
              New Analysis
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
