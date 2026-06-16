import React from 'react'

// SVG semi-circle gauge
export default function RiskGauge({ score }) {
  const radius = 60
  const cx = 80
  const cy = 80
  const startAngle = 180
  const endAngle = 0

  // Arc from 180° to 0° (left to right, top half)
  const polarToXY = (angle, r) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  const start = polarToXY(180, radius)
  const end = polarToXY(0, radius)
  const arcPath = `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`

  // Needle angle: 180° (left/low) to 0° (right/high)
  const needleAngle = 180 - score * 1.8  // 0→180°, 100→0°
  const needleLen = 48
  const needleTip = polarToXY(needleAngle, needleLen)

  const riskColor = score <= 30 ? '#22c55e' : score <= 60 ? '#f59e0b' : '#ef4444'

  return (
    <svg viewBox="0 0 160 90" width="160" height="90" aria-label={`Risk gauge: ${score}%`} role="img">
      {/* Background arc */}
      <path
        d={arcPath}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Green zone 0-30% */}
      <path
        d={`M ${polarToXY(180, radius).x} ${polarToXY(180, radius).y} A ${radius} ${radius} 0 0 1 ${polarToXY(126, radius).x} ${polarToXY(126, radius).y}`}
        fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" opacity="0.3"
      />
      {/* Amber zone 30-60% */}
      <path
        d={`M ${polarToXY(126, radius).x} ${polarToXY(126, radius).y} A ${radius} ${radius} 0 0 1 ${polarToXY(72, radius).x} ${polarToXY(72, radius).y}`}
        fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="round" opacity="0.3"
      />
      {/* Red zone 60-100% */}
      <path
        d={`M ${polarToXY(72, radius).x} ${polarToXY(72, radius).y} A ${radius} ${radius} 0 0 1 ${polarToXY(0, radius).x} ${polarToXY(0, radius).y}`}
        fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="round" opacity="0.3"
      />
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={needleTip.x} y2={needleTip.y}
        stroke={riskColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r="4" fill={riskColor} />
      {/* Score text */}
      <text x={cx} y={cy + 18} textAnchor="middle" fill={riskColor} fontSize="13" fontFamily="JetBrains Mono, monospace" fontWeight="600">
        {score}%
      </text>
    </svg>
  )
}
