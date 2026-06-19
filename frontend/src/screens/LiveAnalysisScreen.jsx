import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Video, Square, AlertTriangle, Activity, RotateCcw, Zap } from 'lucide-react'
import { useStore } from '../store'
import Navbar from '../components/Navbar'

// MediaPipe pose connections for skeleton drawing
const POSE_CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],  // arms
  [11,23],[12,24],[23,24],                  // torso
  [23,25],[25,27],[24,26],[26,28],          // legs
  [27,29],[29,31],[28,30],[30,32],          // feet
]

// Color thresholds for risk feedback
function riskColor(angle, threshold, inverted = false) {
  const bad = inverted ? angle > threshold : angle < threshold
  if (bad) return '#ef4444'
  const margin = inverted ? threshold * 0.9 : threshold * 1.05
  const warn = inverted ? angle > margin : angle < margin
  return warn ? '#f59e0b' : '#22c55e'
}

function calcAngle(a, b, c) {
  if (!a || !b || !c) return 0
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let deg = Math.abs(rad * (180 / Math.PI))
  if (deg > 180) deg = 360 - deg
  return Math.round(deg)
}

function countReps(angleHistory) {
  if (angleHistory.length < 10) return 0
  const min = Math.min(...angleHistory)
  const max = Math.max(...angleHistory)
  if (max - min < 15) return 0
  const threshold = min + (max - min) * 0.35
  let count = 0, inValley = false
  for (const a of angleHistory) {
    if (a < threshold) { if (!inValley) { inValley = true; count++ } }
    else { inValley = false }
  }
  return count
}

export default function LiveAnalysisScreen() {
  const setScreen = useStore((s) => s.setScreen)
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const landmarkerRef = useRef(null)
  const animFrameRef  = useRef(null)
  const streamRef     = useRef(null)
  const angleHistRef  = useRef([])

  const [status,   setStatus]   = useState('initializing') // initializing | ready | running | error
  const [metrics,  setMetrics]  = useState(null)
  const [repCount, setRepCount] = useState(0)
  const [riskFlag, setRiskFlag] = useState(null)
  const [movement, setMovement] = useState('Squat')

  const MOVEMENT_THRESHOLDS = {
    Squat:        { valgus: 165, trunk: 30 },
    Deadlift:     { valgus: 168, trunk: 45 },
    Lunge:        { valgus: 163, trunk: 15 },
    Running:      { valgus: 168, trunk: 15 },
    'Jump Landing':{ valgus: 160, trunk: 30 },
    'Push-up':    { valgus: 170, trunk: 10 },
  }

  // Load MediaPipe PoseLandmarker from CDN WASM
  useEffect(() => {
    let cancelled = false

    async function loadLandmarker() {
      try {
        const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        )
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
        if (!cancelled) {
          landmarkerRef.current = landmarker
          setStatus('ready')
        }
      } catch (err) {
        if (!cancelled) setStatus('error')
        console.error('Failed to load MediaPipe PoseLandmarker:', err)
      }
    }

    loadLandmarker()
    return () => { cancelled = true }
  }, [])

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStatus('ready')
  }, [])

  const startCamera = useCallback(async () => {
    if (status !== 'ready') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRef.current = stream
      const video = videoRef.current
      video.srcObject = stream
      await video.play()
      setStatus('running')
      angleHistRef.current = []
      detectLoop()
    } catch (err) {
      console.error('Camera error:', err)
      setStatus('error')
    }
  }, [status])

  function detectLoop() {
    const video    = videoRef.current
    const canvas   = canvasRef.current
    if (!video || !canvas || !landmarkerRef.current) return

    const ctx  = canvas.getContext('2d')
    const lmkr = landmarkerRef.current
    const thresh = MOVEMENT_THRESHOLDS[movement] ?? MOVEMENT_THRESHOLDS.Squat

    let lastTime = -1

    function frame(now) {
      animFrameRef.current = requestAnimationFrame(frame)
      if (video.readyState < 2) return
      const ts = now
      if (Math.abs(ts - lastTime) < 30) return // cap at ~30 fps for perf
      lastTime = ts

      canvas.width  = video.videoWidth  || 640
      canvas.height = video.videoHeight || 480

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const result = lmkr.detectForVideo(video, ts)
      if (!result.landmarks || result.landmarks.length === 0) return

      const lm = result.landmarks[0]
      const w  = canvas.width
      const h  = canvas.height

      // Scale landmark to canvas pixels
      const pt = (idx) => ({ x: lm[idx].x * w, y: lm[idx].y * h })

      // Draw skeleton connections
      ctx.lineWidth = 2
      for (const [a, b] of POSE_CONNECTIONS) {
        const pa = pt(a), pb = pt(b)
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.stroke()
      }

      // Draw joints
      for (let i = 0; i < lm.length; i++) {
        const p = pt(i)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#6366f1'
        ctx.fill()
      }

      // Calculate key angles
      const leftKnee  = calcAngle(pt(23), pt(25), pt(27))
      const rightKnee = calcAngle(pt(24), pt(26), pt(28))
      const midHipX   = (lm[23].x + lm[24].x) / 2
      const midHipY   = (lm[23].y + lm[24].y) / 2
      const midShX    = (lm[11].x + lm[12].x) / 2
      const midShY    = (lm[11].y + lm[12].y) / 2
      const torsoVecX = midShX - midHipX
      const torsoVecY = midShY - midHipY
      const len = Math.sqrt(torsoVecX ** 2 + torsoVecY ** 2) || 1
      const trunkLean = Math.round(Math.acos(Math.max(-1, Math.min(1, -torsoVecY / len))) * 180 / Math.PI)

      const lKneeColor = riskColor(leftKnee, thresh.valgus)
      const rKneeColor = riskColor(rightKnee, thresh.valgus)
      const trunkColor = riskColor(trunkLean, thresh.trunk, true)

      // Draw angle labels on canvas
      function label(text, px, py, color) {
        ctx.font = 'bold 13px monospace'
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(px - 2, py - 14, ctx.measureText(text).width + 6, 18)
        ctx.fillStyle = color
        ctx.fillText(text, px + 1, py)
      }
      label(`L.Knee: ${leftKnee}°`,  pt(25).x + 8, pt(25).y,       lKneeColor)
      label(`R.Knee: ${rightKnee}°`, pt(26).x + 8, pt(26).y,       rKneeColor)
      label(`Trunk: ${trunkLean}°`,  pt(11).x + 8, pt(11).y - 10,  trunkColor)

      // Overlay risk status bar
      const isRisky = leftKnee < thresh.valgus || rightKnee < thresh.valgus || trunkLean > thresh.trunk
      setRiskFlag(isRisky ? 'High' : null)

      // Rep counting
      const meanKnee = (leftKnee + rightKnee) / 2
      angleHistRef.current.push(meanKnee)
      if (angleHistRef.current.length > 300) angleHistRef.current.shift()
      const reps = countReps(angleHistRef.current)
      setRepCount(reps)

      setMetrics({ leftKnee, rightKnee, trunkLean, lKneeColor, rKneeColor, trunkColor })
    }

    animFrameRef.current = requestAnimationFrame(frame)
  }

  useEffect(() => () => stopCamera(), [])

  return (
    <div className="min-h-screen mesh-bg pb-20">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Video size={22} className="text-accent-primary" /> Live Analysis
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">Real-time pose detection with in-browser MediaPipe WASM</p>
            </div>
            <div className="flex gap-2">
              <select
                value={movement}
                onChange={(e) => { setMovement(e.target.value); angleHistRef.current = [] }}
                className="px-3 py-2 rounded-xl glass border border-border-subtle text-sm text-text-primary bg-transparent focus:outline-none"
              >
                {Object.keys(MOVEMENT_THRESHOLDS).map((m) => <option key={m}>{m}</option>)}
              </select>
              {status === 'running'
                ? <button onClick={stopCamera} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/15 border border-danger/30 text-danger text-sm hover:bg-danger/25 transition-all"><Square size={14} />Stop</button>
                : <button onClick={startCamera} disabled={status !== 'ready'} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm disabled:opacity-50 hover:brightness-110 transition-all"><Video size={14} />{status === 'initializing' ? 'Loading…' : status === 'error' ? 'Error' : 'Start Camera'}</button>
              }
              <button onClick={() => setScreen('upload')} className="px-4 py-2 rounded-xl glass border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all"><RotateCcw size={14} /></button>
            </div>
          </div>

          {/* Status bar */}
          {status === 'initializing' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-accent-primary/20 text-accent-primary text-sm mb-4">
              <div className="w-4 h-4 rounded-full border-2 border-accent-primary/30 border-t-accent-primary animate-spin" />
              Loading MediaPipe WASM model…
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm mb-4">
              <AlertTriangle size={14} />Failed to load MediaPipe. Ensure you are connected to the internet.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Camera canvas */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden border border-border-subtle bg-black aspect-video">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" playsInline muted />
                <canvas ref={canvasRef} className="w-full h-full object-cover" />
                {status !== 'running' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
                    <Video size={48} className="opacity-30" />
                    <p className="text-sm">{status === 'ready' ? 'Click "Start Camera" to begin' : status === 'initializing' ? 'Loading model…' : 'Camera unavailable'}</p>
                  </div>
                )}
                {/* Risk overlay badge */}
                {riskFlag && status === 'running' && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger/80 text-white text-xs font-semibold animate-pulse">
                    <AlertTriangle size={12} /> FORM RISK DETECTED
                  </div>
                )}
                {status === 'running' && !riskFlag && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/80 text-white text-xs font-semibold">
                    ✓ Good Form
                  </div>
                )}
              </div>
            </div>

            {/* Live metrics panel */}
            <div className="flex flex-col gap-3">
              {/* Rep counter */}
              <div className="glass rounded-2xl p-5 border border-border-subtle flex flex-col items-center">
                <Activity size={18} className="text-accent-primary mb-2" />
                <span className="text-5xl font-bold font-mono text-accent-primary tabular-nums">{repCount}</span>
                <span className="text-xs text-text-muted mt-1">Reps Counted</span>
                <button onClick={() => { angleHistRef.current = []; setRepCount(0) }} className="mt-2 text-[11px] text-text-muted hover:text-text-primary transition-colors">Reset</button>
              </div>

              {/* Angle metrics */}
              {metrics ? (
                <>
                  {[
                    { label: 'Left Knee', value: metrics.leftKnee,  unit: '°', color: metrics.lKneeColor },
                    { label: 'Right Knee', value: metrics.rightKnee, unit: '°', color: metrics.rKneeColor },
                    { label: 'Trunk Lean', value: metrics.trunkLean, unit: '°', color: metrics.trunkColor },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} className="glass rounded-xl p-3 border border-border-subtle">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">{label}</span>
                        <span className="text-xl font-mono font-bold tabular-nums" style={{ color }}>{value}{unit}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-200" style={{ width: `${Math.min(100, value)}%`, background: color }} />
                      </div>
                    </div>
                  ))}

                  <div className="glass rounded-xl p-3 border border-border-subtle text-xs text-text-muted">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Zap size={11} className="text-accent-primary" />
                      <span className="font-medium text-text-secondary">Thresholds ({movement})</span>
                    </div>
                    {Object.entries(MOVEMENT_THRESHOLDS[movement] ?? {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="capitalize">{k.replace('_', ' ')}</span>
                        <span className="font-mono text-text-primary">{v}°</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="glass rounded-2xl p-5 border border-border-subtle flex flex-col gap-2">
                  <p className="text-xs text-text-muted text-center">Start camera to see live metrics</p>
                  {['Left Knee', 'Right Knee', 'Trunk Lean'].map((l) => (
                    <div key={l} className="h-12 rounded-xl bg-bg-elevated animate-pulse" />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-muted">
            {[
              { color: '#22c55e', label: 'Good form' },
              { color: '#f59e0b', label: 'Near threshold' },
              { color: '#ef4444', label: 'Risk detected' },
              { color: '#6366f1', label: 'Joints' },
              { color: 'rgba(255,255,255,0.5)', label: 'Skeleton' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
