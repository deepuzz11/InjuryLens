import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, X, CheckCircle, AlertTriangle } from 'lucide-react'

// SVG diagrams showing camera placement per movement
const GUIDES = {
  Squat: {
    angle: '45° side view',
    height: 'Hip height',
    distance: '2–3 m away',
    tips: ['Full body visible head to toe', 'Camera at hip-height for best knee angle readings', 'Side profile (not front-on) for trunk lean accuracy', 'Ensure good lighting — avoid backlighting'],
    avoid: ['Front-on view distorts valgus measurement', 'Too close cuts off feet — ankles are essential'],
    svg: (
      <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
        {/* Floor */}
        <line x1="20" y1="145" x2="200" y2="145" stroke="#334155" strokeWidth="2" />
        {/* Camera */}
        <rect x="20" y="60" width="28" height="20" rx="4" fill="#4f46e5" opacity="0.8" />
        <circle cx="34" cy="70" r="6" fill="#1e293b" stroke="#7c3aed" strokeWidth="1.5" />
        <line x1="48" y1="70" x2="110" y2="90" stroke="#4f46e5" strokeDasharray="4 3" strokeWidth="1.5" opacity="0.6" />
        {/* Person squatting */}
        <circle cx="140" cy="50" r="12" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <line x1="140" y1="62" x2="140" y2="95" stroke="#94a3b8" strokeWidth="2" />
        <line x1="140" y1="75" x2="125" y2="68" stroke="#94a3b8" strokeWidth="2" />
        <line x1="140" y1="75" x2="155" y2="68" stroke="#94a3b8" strokeWidth="2" />
        <line x1="140" y1="95" x2="128" y2="120" stroke="#94a3b8" strokeWidth="2" />
        <line x1="140" y1="95" x2="152" y2="120" stroke="#94a3b8" strokeWidth="2" />
        <line x1="128" y1="120" x2="124" y2="145" stroke="#94a3b8" strokeWidth="2" />
        <line x1="152" y1="120" x2="156" y2="145" stroke="#94a3b8" strokeWidth="2" />
        {/* Height indicator */}
        <line x1="10" y1="95" x2="18" y2="95" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="14" y1="95" x2="14" y2="145" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
        <text x="2" y="118" fill="#f59e0b" fontSize="8" textAnchor="middle" transform="rotate(-90,8,118)">hip ht.</text>
        {/* Distance indicator */}
        <line x1="48" y1="150" x2="130" y2="150" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arr)" />
        <text x="89" y="158" fill="#22c55e" fontSize="8" textAnchor="middle">2–3 m</text>
        {/* Angle arc */}
        <path d="M 55 70 A 20 20 0 0 1 70 55" stroke="#7c3aed" strokeWidth="1.5" fill="none" />
        <text x="68" y="52" fill="#7c3aed" fontSize="8">45°</text>
      </svg>
    ),
  },
  Deadlift: {
    angle: '45–90° side view',
    height: 'Mid-shin height',
    distance: '2.5–3.5 m away',
    tips: ['Side view is critical — spine angle invisible from front', 'Camera lower than hip to see bar path clearly', 'Ensure full body including bar visible'],
    avoid: ['Front view cannot assess hip hinge depth', 'Too high makes trunk lean appear less severe'],
    svg: null,
  },
  Lunge: {
    angle: 'Side or 45° angle',
    height: 'Knee height',
    distance: '2–3 m away',
    tips: ['Both knee positions must be visible', 'Side view best for front-knee-over-ankle check', 'Ensure rear foot visible for stride length'],
    avoid: ['Front view cannot check trunk forward lean'],
    svg: null,
  },
  Running: {
    angle: 'True side view (90°)',
    height: 'Hip height',
    distance: '3–5 m away',
    tips: ['Film from exactly side-on for gait cycle analysis', 'Longer clip = more strides = better accuracy', 'Outdoor: avoid shadows obscuring limbs'],
    avoid: ['Diagonal views distort stride length', 'Too close clips foot strike patterns'],
    svg: null,
  },
  default: {
    angle: 'Side or 45° view',
    height: 'Hip height',
    distance: '2–3 m away',
    tips: ['Ensure full body is visible from head to toe', 'Good lighting with no backlighting', 'Stable camera — avoid handheld shake', 'Wear form-fitting clothes for landmark visibility'],
    avoid: ['Dark or backlit environments', 'Partial body in frame'],
    svg: null,
  },
}

export default function CameraGuide({ movement, onClose }) {
  const guide = GUIDES[movement] ?? GUIDES.default

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        className="glass-elevated rounded-2xl border border-border-accent shadow-2xl w-full max-w-md p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Camera size={14} className="text-accent-primary" />Camera Placement Guide
            {movement && movement !== 'default' && <span className="text-text-muted font-normal">— {movement}</span>}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* SVG diagram */}
        {guide.svg ? (
          <div className="rounded-xl bg-bg-elevated border border-border-subtle p-3 mb-4">
            {guide.svg}
          </div>
        ) : (
          <div className="rounded-xl bg-bg-elevated border border-border-subtle p-4 mb-4 flex items-center gap-4">
            <Camera size={36} className="text-accent-primary/40 flex-shrink-0" />
            <div className="text-xs text-text-muted leading-relaxed">
              Position yourself at a <strong className="text-text-primary">{guide.angle}</strong> at approximately <strong className="text-text-primary">{guide.height}</strong>, <strong className="text-text-primary">{guide.distance}</strong> from the subject.
            </div>
          </div>
        )}

        {/* Specs row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Angle', value: guide.angle },
            { label: 'Height', value: guide.height },
            { label: 'Distance', value: guide.distance },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 p-2 rounded-xl bg-accent-primary/8 border border-accent-primary/15">
              <span className="text-[10px] text-text-muted">{label}</span>
              <span className="text-xs font-semibold text-accent-primary">{value}</span>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="flex flex-col gap-1.5 mb-3">
          <p className="text-xs font-semibold text-text-secondary mb-1">Do this:</p>
          {guide.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text-muted">
              <CheckCircle size={11} className="text-success mt-0.5 flex-shrink-0" />
              {tip}
            </div>
          ))}
        </div>

        {/* Avoid */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-text-secondary mb-1">Avoid:</p>
          {guide.avoid.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text-muted">
              <AlertTriangle size={11} className="text-warning mt-0.5 flex-shrink-0" />
              {a}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-accent-primary/15 border border-accent-primary/30 text-accent-primary text-sm font-medium hover:bg-accent-primary/25 transition-all"
        >
          Got it — Start Recording
        </button>
      </motion.div>
    </motion.div>
  )
}
