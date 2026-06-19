import React from 'react'

function riskColor(score) {
  if (score == null || score < 30) return '#22c55e'
  if (score < 60) return '#f59e0b'
  return '#ef4444'
}

function riskOpacity(score) {
  if (score == null || score < 10) return 0.08
  return 0.12 + (score / 100) * 0.55
}

export default function BodyMap({ scores = {} }) {
  const lk  = scores.knee_valgus_left  ?? 0
  const rk  = scores.knee_valgus_right ?? 0
  const tl  = scores.trunk_lean        ?? 0
  const sh  = scores.shoulder_asymmetry ?? 0
  const hip = scores.hip_drop          ?? 0

  const c = {
    lKnee:    riskColor(lk),
    rKnee:    riskColor(rk),
    trunk:    riskColor(tl),
    shoulder: riskColor(sh),
    hip:      riskColor(hip),
  }
  const o = {
    lKnee:    riskOpacity(lk),
    rKnee:    riskOpacity(rk),
    trunk:    riskOpacity(tl),
    shoulder: riskOpacity(sh),
    hip:      riskOpacity(hip),
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 280" width="110" height="260" aria-label="Body risk heat map">

        {/* ── Highlighted risk zones (behind the skeleton) ── */}

        {/* Shoulder zone */}
        <ellipse cx="60" cy="72" rx="28" ry="10" fill={c.shoulder} opacity={o.shoulder} />

        {/* Trunk zone */}
        <rect x="38" y="82" width="44" height="58" rx="8" fill={c.trunk} opacity={o.trunk} />

        {/* Hip zone */}
        <ellipse cx="60" cy="148" rx="22" ry="10" fill={c.hip} opacity={o.hip} />

        {/* Left knee zone */}
        <ellipse cx="48" cy="196" rx="12" ry="14" fill={c.lKnee} opacity={o.lKnee} />

        {/* Right knee zone */}
        <ellipse cx="72" cy="196" rx="12" ry="14" fill={c.rKnee} opacity={o.rKnee} />

        {/* ── Skeleton ── */}

        {/* Head */}
        <circle cx="60" cy="30" r="16" fill="none" stroke="#4f46e5" strokeWidth="2.5" />

        {/* Neck */}
        <line x1="60" y1="46" x2="60" y2="58" stroke="#64748b" strokeWidth="2" />

        {/* Shoulders */}
        <line x1="60" y1="62" x2="34" y2="75" stroke="#64748b" strokeWidth="2" />
        <line x1="60" y1="62" x2="86" y2="75" stroke="#64748b" strokeWidth="2" />

        {/* Left arm */}
        <line x1="34" y1="75" x2="24" y2="105" stroke="#64748b" strokeWidth="2" />
        <line x1="24" y1="105" x2="18" y2="130" stroke="#64748b" strokeWidth="2" />

        {/* Right arm */}
        <line x1="86" y1="75" x2="96" y2="105" stroke="#64748b" strokeWidth="2" />
        <line x1="96" y1="105" x2="102" y2="130" stroke="#64748b" strokeWidth="2" />

        {/* Torso */}
        <line x1="60" y1="62" x2="60" y2="140" stroke="#64748b" strokeWidth="2" />

        {/* Pelvis */}
        <line x1="42" y1="140" x2="78" y2="140" stroke="#64748b" strokeWidth="2" />

        {/* Left leg */}
        <line x1="48" y1="140" x2="46" y2="185" stroke="#64748b" strokeWidth="2" />
        <line x1="46" y1="185" x2="44" y2="230" stroke="#64748b" strokeWidth="2" />
        <line x1="44" y1="230" x2="40" y2="256" stroke="#64748b" strokeWidth="2" />

        {/* Right leg */}
        <line x1="72" y1="140" x2="74" y2="185" stroke="#64748b" strokeWidth="2" />
        <line x1="74" y1="185" x2="76" y2="230" stroke="#64748b" strokeWidth="2" />
        <line x1="76" y1="230" x2="80" y2="256" stroke="#64748b" strokeWidth="2" />

        {/* Joint dots */}
        {[
          [60, 62], [34, 75], [86, 75],         // shoulders + neck
          [24, 105], [96, 105],                  // elbows
          [18, 130], [102, 130],                 // wrists
          [48, 140], [72, 140],                  // hips
          [46, 185], [74, 185],                  // knees
          [44, 230], [76, 230],                  // ankles
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3.5" fill="#4f46e5" opacity="0.85" />
        ))}

        {/* Risk-colored knee dots */}
        <circle cx="46" cy="185" r="5" fill={c.lKnee} opacity="0.9" />
        <circle cx="74" cy="185" r="5" fill={c.rKnee} opacity="0.9" />
      </svg>

      {/* Legend */}
      <div className="flex gap-3 mt-2 text-[10px] text-text-muted">
        {[['#22c55e', 'Low'], ['#f59e0b', 'Mod.'], ['#ef4444', 'High']].map(([col, lbl]) => (
          <span key={lbl} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: col }} />
            {lbl}
          </span>
        ))}
      </div>
    </div>
  )
}
