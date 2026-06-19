import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity } from 'lucide-react'

const STEPS = [
  { label: 'Initializing pose detection engine',      detail: 'MediaPipe 33-landmark model ready'         },
  { label: 'Extracting body landmarks per frame',     detail: 'Tracking joints frame-by-frame'            },
  { label: 'Running knee valgus analysis',            detail: 'Left & right stability metrics'            },
  { label: 'Checking trunk alignment',                detail: 'Forward lean & posture angle'              },
  { label: 'Detecting left-right asymmetry',          detail: 'Comparing joint angles bilaterally'        },
  { label: 'Scoring biomechanical risk factors',      detail: '6-metric risk assessment complete'         },
  { label: 'Analyzing fatigue patterns',              detail: 'First vs. second-half form quality'        },
  { label: 'Consulting AI physiotherapy model',       detail: 'Gemini 2.0 Flash generating insights'     },
  { label: 'Building your personalized coaching plan', detail: 'Training program & cue generation'       },
]

const JOINTS = [
  { id: 'head',      cx: 50, cy: 8,  r: 5   },
  { id: 'neck',      cx: 50, cy: 15, r: 2.5 },
  { id: 'lshoulder', cx: 38, cy: 22, r: 3   },
  { id: 'rshoulder', cx: 62, cy: 22, r: 3   },
  { id: 'lelbow',    cx: 31, cy: 34, r: 2.5 },
  { id: 'relbow',    cx: 69, cy: 34, r: 2.5 },
  { id: 'lwrist',    cx: 27, cy: 45, r: 2   },
  { id: 'rwrist',    cx: 73, cy: 45, r: 2   },
  { id: 'lhip',      cx: 42, cy: 48, r: 3   },
  { id: 'rhip',      cx: 58, cy: 48, r: 3   },
  { id: 'lknee',     cx: 40, cy: 65, r: 2.5 },
  { id: 'rknee',     cx: 60, cy: 65, r: 2.5 },
  { id: 'lankle',    cx: 38, cy: 80, r: 2   },
  { id: 'rankle',    cx: 62, cy: 80, r: 2   },
]

const BONES = [
  ['neck', 'lshoulder'], ['neck', 'rshoulder'],
  ['lshoulder', 'lelbow'], ['lelbow', 'lwrist'],
  ['rshoulder', 'relbow'], ['relbow', 'rwrist'],
  ['lshoulder', 'lhip'], ['rshoulder', 'rhip'],
  ['lhip', 'rhip'],
  ['lhip', 'lknee'], ['lknee', 'lankle'],
  ['rhip', 'rknee'], ['rknee', 'rankle'],
]

function getJoint(id) {
  return JOINTS.find((j) => j.id === id)
}

function SkeletonFigure({ litJoint }) {
  return (
    <svg
      viewBox="0 0 100 88"
      width="130"
      height="130"
      aria-label="Animated human skeleton being scanned"
      role="img"
    >
      {/* Bone glow layer */}
      {BONES.map(([a, b], i) => {
        const ja = getJoint(a)
        const jb = getJoint(b)
        if (!ja || !jb) return null
        return (
          <line
            key={`glow-${i}`}
            x1={ja.cx} y1={ja.cy}
            x2={jb.cx} y2={jb.cy}
            stroke="rgba(79,70,229,0.14)"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )
      })}

      {/* Bones */}
      {BONES.map(([a, b], i) => {
        const ja = getJoint(a)
        const jb = getJoint(b)
        if (!ja || !jb) return null
        return (
          <line
            key={i}
            x1={ja.cx} y1={ja.cy}
            x2={jb.cx} y2={jb.cy}
            stroke="rgba(79,70,229,0.28)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        )
      })}

      {/* Joints */}
      {JOINTS.map((j, i) => {
        const isLit  = i === litJoint
        const wasLit = i === (litJoint - 1 + JOINTS.length) % JOINTS.length
        return (
          <g key={j.id}>
            {isLit && (
              <circle cx={j.cx} cy={j.cy} r={j.r + 6} fill="rgba(79,70,229,0.20)">
                <animate attributeName="r"       from={j.r + 4} to={j.r + 11} dur="0.4s" fill="freeze" />
                <animate attributeName="opacity" from="0.55"    to="0"         dur="0.6s" fill="freeze" />
              </circle>
            )}
            <circle
              cx={j.cx} cy={j.cy} r={j.r}
              fill={isLit ? '#4f46e5' : wasLit ? 'rgba(79,70,229,0.62)' : 'rgba(79,70,229,0.30)'}
              style={{ transition: 'fill 0.15s ease' }}
            />
          </g>
        )
      })}
    </svg>
  )
}

export default function LoadingScreen() {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress,  setProgress]  = useState(0)
  const [litJoint,  setLitJoint]  = useState(0)

  useEffect(() => {
    const t = setInterval(
      () => setStepIndex((p) => Math.min(p + 1, STEPS.length - 1)),
      2600,
    )
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(
      () => setLitJoint((p) => (p + 1) % JOINTS.length),
      175,
    )
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const start    = Date.now()
    const DURATION = 14000
    let rafId
    const tick = () => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 95, 95)
      setProgress(pct)
      if (pct < 95) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const currentStep = STEPS[stepIndex]

  return (
    <div className="min-h-screen mesh-bg flex flex-col overflow-hidden">

      {/* Top progress strip */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-bg-elevated z-50 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary"
          style={{ width: `${progress}%`, backgroundSize: '200% 100%' }}
          transition={{ duration: 0.12, ease: 'linear' }}
        />
      </div>

      {/* Mini navbar */}
      <div
        className="h-16 flex items-center px-6 flex-shrink-0 border-b border-border-subtle"
        style={{
          background: 'rgba(248,250,252,0.92)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
          borderBottom: '1px solid rgba(15,23,42,0.07)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center
                          bg-gradient-to-br from-accent-primary to-accent-secondary
                          shadow-lg shadow-accent-primary/20">
            <Activity size={17} className="text-white relative z-10" aria-hidden />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/15 pointer-events-none" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold gradient-text tracking-tight">InjuryLens</p>
            <p className="text-[10px] text-text-muted mt-0.5 tracking-wide">AI Movement Analysis</p>
          </div>
        </div>
      </div>

      {/* Main centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative">

        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute rounded-full bg-accent-primary/6 blur-3xl animate-float-orb"
            style={{ width: 400, height: 400, top: '15%', left: '15%', animationDelay: '0s' }}
          />
          <div
            className="absolute rounded-full bg-accent-secondary/5 blur-3xl animate-float-orb"
            style={{ width: 300, height: 300, bottom: '20%', right: '20%', animationDelay: '3.5s' }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-8 relative z-10"
        >

          {/* Rotating rings + skeleton */}
          <div className="relative w-56 h-56 flex items-center justify-center">

            {/* Outermost ring — slow clockwise */}
            <div
              className="absolute inset-0 rounded-full ring-rotate"
              style={{ border: '1.5px solid rgba(79,70,229,0.18)' }}
            />

            {/* Dashed ring — counter-clockwise */}
            <div
              className="absolute inset-4 rounded-full counter-rotate"
              style={{ border: '1.5px dashed rgba(124,58,237,0.22)' }}
            />

            {/* Glow ring — pulsing */}
            <div
              className="absolute inset-10 rounded-full glow-pulse"
              style={{ border: '1.5px solid rgba(79,70,229,0.28)' }}
            />

            {/* Accent dots at cardinal positions on outer ring */}
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                className="absolute w-1.5 h-1.5 rounded-full bg-accent-primary/70"
                style={{
                  top: '50%',
                  left: '50%',
                  transformOrigin: '0 0',
                  transform: `rotate(${deg}deg) translateX(106px) translateY(-50%)`,
                  animation: `pulseDot 2s ease-in-out ${deg * 0.005}s infinite`,
                }}
              />
            ))}

            {/* Skeleton figure */}
            <div className="relative z-10">
              <SkeletonFigure litJoint={litJoint} />
            </div>
          </div>

          {/* Step label */}
          <div className="text-center h-12 flex flex-col items-center justify-center gap-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32 }}
                className="flex flex-col items-center gap-1"
              >
                <p className="text-sm font-semibold text-text-primary tracking-tight">
                  {currentStep.label}
                </p>
                <p className="text-[11px] text-text-muted">{currentStep.detail}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-muted">Step {stepIndex + 1} / {STEPS.length}</span>
              <span className="font-mono font-semibold text-accent-primary">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-bg-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-secondary"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.12 }}
              />
            </div>
          </div>

          {/* Step progress dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width:           i === stepIndex ? 16 : 6,
                  backgroundColor:
                    i === stepIndex ? '#4f46e5'
                    : i < stepIndex  ? 'rgba(79,70,229,0.48)'
                                     : 'rgba(15,23,42,0.12)',
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </motion.div>

        <p className="mt-14 text-xs text-text-muted text-center max-w-xs leading-relaxed relative z-10">
          Analyzing your biomechanics with AI — this usually takes 10–25 seconds
          depending on video length and server load.
        </p>
      </div>
    </div>
  )
}
