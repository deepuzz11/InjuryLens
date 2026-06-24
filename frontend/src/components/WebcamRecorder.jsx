import React, { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, StopCircle, X, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react'

const MAX_RECORD_SECS = 60

function getBestMimeType() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
  ]
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export default function WebcamRecorder({ onCapture, onClose }) {
  const videoRef    = useRef(null)
  const mediaRef    = useRef(null)
  const chunksRef   = useRef([])
  const timerRef    = useRef(null)
  const mimeTypeRef = useRef('')
  const streamRef   = useRef(null)   // always holds the current live stream
  const blobUrlRef  = useRef(null)   // always holds the current blob URL

  const [phase, setPhase]         = useState('idle')    // idle | recording | preview | error
  const [elapsed, setElapsed]     = useState(0)
  const [stream, setStream]       = useState(null)
  const [blobUrl, setBlobUrl]     = useState(null)
  const [errMsg, setErrMsg]       = useState('')
  const [countdown, setCountdown] = useState(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStream(null)
  }, [])

  useEffect(() => () => {
    // Use refs so the cleanup always sees the latest values regardless of when it runs
    streamRef.current?.getTracks().forEach((t) => t.stop())
    clearInterval(timerRef.current)
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
  }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = s
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.muted = true
        await videoRef.current.play()
      }
      setPhase('idle')
    } catch (e) {
      setErrMsg('Camera access denied. Please allow camera permissions and try again.')
      setPhase('error')
    }
  }

  const startCountdown = () => {
    setCountdown(3)
    const iv = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(iv); setCountdown(null); beginRecording(); return null }
        return c - 1
      })
    }, 1000)
  }

  const beginRecording = () => {
    if (!stream) return
    chunksRef.current = []
    const mimeType = getBestMimeType()
    mimeTypeRef.current = mimeType
    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const recordedType = mimeTypeRef.current || 'video/webm'
      const blob = new Blob(chunksRef.current, { type: recordedType })
      const url  = URL.createObjectURL(blob)
      blobUrlRef.current = url
      setBlobUrl(url)
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = url
        videoRef.current.muted = false
      }
      setPhase('preview')
      stopStream()
    }
    mediaRef.current = mr
    mr.start(200)
    setPhase('recording')
    setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= MAX_RECORD_SECS) { stopRecording(); return e + 1 }
        return e + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop()
  }

  const handleUse = () => {
    if (!blobUrl) return
    fetch(blobUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const mime = mimeTypeRef.current || 'video/webm'
        const ext  = mime.startsWith('video/mp4') ? 'mp4' : 'webm'
        const file = new File([blob], `webcam_recording_${Date.now()}.${ext}`, { type: mime })
        onCapture(file)
        onClose()
      })
  }

  const handleRetry = () => {
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    setBlobUrl(null)
    setElapsed(0)
    setPhase('idle')
    startCamera()
  }

  const remaining = MAX_RECORD_SECS - elapsed
  const progress  = (elapsed / MAX_RECORD_SECS) * 100

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="glass rounded-2xl border border-border-accent w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Video size={16} className="text-accent-primary" />
            <span className="text-sm font-semibold text-text-primary">Record Movement</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Video area */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            loop={phase === 'preview'}
            controls={phase === 'preview'}
          />

          {/* Countdown overlay */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/60"
              >
                <span className="text-7xl font-black text-white" style={{ textShadow: '0 0 30px rgba(99,102,241,0.8)' }}>
                  {countdown}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recording indicator */}
          {phase === 'recording' && (
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-danger/90">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs text-white font-bold font-mono">{remaining}s</span>
            </div>
          )}

          {/* Progress bar */}
          {phase === 'recording' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full bg-danger transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-5 py-4">
          {phase === 'error' && (
            <div className="flex items-start gap-2 text-xs text-danger mb-3">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              {errMsg}
            </div>
          )}

          {phase === 'idle' && !stream && (
            <button
              onClick={startCamera}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Video size={16} /> Enable Camera
            </button>
          )}

          {phase === 'idle' && stream && (
            <button
              onClick={startCountdown}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <Video size={16} /> Start Recording
            </button>
          )}

          {phase === 'recording' && (
            <button
              onClick={stopRecording}
              className="w-full py-3 rounded-xl bg-danger/20 border border-danger/40 text-danger text-sm font-semibold hover:bg-danger/30 transition-all flex items-center justify-center gap-2"
            >
              <StopCircle size={16} /> Stop Recording
            </button>
          )}

          {phase === 'preview' && (
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 py-2.5 rounded-xl glass border border-border-subtle text-text-secondary text-sm hover:text-text-primary hover:border-border-accent transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} /> Retake
              </button>
              <button
                onClick={handleUse}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-semibold hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={14} /> Use This Video
              </button>
            </div>
          )}

          <p className="text-xs text-text-muted text-center mt-3">
            Max {MAX_RECORD_SECS}s · Ensure your full body is visible · Good lighting recommended
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
