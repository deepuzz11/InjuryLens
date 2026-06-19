import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Trophy, Target, Star, Zap, CheckCircle } from 'lucide-react'
import { useStore, ACHIEVEMENTS } from '../store'

function AchievementBadge({ achievement, earned }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
        earned
          ? 'bg-accent-primary/10 border-accent-primary/30'
          : 'bg-bg-elevated border-border-subtle opacity-40'
      }`}
    >
      <span className="text-2xl" role="img" aria-label={achievement.label}>{achievement.icon}</span>
      <span className="text-[10px] font-semibold text-center text-text-primary leading-tight">{achievement.label}</span>
      <span className="text-[9px] text-text-muted text-center leading-tight">{achievement.desc}</span>
      {earned && <CheckCircle size={10} className="text-success mt-0.5" />}
    </motion.div>
  )
}

function StreakRing({ streak, goal = 7 }) {
  const pct = Math.min(1, streak / goal)
  const R   = 38
  const circ = 2 * Math.PI * R
  const dashOffset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={92} height={92} viewBox="0 0 92 92">
        <circle cx={46} cy={46} r={R} fill="none" stroke="rgba(15,23,42,0.10)" strokeWidth={8} />
        <circle
          cx={46} cy={46} r={R}
          fill="none"
          stroke={streak >= goal ? '#d97706' : '#4f46e5'}
          strokeWidth={8}
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={46} y={50} textAnchor="middle" fill="#0f172a" fontSize={24} fontWeight="bold" fontFamily="monospace">
          {streak}
        </text>
        <text x={46} y={64} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="system-ui">
          day{streak !== 1 ? 's' : ''}
        </text>
      </svg>
      <p className="text-xs text-text-muted">Current Streak</p>
    </div>
  )
}

export default function GamificationPanel() {
  const streak              = useStore((s) => s.streak)
  const longestStreak       = useStore((s) => s.longestStreak)
  const earnedAchievements  = useStore((s) => s.earnedAchievements)
  const weeklyChallenge     = useStore((s) => s.weeklyChallenge)
  const history             = useStore((s) => s.history)

  const weeklyGoal     = weeklyChallenge?.goal ?? 3
  const weeklyDone     = weeklyChallenge?.completedThisWeek ?? 0
  const weeklyPct      = Math.min(1, weeklyDone / weeklyGoal)
  const earnedCount    = earnedAchievements.length
  const totalAchievements = ACHIEVEMENTS.length

  return (
    <div className="flex flex-col gap-5">
      {/* Streak + weekly challenge row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 border border-border-subtle flex flex-col items-center gap-2">
          <StreakRing streak={streak} />
        </div>

        <div className="glass rounded-2xl p-4 border border-border-subtle flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            <Flame size={13} className="text-warning" />Personal Best Streak
          </div>
          <span className="text-3xl font-bold font-mono text-warning tabular-nums">{longestStreak}</span>
          <span className="text-xs text-text-muted">days</span>
        </div>

        <div className="glass rounded-2xl p-4 border border-border-subtle flex flex-col gap-2 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            <Target size={13} className="text-accent-primary" />Weekly Challenge
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold font-mono text-accent-primary tabular-nums">{weeklyDone}</span>
            <span className="text-sm text-text-muted mb-0.5">/ {weeklyGoal}</span>
          </div>
          <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: weeklyPct >= 1 ? '#16a34a' : '#4f46e5' }}
              initial={{ width: 0 }}
              animate={{ width: `${weeklyPct * 100}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs text-text-muted">analyses this week</span>
          {weeklyPct >= 1 && (
            <span className="text-xs text-success font-semibold">✓ Challenge complete!</span>
          )}
        </div>
      </div>

      {/* Achievements grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-warning" />
          <h3 className="text-sm font-semibold text-text-primary">Achievements</h3>
          <span className="ml-auto text-xs text-text-muted font-mono">{earnedCount}/{totalAchievements}</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.id} achievement={a} earned={earnedAchievements.includes(a.id)} />
          ))}
        </div>
      </div>

      {earnedCount === 0 && (
        <p className="text-xs text-text-muted text-center py-2">
          Complete your first analysis to unlock achievements!
        </p>
      )}
    </div>
  )
}
