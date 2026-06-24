import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Activity, Info } from 'lucide-react'
import { useStore } from '../store'
import GlassSelect from '../components/GlassSelect'

const BODY_METRICS = [
  { key: 'knee_valgus_left',  label: 'Left Knee',      zone: 'knee', color: '#f59e0b', emoji: '🦵', desc: 'Inward knee collapse (valgus) — ACL & meniscus risk' },
  { key: 'knee_valgus_right', label: 'Right Knee',     zone: 'knee', color: '#f97316', emoji: '🦵', desc: 'Inward knee collapse (valgus) — ACL & meniscus risk' },
  { key: 'trunk_lean',        label: 'Trunk / Spine',  zone: 'trunk', color: '#ec4899', emoji: '🏃', desc: 'Excessive trunk lean — lower back strain risk' },
  { key: 'asymmetry',         label: 'Bilateral Balance', zone: 'core', color: '#06b6d4', emoji: '⚖️', desc: 'Left-right asymmetry — overuse injury risk' },
  { key: 'shoulder',          label: 'Shoulders',      zone: 'shoulder', color: '#8b5cf6', emoji: '💪', desc: 'Shoulder asymmetry and impingement risk' },
  { key: 'hip_drop',          label: 'Hip Drop',       zone: 'hip', color: '#10b981', emoji: '🦴', desc: 'Lateral hip drop — IT band and hip flexor risk' },
]

const RISK_THRESHOLDS = { low: 30, moderate: 60 }

function getRiskLevel(score) {
  if (score < RISK_THRESHOLDS.low) return 'Low'
  if (score < RISK_THRESHOLDS.moderate) return 'Moderate'
  return 'High'
}

function getRiskColor(score) {
  if (score < RISK_THRESHOLDS.low) return '#10b981'
  if (score < RISK_THRESHOLDS.moderate) return '#f59e0b'
  return '#ef4444'
}

function getTrendInfo(values) {
  if (values.length < 2) return { direction: 'flat', change: 0 }
  const recent = values.slice(0, Math.min(3, values.length))
  const older  = values.slice(Math.min(3, values.length))
  if (older.length === 0) return { direction: 'flat', change: 0 }
  const recentAvg = recent.reduce((a,b) => a+b, 0) / recent.length
  const olderAvg  = older.reduce((a,b) => a+b, 0) / older.length
  const change = Math.round(recentAvg - olderAvg)
  return {
    direction: change < -2 ? 'improving' : change > 2 ? 'worsening' : 'flat',
    change,
  }
}

function BodySVG({ activeZone, metrics }) {
  const getZoneColor = (zone) => {
    const zoneMetrics = BODY_METRICS.filter((m) => m.zone === zone)
    const scores = zoneMetrics.flatMap((m) => {
      const vals = metrics[m.key]
      return vals.length > 0 ? [vals[0]] : []
    }).filter(Boolean)
    if (scores.length === 0) return 'rgba(15,23,42,0.08)'
    const avg = scores.reduce((a,b)=>a+b,0)/scores.length
    const color = getRiskColor(avg)
    return `${color}35`
  }

  const getStroke = (zone) => {
    const zoneMetrics = BODY_METRICS.filter((m) => m.zone === zone)
    const scores = zoneMetrics.flatMap((m) => {
      const vals = metrics[m.key]
      return vals.length > 0 ? [vals[0]] : []
    }).filter(Boolean)
    if (scores.length === 0) return 'rgba(15,23,42,0.12)'
    const avg = scores.reduce((a,b)=>a+b,0)/scores.length
    return getRiskColor(avg)
  }

  return (
    <svg viewBox="0 0 120 280" className="w-full h-full" style={{ maxHeight: 320 }}>
      {/* head */}
      <ellipse cx="60" cy="25" rx="18" ry="22" fill={getZoneColor('head')} stroke={getStroke('head')} strokeWidth="1.5" />
      {/* neck */}
      <rect x="52" y="45" width="16" height="12" rx="4" fill="rgba(15,23,42,0.06)" stroke="rgba(15,23,42,0.10)" strokeWidth="1" />
      {/* torso / trunk */}
      <rect x="32" y="57" width="56" height="75" rx="12" fill={getZoneColor('trunk')} stroke={getStroke('trunk')} strokeWidth="1.5" />
      {/* left shoulder */}
      <ellipse cx="27" cy="70" rx="14" ry="11" fill={getZoneColor('shoulder')} stroke={getStroke('shoulder')} strokeWidth="1.5" />
      {/* right shoulder */}
      <ellipse cx="93" cy="70" rx="14" ry="11" fill={getZoneColor('shoulder')} stroke={getStroke('shoulder')} strokeWidth="1.5" />
      {/* left arm */}
      <rect x="15" y="78" width="12" height="50" rx="6" fill="rgba(15,23,42,0.06)" stroke="rgba(15,23,42,0.10)" strokeWidth="1" />
      {/* right arm */}
      <rect x="93" y="78" width="12" height="50" rx="6" fill="rgba(15,23,42,0.06)" stroke="rgba(15,23,42,0.10)" strokeWidth="1" />
      {/* hips */}
      <ellipse cx="60" cy="135" rx="32" ry="14" fill={getZoneColor('hip')} stroke={getStroke('hip')} strokeWidth="1.5" />
      {/* core label */}
      <ellipse cx="60" cy="100" rx="18" ry="20" fill={getZoneColor('core')} stroke={getStroke('core')} strokeWidth="1" strokeDasharray="3 2" />
      {/* left thigh */}
      <rect x="31" y="148" width="22" height="60" rx="8" fill={getZoneColor('knee')} stroke={getStroke('knee')} strokeWidth="1.5" />
      {/* right thigh */}
      <rect x="67" y="148" width="22" height="60" rx="8" fill={getZoneColor('knee')} stroke={getStroke('knee')} strokeWidth="1.5" />
      {/* left knee */}
      <ellipse cx="42" cy="212" rx="13" ry="10" fill={getZoneColor('knee')} stroke={getStroke('knee')} strokeWidth="2" />
      {/* right knee */}
      <ellipse cx="78" cy="212" rx="13" ry="10" fill={getZoneColor('knee')} stroke={getStroke('knee')} strokeWidth="2" />
      {/* left shin */}
      <rect x="33" y="220" width="18" height="45" rx="6" fill="rgba(15,23,42,0.06)" stroke="rgba(15,23,42,0.10)" strokeWidth="1" />
      {/* right shin */}
      <rect x="69" y="220" width="18" height="45" rx="6" fill="rgba(15,23,42,0.06)" stroke="rgba(15,23,42,0.10)" strokeWidth="1" />
      {/* left foot */}
      <ellipse cx="42" cy="268" rx="14" ry="7" fill="rgba(15,23,42,0.10)" stroke="rgba(15,23,42,0.15)" strokeWidth="1" />
      {/* right foot */}
      <ellipse cx="78" cy="268" rx="14" ry="7" fill="rgba(15,23,42,0.10)" stroke="rgba(15,23,42,0.15)" strokeWidth="1" />

      {/* zone labels */}
      <text x="60" y="22" textAnchor="middle" fontSize="7" fill="rgba(15,23,42,0.4)">HEAD</text>
      <text x="60" y="95" textAnchor="middle" fontSize="6" fill="rgba(15,23,42,0.4)">CORE</text>
      <text x="60" y="135" textAnchor="middle" fontSize="6" fill="rgba(15,23,42,0.4)">HIPS</text>
    </svg>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-2.5 border border-border-subtle text-xs shadow-xl">
      <p className="text-text-muted mb-1">Session {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-primary font-semibold">{p.value}%</span>
        </p>
      ))}
    </div>
  )
}

export default function BodyAnalyticsScreen() {
  const history = useStore((s) => s.history)
  const getRiskAlerts = useStore((s) => s.getRiskAlerts)
  const setScreen = useStore((s) => s.setScreen)
  const [selectedMetric, setSelectedMetric] = useState('overall')

  const alerts = getRiskAlerts()

  // Build metric value arrays from history
  const metricData = useMemo(() => {
    const result = {}
    BODY_METRICS.forEach(({ key }) => {
      result[key] = history.map((h) => h.scores?.[key]).filter((v) => v != null)
    })
    return result
  }, [history])

  // Chart data for selected metric
  const chartData = useMemo(() => {
    return [...history].reverse().map((h, i) => ({
      session: `#${i + 1}`,
      value: h.scores?.[selectedMetric === 'overall' ? 'overall' : selectedMetric] ?? null,
      movement: h.movement_type,
      date: new Date(h.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    })).filter((d) => d.value != null)
  }, [history, selectedMetric])

  // overall chart
  const overallChart = useMemo(() => {
    return [...history].reverse().map((h, i) => {
      const row = { session: `#${i + 1}` }
      BODY_METRICS.forEach(({ key }) => { row[key] = h.scores?.[key] ?? null })
      row.overall = h.scores?.overall ?? null
      return row
    })
  }, [history])

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Activity size={22} className="text-accent-primary" />
          Body Analytics
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Detailed breakdown of risk by joint and body region</p>
      </motion.div>

      {/* risk alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 glass rounded-2xl p-4 border border-danger/25"
            style={{ background: 'rgba(239,68,68,0.04)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-danger" />
              <p className="text-sm font-bold text-danger">Risk Alerts ({alerts.length})</p>
            </div>
            <div className="grid gap-2">
              {alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${alert.type === 'high' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                    {alert.type === 'high' ? 'HIGH' : 'WORSENING'}
                  </span>
                  <p className="text-text-secondary">{alert.message}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🫀</p>
          <p className="text-text-primary font-semibold mb-2">No analysis data yet</p>
          <p className="text-sm text-text-muted mb-4">Complete your first analysis to see body analytics</p>
          <button onClick={() => setScreen('upload')} className="text-sm text-accent-primary underline">Start an analysis</button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* body diagram */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 glass rounded-2xl p-4 border border-border-subtle"
          >
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Risk Heat Map</p>
            <BodySVG activeZone={null} metrics={metricData} />
            <div className="flex items-center justify-center gap-4 mt-3">
              {[['Low', '#10b981'], ['Moderate', '#f59e0b'], ['High', '#ef4444']].map(([l,c]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                  <span className="text-xs text-text-muted">{l}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* metrics list */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            {BODY_METRICS.map(({ key, label, color, emoji, desc }, i) => {
              const vals    = metricData[key]
              const latest  = vals[0] ?? null
              const { direction, change } = getTrendInfo(vals)
              const level   = latest != null ? getRiskLevel(latest) : null
              const levelColor = latest != null ? getRiskColor(latest) : '#94a3b8'
              const avgAll  = vals.length > 0 ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`glass rounded-2xl p-4 border transition-all duration-200 cursor-pointer ${
                    selectedMetric === key ? 'border-accent-primary/40' : 'border-border-subtle hover:border-accent-primary/20'
                  }`}
                  onClick={() => setSelectedMetric(key)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-text-primary">{label}</p>
                        {level && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ color: levelColor, background: `${levelColor}15` }}>
                            {level}
                          </span>
                        )}
                        {direction !== 'flat' && (
                          <span className={`text-xs flex items-center gap-0.5 font-semibold ${direction === 'improving' ? 'text-success' : 'text-danger'}`}>
                            {direction === 'improving' ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                            {Math.abs(change)}% {direction}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted">{desc}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold font-mono" style={{ color: levelColor }}>
                        {latest != null ? `${latest}%` : '—'}
                      </p>
                      {avgAll != null && <p className="text-xs text-text-muted">avg {avgAll}%</p>}
                    </div>
                  </div>

                  {/* mini bar */}
                  {latest != null && (
                    <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${latest}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.06 + 0.2 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${levelColor}80, ${levelColor})` }}
                      />
                    </div>
                  )}

                  {vals.length === 0 && (
                    <p className="text-xs text-text-muted flex items-center gap-1 mt-1">
                      <Info size={11} />
                      No data for this metric yet
                    </p>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* trend chart */}
      {history.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5 glass rounded-2xl p-5 border border-border-subtle"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-bold text-text-primary">
                {selectedMetric === 'overall' ? 'Overall Risk' : BODY_METRICS.find((m) => m.key === selectedMetric)?.label} Trend
              </p>
              <p className="text-xs text-text-muted">Across all {history.length} sessions</p>
            </div>
            <GlassSelect
              value={selectedMetric}
              onChange={(val) => setSelectedMetric(val)}
              options={[
                { value: 'overall', label: 'Overall Risk' },
                ...BODY_METRICS.map((m) => ({ value: m.key, label: m.label })),
              ]}
              className="w-40"
            />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
              <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'Low', position: 'right', fontSize: 10, fill: '#10b981' }} />
              <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'Moderate', position: 'right', fontSize: 10, fill: '#f59e0b' }} />
              <Line
                type="monotone" dataKey="value" stroke={BODY_METRICS.find((m)=>m.key===selectedMetric)?.color ?? '#4f46e5'}
                strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls name="Risk %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* all metrics overview chart */}
      {history.length >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 glass rounded-2xl p-5 border border-border-subtle"
        >
          <p className="text-sm font-bold text-text-primary mb-4">All Metrics — Session History</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={overallChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
              <XAxis dataKey="session" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 12, fontSize: 11 }} />
              {BODY_METRICS.slice(0, 4).map(({ key, label, color }) => (
                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={1.5} dot={false} name={label} connectNulls />
              ))}
              <Line type="monotone" dataKey="overall" stroke="#4f46e5" strokeWidth={2.5} dot={false} name="Overall" connectNulls strokeDasharray="6 3" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {[...BODY_METRICS.slice(0,4), { key: 'overall', label: 'Overall', color: '#4f46e5' }].map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs text-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
