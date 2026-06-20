import React, { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Loader, ChevronDown } from 'lucide-react'

const SUPPORTED = typeof window !== 'undefined' && 'speechSynthesis' in window

export default function VoiceCoaching({ cues = [], summary = '', priority = '' }) {
  const [speaking,  setSpeaking]  = useState(false)
  const [paused,    setPaused]    = useState(false)
  const [voices,    setVoices]    = useState([])
  const [voiceIdx,  setVoiceIdx]  = useState(0)
  const [rate,      setRate]      = useState(0.9)
  const [showOpts,  setShowOpts]  = useState(false)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => {
    if (!SUPPORTED) return
    const load = () => {
      const v = synthRef.current.getVoices().filter((v) => v.lang.startsWith('en'))
      setVoices(v)
    }
    load()
    synthRef.current.addEventListener('voiceschanged', load)
    return () => synthRef.current?.removeEventListener?.('voiceschanged', load)
  }, [])

  useEffect(() => () => { synthRef.current?.cancel() }, [])

  const speak = () => {
    if (!SUPPORTED) return
    synthRef.current.cancel()

    const topCues = cues.slice(0, 3)
    const script  = [
      priority ? `Your top priority: ${priority}.` : '',
      topCues.length ? `Key coaching cues. ${topCues.join('. ')}.` : '',
      summary ? `Summary: ${summary}` : '',
    ].filter(Boolean).join(' ')

    const utt          = new SpeechSynthesisUtterance(script)
    utt.rate           = rate
    utt.pitch          = 1.0
    utt.volume         = 1.0
    if (voices[voiceIdx]) utt.voice = voices[voiceIdx]

    utt.onstart = () => { setSpeaking(true); setPaused(false) }
    utt.onend   = () => { setSpeaking(false); setPaused(false) }
    utt.onerror = () => { setSpeaking(false); setPaused(false) }

    synthRef.current.speak(utt)
  }

  const toggle = () => {
    if (!SUPPORTED) return
    if (speaking && !paused) {
      synthRef.current.pause()
      // Firefox implements pause() as a no-op; detect by checking the paused property.
      if (synthRef.current.paused) {
        setPaused(true)
      } else {
        synthRef.current.cancel()
        setSpeaking(false)
      }
    } else if (paused) {
      synthRef.current.resume()
      setPaused(false)
    } else {
      speak()
    }
  }

  const stop = () => {
    synthRef.current?.cancel()
    setSpeaking(false)
    setPaused(false)
  }

  if (!SUPPORTED) return null

  return (
    <div className="flex items-center gap-2 relative">
      <button
        onClick={toggle}
        title={speaking ? (paused ? 'Resume' : 'Pause') : 'Read coaching cues aloud'}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border transition-all ${
          speaking
            ? 'bg-accent-primary/20 border-accent-primary/40 text-accent-primary'
            : 'glass border-border-subtle text-text-secondary hover:text-accent-primary hover:border-accent-primary/30'
        }`}
      >
        {speaking && !paused
          ? <><Volume2 size={13} className="animate-pulse" />Speaking…</>
          : paused
            ? <><Volume2 size={13} />Resume</>
            : <><Volume2 size={13} />Read Cues</>
        }
      </button>

      {speaking && (
        <button onClick={stop} className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl glass border border-danger/20 text-danger/70 hover:text-danger transition-all">
          <VolumeX size={12} />Stop
        </button>
      )}

      <button
        onClick={() => setShowOpts((o) => !o)}
        className="text-xs px-2 py-2 rounded-xl glass border border-border-subtle text-text-muted hover:text-text-secondary transition-all"
        title="Voice settings"
      >
        <ChevronDown size={12} style={{ transform: showOpts ? 'rotate(180deg)' : 'none' }} />
      </button>

      {showOpts && (
        <div className="absolute top-10 right-0 z-50 glass-elevated rounded-xl border border-border-accent shadow-xl p-3 min-w-[200px]">
          <p className="text-[10px] text-text-muted mb-2 font-medium">Voice Settings</p>
          {voices.length > 0 && (
            <div className="mb-2">
              <label className="text-[10px] text-text-muted block mb-1">Voice</label>
              <select
                value={voiceIdx}
                onChange={(e) => setVoiceIdx(Number(e.target.value))}
                className="w-full text-xs px-2 py-1.5 rounded-lg glass border border-border-subtle text-text-primary bg-transparent"
              >
                {voices.map((v, i) => <option key={i} value={i}>{v.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-[10px] text-text-muted block mb-1">Speed: {rate}×</label>
            <input type="range" min={0.5} max={1.5} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-accent-primary" />
          </div>
        </div>
      )}
    </div>
  )
}
