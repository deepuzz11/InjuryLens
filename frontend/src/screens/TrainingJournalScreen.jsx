import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Trash2, X, ChevronLeft, ChevronRight, Smile, Frown, Meh, Star, Zap } from 'lucide-react'
import { useStore } from '../store'
import GlassSelect from '../components/GlassSelect'

const MOODS = [
  { label: 'Terrible', icon: '😞', value: 1, color: '#ef4444' },
  { label: 'Bad',      icon: '😕', value: 2, color: '#f97316' },
  { label: 'OK',       icon: '😐', value: 3, color: '#f59e0b' },
  { label: 'Good',     icon: '😊', value: 4, color: '#84cc16' },
  { label: 'Amazing',  icon: '🤩', value: 5, color: '#10b981' },
]

const RPE_COLORS = { 1: '#10b981', 2: '#10b981', 3: '#84cc16', 4: '#84cc16', 5: '#f59e0b', 6: '#f59e0b', 7: '#f97316', 8: '#f97316', 9: '#ef4444', 10: '#dc2626' }

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  type: 'Strength',
  duration: 45,
  rpe: 6,
  mood: 4,
  notes: '',
  wins: '',
  improvements: '',
  movements: '',
}

const SESSION_TYPES = ['Strength', 'Cardio', 'HIIT', 'Mobility', 'Sport', 'Recovery / Active Rest', 'Rehab', 'Technique / Skill', 'Other']

function CalendarHeatmap({ entries }) {
  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()
  const days  = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()

  const entryMap = {}
  for (const e of entries) {
    const d = new Date(e.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate()
      if (!entryMap[key] || e.rpe > entryMap[key].rpe) entryMap[key] = e
    }
  }

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let i = 1; i <= days; i++) cells.push(i)

  const monthName = today.toLocaleString('en', { month: 'long' })

  return (
    <div>
      <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">{monthName} {year}</p>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="text-[9px] font-bold text-text-muted py-0.5">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const e = entryMap[day]
          const isToday = day === today.getDate()
          const bg = e ? (RPE_COLORS[Math.round(e.rpe)] || '#4f46e5') + '80' : 'rgba(15,23,42,0.05)'
          return (
            <div key={i} title={e ? `${e.type} — RPE ${e.rpe}` : undefined}
              className={`rounded-md text-[9px] font-semibold flex items-center justify-center aspect-square transition-all ${isToday ? 'ring-1 ring-accent-primary' : ''}`}
              style={{ background: bg, color: e ? '#fff' : 'var(--text-muted)' }}>
              {day}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-[9px] text-text-muted">Low RPE</span>
        {[1,4,7,10].map((r) => (
          <div key={r} className="w-3 h-3 rounded-sm" style={{ background: RPE_COLORS[r] }} />
        ))}
        <span className="text-[9px] text-text-muted">High</span>
      </div>
    </div>
  )
}

function EntryCard({ entry, onDelete }) {
  const mood = MOODS.find((m) => m.value === entry.mood) || MOODS[2]
  const rpeColor = RPE_COLORS[Math.round(entry.rpe)] || '#4f46e5'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }}
      className="glass rounded-xl p-4 border border-border-subtle hover:border-accent-primary/20 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-text-primary">{entry.type}</span>
            <span className="text-xs text-text-muted">{new Date(entry.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-mono font-bold" style={{ color: rpeColor, background: rpeColor + '15' }}>RPE {entry.rpe}</span>
            <span className="text-base" title={mood.label}>{mood.icon}</span>
          </div>
          <div className="flex gap-4 text-xs text-text-muted">
            <span>⏱ {entry.duration} min</span>
            {entry.movements && <span>🏃 {entry.movements}</span>}
          </div>
          {entry.notes && <p className="text-xs text-text-secondary mt-1.5 line-clamp-2">{entry.notes}</p>}
          {(entry.wins || entry.improvements) && (
            <div className="flex gap-3 mt-2">
              {entry.wins && <span className="text-xs text-success">✅ {entry.wins}</span>}
              {entry.improvements && <span className="text-xs text-warning">📈 {entry.improvements}</span>}
            </div>
          )}
        </div>
        <button onClick={() => onDelete(entry.id)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors ml-2 flex-shrink-0">
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  )
}

export default function TrainingJournalScreen() {
  const journalEntries  = useStore((s) => s.journalEntries)
  const addJournalEntry = useStore((s) => s.addJournalEntry)
  const deleteJournalEntry = useStore((s) => s.deleteJournalEntry)

  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [filter, setFilter]       = useState('all')
  const [sortDesc, setSortDesc]   = useState(true)

  const analysisHistory = useStore((s) => s.history)

  const allTypes = ['all', ...Array.from(new Set(journalEntries.map((e) => e.type))).sort()]

  const filtered = useMemo(() => {
    let arr = [...journalEntries]
    if (filter !== 'all') arr = arr.filter((e) => e.type === filter)
    arr.sort((a, b) => sortDesc ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date))
    return arr
  }, [journalEntries, filter, sortDesc])

  const stats = useMemo(() => {
    if (!journalEntries.length) return null
    const last7 = journalEntries.filter((e) => (Date.now() - new Date(e.date)) < 7 * 86400000)
    const avgRpe = last7.reduce((s, e) => s + e.rpe, 0) / (last7.length || 1)
    const totalMins = journalEntries.reduce((s, e) => s + e.duration, 0)
    const avgMood = journalEntries.reduce((s, e) => s + e.mood, 0) / journalEntries.length
    return { sessions: journalEntries.length, last7: last7.length, avgRpe: avgRpe.toFixed(1), totalHours: (totalMins / 60).toFixed(0), avgMood: avgMood.toFixed(1) }
  }, [journalEntries])

  function handleSubmit(e) {
    e.preventDefault()
    addJournalEntry({ ...form, rpe: Number(form.rpe), mood: Number(form.mood), duration: Number(form.duration), date: new Date(form.date).toISOString() })
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <BookOpen size={22} className="text-accent-primary" /> Training Journal
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Log every session, track patterns, reflect</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md hover:scale-105 transition-all"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Plus size={16} />Log Session
          </button>
        </div>

        {/* calendar heatmap */}
        <div className="glass rounded-2xl p-4 border border-border-subtle mt-4">
          <CalendarHeatmap entries={journalEntries} />
        </div>

        {/* stats row */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Total Sessions', value: stats.sessions, icon: '🏋️' },
              { label: 'This Week', value: stats.last7, icon: '📅' },
              { label: 'Avg RPE (7d)', value: stats.avgRpe, icon: '⚡' },
              { label: 'Total Hours', value: stats.totalHours + 'h', icon: '⏱' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass rounded-xl p-3 border border-border-subtle text-center">
                <p className="text-base">{icon}</p>
                <p className="text-base font-bold font-mono text-text-primary">{value}</p>
                <p className="text-[10px] text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* filter + sort */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-xl bg-bg-elevated flex-wrap">
          {allTypes.slice(0, 5).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filter === t ? 'bg-white text-accent-primary shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <button onClick={() => setSortDesc((v) => !v)}
          className="ml-auto text-xs text-text-muted border border-border-subtle rounded-lg px-2 py-1 hover:bg-bg-elevated transition-colors">
          {sortDesc ? '↓ Newest' : '↑ Oldest'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📓</p>
          <p className="text-text-primary font-semibold">No journal entries yet</p>
          <p className="text-sm text-text-muted mt-1 mb-4">Log your first session to start building your training history</p>
          <button onClick={() => setShowForm(true)} className="text-sm text-accent-primary underline">Log first session</button>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filtered.map((e) => <EntryCard key={e.id} entry={e} onDelete={deleteJournalEntry} />)}
          </AnimatePresence>
        </div>
      )}

      {/* form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-elevated rounded-2xl p-6 w-full max-w-md border border-border-subtle my-4"
              style={{ boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-text-primary">Log Training Session</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Date</label>
                    <input type="date" value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
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
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex justify-between text-xs font-semibold text-text-secondary mb-1">
                      <span>Duration</span><span className="text-accent-primary">{form.duration} min</span>
                    </label>
                    <input type="range" min={5} max={180} step={5} value={form.duration}
                      onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                      className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <label className="flex justify-between text-xs font-semibold text-text-secondary mb-1">
                      <span>RPE</span><span style={{ color: RPE_COLORS[form.rpe] }}>{form.rpe}/10</span>
                    </label>
                    <input type="range" min={1} max={10} value={form.rpe}
                      onChange={(e) => setForm((f) => ({ ...f, rpe: e.target.value }))}
                      className="w-full accent-indigo-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Mood</label>
                  <div className="flex gap-2">
                    {MOODS.map((m) => (
                      <button type="button" key={m.value}
                        onClick={() => setForm((f) => ({ ...f, mood: m.value }))}
                        className={`flex-1 py-2 rounded-xl text-lg transition-all ${form.mood === m.value ? 'ring-2 scale-110' : 'opacity-50 hover:opacity-80'}`}
                        style={{ ringColor: m.color, background: form.mood === m.value ? m.color + '20' : 'transparent' }}
                        title={m.label}>
                        {m.icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Movements / Exercises (optional)</label>
                  <input value={form.movements} onChange={(e) => setForm((f) => ({ ...f, movements: e.target.value }))}
                    placeholder="e.g. Squat, Deadlift, Bench..."
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Session Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="How did the session go? Any observations?" rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-success mb-1">✅ Win of the session</label>
                    <input value={form.wins} onChange={(e) => setForm((f) => ({ ...f, wins: e.target.value }))}
                      placeholder="What went well?"
                      className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-success" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-warning mb-1">📈 To improve</label>
                    <input value={form.improvements} onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))}
                      placeholder="What to work on?"
                      className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-warning" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>Save Entry</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
