import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Trash2, ArrowRight, AlertTriangle, CheckCircle,
  XCircle, BarChart3, GitCompareArrows, Dumbbell, ChevronRight,
  StickyNote, X, Tag, Search,
} from 'lucide-react'
import { useStore } from '../store'

function RiskBadge({ level }) {
  const map = {
    Low:      { cls: 'text-success bg-success/10 border-success/20',  Icon: CheckCircle   },
    Moderate: { cls: 'text-warning bg-warning/10 border-warning/20',  Icon: AlertTriangle },
    High:     { cls: 'text-danger  bg-danger/10  border-danger/20',   Icon: XCircle       },
  }
  const meta = map[level] ?? map.Moderate
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.cls}`}>
      <meta.Icon size={10} aria-hidden />
      {level}
    </span>
  )
}

function ScorePip({ value, label }) {
  const color = value < 30 ? 'text-success' : value < 60 ? 'text-warning' : 'text-danger'
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-bold font-mono tabular-nums ${color}`}>{value}%</span>
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  )
}

const PAIN_LEVELS = [
  { v: 0, label: 'None', color: '#10b981' },
  { v: 1, label: 'Mild', color: '#84cc16' },
  { v: 2, label: 'Moderate', color: '#f59e0b' },
  { v: 3, label: 'High', color: '#f97316' },
  { v: 4, label: 'Severe', color: '#ef4444' },
]

const PRESET_TAGS = ['Fatigued', 'Fresh', 'Post-Workout', 'Pre-Competition', 'Rehab', 'Testing', 'Heavy Day', 'Light Day', 'Personal Best', 'Struggled']

function NoteModal({ entry, noteData, onSave, onClose }) {
  const [note, setNote]     = useState(noteData?.note ?? '')
  const [tags, setTags]     = useState(noteData?.tags ?? [])
  const [pain, setPain]     = useState(noteData?.painLevel ?? 0)
  const [customTag, setCustomTag] = useState('')

  function toggleTag(tag) {
    setTags((t) => t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag])
  }

  function addCustomTag() {
    const t = customTag.trim()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setCustomTag('')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-elevated rounded-2xl p-5 w-full max-w-md border border-border-subtle"
        style={{ boxShadow: '0 24px 64px rgba(15,23,42,0.18)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Session Notes</h2>
            <p className="text-xs text-text-muted">{entry.movement_type} · {new Date(entry.date).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted"><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-4">
          {/* pain level */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Pain / Discomfort Level</label>
            <div className="flex gap-2">
              {PAIN_LEVELS.map(({ v, label, color }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPain(v)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    pain === v ? 'border-2' : 'border-border-subtle text-text-muted hover:border-text-muted'
                  }`}
                  style={pain === v ? { borderColor: color, color, background: `${color}12` } : {}}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* tags */}
          <div>
            <label className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1">
              <Tag size={11} /> Session Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                    tags.includes(t)
                      ? 'bg-accent-primary/15 border-accent-primary/40 text-accent-primary font-semibold'
                      : 'border-border-subtle text-text-muted hover:border-accent-primary/30'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                placeholder="Add custom tag..."
                className="flex-1 px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-base text-xs text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <button type="button" onClick={addCustomTag}
                className="px-3 py-1.5 rounded-lg border border-accent-primary/30 text-accent-primary text-xs hover:bg-accent-primary/10 transition-colors">
                Add
              </button>
            </div>
          </div>

          {/* note */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Personal Notes</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did this session feel? Any pain, observations, or context..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-border-subtle text-sm text-text-muted hover:bg-bg-elevated transition-colors">Cancel</button>
            <button
              type="button"
              onClick={() => onSave({ note, tags, painLevel: pain })}
              className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function HistoryCard({ entry, index, onSelect, onDelete, onCompare, isCompareBase, noteData, onNoteClick }) {
  const date = new Date(entry.date)
  const timeAgo = (() => {
    const diff = Date.now() - date.getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    return d === 1 ? 'yesterday' : `${d}d ago`
  })()

  const painData = noteData?.painLevel != null ? PAIN_LEVELS[noteData.painLevel] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className={`glass rounded-2xl overflow-hidden hover:border-accent-primary/30 border transition-all duration-200 ${
        isCompareBase ? 'border-accent-primary/50 ring-1 ring-accent-primary/30' : 'border-border-subtle'
      }`}
    >
      <div className="flex gap-0">
        {/* Thumbnail */}
        {entry.annotated_frame && (
          <div className="w-24 sm:w-32 flex-shrink-0 relative overflow-hidden bg-bg-elevated">
            <img
              src={`data:image/png;base64,${entry.annotated_frame}`}
              alt={`${entry.movement_type} analysis`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-text-primary">{entry.movement_type}</span>
              <RiskBadge level={entry.ai_coaching?.overall_risk_level ?? 'Moderate'} />
              {isCompareBase && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                  Compare A
                </span>
              )}
              {noteData?.painLevel != null && noteData.painLevel > 0 && painData && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: painData.color, background: `${painData.color}15` }}>
                  Pain: {painData.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onNoteClick(entry)}
                title="Add session note"
                className={`p-1.5 rounded-lg transition-all duration-150 ${
                  noteData?.note || noteData?.tags?.length > 0
                    ? 'text-accent-primary bg-accent-primary/10'
                    : 'text-text-muted hover:text-accent-primary hover:bg-accent-glow'
                }`}
              >
                <StickyNote size={13} aria-hidden />
              </button>
              <button
                onClick={() => onCompare(entry)}
                title="Set as comparison baseline"
                className="p-1.5 rounded-lg text-text-muted hover:text-accent-primary hover:bg-accent-glow transition-all duration-150"
              >
                <GitCompareArrows size={13} aria-hidden />
              </button>
              <button
                onClick={() => onDelete(entry.id)}
                title="Delete analysis"
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all duration-150"
              >
                <Trash2 size={13} aria-hidden />
              </button>
            </div>
          </div>

          {/* Score pips */}
          <div className="flex gap-4 mb-2">
            <ScorePip value={entry.scores?.overall ?? 0}              label="Overall" />
            <ScorePip value={entry.scores?.knee_valgus_left ?? 0}     label="L.Knee"  />
            <ScorePip value={entry.scores?.knee_valgus_right ?? 0}    label="R.Knee"  />
            <ScorePip value={entry.scores?.trunk_lean ?? 0}           label="Trunk"   />
          </div>

          {/* Tags */}
          {noteData?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {noteData.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-primary/8 text-accent-primary border border-accent-primary/20 font-medium">
                  #{tag}
                </span>
              ))}
              {noteData.tags.length > 4 && (
                <span className="text-[10px] text-text-muted">+{noteData.tags.length - 4}</span>
              )}
            </div>
          )}

          {/* Note preview */}
          {noteData?.note && (
            <p className="text-xs text-text-muted mb-2 italic line-clamp-1">"{noteData.note}"</p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock size={10} aria-hidden />
              {timeAgo} · {entry.supplementary?.total_frames_analyzed ?? 0} frames
              {(entry.supplementary?.rep_count ?? 0) > 0 && ` · ${entry.supplementary.rep_count} reps`}
            </span>
            <button
              onClick={() => onSelect(entry)}
              className="flex items-center gap-1 text-xs text-accent-primary hover:text-accent-secondary transition-colors"
            >
              View <ChevronRight size={12} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function HistoryScreen() {
  const history       = useStore((s) => s.history)
  const compareData   = useStore((s) => s.compareData)
  const setCompareData = useStore((s) => s.setCompareData)
  const removeFromHistory = useStore((s) => s.removeFromHistory)
  const clearHistory  = useStore((s) => s.clearHistory)
  const setScreen     = useStore((s) => s.setScreen)
  const setResults    = useStore((s) => s.setResults)
  const sessionNotes  = useStore((s) => s.sessionNotes)
  const updateSessionNote = useStore((s) => s.updateSessionNote)

  const [filter, setFilter]       = useState('All')
  const [confirmClear, setConfirmClear] = useState(false)
  const [noteEntry, setNoteEntry] = useState(null)
  const [search, setSearch]       = useState('')
  const [riskFilter, setRiskFilter] = useState('All')

  const movements = ['All', ...new Set(history.map((h) => h.movement_type))]

  const filtered = useMemo(() => {
    return history.filter((h) => {
      const matchMove = filter === 'All' || h.movement_type === filter
      const matchRisk = riskFilter === 'All' || h.ai_coaching?.overall_risk_level === riskFilter
      const matchSearch = !search || h.movement_type.toLowerCase().includes(search.toLowerCase()) ||
        sessionNotes[h.id]?.note?.toLowerCase().includes(search.toLowerCase()) ||
        sessionNotes[h.id]?.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      return matchMove && matchRisk && matchSearch
    })
  }, [history, filter, riskFilter, search, sessionNotes])

  const handleSelect = (entry) => {
    if (compareData && compareData.id !== entry.id) {
      setCompareData({ ...compareData, second: entry })
      setScreen('comparison')
    } else {
      setResults({ ...entry, analysis_id: entry.id })
    }
  }

  const handleCompare = (entry) => {
    if (compareData?.id === entry.id) {
      setCompareData(null)
    } else {
      setCompareData({ ...entry, second: null })
    }
  }

  function handleSaveNote(noteData) {
    if (noteEntry) {
      updateSessionNote(noteEntry.id, noteData)
      setNoteEntry(null)
    }
  }

  return (
    <div className="min-h-screen mesh-bg pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Analysis History</h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {history.length} saved{history.length === 1 ? ' analysis' : ' analyses'} · stored locally
            </p>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <>
                <button
                  onClick={() => setScreen('dashboard')}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl glass border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-accent transition-all"
                >
                  <BarChart3 size={14} aria-hidden />
                  Progress
                </button>
                {!confirmClear ? (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl glass border border-border-subtle text-text-muted hover:text-danger hover:border-danger/30 transition-all"
                  >
                    <Trash2 size={14} aria-hidden />
                    Clear All
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { clearHistory(); setConfirmClear(false) }}
                      className="text-sm px-3 py-2 rounded-xl bg-danger/20 border border-danger/30 text-danger hover:bg-danger/30 transition-all"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="text-sm px-3 py-2 rounded-xl glass border border-border-subtle text-text-muted hover:text-text-primary transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search + filters */}
        {history.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search notes or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            >
              {['All', 'Low', 'Moderate', 'High'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        )}

        {/* Compare banner */}
        <AnimatePresence>
          {compareData && !compareData.second && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-between"
            >
              <p className="text-sm text-accent-primary">
                <span className="font-semibold">Compare mode:</span> Select a second analysis to compare with {compareData.movement_type}
              </p>
              <button onClick={() => setCompareData(null)} className="text-xs text-text-muted hover:text-text-primary">Cancel</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Movement filter pills */}
        {movements.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {movements.map((m) => (
              <button
                key={m}
                onClick={() => setFilter(m)}
                className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all duration-150 ${
                  filter === m
                    ? 'bg-accent-primary text-white'
                    : 'glass border border-border-subtle text-text-secondary hover:text-text-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-glow flex items-center justify-center mb-4">
              <Dumbbell size={28} className="text-accent-secondary" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              {history.length === 0 ? 'No analyses yet' : 'No matches found'}
            </h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xs">
              {history.length === 0
                ? 'Upload a video to get your first movement analysis. Results are automatically saved here.'
                : 'Try adjusting your filters or search term.'}
            </p>
            {history.length === 0 && (
              <button
                onClick={() => setScreen('upload')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-semibold hover:brightness-110 transition-all"
              >
                Start Analyzing <ArrowRight size={14} aria-hidden />
              </button>
            )}
          </div>
        )}

        {/* Cards list */}
        <AnimatePresence>
          <div className="flex flex-col gap-3">
            {filtered.map((entry, i) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                index={i}
                onSelect={handleSelect}
                onDelete={removeFromHistory}
                onCompare={handleCompare}
                isCompareBase={compareData?.id === entry.id}
                noteData={sessionNotes[entry.id]}
                onNoteClick={setNoteEntry}
              />
            ))}
          </div>
        </AnimatePresence>
      </div>

      {/* Note modal */}
      <AnimatePresence>
        {noteEntry && (
          <NoteModal
            entry={noteEntry}
            noteData={sessionNotes[noteEntry.id]}
            onSave={handleSaveNote}
            onClose={() => setNoteEntry(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
