import React, { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider } from './context/AppContext'
import { useStore } from './store'
import UploadScreen from './screens/UploadScreen'
import LoadingScreen from './screens/LoadingScreen'

const ResultsScreen    = lazy(() => import('./screens/ResultsScreen'))
const HistoryScreen    = lazy(() => import('./screens/HistoryScreen'))
const DashboardScreen  = lazy(() => import('./screens/DashboardScreen'))
const ComparisonScreen = lazy(() => import('./screens/ComparisonScreen'))

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

  return (
    <AnimatePresence mode="wait">
      {screen === 'upload' && (
        <motion.div key="upload" {...pageVariants} style={{ position: 'relative' }}>
          <UploadScreen />
        </motion.div>
      )}
      {screen === 'loading' && (
        <motion.div key="loading" {...pageVariants} style={{ position: 'relative' }}>
          <LoadingScreen />
        </motion.div>
      )}
      {screen === 'results' && (
        <motion.div key="results" {...pageVariants} style={{ position: 'relative' }}>
          <Suspense fallback={<ScreenFallback />}>
            <ResultsScreen />
          </Suspense>
        </motion.div>
      )}
      {screen === 'history' && (
        <motion.div key="history" {...pageVariants} style={{ position: 'relative' }}>
          <Suspense fallback={<ScreenFallback />}>
            <HistoryScreen />
          </Suspense>
        </motion.div>
      )}
      {screen === 'dashboard' && (
        <motion.div key="dashboard" {...pageVariants} style={{ position: 'relative' }}>
          <Suspense fallback={<ScreenFallback />}>
            <DashboardScreen />
          </Suspense>
        </motion.div>
      )}
      {screen === 'comparison' && (
        <motion.div key="comparison" {...pageVariants} style={{ position: 'relative' }}>
          <Suspense fallback={<ScreenFallback />}>
            <ComparisonScreen />
          </Suspense>
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
