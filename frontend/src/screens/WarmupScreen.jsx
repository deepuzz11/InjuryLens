import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Play, CheckCircle, ChevronRight, Clock, RefreshCw } from 'lucide-react'
import { useStore } from '../store'

const WARMUP_DB = {
  Squat: [
    { name: 'Hip Circles', duration: '30s each direction', category: 'Mobility', why: 'Lubricates hip joint and improves ROM for deep squat' },
    { name: 'Ankle Rolls', duration: '20 reps each', category: 'Mobility', why: 'Ankle dorsiflexion is critical for proper squat depth' },
    { name: 'Bodyweight Squats', duration: '2×10 slow', category: 'Activation', why: 'Primes neuromuscular patterns and warms knee joint' },
    { name: 'Glute Bridges', duration: '2×12', category: 'Activation', why: 'Activates glutes which are the primary stabilizers in a squat' },
    { name: 'Hip Flexor Stretch', duration: '30s each side', category: 'Flexibility', why: 'Tight hip flexors cause anterior pelvic tilt and butt wink' },
    { name: 'Lateral Band Walks', duration: '2×15 steps each', category: 'Activation', why: 'Activates hip abductors to prevent knee valgus collapse' },
  ],
  Deadlift: [
    { name: 'Cat-Cow Stretch', duration: '10 reps', category: 'Mobility', why: 'Warms thoracic and lumbar spine' },
    { name: 'Glute Bridges', duration: '2×15', category: 'Activation', why: 'Activates posterior chain before heavy pulling' },
    { name: 'Bodyweight Good Mornings', duration: '2×10', category: 'Activation', why: 'Teaches hip hinge pattern and activates hamstrings' },
    { name: 'Thoracic Rotations', duration: '10 each side', category: 'Mobility', why: 'Reduces upper back stiffness for a neutral spine' },
    { name: 'Romanian Deadlift (light)', duration: '2×8 with empty bar', category: 'Rehearsal', why: 'Rehearses the movement pattern at low intensity' },
    { name: 'Dead Hangs', duration: '3×20s', category: 'Mobility', why: 'Decompresses spine and improves lat engagement' },
  ],
  Lunge: [
    { name: 'Hip Flexor Stretch', duration: '30s each side', category: 'Flexibility', why: 'Critical for front knee position and torso upright' },
    { name: 'Lateral Band Walks', duration: '2×15 steps', category: 'Activation', why: 'Activates hip abductors to prevent knee valgus' },
    { name: 'Single-Leg Balance', duration: '30s each', category: 'Stability', why: 'Primes ankle and knee stabilizers' },
    { name: 'Walking Lunges (bodyweight)', duration: '10 each leg', category: 'Rehearsal', why: 'Progressive warm-up for the movement pattern' },
    { name: 'Calf Raises', duration: '2×15', category: 'Activation', why: 'Warms ankle joint and calf-Achilles complex' },
  ],
  Running: [
    { name: 'Dynamic Leg Swings (front-back)', duration: '15 each', category: 'Mobility', why: 'Opens hip flexion/extension ROM' },
    { name: 'Dynamic Leg Swings (side-side)', duration: '15 each', category: 'Mobility', why: 'Opens hip abduction and adduction' },
    { name: 'High Knees', duration: '30s', category: 'Activation', why: 'Elevates heart rate and activates hip flexors' },
    { name: 'Butt Kicks', duration: '30s', category: 'Activation', why: 'Activates hamstrings and improves cadence' },
    { name: 'A-Skip', duration: '20m each way', category: 'Activation', why: 'Coordinates arm-leg timing and foot strike' },
    { name: 'Ankle Circles', duration: '15 each direction', category: 'Mobility', why: 'Reduces plantar fascia and Achilles stiffness' },
  ],
  'Jump Landing': [
    { name: 'Box Step-Downs', duration: '2×8 each leg', category: 'Activation', why: 'Teaches controlled eccentric loading' },
    { name: 'Lateral Mini Hops', duration: '3×10', category: 'Rehearsal', why: 'Warms up the landing reflex' },
    { name: 'Single-Leg Balance', duration: '30s each', category: 'Stability', why: 'Activates ankle stabilizers critical for landing' },
    { name: 'Glute Activation (clamshells)', duration: '2×15', category: 'Activation', why: 'Prevents knee valgus collapse on landing impact' },
    { name: 'Squat Jumps (soft landing)', duration: '2×5', category: 'Rehearsal', why: 'Progressive plyometric warm-up at low intensity' },
  ],
  'Push-up': [
    { name: 'Shoulder Rolls', duration: '10 each direction', category: 'Mobility', why: 'Reduces shoulder stiffness and warms rotator cuff' },
    { name: 'Wrist Circles', duration: '15 each direction', category: 'Mobility', why: 'Critical prep for wrist-loaded positions' },
    { name: 'Wall Push-ups', duration: '2×10', category: 'Rehearsal', why: 'Warms shoulder joint at reduced load' },
    { name: 'Scapular Push-ups', duration: '2×10', category: 'Activation', why: 'Activates serratus anterior for shoulder blade control' },
    { name: 'Band Pull-Aparts', duration: '2×15', category: 'Activation', why: 'Counteracts anterior shoulder dominance' },
  ],
  Plank: [
    { name: 'Cat-Cow', duration: '10 reps', category: 'Mobility', why: 'Warms spinal extensors and flexors' },
    { name: 'Dead Bug', duration: '2×8 each side', category: 'Activation', why: 'Activates deep core stabilizers (TVA)' },
    { name: 'Bird Dog', duration: '2×8 each side', category: 'Activation', why: 'Trains core stability under limb movement' },
    { name: 'Hollow Body Hold', duration: '3×15s', category: 'Activation', why: 'Primes entire core unit before planks' },
  ],
  'Hip Hinge': [
    { name: 'Hip Hinge with Dowel', duration: '2×10', category: 'Rehearsal', why: 'Teaches the pattern with biofeedback' },
    { name: 'Glute Bridges', duration: '2×15', category: 'Activation', why: 'Activates glutes before hinge-dominant work' },
    { name: 'Good Mornings (light)', duration: '2×10', category: 'Rehearsal', why: 'Progressively loads the pattern' },
    { name: 'Standing Hamstring Stretch', duration: '30s each', category: 'Flexibility', why: 'Reduces hamstring restriction during hip hinge' },
  ],
  'Overhead Press': [
    { name: 'Band Pull-Aparts', duration: '3×15', category: 'Activation', why: 'Activates rear deltoids and stabilizes shoulders' },
    { name: 'Shoulder Dislocates (band/stick)', duration: '10', category: 'Mobility', why: 'Dramatically improves shoulder flexion and external rotation' },
    { name: 'Face Pulls', duration: '2×15', category: 'Activation', why: 'Activates external rotators to protect shoulder joint' },
    { name: 'Thoracic Extension over foam roller', duration: '5 segments × 10s', category: 'Mobility', why: 'Improves thoracic spine extension needed for overhead' },
    { name: 'Empty Bar Overhead Press', duration: '2×10', category: 'Rehearsal', why: 'Warms up the movement pattern' },
  ],
  'Lateral Lunge': [
    { name: 'Lateral Band Walks', duration: '2×15 each', category: 'Activation', why: 'Activates hip abductors key to lateral movements' },
    { name: 'Clamshells', duration: '2×15', category: 'Activation', why: 'Targets hip external rotators' },
    { name: 'Sumo Squat Hold', duration: '2×20s', category: 'Flexibility', why: 'Opens hip adductors and groin' },
    { name: 'Hip Adductor Stretch', duration: '30s each side', category: 'Flexibility', why: 'Prevents groin strain during lateral loading' },
  ],
  'Split Squat': [
    { name: 'Hip Flexor Stretch', duration: '30s each side', category: 'Flexibility', why: 'Releases tight hip flexors that cause forward torso lean' },
    { name: 'Glute Bridges', duration: '2×12', category: 'Activation', why: 'Activates glutes as primary driver' },
    { name: 'Lateral Band Walks', duration: '2×15', category: 'Activation', why: 'Prevents knee valgus during single-leg loading' },
    { name: 'Single-Leg Balance', duration: '30s each', category: 'Stability', why: 'Trains ankle and knee stability' },
    { name: 'Bodyweight Split Squats', duration: '2×8 each', category: 'Rehearsal', why: 'Progressive warm-up for the movement' },
  ],
  'Bench Press': [
    { name: 'Band Pull-Aparts', duration: '3×15', category: 'Activation', why: 'Activates rear delts and retracts shoulder blades' },
    { name: 'Shoulder Circles (arm circles)', duration: '15 each direction', category: 'Mobility', why: 'Warms up the shoulder joint capsule' },
    { name: 'Light Dumbbell Flyes', duration: '2×12', category: 'Activation', why: 'Warms pectorals before heavy pressing' },
    { name: 'Push-ups', duration: '2×10', category: 'Rehearsal', why: 'Activates serratus anterior for scapular control' },
    { name: 'Empty Bar Bench', duration: '3×8 increasing', category: 'Rehearsal', why: 'Progressive load warm-up for the movement' },
  ],
}

const DEFAULT_WARMUP = [
  { name: 'General Dynamic Warm-up', duration: '5 min', category: 'Cardio', why: 'Elevates heart rate and increases core temperature' },
  { name: 'Hip Circles', duration: '15 each direction', category: 'Mobility', why: 'Opens hip joint for most movements' },
  { name: 'Arm Circles', duration: '15 each direction', category: 'Mobility', why: 'Warms shoulder complex' },
  { name: 'Bodyweight Squats', duration: '15 reps', category: 'Activation', why: 'Primes lower body musculature' },
  { name: 'Light jogging or high knees', duration: '60 seconds', category: 'Cardio', why: 'Final heart rate elevation before training' },
]

const CATEGORY_COLORS = {
  Mobility: 'text-blue-600 bg-blue-50 border-blue-100',
  Activation: 'text-success bg-success/10 border-success/20',
  Flexibility: 'text-purple-600 bg-purple-50 border-purple-100',
  Rehearsal: 'text-accent-primary bg-accent-primary/10 border-accent-primary/20',
  Stability: 'text-orange-600 bg-orange-50 border-orange-100',
  Cardio: 'text-warning bg-warning/10 border-warning/20',
}

export default function WarmupScreen() {
  const history   = useStore((s) => s.history)
  const setScreen = useStore((s) => s.setScreen)
  const recoveryLogs = useStore((s) => s.recoveryLogs)

  const recentMovement = history[0]?.movement_type ?? null
  const [selected, setSelected] = useState(recentMovement ?? 'Squat')
  const [completed, setCompleted] = useState({})
  const [started, setStarted]   = useState(false)

  const MOVEMENTS = Object.keys(WARMUP_DB)

  const warmup = WARMUP_DB[selected] ?? DEFAULT_WARMUP

  const totalTime = useMemo(() => {
    const mins = warmup.length * 1.5
    return mins < 1 ? '< 1 min' : `~${Math.ceil(mins)} min`
  }, [warmup])

  const allDone = Object.keys(completed).length === warmup.length

  const todayReadiness = recoveryLogs[0] && new Date(recoveryLogs[0].date).toDateString() === new Date().toDateString()
    ? recoveryLogs[0].readiness : null

  function handleReset() {
    setCompleted({})
    setStarted(false)
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      {/* header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Flame size={22} className="text-warning" />
          Warm-up Generator
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Personalized pre-session warm-up to reduce injury risk</p>

        {/* readiness alert */}
        {todayReadiness != null && todayReadiness < 55 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)', color: '#d97706' }}
          >
            ⚠️ Your recovery readiness is low ({todayReadiness}%). Consider a longer warm-up or lighter session today.
          </motion.div>
        )}
      </motion.div>

      {/* movement selector */}
      {!started && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Select Today's Movement</p>
          <div className="flex flex-wrap gap-2">
            {MOVEMENTS.map((m) => (
              <button
                key={m}
                onClick={() => { setSelected(m); setCompleted({}) }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  selected === m
                    ? 'bg-accent-primary text-white border-accent-primary shadow-md'
                    : 'border-border-subtle text-text-muted hover:border-accent-primary/40 hover:text-text-primary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* summary bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-2xl p-4 border border-border-subtle mb-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-text-primary">{selected} Warm-up</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-text-muted flex items-center gap-1"><Clock size={11} /> {totalTime}</span>
              <span className="text-xs text-text-muted">{warmup.length} exercises</span>
              {started && <span className="text-xs font-semibold text-accent-primary">{Object.keys(completed).length}/{warmup.length} done</span>}
            </div>
          </div>
          {!started ? (
            <button
              onClick={() => setStarted(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Play size={15} />
              Start
            </button>
          ) : (
            <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-primary transition-colors">
              <RefreshCw size={13} />
              Reset
            </button>
          )}
        </div>

        {started && (
          <div className="mt-3">
            <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
              <motion.div
                animate={{ width: `${(Object.keys(completed).length / warmup.length) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #f59e0b, #4f46e5)' }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* exercise list */}
      <div className="grid gap-3">
        <AnimatePresence>
          {warmup.map((exercise, i) => {
            const isDone = !!completed[i]
            return (
              <motion.div
                key={exercise.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-2xl border p-4 transition-all duration-300 ${
                  isDone
                    ? 'border-success/30 bg-success/5'
                    : started ? 'glass border-border-subtle hover:border-accent-primary/20' : 'glass border-border-subtle'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    disabled={!started}
                    onClick={() => setCompleted((c) => isDone ? { ...c, [i]: undefined } : { ...c, [i]: true })}
                    className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                      !started ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    } ${isDone ? 'bg-success/15' : 'bg-bg-elevated hover:bg-accent-primary/10'}`}
                  >
                    {isDone
                      ? <CheckCircle size={18} className="text-success" />
                      : <span className="text-sm font-bold text-text-muted">{i + 1}</span>
                    }
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-bold ${isDone ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                        {exercise.name}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${CATEGORY_COLORS[exercise.category] ?? 'text-text-muted bg-bg-elevated'}`}>
                        {exercise.category}
                      </span>
                    </div>
                    <p className="text-xs text-accent-primary font-semibold mt-0.5">{exercise.duration}</p>
                    <p className="text-xs text-text-muted mt-0.5">{exercise.why}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* done! CTA */}
      <AnimatePresence>
        {allDone && started && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="mt-6 glass rounded-2xl p-5 border border-success/30 bg-success/5 text-center"
          >
            <p className="text-3xl mb-2">🔥</p>
            <p className="text-base font-bold text-text-primary mb-1">Warm-up Complete!</p>
            <p className="text-sm text-text-muted mb-4">You're ready for your {selected} session. Your muscles are primed and injury risk is reduced.</p>
            <button
              onClick={() => setScreen('upload')}
              className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              Start Analysis
              <ChevronRight size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
