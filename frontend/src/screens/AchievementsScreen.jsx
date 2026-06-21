import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Lock, Star, Zap } from 'lucide-react'
import { useStore, ACHIEVEMENTS } from '../store'

const XP_LEVELS = [
  { level: 1, name: 'Beginner',          minXP: 0    },
  { level: 2, name: 'Trainee',           minXP: 100  },
  { level: 3, name: 'Athlete',           minXP: 300  },
  { level: 4, name: 'Competitor',        minXP: 600  },
  { level: 5, name: 'Elite Athlete',     minXP: 1000 },
  { level: 6, name: 'Champion',          minXP: 1500 },
  { level: 7, name: 'Biomechanics Pro',  minXP: 2200 },
  { level: 8, name: 'Movement Master',   minXP: 3000 },
]

function getLevel(xp) {
  let current = XP_LEVELS[0]
  let next    = XP_LEVELS[1]
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].minXP) {
      current = XP_LEVELS[i]
      next    = XP_LEVELS[i + 1] ?? null
    }
  }
  return { current, next }
}

function AchievementCard({ achievement, earned, index }) {
  const { id, label, desc, icon, xp } = achievement
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className={`relative rounded-2xl p-4 border transition-all duration-200 ${
        earned
          ? 'glass border-accent-primary/25 hover:border-accent-primary/50'
          : 'border-border-subtle bg-bg-elevated/40'
      }`}
    >
      {/* glow for earned */}
      {earned && (
        <div className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 0%, #4f46e5, transparent 70%)' }} />
      )}

      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
            earned ? 'shadow-md' : 'grayscale opacity-40'
          }`}
          style={earned ? { background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.15))', boxShadow: '0 4px 12px rgba(79,70,229,0.15)' } : { background: 'rgba(15,23,42,0.06)' }}
        >
          {earned ? icon : <Lock size={18} className="text-text-muted" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${earned ? 'text-text-primary' : 'text-text-muted'}`}>{label}</p>
            {earned && (
              <span className="text-[10px] font-bold text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded-full">
                +{xp} XP
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">{desc}</p>
          {!earned && (
            <p className="text-xs text-text-muted mt-1 opacity-60">🔒 Not yet unlocked</p>
          )}
        </div>

        {earned && (
          <div className="flex-shrink-0">
            <Star size={14} className="text-warning" fill="currentColor" />
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function AchievementsScreen() {
  const earnedAchievements = useStore((s) => s.earnedAchievements)
  const totalXP            = useStore((s) => s.totalXP ?? 0)
  const streak             = useStore((s) => s.streak)
  const longestStreak      = useStore((s) => s.longestStreak)
  const history            = useStore((s) => s.history)
  const weeklyChallenge    = useStore((s) => s.weeklyChallenge)
  const goals              = useStore((s) => s.goals)

  const { current: level, next: nextLevel } = getLevel(totalXP)
  const progressToNext = nextLevel
    ? Math.round(((totalXP - level.minXP) / (nextLevel.minXP - level.minXP)) * 100)
    : 100

  const sortedAchievements = useMemo(() => {
    return [...ACHIEVEMENTS].sort((a, b) => {
      const aEarned = earnedAchievements.includes(a.id) ? 1 : 0
      const bEarned = earnedAchievements.includes(b.id) ? 1 : 0
      return bEarned - aEarned
    })
  }, [earnedAchievements])

  const weeklyProgress = Math.min(weeklyChallenge.completedThisWeek / weeklyChallenge.goal * 100, 100)

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Trophy size={22} className="text-warning" />
          Achievements
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Unlock achievements by improving your movement quality</p>
      </motion.div>

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border border-accent-primary/20 mb-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(124,58,237,0.06))' }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-8 translate-x-8"
          style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }} />
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Current Level</p>
            <p className="text-2xl font-bold gradient-text">Level {level.level} — {level.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Total XP</p>
            <p className="text-2xl font-bold text-accent-primary font-mono">{totalXP}</p>
          </div>
        </div>

        {nextLevel && (
          <>
            <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
              <span>{level.name}</span>
              <span className="font-semibold text-accent-primary">{nextLevel.minXP - totalXP} XP to {nextLevel.name}</span>
            </div>
            <div className="h-3 rounded-full bg-bg-elevated overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' }}
              />
            </div>
          </>
        )}
        {!nextLevel && (
          <div className="flex items-center gap-2">
            <Star size={16} className="text-warning" fill="currentColor" />
            <p className="text-sm font-bold text-text-primary">Maximum level reached! You are a Movement Master.</p>
          </div>
        )}
      </motion.div>

      {/* stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Unlocked', value: `${earnedAchievements.length}/${ACHIEVEMENTS.length}`, icon: '🏆' },
          { label: 'Current Streak', value: `${streak}d`, icon: '🔥' },
          { label: 'Best Streak', value: `${longestStreak}d`, icon: '⚡' },
          { label: 'Total Sessions', value: history.length, icon: '📊' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="glass rounded-xl p-3 border border-border-subtle text-center">
            <p className="text-xl">{icon}</p>
            <p className="text-lg font-bold text-text-primary font-mono">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* weekly challenge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-4 border border-warning/20 mb-5"
        style={{ background: 'rgba(245,158,11,0.04)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-warning" />
            <p className="text-sm font-bold text-text-primary">Weekly Challenge</p>
          </div>
          <span className="text-sm font-bold text-warning">{weeklyChallenge.completedThisWeek}/{weeklyChallenge.goal} sessions</span>
        </div>
        <div className="h-3 rounded-full bg-bg-elevated overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${weeklyProgress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1.5">
          {weeklyChallenge.completedThisWeek >= weeklyChallenge.goal
            ? '✅ Challenge complete! Bonus 50 XP awarded.'
            : `Complete ${weeklyChallenge.goal - weeklyChallenge.completedThisWeek} more analysis session${weeklyChallenge.goal - weeklyChallenge.completedThisWeek !== 1 ? 's' : ''} this week`
          }
        </p>
      </motion.div>

      {/* goals progress */}
      {goals.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-4 border border-border-subtle mb-5"
        >
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Goal Progress</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-text-primary font-mono">{goals.length}</p>
              <p className="text-xs text-text-muted">Total Goals</p>
            </div>
            <div>
              <p className="text-xl font-bold text-warning font-mono">{goals.filter(g=>!g.achieved).length}</p>
              <p className="text-xs text-text-muted">In Progress</p>
            </div>
            <div>
              <p className="text-xl font-bold text-success font-mono">{goals.filter(g=>g.achieved).length}</p>
              <p className="text-xs text-text-muted">Achieved</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* achievement grid */}
      <div>
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">
          All Achievements ({earnedAchievements.length}/{ACHIEVEMENTS.length} unlocked)
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {sortedAchievements.map((a, i) => (
            <AchievementCard
              key={a.id}
              achievement={a}
              earned={earnedAchievements.includes(a.id)}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
