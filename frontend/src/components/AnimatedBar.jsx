import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

function getRiskMeta(score) {
  if (score <= 30) return { color: '#22c55e', label: 'Low Risk', textColor: 'text-success' }
  if (score <= 60) return { color: '#f59e0b', label: 'Moderate', textColor: 'text-warning' }
  return { color: '#ef4444', label: 'High Risk', textColor: 'text-danger' }
}

export default function AnimatedBar({ label, subtitle, score, delay = 0 }) {
  const { color, label: riskLabel, textColor } = getRiskMeta(score)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {subtitle && (
            <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-sm font-semibold" style={{ color }}>
            {score}%
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              color,
              background: `${color}18`,
              border: `1px solid ${color}30`,
            }}
          >
            {riskLabel}
          </span>
        </div>
      </div>
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay, duration: 0.8, type: 'spring', stiffness: 80, damping: 15 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}
