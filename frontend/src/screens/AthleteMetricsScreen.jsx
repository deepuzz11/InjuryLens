import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Plus, Save } from 'lucide-react'
import { useStore } from '../store'
import GlassSelect from '../components/GlassSelect'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

const SPORTS = ['General Fitness', 'Football', 'Basketball', 'Soccer', 'Tennis', 'Running', 'Cycling', 'Swimming', 'CrossFit', 'Weightlifting', 'Gymnastics', 'Martial Arts', 'Rugby', 'Baseball', 'Volleyball', 'Track & Field', 'Other']

function getBMI(weight, height) {
  if (!weight || !height) return null
  const hm = height / 100
  return (weight / (hm * hm)).toFixed(1)
}

function getBMILabel(bmi) {
  const b = parseFloat(bmi)
  if (b < 18.5) return { label: 'Underweight', color: '#3b82f6' }
  if (b < 25)   return { label: 'Normal', color: '#10b981' }
  if (b < 30)   return { label: 'Overweight', color: '#f59e0b' }
  return             { label: 'Obese', color: '#ef4444' }
}

function WeightChart({ logs }) {
  if (logs.length < 2) return null
  const data = logs.slice(-20).map((l) => ({
    date: new Date(l.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    weight: l.weight,
  }))
  const avg = logs.reduce((s, l) => s + l.weight, 0) / logs.length
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.06)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={['auto', 'auto']} />
        <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid rgba(15,23,42,0.1)' }} />
        <ReferenceLine y={avg} stroke="rgba(79,70,229,0.3)" strokeDasharray="4 2" label={{ value: `Avg: ${avg.toFixed(1)}kg`, position: 'right', fill: '#4f46e5', fontSize: 10 }} />
        <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3, fill: '#4f46e5' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function TrainingLoad({ history }) {
  const last7 = history.filter((e) => Date.now() - new Date(e.date) < 7 * 86400000)
  const last28 = history.filter((e) => Date.now() - new Date(e.date) < 28 * 86400000)
  const acute = last7.length
  const chronic = last28.length / 4
  const ratio = chronic > 0 ? (acute / chronic).toFixed(2) : 'N/A'
  const ratioNum = parseFloat(ratio)
  const rampStatus = isNaN(ratioNum) ? null
    : ratioNum > 1.5 ? { label: 'Overreaching risk', color: '#ef4444' }
    : ratioNum > 1.3 ? { label: 'High load', color: '#f59e0b' }
    : ratioNum >= 0.8 ? { label: 'Optimal zone', color: '#10b981' }
    : { label: 'Undertraining', color: '#3b82f6' }

  return (
    <div className="glass rounded-2xl p-4 border border-border-subtle">
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Training Load (ACWR)</p>
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: 'Acute (7d)', value: acute, icon: '⚡' },
          { label: 'Chronic (avg)', value: chronic.toFixed(1), icon: '📊' },
          { label: 'Ratio', value: ratio, icon: '⚖️' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="glass-elevated rounded-xl p-2.5 text-center border border-border-subtle">
            <p className="text-sm">{icon}</p>
            <p className="text-base font-bold font-mono text-text-primary">{value}</p>
            <p className="text-[10px] text-text-muted">{label}</p>
          </div>
        ))}
      </div>
      {rampStatus && (
        <div className="px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: rampStatus.color + '10', border: `1px solid ${rampStatus.color}25` }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: rampStatus.color }} />
          <p className="text-xs font-semibold" style={{ color: rampStatus.color }}>{rampStatus.label}</p>
          <p className="text-xs text-text-muted ml-auto">Ratio {ratio} {isNaN(ratioNum) ? '' : ratioNum >= 0.8 && ratioNum <= 1.3 ? '✓ Target: 0.8–1.3' : '— Target: 0.8–1.3'}</p>
        </div>
      )}
    </div>
  )
}

export default function AthleteMetricsScreen() {
  const athleteMetrics    = useStore((s) => s.athleteMetrics)
  const updateAthleteMetrics = useStore((s) => s.updateAthleteMetrics)
  const addWeightLog      = useStore((s) => s.addWeightLog)
  const history           = useStore((s) => s.history)

  const [editMode, setEditMode]   = useState(false)
  const [formData, setFormData]   = useState({ ...athleteMetrics })
  const [weightInput, setWeightInput] = useState('')
  const [weightNotes, setWeightNotes] = useState('')
  const [weightAdded, setWeightAdded] = useState(false)

  const metrics = athleteMetrics || {}
  const bmi = getBMI(metrics.weight, metrics.height)
  const bmiInfo = bmi ? getBMILabel(bmi) : null

  function saveProfile() {
    updateAthleteMetrics({ ...formData, weight: formData.weight ? Number(formData.weight) : null, height: formData.height ? Number(formData.height) : null, trainingAge: Number(formData.trainingAge) })
    setEditMode(false)
  }

  function logWeight() {
    const w = parseFloat(weightInput)
    if (isNaN(w) || w <= 0) return
    addWeightLog(w, weightNotes)
    updateAthleteMetrics({ weight: w })
    setWeightInput('')
    setWeightNotes('')
    setWeightAdded(true)
    setTimeout(() => setWeightAdded(false), 2000)
  }

  const weightLogs = metrics.weightLogs ?? []
  const latestWeight = weightLogs.at(-1)?.weight ?? metrics.weight

  const sessionCount = history.length
  const analysis7d   = history.filter((h) => Date.now() - new Date(h.date) < 7 * 86400000).length
  const avgScore     = history.length ? Math.round(history.reduce((s, h) => s + (h.overallScore ?? h.mqs ?? 0), 0) / history.length) : null

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <TrendingUp size={22} className="text-accent-primary" /> Athlete Metrics
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Physical profile, body composition, and training load</p>
          </div>
          <button onClick={() => editMode ? saveProfile() : setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Save size={14} />{editMode ? 'Save Profile' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total Sessions', value: sessionCount, icon: '🏋️' },
            { label: 'This Week', value: analysis7d, icon: '📅' },
            { label: 'Avg Score', value: avgScore !== null ? `${avgScore}%` : '—', icon: '📊' },
            { label: 'Weight', value: latestWeight ? `${latestWeight}kg` : '—', icon: '⚖️' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass rounded-xl p-3 border border-border-subtle text-center">
              <p className="text-base">{icon}</p>
              <p className="text-base font-bold font-mono text-text-primary">{value}</p>
              <p className="text-[10px] text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4">
        {/* profile card */}
        <div className="glass rounded-2xl p-5 border border-border-subtle">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Athlete Profile</p>
          {editMode ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: '75' },
                { key: 'height', label: 'Height (cm)', type: 'number', placeholder: '175' },
                { key: 'trainingAge', label: 'Training Age (years)', type: 'number', placeholder: '3' },
                { key: 'position', label: 'Position / Role', type: 'text', placeholder: 'e.g. Midfielder' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">{label}</label>
                  <input type={type} value={formData[key] ?? ''} placeholder={placeholder}
                    onChange={(e) => setFormData((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-text-secondary mb-1">Sport</label>
                <GlassSelect
                  value={formData.sport ?? 'General Fitness'}
                  onChange={(val) => setFormData((f) => ({ ...f, sport: val }))}
                  options={SPORTS}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
              {[
                { label: 'Sport', value: metrics.sport || '—' },
                { label: 'Training Age', value: metrics.trainingAge ? `${metrics.trainingAge} years` : '—' },
                { label: 'Position / Role', value: metrics.position || '—' },
                { label: 'Height', value: metrics.height ? `${metrics.height} cm` : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-text-primary">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BMI card */}
        {(metrics.weight && metrics.height) && (
          <div className="glass rounded-2xl p-5 border border-border-subtle">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Body Composition</p>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-black font-mono" style={{ color: bmiInfo?.color }}>{bmi}</p>
                <p className="text-xs text-text-muted">BMI</p>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: bmiInfo?.color }}>{bmiInfo?.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{metrics.weight}kg · {metrics.height}cm</p>
                <div className="mt-2 h-2 rounded-full bg-bg-elevated overflow-hidden relative">
                  {[
                    { start: 0, width: 18.5, color: '#3b82f6' },
                    { start: 18.5, width: 6.5, color: '#10b981' },
                    { start: 25, width: 5, color: '#f59e0b' },
                    { start: 30, width: 10, color: '#ef4444' },
                  ].map(({ start, width, color }) => (
                    <div key={start} className="absolute h-full" style={{
                      left: `${(start / 40) * 100}%`,
                      width: `${(width / 40) * 100}%`,
                      background: color + '60'
                    }} />
                  ))}
                  <div className="absolute h-full w-0.5 bg-text-primary transition-all"
                    style={{ left: `${Math.min((parseFloat(bmi) / 40) * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-text-muted mt-0.5">
                  <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* weight log */}
        <div className="glass rounded-2xl p-5 border border-border-subtle">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">Weight Log</p>
          <div className="flex gap-2 mb-4">
            <input type="number" value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Weight in kg" step="0.1"
              className="flex-1 px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
            <input value={weightNotes} onChange={(e) => setWeightNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="flex-1 px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
            <button onClick={logWeight}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all hover:scale-105"
              style={{ background: weightAdded ? '#10b981' : 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              {weightAdded ? '✓' : 'Log'}
            </button>
          </div>

          {weightLogs.length >= 2 ? (
            <WeightChart logs={weightLogs} />
          ) : (
            <div className="text-center py-6 text-text-muted">
              <p className="text-2xl mb-1">⚖️</p>
              <p className="text-xs">Log at least 2 weight entries to see your chart</p>
            </div>
          )}

          {weightLogs.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {[...weightLogs].reverse().slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-1.5 border-b border-border-subtle last:border-0">
                  <span className="text-xs text-text-muted w-24 flex-shrink-0">{new Date(l.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-sm font-bold font-mono text-text-primary">{l.weight} kg</span>
                  {l.notes && <span className="text-xs text-text-muted truncate">{l.notes}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* training load */}
        <TrainingLoad history={history} />
      </div>
    </div>
  )
}
