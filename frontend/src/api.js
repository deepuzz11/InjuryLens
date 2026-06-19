// Empty base so every request goes through Vite's dev proxy (/analyze → localhost:8000).
// In production, deploy the frontend on the same origin as the API or set VITE_API_URL.
const API_BASE = import.meta.env.VITE_API_URL ?? ''
const TIMEOUT_MS = 90_000

function getSuggestion(status) {
  if (status === 413) return 'The file exceeds the 100 MB limit. Compress your video or trim it to under 60 seconds.'
  if (status === 422) return 'The video could not be processed. Ensure your full body is visible in good lighting and the camera is steady.'
  if (status >= 500) return 'The server encountered an error. Please try again in a moment.'
  return 'Check your connection and try again.'
}

async function _fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      const timeout = new Error('Analysis timed out. Please try a shorter video clip.')
      timeout.suggestion = 'Try a clip under 30 seconds and ensure good lighting for faster processing.'
      throw timeout
    }
    if (!err.suggestion) err.suggestion = getSuggestion(err.status || 0)
    throw err
  }
}

/**
 * POST /analyze — upload video for biomechanical analysis.
 */
export async function analyzeVideo(formData) {
  const response = await _fetchWithTimeout(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const err = new Error(data.detail || `Server error (${response.status})`)
    err.suggestion = data.suggestion || getSuggestion(response.status)
    err.status = response.status
    throw err
  }
  return response.json()
}

/**
 * GET /health — server health check.
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE}/health`)
  if (!response.ok) throw new Error('Health check failed')
  return response.json()
}

/**
 * GET /movements — list all supported movement types.
 */
export async function fetchMovements() {
  const response = await fetch(`${API_BASE}/movements`)
  if (!response.ok) return null
  return response.json()
}

/**
 * Generate and download a text report from analysis results.
 */
export function downloadTextReport(results) {
  const { movement_type, scores, supplementary, ai_coaching } = results
  const {
    overall_risk_level, overall_summary, priority_issue, coaching_cues,
    exercise_prescription, warmup_routine, weekly_plan,
    positive_observation, follow_up_timeline,
  } = ai_coaching

  const lines = [
    '╔══════════════════════════════════════════════════╗',
    '║       InjuryLens — Movement Analysis Report      ║',
    '╚══════════════════════════════════════════════════╝',
    '',
    `Movement:       ${movement_type}`,
    `Date:           ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    `Risk Level:     ${overall_risk_level}`,
    '',
    '─── RISK SCORES ─────────────────────────────────────',
    `Overall Risk:       ${scores.overall}%  (${overall_risk_level})`,
    `Left Knee Valgus:   ${scores.knee_valgus_left}%`,
    `Right Knee Valgus:  ${scores.knee_valgus_right}%`,
    `Trunk Lean:         ${scores.trunk_lean}%`,
    `Movement Asymmetry: ${scores.asymmetry}%`,
    `Shoulder Asymmetry: ${scores.shoulder_asymmetry ?? 0}%`,
    `Hip Drop:           ${scores.hip_drop ?? 0}%`,
    '',
    '─── MOVEMENT STATISTICS ─────────────────────────────',
    `Avg Left Knee Angle:   ${supplementary.avg_left_knee_angle}°`,
    `Avg Right Knee Angle:  ${supplementary.avg_right_knee_angle}°`,
    `Avg Trunk Lean:        ${supplementary.avg_trunk_lean_angle}°`,
    `Frames Analyzed:       ${supplementary.total_frames_analyzed}`,
    `Reps Detected:         ${supplementary.rep_count ?? 0}`,
    `Fatigue Score:         ${supplementary.fatigue_score ?? 0}%`,
    '',
    '─── AI COACHING ─────────────────────────────────────',
    'Summary:',
    overall_summary,
    '',
    'Priority Issue:',
    priority_issue,
    '',
    'Movement Cues:',
    ...(coaching_cues ?? []).map((c, i) => `  ${i + 1}. ${c}`),
    '',
    'Exercise Prescription:',
    ...(exercise_prescription ?? []).map((e) => `  • ${e.name} — ${e.sets_reps}\n    Why: ${e.why}`),
    '',
    ...(warmup_routine?.length ? [
      'Warm-up Routine:',
      ...(warmup_routine).map((w) => `  • ${w.name} — ${w.duration} | Focus: ${w.focus}`),
      '',
    ] : []),
    ...(weekly_plan?.length ? [
      'Weekly Training Plan:',
      ...(weekly_plan).map((d) => `  ${d.day} (${d.focus}):\n${d.exercises.map((e) => `    - ${e}`).join('\n')}`),
      '',
    ] : []),
    "What You're Doing Well:",
    positive_observation,
    '',
    'Follow-up Timeline:',
    follow_up_timeline,
    '',
    '─── DISCLAIMER ──────────────────────────────────────',
    'InjuryLens is an AI-assisted tool and does not replace professional medical advice.',
    'Consult a qualified physiotherapist before starting any new exercise program.',
    '',
    'Generated by InjuryLens  ·  AI Movement Analysis',
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `InjuryLens_${movement_type.replace(/\s+/g, '_')}_${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
