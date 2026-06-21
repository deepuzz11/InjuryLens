import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid3x3, Search, Heart, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { useStore } from '../store'

const EXERCISES = [
  // Knee / Quad
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Strength', muscles: ['Quadriceps', 'Glutes', 'Core'], difficulty: 'Beginner', equipment: 'Dumbbell / Kettlebell', focus: ['Knee', 'Hip'], emoji: '🏋️',
    description: 'A front-loaded squat variation that promotes upright torso and improves knee tracking.',
    howTo: ['Hold weight at chest with both hands', 'Feet shoulder-width, toes slightly out', 'Squat down keeping elbows inside knees', 'Drive through heels to stand', 'Keep chest up throughout'],
    cues: ['Knees track over toes', 'Chest stays proud', 'Core braced all the way up'],
    injuryBenefit: 'Excellent for knee valgus correction — the weight encourages upright posture', metricTarget: 'kneeValgus' },

  { id: 'bulgarian-split', name: 'Bulgarian Split Squat', category: 'Strength', muscles: ['Quadriceps', 'Glutes', 'Hamstrings'], difficulty: 'Intermediate', equipment: 'Bench + Dumbbells', focus: ['Knee', 'Hip', 'Balance'], emoji: '🦵',
    description: 'Single-leg compound movement that addresses bilateral asymmetry and hip mobility.',
    howTo: ['Place rear foot on bench', 'Front foot 2-3 ft ahead', 'Lower rear knee toward floor', 'Keep front shin vertical', 'Drive through front heel to return'],
    cues: ['Keep torso upright', 'Don\'t let knee cave inward', 'Controlled descent in 3 seconds'],
    injuryBenefit: 'Targets bilateral asymmetry and hip flexor flexibility', metricTarget: 'bilateralAsymmetry' },

  { id: 'step-down', name: 'Eccentric Step Down', category: 'Rehab', muscles: ['Quadriceps', 'VMO', 'Glutes'], difficulty: 'Beginner', equipment: 'Step / Box', focus: ['Knee'], emoji: '🪜',
    description: 'Slow eccentric quad loading — the gold standard rehab for patellofemoral pain.',
    howTo: ['Stand on step with one foot', 'Slowly lower heel of opposite foot to floor (3-5 sec)', 'Keep standing knee over second toe', 'Return to start', 'Repeat'],
    cues: ['Slow is key — 3–5 second descent', 'No knee collapse', 'Control, don\'t drop'],
    injuryBenefit: 'Directly targets VMO and knee valgus under load', metricTarget: 'kneeValgus' },

  // Hip / Glute
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'Strength', muscles: ['Glutes', 'Hamstrings', 'Core'], difficulty: 'Beginner', equipment: 'Bench + Barbell', focus: ['Hip', 'Glute'], emoji: '🍑',
    description: 'The premier glute builder — critical for hip extension power and stability.',
    howTo: ['Sit with upper back on bench', 'Barbell across hips (pad it)', 'Drive hips to ceiling', 'Squeeze glutes at top', 'Lower with control'],
    cues: ['Full hip lock-out at top', 'Chin tuck (neutral neck)', 'Feet flat and hip-width'],
    injuryBenefit: 'Strengthens glutes to reduce hip drop and knee valgus', metricTarget: 'hipDrop' },

  { id: 'clamshell', name: 'Clamshell', category: 'Rehab', muscles: ['Glute Med', 'Hip External Rotators'], difficulty: 'Beginner', equipment: 'Resistance Band (optional)', focus: ['Hip'], emoji: '🦪',
    description: 'Targets the gluteus medius — the primary muscle preventing hip drop and knee collapse.',
    howTo: ['Lie on side, hips stacked', 'Knees bent ~90°', 'Keep feet together', 'Rotate top knee up like a clamshell', 'Lower slowly'],
    cues: ['Don\'t let hips rotate back', 'Lead with the knee, not the foot', 'Add band for progression'],
    injuryBenefit: 'Primary rehab for hip drop and IT band syndrome', metricTarget: 'hipDrop' },

  { id: 'lateral-walk', name: 'Lateral Band Walk', category: 'Activation', muscles: ['Glute Med', 'TFL', 'Hip Abductors'], difficulty: 'Beginner', equipment: 'Mini Resistance Band', focus: ['Hip', 'Knee'], emoji: '🦀',
    description: 'Hip abductor activation drill — perfect warm-up before squats, lunges and running.',
    howTo: ['Place band above knees', 'Slight squat position', 'Step laterally 10-15 steps each way', 'Maintain constant tension on band', 'Don\'t let knees cave'],
    cues: ['Stay low throughout', 'Equal steps — don\'t drag feet', 'Keep toes forward'],
    injuryBenefit: 'Activates glute med to prevent knee valgus and hip drop', metricTarget: 'kneeValgus' },

  // Back / Core
  { id: 'dead-bug', name: 'Dead Bug', category: 'Core', muscles: ['Core', 'TVA', 'Diaphragm'], difficulty: 'Beginner', equipment: 'None', focus: ['Core', 'Trunk'], emoji: '🐛',
    description: 'Anti-extension core stability — trains the deep core without spinal compression.',
    howTo: ['Lie on back, arms to ceiling, knees 90°', 'Press low back into floor', 'Slowly extend opposite arm and leg', 'Return to start', 'Keep back flat throughout'],
    cues: ['Never let back arch', 'Exhale throughout the rep', 'Move slowly — speed is cheating'],
    injuryBenefit: 'Builds core stability to reduce trunk lean', metricTarget: 'trunkLean' },

  { id: 'bird-dog', name: 'Bird Dog', category: 'Core', muscles: ['Erector Spinae', 'Glutes', 'Core'], difficulty: 'Beginner', equipment: 'None', focus: ['Core', 'Trunk', 'Hip'], emoji: '🦅',
    description: 'Trains spinal stability and co-contraction of core and glutes simultaneously.',
    howTo: ['Start on hands and knees (table-top)', 'Extend opposite arm and leg simultaneously', 'Hold 2 seconds at extension', 'Return and repeat', 'Keep hips level throughout'],
    cues: ['Don\'t hike one hip up', 'Reach long — don\'t hyperextend', 'Level hips and shoulders'],
    injuryBenefit: 'Strengthens trunk for reduced lean and better posture', metricTarget: 'trunkLean' },

  { id: 'cat-cow', name: 'Cat-Cow Stretch', category: 'Mobility', muscles: ['Spinal Erectors', 'Multifidus', 'Rectus Abdominis'], difficulty: 'Beginner', equipment: 'None', focus: ['Trunk', 'Core'], emoji: '🐱',
    description: 'Rhythmic spinal mobilisation — unlocks thoracic range of motion and relieves low back stiffness.',
    howTo: ['Table-top position on hands and knees', 'Inhale — arch back, lift chest and tailbone (cow)', 'Exhale — round spine, tuck chin and pelvis (cat)', 'Flow between slowly', '8-12 cycles'],
    cues: ['Match breath to movement', 'Full range both directions', 'Slow and controlled'],
    injuryBenefit: 'Restores spinal mobility often lost in desk workers', metricTarget: 'trunkLean' },

  // Shoulder
  { id: 'band-external-rotation', name: 'Band External Rotation', category: 'Rehab', muscles: ['Infraspinatus', 'Teres Minor', 'Rotator Cuff'], difficulty: 'Beginner', equipment: 'Resistance Band', focus: ['Shoulder'], emoji: '💪',
    description: 'Primary exercise to strengthen rotator cuff — essential for shoulder health and impingement prevention.',
    howTo: ['Band at elbow height fixed to wall', 'Elbow at 90° tucked at side', 'Rotate forearm outward against band', 'Control back slowly', 'No shoulder shrug'],
    cues: ['Elbow stays pinned at side', 'Full rotation without compensation', 'Slow eccentric'],
    injuryBenefit: 'Prevents and rehabilitates shoulder impingement', metricTarget: 'shoulder' },

  { id: 'wall-slide', name: 'Wall Slide', category: 'Mobility', muscles: ['Serratus Anterior', 'Lower Trap', 'Rotator Cuff'], difficulty: 'Beginner', equipment: 'Wall', focus: ['Shoulder', 'Trunk'], emoji: '🧱',
    description: 'Improves scapular upward rotation and shoulder overhead mobility.',
    howTo: ['Stand with back against wall', 'Arms at 90° (goalpost position)', 'Slide arms up the wall', 'Keep entire arm in contact with wall', 'Lower back to start'],
    cues: ['Don\'t let low back arch', 'Keep wrists on wall', 'Move slowly against stiffness'],
    injuryBenefit: 'Restores scapular mobility needed for pain-free overhead movement', metricTarget: 'shoulder' },

  // Ankle / Lower leg
  { id: 'ankle-rotations', name: 'Ankle Rotations (Alphabet)', category: 'Mobility', muscles: ['Peroneals', 'Tibialis Anterior', 'Gastrocnemius'], difficulty: 'Beginner', equipment: 'None', focus: ['Ankle'], emoji: '🦶',
    description: 'Restore ankle proprioception and range of motion post-sprain or as daily warm-up.',
    howTo: ['Sit or lie, lift one foot off floor', 'Trace the alphabet (A-Z) with your big toe', 'Use full range of motion', 'Complete both feet', 'Do daily for 2-4 weeks post-injury'],
    cues: ['Big movements — use full ankle ROM', 'Don\'t use your whole leg', 'Slow and deliberate'],
    injuryBenefit: 'Restores ankle stability and proprioception after sprains' },

  { id: 'single-leg-calf', name: 'Single-Leg Calf Raise (Eccentric)', category: 'Rehab', muscles: ['Gastrocnemius', 'Soleus'], difficulty: 'Beginner', equipment: 'Step (optional)', focus: ['Ankle', 'Knee'], emoji: '🦿',
    description: 'Eccentric calf loading is clinically proven to treat Achilles tendinopathy.',
    howTo: ['Stand on edge of step on one foot', 'Rise on both feet', 'Lower on single foot slowly (3-5 sec)', 'Repeat for 3×15 daily', 'Do on flat floor if no step'],
    cues: ['Heel below platform at bottom', '3+ second eccentric', 'Go to mild discomfort — not sharp pain'],
    injuryBenefit: 'Clinical gold standard for Achilles tendinopathy' },

  // Power / Plyometric
  { id: 'box-jump', name: 'Box Jump', category: 'Power', muscles: ['Glutes', 'Quadriceps', 'Calves', 'Core'], difficulty: 'Intermediate', equipment: 'Plyometric Box', focus: ['Knee', 'Hip', 'Landing'], emoji: '📦',
    description: 'Develops explosive lower-body power and reactive strength.',
    howTo: ['Stand in front of box, hip-width stance', 'Quarter squat and load hips', 'Explosive jump landing both feet on box', 'Land softly, hips back and down', 'Step down — don\'t jump down'],
    cues: ['Land like a ninja — soft and quiet', 'Stick the landing before moving', 'Full hip lock-out at top'],
    injuryBenefit: 'Tests and trains landing mechanics — pairs with InjuryLens landing analysis', metricTarget: 'kneeValgus' },

  { id: 'rdl', name: 'Romanian Deadlift (RDL)', category: 'Strength', muscles: ['Hamstrings', 'Glutes', 'Erector Spinae'], difficulty: 'Beginner', equipment: 'Barbell / Dumbbells', focus: ['Hip', 'Trunk'], emoji: '🏗️',
    description: 'Hip hinge pattern that builds posterior chain strength and teaches neutral spine under load.',
    howTo: ['Stand holding weight in front of thighs', 'Hinge at hips pushing them back', 'Lower weight down shins, maintaining back flat', 'Feel hamstring stretch at bottom', 'Drive hips forward to return'],
    cues: ['Hinge don\'t squat', 'Bar stays close to body', 'Neutral spine — not rounded'],
    injuryBenefit: 'Trains hip hinge with spinal neutrality — reduces trunk lean patterns', metricTarget: 'trunkLean' },
]

const CATEGORIES = ['All', 'Strength', 'Rehab', 'Core', 'Mobility', 'Activation', 'Power']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']
const FOCUSES = ['All', 'Knee', 'Hip', 'Trunk', 'Core', 'Shoulder', 'Ankle', 'Glute', 'Balance']

const DIFF_COLORS = { Beginner: '#10b981', Intermediate: '#f59e0b', Advanced: '#ef4444' }
const CAT_COLORS  = { Strength: '#4f46e5', Rehab: '#ef4444', Core: '#8b5cf6', Mobility: '#06b6d4', Activation: '#10b981', Power: '#f97316' }

function ExerciseCard({ ex, isFav, onToggleFav }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden border border-border-subtle hover:border-accent-primary/20 transition-all">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: (CAT_COLORS[ex.category] || '#4f46e5') + '12' }}>
          {ex.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-text-primary">{ex.name}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ color: CAT_COLORS[ex.category], background: (CAT_COLORS[ex.category] || '#4f46e5') + '15' }}>{ex.category}</span>
            <span className="text-[10px] font-semibold" style={{ color: DIFF_COLORS[ex.difficulty] }}>{ex.difficulty}</span>
          </div>
          <p className="text-xs text-text-muted mt-0.5 truncate">{ex.muscles.join(', ')}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onToggleFav(ex.id)}
            className={`p-1.5 rounded-lg transition-colors ${isFav ? 'text-red-500 bg-red-50' : 'text-text-muted hover:text-red-400 hover:bg-red-50'}`}>
            <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
          </button>
          <button onClick={() => setExpanded((v) => !v)} className="p-1.5 rounded-lg text-text-muted hover:bg-bg-elevated transition-colors">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-border-subtle">
            <div className="p-4 grid gap-3">
              <p className="text-sm text-text-secondary">{ex.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1.5">How To</p>
                  <ol className="space-y-1">
                    {ex.howTo.map((step, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <span className="font-mono text-accent-primary font-bold flex-shrink-0">{i + 1}.</span>{step}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wide mb-1.5">Form Cues</p>
                  <ul className="space-y-1">
                    {ex.cues.map((c, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1.5">
                        <span className="text-accent-primary flex-shrink-0">→</span>{c}
                      </li>
                    ))}
                  </ul>
                  {ex.injuryBenefit && (
                    <div className="mt-2 px-2 py-1.5 rounded-lg bg-success/8 border border-success/20">
                      <p className="text-[10px] font-bold text-success mb-0.5">Injury Benefit</p>
                      <p className="text-[10px] text-success/80">{ex.injuryBenefit}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] text-text-muted">Equipment: <strong className="text-text-secondary">{ex.equipment}</strong></span>
                {ex.focus.map((f) => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-md bg-bg-elevated text-text-muted">{f}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ExerciseLibraryScreen() {
  const savedPrescriptions    = useStore((s) => s.savedPrescriptions)
  const addPrescription       = useStore((s) => s.addPrescription)
  const togglePrescriptionFav = useStore((s) => s.togglePrescriptionFavorite)
  const deletePrescription    = useStore((s) => s.deletePrescription)

  const [search, setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [diffFilter, setDiffFilter] = useState('All')
  const [focusFilter, setFocusFilter] = useState('All')
  const [showFavsOnly, setShowFavsOnly] = useState(false)

  const favIds = new Set(savedPrescriptions.filter((p) => p.favorite).map((p) => p.exerciseId))

  function toggleFav(exerciseId) {
    const existing = savedPrescriptions.find((p) => p.exerciseId === exerciseId)
    if (existing) {
      togglePrescriptionFav(existing.id)
    } else {
      const ex = EXERCISES.find((e) => e.id === exerciseId)
      if (ex) addPrescription({ exerciseId, name: ex.name, category: ex.category, favorite: true })
    }
  }

  const filtered = useMemo(() => {
    return EXERCISES.filter((ex) => {
      if (search && !ex.name.toLowerCase().includes(search.toLowerCase()) && !ex.muscles.join(' ').toLowerCase().includes(search.toLowerCase())) return false
      if (catFilter !== 'All' && ex.category !== catFilter) return false
      if (diffFilter !== 'All' && ex.difficulty !== diffFilter) return false
      if (focusFilter !== 'All' && !ex.focus.includes(focusFilter)) return false
      if (showFavsOnly && !favIds.has(ex.id)) return false
      return true
    })
  }, [search, catFilter, diffFilter, focusFilter, showFavsOnly, favIds])

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Grid3x3 size={22} className="text-accent-primary" /> Exercise Library
        </h1>
        <p className="text-sm text-text-muted mt-0.5">{EXERCISES.length} evidence-based exercises for rehab and performance</p>

        <div className="relative mt-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises or muscles..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-subtle bg-bg-elevated text-sm text-text-primary focus:outline-none focus:border-accent-primary placeholder-text-muted" />
        </div>
      </motion.div>

      {/* filters */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${catFilter === c ? 'text-white' : 'bg-bg-elevated text-text-muted hover:text-text-primary'}`}
              style={{ background: catFilter === c ? (CAT_COLORS[c] || '#4f46e5') : undefined }}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {DIFFICULTIES.map((d) => (
            <button key={d} onClick={() => setDiffFilter(d)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${diffFilter === d ? 'text-white' : 'bg-bg-elevated text-text-muted hover:text-text-primary'}`}
              style={{ background: diffFilter === d ? (DIFF_COLORS[d] || '#4f46e5') : undefined }}>
              {d}
            </button>
          ))}
          <button onClick={() => setShowFavsOnly((v) => !v)}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${showFavsOnly ? 'bg-red-100 text-red-500' : 'bg-bg-elevated text-text-muted'}`}>
            <Heart size={11} fill={showFavsOnly ? 'currentColor' : 'none'} />Saved ({favIds.size})
          </button>
        </div>
      </div>

      <p className="text-xs text-text-muted mb-3">{filtered.length} exercise{filtered.length !== 1 ? 's' : ''} shown</p>

      {filtered.length === 0 ? (
        <div className="text-center py-14">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-text-muted">No exercises match your filters</p>
          <button onClick={() => { setSearch(''); setCatFilter('All'); setDiffFilter('All'); setFocusFilter('All'); setShowFavsOnly(false) }}
            className="mt-2 text-xs text-accent-primary underline">Clear filters</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} ex={ex} isFav={favIds.has(ex.id)} onToggleFav={toggleFav} />
          ))}
        </div>
      )}
    </div>
  )
}
