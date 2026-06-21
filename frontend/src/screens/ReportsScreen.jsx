import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'
import { FileText, TrendingDown, TrendingUp, Minus, Download, Calendar, Award } from 'lucide-react'
import { useStore } from '../store'

function getWeekRange(weeksAgo = 0) {
  const now  = new Date()
  const day  = now.getDay()
  const diffToMon = (day === 0 ? -6 : 1 - day) - weeksAgo * 7
  const mon  = new Date(now); mon.setDate(now.getDate() + diffToMon); mon.setHours(0,0,0,0)
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
  return { start: mon, end: sun }
}

function MetricDelta({ current, previous, label }) {
  if (previous == null) return null
  const diff = current - previous
  const color = diff < 0 ? '#10b981' : diff > 0 ? '#ef4444' : '#64748b'
  const Icon  = diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus
  return (
    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color }}>
      <Icon size={12} />
      {diff > 0 ? '+' : ''}{diff}% vs {label}
    </span>
  )
}

function InsightBullet({ text, type }) {
  const colors = { good: 'text-success', warn: 'text-warning', info: 'text-accent-primary' }
  const icons  = { good: '↓', warn: '↑', info: '→' }
  return (
    <li className="flex items-start gap-2 text-sm text-text-secondary">
      <span className={`font-bold flex-shrink-0 ${colors[type]}`}>{icons[type]}</span>
      {text}
    </li>
  )
}

export default function ReportsScreen() {
  const history   = useStore((s) => s.history)
  const goals     = useStore((s) => s.goals)
  const recoveryLogs = useStore((s) => s.recoveryLogs)
  const streak    = useStore((s) => s.streak)
  const totalXP   = useStore((s) => s.totalXP ?? 0)
  const earnedAchievements = useStore((s) => s.earnedAchievements)
  const [period, setPeriod] = useState('week') // week | month

  const { start: weekStart, end: weekEnd } = getWeekRange(0)
  const { start: prevStart, end: prevEnd }  = getWeekRange(1)

  const thisWeek = useMemo(() => history.filter((h) => {
    const d = new Date(h.date)
    return d >= weekStart && d <= weekEnd
  }), [history, weekStart, weekEnd])

  const lastWeek = useMemo(() => history.filter((h) => {
    const d = new Date(h.date)
    return d >= prevStart && d <= prevEnd
  }), [history, prevStart, prevEnd])

  const thisMonth = useMemo(() => {
    const now = new Date()
    return history.filter((h) => {
      const d = new Date(h.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }, [history])

  const lastMonth = useMemo(() => {
    const now = new Date()
    const lm  = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lme = new Date(now.getFullYear(), now.getMonth(), 0)
    return history.filter((h) => {
      const d = new Date(h.date)
      return d >= lm && d <= lme
    })
  }, [history])

  const current = period === 'week' ? thisWeek : thisMonth
  const previous = period === 'week' ? lastWeek : lastMonth
  const periodLabel = period === 'week' ? 'last week' : 'last month'

  const avgOverall   = current.length > 0 ? Math.round(current.reduce((s,h) => s + (h.scores?.overall ?? 0), 0) / current.length) : null
  const prevOverall  = previous.length > 0 ? Math.round(previous.reduce((s,h) => s + (h.scores?.overall ?? 0), 0) / previous.length) : null
  const bestScore    = current.length > 0 ? Math.min(...current.map((h) => h.scores?.overall ?? 100)) : null
  const worstScore   = current.length > 0 ? Math.max(...current.map((h) => h.scores?.overall ?? 0)) : null
  const uniqueMoves  = new Set(current.map((h) => h.movement_type)).size
  const recovInPeriod = recoveryLogs.filter((l) => {
    const d = new Date(l.date)
    return d >= (period === 'week' ? weekStart : new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  })
  const avgReadiness = recovInPeriod.length > 0 ? Math.round(recovInPeriod.reduce((s,l) => s + l.readiness, 0) / recovInPeriod.length) : null
  const achievedGoals = goals.filter((g) => {
    if (!g.achievedDate) return false
    const d = new Date(g.achievedDate)
    return d >= (period === 'week' ? weekStart : new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  })

  // weekly bar chart for last 8 weeks
  const weeklyChart = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const { start, end } = getWeekRange(7 - i)
      const weekHistory = history.filter((h) => {
        const d = new Date(h.date)
        return d >= start && d <= end
      })
      const avg = weekHistory.length > 0
        ? Math.round(weekHistory.reduce((s,h) => s + (h.scores?.overall ?? 0), 0) / weekHistory.length)
        : null
      return {
        week: `W${i + 1}`,
        label: start.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        count: weekHistory.length,
        avgRisk: avg,
      }
    })
  }, [history])

  // movement breakdown for this period
  const movementBreakdown = useMemo(() => {
    const map = {}
    current.forEach((h) => {
      if (!map[h.movement_type]) map[h.movement_type] = { count: 0, totalRisk: 0 }
      map[h.movement_type].count++
      map[h.movement_type].totalRisk += h.scores?.overall ?? 0
    })
    return Object.entries(map).map(([m, v]) => ({
      movement: m.slice(0, 10),
      count: v.count,
      avgRisk: Math.round(v.totalRisk / v.count),
    })).sort((a, b) => b.count - a.count)
  }, [current])

  // insights
  const insights = useMemo(() => {
    const list = []
    if (avgOverall != null && prevOverall != null) {
      if (avgOverall < prevOverall) list.push({ text: `Average risk improved ${prevOverall - avgOverall}% compared to ${periodLabel}`, type: 'good' })
      else if (avgOverall > prevOverall) list.push({ text: `Average risk increased ${avgOverall - prevOverall}% — review recent sessions`, type: 'warn' })
    }
    if (current.length > previous.length) list.push({ text: `${current.length} analyses this ${period} — ${current.length - previous.length} more than ${periodLabel}`, type: 'good' })
    else if (current.length < previous.length && previous.length > 0) list.push({ text: `Only ${current.length} analyses this ${period} vs ${previous.length} ${periodLabel} — try to stay consistent`, type: 'warn' })
    if (achievedGoals.length > 0) list.push({ text: `Achieved ${achievedGoals.length} goal${achievedGoals.length > 1 ? 's' : ''} this ${period}: ${achievedGoals.map(g=>g.title).join(', ')}`, type: 'good' })
    if (streak >= 3) list.push({ text: `${streak}-day analysis streak — keep it going!`, type: 'good' })
    if (avgReadiness != null && avgReadiness < 55) list.push({ text: `Average recovery readiness ${avgReadiness}% — consider more rest this ${period}`, type: 'warn' })
    if (list.length === 0 && current.length === 0) list.push({ text: `No analyses recorded this ${period}. Head to Analyse to get started!`, type: 'info' })
    if (list.length === 0) list.push({ text: `${current.length} analyses completed this ${period} with a ${avgOverall}% average risk score`, type: 'info' })
    return list
  }, [current, previous, avgOverall, prevOverall, achievedGoals, streak, avgReadiness, period, periodLabel])

  function handleDownloadReport() {
    const lines = [
      `InjuryLens ${period === 'week' ? 'Weekly' : 'Monthly'} Report`,
      `Generated: ${new Date().toLocaleString()}`,
      `Period: ${period === 'week' ? `${weekStart.toLocaleDateString()} – ${weekEnd.toLocaleDateString()}` : new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}`,
      '',
      '=== SUMMARY ===',
      `Analyses This ${period === 'week' ? 'Week' : 'Month'}: ${current.length}`,
      `Average Risk Score: ${avgOverall ?? 'N/A'}%`,
      `Best Score: ${bestScore ?? 'N/A'}%`,
      `Worst Score: ${worstScore ?? 'N/A'}%`,
      `Unique Movements: ${uniqueMoves}`,
      `Current Streak: ${streak} days`,
      `Total XP: ${totalXP}`,
      `Achievements Unlocked: ${earnedAchievements.length}`,
      `Recovery Logs: ${recovInPeriod.length}`,
      avgReadiness ? `Avg Recovery Readiness: ${avgReadiness}%` : '',
      '',
      '=== INSIGHTS ===',
      ...insights.map((i) => `• ${i.text}`),
      '',
      '=== MOVEMENT BREAKDOWN ===',
      ...movementBreakdown.map((m) => `${m.movement}: ${m.count} sessions, avg ${m.avgRisk}% risk`),
    ].filter(Boolean).join('\n')

    const blob = new Blob([lines], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `injurylens-${period}-report-${new Date().toISOString().slice(0,10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="glass rounded-xl p-2.5 border border-border-subtle text-xs shadow-xl">
        <p className="text-text-muted mb-1">{payload[0]?.payload?.label ?? label}</p>
        {payload.map((p) => (
          <p key={p.name} className="text-text-primary font-semibold">{p.name}: <span style={{ color: p.color }}>{p.value}{p.name.includes('Risk') ? '%' : ''}</span></p>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <FileText size={22} className="text-accent-primary" />
              Progress Reports
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Automated summaries of your performance trends</p>
          </div>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            <Download size={16} />
            Download
          </button>
        </div>

        {/* period toggle */}
        <div className="flex gap-1 mt-4 p-1 rounded-xl bg-bg-elevated w-fit">
          {[['week', 'This Week'], ['month', 'This Month']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === key ? 'bg-white text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Sessions', value: current.length, prev: previous.length, icon: '📊', unit: '' },
          { label: 'Avg Risk', value: avgOverall, prev: prevOverall, icon: '⚠️', unit: '%' },
          { label: 'Best Score', value: bestScore, icon: '🏆', unit: '%' },
          { label: 'Avg Readiness', value: avgReadiness, icon: '💚', unit: '%' },
        ].map(({ label, value, prev, icon, unit }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-4 border border-border-subtle"
          >
            <p className="text-xl mb-1">{icon}</p>
            <p className="text-2xl font-bold text-text-primary font-mono">{value != null ? `${value}${unit}` : '—'}</p>
            <p className="text-xs text-text-muted">{label}</p>
            {prev != null && value != null && (
              <MetricDelta current={value} previous={prev} label={periodLabel} />
            )}
          </motion.div>
        ))}
      </div>

      {/* insights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-4 border border-border-subtle mb-5"
      >
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3 flex items-center gap-1">
          <Award size={13} className="text-accent-primary" />
          Key Insights
        </p>
        <ul className="space-y-2">
          {insights.map((i, idx) => <InsightBullet key={idx} {...i} />)}
        </ul>
      </motion.div>

      {/* 8-week trend chart */}
      {weeklyChart.some((w) => w.avgRisk != null) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-4 border border-border-subtle mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1">
              <Calendar size={13} /> 8-Week Risk Trend
            </p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weeklyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="avgRisk" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4, fill: '#4f46e5' }} name="Avg Risk %" connectNulls />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} name="Sessions" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* movement breakdown */}
      {movementBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-4 border border-border-subtle mb-5">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">
            Movement Breakdown — This {period === 'week' ? 'Week' : 'Month'}
          </p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={movementBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
              <YAxis type="category" dataKey="movement" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgRisk" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Avg Risk %" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* goals achieved */}
      {achievedGoals.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-4 border border-success/30 bg-success/5 mb-5">
          <p className="text-xs font-bold text-success uppercase tracking-wide mb-3">
            Goals Achieved This {period === 'week' ? 'Week' : 'Month'}
          </p>
          <div className="grid gap-2">
            {achievedGoals.map((g) => (
              <div key={g.id} className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <p className="text-sm text-text-primary font-semibold">{g.title}</p>
                <span className="text-xs text-text-muted">({g.movement_type})</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* empty state */}
      {current.length === 0 && (
        <div className="text-center py-12 glass rounded-2xl border border-border-subtle">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-text-primary font-semibold">No data for this {period}</p>
          <p className="text-sm text-text-muted mt-1">Complete some analyses to generate a report</p>
        </div>
      )}
    </div>
  )
}
