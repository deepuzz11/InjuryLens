import React, { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Brain, Dumbbell, Star, Clock, Share2, Download,
  CheckCircle, AlertTriangle, XCircle, TrendingUp, Eye,
  Activity, Zap, RotateCcw, ChevronLeft, ChevronRight,
  Heart, Calendar, Sunrise, GitCompareArrows, Bookmark,
  BookmarkCheck,
} from 'lucide-react'
import { useStore } from '../store'
import Navbar from '../components/Navbar'
import AnimatedBar from '../components/AnimatedBar'
import Accordion from '../components/Accordion'
import RiskGauge from '../components/RiskGauge'
import BodyMap from '../components/BodyMap'
import TimelineChart from '../components/TimelineChart'
import { downloadTextReport } from '../api'

// ─── Shared primitives ───────────────────────────────────────────────────────
const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' } }),
}

function Card({ children, className = '', index = 0 }) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={cardVariants}
      className={`glass rounded-2xl p-5 ${className}`}>
      {children}
    </motion.div>
  )
}

function CardTitle({ icon: Icon, children, iconClass = 'text-accent-primary' }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4">
      {Icon && <Icon size={16} className={iconClass} aria-hidden />}
      {children}
    </h3>
  )
}

function RiskBadge({ level }) {
  const map = {
    Low:      { cls: 'text-success bg-success/10 border-success/20',  Icon: CheckCircle  },
    Moderate: { cls: 'text-warning bg-warning/10 border-warning/20',  Icon: AlertTriangle },
    High:     { cls: 'text-danger  bg-danger/10  border-danger/20',   Icon: XCircle      },
  }
  const meta = map[level] ?? map.Moderate
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.cls}`}>
      <meta.Icon size={12} aria-hidden />{level} Risk
    </span>
  )
}

function StatPill({ label, value, unit = '' }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5 rounded-xl bg-bg-elevated border border-border-subtle">
      <span className="font-mono text-base font-bold text-accent-primary tabular-nums">{value}{unit}</span>
      <span className="text-xs text-text-muted mt-0.5 text-center leading-tight">{label}</span>
    </div>
  )
}

// ─── Frame gallery (worst / best / middle) ───────────────────────────────────
function FrameGallery({ annotated_frame, annotated_frames }) {
  const frames = useMemo(() => {
    if (!annotated_frames) return [{ label: 'Worst Frame', src: annotated_frame }]
    return [
      { label: 'Worst Frame',  src: annotated_frames.worst  },
      { label: 'Best Frame',   src: annotated_frames.best   },
      { label: 'Middle Frame', src: annotated_frames.middle },
    ].filter((f) => f.src)
  }, [annotated_frame, annotated_frames])

  const [idx, setIdx] = useState(0)
  const prev = () => setIdx((i) => (i - 1 + frames.length) % frames.length)
  const next = () => setIdx((i) => (i + 1) % frames.length)

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden border border-border-subtle group">
        <AnimatePresence mode="wait">
          <motion.img
            key={idx}
            src={`data:image/png;base64,${frames[idx].src}`}
            alt={frames[idx].label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full object-cover"
          />
        </AnimatePresence>

        {frames.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-all">
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {frames.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`} />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white/80">
          {frames[idx].label}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
        {[
          { color: '#6366f1', label: 'Joints' },
          { color: 'rgba(255,255,255,0.5)', label: 'Skeleton', pill: true },
          { color: '#22c55e', label: 'Low ≤30%' },
          { color: '#f59e0b', label: 'Mod. 31–60%' },
          { color: '#ef4444', label: 'High >60%' },
        ].map(({ color, label, pill }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 flex-shrink-0 ${pill ? 'h-2 rounded' : 'h-2.5 rounded-full'}`} style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main results screen ─────────────────────────────────────────────────────
export default function ResultsScreen() {
  const results   = useStore((s) => s.results)
  const reset     = useStore((s) => s.reset)
  const settings  = useStore((s) => s.settings)
  const history   = useStore((s) => s.history)
  const setScreen  = useStore((s) => s.setScreen)
  const setCompareData = useStore((s) => s.setCompareData)
  const saveCurrentToHistory = useStore((s) => s.saveCurrentToHistory)

  const [saved, setSaved] = useState(() =>
    history.some((h) => h.id === results?.analysis_id)
  )

  const {
    movement_type, scores, supplementary, ai_coaching,
    annotated_frame, annotated_frames, frame_timeline,
  } = results

  const overallLevel = ai_coaching?.overall_risk_level ?? 'Moderate'

  const scoreItems = useMemo(() => [
    { label: 'Left Knee Stability',  subtitle: 'Knee valgus (inward collapse)',      score: scores?.knee_valgus_left   ?? 0, feedbackKey: 'knee_valgus_left'   },
    { label: 'Right Knee Stability', subtitle: 'Knee valgus (inward collapse)',      score: scores?.knee_valgus_right  ?? 0, feedbackKey: 'knee_valgus_right'  },
    { label: 'Trunk Posture',        subtitle: 'Forward lean exceeding threshold',   score: scores?.trunk_lean         ?? 0, feedbackKey: 'trunk_lean'         },
    { label: 'Movement Symmetry',    subtitle: 'Left-right knee angle difference',   score: scores?.asymmetry          ?? 0, feedbackKey: 'asymmetry'          },
    { label: 'Shoulder Balance',     subtitle: 'Shoulder height asymmetry',          score: scores?.shoulder_asymmetry ?? 0, feedbackKey: 'shoulder_asymmetry' },
    { label: 'Hip Stability',        subtitle: 'Lateral pelvic tilt / hip drop',     score: scores?.hip_drop           ?? 0, feedbackKey: 'hip_drop'           },
  ], [scores])

  const accordionItems = useMemo(() =>
    scoreItems.map((item) => ({
      title:   item.label,
      content: ai_coaching?.individual_feedback?.[item.feedbackKey] ?? '',
      score:   item.score,
    }))
  , [scoreItems, ai_coaching])

  const overallBg = {
    Low:      'bg-success/5 border-success/15',
    Moderate: 'bg-warning/5 border-warning/15',
    High:     'bg-danger/5  border-danger/15',
  }[overallLevel] ?? 'bg-warning/5 border-warning/15'

  const fatigueScore  = supplementary?.fatigue_score ?? 0
  const repCount      = supplementary?.rep_count ?? 0
  const fatigueColor  = fatigueScore < 20 ? 'text-success' : fatigueScore < 50 ? 'text-warning' : 'text-danger'
  const fatigueLabel  = fatigueScore < 20 ? 'Minimal' : fatigueScore < 50 ? 'Moderate' : 'Significant'

  const handleCopyLink = useCallback(() => {
    try {
      const encoded = btoa(encodeURIComponent(JSON.stringify({
        movement_type,
        scores,
        ai_coaching: {
          overall_risk_level: ai_coaching?.overall_risk_level,
          overall_summary:    ai_coaching?.overall_summary,
        },
      }))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
      const url = `${window.location.origin}${window.location.pathname}?r=${encoded}`
      navigator.clipboard.writeText(url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Could not copy — copy the URL from your address bar.'))
    } catch {
      alert('Could not encode report for sharing.')
    }
  }, [results])

  const handleSave = () => {
    saveCurrentToHistory()
    setSaved(true)
  }

  const handleCompare = () => {
    setCompareData({ ...history[0], second: null })
    setScreen('history')
  }

  return (
    <div className="min-h-screen mesh-bg pb-20">
      <Navbar />

      {/* Sticky sub-header */}
      <div className="sticky top-16 z-40 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-text-secondary hidden sm:block">Analysis:</span>
            <span className="text-sm font-semibold text-text-primary truncate">{movement_type}</span>
            <RiskBadge level={overallLevel} />
            {repCount > 0 && (
              <span className="text-xs text-text-muted hidden sm:inline font-mono">{repCount} reps</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {history.length > 0 && (
              <button
                onClick={handleCompare}
                className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg glass border border-border-subtle text-text-secondary hover:text-accent-primary hover:border-accent-primary/30 transition-all"
              >
                <GitCompareArrows size={12} />Compare
              </button>
            )}
            <button
              onClick={saved ? undefined : handleSave}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                saved
                  ? 'glass border-success/30 text-success cursor-default'
                  : 'glass border-border-subtle text-text-secondary hover:text-accent-primary hover:border-accent-primary/30'
              }`}
            >
              {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={reset}
              className="text-sm bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 px-4 py-1.5 rounded-lg transition-all duration-200"
            >
              New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ─── LEFT COLUMN ─── */}
          <div className="flex flex-col gap-5">

            {/* Frame gallery */}
            <Card index={0}>
              <CardTitle icon={Eye}>Key Frame Analysis</CardTitle>
              <FrameGallery annotated_frame={annotated_frame} annotated_frames={annotated_frames} />
            </Card>

            {/* Stats + Body map side by side */}
            <Card index={1}>
              <CardTitle icon={TrendingUp}>Movement Statistics</CardTitle>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <StatPill label="Avg Left Knee"   value={supplementary?.avg_left_knee_angle}  unit="°" />
                    <StatPill label="Avg Right Knee"  value={supplementary?.avg_right_knee_angle} unit="°" />
                    <StatPill label="Avg Trunk Lean"  value={supplementary?.avg_trunk_lean_angle} unit="°" />
                    <StatPill label="Frames Analyzed" value={supplementary?.total_frames_analyzed}         />
                    <StatPill label="Overall Score"   value={scores?.overall}                     unit="%" />
                    <StatPill label="Duration"        value={supplementary?.video_duration_seconds ? `${supplementary.video_duration_seconds}s` : '—'} />
                  </div>
                </div>
                {settings.showBodyMap && (
                  <div className="flex-shrink-0">
                    <BodyMap scores={scores} />
                  </div>
                )}
              </div>
            </Card>

            {/* Rep count & fatigue */}
            {(repCount > 0 || fatigueScore > 0) && (
              <Card index={2}>
                <CardTitle icon={Activity}>Rep Count &amp; Fatigue</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-bg-elevated border border-border-subtle">
                    <span className="text-xs text-text-muted">Repetitions Detected</span>
                    <span className="text-2xl font-bold font-mono text-accent-primary tabular-nums">
                      {repCount > 0 ? repCount : '—'}
                    </span>
                    <span className="text-xs text-text-muted">counted from angle oscillations</span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-bg-elevated border border-border-subtle">
                    <span className="text-xs text-text-muted">Fatigue Score</span>
                    <span className={`text-2xl font-bold font-mono tabular-nums ${fatigueColor}`}>
                      {fatigueScore}%
                    </span>
                    <span className={`text-xs font-medium ${fatigueColor}`}>{fatigueLabel} form degradation</span>
                  </div>
                </div>
                {fatigueScore >= 20 && (
                  <p className="mt-3 text-xs text-text-muted leading-relaxed border-t border-border-subtle pt-3">
                    Form quality in the second half of your session was notably worse than the first half.
                    Consider reducing volume until technique is consistent throughout.
                  </p>
                )}
              </Card>
            )}

            {/* Angle timeline chart */}
            {settings.showTimeline && frame_timeline?.length > 0 && (
              <Card index={3}>
                <CardTitle icon={Activity}>Joint Angle Timeline</CardTitle>
                <TimelineChart data={frame_timeline} />
              </Card>
            )}

            {/* Risk score bars */}
            <Card index={4}>
              <CardTitle icon={Target}>Biomechanical Risk Scores</CardTitle>
              <div className="flex flex-col gap-5">
                {scoreItems.map((item, i) => (
                  <AnimatedBar
                    key={item.label}
                    label={item.label}
                    subtitle={item.subtitle}
                    score={item.score}
                    delay={i * 0.1}
                  />
                ))}
              </div>
            </Card>

            {/* Accordion feedback */}
            <Card index={5}>
              <CardTitle icon={Brain}>Individual Check Feedback</CardTitle>
              <Accordion items={accordionItems} />
            </Card>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="flex flex-col gap-5">

            {/* Overall risk banner */}
            <Card index={0} className={`border ${overallBg}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <RiskBadge level={overallLevel} />
                    <span className="text-xs text-text-muted font-mono">Score: {scores?.overall ?? 0}/100</span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{ai_coaching?.overall_summary}</p>
                  {ai_coaching?.sport_specific_note && (
                    <p className="mt-2 text-xs text-accent-primary/80 italic leading-relaxed border-l-2 border-accent-primary/30 pl-2">
                      {ai_coaching.sport_specific_note}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <RiskGauge score={scores?.overall ?? 0} level={overallLevel} />
                </div>
              </div>
            </Card>

            {/* Priority issue */}
            <Card index={1} className="border-l-4 border-l-warning relative overflow-hidden">
              <CardTitle icon={Target} iconClass="text-warning">Focus On This First</CardTitle>
              <p className="text-sm text-text-primary leading-relaxed">{ai_coaching?.priority_issue}</p>
            </Card>

            {/* Coaching cues */}
            <Card index={2}>
              <CardTitle icon={Brain}>Movement Cues</CardTitle>
              <div className="flex flex-col gap-3">
                {(ai_coaching?.coaching_cues ?? []).map((cue, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-accent-glow border border-accent-primary/10">
                    <span className="w-6 h-6 rounded-lg bg-accent-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-text-secondary leading-relaxed">{cue}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Exercise prescription */}
            <Card index={3}>
              <CardTitle icon={Dumbbell}>Recovery &amp; Prevention Plan</CardTitle>
              <div className="flex flex-col divide-y divide-border-subtle">
                {(ai_coaching?.exercise_prescription ?? []).map((ex, i, arr) => (
                  <div key={i} className={`flex flex-col gap-1 ${i > 0 ? 'pt-4' : ''} ${i < arr.length - 1 ? 'pb-4' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-text-primary">{ex?.name}</span>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/20 flex-shrink-0">
                        {ex?.sets_reps}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted italic leading-relaxed">{ex?.why}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-text-muted border-t border-border-subtle pt-3">
                Consult a physiotherapist before starting any new exercise program.
              </p>
            </Card>

            {/* Warm-up routine */}
            {settings.showWarmup && ai_coaching?.warmup_routine?.length > 0 && (
              <Card index={4}>
                <CardTitle icon={Sunrise} iconClass="text-warning">Warm-up Routine</CardTitle>
                <div className="flex flex-col gap-3">
                  {ai_coaching.warmup_routine.map((w, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-warning/5 border border-warning/10">
                      <span className="w-6 h-6 rounded-lg bg-warning/20 text-warning text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-text-primary">{w.name}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20 flex-shrink-0">
                            {w.duration}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{w.focus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Weekly training plan */}
            {settings.showWeeklyPlan && ai_coaching?.weekly_plan?.length > 0 && (
              <Card index={5}>
                <CardTitle icon={Calendar}>Weekly Training Plan</CardTitle>
                <div className="flex flex-col gap-3">
                  {ai_coaching.weekly_plan.map((day, i) => (
                    <div key={i} className="p-3 rounded-xl bg-bg-elevated border border-border-subtle">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-accent-primary">{day.day}</span>
                        <span className="text-xs text-text-muted">{day.focus}</span>
                      </div>
                      <ul className="flex flex-col gap-1">
                        {(day.exercises ?? []).map((ex, j) => (
                          <li key={j} className="text-xs text-text-secondary flex items-start gap-1.5">
                            <span className="text-accent-primary/50 mt-0.5 flex-shrink-0">•</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Positive observation */}
            <Card index={6} className="border-l-4 border-l-success">
              <CardTitle icon={Star} iconClass="text-success">What You're Doing Well</CardTitle>
              <p className="text-sm text-text-secondary leading-relaxed">{ai_coaching?.positive_observation}</p>
            </Card>

            {/* Follow-up timeline */}
            <Card index={7}>
              <CardTitle icon={Clock} iconClass="text-text-muted">Follow-up Timeline</CardTitle>
              <p className="text-sm text-text-secondary leading-relaxed">{ai_coaching?.follow_up_timeline}</p>
            </Card>

            {/* Share / export */}
            <Card index={8}>
              <CardTitle icon={Share2}>Share &amp; Export</CardTitle>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border border-border-accent text-accent-primary hover:bg-accent-glow transition-all duration-200"
                  aria-label="Copy shareable link"
                >
                  <Share2 size={14} aria-hidden />Copy Link
                </button>
                <button
                  onClick={() => downloadTextReport(results)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-accent transition-all duration-200"
                  aria-label="Download report as text file"
                >
                  <Download size={14} aria-hidden />Download
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
