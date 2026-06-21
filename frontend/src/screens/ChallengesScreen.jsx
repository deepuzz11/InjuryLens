import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CheckCircle, X, Trophy, Calendar } from 'lucide-react'
import { useStore } from '../store'

const CHALLENGES = [
  {
    id: 'squat-form-7',
    title: '7-Day Squat Form',
    emoji: '🦵',
    description: 'Record and analyse your squat every day for 7 days. Watch your MQS improve in real time.',
    duration: 7,
    category: 'Strength',
    color: '#4f46e5',
    reward: 200,
    milestones: [
      '3 analyses done — keep momentum!',
      '5 analyses — you\'re nearly there!',
      '7 analyses — Challenge complete! 🎉',
    ],
    tasks: ['Analyse your squat', 'Check knee valgus score', 'Note any improvements'],
  },
  {
    id: 'injury-free-14',
    title: '14-Day Injury Prevention',
    emoji: '🛡',
    description: 'Complete a warm-up + movement analysis every day for 14 days to build the habit of preventive movement.',
    duration: 14,
    category: 'Health',
    color: '#10b981',
    reward: 500,
    milestones: [
      '3 days — building momentum!',
      '7 days — halfway there!',
      '14 days — Injury prevention pro! 🏅',
    ],
    tasks: ['Complete warm-up checklist', 'Log recovery metrics', 'Run movement analysis'],
  },
  {
    id: 'consistency-21',
    title: '21-Day Movement Streak',
    emoji: '🔥',
    description: 'Log a training session and one movement analysis every day for 21 days.',
    duration: 21,
    category: 'Consistency',
    color: '#f59e0b',
    reward: 800,
    milestones: [
      '7 days — one week strong!',
      '14 days — double digits!',
      '21 days — Movement master! 🏆',
    ],
    tasks: ['Log journal entry', 'Analyse movement', 'Log recovery'],
  },
  {
    id: 'bilateral-balance-5',
    title: '5-Day Balance Focus',
    emoji: '⚖️',
    description: 'Track your bilateral asymmetry score over 5 days to identify and correct left-right imbalances.',
    duration: 5,
    category: 'Technique',
    color: '#8b5cf6',
    reward: 150,
    milestones: [
      '2 analyses — pattern emerging!',
      '5 analyses — imbalance diagnosed! 🎯',
    ],
    tasks: ['Run bilateral analysis', 'Compare L/R scores', 'Do single-leg exercise'],
  },
  {
    id: 'hip-mobility-7',
    title: '7-Day Hip Mobility',
    emoji: '🌀',
    description: 'Focus on hip mobility for a full week — analyse hip drop, do warm-up hip work, and track changes.',
    duration: 7,
    category: 'Mobility',
    color: '#ec4899',
    reward: 250,
    milestones: [
      '3 days — stay committed!',
      '7 days — Hip mobility improved! 🌟',
    ],
    tasks: ['Do hip mobility warm-up', 'Analyse hip drop', 'Log soreness in recovery'],
  },
  {
    id: 'trunk-alignment-10',
    title: '10-Day Trunk Alignment',
    emoji: '🧍',
    description: 'Monitor your trunk lean every day for 10 days. Correcting forward lean improves power transfer.',
    duration: 10,
    category: 'Technique',
    color: '#f97316',
    reward: 300,
    milestones: [
      '5 days — halfway!',
      '10 days — trunk expert! 🏋️',
    ],
    tasks: ['Analyse trunk lean', 'Practice bracing cue', 'Check posture at desk'],
  },
]

function ProgressBar({ value, max, color }) {
  return (
    <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
    </div>
  )
}

function ChallengeCard({ challenge, progress, onJoin, onComplete, onLeave }) {
  const [expanded, setExpanded] = useState(false)
  const isJoined = Boolean(progress)
  const daysCompleted = Array.isArray(progress?.daysCompleted) ? progress.daysCompleted.length : 0
  const pct = isJoined ? Math.round((daysCompleted / challenge.duration) * 100) : 0
  const isFinished = daysCompleted >= challenge.duration
  const alreadyDoneToday = progress?.daysCompleted?.includes(new Date().toDateString()) ?? false

  const activeMilestone = challenge.milestones.reduce((acc, m, i) => {
    const threshold = Math.round(((i + 1) / challenge.milestones.length) * challenge.duration)
    return daysCompleted >= threshold ? m : acc
  }, null)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl overflow-hidden border transition-all ${
        isFinished ? 'border-success/40' : isJoined ? 'border-accent-primary/30' : 'border-border-subtle hover:border-accent-primary/20'
      }`}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: challenge.color + '15', border: `1px solid ${challenge.color}30` }}>
          {challenge.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-text-primary">{challenge.title}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: challenge.color, background: challenge.color + '15' }}>
              {challenge.category}
            </span>
            {isFinished && <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-md">Completed!</span>}
          </div>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{challenge.description}</p>
          {isJoined && (
            <div className="mt-1.5">
              <ProgressBar value={daysCompleted} max={challenge.duration} color={isFinished ? '#10b981' : challenge.color} />
              <p className="text-[10px] text-text-muted mt-0.5">{daysCompleted}/{challenge.duration} days · {pct}%</p>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 ml-2">
          <p className="text-xs font-bold text-warning">+{challenge.reward} XP</p>
          <p className="text-[10px] text-text-muted text-right">{challenge.duration}d</p>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border-subtle">
            <div className="p-4 grid gap-4">
              <p className="text-sm text-text-secondary">{challenge.description}</p>

              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Daily Tasks</p>
                <ul className="space-y-1">
                  {challenge.tasks.map((t, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-center gap-1.5">
                      <span style={{ color: challenge.color }}>→</span>{t}
                    </li>
                  ))}
                </ul>
              </div>

              {isJoined && activeMilestone && (
                <div className="px-3 py-2 rounded-xl" style={{ background: challenge.color + '10', border: `1px solid ${challenge.color}25` }}>
                  <p className="text-xs font-semibold" style={{ color: challenge.color }}>🎯 {activeMilestone}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!isJoined && !isFinished && (
                  <button onClick={() => onJoin(challenge.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${challenge.color}, ${challenge.color}aa)` }}>
                    Join Challenge
                  </button>
                )}
                {isJoined && !isFinished && !alreadyDoneToday && (
                  <button onClick={() => onComplete(challenge.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    ✓ Log Today
                  </button>
                )}
                {alreadyDoneToday && !isFinished && (
                  <div className="flex-1 py-2 rounded-xl text-sm font-semibold text-success bg-success/10 text-center">
                    ✅ Done for today
                  </div>
                )}
                {isJoined && (
                  <button onClick={() => onLeave(challenge.id)}
                    className="px-3 py-2 rounded-xl text-xs text-text-muted border border-border-subtle hover:bg-bg-elevated hover:text-danger transition-colors">
                    Leave
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ChallengesScreen() {
  const challengeProgress  = useStore((s) => s.challengeProgress)
  const joinChallenge      = useStore((s) => s.joinChallenge)
  const completeChallengeDay = useStore((s) => s.completeChallengeDay)
  const leaveChallenge     = useStore((s) => s.leaveChallenge)

  const [activeFilter, setActiveFilter] = useState('all')

  const joined    = CHALLENGES.filter((c) => challengeProgress[c.id] && !challengeProgress[c.id].completed)
  const completed = CHALLENGES.filter((c) => challengeProgress[c.id]?.completed || (challengeProgress[c.id]?.daysCompleted >= c.duration))
  const available = CHALLENGES.filter((c) => !challengeProgress[c.id])

  const shown = activeFilter === 'joined' ? joined
    : activeFilter === 'completed' ? completed
    : activeFilter === 'available' ? available
    : CHALLENGES

  const totalXPEarned = completed.reduce((s, c) => s + c.reward, 0)

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Zap size={22} className="text-warning" /> Challenges
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Structured biomechanics challenges to level up your movement</p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Active', value: joined.length, icon: '⚡', color: '#4f46e5' },
            { label: 'Completed', value: completed.length, icon: '🏆', color: '#10b981' },
            { label: 'XP Earned', value: totalXPEarned, icon: '⭐', color: '#f59e0b' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="glass rounded-xl p-3 border border-border-subtle text-center">
              <p className="text-xl">{icon}</p>
              <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-bg-elevated w-fit">
        {[['all', 'All'], ['joined', `Active (${joined.length})`], ['completed', `Done (${completed.length})`], ['available', `New (${available.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setActiveFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeFilter === k ? 'bg-white text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        <AnimatePresence>
          {shown.map((c) => (
            <ChallengeCard key={c.id} challenge={c}
              progress={challengeProgress[c.id] ?? null}
              onJoin={joinChallenge}
              onComplete={completeChallengeDay}
              onLeave={leaveChallenge} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
