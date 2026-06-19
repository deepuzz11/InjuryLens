import React, { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider } from './context/AppContext'
import { useStore } from './store'
import UploadScreen from './screens/UploadScreen'
import LoadingScreen from './screens/LoadingScreen'

const ResultsScreen     = lazy(() => import('./screens/ResultsScreen'))
const HistoryScreen     = lazy(() => import('./screens/HistoryScreen'))
const DashboardScreen   = lazy(() => import('./screens/DashboardScreen'))
const ComparisonScreen  = lazy(() => import('./screens/ComparisonScreen'))
const LiveAnalysisScreen = lazy(() => import('./screens/LiveAnalysisScreen'))
const ProfilesScreen    = lazy(() => import('./screens/ProfilesScreen'))

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2,  ease: 'easeIn'  } },
}

function ScreenFallback() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div
        className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(99,102,241,0.4)', borderTopColor: '#6366f1' }}
        aria-label="Loading"
        role="status"
      />
    </div>
  )
}

function AppRoutes() {
  const screen = useStore((s) => s.screen)

  const screens = {
    upload:        <UploadScreen />,
    loading:       <LoadingScreen />,
    results:       <Suspense fallback={<ScreenFallback />}><ResultsScreen /></Suspense>,
    history:       <Suspense fallback={<ScreenFallback />}><HistoryScreen /></Suspense>,
    dashboard:     <Suspense fallback={<ScreenFallback />}><DashboardScreen /></Suspense>,
    comparison:    <Suspense fallback={<ScreenFallback />}><ComparisonScreen /></Suspense>,
    live:          <Suspense fallback={<ScreenFallback />}><LiveAnalysisScreen /></Suspense>,
    profiles:      <Suspense fallback={<ScreenFallback />}><ProfilesScreen /></Suspense>,
  }

  return (
    <AnimatePresence mode="wait">
      {screens[screen] && (
        <motion.div key={screen} {...pageVariants} style={{ position: 'relative' }}>
          {screens[screen]}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
