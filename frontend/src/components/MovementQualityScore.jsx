import React from 'react'
import { motion } from 'framer-motion'
import { Award } from 'lucide-react'

const GRADE_COLORS = {
  A: { text: 'text-success',  bg: 'bg-success/15',  border: 'border-success/30',  ring: '#22c55e' },
  B: { text: 'text-accent-primary', bg: 'bg-accent-primary/15', border: 'border-accent-primary/30', ring: '#6366f1' },
  C: { text: 'text-warning',  bg: 'bg-warning/15',  border: 'border-warning/30',  ring: '#f59e0b' },
  D: { text: 'text-orange-400', bg: 'bg-orange-400/15', border: 'border-orange-400/30', ring: '#fb923c' },
  F: { text: 'text-danger',   bg: 'bg-danger/15',   border: 'border-danger/30',   ring: '#ef4444' },
}

const GRADE_DESCRIPTIONS = {
  A: 'Elite form — exceptional movement quality.',
  B: 'Above average — minor improvements available.',
  C: 'Average — targeted work will yield clear gains.',
  D: 'Below average — focused correction needed.',
  F: 'Significant risk — prioritize technique immediately.',
}

function MQSRing({ score, grade }) {
  const colors = GRADE_COLORS[grade] ?? GRADE_COLORS.C
  const R      = 44
  const circ   = 2 * Math.PI * R
  const offset = circ * (1 - score / 100)

  return (
    <svg width={104} height={104} viewBox="0 0 104 104">
      <circle cx={52} cy={52} r={R} fill="none" stroke="#1e2030" strokeWidth={9} />
      <motion.circle
        cx={52} cy={52} r={R}
        fill="none"
        stroke={colors.ring}
        strokeWidth={9}
        strokeDasharray={circ}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <text x={52} y={48} textAnchor="middle" fill="#f1f5f9" fontSize={26} fontWeight="bold" fontFamily="monospace">
        {grade}
      </text>
      <text x={52} y={64} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="system-ui">
        {score}
      </text>
    </svg>
  )
}

export default function MovementQualityScore({ mqsScore, mqsGrade, mqsPercentile }) {
  const score  = mqsScore ?? 0
  const grade  = mqsGrade ?? 'C'
  const pctile = mqsPercentile ?? 50
  const colors = GRADE_COLORS[grade] ?? GRADE_COLORS.C

  return (
    <div className={`rounded-2xl p-4 border ${colors.border} ${colors.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <Award size={14} className={colors.text} />
        <span className="text-xs font-semibold text-text-primary">Movement Quality Score</span>
      </div>

      <div className="flex items-center gap-4">
        <MQSRing score={Math.round(score)} grade={grade} />

        <div className="flex-1 flex flex-col gap-2">
          <div>
            <p className={`text-sm font-bold ${colors.text}`}>Grade {grade}</p>
            <p className="text-xs text-text-muted leading-relaxed">{GRADE_DESCRIPTIONS[grade]}</p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-muted">Percentile</span>
              <span className={`text-xs font-mono font-bold ${colors.text}`}>Top {100 - pctile}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: colors.ring }}
                initial={{ width: 0 }}
                animate={{ width: `${pctile}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-text-muted">Better than {pctile}% of users at this movement</p>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">MQS Score</span>
            <span className={`font-mono font-bold ${colors.text}`}>{score}/100</span>
          </div>
        </div>
      </div>
    </div>
  )
}
