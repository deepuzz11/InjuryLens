import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Heart, Moon, Zap, Trash2, Plus, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { useStore } from '../store'

const SORENESS_LABELS = ['None', 'Mild', 'Moderate', 'High', 'Severe']
const ENERGY_LABELS   = ['Exhausted', 'Low', 'Moderate', 'Good', 'Excellent']

function ReadinessBadge({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 75 ? 'Ready to Train' : score >= 50 ? 'Train with Caution' : 'Rest Day Recommended'
  const icon  = score >= 75 ? CheckCircle : AlertTriangle
  const Icon  = icon
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
      <Icon size={13} />
      {label}
    </div>
  )
}

const NUTRITION_TIPS = {
  low: [
    'Prioritize complete protein within 30 min of training (chicken, fish, eggs)',
    'Include anti-inflammatory foods: turmeric, ginger, berries',
    'Hydrate 500ml before training, 250ml every 20 min during',
    'Consume complex carbs 2-3 hrs before training for sustained energy',
    'Magnesium-rich foods (nuts, leafy greens) aid muscle recovery',
  ],
  high: [
    'This is a rest day — focus on nutrient-dense whole foods',
    'Increase protein intake on rest days (1.8-2.2g per kg bodyweight)',
    'Tart cherry juice has shown 20% reduction in muscle soreness',
    'Omega-3 fatty acids (salmon, flaxseed) reduce inflammation significantly',
    'Stay hydrated — muscle repair requires adequate water',
    'Avoid alcohol: it impairs protein synthesis and sleep quality by 25%',
  ],
}

const RECOVERY_TIPS = {
  low: [
    'Consider reducing intensity — performance during fatigue increases injury risk by 2x',
    'Focus on mobility work and technical practice today',
    'Sleep is the most powerful recovery tool — aim for 8-9 hours tonight',
  ],
  high: [
    'Great readiness! This is the time to push hard in training',
    'Your nervous system is primed for skill acquisition today',
    'Take advantage of this window for high-intensity or heavy strength work',
  ],
}

export default function RecoveryScreen() {
  const recoveryLogs    = useStore((s) => s.recoveryLogs)
  const addRecoveryLog  = useStore((s) => s.addRecoveryLog)
  const deleteRecoveryLog = useStore((s) => s.deleteRecoveryLog)
  const history         = useStore((s) => s.history)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ sleep: 7, soreness: 1, energy: 3, notes: '' })
  const [tab, setTab]   = useState('log') // log | nutrition | tips

  const todayLog  = recoveryLogs[0]
  const todayDate = new Date().toDateString()
  const loggedToday = todayLog && new Date(todayLog.date).toDateString() === todayDate

  const last7  = useMemo(() => recoveryLogs.slice(0, 7).reverse(), [recoveryLogs])
  const avgReadiness = last7.length > 0 ? Math.round(last7.reduce((s, l) => s + l.readiness, 0) / last7.length) : null

  const chartData = useMemo(() =>
    last7.map((l) => ({
      date: new Date(l.date).toLocaleDateString('en', { weekday: 'short' }),
      readiness: l.readiness,
      sleep: Math.round(l.sleep * 10),
      energy: l.energy * 20,
    })),
    [last7]
  )

  function handleSubmit(e) {
    e.preventDefault()
    addRecoveryLog({ ...form, sleep: Number(form.sleep), soreness: Number(form.soreness), energy: Number(form.energy) })
    setForm({ sleep: 7, soreness: 1, energy: 3, notes: '' })
    setShowForm(false)
  }

  const currentReadiness = loggedToday ? todayLog.readiness : null
  const tipCategory = currentReadiness != null ? (currentReadiness >= 60 ? 'high' : 'low') : 'high'

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Heart size={22} className="text-danger" />
              Recovery Hub
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Track sleep, soreness & readiness to train smarter</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:scale-105"
            style={{ background: loggedToday ? 'rgba(15,23,42,0.25)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            disabled={loggedToday}
          >
            <Plus size={16} />
            {loggedToday ? 'Logged Today' : "Log Today's Recovery"}
          </button>
        </div>

        {/* today's snapshot */}
        {loggedToday && todayLog && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 glass rounded-2xl p-4 border border-border-subtle"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-text-primary">Today's Status</p>
              <ReadinessBadge score={todayLog.readiness} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Moon,   label: 'Sleep',   value: `${todayLog.sleep}h`,                       color: '#6366f1' },
                { icon: Zap,    label: 'Energy',  value: ENERGY_LABELS[todayLog.energy - 1] ?? '—', color: '#f59e0b' },
                { icon: Heart,  label: 'Soreness', value: SORENESS_LABELS[todayLog.soreness - 1] ?? 'None', color: '#ef4444' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="text-center">
                  <Icon size={18} style={{ color }} className="mx-auto mb-1" />
                  <p className="text-sm font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-muted">{label}</p>
                </div>
              ))}
            </div>
            {todayLog.notes && (
              <p className="mt-3 text-xs text-text-muted border-t border-border-subtle pt-2">{todayLog.notes}</p>
            )}
          </motion.div>
        )}

        {/* stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Avg Readiness', value: avgReadiness != null ? `${avgReadiness}%` : '—', icon: '💚' },
            { label: 'Days Logged', value: recoveryLogs.length, icon: '📅' },
            { label: 'Avg Sleep', value: last7.length > 0 ? `${(last7.reduce((s,l)=>s+l.sleep,0)/last7.length).toFixed(1)}h` : '—', icon: '😴' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass rounded-xl p-3 border border-border-subtle text-center">
              <p className="text-xl">{icon}</p>
              <p className="text-lg font-bold text-text-primary font-mono">{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-bg-elevated w-fit">
        {[['log', 'Recovery Log'], ['nutrition', 'Nutrition'], ['tips', 'Training Tips']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === key ? 'bg-white text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* chart */}
      {tab === 'log' && chartData.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 border border-border-subtle mb-5">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">7-Day Readiness Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="readiness" stroke="#10b981" strokeWidth={2} fill="url(#readGrad)" name="Readiness %" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* log entries */}
      {tab === 'log' && (
        <div className="grid gap-3">
          {recoveryLogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">😴</p>
              <p className="text-text-primary font-semibold">No recovery logs yet</p>
              <p className="text-sm text-text-muted mt-1 mb-4">Log your first recovery session to see trends</p>
              <button onClick={() => setShowForm(true)} className="text-sm text-accent-primary underline">Log today's recovery</button>
            </div>
          ) : (
            recoveryLogs.map((log, i) => {
              const readColor = log.readiness >= 75 ? '#10b981' : log.readiness >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-xl p-3 border border-border-subtle flex items-center gap-3"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm font-mono"
                    style={{ background: `${readColor}15`, color: readColor, border: `1px solid ${readColor}30` }}
                  >
                    {log.readiness}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{new Date(log.date).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-text-muted flex items-center gap-1"><Moon size={10} /> {log.sleep}h</span>
                      <span className="text-xs text-text-muted flex items-center gap-1"><Zap size={10} /> {ENERGY_LABELS[log.energy - 1]}</span>
                      <span className="text-xs text-text-muted flex items-center gap-1"><Heart size={10} /> {SORENESS_LABELS[log.soreness - 1]}</span>
                    </div>
                    {log.notes && <p className="text-xs text-text-muted mt-0.5 truncate">{log.notes}</p>}
                  </div>
                  <button onClick={() => deleteRecoveryLog(log.id)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors flex-shrink-0">
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              )
            })
          )}
        </div>
      )}

      {/* nutrition tab */}
      {tab === 'nutrition' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
          <div className="glass rounded-2xl p-4 border border-border-subtle">
            <p className="text-sm font-bold text-text-primary mb-1">
              {currentReadiness != null
                ? currentReadiness >= 60 ? '🟢 High Readiness Day — Fuel for Performance' : '🔴 Low Readiness Day — Focus on Recovery Nutrition'
                : '🍎 General Sport Nutrition Guidelines'
              }
            </p>
            <p className="text-xs text-text-muted mb-3">{currentReadiness != null ? 'Based on your recovery log today' : 'Log your recovery to get personalized tips'}</p>
            <ul className="space-y-2">
              {NUTRITION_TIPS[tipCategory].map((tip, i) => (
                <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                  <span className="text-success mt-0.5">✓</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-4 border border-border-subtle">
            <p className="text-sm font-bold text-text-primary mb-3">Hydration Guide</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Pre-Training', value: '500ml', time: '2 hrs before' },
                { label: 'During', value: '250ml', time: 'Every 20 min' },
                { label: 'Post-Training', value: '500ml+', time: 'Within 1 hour' },
              ].map(({ label, value, time }) => (
                <div key={label} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <p className="text-base font-bold text-blue-600">{value}</p>
                  <p className="text-xs font-semibold text-blue-800">{label}</p>
                  <p className="text-[10px] text-blue-500 mt-0.5">{time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-border-subtle">
            <p className="text-sm font-bold text-text-primary mb-3">Macronutrient Timing</p>
            {[
              { label: 'Pre-Workout (2-3hr before)', tip: 'Complex carbs + moderate protein. Avoid high fat which slows digestion.', example: 'Oats + eggs, Rice + chicken' },
              { label: 'Post-Workout (within 30min)', tip: 'Fast protein + simple carbs. Maximize the anabolic window.', example: 'Protein shake + banana, Greek yogurt + honey' },
              { label: 'Evening (3hrs before sleep)', tip: 'Slow-digesting protein. Supports overnight muscle repair.', example: 'Cottage cheese, casein protein, Greek yogurt' },
            ].map(({ label, tip, example }) => (
              <div key={label} className="mb-3 last:mb-0 border-b border-border-subtle last:border-0 pb-3 last:pb-0">
                <p className="text-xs font-bold text-text-primary">{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{tip}</p>
                <p className="text-xs text-accent-primary mt-0.5">e.g. {example}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* tips tab */}
      {tab === 'tips' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
          <div className="glass rounded-2xl p-4 border border-border-subtle">
            <p className="text-sm font-bold text-text-primary mb-3">
              {currentReadiness != null ? `Today's Recommendation (${currentReadiness}% readiness)` : 'General Training Guidelines'}
            </p>
            <ul className="space-y-2">
              {RECOVERY_TIPS[tipCategory].map((tip, i) => (
                <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                  <span className={tipCategory === 'high' ? 'text-success' : 'text-warning'}>
                    {tipCategory === 'high' ? '↑' : '→'}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {[
            { icon: '😴', title: 'Sleep Optimization', tips: ['7-9 hours for adults, 8-10 for growing athletes', 'Consistent sleep/wake times matter more than total hours', 'Dark, cool room (65-68°F) optimizes sleep quality', 'Avoid screens 1 hour before bed — blue light suppresses melatonin by 50%', 'Naps (10-20 min) can partially compensate for short nights'] },
            { icon: '🧊', title: 'Active Recovery Techniques', tips: ['Cold water immersion (12-15°C for 10-15 min) reduces DOMS by 20%', 'Foam rolling increases blood flow and reduces muscle stiffness', '15-20 min easy cardio improves circulation without adding fatigue', 'Contrast showers (hot/cold alternating) stimulate the nervous system', 'Yoga or mobility work maintains range of motion during recovery'] },
            { icon: '🧠', title: 'Mental Recovery', tips: ['Psychological fatigue impairs physical performance equally to physical fatigue', 'Meditation (even 5-10 min) reduces cortisol by up to 25%', 'Social connection and enjoyable activities accelerate recovery', 'Training log review builds confidence and reduces pre-training anxiety'] },
          ].map(({ icon, title, tips }) => (
            <div key={title} className="glass rounded-2xl p-4 border border-border-subtle">
              <p className="text-sm font-bold text-text-primary mb-2">{icon} {title}</p>
              <ul className="space-y-1.5">
                {tips.map((t, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-text-muted mt-0.5 flex-shrink-0">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      )}

      {/* Log form modal */}
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
                <h2 className="text-base font-bold text-text-primary">Log Today's Recovery</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted"><X size={16} /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="flex justify-between text-xs font-semibold text-text-secondary mb-2">
                    <span className="flex items-center gap-1"><Moon size={12} /> Sleep Duration</span>
                    <span className="text-accent-primary">{form.sleep} hours</span>
                  </label>
                  <input type="range" min={3} max={12} step={0.5} value={form.sleep}
                    onChange={(e) => setForm((f) => ({ ...f, sleep: e.target.value }))}
                    className="w-full accent-indigo-500" />
                  <div className="flex justify-between text-xs text-text-muted mt-0.5"><span>3h</span><span>7h</span><span>12h</span></div>
                </div>

                <div>
                  <label className="flex justify-between text-xs font-semibold text-text-secondary mb-2">
                    <span className="flex items-center gap-1"><Heart size={12} /> Muscle Soreness</span>
                    <span className="text-danger">{SORENESS_LABELS[form.soreness - 1]}</span>
                  </label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map((v) => (
                      <button type="button" key={v}
                        onClick={() => setForm((f) => ({ ...f, soreness: v }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          form.soreness === v ? 'bg-danger/10 border-danger/40 text-danger' : 'border-border-subtle text-text-muted hover:border-text-muted'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-text-muted mt-1"><span>None</span><span>Severe</span></div>
                </div>

                <div>
                  <label className="flex justify-between text-xs font-semibold text-text-secondary mb-2">
                    <span className="flex items-center gap-1"><Zap size={12} /> Energy Level</span>
                    <span className="text-warning">{ENERGY_LABELS[form.energy - 1]}</span>
                  </label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map((v) => (
                      <button type="button" key={v}
                        onClick={() => setForm((f) => ({ ...f, energy: v }))}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          form.energy === v ? 'bg-warning/10 border-warning/40 text-warning' : 'border-border-subtle text-text-muted hover:border-text-muted'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-text-muted mt-1"><span>Exhausted</span><span>Excellent</span></div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Notes (optional)</label>
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="How are you feeling today?"
                    rows={2} className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none" />
                </div>

                {/* preview readiness */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.12)' }}>
                  <span className="text-xs text-text-muted">Estimated Readiness Score</span>
                  <span className="text-sm font-bold text-accent-primary">
                    {Math.round((Math.min(form.sleep/9,1)*40) + (((5-form.soreness)/4)*30) + ((form.energy/5)*30))}%
                  </span>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>Save Log</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
