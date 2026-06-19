import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, AreaChart, Area,
} from 'recharts'
import {
  TrendingDown, TrendingUp, Minus, Activity, Target,
  BarChart3, Award, Trophy,
} from 'lucide-react'
import { useStore } from '../store'
import Navbar from '../components/Navbar'
import GamificationPanel from '../components/GamificationPanel'

const COLORS = {
  overall:           '#4f46e5',
  knee_valgus_left:  '#f59e0b',
  knee_valgus_right: '#f97316',
  trunk_lean:        '#ec4899',
  asymmetry:         '#06b6d4',
}

function TrendIcon({ current, previous }) {
  if (previous == null) return <Minus size={14} className="text-text-muted" />
  if (current < previous) return <TrendingDown size={14} className="text-success" />
  if (current > previous) return <TrendingUp size={14} className="text-danger" />
  return <Minus size={14} className="text-text-muted" />
}

function StatCard({ label, value, unit = '%', previous, description, index }) {
  const diff = previous != null ? value - previous : null
  const color = value < 30 ? 'text-success' : value < 60 ? 'text-warning' : 'text-danger'
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl p-4 border border-border-subtle"
    >
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <span className={`text-2xl font-bold font-mono tabular-nums ${color}`}>{value}{unit}</span>
        <div className="flex items-center gap-1 mb-0.5">
          <TrendIcon current={value} previous={previous} />
          {diff != null && (
            <span className={`text-xs font-mono ${diff < 0 ? 'text-success' : diff > 0 ? 'text-danger' : 'text-text-muted'}`}>
              {diff > 0 ? '+' : ''}{diff}
            </span>
          )}
        </div>
      </div>
      {description && <p className="text-xs text-text-muted mt-1">{description}</p>}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 border border-border-accent shadow-xl text-xs">
      <p className="text-text-muted mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-secondary">{p.name}:</span>
          <span className="text-text-primary font-semibold font-mono">{p.value}%</span>
        </p>
      ))}
    </div>
  )
}

export default function DashboardScreen() {
  const history  = useStore((s) => s.history)
  const setScreen = useStore((s) => s.setScreen)

  const chartData = useMemo(() => {
    return [...history].reverse().map((h, i) => ({
      name: `#${i + 1} ${h.movement_type.slice(0, 6)}`,
      fullDate: new Date(h.date).toLocaleDateString(),
      movement: h.movement_type,
      overall:           h.scores?.overall ?? 0,
      knee_valgus_left:  h.scores?.knee_valgus_left ?? 0,
      knee_valgus_right: h.scores?.knee_valgus_right ?? 0,
      trunk_lean:        h.scores?.trunk_lean ?? 0,
      asymmetry:         h.scores?.asymmetry ?? 0,
    }))
  }, [history])

  const latest   = history[0]
  const previous = history[1]

  const bestScore = useMemo(() =>
    history.length ? Math.min(...history.map((h) => h.scores?.overall ?? 100)) : null
  , [history])

  const avgScore = useMemo(() =>
    history.length ? Math.round(history.reduce((acc, h) => acc + (h.scores?.overall ?? 0), 0) / history.length) : null
  , [history])

  if (history.length === 0) {
    return (
      <div className="min-h-screen mesh-bg pb-20">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-glow flex items-center justify-center mb-4">
            <BarChart3 size={28} className="text-accent-secondary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">No data yet</h2>
          <p className="text-text-secondary text-sm mb-6">Complete at least one analysis to see your progress dashboard.</p>
          <button
            onClick={() => setScreen('upload')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-semibold hover:brightness-110 transition-all"
          >
            Analyze a Movement
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mesh-bg pb-20">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Progress Dashboard</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Tracking {history.length} {history.length === 1 ? 'analysis' : 'analyses'} over time
          </p>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard
            index={0}
            label="Latest Risk Score"
            value={latest?.scores?.overall ?? 0}
            previous={previous?.scores?.overall}
            description="Most recent overall"
          />
          <StatCard
            index={1}
            label="Personal Best"
            value={bestScore ?? 0}
            description="Lowest risk recorded"
          />
          <StatCard
            index={2}
            label="Average Score"
            value={avgScore ?? 0}
            description="Across all sessions"
          />
          <StatCard
            index={3}
            label="Total Sessions"
            value={history.length}
            unit=""
            description="Analyses completed"
          />
        </div>

        {/* Overall risk trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5 border border-border-subtle mb-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-accent-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Overall Risk Score Over Time</h2>
            <span className="ml-auto text-xs text-text-muted">Lower is better</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" />
              <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: 'Low', fill: '#22c55e', fontSize: 10, position: 'right' }} />
              <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: 'Moderate', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
              <Area type="monotone" dataKey="overall" name="Overall" stroke="#4f46e5" strokeWidth={2} fill="url(#overallGrad)" dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Individual metrics chart */}
        {chartData.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-2xl p-5 border border-border-subtle mb-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Target size={15} className="text-accent-primary" />
              <h2 className="text-sm font-semibold text-text-primary">Individual Metrics Breakdown</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.07)" />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#475569', paddingTop: 8 }} />
                <Line type="monotone" dataKey="knee_valgus_left"  name="L.Knee"  stroke={COLORS.knee_valgus_left}  strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="knee_valgus_right" name="R.Knee"  stroke={COLORS.knee_valgus_right} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="trunk_lean"        name="Trunk"   stroke={COLORS.trunk_lean}        strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="asymmetry"         name="Asymmetry" stroke={COLORS.asymmetry}      strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Gamification panel (Feature 8) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 border border-border-subtle mb-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={15} className="text-warning" />
            <h2 className="text-sm font-semibold text-text-primary">Achievements &amp; Streaks</h2>
          </div>
          <GamificationPanel />
        </motion.div>

        {/* Movement breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass rounded-2xl p-5 border border-border-subtle"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award size={15} className="text-accent-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Best Session by Movement</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(
              history.reduce((acc, h) => {
                const mv = h.movement_type
                if (!acc[mv] || h.scores?.overall < acc[mv].scores?.overall) acc[mv] = h
                return acc
              }, {})
            ).map(([movement, entry]) => {
              const score = entry.scores?.overall ?? 0
              const color = score < 30 ? 'text-success' : score < 60 ? 'text-warning' : 'text-danger'
              return (
                <div key={movement} className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-elevated border border-border-subtle">
                  <span className="text-sm text-text-primary font-medium">{movement}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold font-mono ${color}`}>{score}%</span>
                    <span className="text-xs text-text-muted">{entry.ai_coaching?.overall_risk_level}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
