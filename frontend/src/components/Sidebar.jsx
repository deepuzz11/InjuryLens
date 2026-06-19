import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'

const NAV = [
  {
    label: 'Analyse',
    target: 'upload',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    label: 'Live',
    target: 'live',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
  {
    label: 'History',
    target: 'history',
    badge: true,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Progress',
    target: 'dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: 'Profiles',
    target: 'profiles',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  // sync sidebar width to CSS var so main content can react
  const W = collapsed ? 68 : 220
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--sidebar-w', `${W}px`)
  }
  const screen    = useStore((s) => s.screen)
  const setScreen = useStore((s) => s.setScreen)
  const reset     = useStore((s) => s.reset)
  const history   = useStore((s) => s.history)
  const streak    = useStore((s) => s.streak)
  const authUser  = useStore((s) => s.authUser)
  const logout    = useStore((s) => s.logout)

  return (
    <motion.aside
      animate={{ width: W }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(248,250,252,0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(15,23,42,0.08)',
        boxShadow: '2px 0 16px rgba(15,23,42,0.06)',
      }}
    >
      {/* logo row */}
      <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0 border-b border-border-subtle">
        <button
          onClick={reset}
          className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center
                     bg-gradient-to-br from-accent-primary to-accent-secondary
                     shadow-md shadow-accent-primary/20 hover:scale-105 transition-transform"
          aria-label="Go to home"
        >
          <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>
          </svg>
        </button>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden leading-none"
            >
              <p className="text-sm font-bold gradient-text tracking-tight whitespace-nowrap">InjuryLens</p>
              <p className="text-[10px] text-text-muted mt-0.5 whitespace-nowrap">AI Movement Analysis</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* nav items */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ label, target, icon, badge }) => {
          const isActive = screen === target || (target === 'upload' && screen === 'results')
          const count = badge ? history.length : 0

          return (
            <button
              key={target}
              onClick={() => target === 'upload' ? reset() : setScreen(target)}
              title={collapsed ? label : undefined}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              {/* icon wrapper */}
              <div className="relative flex-shrink-0">
                {icon}
                {count > 0 && !isActive && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold
                               flex items-center justify-center"
                    style={{ background: '#4f46e5' }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>

      {/* streak */}
      {streak >= 2 && (
        <div
          className={`mx-2 mb-2 flex items-center gap-2 px-3 py-2.5 rounded-xl overflow-hidden
                      transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.16)' }}
        >
          <span className="text-base flex-shrink-0">🔥</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="text-xs font-bold text-warning whitespace-nowrap">{streak}-day streak</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* user / logout */}
      {authUser && (
        <div
          className="mx-2 mb-2 flex items-center gap-2.5 px-3 py-2.5 rounded-xl overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.06)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            {authUser.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 overflow-hidden min-w-0"
              >
                <p className="text-xs font-semibold text-text-primary truncate">{authUser.name}</p>
                <button
                  onClick={logout}
                  className="text-[10px] text-text-muted hover:text-danger transition-colors"
                >
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="m-2 flex items-center justify-center h-9 rounded-xl transition-all
                   text-text-muted hover:text-accent-primary hover:bg-accent-primary/6"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <motion.svg
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.25 }}
          className="w-4 h-4"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
        </motion.svg>
      </button>
    </motion.aside>
  )
}
