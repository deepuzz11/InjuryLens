import React, { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Zap } from 'lucide-react'

const ANGLE_LINES = [
  { key: 'left_knee_angle',  name: 'L.Knee°',   color: '#f59e0b' },
  { key: 'right_knee_angle', name: 'R.Knee°',   color: '#f97316' },
  { key: 'trunk_lean_angle', name: 'Trunk°',    color: '#ec4899' },
]

const VELOCITY_LINES = [
  { key: 'left_knee_velocity',  name: 'L.Knee Vel',  color: '#f59e0b', unit: '°/f' },
  { key: 'right_knee_velocity', name: 'R.Knee Vel',  color: '#f97316', unit: '°/f' },
  { key: 'trunk_lean_velocity', name: 'Trunk Vel',   color: '#ec4899', unit: '°/f' },
]

const ACCEL_LINES = [
  { key: 'left_knee_acceleration',  name: 'L.Knee Accel', color: '#f59e0b', unit: '°/f²' },
  { key: 'right_knee_acceleration', name: 'R.Knee Accel', color: '#f97316', unit: '°/f²' },
]

const DEPTH_3D_LINES = [
  { key: 'trunk_rotation_3d', name: 'Trunk Rot 3D', color: '#06b6d4', unit: '%' },
  { key: 'hip_rotation_3d',   name: 'Hip Rot 3D',   color: '#8b5cf6', unit: '%' },
]

const MODE_OPTIONS = [
  { id: 'angles',   label: 'Angles',     lines: ANGLE_LINES },
  { id: 'velocity', label: 'Velocity',   lines: VELOCITY_LINES },
  { id: 'accel',    label: 'Acceleration', lines: ACCEL_LINES },
  { id: '3d',       label: '3D Rotation', lines: DEPTH_3D_LINES },
]

const CustomTooltip = ({ active, payload, label, mode }) => {
  if (!active || !payload?.length) return null
  const unit = mode === 'angles' ? '°' : mode === '3d' ? '%' : '°/f'
  return (
    <div className="glass rounded-xl p-3 border border-border-accent shadow-xl text-xs min-w-[160px]">
      <p className="text-text-muted mb-2">Frame {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-text-secondary">{p.name}</span>
          </span>
          <span className="text-text-primary font-semibold font-mono">{p.value}{unit}</span>
        </p>
      ))}
    </div>
  )
}

export default function TimelineChart({ data = [] }) {
  const [mode, setMode]         = useState('angles')
  const [activeLines, setActiveLines] = useState({})

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-text-muted">
        No timeline data available
      </div>
    )
  }

  const currentMode = MODE_OPTIONS.find((m) => m.id === mode)
  const lines       = currentMode?.lines ?? ANGLE_LINES

  const chartData = data.map((d) => ({
    frame: d.frame_index,
    ...Object.fromEntries(lines.map((l) => [l.key, d[l.key] ?? 0])),
  }))

  const isActive = (key) => activeLines[`${mode}_${key}`] !== false

  const toggleLine = (key) =>
    setActiveLines((prev) => ({ ...prev, [`${mode}_${key}`]: !isActive(key) }))

  const domain   = mode === 'angles' ? [0, 180] : mode === '3d' ? [0, 20] : 'auto'
  const yFmt     = (v) => mode === 'angles' ? `${v}°` : mode === '3d' ? `${v}%` : `${v}`

  return (
    <div>
      {/* Mode switcher */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setMode(opt.id)}
            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-all ${
              mode === opt.id
                ? 'bg-accent-primary/20 border-accent-primary/40 text-accent-primary'
                : 'border-border-subtle text-text-muted hover:text-text-secondary'
            }`}
          >
            {opt.id === '3d' && <Zap size={9} />}
            {opt.id === 'velocity' && '∂'}
            {opt.id === 'accel' && '∂²'}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Line toggles */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {lines.map((l) => (
          <button
            key={l.key}
            onClick={() => toggleLine(l.key)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
              isActive(l.key)
                ? 'border-transparent text-white'
                : 'bg-transparent border-border-subtle text-text-muted'
            }`}
            style={isActive(l.key) ? { background: l.color } : {}}
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
          />
          <YAxis
            domain={domain}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yFmt}
          />
          <Tooltip content={<CustomTooltip mode={mode} />} />
          {mode === 'angles' && (
            <>
              <ReferenceLine y={165} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.35} />
              <ReferenceLine y={25}  stroke="#ec4899" strokeDasharray="4 4" strokeOpacity={0.35} />
            </>
          )}
          {mode === 'velocity' && (
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          )}
          {lines.map((l) =>
            isActive(l.key) ? (
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
        {mode === 'angles'   && 'Dashed: valgus threshold (165°) and trunk lean threshold (25°)'}
        {mode === 'velocity' && 'Joint velocity in degrees per frame. Spikes indicate rapid deceleration / ACL risk events.'}
        {mode === 'accel'    && 'Joint acceleration (Δvelocity). High values correlate with impact loading.'}
        {mode === '3d'       && '3D rotation from depth (z) coordinates — trunk and hip rotation using MediaPipe depth data.'}
      </p>
    </div>
  )
}
