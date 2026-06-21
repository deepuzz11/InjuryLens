import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Plus, Trash2, CheckCircle, Clock, TrendingDown, Trophy, ChevronRight, X } from 'lucide-react'
import { useStore } from '../store'

const MOVEMENTS = [
  'Squat', 'Deadlift', 'Lunge', 'Running', 'Jump Landing',
  'Push-up', 'Plank', 'Hip Hinge', 'Overhead Press',
  'Lateral Lunge', 'Split Squat', 'Bench Press',
]

const METRICS = [
  { key: 'overall',           label: 'Overall Risk Score',   unit: '%', lower: true },
  { key: 'knee_valgus_left',  label: 'Left Knee Valgus',     unit: '%', lower: true },
  { key: 'knee_valgus_right', label: 'Right Knee Valgus',    unit: '%', lower: true },
  { key: 'trunk_lean',        label: 'Trunk Lean Risk',      unit: '%', lower: true },
  { key: 'asymmetry',         label: 'Bilateral Asymmetry',  unit: '%', lower: true },
  { key: 'shoulder',          label: 'Shoulder Risk',        unit: '%', lower: true },
]

const EMPTY_FORM = { title: '', movement_type: 'Squat', metric: 'overall', target: 30, notes: '' }

function GoalCard({ goal, history, index, onDelete, onMarkAchieved }) {
  const relevant = history.filter((h) => h.movement_type === goal.movement_type)
  const currentVal = relevant[0]?.scores?.[goal.metric] ?? null
  const metricLabel = METRICS.find((m) => m.key === goal.metric)?.label ?? goal.metric
  const progress = currentVal != null ? Math.max(0, Math.min(100, Math.round(((currentVal - goal.target) / Math.max(currentVal, 1)) * 100))) : null
  const progressColor = goal.achieved ? '#10b981' : currentVal != null && currentVal <= goal.target ? '#10b981' : currentVal != null && currentVal <= goal.target * 1.3 ? '#f59e0b' : '#ef4444'

  const daysSince = Math.floor((Date.now() - new Date(goal.created).getTime()) / 86400000)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className={`glass rounded-2xl p-4 border transition-all duration-200 ${
        goal.achieved
          ? 'border-success/30 bg-success/5'
          : 'border-border-subtle hover:border-accent-primary/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: goal.achieved ? 'rgba(16,185,129,0.12)' : 'rgba(79,70,229,0.10)' }}
          >
            {goal.achieved
              ? <CheckCircle size={16} className="text-success" />
              : <Target size={16} className="text-accent-primary" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary leading-tight">{goal.title}</p>
            <p className="text-xs text-text-muted">{goal.movement_type} · {metricLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!goal.achieved && currentVal != null && currentVal <= goal.target && (
            <button
              onClick={() => onMarkAchieved(goal.id)}
              className="text-xs text-success border border-success/30 rounded-lg px-2 py-1 hover:bg-success/10 transition-colors"
            >
              Mark Done
            </button>
          )}
          <button
            onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* target vs current */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <p className="text-xs text-text-muted mb-1">Target</p>
          <p className="text-xl font-bold font-mono" style={{ color: '#4f46e5' }}>{goal.target}%</p>
        </div>
        <ChevronRight size={16} className="text-text-muted" />
        <div className="flex-1">
          <p className="text-xs text-text-muted mb-1">Current</p>
          <p className="text-xl font-bold font-mono" style={{ color: progressColor }}>
            {currentVal != null ? `${currentVal}%` : '—'}
          </p>
        </div>
        {relevant.length > 1 && (
          <>
            <ChevronRight size={16} className="text-text-muted" />
            <div className="flex-1">
              <p className="text-xs text-text-muted mb-1">Started at</p>
              <p className="text-xl font-bold font-mono text-text-secondary">
                {relevant[relevant.length - 1]?.scores?.[goal.metric] ?? '—'}%
              </p>
            </div>
          </>
        )}
      </div>

      {/* progress bar */}
      {currentVal != null && (
        <div className="mb-3">
          <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: goal.achieved ? '100%' : `${Math.max(5, 100 - Math.max(0, currentVal - goal.target) / Math.max(currentVal, 1) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.05 + 0.2 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${progressColor}80, ${progressColor})` }}
            />
          </div>
          {goal.achieved && goal.achievedDate && (
            <p className="text-xs text-success mt-1">Achieved {new Date(goal.achievedDate).toLocaleDateString()}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Clock size={11} />
          <span>{daysSince === 0 ? 'Today' : `${daysSince}d ago`}</span>
          {relevant.length > 0 && <span>· {relevant.length} sessions</span>}
        </div>
        {goal.achieved && <span className="text-xs font-bold text-success">Achieved!</span>}
      </div>

      {goal.notes && (
        <p className="mt-2 text-xs text-text-muted border-t border-border-subtle pt-2">{goal.notes}</p>
      )}
    </motion.div>
  )
}

export default function GoalsScreen() {
  const history      = useStore((s) => s.history)
  const goals        = useStore((s) => s.goals)
  const addGoal      = useStore((s) => s.addGoal)
  const deleteGoal   = useStore((s) => s.deleteGoal)
  const markGoalAchieved = useStore((s) => s.markGoalAchieved)
  const setScreen    = useStore((s) => s.setScreen)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [filter, setFilter]     = useState('all') // all | active | achieved

  const filtered = useMemo(() => {
    if (filter === 'active')   return goals.filter((g) => !g.achieved)
    if (filter === 'achieved') return goals.filter((g) => g.achieved)
    return goals
  }, [goals, filter])

  const achieved = goals.filter((g) => g.achieved).length
  const active   = goals.filter((g) => !g.achieved).length

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    addGoal({ ...form, target: Number(form.target) })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  // Suggested goals from history
  const suggestions = useMemo(() => {
    if (history.length < 2) return []
    const latest = history[0]
    const sugg = []
    if ((latest.scores?.overall ?? 100) > 40) {
      sugg.push({ title: 'Reduce Overall Risk', movement_type: latest.movement_type, metric: 'overall', target: Math.max(20, Math.round((latest.scores?.overall ?? 50) * 0.7)) })
    }
    if ((latest.scores?.knee_valgus_left ?? 100) > 30) {
      sugg.push({ title: 'Fix Left Knee Collapse', movement_type: latest.movement_type, metric: 'knee_valgus_left', target: 25 })
    }
    if ((latest.scores?.trunk_lean ?? 100) > 35) {
      sugg.push({ title: 'Improve Trunk Control', movement_type: latest.movement_type, metric: 'trunk_lean', target: 25 })
    }
    return sugg.slice(0, 3)
  }, [history])

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Target size={22} className="text-accent-primary" />
              Training Goals
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Set targets and track your improvement over time</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 shadow-md"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            <Plus size={16} />
            New Goal
          </button>
        </div>

        {/* stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Total Goals', value: goals.length, icon: '🎯' },
            { label: 'Active',      value: active,       icon: '⚡' },
            { label: 'Achieved',    value: achieved,     icon: '✅' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass rounded-xl p-3 border border-border-subtle text-center">
              <p className="text-xl">{icon}</p>
              <p className="text-xl font-bold text-text-primary font-mono">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* filter tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-bg-elevated w-fit">
        {[['all', 'All'], ['active', 'Active'], ['achieved', 'Achieved']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === key ? 'bg-white text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* suggestions */}
      {suggestions.length > 0 && goals.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Suggested Goals (from your latest analysis)</p>
          <div className="grid gap-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setForm({ ...EMPTY_FORM, ...s, notes: 'Auto-suggested from analysis' }); setShowForm(true) }}
                className="glass rounded-xl p-3 border border-dashed border-accent-primary/30 text-left flex items-center justify-between hover:border-accent-primary/60 transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">{s.title}</p>
                  <p className="text-xs text-text-muted">{s.movement_type} · Target: {s.target}%</p>
                </div>
                <Plus size={14} className="text-accent-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-text-primary font-semibold mb-1">{filter === 'achieved' ? 'No achieved goals yet' : 'No goals set'}</p>
          <p className="text-sm text-text-muted mb-4">
            {history.length === 0
              ? 'Complete an analysis first to get goal suggestions'
              : 'Set a target to track your biomechanical improvements'
            }
          </p>
          {history.length === 0 ? (
            <button onClick={() => setScreen('upload')} className="text-sm text-accent-primary underline">Start an analysis</button>
          ) : (
            <button onClick={() => setShowForm(true)} className="text-sm text-accent-primary underline">Create your first goal</button>
          )}
        </div>
      )}

      {/* goal cards */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filtered.map((goal, i) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              history={history}
              index={i}
              onDelete={deleteGoal}
              onMarkAchieved={markGoalAchieved}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Create goal modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-elevated rounded-2xl p-6 w-full max-w-md border border-border-subtle"
              style={{ boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-text-primary">New Training Goal</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Goal Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Fix left knee collapse in squats"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Movement</label>
                    <select
                      value={form.movement_type}
                      onChange={(e) => setForm((f) => ({ ...f, movement_type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                    >
                      {MOVEMENTS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Metric</label>
                    <select
                      value={form.metric}
                      onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                    >
                      {METRICS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Target Risk Score: <span className="text-accent-primary font-bold">{form.target}%</span>
                  </label>
                  <input
                    type="range" min={5} max={80} step={5}
                    value={form.target}
                    onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-0.5">
                    <span>5% (Elite)</span><span>40% (Good)</span><span>80% (Start)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Notes (optional)</label>
                  <textarea
                    placeholder="Why is this goal important to you?"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none"
                  />
                </div>

                <div className="flex gap-2 mt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-muted hover:bg-bg-elevated transition-colors">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    Create Goal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
