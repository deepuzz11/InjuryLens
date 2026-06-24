import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Plus, CheckCircle, Trash2, X, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { useStore } from '../store'
import GlassSelect from '../components/GlassSelect'

const BODY_PARTS = [
  'Left Knee', 'Right Knee', 'Lower Back', 'Left Hip', 'Right Hip',
  'Left Shoulder', 'Right Shoulder', 'Left Ankle', 'Right Ankle',
  'Left Hamstring', 'Right Hamstring', 'Neck', 'Thoracic Spine', 'Left Quad', 'Right Quad',
  'Left Calf', 'Right Calf', 'Left IT Band', 'Right IT Band', 'Groin',
]

const INJURY_TYPES = [
  'Sprain', 'Strain', 'Tendinopathy', 'Shin Splints', 'IT Band Syndrome',
  'Bursitis', 'Stress Fracture', 'Impingement', 'Dislocation (resolved)', 'General Pain',
  'Tightness / Stiffness', 'Bruising / Contusion', 'Nerve Pain', 'Other',
]

const SEVERITY_LABELS = ['', 'Mild', 'Moderate', 'Significant', 'Severe', 'Cannot Train']
const SEVERITY_COLORS = ['', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444']

const REHAB_RECS = {
  'Left Knee':         ['Terminal knee extensions', 'VMO squats', 'Hip abductor strengthening', 'Quad stretching', 'Step-downs (eccentric)'],
  'Right Knee':        ['Terminal knee extensions', 'VMO squats', 'Hip abductor strengthening', 'Quad stretching', 'Step-downs (eccentric)'],
  'Lower Back':        ['Cat-cow stretching', 'Dead bug exercise', 'Bird dog', 'McGill curl-up', 'Hip flexor release', 'Glute bridges'],
  'Left Hip':          ['Hip 90-90 stretch', 'Clamshells', 'Hip flexor stretching', 'Lateral band walks', 'Fire hydrants'],
  'Right Hip':         ['Hip 90-90 stretch', 'Clamshells', 'Hip flexor stretching', 'Lateral band walks', 'Fire hydrants'],
  'Left Shoulder':     ['Pendulum swings', 'Band external rotation', 'Wall slides', 'Face pulls', 'Doorway stretch'],
  'Right Shoulder':    ['Pendulum swings', 'Band external rotation', 'Wall slides', 'Face pulls', 'Doorway stretch'],
  'Left Ankle':        ['Ankle alphabet (draw A-Z)', 'Calf raises (slow eccentric)', 'Single-leg balance', 'Resistance band dorsiflexion'],
  'Right Ankle':       ['Ankle alphabet (draw A-Z)', 'Calf raises (slow eccentric)', 'Single-leg balance', 'Resistance band dorsiflexion'],
  'Left Hamstring':    ['Prone hamstring curls', 'Nordic curl progressions', 'Romanian deadlift (light)', 'Foam rolling', 'Gentle hamstring stretch'],
  'Right Hamstring':   ['Prone hamstring curls', 'Nordic curl progressions', 'Romanian deadlift (light)', 'Foam rolling', 'Gentle hamstring stretch'],
  'Neck':              ['Chin tucks', 'Neck rotations', 'Shoulder rolls', 'Thoracic extension', 'Upper trap stretch'],
}

const DEFAULT_RECS = ['Rest and ice for first 48-72 hours', 'Gentle range-of-motion exercises', 'See a physiotherapist if pain persists > 1 week', 'Avoid aggravating activities', 'Compression and elevation as needed']

function InjuryCard({ injury, index, onResolve, onDelete, onAddLog }) {
  const [expanded, setExpanded] = useState(false)
  const [logForm, setLogForm] = useState({ painLevel: 3, notes: '' })
  const [showLogForm, setShowLogForm] = useState(false)
  const sevColor = SEVERITY_COLORS[injury.severity] ?? '#f59e0b'
  const daysSince = Math.floor((Date.now() - new Date(injury.dateOccurred).getTime()) / 86400000)
  const recs = REHAB_RECS[injury.bodyPart] ?? DEFAULT_RECS

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className={`glass rounded-2xl overflow-hidden border transition-all duration-200 ${
        injury.resolved ? 'border-success/25 opacity-70' : 'border-border-subtle hover:border-accent-primary/20'
      }`}
    >
      <button onClick={() => setExpanded((v) => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
          style={{ background: injury.resolved ? '#10b981' : sevColor }}>
          {injury.resolved ? '✓' : injury.severity}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-text-primary">{injury.bodyPart}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ color: sevColor, background: `${sevColor}15` }}>
              {injury.resolved ? 'Resolved' : SEVERITY_LABELS[injury.severity]}
            </span>
            <span className="text-xs text-text-muted">{injury.type}</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {daysSince === 0 ? 'Today' : `${daysSince} days ago`} ·
            {injury.healingLogs.length > 0 ? ` ${injury.healingLogs.length} logs` : ' No healing logs yet'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!injury.resolved && (
            <button onClick={(e) => { e.stopPropagation(); onResolve(injury.id) }}
              className="text-xs text-success border border-success/30 rounded-lg px-2 py-1 hover:bg-success/10 transition-colors">
              Resolve
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(injury.id) }}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={15} className="text-text-muted" /> : <ChevronDown size={15} className="text-text-muted" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-border-subtle pt-3 grid gap-4">
              {injury.notes && <p className="text-sm text-text-secondary italic">"{injury.notes}"</p>}

              {/* Rehab recommendations */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Rehabilitation Exercises</p>
                <ul className="space-y-1">
                  {recs.map((r, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <span className="text-accent-primary mt-0.5 flex-shrink-0">→</span>{r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Healing log */}
              {!injury.resolved && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">Healing Log</p>
                    <button onClick={() => setShowLogForm((v) => !v)} className="text-xs text-accent-primary underline">
                      {showLogForm ? 'Cancel' : '+ Add Log'}
                    </button>
                  </div>

                  {showLogForm && (
                    <div className="glass rounded-xl p-3 border border-accent-primary/20 mb-3 grid gap-2">
                      <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1 block">Pain Level (1-10): <span className="text-accent-primary">{logForm.painLevel}</span></label>
                        <input type="range" min={1} max={10} value={logForm.painLevel}
                          onChange={(e) => setLogForm((f) => ({ ...f, painLevel: Number(e.target.value) }))}
                          className="w-full accent-indigo-500" />
                      </div>
                      <textarea value={logForm.notes} onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="How does it feel today?" rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-bg-base text-xs text-text-primary focus:outline-none resize-none" />
                      <button onClick={() => { onAddLog(injury.id, logForm); setShowLogForm(false); setLogForm({ painLevel: 3, notes: '' }) }}
                        className="w-full py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>Save</button>
                    </div>
                  )}

                  {injury.healingLogs.length > 0 ? (
                    <div className="space-y-1.5">
                      {injury.healingLogs.slice(0, 5).map((log) => {
                        const painColor = log.painLevel <= 3 ? '#10b981' : log.painLevel <= 6 ? '#f59e0b' : '#ef4444'
                        return (
                          <div key={log.id} className="flex items-center gap-3 text-xs">
                            <span className="text-text-muted w-24 flex-shrink-0">{new Date(log.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${log.painLevel * 10}%`, background: painColor }} />
                            </div>
                            <span className="font-bold font-mono" style={{ color: painColor }}>{log.painLevel}/10</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">No healing logs yet — track your recovery progress</p>
                  )}
                </div>
              )}

              {injury.resolved && injury.resolvedDate && (
                <p className="text-xs text-success">Resolved on {new Date(injury.resolvedDate).toLocaleDateString()}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const EMPTY_FORM = { bodyPart: 'Left Knee', type: 'Strain', severity: 2, notes: '', dateOccurred: new Date().toISOString().slice(0,10) }

export default function InjuryTrackerScreen() {
  const injuries     = useStore((s) => s.injuries)
  const addInjury    = useStore((s) => s.addInjury)
  const resolveInjury = useStore((s) => s.resolveInjury)
  const deleteInjury = useStore((s) => s.deleteInjury)
  const addHealingLog = useStore((s) => s.addHealingLog)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [tab, setTab]           = useState('active')

  const active   = injuries.filter((i) => !i.resolved)
  const resolved = injuries.filter((i) => i.resolved)
  const shown    = tab === 'active' ? active : resolved

  function handleSubmit(e) {
    e.preventDefault()
    addInjury({ ...form, severity: Number(form.severity), dateOccurred: new Date(form.dateOccurred).toISOString() })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle size={22} className="text-danger" />
              Injury Tracker
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Log, track and rehab injuries in one place</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <Plus size={16} />Log Injury
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Active', value: active.length, color: '#ef4444', icon: '🚨' },
            { label: 'Resolved', value: resolved.length, color: '#10b981', icon: '✅' },
            { label: 'Total', value: injuries.length, color: '#4f46e5', icon: '📋' },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="glass rounded-xl p-3 border border-border-subtle text-center">
              <p className="text-xl">{icon}</p>
              <p className="text-xl font-bold font-mono" style={{ color }}>{value}</p>
              <p className="text-xs text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl bg-bg-elevated w-fit">
        {[['active', `Active (${active.length})`], ['resolved', `Resolved (${resolved.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === k ? 'bg-white text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
            {l}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">{tab === 'active' ? '🏥' : '✅'}</p>
          <p className="text-text-primary font-semibold">{tab === 'active' ? 'No active injuries' : 'No resolved injuries'}</p>
          <p className="text-sm text-text-muted mt-1 mb-4">{tab === 'active' ? 'Great news! Log an injury if you experience pain or discomfort.' : 'Resolved injuries will appear here.'}</p>
          {tab === 'active' && <button onClick={() => setShowForm(true)} className="text-sm text-accent-primary underline">Log an injury</button>}
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {shown.map((inj, i) => (
              <InjuryCard key={inj.id} injury={inj} index={i}
                onResolve={resolveInjury} onDelete={deleteInjury} onAddLog={addHealingLog} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* add injury form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-elevated rounded-2xl p-6 w-full max-w-md border border-border-subtle"
              style={{ boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-text-primary">Log New Injury</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Body Part</label>
                    <GlassSelect
                      value={form.bodyPart}
                      onChange={(val) => setForm((f) => ({ ...f, bodyPart: val }))}
                      options={BODY_PARTS}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Injury Type</label>
                    <GlassSelect
                      value={form.type}
                      onChange={(val) => setForm((f) => ({ ...f, type: val }))}
                      options={INJURY_TYPES}
                    />
                  </div>
                </div>
                <div>
                  <label className="flex justify-between text-xs font-semibold text-text-secondary mb-1">
                    <span>Severity</span>
                    <span style={{ color: SEVERITY_COLORS[form.severity] }}>{SEVERITY_LABELS[form.severity]}</span>
                  </label>
                  <input type="range" min={1} max={5} value={form.severity}
                    onChange={(e) => setForm((f) => ({ ...f, severity: Number(e.target.value) }))}
                    className="w-full accent-red-500" />
                  <div className="flex justify-between text-xs text-text-muted mt-0.5"><span>Mild</span><span>Cannot Train</span></div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Date Occurred</label>
                  <input type="date" value={form.dateOccurred}
                    onChange={(e) => setForm((f) => ({ ...f, dateOccurred: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Notes (optional)</label>
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="How did it happen? Any context..." rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>Log Injury</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
