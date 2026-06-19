import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Play, ChevronDown, Zap, Brain, Shield,
  Dumbbell, Footprints, ArrowDown, Activity,
  Target, BarChart3, X, FileVideo, Camera,
  RotateCcw, Layers, TrendingUp, Heart, User, Video, Map,
  Sparkles,
} from 'lucide-react'
import { useStore } from '../store'
import { analyzeVideo } from '../api'
import Navbar from '../components/Navbar'
import ErrorCard from '../components/ErrorCard'
import WebcamRecorder from '../components/WebcamRecorder'
import CameraGuide from '../components/CameraGuide'

const MOVEMENTS = [
  { id: 'Squat',          label: 'Squat',           Icon: ArrowDown,  category: 'Lower Body'  },
  { id: 'Deadlift',       label: 'Deadlift',        Icon: Dumbbell,   category: 'Full Body'   },
  { id: 'Lunge',          label: 'Lunge',           Icon: Footprints, category: 'Lower Body'  },
  { id: 'Running',        label: 'Running',         Icon: Activity,   category: 'Cardio'      },
  { id: 'Jump Landing',   label: 'Jump Landing',    Icon: Zap,        category: 'Power'       },
  { id: 'Push-up',        label: 'Push-up',         Icon: Shield,     category: 'Upper Body'  },
  { id: 'Plank',          label: 'Plank',           Icon: Target,     category: 'Core'        },
  { id: 'Hip Hinge',      label: 'Hip Hinge',       Icon: RotateCcw,  category: 'Lower Body'  },
  { id: 'Overhead Press', label: 'Overhead Press',  Icon: TrendingUp, category: 'Upper Body'  },
  { id: 'Lateral Lunge',  label: 'Lateral Lunge',   Icon: Layers,     category: 'Lower Body'  },
  { id: 'Split Squat',    label: 'Split Squat',     Icon: ArrowDown,  category: 'Lower Body'  },
  { id: 'Bench Press',    label: 'Bench Press',     Icon: Heart,      category: 'Upper Body'  },
]

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite Athlete']
const AGE_GROUPS     = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+']
const GOALS          = ['Injury Prevention', 'Performance Improvement', 'Rehabilitation', 'General Fitness', 'Sport-Specific Training']
const SPORTS         = ['', 'Football', 'Basketball', 'Tennis', 'Running/Athletics', 'Swimming', 'Cycling', 'CrossFit', 'Weightlifting', 'Rugby', 'Martial Arts', 'Other']

const CATEGORIES = ['All', ...new Set(MOVEMENTS.map((m) => m.category))]

const MAX_FILE_BYTES = 100 * 1024 * 1024
const ALLOWED_EXTS   = ['.mp4', '.mov', '.avi', '.webm']
const ALLOWED_TYPES  = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi', 'video/webm']

function fmtBytes(b) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`
}

function StyledSelect({ id, label, icon: Icon, value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const displayValue = value || '— None —'
  return (
    <div ref={ref} className="relative flex-1 min-w-[140px]">
      <label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-1.5">
        {Icon && <Icon size={11} aria-hidden />}{label}
      </label>
      <button
        id={id} type="button" onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl glass border border-border-subtle text-sm text-text-primary hover:border-border-accent transition-all duration-200 focus:outline-none focus:border-accent-primary"
      >
        <span className={value ? '' : 'text-text-muted'}>{displayValue}</span>
        <ChevronDown
          size={13}
          className="text-text-muted transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={{ opacity: 0,    y: -6, scale: 0.97  }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="absolute z-50 mt-1.5 w-full rounded-xl glass-elevated border border-border-accent shadow-2xl overflow-hidden max-h-52 overflow-y-auto"
          >
            {options.map((opt) => (
              <li
                key={opt}
                role="option"
                aria-selected={opt === value}
                onClick={() => { onChange(opt); setOpen(false) }}
                className={`px-3 py-2.5 text-sm cursor-pointer transition-colors duration-100 ${
                  opt === value
                    ? 'bg-accent-glow text-accent-primary font-medium'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                {opt || '— None —'}
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
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-6 flex flex-col gap-4 card-hover border border-border-subtle hover:border-border-accent"
    >
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-accent-primary/20 text-accent-primary text-xs font-bold flex items-center justify-center border border-accent-primary/30">
          {step}
        </span>
        <div className="w-10 h-10 rounded-xl bg-accent-glow flex items-center justify-center border border-accent-primary/10">
          <Icon size={20} className="text-accent-primary" aria-hidden />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-text-primary mb-1.5">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

const FEATURE_CARDS = [
  { icon: Target,    title: '6 Risk Metrics',       desc: 'Knee valgus, trunk lean, asymmetry, shoulder & hip measurements' },
  { icon: Activity,  title: 'Rep Counter',           desc: 'Automatically detects and counts repetitions from your video'     },
  { icon: TrendingUp, title: 'Fatigue Detection',   desc: 'Compares form quality across first vs. second half of session'    },
  { icon: Brain,     title: 'AI Coaching Report',   desc: '5 exercises, warm-up routine, and a 5-day personalised plan'      },
  { icon: BarChart3, title: 'Angle Timeline',        desc: 'Frame-by-frame joint angle chart to spot form fluctuations'      },
  { icon: Layers,    title: 'Progress Tracking',    desc: 'Save analyses and track your improvement over time'               },
]

export default function UploadScreen() {
  const { setScreen, setResults, setError, error, isLoading, setLoading } = useStore()
  const history          = useStore((s) => s.history)
  const getActiveProfile = useStore((s) => s.getActiveProfile)
  const activeProfile    = getActiveProfile()

  const [file, setFile]                       = useState(null)
  const [filePreview, setFilePreview]         = useState(null)
  const [videoDuration, setVideoDuration]     = useState(null)
  const [dragging, setDragging]               = useState(false)
  const [fileError, setFileError]             = useState(null)
  const [movement, setMovement]               = useState('Squat')
  const [fitnessLevel, setFitnessLevel]       = useState(activeProfile?.fitnessLevel ?? 'Intermediate')
  const [ageGroup, setAgeGroup]               = useState(activeProfile?.ageGroup ?? '25–34')
  const [goal, setGoal]                       = useState(activeProfile?.goal ?? 'Injury Prevention')
  const [sport, setSport]                     = useState(activeProfile?.sport ?? '')
  const [catFilter, setCatFilter]             = useState('All')
  const [showWebcam, setShowWebcam]           = useState(false)
  const [showCameraGuide, setShowCameraGuide] = useState(false)

  const fileInputRef = useRef(null)
  const videoRef     = useRef(null)

  const validateFile = useCallback((f) => {
    const ext = ('.' + f.name.split('.').pop()).toLowerCase()
    if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(f.type)) {
      return 'Unsupported file type. Please upload MP4, MOV, AVI, or WebM.'
    }
    if (f.size > MAX_FILE_BYTES) return `File is ${fmtBytes(f.size)} — max 100 MB.`
    return null
  }, [])

  const acceptFile = useCallback((f) => {
    const err = validateFile(f)
    if (err) { setFileError(err); return }
    setFileError(null)
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
  }, [validateFile])

  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview) }, [filePreview])

  const handleDrop      = useCallback((e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) acceptFile(f) }, [acceptFile])
  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)
  const handleInput     = (e) => { const f = e.target.files?.[0]; if (f) acceptFile(f) }
  const handleVideoMeta = () => {
    const d = videoRef.current?.duration
    if (d && isFinite(d)) {
      const m = Math.floor(d / 60), s = Math.floor(d % 60)
      setVideoDuration(m > 0 ? `${m}m ${s}s` : `${s}s`)
    }
  }
  const handleRemove = (e) => {
    e.stopPropagation()
    setFile(null); setFilePreview(null); setVideoDuration(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAnalyze = async () => {
    if (!file || isLoading) return
    setLoading(true)
    setScreen('loading')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('movement_type', movement)
    formData.append('fitness_level', fitnessLevel)
    formData.append('age_group', ageGroup)
    formData.append('goal', goal)
    formData.append('sport', sport)
    try {
      const data = await analyzeVideo(formData)
      setResults(data)
    } catch (err) {
      setError({ message: err.message || 'Analysis failed.', suggestion: err.suggestion || 'Please check your video and try again.' })
    }
  }

  const filteredMovements = catFilter === 'All' ? MOVEMENTS : MOVEMENTS.filter((m) => m.category === catFilter)
  const canAnalyze = Boolean(file && !fileError && !isLoading)
  const displayError = error || (fileError ? { message: fileError, suggestion: 'Try a different file format or reduce the file size.' } : null)

  return (
    <div className="min-h-screen mesh-bg">
      <Navbar />

      {showWebcam && (
        <WebcamRecorder
          onCapture={(f) => { acceptFile(f); setShowWebcam(false) }}
          onClose={() => setShowWebcam(false)}
        />
      )}

      <AnimatePresence>
        {showCameraGuide && (
          <CameraGuide movement={movement} onClose={() => setShowCameraGuide(false)} />
        )}
      </AnimatePresence>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">

        {/* Ambient background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute rounded-full bg-accent-primary/8 blur-3xl animate-float-orb"
            style={{ width: 560, height: 560, top: '-10%', left: '5%', animationDelay: '0s' }}
          />
          <div
            className="absolute rounded-full bg-accent-secondary/6 blur-3xl animate-float-orb"
            style={{ width: 400, height: 400, top: '5%', right: '5%', animationDelay: '3.5s' }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0"
            style={{
              width: 700, height: 200,
              background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.06) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Badge pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6
                            glass border border-accent-primary/20 text-accent-primary text-xs font-medium
                            shadow-sm shadow-accent-primary/10">
              <Sparkles size={11} aria-hidden />
              Gemini 2.0 Flash · MediaPipe Pose
              <span className="text-accent-primary/40">·</span>
              <span className="text-text-muted">12 Movement Types</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-text-primary leading-[1.06] tracking-tight mb-5">
              Know Your Injury Risk{' '}
              <br className="hidden sm:block" />
              <span className="gradient-text">Before It Happens</span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Upload or record any movement and receive a comprehensive AI-powered physiotherapy report — pose analysis, 6 risk metrics, rep counting, fatigue detection, and a personalised weekly training plan.
            </p>

            {/* Profile + Live pills */}
            <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setScreen('profiles')}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-border-subtle
                           text-sm text-text-secondary
                           hover:text-accent-primary hover:border-accent-primary/30
                           transition-all duration-200"
              >
                <User size={13} aria-hidden />
                <span>{activeProfile?.name ?? 'Default Athlete'}</span>
                {activeProfile?.fitnessLevel && (
                  <>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-muted text-xs">{activeProfile.fitnessLevel}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setScreen('live')}
                className="flex items-center gap-2 px-4 py-2 rounded-full
                           bg-accent-primary/15 border border-accent-primary/30
                           text-accent-primary text-sm font-medium
                           hover:bg-accent-primary/25 hover:shadow-md hover:shadow-accent-primary/20
                           transition-all duration-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                <Video size={13} aria-hidden />
                Try Live Analysis
              </button>
            </div>

            {history.length > 0 && (
              <p className="mt-4 text-sm text-text-muted">
                You have{' '}
                <button
                  onClick={() => useStore.getState().setScreen('history')}
                  className="text-accent-primary hover:underline font-medium"
                >
                  {history.length} saved {history.length === 1 ? 'analysis' : 'analyses'}
                </button>
                {' '}in history.
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Upload area ──────────────────────────────────────────────────── */}
      <section className="px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence>
            {displayError && (
              <div className="mb-4">
                <ErrorCard
                  message={displayError.message}
                  suggestion={displayError.suggestion}
                  onRetry={() => { setFileError(null); useStore.getState().reset() }}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Drop zone */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              onClick={() => !file && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              role={file ? undefined : 'button'}
              tabIndex={file ? undefined : 0}
              aria-label="Upload video for movement analysis"
              onKeyDown={(e) => { if (e.key === 'Enter' && !file) fileInputRef.current?.click() }}
              className={`upload-border-animated rounded-2xl p-8 transition-all duration-300
                          ${file ? 'cursor-default' : 'cursor-pointer'}
                          ${dragging ? 'upload-border-drag' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mov,.avi,.webm,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                onChange={handleInput}
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
                    className="flex flex-col items-center text-center py-4"
                  >
                    <motion.div
                      animate={dragging ? { scale: 1.08, rotate: -3 } : { scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
                        dragging ? 'bg-accent-primary/20 glow-indigo' : 'bg-accent-glow'
                      }`}
                    >
                      <Upload
                        size={36}
                        className={dragging ? 'text-accent-primary' : 'text-accent-secondary'}
                        aria-hidden
                      />
                    </motion.div>
                    <p className="text-xl font-semibold text-text-primary mb-2">
                      {dragging ? 'Drop your video here' : 'Drag & drop your video'}
                    </p>
                    <p className="text-text-secondary text-sm mb-4">or click to browse files</p>
                    <p className="text-xs text-text-muted px-3 py-1.5 rounded-full bg-bg-elevated border border-border-subtle">
                      MP4 · MOV · AVI · WebM · Max 100 MB
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="relative flex-shrink-0 w-32 h-24 rounded-xl overflow-hidden bg-bg-elevated">
                      <video
                        ref={videoRef}
                        src={filePreview}
                        className="w-full h-full object-cover"
                        onLoadedMetadata={handleVideoMeta}
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play size={20} className="text-white" fill="white" aria-hidden />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate mb-1">{file.name}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><FileVideo size={11} aria-hidden />{fmtBytes(file.size)}</span>
                        {videoDuration && <span className="flex items-center gap-1"><Play size={11} aria-hidden />{videoDuration}</span>}
                      </div>
                      <button
                        onClick={handleRemove}
                        className="mt-3 flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors"
                        aria-label="Remove file"
                      >
                        <X size={12} aria-hidden />Remove file
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Webcam + Guide buttons */}
            {!file && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowWebcam(true)}
                  className="flex-1 py-2.5 rounded-xl glass border border-border-subtle text-sm text-text-secondary
                             hover:text-text-primary hover:border-border-accent
                             transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Camera size={14} aria-hidden /> Record with Webcam
                </button>
                <button
                  onClick={() => setShowCameraGuide(true)}
                  title="Camera placement guide"
                  className="px-3 py-2.5 rounded-xl glass border border-border-subtle text-sm text-text-muted
                             hover:text-accent-primary hover:border-accent-primary/30
                             transition-all duration-200 flex items-center gap-1.5"
                >
                  <Map size={14} />Guide
                </button>
              </div>
            )}
          </motion.div>

          {/* Movement selector */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.55 }}
            className="mt-6"
          >
            <p className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-3">
              <Activity size={12} aria-hidden />Select Movement Type
              <span className="ml-auto text-text-muted">{MOVEMENTS.length} supported</span>
            </p>

            {/* Category filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    catFilter === cat
                      ? 'bg-accent-primary/20 border-accent-primary/40 text-accent-primary font-medium'
                      : 'border-border-subtle text-text-muted hover:text-text-secondary hover:border-border-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Movement type selection">
              {filteredMovements.map(({ id, label, Icon }) => (
                <motion.button
                  key={id}
                  onClick={() => setMovement(id)}
                  aria-pressed={movement === id}
                  whileTap={{ scale: 0.96 }}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    movement === id
                      ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/30'
                      : 'glass border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-accent'
                  }`}
                >
                  <Icon size={14} aria-hidden />{label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* About You */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.55 }}
            className="mt-6 glass-premium rounded-2xl p-5"
          >
            <p className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-4">
              <BarChart3 size={12} aria-hidden />About You
            </p>
            <div className="flex flex-wrap gap-4">
              <StyledSelect id="fitness-level" label="Fitness Level" icon={Dumbbell}    value={fitnessLevel} onChange={setFitnessLevel} options={FITNESS_LEVELS} />
              <StyledSelect id="age-group"     label="Age Group"     icon={Shield}      value={ageGroup}     onChange={setAgeGroup}     options={AGE_GROUPS}     />
              <StyledSelect id="goal"          label="Your Goal"     icon={Target}      value={goal}         onChange={setGoal}         options={GOALS}          />
              <StyledSelect id="sport"         label="Sport (opt.)"  icon={Activity}    value={sport}        onChange={setSport}        options={SPORTS}         />
            </div>
          </motion.div>

          {/* Analyze CTA */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.55 }}
            className="mt-5"
          >
            <motion.button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              aria-busy={isLoading}
              aria-label={canAnalyze ? 'Analyze movement video' : 'Upload a video to begin'}
              whileTap={canAnalyze ? { scale: 0.985 } : {}}
              className={`w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200 flex items-center justify-center gap-3 ${
                canAnalyze
                  ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white hover:brightness-110 hover:shadow-xl hover:shadow-accent-primary/30 active:scale-[0.99]'
                  : 'bg-bg-elevated text-text-muted cursor-not-allowed border border-border-subtle'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
                  Analyzing…
                </>
              ) : (
                <>
                  <Brain size={20} aria-hidden />
                  {file ? 'Analyze Movement' : 'Upload a Video to Begin'}
                </>
              )}
            </motion.button>
            {!file && (
              <p className="text-center text-xs text-text-muted mt-2">
                Upload or record a video to unlock AI analysis
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-text-primary mb-3">How InjuryLens Works</h2>
            <p className="text-text-secondary">Clinical-grade biomechanics analysis in three steps</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <HowItWorksCard step={1} icon={Upload}    title="Upload or Record"           desc="Upload an MP4/MOV/AVI file or record directly with your webcam. Ensure your full body is visible with good lighting." delay={0} />
            <HowItWorksCard step={2} icon={Brain}     title="AI Analyzes Your Movement"  desc="MediaPipe tracks 33 body landmarks per frame. Our engine measures 6 risk metrics, counts reps, and detects fatigue-driven form degradation." delay={0.1} />
            <HowItWorksCard step={3} icon={BarChart3} title="Get Your Full Report"       desc="Gemini 2.0 Flash generates a personalised coaching plan with movement cues, 5 exercises, a warm-up routine, and a weekly training plan." delay={0.2} />
          </div>
        </div>
      </section>

      {/* ── What You Get ────────────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl font-bold text-text-primary mb-2">What You Get</h2>
            <p className="text-sm text-text-secondary">Everything you need to move smarter and recover faster</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {FEATURE_CARDS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="glass rounded-2xl p-5 border border-border-subtle hover:border-accent-primary/20 transition-colors duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-accent-glow flex items-center justify-center mb-3 group-hover:bg-accent-primary/20 transition-colors duration-200">
                  <Icon size={17} className="text-accent-primary" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">{title}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="relative border-t border-border-subtle py-8 px-4 text-center text-xs text-text-muted overflow-hidden">
        {/* Subtle gradient line above footer */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(79,70,229,0.18) 40%, rgba(124,58,237,0.13) 60%, transparent)',
          }}
        />
        InjuryLens · Built with MediaPipe, FastAPI &amp; Gemini AI · Not a substitute for professional medical advice
      </footer>
    </div>
  )
}
