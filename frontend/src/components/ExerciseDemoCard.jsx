import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Play, ExternalLink, Dumbbell } from 'lucide-react'

// Motion cues for common exercises — animated with CSS keyframes
const EXERCISE_CUES = {
  'Glute Bridge': {
    muscles: 'Glutes, Hamstrings',
    phases: ['Lie on back, knees bent, feet flat', 'Drive hips up until body is straight', 'Squeeze glutes at top for 2s', 'Lower slowly with control'],
    keyPoints: 'Keep core braced. Avoid hyperextending the lower back at the top.',
    emoji: '🍑',
  },
  'Clamshell': {
    muscles: 'Glute Med, Hip External Rotators',
    phases: ['Side-lying, hips stacked at 45°', 'Keep feet together', 'Rotate top knee toward ceiling', 'Lower with control — do not rock pelvis'],
    keyPoints: 'Pelvis stays still. Feel the burn in the side of your hip, not your back.',
    emoji: '🦪',
  },
  'Nordic Curl': {
    muscles: 'Hamstrings (eccentric)',
    phases: ['Kneel with feet anchored', 'Lower torso toward floor as slowly as possible', 'Catch with hands at the bottom', 'Use arms to push back to start'],
    keyPoints: 'Eccentric phase is the training stimulus. Slower = better.',
    emoji: '🦵',
  },
  'Hip Hinge': {
    muscles: 'Hamstrings, Glutes, Spinal Erectors',
    phases: ['Stand hip-width apart, soft knees', 'Hinge at hips — push them back', 'Maintain neutral spine throughout', 'Drive hips forward to stand'],
    keyPoints: 'Think "closing a drawer with your hips" not bending over.',
    emoji: '⬇️',
  },
  'Dead Bug': {
    muscles: 'Deep Core, Transverse Abdominis',
    phases: ['Lie on back, arms to ceiling, legs table-top', 'Press lower back INTO floor', 'Lower opposite arm/leg simultaneously', 'Return and alternate sides'],
    keyPoints: 'If your back arches off the floor, you have gone too far.',
    emoji: '🐛',
  },
  'Single Leg Squat': {
    muscles: 'Quads, Glutes, Stabilizers',
    phases: ['Stand on one leg, arms forward', 'Sit back into the hip', 'Knee tracks over 2nd toe', 'Push through heel to stand'],
    keyPoints: 'Use a chair behind you as a target initially.',
    emoji: '🦶',
  },
  'Band Walk': {
    muscles: 'Glute Med, Hip Abductors',
    phases: ['Place band above knees, squat position', 'Step sideways maintaining squat depth', 'Keep knees pushed out against band', 'Control each step, no knee cave'],
    keyPoints: '10 steps each direction = 1 set.',
    emoji: '🎀',
  },
  'default': {
    muscles: 'Full body',
    phases: ['Set up in correct starting position', 'Brace your core throughout', 'Perform movement with control', 'Return to start with control'],
    keyPoints: 'Quality over quantity. Stop if form breaks down.',
    emoji: '💪',
  },
}

function AnimatedPhaseDots({ phases, active }) {
  return (
    <div className="flex gap-1 mt-1">
      {phases.map((_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= active ? 'bg-accent-primary' : 'bg-bg-elevated'}`} />
      ))}
    </div>
  )
}

export default function ExerciseDemoCard({ exercise, index }) {
  const [expanded, setExpanded]     = useState(false)
  const [phaseIdx, setPhaseIdx]     = useState(0)
  const [playing, setPlaying]       = useState(false)
  const timerRef = React.useRef(null)

  const name   = exercise?.name ?? 'Exercise'
  const cue    = EXERCISE_CUES[name] ?? EXERCISE_CUES.default
  const phases = cue.phases

  const searchQuery = encodeURIComponent(`how to do ${name} exercise form tutorial`)
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`

  const startAnimation = () => {
    if (playing) return
    setPlaying(true)
    setPhaseIdx(0)
    let i = 0
    timerRef.current = setInterval(() => {
      i++
      if (i >= phases.length) {
        clearInterval(timerRef.current)
        setPlaying(false)
        setPhaseIdx(0)
      } else {
        setPhaseIdx(i)
      }
    }, 1800)
  }

  React.useEffect(() => () => clearInterval(timerRef.current), [])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border-subtle overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-3 bg-bg-elevated">
        <div className="w-9 h-9 rounded-xl bg-accent-primary/15 flex items-center justify-center text-xl flex-shrink-0">
          {cue.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-text-primary truncate">{name}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/20 flex-shrink-0">
              {exercise?.sets_reps}
            </span>
          </div>
          <span className="text-xs text-text-muted">{cue.muscles}</span>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
        >
          <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Why it works */}
      <div className="px-3 py-2 border-t border-border-subtle">
        <p className="text-xs text-text-muted italic leading-relaxed">{exercise?.why}</p>
      </div>

      {/* Expandable demo section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border-subtle"
          >
            <div className="p-3 flex flex-col gap-3">
              {/* Phase walkthrough */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-text-secondary">How to perform:</p>
                  <button
                    onClick={startAnimation}
                    disabled={playing}
                    className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-accent-primary/15 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary/25 transition-all disabled:opacity-50"
                  >
                    <Play size={9} />{playing ? 'Animating…' : 'Animate steps'}
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {phases.map((phase, i) => (
                    <div
                      key={i}
                      className={`flex gap-2 items-start text-xs transition-all duration-300 ${playing && i === phaseIdx ? 'text-accent-primary font-medium' : 'text-text-muted'}`}
                    >
                      <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors ${playing && i === phaseIdx ? 'bg-accent-primary text-white' : 'bg-bg-elevated text-text-muted'}`}>
                        {i + 1}
                      </span>
                      {phase}
                    </div>
                  ))}
                </div>
                {playing && <AnimatedPhaseDots phases={phases} active={phaseIdx} />}
              </div>

              {/* Key point */}
              <div className="p-2 rounded-xl bg-warning/8 border border-warning/15">
                <p className="text-xs text-warning/80 leading-relaxed">💡 {cue.keyPoints}</p>
              </div>

              {/* YouTube search link */}
              <a
                href={ytSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                <ExternalLink size={11} />Watch video demos for "{name}"
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
