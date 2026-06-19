import React, { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider } from './context/AppContext'
import { useStore } from './store'
import UploadScreen   from './screens/UploadScreen'
import LoadingScreen  from './screens/LoadingScreen'
import LandingScreen  from './screens/LandingScreen'
import Sidebar        from './components/Sidebar'

const ResultsScreen      = lazy(() => import('./screens/ResultsScreen'))
const HistoryScreen      = lazy(() => import('./screens/HistoryScreen'))
const DashboardScreen    = lazy(() => import('./screens/DashboardScreen'))
const ComparisonScreen   = lazy(() => import('./screens/ComparisonScreen'))
const LiveAnalysisScreen = lazy(() => import('./screens/LiveAnalysisScreen'))
const ProfilesScreen     = lazy(() => import('./screens/ProfilesScreen'))

const pageVariants = {
  initial: { opacity: 0, y: 14, scale: 0.985 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, y: -10, scale: 0.99,
    transition: { duration: 0.22, ease: [0.7, 0, 0.84, 0] },
  },
}

function ScreenFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div
        className="w-12 h-12 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(99,102,241,0.25)', borderTopColor: '#4f46e5' }}
        aria-label="Loading" role="status"
      />
    </div>
  )
}

/* ── authenticated app shell ─────────────────────────────────────────────── */
function AppShell() {
  const screen = useStore((s) => s.screen)

  const SCREENS = {
    upload:     <UploadScreen />,
    loading:    <LoadingScreen />,
    results:    <Suspense fallback={<ScreenFallback />}><ResultsScreen /></Suspense>,
    history:    <Suspense fallback={<ScreenFallback />}><HistoryScreen /></Suspense>,
    dashboard:  <Suspense fallback={<ScreenFallback />}><DashboardScreen /></Suspense>,
    comparison: <Suspense fallback={<ScreenFallback />}><ComparisonScreen /></Suspense>,
    live:       <Suspense fallback={<ScreenFallback />}><LiveAnalysisScreen /></Suspense>,
    profiles:   <Suspense fallback={<ScreenFallback />}><ProfilesScreen /></Suspense>,
  }

  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />

      {/* paddingLeft matches sidebar width — Sidebar sets --sidebar-w via CSS var */}
      <main
        className="flex-1 min-w-0"
        style={{ paddingLeft: 'var(--sidebar-w, 220px)', transition: 'padding-left 0.25s cubic-bezier(0.4,0,0.2,1)' }}
      >
        <AnimatePresence mode="wait">
          {SCREENS[screen] && (
            <motion.div
              key={screen}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ position: 'relative', willChange: 'opacity, transform' }}
            >
              {SCREENS[screen]}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

/* ── root router ─────────────────────────────────────────────────────────── */
function Root() {
  const isAuthenticated = useStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    // LandingScreen handles login/signup internally — no separate auth screens
    return <LandingScreen />
  }

  return <AppShell />
}

export default function App() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  )
}
