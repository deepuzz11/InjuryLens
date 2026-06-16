import React, { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

const LINES = [
  { key: 'left_knee_angle',  name: 'L.Knee Angle', color: '#f59e0b', refLine: 165, refLabel: 'Valgus threshold' },
  { key: 'right_knee_angle', name: 'R.Knee Angle', color: '#f97316' },
  { key: 'trunk_lean_angle', name: 'Trunk Lean',   color: '#ec4899', refLine: 25 },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 border border-border-accent shadow-xl text-xs min-w-[140px]">
      <p className="text-text-muted mb-2">Frame {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-text-secondary">{p.name}</span>
          </span>
          <span className="text-text-primary font-semibold font-mono">{p.value}°</span>
        </p>
      ))}
    </div>
  )
}

export default function TimelineChart({ data = [] }) {
  const [activeLines, setActiveLines] = useState(
    Object.fromEntries(LINES.map((l) => [l.key, true]))
  )

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-text-muted">
        No timeline data available
      </div>
    )
  }

  const chartData = data.map((d) => ({
    frame:             d.frame_index,
    left_knee_angle:   d.left_knee_angle,
    right_knee_angle:  d.right_knee_angle,
    trunk_lean_angle:  d.trunk_lean_angle,
  }))

  const toggleLine = (key) =>
    setActiveLines((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div>
      {/* Toggle buttons */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {LINES.map((l) => (
          <button
            key={l.key}
            onClick={() => toggleLine(l.key)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
              activeLines[l.key]
                ? 'border-transparent text-white'
                : 'bg-transparent border-border-subtle text-text-muted'
            }`}
            style={activeLines[l.key] ? { background: l.color } : {}}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            {l.name}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="frame"
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Frame', position: 'insideBottom', offset: 0, fill: '#475569', fontSize: 10 }}
          />
          <YAxis
            domain={[0, 180]}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}°`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={165} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.35} />
          <ReferenceLine y={25}  stroke="#ec4899" strokeDasharray="4 4" strokeOpacity={0.35} />
          {LINES.map((l) =>
            activeLines[l.key] ? (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name}
                stroke={l.color}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[10px] text-text-muted mt-1">
        Dashed lines: valgus threshold (165°) and trunk lean threshold (25°)
      </p>
    </div>
  )
}
