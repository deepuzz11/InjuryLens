import React, { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import UploadScreen from './screens/UploadScreen'
import LoadingScreen from './screens/LoadingScreen'

const ResultsScreen = lazy(() => import('./screens/ResultsScreen'))

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: 'easeIn' } },
}

function SkeletonFallback() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
    </div>
  )
}

export default function App() {
  const screen = useStore((s) => s.screen)

  return (
    <AnimatePresence mode="wait">
      {screen === 'upload' && (
        <motion.div key="upload" {...pageVariants}>
          <UploadScreen />
        </motion.div>
      )}
      {screen === 'loading' && (
        <motion.div key="loading" {...pageVariants}>
          <LoadingScreen />
        </motion.div>
      )}
      {screen === 'results' && (
        <motion.div key="results" {...pageVariants}>
          <Suspense fallback={<SkeletonFallback />}>
            <ResultsScreen />
          </Suspense>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
