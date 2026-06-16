import React, { useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Target, Brain, Dumbbell, Star, Clock, Share2, Download,
  CheckCircle, AlertTriangle, XCircle, TrendingUp, Eye,
} from 'lucide-react'
import { useStore } from '../store'
import Navbar from '../components/Navbar'
import AnimatedBar from '../components/AnimatedBar'
import Accordion from '../components/Accordion'
import RiskGauge from '../components/RiskGauge'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' },
  }),
}

function Card({ children, className = '', index = 0, ...props }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className={`glass rounded-2xl p-5 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  )
}

function CardTitle({ icon: Icon, children, iconClass = 'text-accent-primary' }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4">
      {Icon && <Icon size={16} className={iconClass} />}
      {children}
    </h3>
  )
}

function RiskBadge({ level }) {
  const map = {
    Low:      { color: 'text-success', bg: 'bg-success/10 border-success/20', Icon: CheckCircle },
    Moderate: { color: 'text-warning', bg: 'bg-warning/10 border-warning/20', Icon: AlertTriangle },
    High:     { color: 'text-danger',  bg: 'bg-danger/10  border-danger/20',  Icon: XCircle },
  }
  const meta = map[level] || map.Moderate
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.bg} ${meta.color}`}>
      <meta.Icon size={12} aria-hidden />
      {level} Risk
    </span>
  )
}

function StatPill({ label, value, unit = '' }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle">
      <span className="font-mono text-base font-bold text-accent-primary">{value}{unit}</span>
      <span className="text-xs text-text-muted mt-0.5 text-center">{label}</span>
    </div>
  )
}

export default function ResultsScreen() {
  const results = useStore((s) => s.results)
  const reset = useStore((s) => s.reset)

  const { movement_type, scores, supplementary, ai_coaching, annotated_frame } = results

  const scoreItems = useMemo(() => [
    {
      label: 'Left Knee Stability',
      subtitle: 'Knee valgus (inward collapse) during loading phase',
      score: scores.knee_valgus_left,
      feedbackKey: 'knee_valgus_left',
    },
    {
      label: 'Right Knee Stability',
      subtitle: 'Knee valgus (inward collapse) during loading phase',
      score: scores.knee_valgus_right,
      feedbackKey: 'knee_valgus_right',
    },
    {
      label: 'Trunk Posture',
      subtitle: 'Forward lean exceeding safe threshold (>25°)',
      score: scores.trunk_lean,
      feedbackKey: 'trunk_lean',
    },
    {
      label: 'Movement Symmetry',
      subtitle: 'Left-right angle difference indicating compensation',
      score: scores.asymmetry,
      feedbackKey: 'asymmetry',
    },
  ], [scores])

  const accordionItems = useMemo(() =>
    scoreItems.map((item) => ({
      title: item.label,
      content: ai_coaching.individual_feedback[item.feedbackKey],
    })), [scoreItems, ai_coaching])

  const overallLevel = ai_coaching.overall_risk_level
  const overallBg = {
    Low:      'bg-success/5 border-success/15',
    Moderate: 'bg-warning/5 border-warning/15',
    High:     'bg-danger/5  border-danger/15',
  }[overallLevel] || 'bg-warning/5 border-warning/15'

  const handleCopyLink = useCallback(() => {
    try {
      const encoded = btoa(JSON.stringify(results)).replace(/[+/=]/g, (c) =>
        ({ '+': '-', '/': '_', '=': '' }[c])
      )
      const url = `${window.location.origin}${window.location.pathname}?r=${encoded}`
      navigator.clipboard.writeText(url)
        .then(() => alert('Report link copied to clipboard!'))
        .catch(() => alert('Could not copy link — please copy the URL manually.'))
    } catch {
      alert('Could not encode report for sharing.')
    }
  }, [results])

  const handleDownload = useCallback(() => {
    const { overall_risk_level, overall_summary, priority_issue, coaching_cues,
            exercise_prescription, positive_observation, follow_up_timeline } = ai_coaching
    const lines = [
      '=== InjuryLens Movement Analysis Report ===',
      `Movement: ${movement_type}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      '--- RISK SCORES ---',
      `Overall Risk:      ${scores.overall}% (${overall_risk_level})`,
      `Left Knee:         ${scores.knee_valgus_left}%`,
      `Right Knee:        ${scores.knee_valgus_right}%`,
      `Trunk Lean:        ${scores.trunk_lean}%`,
      `Asymmetry:         ${scores.asymmetry}%`,
      '',
      '--- SUPPLEMENTARY ---',
      `Avg Left Knee Angle:  ${supplementary.avg_left_knee_angle}°`,
      `Avg Right Knee Angle: ${supplementary.avg_right_knee_angle}°`,
      `Avg Trunk Lean:       ${supplementary.avg_trunk_lean_angle}°`,
      `Frames Analyzed:      ${supplementary.total_frames_analyzed}`,
      '',
      '--- AI COACHING ---',
      `Summary: ${overall_summary}`,
      '',
      `Priority Issue: ${priority_issue}`,
      '',
      'Movement Cues:',
      ...coaching_cues.map((c, i) => `  ${i + 1}. ${c}`),
      '',
      'Exercise Prescription:',
      ...exercise_prescription.map((e) => `  • ${e.name} — ${e.sets_reps}\n    Why: ${e.why}`),
      '',
      `What You're Doing Well: ${positive_observation}`,
      '',
      `Follow-up Timeline: ${follow_up_timeline}`,
      '',
      '--- DISCLAIMER ---',
      'Consult a physiotherapist before starting any new exercise program.',
      'InjuryLens is an AI-assisted tool and does not replace professional medical advice.',
      '',
      'Generated by InjuryLens · PhysTech 2026',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `InjuryLens_Report_${movement_type.replace(/\s/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [results, movement_type, scores, supplementary, ai_coaching])

  return (
    <div className="min-h-screen mesh-bg pb-20">
      <Navbar />

      {/* Sticky results header */}
      <div className="sticky top-16 z-40 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium text-text-secondary hidden sm:block">Analysis:</span>
            <span className="text-sm font-semibold text-text-primary truncate">{movement_type}</span>
            <RiskBadge level={overallLevel} />
          </div>
          <button
            onClick={reset}
            className="flex-shrink-0 text-sm bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 px-4 py-1.5 rounded-lg transition-all duration-200"
          >
            Analyze Another Video
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ─── LEFT COLUMN ─── */}
          <div className="flex flex-col gap-5">

            {/* Annotated Frame */}
            <Card index={0}>
              <CardTitle icon={Eye}>Key Frame Analysis</CardTitle>
              <div className="rounded-xl overflow-hidden border border-border-subtle relative group">
                <img
                  src={`data:image/png;base64,${annotated_frame}`}
                  alt="Annotated movement frame showing skeleton overlay and risk scores"
                  className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6366f1' }} />
                  Joints (indigo)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2 rounded" style={{ background: 'rgba(255,255,255,0.5)' }} />
                  Skeleton connections
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success" />
                  Low risk ≤30%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                  Moderate 31–60%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger" />
                  High risk &gt;60%
                </span>
              </div>
            </Card>

            {/* Supplementary stats */}
            <Card index={1}>
              <CardTitle icon={TrendingUp}>Movement Statistics</CardTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatPill label="Avg Left Knee" value={supplementary.avg_left_knee_angle} unit="°" />
                <StatPill label="Avg Right Knee" value={supplementary.avg_right_knee_angle} unit="°" />
                <StatPill label="Avg Trunk Lean" value={supplementary.avg_trunk_lean_angle} unit="°" />
                <StatPill label="Frames Analyzed" value={supplementary.total_frames_analyzed} />
                <StatPill label="Overall Score" value={scores.overall} unit="%" />
              </div>
            </Card>

            {/* Risk Score Panel */}
            <Card index={2}>
              <CardTitle icon={Target}>Biomechanical Risk Scores</CardTitle>
              <div className="flex flex-col gap-5">
                {scoreItems.map((item, i) => (
                  <AnimatedBar
                    key={item.label}
                    label={item.label}
                    subtitle={item.subtitle}
                    score={item.score}
                    delay={i * 0.12}
                  />
                ))}
              </div>
            </Card>

            {/* Feedback Accordion */}
            <Card index={3}>
              <CardTitle icon={Brain}>Individual Check Feedback</CardTitle>
              <Accordion items={accordionItems} />
            </Card>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="flex flex-col gap-5">

            {/* Overall Risk Banner */}
            <Card index={0} className={`border ${overallBg}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <RiskBadge level={overallLevel} />
                    <span className="text-xs text-text-muted font-mono">Score: {scores.overall}/100</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {ai_coaching.overall_summary}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <RiskGauge score={scores.overall} />
                </div>
              </div>
            </Card>

            {/* Priority Issue */}
            <Card index={1} className="border-l-4 border-l-warning relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ background: '#f59e0b', animation: 'pulseDot 2s ease-in-out infinite' }}
              />
              <CardTitle icon={Target} iconClass="text-warning">Focus On This First</CardTitle>
              <p className="text-sm text-text-primary leading-relaxed">{ai_coaching.priority_issue}</p>
            </Card>

            {/* Coaching Cues */}
            <Card index={2}>
              <CardTitle icon={Brain}>Movement Cues</CardTitle>
              <div className="flex flex-col gap-3">
                {ai_coaching.coaching_cues.map((cue, i) => (
                  <div
                    key={i}
                    className="flex gap-3 items-start p-3 rounded-xl bg-accent-glow border border-accent-primary/10"
                  >
                    <span className="w-6 h-6 rounded-lg bg-accent-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-text-secondary leading-relaxed">{cue}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Exercise Prescription */}
            <Card index={3}>
              <CardTitle icon={Dumbbell}>Your Recovery &amp; Prevention Plan</CardTitle>
              <div className="flex flex-col divide-y divide-border-subtle">
                {ai_coaching.exercise_prescription.map((ex, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${i > 0 ? 'pt-4' : ''} ${i < ai_coaching.exercise_prescription.length - 1 ? 'pb-4' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-text-primary">{ex.name}</span>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/20 flex-shrink-0">
                        {ex.sets_reps}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted italic">{ex.why}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-text-muted border-t border-border-subtle pt-3">
                Consult a physiotherapist before starting any new exercise program.
              </p>
            </Card>

            {/* Positive Observation */}
            <Card index={4} className="border-l-4 border-l-success bg-success/5">
              <CardTitle icon={Star} iconClass="text-success">What You're Doing Well</CardTitle>
              <p className="text-sm text-text-secondary leading-relaxed">
                {ai_coaching.positive_observation}
              </p>
            </Card>

            {/* Timeline */}
            <Card index={5}>
              <CardTitle icon={Clock} iconClass="text-text-muted">Follow-up Timeline</CardTitle>
              <p className="text-sm text-text-secondary leading-relaxed">
                {ai_coaching.follow_up_timeline}
              </p>
            </Card>

            {/* Share / Export */}
            <Card index={6}>
              <CardTitle icon={Share2}>Share &amp; Export</CardTitle>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border border-border-accent text-accent-primary hover:bg-accent-glow transition-all duration-200"
                  aria-label="Copy shareable report link"
                >
                  <Share2 size={14} />
                  Copy Link
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-accent transition-all duration-200"
                  aria-label="Download report as text file"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
