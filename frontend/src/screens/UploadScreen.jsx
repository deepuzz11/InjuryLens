import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Play, ChevronDown, AlertCircle, Zap, Brain, Shield,
  Dumbbell, PersonStanding, Footprints, ArrowDown, Activity,
  Target, BarChart3, X, FileVideo,
} from 'lucide-react'
import { useStore } from '../store'
import Navbar from '../components/Navbar'
import ErrorCard from '../components/ErrorCard'

const MOVEMENTS = [
  { id: 'Squat', label: 'Squat', Icon: ArrowDown },
  { id: 'Running', label: 'Running', Icon: Activity },
  { id: 'Jump Landing', label: 'Jump Landing', Icon: Zap },
  { id: 'Lunge', label: 'Lunge', Icon: Footprints },
  { id: 'Push-up', label: 'Push-up', Icon: Shield },
  { id: 'Deadlift', label: 'Deadlift', Icon: Dumbbell },
  { id: 'Plank', label: 'Plank', Icon: Target },
]

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite Athlete']
const AGE_GROUPS = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+']
const GOALS = ['Injury Prevention', 'Performance Improvement', 'Rehabilitation', 'General Fitness']

const MAX_FILE_BYTES = 100 * 1024 * 1024
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi']
const ALLOWED_EXTS = ['.mp4', '.mov', '.avi']

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function StyledSelect({ label, icon: Icon, value, onChange, options, id }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative flex-1 min-w-[160px]">
      <label htmlFor={id} className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={12} />}
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl glass border border-border-subtle text-sm text-text-primary hover:border-border-accent transition-all duration-200 focus:outline-none focus:border-accent-primary"
      >
        <span>{value}</span>
        <ChevronDown
          size={14}
          className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-xl glass-elevated border border-border-accent shadow-xl overflow-hidden"
          >
            {options.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={opt === value}
                onClick={() => { onChange(opt); setOpen(false) }}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors duration-150 ${
                  opt === value
                    ? 'bg-accent-glow text-accent-primary font-medium'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                {opt}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function HowItWorksCard({ step, icon: Icon, title, desc, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="glass rounded-2xl p-6 flex flex-col items-start gap-4 hover:-translate-y-0.5 transition-transform duration-200"
    >
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-bold flex items-center justify-center border border-accent-primary/30">
          {step}
        </span>
        <div className="w-10 h-10 rounded-xl bg-accent-glow flex items-center justify-center">
          <Icon size={20} className="text-accent-primary" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

export default function UploadScreen() {
  const { setScreen, setResults, setError, error } = useStore()

  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [videoDuration, setVideoDuration] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [movement, setMovement] = useState('Squat')
  const [fitnessLevel, setFitnessLevel] = useState('Intermediate')
  const [ageGroup, setAgeGroup] = useState('25–34')
  const [goal, setGoal] = useState('Injury Prevention')
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)

  const validateFile = useCallback((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(f.type)) {
      return 'Unsupported file type. Please upload an MP4, MOV, or AVI video.'
    }
    if (f.size > MAX_FILE_BYTES) {
      return `File is ${formatBytes(f.size)}. Maximum allowed size is 100 MB.`
    }
    return null
  }, [])

  const handleFile = useCallback((f) => {
    const err = validateFile(f)
    if (err) { setFileError(err); return }
    setFileError(null)
    setFile(f)
    const url = URL.createObjectURL(f)
    setFilePreview(url)
  }, [validateFile])

  useEffect(() => {
    return () => { if (filePreview) URL.revokeObjectURL(filePreview) }
  }, [filePreview])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleInputChange = (e) => {
    const f = e.target.files[0]
    if (f) handleFile(f)
  }

  const handleVideoMetadata = () => {
    if (videoRef.current) {
      const d = videoRef.current.duration
      const mins = Math.floor(d / 60)
      const secs = Math.floor(d % 60)
      setVideoDuration(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`)
    }
  }

  const handleRemoveFile = (e) => {
    e.stopPropagation()
    setFile(null)
    setFilePreview(null)
    setVideoDuration(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAnalyze = async () => {
    if (!file || loading) return
    setLoading(true)
    setScreen('loading')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('movement_type', movement)
    formData.append('fitness_level', fitnessLevel)
    formData.append('age_group', ageGroup)
    formData.append('goal', goal)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      const response = await fetch('/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errData.detail || `Server error (${response.status})`)
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Analysis timed out after 60 seconds. The video may be too long or the server is under load. Please try again.')
      } else {
        setError(err.message || 'Analysis failed. Please try again.')
      }
      setLoading(false)
    }
  }

  const canAnalyze = file && !fileError && !loading

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Glow orb */}
          <div
            className="absolute top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-medium mb-6">
              <Zap size={12} />
              Powered by Gemini 2.0 Flash + MediaPipe
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary leading-tight tracking-tight mb-4">
              Know Your Injury Risk{' '}
              <span className="gradient-text">Before It Happens</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Upload a video of your movement and receive a comprehensive AI-powered physiotherapy
              report with pose analysis, injury risk scores, and personalized coaching — in seconds.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main upload card */}
      <section className="px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {(error || fileError) && (
            <div className="mb-4">
              <ErrorCard
                message={error || fileError}
                onRetry={() => { setFileError(null); if (error) useStore.getState().reset() }}
              />
            </div>
          )}

          {/* Upload zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div
              onClick={() => !file && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`upload-border-animated rounded-2xl p-8 cursor-pointer transition-all duration-300 ${
                dragging ? 'upload-border-drag' : ''
              } ${file ? 'cursor-default' : 'hover:border-accent cursor-pointer'}`}
              role={file ? undefined : 'button'}
              tabIndex={file ? undefined : 0}
              aria-label="Upload video for analysis"
              onKeyDown={(e) => { if (e.key === 'Enter' && !file) fileInputRef.current?.click() }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo"
                onChange={handleInputChange}
                className="sr-only"
                aria-label="Select video file"
              />

              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center py-6"
                  >
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
                      dragging ? 'bg-accent-primary/20 glow-indigo' : 'bg-accent-glow'
                    }`}>
                      <Upload size={36} className={dragging ? 'text-accent-primary' : 'text-accent-secondary'} />
                    </div>
                    <p className="text-xl font-semibold text-text-primary mb-2">
                      {dragging ? 'Drop your video here' : 'Drag & drop your video'}
                    </p>
                    <p className="text-text-secondary text-sm mb-4">
                      or click to browse files
                    </p>
                    <p className="text-xs text-text-muted">
                      Supports MP4, MOV, AVI · Max 100 MB
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="relative flex-shrink-0 w-32 h-24 rounded-xl overflow-hidden bg-bg-elevated">
                      <video
                        ref={videoRef}
                        src={filePreview}
                        className="w-full h-full object-cover"
                        onLoadedMetadata={handleVideoMetadata}
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={20} className="text-white" fill="white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate mb-1">
                        {file.name}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <FileVideo size={11} />
                          {formatBytes(file.size)}
                        </span>
                        {videoDuration && (
                          <span className="flex items-center gap-1">
                            <Play size={11} />
                            {videoDuration}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="mt-3 flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors"
                        aria-label="Remove selected file"
                      >
                        <X size={12} />
                        Remove file
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Movement selector */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6"
          >
            <label className="block text-xs font-medium text-text-secondary mb-3 flex items-center gap-1.5">
              <Activity size={12} />
              Select Movement Type
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {MOVEMENTS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setMovement(id)}
                  aria-pressed={movement === id}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    movement === id
                      ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/25'
                      : 'glass border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-accent'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* About You */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-6 glass rounded-2xl p-5"
          >
            <p className="text-xs font-medium text-text-secondary mb-4 flex items-center gap-1.5">
              <BarChart3 size={12} />
              About You
            </p>
            <div className="flex flex-wrap gap-4">
              <StyledSelect
                id="fitness-level"
                label="Fitness Level"
                icon={Dumbbell}
                value={fitnessLevel}
                onChange={setFitnessLevel}
                options={FITNESS_LEVELS}
              />
              <StyledSelect
                id="age-group"
                label="Age Group"
                icon={Shield}
                value={ageGroup}
                onChange={setAgeGroup}
                options={AGE_GROUPS}
              />
              <StyledSelect
                id="goal"
                label="Your Goal"
                icon={Target}
                value={goal}
                onChange={setGoal}
                options={GOALS}
              />
            </div>
          </motion.div>

          {/* Analyze button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-5"
          >
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              aria-busy={loading}
              aria-label="Analyze video for injury risk"
              className={`w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
                canAnalyze
                  ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white hover:brightness-110 hover:shadow-lg hover:shadow-accent-primary/30 active:scale-[0.99]'
                  : 'bg-bg-elevated text-text-muted cursor-not-allowed border border-border-subtle'
              }`}
            >
              <Brain size={20} />
              {canAnalyze ? 'Analyze Movement' : !file ? 'Upload a Video to Begin' : 'Analyzing…'}
            </button>
            {!file && (
              <p className="text-center text-xs text-text-muted mt-2">
                Upload a video to unlock analysis
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-3">How InjuryLens Works</h2>
            <p className="text-text-secondary">Three steps to biomechanical clarity</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <HowItWorksCard
              step={1}
              icon={Upload}
              title="Upload Your Video"
              desc="Record yourself performing any movement and upload it. MP4, MOV, and AVI are all supported up to 100 MB."
              delay={0}
            />
            <HowItWorksCard
              step={2}
              icon={Brain}
              title="AI Analyzes Your Movement"
              desc="MediaPipe detects 33 body landmarks per frame. Our biomechanics engine scores knee valgus, trunk lean, and symmetry."
              delay={0.1}
            />
            <HowItWorksCard
              step={3}
              icon={BarChart3}
              title="Get Your Coaching Report"
              desc="Gemini 2.0 Flash turns your scores into a personalized coaching plan with exercises, cues, and a recovery timeline."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-4 text-center text-xs text-text-muted">
        <p>InjuryLens · PhysTech 2026 Hackathon · Built with MediaPipe, FastAPI &amp; Gemini AI</p>
      </footer>
    </div>
  )
}
