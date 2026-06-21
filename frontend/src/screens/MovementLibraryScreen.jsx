import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, Play, AlertTriangle, CheckCircle, Dumbbell } from 'lucide-react'
import { useStore } from '../store'

const LIBRARY = [
  {
    name: 'Squat',
    category: 'Lower Body',
    emoji: '🦵',
    difficulty: 'Beginner',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core', 'Calves'],
    description: 'A fundamental compound movement targeting the entire lower body. The foundation of athletic performance and everyday movement.',
    formTips: [
      'Keep knees aligned over toes throughout the movement',
      'Drive hips back before bending knees',
      'Maintain neutral spine — avoid rounding or excessive arching',
      'Keep chest tall and shoulders back',
      'Push through heels on the way up',
      'Depth: aim for thighs parallel or below if mobility allows',
    ],
    commonMistakes: [
      'Knees caving inward (valgus collapse)',
      'Heels lifting off the floor',
      'Excessive forward lean of the torso',
      'Not reaching proper depth',
      'Letting knees track inside the big toe',
    ],
    injuryRisks: ['Knee pain from valgus', 'Lower back strain from forward lean', 'Patellar tendinopathy'],
    keyMetrics: ['knee_valgus_left', 'knee_valgus_right', 'trunk_lean'],
    warmupExercises: ['Hip circles', 'Ankle rolls', 'Bodyweight squats', 'Hip flexor stretch'],
  },
  {
    name: 'Deadlift',
    category: 'Lower Body',
    emoji: '🏋️',
    difficulty: 'Intermediate',
    muscles: ['Hamstrings', 'Glutes', 'Lower Back', 'Traps', 'Core', 'Lats'],
    description: 'One of the most powerful full-body movements for building posterior chain strength and improving everyday lifting mechanics.',
    formTips: [
      'Bar stays close to your body throughout the lift',
      'Hinge at the hips, not the waist',
      'Pack the shoulder blades — create lat engagement',
      'Keep the neck neutral (look slightly down)',
      'Push the floor away rather than thinking about pulling up',
      'Lock out hips and knees at the top — no hyperextension',
    ],
    commonMistakes: [
      'Rounding the lower back',
      'Bar drifting away from the body',
      'Jerking the bar off the floor',
      'Hyperextending at lockout',
      'Not engaging the lats',
    ],
    injuryRisks: ['Lumbar disc herniation', 'Hamstring strain', 'Lower back pain'],
    keyMetrics: ['trunk_lean', 'asymmetry'],
    warmupExercises: ['Cat-cow stretch', 'Glute bridges', 'Romanian deadlift with light weight', 'Thoracic rotations'],
  },
  {
    name: 'Lunge',
    category: 'Lower Body',
    emoji: '🦿',
    difficulty: 'Beginner',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Hip Flexors', 'Calves'],
    description: 'A unilateral lower body exercise that improves balance, coordination, and identifies strength imbalances between legs.',
    formTips: [
      'Step far enough forward so front shin stays vertical',
      'Keep front knee aligned over second toe',
      'Lower back knee toward the floor with control',
      'Drive through the front heel to return',
      'Keep torso upright — avoid leaning forward',
      'Equal weight distribution between both legs',
    ],
    commonMistakes: [
      'Front knee collapsing inward',
      'Torso collapsing forward',
      'Taking too short a step',
      'Back knee slamming the floor',
      'Lateral hip shift during movement',
    ],
    injuryRisks: ['Patellar tendinopathy', 'Hip flexor strain', 'Knee pain'],
    keyMetrics: ['knee_valgus_left', 'knee_valgus_right', 'asymmetry'],
    warmupExercises: ['Hip flexor stretch', 'Lateral band walks', 'Single-leg glute bridges'],
  },
  {
    name: 'Running',
    category: 'Cardio',
    emoji: '🏃',
    difficulty: 'Beginner',
    muscles: ['Quadriceps', 'Hamstrings', 'Calves', 'Glutes', 'Core', 'Hip Flexors'],
    description: 'Proper running mechanics reduce injury risk significantly. Small form adjustments can have massive impact on long-term health.',
    formTips: [
      'Land with foot under your center of mass, not in front',
      'Maintain slight forward lean from ankles (not waist)',
      'Arms swing forward-back, not across the body',
      'Keep shoulders relaxed and down',
      'Aim for 170-180 steps per minute cadence',
      'Look ahead 10-15 meters, not down at feet',
    ],
    commonMistakes: [
      'Heel striking far in front of body',
      'Overstriding',
      'Excessive arm crossover',
      'Head bobbing up and down',
      'Shoulder tension and raised arms',
    ],
    injuryRisks: ['IT Band syndrome', 'Shin splints', 'Plantar fasciitis', 'Runner\'s knee'],
    keyMetrics: ['trunk_lean', 'asymmetry', 'knee_valgus_left'],
    warmupExercises: ['Dynamic leg swings', 'High knees', 'Butt kicks', 'Hip circles', 'Calf raises'],
  },
  {
    name: 'Jump Landing',
    category: 'Plyometric',
    emoji: '⬇️',
    difficulty: 'Intermediate',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves', 'Core'],
    description: 'Landing mechanics are critical for ACL injury prevention. Poor landing form is the leading cause of non-contact knee injuries in sport.',
    formTips: [
      'Land softly with bent knees — absorb force over 0.5+ seconds',
      'Land with feet hip-width apart',
      'Keep knees aligned over toes at all times',
      'Hinge at hips simultaneously with knee bend',
      'Stay balanced — equal weight on both legs',
      'Look forward, not down',
    ],
    commonMistakes: [
      'Stiff-legged landing (absorbing through joints, not muscles)',
      'Knee valgus collapse on landing',
      'Asymmetric landing (one leg taking more load)',
      'Trunk collapsing forward',
      'Landing on heels',
    ],
    injuryRisks: ['ACL tear', 'Meniscus injury', 'Ankle sprain', 'Patellar dislocation'],
    keyMetrics: ['knee_valgus_left', 'knee_valgus_right', 'asymmetry', 'trunk_lean'],
    warmupExercises: ['Box step-downs', 'Lateral mini hops', 'Single-leg balance', 'Glute activation'],
  },
  {
    name: 'Push-up',
    category: 'Upper Body',
    emoji: '💪',
    difficulty: 'Beginner',
    muscles: ['Pectorals', 'Triceps', 'Anterior Deltoids', 'Core', 'Serratus Anterior'],
    description: 'A foundational upper body movement that also challenges core stability. Perfect for assessing shoulder health and scapular control.',
    formTips: [
      'Place hands slightly wider than shoulder width',
      'Keep body in a straight line from head to heels',
      'Lower chest to just above the floor',
      'Elbows track at ~45° angle, not flared out',
      'Actively push the floor away at the top',
      'Engage core throughout — no sagging hips',
    ],
    commonMistakes: [
      'Hips sagging toward the floor',
      'Hips piking up',
      'Elbows flaring out to 90°',
      'Head drooping forward',
      'Not achieving full range of motion',
    ],
    injuryRisks: ['Shoulder impingement', 'Wrist pain', 'Lower back strain'],
    keyMetrics: ['trunk_lean', 'shoulder', 'asymmetry'],
    warmupExercises: ['Shoulder rolls', 'Wrist circles', 'Wall push-ups', 'Scapular push-ups'],
  },
  {
    name: 'Plank',
    category: 'Core',
    emoji: '🧱',
    difficulty: 'Beginner',
    muscles: ['Core', 'Transverse Abdominis', 'Glutes', 'Shoulders', 'Hip Flexors'],
    description: 'The gold standard for assessing core endurance and stability. Proper form is essential for back health and athletic performance.',
    formTips: [
      'Elbows directly under shoulders',
      'Body forms a straight line head-to-heels',
      'Engage glutes and core simultaneously',
      'Breathe normally throughout',
      'Don\'t let hips drop or pike',
      'Keep neck neutral — look at the floor',
    ],
    commonMistakes: [
      'Hips dropping below spine line',
      'Hips raised into an inverted V',
      'Head drooping or craning up',
      'Holding breath',
      'Weight too far forward on toes',
    ],
    injuryRisks: ['Lower back pain from sagging', 'Shoulder strain', 'Neck pain'],
    keyMetrics: ['trunk_lean', 'shoulder'],
    warmupExercises: ['Cat-cow', 'Dead bug', 'Bird dog', 'Hollow body holds'],
  },
  {
    name: 'Hip Hinge',
    category: 'Lower Body',
    emoji: '🔄',
    difficulty: 'Beginner',
    muscles: ['Hamstrings', 'Glutes', 'Lower Back', 'Core'],
    description: 'The hip hinge is the fundamental movement pattern behind deadlifts, Romanian deadlifts, and many athletic movements. Mastering it prevents lower back injury.',
    formTips: [
      'Push hips straight back — not down',
      'Maintain neutral spine throughout',
      'Feel stretch in hamstrings at the bottom',
      'Keep bar/weight close to the body',
      'Drive hips forward at the top to stand',
      'Soft knee bend (not a squat)',
    ],
    commonMistakes: [
      'Squatting instead of hinging',
      'Rounding the lower back',
      'Not reaching hamstring stretch',
      'Hyperextending at the top',
    ],
    injuryRisks: ['Lower back pain', 'Hamstring strain'],
    keyMetrics: ['trunk_lean', 'asymmetry'],
    warmupExercises: ['Hip hinge with dowel', 'Glute bridges', 'Good mornings'],
  },
  {
    name: 'Overhead Press',
    category: 'Upper Body',
    emoji: '🙌',
    difficulty: 'Intermediate',
    muscles: ['Deltoids', 'Triceps', 'Upper Trapezius', 'Core', 'Rotator Cuff'],
    description: 'A demanding overhead movement that requires excellent shoulder mobility and core stability. Crucial for overhead athletes.',
    formTips: [
      'Grip slightly wider than shoulders',
      'Tuck elbows slightly in front of bar',
      'Brace core and squeeze glutes',
      'Press bar overhead in a straight line',
      'Shrug shoulders up at the top for full range',
      'Lower under control to collar bone',
    ],
    commonMistakes: [
      'Excessive lumbar extension (back arch)',
      'Bar path going too far forward or back',
      'Not fully locking out at top',
      'Elbows too wide at start',
    ],
    injuryRisks: ['Shoulder impingement', 'Rotator cuff strain', 'Lower back pain from arch'],
    keyMetrics: ['shoulder', 'trunk_lean', 'asymmetry'],
    warmupExercises: ['Band pull-aparts', 'Shoulder dislocates', 'Face pulls', 'Thoracic extension'],
  },
  {
    name: 'Lateral Lunge',
    category: 'Lower Body',
    emoji: '↔️',
    difficulty: 'Intermediate',
    muscles: ['Glutes', 'Abductors', 'Adductors', 'Quadriceps', 'Hamstrings'],
    description: 'Trains the often-neglected frontal plane movement, building hip abductor strength critical for knee stability and injury prevention.',
    formTips: [
      'Step wide enough to load the glute fully',
      'Push hips back as you step sideways',
      'Keep stepping foot pointing forward',
      'Bend only the stepping leg',
      'Keep stationary leg straight',
      'Drive through the stepping heel to return',
    ],
    commonMistakes: [
      'Knee tracking over the little toe side',
      'Trunk collapsing sideways',
      'Not achieving enough depth',
      'Toes turning out on the stepping foot',
    ],
    injuryRisks: ['Groin strain', 'Knee pain', 'Hip flexor injury'],
    keyMetrics: ['asymmetry', 'knee_valgus_left', 'knee_valgus_right'],
    warmupExercises: ['Lateral band walks', 'Clamshells', 'Hip abductor stretch', 'Sumo squat holds'],
  },
  {
    name: 'Split Squat',
    category: 'Lower Body',
    emoji: '🦵',
    difficulty: 'Intermediate',
    muscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Hip Flexors', 'Core'],
    description: 'The Bulgarian split squat is arguably the best single-leg exercise for identifying and correcting left-right strength imbalances.',
    formTips: [
      'Front foot far enough forward so shin stays vertical at bottom',
      'Keep torso upright throughout',
      'Drive through front heel on the way up',
      'Lower back knee toward floor with control',
      'Keep hips square — avoid rotation',
      'Focus on the front glute doing the work',
    ],
    commonMistakes: [
      'Front knee caving inward',
      'Torso pitching forward',
      'Back knee slamming floor',
      'Hip rotating open on working side',
    ],
    injuryRisks: ['Patellar tendinopathy', 'Hip flexor strain', 'Knee pain'],
    keyMetrics: ['asymmetry', 'knee_valgus_left', 'knee_valgus_right', 'trunk_lean'],
    warmupExercises: ['Hip flexor stretch', 'Glute bridges', 'Lateral band walks', 'Single-leg balance'],
  },
  {
    name: 'Bench Press',
    category: 'Upper Body',
    emoji: '🏋️',
    difficulty: 'Intermediate',
    muscles: ['Pectorals', 'Anterior Deltoids', 'Triceps', 'Serratus Anterior'],
    description: 'The most popular upper body strength exercise. Proper technique is critical for shoulder health and long-term pressing performance.',
    formTips: [
      'Retract and depress shoulder blades into the bench',
      'Grip slightly wider than shoulder width',
      'Lower bar to lower chest (nipple line)',
      'Elbows at 45-75° from torso (not 90°)',
      'Drive feet into the floor throughout',
      'Exhale as you press, inhale on the way down',
    ],
    commonMistakes: [
      'Bouncing bar off the chest',
      'Elbows flaring out to 90°',
      'Butt lifting off the bench',
      'Bar path going too high on the chest',
      'Uneven bar path (one side leads)',
    ],
    injuryRisks: ['Pec tear', 'Shoulder impingement', 'AC joint injury', 'Rotator cuff strain'],
    keyMetrics: ['shoulder', 'asymmetry'],
    warmupExercises: ['Band pull-aparts', 'Shoulder circles', 'Light dumbbell flyes', 'Push-ups'],
  },
]

const CATEGORIES = ['All', 'Lower Body', 'Upper Body', 'Core', 'Cardio', 'Plyometric']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']

const DIFF_COLOR = { Beginner: 'text-success bg-success/10', Intermediate: 'text-warning bg-warning/10', Advanced: 'text-danger bg-danger/10' }

function MovementCard({ movement, index, onAnalyse }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass rounded-2xl border border-border-subtle overflow-hidden hover:border-accent-primary/20 transition-all duration-200"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <span className="text-2xl">{movement.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-text-primary">{movement.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${DIFF_COLOR[movement.difficulty] ?? 'text-text-muted bg-bg-elevated'}`}>
              {movement.difficulty}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted">
              {movement.category}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{movement.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onAnalyse(movement.name) }}
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-accent-primary border border-accent-primary/30 rounded-lg px-2 py-1 hover:bg-accent-primary/10 transition-colors"
          >
            <Play size={11} />
            Analyse
          </button>
          {expanded ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border-subtle pt-3 grid gap-4">
              {/* muscles */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Dumbbell size={12} /> Muscles Targeted
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {movement.muscles.map((m) => (
                    <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary font-medium">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* form tips */}
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1">
                    <CheckCircle size={12} className="text-success" /> Form Tips
                  </p>
                  <ul className="space-y-1">
                    {movement.formTips.map((tip, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <span className="text-success mt-0.5 flex-shrink-0">✓</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* common mistakes */}
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-warning" /> Common Mistakes
                  </p>
                  <ul className="space-y-1">
                    {movement.commonMistakes.map((m, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <span className="text-warning mt-0.5 flex-shrink-0">!</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* injury risks */}
              <div>
                <p className="text-xs font-bold text-danger uppercase tracking-wide mb-2">Injury Risks</p>
                <div className="flex flex-wrap gap-1.5">
                  {movement.injuryRisks.map((r) => (
                    <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger font-medium">{r}</span>
                  ))}
                </div>
              </div>

              {/* warm-up */}
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide mb-2">Recommended Warm-up</p>
                <div className="flex flex-wrap gap-1.5">
                  {movement.warmupExercises.map((w) => (
                    <span key={w} className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-secondary border border-border-subtle">{w}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onAnalyse(movement.name)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-md"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                Analyse {movement.name}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MovementLibraryScreen() {
  const setScreen = useStore((s) => s.setScreen)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')

  const filtered = useMemo(() => {
    return LIBRARY.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.muscles.some((mu) => mu.toLowerCase().includes(search.toLowerCase()))
      const matchCat  = category === 'All' || m.category === category
      const matchDiff = difficulty === 'All' || m.difficulty === difficulty
      return matchSearch && matchCat && matchDiff
    })
  }, [search, category, difficulty])

  function handleAnalyse(movementName) {
    setScreen('upload')
    setTimeout(() => {
      window.__preselectedMovement = movementName
    }, 100)
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          📖 Movement Library
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Learn proper form for all {LIBRARY.length} supported movements</p>
      </motion.div>

      {/* search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search movements or muscles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border-subtle bg-bg-base text-sm text-text-primary focus:outline-none focus:border-accent-primary"
        >
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-text-primary font-semibold">No movements match your search</p>
          <p className="text-sm text-text-muted mt-1">Try a different search term or filter</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((m, i) => (
            <MovementCard key={m.name} movement={m} index={i} onAnalyse={handleAnalyse} />
          ))}
        </div>
      )}
    </div>
  )
}
