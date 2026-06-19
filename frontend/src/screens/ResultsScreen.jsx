import React, { useCallback, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Brain, Dumbbell, Star, Clock, Share2, Download,
  CheckCircle, AlertTriangle, XCircle, TrendingUp, Eye,
  Activity, Zap, RotateCcw, ChevronLeft, ChevronRight,
  Heart, Calendar, Sunrise, GitCompareArrows, Bookmark,
  BookmarkCheck, AlertCircle,
} from 'lucide-react'
import { useStore } from '../store'
import Navbar from '../components/Navbar'
import AnimatedBar from '../components/AnimatedBar'
import Accordion from '../components/Accordion'
import RiskGauge from '../components/RiskGauge'
import BodyMap from '../components/BodyMap'
import TimelineChart from '../components/TimelineChart'
import GhostOverlay from '../components/GhostOverlay'
import VoiceCoaching from '../components/VoiceCoaching'
import PDFExportButton from '../components/PDFExportButton'
import ShareCard from '../components/ShareCard'
import MovementQualityScore from '../components/MovementQualityScore'
import ExerciseDemoCard from '../components/ExerciseDemoCard'
import { downloadTextReport } from '../api'

// ─── Shared primitives ───────────────────────────────────────────────────────
const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' } }),
}

function Card({ children, className = '', index = 0, id }) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={cardVariants}
      id={id}
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

// ─── Injury probability banner (Feature 5) ───────────────────────────────────
function InjuryProbabilityBanner({ probability }) {
  if (!probability) return null
  const low  = probability < 20
  const high = probability >= 40
  const cls  = high ? 'border-danger/30 bg-danger/5' : low ? 'border-success/20 bg-success/5' : 'border-warning/25 bg-warning/5'
  const color = high ? 'text-danger' : low ? 'text-success' : 'text-warning'
  const Icon  = high ? XCircle : low ? CheckCircle : AlertCircle

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${cls}`}>
      <Icon size={16} className={`${color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className="text-xs font-semibold text-text-primary">
          Estimated 4-week injury risk:{' '}
          <span className={`text-base font-bold font-mono ${color}`}>{probability}%</span>
        </p>
        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
          {high
            ? 'Elevated risk — address the priority issue above before increasing load.'
            : low
              ? 'Low injury risk profile. Maintain form consistency.'
              : 'Moderate risk — follow the corrective plan to reduce likelihood of injury.'
          }
        </p>
      </div>
    </div>
  )
}

// ─── 3D metrics panel (Feature 11) ───────────────────────────────────────────
function ThreeDMetrics({ supplementary }) {
  const trunkRot = supplementary?.avg_trunk_rotation_3d ?? 0
  const hipRot   = supplementary?.avg_hip_rotation_3d   ?? 0
  const kneeAsym = supplementary?.avg_knee_depth_asym_3d ?? 0
  const peakLV   = supplementary?.peak_left_knee_velocity  ?? 0
  const peakRV   = supplementary?.peak_right_knee_velocity ?? 0

  if (!trunkRot && !hipRot && !kneeAsym) return null

  return (
    <div className="mt-3 pt-3 border-t border-border-subtle">
      <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
        <Zap size={11} className="text-cyan-400" />3D Depth Analysis
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Trunk Rotation 3D', value: trunkRot, unit: '%' },
          { label: 'Hip Rotation 3D',   value: hipRot,   unit: '%' },
          { label: 'Peak L.Knee Vel',   value: peakLV,   unit: '°/f' },
          { label: 'Peak R.Knee Vel',   value: peakRV,   unit: '°/f' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="flex justify-between items-center px-3 py-2 rounded-xl bg-bg-elevated border border-border-subtle">
            <span className="text-xs text-text-muted">{label}</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{value}{unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Frame gallery (worst / best / middle) with ghost overlay (Features 3) ──
function FrameGallery({ annotated_frame, annotated_frames, movementType }) {
  const frames = useMemo(() => {
    if (!annotated_frames) return [{ label: 'Worst Frame', src: annotated_frame }]
    return [
      { label: 'Worst Frame',  src: annotated_frames.worst  },
      { label: 'Best Frame',   src: annotated_frames.best   },
      { label: 'Middle Frame', src: annotated_frames.middle },
    ].filter((f) => f.src)
  }, [annotated_frame, annotated_frames])

  const [idx,        setIdx]        = useState(0)
  const [ghostMode,  setGhostMode]  = useState(false)
  const prev = () => setIdx((i) => (i - 1 + frames.length) % frames.length)
  const next = () => setIdx((i) => (i + 1) % frames.length)

  return (
    <div>
      {ghostMode ? (
        <GhostOverlay movementType={movementType} imageSrc={frames[idx].src} show />
      ) : (
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
      )}

      {/* Ghost overlay toggle */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => setGhostMode((g) => !g)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all ${ghostMode ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-border-subtle text-text-muted hover:text-text-secondary'}`}
        >
          👻 {ghostMode ? 'Ghost ON' : 'Show Ideal Form'}
        </button>
        {!ghostMode && frames.length > 1 && (
          <span className="text-[10px] text-text-muted">{idx + 1}/{frames.length} frames</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-muted">
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

  const containerRef = useRef(null)

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

  const injuryProb  = supplementary?.injury_probability_4w ?? 0
  const mqsScore    = supplementary?.mqs_score    ?? 0
  const mqsGrade    = supplementary?.mqs_grade    ?? 'C'
  const mqsPercentile = supplementary?.mqs_percentile ?? 50

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
      <div className="sticky top-16 z-40 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl pdf-exclude">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          {/* Left: movement info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs text-text-secondary hidden sm:block shrink-0">Analysis:</span>
            <span className="text-xs font-semibold text-text-primary truncate">{movement_type}</span>
            <RiskBadge level={overallLevel} />
            {repCount > 0 && (
              <span className="text-xs text-text-muted hidden md:inline font-mono shrink-0">{repCount} reps</span>
            )}
          </div>
          {/* Right: actions — fixed height, no wrap */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
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
              className="text-xs bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary border border-accent-primary/20 px-3 py-1.5 rounded-lg transition-all"
            >
              New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div id="results-container" ref={containerRef} className="max-w-6xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ─── LEFT COLUMN ─── */}
          <div className="flex flex-col gap-5">

            {/* Frame gallery with ghost overlay */}
            <Card index={0}>
              <CardTitle icon={Eye}>Key Frame Analysis</CardTitle>
              <FrameGallery
                annotated_frame={annotated_frame}
                annotated_frames={annotated_frames}
                movementType={movement_type}
              />
            </Card>

            {/* Movement Quality Score (Feature 12) */}
            <Card index={1}>
              <MovementQualityScore
                mqsScore={mqsScore}
                mqsGrade={mqsGrade}
                mqsPercentile={mqsPercentile}
              />
              {/* 3D Depth Metrics (Feature 11) */}
              <ThreeDMetrics supplementary={supplementary} />
            </Card>

            {/* Stats + Body map */}
            <Card index={2}>
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
              <Card index={3}>
                <CardTitle icon={Activity}>Rep Count &amp; Fatigue</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-bg-elevated border border-border-subtle">
                    <span className="text-xs text-text-muted">Repetitions Detected</span>
                    <span className="text-2xl font-bold font-mono text-accent-primary tabular-nums">
                      {repCount > 0 ? repCount : '—'}
                    </span>
                    <span className="text-xs text-text-muted">from angle oscillations</span>
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

            {/* Angle timeline chart with velocity/acceleration (Feature 4) */}
            {settings.showTimeline && frame_timeline?.length > 0 && (
              <Card index={4}>
                <CardTitle icon={Activity}>Joint Angle Timeline</CardTitle>
                <TimelineChart data={frame_timeline} />
              </Card>
            )}

            {/* Risk score bars */}
            <Card index={5}>
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
            <Card index={6}>
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
                  {/* Injury probability (Feature 5) */}
                  {injuryProb > 0 && (
                    <div className="mt-3">
                      <InjuryProbabilityBanner probability={injuryProb} />
                    </div>
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

            {/* Voice coaching + Cues (Feature 6) */}
            <Card index={2}>
              <div className="flex items-center justify-between mb-4">
                <CardTitle icon={Brain}>Movement Cues</CardTitle>
                <VoiceCoaching
                  cues={ai_coaching?.coaching_cues}
                  summary={ai_coaching?.overall_summary}
                  priority={ai_coaching?.priority_issue}
                />
              </div>
              <div className="flex flex-col gap-3">
                {(ai_coaching?.coaching_cues ?? []).map((cue, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-accent-glow border border-accent-primary/10">
                    <span className="w-6 h-6 rounded-lg bg-accent-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-text-secondary leading-relaxed">{cue}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Exercise prescription with demo cards (Feature 13) */}
            <Card index={3}>
              <CardTitle icon={Dumbbell}>Recovery &amp; Prevention Plan</CardTitle>
              <div className="flex flex-col gap-2">
                {(ai_coaching?.exercise_prescription ?? []).map((ex, i) => (
                  <ExerciseDemoCard key={i} exercise={ex} index={i} />
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
                      <span className="w-6 h-6 rounded-lg bg-warning/20 text-warning text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-text-primary">{w.name}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/20 flex-shrink-0">{w.duration}</span>
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

            {/* Share & Export (Features 2, 10) */}
            <Card index={8} className="pdf-exclude">
              <CardTitle icon={Share2}>Share &amp; Export</CardTitle>
              <div className="flex flex-wrap gap-2">
                {/* Feature 2: PDF export */}
                <PDFExportButton results={results} targetRef={containerRef} />
                {/* Feature 10: Share card + QR */}
                <ShareCard results={results} />
                {/* Text download (existing) */}
                <button
                  onClick={() => downloadTextReport(results)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-accent transition-all"
                >
                  <Download size={14} />Text Report
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
