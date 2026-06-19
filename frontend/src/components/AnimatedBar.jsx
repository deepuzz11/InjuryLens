import React from 'react'
import { motion } from 'framer-motion'

function getRiskMeta(score) {
  if (score <= 30) return { color: '#22c55e', label: 'Low Risk' }
  if (score <= 60) return { color: '#f59e0b', label: 'Moderate' }
  return { color: '#ef4444', label: 'High Risk' }
}

/**
 * Props
 * -----
 * score    : number 0–100
 * label    : string — check name
 * subtitle : string — one-line explanation of what the check measures
 * delay    : number — Framer Motion animation delay in seconds (default 0)
 */
export default function AnimatedBar({ score, label, subtitle, delay = 0 }) {
  const { color, label: riskLabel } = getRiskMeta(score ?? 0)
  const safeScore = Math.max(0, Math.min(100, score ?? 0))

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary leading-snug">{label}</p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="font-mono text-sm font-semibold tabular-nums"
            style={{ color }}
          >
            {safeScore}%
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
            style={{
              color,
              background: `${color}1a`,
              border: `1px solid ${color}33`,
            }}
          >
            {riskLabel}
          </span>
        </div>
      </div>

      {/* Animated bar */}
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.08)' }}
        role="progressbar"
        aria-valuenow={safeScore}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${safeScore}%`}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${safeScore}%` }}
          transition={{
            delay,
            duration: 1.0,
            type: 'spring',
            stiffness: 60,
            damping: 20,
          }}
        />
      </div>
    </div>
  )
}
