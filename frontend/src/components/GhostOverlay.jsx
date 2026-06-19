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
