import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MESSAGES = [
  'Initializing pose detection engine…',
  'Extracting 33 body landmarks per frame…',
  'Running knee valgus analysis…',
  'Checking trunk alignment…',
  'Detecting left-right asymmetry…',
  'Scoring biomechanical risk factors…',
  'Consulting AI physiotherapy model…',
  'Building your personalized coaching plan…',
  'Almost ready…',
]

// SVG skeleton joint positions (normalized 0-1 coords for a humanoid figure)
const JOINTS = [
  { id: 'head',       cx: 50,  cy: 8,  r: 5   },
  { id: 'neck',       cx: 50,  cy: 15, r: 2.5 },
  { id: 'lshoulder',  cx: 38,  cy: 22, r: 3   },
  { id: 'rshoulder',  cx: 62,  cy: 22, r: 3   },
  { id: 'lelbow',     cx: 31,  cy: 34, r: 2.5 },
  { id: 'relbow',     cx: 69,  cy: 34, r: 2.5 },
  { id: 'lwrist',     cx: 27,  cy: 45, r: 2   },
  { id: 'rwrist',     cx: 73,  cy: 45, r: 2   },
  { id: 'lhip',       cx: 42,  cy: 48, r: 3   },
  { id: 'rhip',       cx: 58,  cy: 48, r: 3   },
  { id: 'lknee',      cx: 40,  cy: 65, r: 2.5 },
  { id: 'rknee',      cx: 60,  cy: 65, r: 2.5 },
  { id: 'lankle',     cx: 38,  cy: 80, r: 2   },
  { id: 'rankle',     cx: 62,  cy: 80, r: 2   },
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

function SkeletonFigure() {
  const [litJoint, setLitJoint] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setLitJoint((prev) => (prev + 1) % JOINTS.length)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  // viewBox: 0 0 100 88
  return (
    <svg
      viewBox="0 0 100 88"
      width="160"
      height="160"
      aria-label="Animated human skeleton being scanned"
      role="img"
    >
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
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        )
      })}
      {/* Joints */}
      {JOINTS.map((j, i) => {
        const isLit = i === litJoint
        const wasLit = i === (litJoint - 1 + JOINTS.length) % JOINTS.length
        return (
          <g key={j.id}>
            {isLit && (
              <circle
                cx={j.cx} cy={j.cy}
                r={j.r + 5}
                fill="rgba(99,102,241,0.2)"
              >
                <animate attributeName="r" from={j.r + 3} to={j.r + 8} dur="0.3s" fill="freeze" />
                <animate attributeName="opacity" from="0.6" to="0" dur="0.6s" fill="freeze" />
              </circle>
            )}
            <circle
              cx={j.cx} cy={j.cy} r={j.r}
              fill={isLit ? '#6366f1' : wasLit ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.3)'}
              style={{ transition: 'fill 0.2s ease' }}
            />
          </g>
        )
      })}
      {/* Head circle */}
      <circle cx="50" cy="5.5" r="4.5" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="1.2" />
    </svg>
  )
}

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => Math.min(prev + 1, MESSAGES.length - 1))
    }, 2500)
    return () => clearInterval(msgTimer)
  }, [])

  useEffect(() => {
    const start = Date.now()
    const DURATION = 15000

    const frame = () => {
      const elapsed = Date.now() - start
      const pct = Math.min((elapsed / DURATION) * 95, 95)
      setProgress(pct)
      if (pct < 95) requestAnimationFrame(frame)
    }
    const raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="min-h-screen mesh-bg flex flex-col">
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-bg-elevated z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Navbar placeholder */}
      <div className="h-16 border-b border-border-subtle bg-bg-base/80 backdrop-blur-xl flex items-center px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L8 14M4 6L12 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-lg font-bold gradient-text tracking-tight">InjuryLens</span>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Glow behind figure */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 300,
            height: 300,
            background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-8 relative"
        >
          {/* Skeleton figure */}
          <div className="w-48 h-48 flex items-center justify-center">
            <SkeletonFigure />
          </div>

          {/* Scanning ring */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full border border-accent-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full border border-accent-primary/10" />

          {/* Status message */}
          <div className="h-8 flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="text-sm text-text-secondary text-center font-medium"
              >
                {MESSAGES[msgIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress percentage */}
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <div className="w-full h-1 bg-bg-elevated rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="font-mono text-xs text-text-muted">
              {Math.round(progress)}% complete
            </span>
          </div>

          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-accent-primary/40"
                style={{ animation: `pulseDot 1.5s ease-in-out ${i * 0.3}s infinite` }}
              />
            ))}
          </div>
        </motion.div>

        <p className="mt-12 text-xs text-text-muted text-center max-w-sm">
          Analyzing your biomechanics with AI. This typically takes 10–25 seconds
          depending on video length and server load.
        </p>
      </div>
    </div>
  )
}
