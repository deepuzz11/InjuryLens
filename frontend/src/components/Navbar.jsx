import React from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { useStore } from '../store'

export default function Navbar() {
  const screen = useStore((s) => s.screen)
  const reset = useStore((s) => s.reset)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => screen !== 'upload' && reset()}
          className="flex items-center gap-2.5 group"
          aria-label="InjuryLens home"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/20">
            <Activity size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight">InjuryLens</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          <span className="text-xs text-text-muted">AI-Powered Movement Analysis</span>
        </div>

        <nav className="flex items-center gap-3">
          {screen === 'upload' && (
            <a
              href="#how-it-works"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              How it works
            </a>
          )}
          {screen === 'results' && (
            <button
              onClick={reset}
              className="text-sm bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 px-4 py-1.5 rounded-lg transition-all duration-200"
            >
              Analyze Another Video
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
