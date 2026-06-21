import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useStore } from '../store'

function computeInsights(history, recoveryLogs, goals, injuries, journalEntries, plannedSessions) {
  const insights = []

  // ── Movement quality trend ─────────────────────────────────────────────────
  if (history.length >= 3) {
    const scores = history.map((h) => h.overallScore ?? h.mqs ?? h.score ?? null).filter((v) => v !== null)
    if (scores.length >= 3) {
      const first = scores.slice(0, Math.ceil(scores.length / 2))
      const second = scores.slice(Math.floor(scores.length / 2))
      const avgFirst  = first.reduce((a, b) => a + b, 0) / first.length
      const avgSecond = second.reduce((a, b) => a + b, 0) / second.length
      const delta = Math.round(avgSecond - avgFirst)
      if (delta >= 5) {
        insights.push({ type: 'success', icon: '📈', title: 'Movement quality improving', body: `Your average score is up ${delta}% vs your earlier sessions. The consistent training is paying off.`, category: 'Progress' })
      } else if (delta <= -5) {
        insights.push({ type: 'warning', icon: '📉', title: 'Score trend declining', body: `Your average score dropped ${Math.abs(delta)}% recently. Consider taking a recovery day or reviewing your form cues.`, category: 'Warning' })
      } else {
        insights.push({ type: 'info', icon: '➡️', title: 'Consistent movement quality', body: `Your scores are stable (within ${Math.abs(delta)}%). Introduce progressive challenge to keep improving.`, category: 'Progress' })
      }
    }
  }

  // ── Risk alerts ────────────────────────────────────────────────────────────
  const highRisk = history.filter((h) => (h.riskScore ?? 0) >= 65)
  if (highRisk.length >= 2) {
    insights.push({ type: 'danger', icon: '🚨', title: `${highRisk.length} high-risk sessions detected`, body: `You've had ${highRisk.length} analyses flagged as high risk. Review the Body Analytics screen and consider working with a physio.`, category: 'Risk' })
  }

  // ── Recovery correlation ───────────────────────────────────────────────────
  if (recoveryLogs.length >= 5) {
    const avgSoreness = recoveryLogs.reduce((s, l) => s + l.soreness, 0) / recoveryLogs.length
    const avgEnergy   = recoveryLogs.reduce((s, l) => s + l.energy, 0) / recoveryLogs.length
    if (avgSoreness >= 4) {
      insights.push({ type: 'warning', icon: '😓', title: 'Chronically high soreness', body: `Your average soreness is ${avgSoreness.toFixed(1)}/5 over ${recoveryLogs.length} logs. This level of fatigue may impair movement quality.`, category: 'Recovery' })
    }
    if (avgEnergy <= 2.5) {
      insights.push({ type: 'warning', icon: '🔋', title: 'Low energy trend', body: `Average energy is only ${avgEnergy.toFixed(1)}/5. Prioritise sleep, nutrition and deload weeks.`, category: 'Recovery' })
    }
    if (avgSoreness <= 2 && avgEnergy >= 4) {
      insights.push({ type: 'success', icon: '⚡', title: 'Excellent recovery status', body: `Low soreness (${avgSoreness.toFixed(1)}/5) and high energy (${avgEnergy.toFixed(1)}/5) — you\'re primed to train hard this week.`, category: 'Recovery' })
    }
  } else if (recoveryLogs.length === 0) {
    insights.push({ type: 'info', icon: '💤', title: 'Start logging recovery', body: 'Track sleep, soreness and energy daily to unlock personalised recovery insights.', category: 'Recovery' })
  }

  // ── Active injuries ────────────────────────────────────────────────────────
  const activeInjuries = injuries.filter((i) => !i.resolved)
  if (activeInjuries.length > 0) {
    const bodyParts = activeInjuries.map((i) => i.bodyPart).join(', ')
    insights.push({ type: 'danger', icon: '🏥', title: `${activeInjuries.length} active injury tracked`, body: `Active injury areas: ${bodyParts}. Follow the rehab plan in Injury Tracker and avoid aggravating movements.`, category: 'Injury' })
  }

  // ── Goals ─────────────────────────────────────────────────────────────────
  const pendingGoals = goals.filter((g) => !g.achieved)
  const achievedGoals = goals.filter((g) => g.achieved)
  if (achievedGoals.length > 0) {
    insights.push({ type: 'success', icon: '🎯', title: `${achievedGoals.length} goal${achievedGoals.length > 1 ? 's' : ''} achieved`, body: `Congratulations! You\'ve hit ${achievedGoals.length} target${achievedGoals.length > 1 ? 's' : ''}. Time to raise the bar with a new challenge.`, category: 'Goals' })
  }
  if (pendingGoals.length > 0) {
    insights.push({ type: 'info', icon: '🏹', title: `${pendingGoals.length} goal${pendingGoals.length > 1 ? 's' : ''} in progress`, body: `Keep analysing your ${pendingGoals[0].movement || 'movements'} — you\'re building toward your target.`, category: 'Goals' })
  }

  // ── Session frequency ──────────────────────────────────────────────────────
  const last7dSessions = history.filter((h) => Date.now() - new Date(h.date) < 7 * 86400000).length
  if (last7dSessions === 0 && history.length > 0) {
    insights.push({ type: 'warning', icon: '💤', title: 'No activity this week', body: 'You haven\'t recorded any analyses in the last 7 days. Even a quick squat check-in keeps the habit going.', category: 'Habit' })
  } else if (last7dSessions >= 5) {
    insights.push({ type: 'success', icon: '🔥', title: `${last7dSessions} analyses this week`, body: 'Excellent frequency! Consistent analysis is the fastest path to improved movement quality.', category: 'Habit' })
  } else if (last7dSessions >= 2) {
    insights.push({ type: 'info', icon: '📊', title: `${last7dSessions} analyses this week`, body: 'Good consistency. Aim for 3-5 short sessions per week to accelerate your progress.', category: 'Habit' })
  }

  // ── Most trained movement ──────────────────────────────────────────────────
  if (history.length >= 5) {
    const movCounts = {}
    for (const h of history) {
      const m = h.movement || h.results?.movement || h.movementType || 'Squat'
      movCounts[m] = (movCounts[m] ?? 0) + 1
    }
    const top = Object.entries(movCounts).sort((a, b) => b[1] - a[1])[0]
    if (top) {
      insights.push({ type: 'info', icon: '🏆', title: `${top[0]} is your most-practised movement`, body: `${top[1]} of your ${history.length} sessions focused on ${top[0]}. Diversify to address full-body movement patterns.`, category: 'Breadth' })
    }
  }

  // ── Knee valgus concern ────────────────────────────────────────────────────
  if (history.length >= 3) {
    const kneeMetrics = history
      .map((h) => {
        const m = h.metrics || h.results?.metrics || {}
        return Math.max(m.kneeValgusL ?? 0, m.kneeValgusR ?? 0)
      })
      .filter((v) => v > 0)
    if (kneeMetrics.length >= 3) {
      const avgKnee = kneeMetrics.reduce((a, b) => a + b, 0) / kneeMetrics.length
      if (avgKnee > 12) {
        insights.push({ type: 'warning', icon: '🦵', title: 'Knee valgus pattern detected', body: `Average max knee valgus of ${avgKnee.toFixed(1)}° across recent sessions. Prioritise hip abductor and VMO strengthening.`, category: 'Biomechanics' })
      }
    }
  }

  // ── Journal journal entries ────────────────────────────────────────────────
  if (journalEntries.length > 0) {
    const highRpeJournals = journalEntries.filter((e) => e.rpe >= 8)
    if (highRpeJournals.length / journalEntries.length > 0.5) {
      insights.push({ type: 'warning', icon: '🔴', title: 'High RPE training dominates', body: `${Math.round((highRpeJournals.length / journalEntries.length) * 100)}% of logged sessions are high intensity (RPE 8+). Build in more easy and moderate sessions for longevity.`, category: 'Load' })
    }
  }

  // ── Session planner adherence ──────────────────────────────────────────────
  if (plannedSessions.length >= 5) {
    const completed = plannedSessions.filter((s) => s.completed)
    const pct = Math.round((completed.length / plannedSessions.length) * 100)
    if (pct >= 80) {
      insights.push({ type: 'success', icon: '✅', title: `${pct}% session adherence`, body: 'Excellent plan execution — you\'re completing most of what you schedule. Consistency is the #1 driver of adaptation.', category: 'Adherence' })
    } else if (pct < 50) {
      insights.push({ type: 'info', icon: '📅', title: `${pct}% session adherence`, body: 'Less than half of your planned sessions are completed. Consider reducing volume or planning easier fallback sessions.', category: 'Adherence' })
    }
  }

  return insights
}

const TYPE_STYLES = {
  success: { border: 'border-success/25',  bg: 'bg-success/5',  icon: CheckCircle, iconColor: 'text-success'  },
  warning: { border: 'border-warning/30',  bg: 'bg-warning/5',  icon: AlertTriangle, iconColor: 'text-warning' },
  danger:  { border: 'border-danger/25',   bg: 'bg-danger/5',   icon: AlertTriangle, iconColor: 'text-danger'  },
  info:    { border: 'border-accent-primary/20', bg: 'bg-accent-primary/5', icon: Info, iconColor: 'text-accent-primary' },
}

const ALL_CATEGORIES = ['All', 'Progress', 'Risk', 'Recovery', 'Injury', 'Goals', 'Habit', 'Biomechanics', 'Load', 'Adherence', 'Breadth']

export default function InsightsScreen() {
  const history        = useStore((s) => s.history)
  const recoveryLogs   = useStore((s) => s.recoveryLogs)
  const goals          = useStore((s) => s.goals)
  const injuries       = useStore((s) => s.injuries)
  const journalEntries = useStore((s) => s.journalEntries)
  const plannedSessions = useStore((s) => s.plannedSessions)

  const [filter, setFilter] = useState('All')

  const insights = useMemo(
    () => computeInsights(history, recoveryLogs, goals, injuries, journalEntries, plannedSessions),
    [history, recoveryLogs, goals, injuries, journalEntries, plannedSessions]
  )

  const filtered = filter === 'All' ? insights : insights.filter((i) => i.category === filter)
  const categories = ['All', ...Array.from(new Set(insights.map((i) => i.category)))]

  const counts = { success: insights.filter((i) => i.type === 'success').length, warning: insights.filter((i) => i.type === 'warning').length, danger: insights.filter((i) => i.type === 'danger').length }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Sparkles size={22} className="text-accent-primary" /> Insights
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Auto-generated from your movement data, recovery, goals and training log</p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Achievements', value: counts.success, icon: '✅', color: '#10b981' },
            { label: 'Warnings', value: counts.warning + counts.danger, icon: '⚠️', color: '#f59e0b' },
            { label: 'Total Insights', value: insights.length, icon: '💡', color: '#4f46e5' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="glass rounded-xl p-3 border border-border-subtle text-center">
              <p className="text-xl">{icon}</p>
              <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* category filter */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filter === cat ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-muted hover:text-text-primary'}`}>
            {cat}
          </button>
        ))}
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔭</p>
          <p className="text-text-primary font-semibold">Not enough data yet</p>
          <p className="text-sm text-text-muted mt-1">Complete a few movement analyses, log recovery, and set some goals to unlock personalised insights.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((insight, i) => {
            const style = TYPE_STYLES[insight.type] || TYPE_STYLES.info
            const IconComp = style.icon
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-2xl p-4 border ${style.border} ${style.bg}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-xl">{insight.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-text-primary">{insight.title}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-bg-elevated text-text-muted">{insight.category}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{insight.body}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
