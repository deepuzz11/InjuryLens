import React, { useRef, useEffect, useState } from 'react'
import { Ghost } from 'lucide-react'

// Ideal pose keypoints [x, y] in normalized 0–1 space for each movement
// These represent textbook form from a 45° side-view perspective
const IDEAL_POSES = {
  Squat: {
    name: 'Textbook Parallel Squat',
    joints: {
      lShoulder: [0.38, 0.25], rShoulder: [0.62, 0.25],
      lHip:      [0.37, 0.50], rHip:      [0.63, 0.50],
      lKnee:     [0.34, 0.72], rKnee:     [0.66, 0.72],
      lAnkle:    [0.33, 0.90], rAnkle:    [0.67, 0.90],
      head:      [0.50, 0.10],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Knees tracking over toes, chest proud, hips at parallel',
  },
  Deadlift: {
    name: 'Textbook Hip-Hinge Deadlift',
    joints: {
      lShoulder: [0.36, 0.32], rShoulder: [0.64, 0.32],
      lHip:      [0.40, 0.50], rHip:      [0.60, 0.50],
      lKnee:     [0.38, 0.68], rKnee:     [0.62, 0.68],
      lAnkle:    [0.36, 0.88], rAnkle:    [0.64, 0.88],
      head:      [0.50, 0.16],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Neutral spine, hips drive back, bar close to body',
  },
  Lunge: {
    name: 'Textbook Forward Lunge',
    joints: {
      lShoulder: [0.45, 0.22], rShoulder: [0.55, 0.22],
      lHip:      [0.44, 0.42], rHip:      [0.56, 0.42],
      lKnee:     [0.38, 0.62], rKnee:     [0.60, 0.70],
      lAnkle:    [0.36, 0.88], rAnkle:    [0.62, 0.90],
      head:      [0.50, 0.10],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Front knee over ankle, torso upright, rear knee near floor',
  },
  Running: {
    name: 'Ideal Running Gait',
    joints: {
      lShoulder: [0.43, 0.22], rShoulder: [0.57, 0.22],
      lHip:      [0.44, 0.44], rHip:      [0.56, 0.44],
      lKnee:     [0.40, 0.62], rKnee:     [0.62, 0.55],
      lAnkle:    [0.38, 0.84], rAnkle:    [0.64, 0.74],
      head:      [0.50, 0.10],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Forward lean from ankles, knees lift forward, minimal valgus',
  },
  'Jump Landing': {
    name: 'Safe Jump Landing',
    joints: {
      lShoulder: [0.39, 0.24], rShoulder: [0.61, 0.24],
      lHip:      [0.40, 0.46], rHip:      [0.60, 0.46],
      lKnee:     [0.38, 0.64], rKnee:     [0.62, 0.64],
      lAnkle:    [0.37, 0.86], rAnkle:    [0.63, 0.86],
      head:      [0.50, 0.11],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Soft knees on contact, hips back, no valgus collapse, equal bilateral load',
  },
  'Push-up': {
    name: 'Textbook Push-up',
    joints: {
      lShoulder: [0.36, 0.35], rShoulder: [0.64, 0.35],
      lHip:      [0.38, 0.52], rHip:      [0.62, 0.52],
      lKnee:     [0.39, 0.68], rKnee:     [0.61, 0.68],
      lAnkle:    [0.40, 0.84], rAnkle:    [0.60, 0.84],
      head:      [0.50, 0.22],
      lElbow:    [0.28, 0.44], rElbow:    [0.72, 0.44],
      lWrist:    [0.22, 0.54], rWrist:    [0.78, 0.54],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
      ['lShoulder','lElbow'],['lElbow','lWrist'],
      ['rShoulder','rElbow'],['rElbow','rWrist'],
    ],
    cue: 'Rigid plank from head to heel, elbows at 45°, no hip sag or piking',
  },
  Plank: {
    name: 'Ideal Plank Hold',
    joints: {
      lShoulder: [0.37, 0.38], rShoulder: [0.63, 0.38],
      lHip:      [0.39, 0.52], rHip:      [0.61, 0.52],
      lKnee:     [0.40, 0.68], rKnee:     [0.60, 0.68],
      lAnkle:    [0.41, 0.84], rAnkle:    [0.59, 0.84],
      head:      [0.50, 0.26],
      lElbow:    [0.28, 0.50], rElbow:    [0.72, 0.50],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
      ['lShoulder','lElbow'],['rShoulder','rElbow'],
    ],
    cue: 'Neutral spine throughout — no hip sag or elevation; gaze at floor',
  },
  'Hip Hinge': {
    name: 'Ideal Hip Hinge',
    joints: {
      lShoulder: [0.35, 0.36], rShoulder: [0.65, 0.36],
      lHip:      [0.42, 0.52], rHip:      [0.58, 0.52],
      lKnee:     [0.40, 0.68], rKnee:     [0.60, 0.68],
      lAnkle:    [0.38, 0.88], rAnkle:    [0.62, 0.88],
      head:      [0.50, 0.20],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Hips pushed back, neutral spine, soft knees — "shut the car door with your hips"',
  },
  'Overhead Press': {
    name: 'Textbook Overhead Press',
    joints: {
      lShoulder: [0.37, 0.30], rShoulder: [0.63, 0.30],
      lHip:      [0.38, 0.52], rHip:      [0.62, 0.52],
      lKnee:     [0.36, 0.72], rKnee:     [0.64, 0.72],
      lAnkle:    [0.34, 0.90], rAnkle:    [0.66, 0.90],
      head:      [0.50, 0.14],
      lElbow:    [0.28, 0.20], rElbow:    [0.72, 0.20],
      lWrist:    [0.28, 0.08], rWrist:    [0.72, 0.08],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
      ['lShoulder','lElbow'],['lElbow','lWrist'],
      ['rShoulder','rElbow'],['rElbow','rWrist'],
    ],
    cue: 'Bar directly overhead, neutral spine, no excessive lumbar extension',
  },
  'Lateral Lunge': {
    name: 'Textbook Lateral Lunge',
    joints: {
      lShoulder: [0.44, 0.22], rShoulder: [0.56, 0.22],
      lHip:      [0.43, 0.42], rHip:      [0.60, 0.42],
      lKnee:     [0.36, 0.62], rKnee:     [0.64, 0.55],
      lAnkle:    [0.34, 0.88], rAnkle:    [0.70, 0.82],
      head:      [0.50, 0.10],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Stepping knee tracks over toes, torso upright, straight trailing leg',
  },
  'Split Squat': {
    name: 'Textbook Split Squat',
    joints: {
      lShoulder: [0.45, 0.21], rShoulder: [0.55, 0.21],
      lHip:      [0.44, 0.41], rHip:      [0.56, 0.41],
      lKnee:     [0.38, 0.60], rKnee:     [0.58, 0.72],
      lAnkle:    [0.36, 0.86], rAnkle:    [0.60, 0.90],
      head:      [0.50, 0.09],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Front knee over ankle, torso vertical, rear knee 1–2 cm from floor',
  },
  'Bench Press': {
    name: 'Textbook Bench Press',
    joints: {
      lShoulder: [0.34, 0.38], rShoulder: [0.66, 0.38],
      lHip:      [0.38, 0.54], rHip:      [0.62, 0.54],
      lKnee:     [0.39, 0.70], rKnee:     [0.61, 0.70],
      lAnkle:    [0.40, 0.86], rAnkle:    [0.60, 0.86],
      head:      [0.50, 0.24],
      lElbow:    [0.22, 0.44], rElbow:    [0.78, 0.44],
      lWrist:    [0.22, 0.30], rWrist:    [0.78, 0.30],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
      ['lShoulder','lElbow'],['lElbow','lWrist'],
      ['rShoulder','rElbow'],['rElbow','rWrist'],
    ],
    cue: 'Elbows at ~45–75°, scapulae retracted, feet flat, slight arch without excessive lumbar extension',
  },
  default: {
    name: 'Ideal Reference Form',
    joints: {
      lShoulder: [0.38, 0.28], rShoulder: [0.62, 0.28],
      lHip:      [0.38, 0.52], rHip:      [0.62, 0.52],
      lKnee:     [0.36, 0.72], rKnee:     [0.64, 0.72],
      lAnkle:    [0.34, 0.90], rAnkle:    [0.66, 0.90],
      head:      [0.50, 0.12],
    },
    connections: [
      ['lShoulder','rShoulder'],['lShoulder','lHip'],['rShoulder','rHip'],
      ['lHip','rHip'],['lHip','lKnee'],['rHip','rKnee'],
      ['lKnee','lAnkle'],['rKnee','rAnkle'],
      ['lShoulder','head'],['rShoulder','head'],
    ],
    cue: 'Neutral alignment — reference for ideal posture',
  },
}

export default function GhostOverlay({ movementType, imageSrc, show }) {
  const canvasRef  = useRef(null)
  const imageRef   = useRef(null)
  const [enabled, setEnabled] = useState(show ?? true)

  const pose = IDEAL_POSES[movementType] ?? IDEAL_POSES.default

  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || !enabled) return

    const canvas = canvasRef.current
    const img    = imageRef.current
    const ctx    = canvas.getContext('2d')

    const drawOverlay = () => {
      canvas.width  = img.naturalWidth  || img.width  || 400
      canvas.height = img.naturalHeight || img.height || 300
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const w = canvas.width
      const h = canvas.height

      const resolve = (key) => {
        const [nx, ny] = pose.joints[key]
        return { x: nx * w, y: ny * h }
      }

      // Draw connections
      ctx.lineWidth   = 3
      ctx.strokeStyle = 'rgba(99,220,255,0.55)'
      ctx.lineCap     = 'round'
      for (const [a, b] of pose.connections) {
        const pa = resolve(a)
        const pb = resolve(b)
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      }

      // Draw joints
      ctx.fillStyle = 'rgba(99,220,255,0.75)'
      for (const key of Object.keys(pose.joints)) {
        const p = resolve(key)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Label
      ctx.font      = 'bold 11px system-ui'
      ctx.fillStyle = 'rgba(99,220,255,0.85)'
      ctx.fillText('◈ Ideal Form', 8, 18)
    }

    if (img.complete) drawOverlay()
    else img.addEventListener('load', drawOverlay)
    return () => img.removeEventListener('load', drawOverlay)
  }, [enabled, movementType, imageSrc])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setEnabled((e) => !e)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all ${enabled ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'border-border-subtle text-text-muted hover:text-text-secondary'}`}
        >
          <Ghost size={11} /> {enabled ? 'Ghost Overlay ON' : 'Show Ideal Form'}
        </button>
        {enabled && <span className="text-[10px] text-cyan-400/70">{pose.name}</span>}
      </div>

      <div className="relative rounded-xl overflow-hidden border border-border-subtle">
        <img
          ref={imageRef}
          src={`data:image/png;base64,${imageSrc}`}
          alt="Annotated frame"
          className="w-full object-cover"
        />
        {enabled && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </div>

      {enabled && (
        <p className="text-[10px] text-cyan-400/80 italic flex items-center gap-1">
          <Ghost size={9} /> {pose.cue}
        </p>
      )}
    </div>
  )
}
