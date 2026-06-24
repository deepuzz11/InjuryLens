import React, { lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider } from './context/AppContext'
import { useStore } from './store'
import UploadScreen   from './screens/UploadScreen'
import LoadingScreen  from './screens/LoadingScreen'
import LandingScreen  from './screens/LandingScreen'
import Sidebar        from './components/Sidebar'
import TopBar         from './components/TopBar'

const ResultsScreen         = lazy(() => import('./screens/ResultsScreen'))
const HistoryScreen         = lazy(() => import('./screens/HistoryScreen'))
const DashboardScreen       = lazy(() => import('./screens/DashboardScreen'))
const ComparisonScreen      = lazy(() => import('./screens/ComparisonScreen'))
const LiveAnalysisScreen    = lazy(() => import('./screens/LiveAnalysisScreen'))
const ProfilesScreen        = lazy(() => import('./screens/ProfilesScreen'))
const GoalsScreen           = lazy(() => import('./screens/GoalsScreen'))
const MovementLibraryScreen = lazy(() => import('./screens/MovementLibraryScreen'))
const RecoveryScreen        = lazy(() => import('./screens/RecoveryScreen'))
const SettingsScreen        = lazy(() => import('./screens/SettingsScreen'))
const ReportsScreen         = lazy(() => import('./screens/ReportsScreen'))
const AchievementsScreen    = lazy(() => import('./screens/AchievementsScreen'))
const WarmupScreen          = lazy(() => import('./screens/WarmupScreen'))
const BodyAnalyticsScreen   = lazy(() => import('./screens/BodyAnalyticsScreen'))
const InjuryTrackerScreen   = lazy(() => import('./screens/InjuryTrackerScreen'))
const TrainingJournalScreen = lazy(() => import('./screens/TrainingJournalScreen'))
const PersonalRecordsScreen = lazy(() => import('./screens/PersonalRecordsScreen'))
const SessionPlannerScreen  = lazy(() => import('./screens/SessionPlannerScreen'))
const ChallengesScreen      = lazy(() => import('./screens/ChallengesScreen'))
const AthleteMetricsScreen  = lazy(() => import('./screens/AthleteMetricsScreen'))
const InsightsScreen        = lazy(() => import('./screens/InsightsScreen'))
const ExerciseLibraryScreen = lazy(() => import('./screens/ExerciseLibraryScreen'))

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
    upload:           <UploadScreen />,
    loading:          <LoadingScreen />,
    results:          <Suspense fallback={<ScreenFallback />}><ResultsScreen /></Suspense>,
    history:          <Suspense fallback={<ScreenFallback />}><HistoryScreen /></Suspense>,
    dashboard:        <Suspense fallback={<ScreenFallback />}><DashboardScreen /></Suspense>,
    comparison:       <Suspense fallback={<ScreenFallback />}><ComparisonScreen /></Suspense>,
    live:             <Suspense fallback={<ScreenFallback />}><LiveAnalysisScreen /></Suspense>,
    profiles:         <Suspense fallback={<ScreenFallback />}><ProfilesScreen /></Suspense>,
    goals:            <Suspense fallback={<ScreenFallback />}><GoalsScreen /></Suspense>,
    'movement-library':  <Suspense fallback={<ScreenFallback />}><MovementLibraryScreen /></Suspense>,
    recovery:            <Suspense fallback={<ScreenFallback />}><RecoveryScreen /></Suspense>,
    settings:            <Suspense fallback={<ScreenFallback />}><SettingsScreen /></Suspense>,
    reports:             <Suspense fallback={<ScreenFallback />}><ReportsScreen /></Suspense>,
    achievements:        <Suspense fallback={<ScreenFallback />}><AchievementsScreen /></Suspense>,
    warmup:              <Suspense fallback={<ScreenFallback />}><WarmupScreen /></Suspense>,
    'body-analytics':    <Suspense fallback={<ScreenFallback />}><BodyAnalyticsScreen /></Suspense>,
    'injury-tracker':    <Suspense fallback={<ScreenFallback />}><InjuryTrackerScreen /></Suspense>,
    journal:             <Suspense fallback={<ScreenFallback />}><TrainingJournalScreen /></Suspense>,
    'personal-records':  <Suspense fallback={<ScreenFallback />}><PersonalRecordsScreen /></Suspense>,
    'session-planner':   <Suspense fallback={<ScreenFallback />}><SessionPlannerScreen /></Suspense>,
    challenges:          <Suspense fallback={<ScreenFallback />}><ChallengesScreen /></Suspense>,
    'athlete-metrics':   <Suspense fallback={<ScreenFallback />}><AthleteMetricsScreen /></Suspense>,
    insights:            <Suspense fallback={<ScreenFallback />}><InsightsScreen /></Suspense>,
    'exercise-library':  <Suspense fallback={<ScreenFallback />}><ExerciseLibraryScreen /></Suspense>,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <Sidebar />

      {/* paddingLeft matches sidebar width — Sidebar sets --sidebar-w via CSS var */}
      <main
        className="flex-1 min-w-0 h-screen overflow-y-auto"
        style={{ paddingLeft: 'var(--sidebar-w, 228px)', transition: 'padding-left 0.25s cubic-bezier(0.4,0,0.2,1)' }}
      >
        <TopBar />
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
