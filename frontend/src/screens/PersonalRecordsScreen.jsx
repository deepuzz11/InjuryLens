import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const METRIC_DEFINITIONS = [
  { key: 'mqs', label: 'Movement Quality Score', unit: '%', higherBetter: true, color: '#4f46e5', desc: 'Overall score from AI analysis' },
  { key: 'kneeValgusL', label: 'Knee Valgus L', unit: '°', higherBetter: false, color: '#ef4444', desc: 'Lower is better — less inward collapse' },
  { key: 'kneeValgusR', label: 'Knee Valgus R', unit: '°', higherBetter: false, color: '#f97316', desc: 'Lower is better — less inward collapse' },
  { key: 'trunkLean', label: 'Trunk Lean', unit: '°', higherBetter: false, color: '#f59e0b', desc: 'Lower = more upright torso' },
  { key: 'bilateralAsymmetry', label: 'Bilateral Asymmetry', unit: '%', higherBetter: false, color: '#8b5cf6', desc: 'Lower = more balanced L/R sides' },
  { key: 'hipDrop', label: 'Hip Drop', unit: '°', higherBetter: false, color: '#ec4899', desc: 'Lower = better hip stability' },
]

const MOVEMENTS = ['Squat', 'Deadlift', 'Lunge', 'Jump Landing', 'Push-up', 'Running', 'Overhead Press']

const RISK_THRESHOLDS = { low: 0, moderate: 35, high: 65 }
function getRiskBand(score) {
  if (score >= RISK_THRESHOLDS.high) return { label: 'High Risk', color: '#ef4444' }
  if (score >= RISK_THRESHOLDS.moderate) return { label: 'Moderate', color: '#f59e0b' }
  return { label: 'Low Risk', color: '#10b981' }
}

function getMqsFromEntry(e) {
  const metrics = e.metrics || e.results?.metrics || {}
  if (typeof metrics.mqs === 'number') return metrics.mqs
  if (typeof e.mqs === 'number') return e.mqs
  const score = e.results?.score ?? e.overallScore ?? e.score
  return typeof score === 'number' ? score : null
}
function getMetricFromEntry(e, key) {
  const metrics = e.metrics || e.results?.metrics || {}
  return metrics[key] ?? null
}
function getMovementFromEntry(e) {
  return e.movement || e.results?.movement || e.movementType || 'Squat'
}

function RecordBadge({ color }) {
  return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide text-white flex-shrink-0"
      style={{ background: color }}>PR</span>
  )
}

function MovementPRCard({ movement, entries }) {
  const [expanded, setExpanded] = useState(false)

  const records = useMemo(() => {
    if (!entries.length) return null
    const mqs = entries.map((e) => getMqsFromEntry(e)).filter((v) => v !== null)
    const trend = entries.slice(-8).map((e, i) => ({
      name: i + 1,
      score: getMqsFromEntry(e) ?? 0,
    }))

    const bestMqs = mqs.length ? Math.max(...mqs) : null
    const latestMqs = mqs.at(-1) ?? null
    const bestEntry = entries.find((e) => getMqsFromEntry(e) === bestMqs)
    const riskScores = entries.map((e) => e.riskScore ?? e.results?.riskScore ?? 0)
    const lowestRisk = riskScores.length ? Math.min(...riskScores) : null

    return { bestMqs, latestMqs, lowestRisk, trend, count: entries.length, bestDate: bestEntry?.date }
  }, [entries])

  if (!records) return null
  const improvTrend = records.latestMqs !== null && records.bestMqs !== null
    ? Math.round(records.latestMqs - (records.trend[0]?.score ?? records.latestMqs))
    : 0

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden border border-border-subtle hover:border-accent-primary/20 transition-all">
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-black text-xs flex-shrink-0">
          {movement.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">{movement}</p>
          <p className="text-xs text-text-muted">{records.count} session{records.count !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {records.bestMqs !== null && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold font-mono text-accent-primary">{records.bestMqs}%</span>
                <RecordBadge color="#4f46e5" />
              </div>
              <p className="text-[10px] text-text-muted">Best MQS</p>
            </div>
          )}
          {improvTrend !== 0 && (
            <span className={`text-xs font-semibold ${improvTrend > 0 ? 'text-success' : 'text-danger'}`}>
              {improvTrend > 0 ? '+' : ''}{improvTrend}%
            </span>
          )}
          {expanded ? <ChevronUp size={15} className="text-text-muted" /> : <ChevronDown size={15} className="text-text-muted" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border-subtle">
            <div className="p-4 grid gap-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Best MQS', value: records.bestMqs !== null ? `${records.bestMqs}%` : '—', sub: records.bestDate ? new Date(records.bestDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '' },
                  { label: 'Latest MQS', value: records.latestMqs !== null ? `${records.latestMqs}%` : '—', sub: 'Most recent' },
                  { label: 'Lowest Risk', value: records.lowestRisk !== null ? `${records.lowestRisk}%` : '—', sub: getRiskBand(records.lowestRisk ?? 0).label },
                ].map(({ label, value, sub }) => (
                  <div key={label} className="glass-elevated rounded-xl p-2.5 text-center border border-border-subtle">
                    <p className="text-sm font-bold font-mono text-text-primary">{value}</p>
                    <p className="text-[10px] text-text-secondary font-semibold">{label}</p>
                    {sub && <p className="text-[10px] text-text-muted">{sub}</p>}
                  </div>
                ))}
              </div>

              {records.trend.length > 1 && (
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Score Trend</p>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={records.trend}>
                      <XAxis hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip formatter={(v) => [`${v}%`, 'MQS']} contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid rgba(15,23,42,0.1)' }} />
                      <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2.5, fill: '#4f46e5' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function OverallBestCard({ metric, history }) {
  const values = history.map((e) => {
    const v = metric.key === 'mqs' ? getMqsFromEntry(e) : getMetricFromEntry(e, metric.key)
    return v !== null ? { value: v, entry: e } : null
  }).filter(Boolean)

  if (!values.length) return null

  const best = metric.higherBetter
    ? values.reduce((a, b) => b.value > a.value ? b : a)
    : values.reduce((a, b) => b.value < a.value ? b : a)

  return (
    <div className="glass rounded-xl p-3 border border-border-subtle text-center">
      <p className="text-[10px] text-text-muted mb-0.5">{metric.label}</p>
      <p className="text-base font-black font-mono" style={{ color: metric.color }}>
        {best.value.toFixed(1)}{metric.unit}
      </p>
      <p className="text-[10px] text-text-muted">{new Date(best.entry.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
    </div>
  )
}

export default function PersonalRecordsScreen() {
  const history = useStore((s) => s.history)
  const [activeTab, setActiveTab] = useState('movements')

  const byMovement = useMemo(() => {
    const map = {}
    for (const e of history) {
      const m = getMovementFromEntry(e)
      if (!map[m]) map[m] = []
      map[m].push(e)
    }
    return map
  }, [history])

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Trophy size={22} className="text-warning" /> Personal Records
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Your all-time bests across every movement and metric</p>

        <div className="flex gap-1 mt-4 p-1 rounded-xl bg-bg-elevated w-fit">
          {[['movements', 'By Movement'], ['metrics', 'All-Time Bests']].map(([k, l]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === k ? 'bg-white text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
              {l}
            </button>
          ))}
        </div>
      </motion.div>

      {history.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-text-primary font-semibold">No records yet</p>
          <p className="text-sm text-text-muted mt-1">Complete your first analysis to start building your PRs</p>
        </div>
      ) : activeTab === 'movements' ? (
        <div className="grid gap-3">
          {Object.entries(byMovement).length === 0 ? (
            <p className="text-text-muted text-sm text-center py-8">No movement data yet</p>
          ) : (
            Object.entries(byMovement).map(([movement, entries]) => (
              <MovementPRCard key={movement} movement={movement} entries={entries} />
            ))
          )}
        </div>
      ) : (
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">All-Time Best Values</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {METRIC_DEFINITIONS.map((m) => (
              <OverallBestCard key={m.key} metric={m} history={history} />
            ))}
          </div>

          <div className="mt-6">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Total Sessions by Movement</p>
            <div className="grid gap-2">
              {Object.entries(byMovement).sort((a, b) => b[1].length - a[1].length).map(([movement, entries]) => (
                <div key={movement} className="glass rounded-xl p-3 border border-border-subtle flex items-center gap-3">
                  <span className="text-sm font-semibold text-text-primary flex-1">{movement}</span>
                  <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                      style={{ width: `${(entries.length / Math.max(...Object.values(byMovement).map((v) => v.length))) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-text-muted w-8 text-right">{entries.length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
