import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, TrendingDown, TrendingUp, Minus } from 'lucide-react'
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
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.cls}`}>
      <meta.Icon size={12} aria-hidden />
      {level} Risk
    </span>
  )
}

function DeltaChip({ a, b }) {
  const diff = b - a
  if (diff === 0) return <span className="text-xs text-text-muted font-mono">±0</span>
  if (diff < 0) return (
    <span className="flex items-center gap-0.5 text-xs text-success font-mono font-semibold">
      <TrendingDown size={11} />{diff}%
    </span>
  )
  return (
    <span className="flex items-center gap-0.5 text-xs text-danger font-mono font-semibold">
      <TrendingUp size={11} />+{diff}%
    </span>
  )
}

function MetricRow({ label, scoreA, scoreB }) {
  const colorA = scoreA < 30 ? 'text-success' : scoreA < 60 ? 'text-warning' : 'text-danger'
  const colorB = scoreB < 30 ? 'text-success' : scoreB < 60 ? 'text-warning' : 'text-danger'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border-subtle last:border-0">
      <span className="flex-1 text-xs text-text-secondary">{label}</span>
      <span className={`w-14 text-right text-sm font-bold font-mono tabular-nums ${colorA}`}>{scoreA}%</span>
      <DeltaChip a={scoreA} b={scoreB} />
      <span className={`w-14 text-left text-sm font-bold font-mono tabular-nums ${colorB}`}>{scoreB}%</span>
    </div>
  )
}

export default function ComparisonScreen() {
  const compareData = useStore((s) => s.compareData)
  const clearCompare = useStore((s) => s.clearCompare)
  const setScreen   = useStore((s) => s.setScreen)

  if (!compareData || !compareData.second) {
    return (
      <div className="min-h-screen mesh-bg pb-20">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 pt-24 text-center">
          <p className="text-text-secondary">No comparison data selected. Go to History and select two analyses.</p>
          <button
            onClick={() => setScreen('history')}
            className="mt-4 px-5 py-2.5 rounded-xl bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-sm hover:bg-accent-primary/20 transition-all"
          >
            Back to History
          </button>
        </div>
      </div>
    )
  }

  const A = compareData
  const B = compareData.second

  return (
    <div className="min-h-screen mesh-bg pb-20">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => { clearCompare(); setScreen('history') }}
            className="p-2 rounded-xl glass border border-border-subtle text-text-muted hover:text-text-primary transition-all"
          >
            <ArrowLeft size={16} aria-hidden />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Movement Comparison</h1>
            <p className="text-xs text-text-muted">Side-by-side analysis of two sessions</p>
          </div>
        </div>

        {/* Session headers */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[A, B].map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-4 border border-border-subtle"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
                  {i === 0 ? 'Session A' : 'Session B'}
                </span>
                <RiskBadge level={entry.ai_coaching?.overall_risk_level ?? 'Moderate'} />
              </div>
              <p className="text-sm font-semibold text-text-primary mb-1">{entry.movement_type}</p>
              <p className="text-xs text-text-muted">{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              {entry.annotated_frame && (
                <img
                  src={`data:image/png;base64,${entry.annotated_frame}`}
                  alt="Annotated frame"
                  className="w-full rounded-xl mt-3 border border-border-subtle"
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Metrics comparison */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5 border border-border-subtle mb-4"
        >
          <div className="flex items-center justify-between text-xs text-text-muted mb-2 px-1">
            <span className="flex-1 text-right font-semibold text-accent-primary/80">Session A</span>
            <span className="w-16 text-center">Change</span>
            <span className="flex-1 font-semibold text-accent-secondary/80">Session B</span>
          </div>
          <MetricRow label="Overall Risk"    scoreA={A.scores?.overall ?? 0}             scoreB={B.scores?.overall ?? 0}             />
          <MetricRow label="Left Knee"       scoreA={A.scores?.knee_valgus_left ?? 0}    scoreB={B.scores?.knee_valgus_left ?? 0}    />
          <MetricRow label="Right Knee"      scoreA={A.scores?.knee_valgus_right ?? 0}   scoreB={B.scores?.knee_valgus_right ?? 0}   />
          <MetricRow label="Trunk Lean"      scoreA={A.scores?.trunk_lean ?? 0}          scoreB={B.scores?.trunk_lean ?? 0}          />
          <MetricRow label="Asymmetry"       scoreA={A.scores?.asymmetry ?? 0}           scoreB={B.scores?.asymmetry ?? 0}           />
          <MetricRow label="Shoulder Asym."  scoreA={A.scores?.shoulder_asymmetry ?? 0}  scoreB={B.scores?.shoulder_asymmetry ?? 0}  />
          <MetricRow label="Hip Drop"        scoreA={A.scores?.hip_drop ?? 0}            scoreB={B.scores?.hip_drop ?? 0}            />
        </motion.div>

        {/* AI summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[A, B].map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1 }}
              className="glass rounded-2xl p-4 border border-border-subtle"
            >
              <p className="text-xs font-semibold text-accent-primary mb-2">
                {i === 0 ? 'Session A' : 'Session B'} — AI Summary
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {entry.ai_coaching?.overall_summary ?? 'No summary available.'}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
