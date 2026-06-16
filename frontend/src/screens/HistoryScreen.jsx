import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Trash2, ArrowRight, AlertTriangle, CheckCircle,
  XCircle, BarChart3, GitCompareArrows, Dumbbell, ChevronRight,
} from 'lucide-react'
import { useStore } from '../store'
import Navbar from '../components/Navbar'

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

function HistoryCard({ entry, index, onSelect, onDelete, onCompare, isCompareBase }) {
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
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
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
          <div className="flex gap-4 mb-3">
            <ScorePip value={entry.scores?.overall ?? 0}              label="Overall" />
            <ScorePip value={entry.scores?.knee_valgus_left ?? 0}     label="L.Knee"  />
            <ScorePip value={entry.scores?.knee_valgus_right ?? 0}    label="R.Knee"  />
            <ScorePip value={entry.scores?.trunk_lean ?? 0}           label="Trunk"   />
          </div>

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

  const [filter, setFilter] = useState('All')
  const [confirmClear, setConfirmClear] = useState(false)

  const movements = ['All', ...new Set(history.map((h) => h.movement_type))]

  const filtered = filter === 'All'
    ? history
    : history.filter((h) => h.movement_type === filter)

  const handleSelect = (entry) => {
    // Navigate to comparison if compare data set, else view details
    if (compareData && compareData.id !== entry.id) {
      setCompareData({ ...compareData, second: entry })
      setScreen('comparison')
    } else {
      // Show a summary — in future could deep-link to full results
      alert(`Analysis from ${new Date(entry.date).toLocaleDateString()}\nMovement: ${entry.movement_type}\nOverall Risk: ${entry.scores?.overall}% (${entry.ai_coaching?.overall_risk_level})\n\nSummary:\n${entry.ai_coaching?.overall_summary}`)
    }
  }

  const handleCompare = (entry) => {
    if (compareData?.id === entry.id) {
      setCompareData(null)
    } else {
      setCompareData({ ...entry, second: null })
    }
  }

  return (
    <div className="min-h-screen mesh-bg pb-20">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
              <button onClick={() => setCompareData(null)} className="text-xs text-text-muted hover:text-text-primary">
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Movement filter pills */}
        {movements.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
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
            <h2 className="text-lg font-semibold text-text-primary mb-2">No analyses yet</h2>
            <p className="text-sm text-text-secondary mb-6 max-w-xs">
              Upload a video to get your first movement analysis. Results are automatically saved here.
            </p>
            <button
              onClick={() => setScreen('upload')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-semibold hover:brightness-110 transition-all"
            >
              Start Analyzing <ArrowRight size={14} aria-hidden />
            </button>
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
              />
            ))}
          </div>
        </AnimatePresence>
      </div>
    </div>
  )
}
