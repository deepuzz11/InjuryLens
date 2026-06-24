import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Plus, X, CheckCircle, Trash2, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useStore } from '../store'
import GlassSelect from '../components/GlassSelect'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SESSION_TYPES = ['Strength', 'Cardio', 'HIIT', 'Mobility', 'Sport Practice', 'Recovery', 'Rehab', 'Technique', 'Rest Day', 'Other']
const INTENSITY_LABELS = ['', 'Easy', 'Light', 'Moderate', 'Hard', 'Max Effort']
const INTENSITY_COLORS = ['', '#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444']

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  type: 'Strength',
  duration: 60,
  intensity: 3,
  notes: '',
  movements: '',
}

function getWeekDates(anchor) {
  const d = new Date(anchor)
  const dow = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return day
  })
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function isToday(d) {
  return formatDate(d) === formatDate(new Date())
}

function ReadinessBanner({ date }) {
  const recoveryLogs = useStore((s) => s.recoveryLogs)
  const todayLog = recoveryLogs.find((l) => l.date?.slice(0, 10) === date)
  if (!todayLog) return null
  const readiness = Math.round(
    (Math.min(todayLog.sleep / 9, 1) * 40) +
    ((5 - todayLog.soreness) / 4 * 30) +
    (todayLog.energy / 5 * 30)
  )
  const color = readiness >= 70 ? '#10b981' : readiness >= 40 ? '#f59e0b' : '#ef4444'
  const label = readiness >= 70 ? 'Ready' : readiness >= 40 ? 'Caution' : 'Rest recommended'
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span className="text-[9px] font-semibold" style={{ color }}>{label} ({readiness}%)</span>
    </div>
  )
}

export default function SessionPlannerScreen() {
  const plannedSessions      = useStore((s) => s.plannedSessions)
  const addPlannedSession    = useStore((s) => s.addPlannedSession)
  const deletePlannedSession = useStore((s) => s.deletePlannedSession)
  const toggleSessionComplete = useStore((s) => s.toggleSessionComplete)

  const [anchorDate, setAnchorDate] = useState(new Date())
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formDate, setFormDate]     = useState(null)

  const weekDates = useMemo(() => getWeekDates(anchorDate), [anchorDate])

  function prevWeek() { const d = new Date(anchorDate); d.setDate(d.getDate() - 7); setAnchorDate(d) }
  function nextWeek() { const d = new Date(anchorDate); d.setDate(d.getDate() + 7); setAnchorDate(d) }

  function openFormForDate(date) {
    setFormDate(formatDate(date))
    setForm({ ...EMPTY_FORM, date: formatDate(date) })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    addPlannedSession({ ...form, intensity: Number(form.intensity), duration: Number(form.duration), date: new Date(form.date).toISOString() })
    setShowForm(false)
  }

  const sessionsByDate = useMemo(() => {
    const map = {}
    for (const s of plannedSessions) {
      const key = s.date?.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return map
  }, [plannedSessions])

  const completedCount = plannedSessions.filter((s) => s.completed).length
  const totalCount     = plannedSessions.length

  const rangeLabel = (() => {
    const first = weekDates[0]
    const last  = weekDates[6]
    return `${first.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${last.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
  })()

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <CalendarDays size={22} className="text-accent-primary" /> Session Planner
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Plan your week, track completion</p>
          </div>
          <button onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Plus size={16} />Add Session
          </button>
        </div>

        {totalCount > 0 && (
          <div className="glass rounded-xl p-3 border border-border-subtle mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-text-secondary">Overall completion</span>
                <span className="font-bold text-accent-primary">{completedCount}/{totalCount}</span>
              </div>
              <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-700"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* week nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-bg-elevated text-text-muted transition-colors">
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold text-text-primary">{rangeLabel}</p>
        <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-bg-elevated text-text-muted transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((date) => {
          const dateStr   = formatDate(date)
          const sessions  = sessionsByDate[dateStr] ?? []
          const today     = isToday(date)
          const isPast    = date < new Date() && !today
          const allDone   = sessions.length > 0 && sessions.every((s) => s.completed)

          return (
            <div key={dateStr} className={`rounded-2xl p-2 min-h-32 flex flex-col gap-1.5 border transition-all ${
              today ? 'border-accent-primary/40 bg-accent-primary/5' : 'border-border-subtle bg-bg-elevated/30'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-[10px] font-bold uppercase ${today ? 'text-accent-primary' : 'text-text-muted'}`}>{DAY_NAMES[date.getDay()]}</p>
                  <p className={`text-base font-black font-mono leading-none ${today ? 'text-accent-primary' : 'text-text-secondary'}`}>{date.getDate()}</p>
                  <ReadinessBanner date={dateStr} />
                </div>
                <button onClick={() => openFormForDate(date)}
                  className="w-5 h-5 rounded-full flex items-center justify-center bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary transition-colors flex-shrink-0">
                  <Plus size={11} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                {sessions.map((s) => (
                  <div key={s.id} className={`rounded-lg px-1.5 py-1 text-[9px] font-semibold flex flex-col gap-0.5 group cursor-pointer transition-all ${
                    s.completed ? 'opacity-60' : ''
                  }`} style={{ background: INTENSITY_COLORS[s.intensity] + '20', border: `1px solid ${INTENSITY_COLORS[s.intensity]}30` }}>
                    <div className="flex items-center justify-between gap-0.5">
                      <span className="truncate" style={{ color: INTENSITY_COLORS[s.intensity] }}>{s.type}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => toggleSessionComplete(s.id)} title="Toggle complete"
                          className="transition-colors" style={{ color: s.completed ? '#10b981' : 'rgba(15,23,42,0.4)' }}>
                          <CheckCircle size={10} />
                        </button>
                        <button onClick={() => deletePlannedSession(s.id)} className="text-danger/60 hover:text-danger transition-colors">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                    <span className="text-text-muted">{s.duration}min · {INTENSITY_LABELS[s.intensity]}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* upcoming list */}
      <div className="mt-6">
        <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-3">All Planned Sessions</p>
        {plannedSessions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm text-text-muted">No sessions planned yet — click a day or "Add Session"</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {[...plannedSessions].sort((a, b) => new Date(a.date) - new Date(b.date)).map((s) => (
              <div key={s.id} className={`glass rounded-xl p-3 border border-border-subtle flex items-center gap-3 transition-all ${s.completed ? 'opacity-60' : ''}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: INTENSITY_COLORS[s.intensity] + '20' }}>
                  <span className="text-sm" style={{ color: INTENSITY_COLORS[s.intensity] }}>
                    {s.type === 'Rest Day' ? '😴' : s.type === 'Cardio' ? '🏃' : s.type === 'Strength' ? '💪' : '🏋️'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{s.type}</p>
                  <p className="text-xs text-text-muted">{new Date(s.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} · {s.duration} min · {INTENSITY_LABELS[s.intensity]}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.completed && <CheckCircle size={14} className="text-success" />}
                  <button onClick={() => toggleSessionComplete(s.id)}
                    className={`text-xs px-2 py-1 rounded-lg border font-semibold transition-colors ${
                      s.completed ? 'border-success/30 text-success hover:bg-success/10' : 'border-border-subtle text-text-muted hover:bg-bg-elevated'
                    }`}>
                    {s.completed ? 'Done' : 'Mark done'}
                  </button>
                  <button onClick={() => deletePlannedSession(s.id)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-elevated rounded-2xl p-6 w-full max-w-sm border border-border-subtle"
              style={{ boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-text-primary">Plan a Session</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Session Type</label>
                  <GlassSelect
                    value={form.type}
                    onChange={(val) => setForm((f) => ({ ...f, type: val }))}
                    options={SESSION_TYPES}
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs font-semibold text-text-secondary mb-1">
                    <span>Duration</span><span className="text-accent-primary">{form.duration} min</span>
                  </label>
                  <input type="range" min={15} max={180} step={15} value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="flex justify-between text-xs font-semibold text-text-secondary mb-1">
                    <span>Intensity</span>
                    <span style={{ color: INTENSITY_COLORS[form.intensity] }}>{INTENSITY_LABELS[form.intensity]}</span>
                  </label>
                  <input type="range" min={1} max={5} value={form.intensity}
                    onChange={(e) => setForm((f) => ({ ...f, intensity: e.target.value }))}
                    className="w-full accent-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Movements / Focus</label>
                  <input value={form.movements} onChange={(e) => setForm((f) => ({ ...f, movements: e.target.value }))}
                    placeholder="e.g. Squat, RDL..."
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Notes</label>
                  <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Any additional details..."
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>Plan Session</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
