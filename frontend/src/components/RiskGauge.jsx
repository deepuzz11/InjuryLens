import React from 'react'
import { motion } from 'framer-motion'

const CX = 80
const CY = 76
const R = 58

function polar(angleDeg, r = R) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function arcPath(startDeg, endDeg) {
  const s = polar(startDeg)
  const e = polar(endDeg)
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  const sweep = endDeg > startDeg ? 1 : 0
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} ${sweep} ${e.x} ${e.y}`
}

// The gauge sweeps from 180° (left, low risk) to 0° (right, high risk)
// score 0 → needle at 180°, score 100 → needle at 0°
function needleAngle(score) {
  return 180 - score * 1.8
}

function riskColor(score) {
  if (score <= 30) return '#22c55e'
  if (score <= 60) return '#f59e0b'
  return '#ef4444'
}

/**
 * Props
 * -----
 * score : number 0–100
 * level : "Low" | "Moderate" | "High"
 */
export default function RiskGauge({ score, level }) {
  const safeScore = Math.max(0, Math.min(100, score ?? 0))
  const color = riskColor(safeScore)

  const startAngle = 180    // left edge
  const endAngle = 0        // right edge

  // Zone boundaries (angles): green 180→126, amber 126→72, red 72→0
  const greenEnd = 126      // 30% through the arc
  const amberEnd = 72       // 60% through the arc

  // Needle tip (start at 180° for animation, animate to final angle)
  const finalAngle = needleAngle(safeScore)
  const finalTip = polar(finalAngle, R - 12)
  const initTip = polar(180, R - 12)

  return (
    <svg
      viewBox="0 0 160 100"
      width="160"
      height="100"
      aria-label={`Risk gauge: ${safeScore}% — ${level ?? ''} risk`}
      role="img"
    >
      {/* Background arc */}
      <path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke="rgba(15,23,42,0.10)"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Green zone 0–30% */}
      <path
        d={arcPath(startAngle, greenEnd)}
        fill="none"
        stroke="#22c55e"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Amber zone 30–60% */}
      <path
        d={arcPath(greenEnd, amberEnd)}
        fill="none"
        stroke="#f59e0b"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Red zone 60–100% */}
      <path
        d={arcPath(amberEnd, endAngle)}
        fill="none"
        stroke="#ef4444"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.45"
      />

      {/* Animated needle */}
      <motion.line
        x1={CX}
        y1={CY}
        initial={{ x2: initTip.x, y2: initTip.y }}
        animate={{ x2: finalTip.x, y2: finalTip.y }}
        transition={{ type: 'spring', stiffness: 60, damping: 20, delay: 0.4 }}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Center dot */}
      <motion.circle
        cx={CX}
        cy={CY}
        r="5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      />

      {/* Score label */}
      <text
        x={CX}
        y={CY + 18}
        textAnchor="middle"
        fill={color}
        fontSize="14"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="600"
      >
        {safeScore}%
      </text>

      {/* Risk level label */}
      <text
        x={CX}
        y={CY + 32}
        textAnchor="middle"
        fill={color}
        fontSize="9"
        fontFamily="Inter, sans-serif"
        opacity="0.8"
      >
        {level ? `${level} Risk` : ''}
      </text>
    </svg>
  )
}
