import React from 'react'
import { Activity, History, BarChart3, Settings } from 'lucide-react'
import { useStore } from '../store'

export default function Navbar() {
  const screen   = useStore((s) => s.screen)
  const reset    = useStore((s) => s.reset)
  const setScreen = useStore((s) => s.setScreen)
  const history  = useStore((s) => s.history)

  const isHome     = screen === 'upload'
  const isResults  = screen === 'results'
  const isHistory  = screen === 'history'
  const isDashboard = screen === 'dashboard'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <button
          onClick={() => reset()}
          className="flex items-center gap-2.5 flex-shrink-0"
          aria-label="InjuryLens — go to home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <Activity size={16} className="text-white" aria-hidden />
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight select-none">
            InjuryLens
          </span>
        </button>

        {/* Centre tagline */}
        <span className="hidden md:block text-xs text-text-muted">
          AI-Powered Movement Analysis
        </span>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {isHome && (
            <a
              href="#how-it-works"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              How it works
            </a>
          )}

          <button
            onClick={() => setScreen('history')}
            aria-current={isHistory ? 'page' : undefined}
            className={`relative flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
              isHistory
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <History size={14} aria-hidden />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && !isHistory && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent-primary text-white text-[10px] font-bold flex items-center justify-center">
                {history.length > 9 ? '9+' : history.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setScreen('dashboard')}
            aria-current={isDashboard ? 'page' : undefined}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
              isDashboard
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            }`}
          >
            <BarChart3 size={14} aria-hidden />
            <span className="hidden sm:inline">Progress</span>
          </button>

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
