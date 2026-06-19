import React, { useState, useRef, useEffect } from 'react'
import { Share2, Download, QrCode, X, Loader } from 'lucide-react'

function RiskColor(level) {
  return { Low: '#22c55e', Moderate: '#f59e0b', High: '#ef4444' }[level] ?? '#6366f1'
}

// Generates a shareable summary card as a canvas data URL
async function buildShareCard(results) {
  const { movement_type, scores, ai_coaching, supplementary } = results
  const level   = ai_coaching?.overall_risk_level ?? 'Unknown'
  const overall = scores?.overall ?? 0
  const mqs     = supplementary?.mqs_score ?? 0
  const mqsGrade = supplementary?.mqs_grade ?? '—'

  const W = 600, H = 320
  const canvas = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0f0f1a')
  bg.addColorStop(1, '#1a1a2e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Accent stripe
  ctx.fillStyle = '#6366f1'
  ctx.fillRect(0, 0, 5, H)

  // Logo / brand
  ctx.font = 'bold 22px system-ui'
  ctx.fillStyle = '#6366f1'
  ctx.fillText('InjuryLens', 24, 42)
  ctx.font = '12px system-ui'
  ctx.fillStyle = '#64748b'
  ctx.fillText('AI Movement Analysis', 24, 60)

  // Movement type
  ctx.font = 'bold 28px system-ui'
  ctx.fillStyle = '#f1f5f9'
  ctx.fillText(movement_type, 24, 108)

  // Risk badge
  const rc = RiskColor(level)
  ctx.fillStyle = rc + '22'
  ctx.beginPath()
  ctx.roundRect?.(24, 118, 90, 26, 13) ?? ctx.rect(24, 118, 90, 26)
  ctx.fill()
  ctx.font = 'bold 13px system-ui'
  ctx.fillStyle = rc
  ctx.fillText(`${level} Risk`, 36, 136)

  // Big score ring
  const cx = W - 100, cy = 100, radius = 60
  ctx.strokeStyle = '#1e2030'
  ctx.lineWidth   = 10
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()
  const angle = (overall / 100) * Math.PI * 2 - Math.PI / 2
  ctx.strokeStyle = rc
  ctx.lineWidth   = 10
  ctx.lineCap     = 'round'
  ctx.beginPath()
  ctx.arc(cx, cy, radius, -Math.PI / 2, angle)
  ctx.stroke()
  ctx.font = 'bold 30px system-ui'
  ctx.fillStyle = '#f1f5f9'
  ctx.textAlign  = 'center'
  ctx.fillText(`${overall}%`, cx, cy + 10)
  ctx.font = '11px system-ui'
  ctx.fillStyle = '#64748b'
  ctx.fillText('Overall', cx, cy + 26)
  ctx.textAlign  = 'left'

  // Stats row
  const stats = [
    { label: 'MQS', value: `${mqs} (${mqsGrade})` },
    { label: 'Reps', value: supplementary?.rep_count ?? 0 },
    { label: 'Fatigue', value: `${supplementary?.fatigue_score ?? 0}%` },
  ]
  stats.forEach(({ label, value }, i) => {
    const x = 24 + i * 170
    ctx.fillStyle = '#334155'
    ctx.beginPath()
    ctx.roundRect?.(x, 165, 150, 56, 10) ?? ctx.rect(x, 165, 150, 56)
    ctx.fill()
    ctx.font = 'bold 20px system-ui'
    ctx.fillStyle = '#f1f5f9'
    ctx.fillText(String(value), x + 12, 195)
    ctx.font = '11px system-ui'
    ctx.fillStyle = '#64748b'
    ctx.fillText(label, x + 12, 212)
  })

  // Footer watermark
  ctx.font = '11px system-ui'
  ctx.fillStyle = '#475569'
  ctx.fillText('Analyzed with InjuryLens · injurylens.app', 24, H - 16)

  return canvas.toDataURL('image/png')
}

export default function ShareCard({ results }) {
  const [open,    setOpen]    = useState(false)
  const [cardUrl, setCardUrl] = useState(null)
  const [qrUrl,   setQrUrl]   = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || cardUrl) return
    let cancelled = false

    async function generate() {
      setLoading(true)
      try {
        const card = await buildShareCard(results)
        if (!cancelled) setCardUrl(card)

        // QR code for the current page URL
        const QRCode = await import('qrcode')
        const pageUrl = `${window.location.origin}${window.location.pathname}`
        const qr = await QRCode.default.toDataURL(pageUrl, { width: 120, margin: 1, color: { dark: '#6366f1', light: '#0f0f1a' } })
        if (!cancelled) setQrUrl(qr)
      } catch (err) {
        console.error('Share card generation failed:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [open, results])

  const downloadCard = () => {
    if (!cardUrl) return
    const a    = document.createElement('a')
    a.href     = cardUrl
    a.download = `InjuryLens_${(results?.movement_type ?? 'Analysis').replace(/\s+/g, '_')}_card.png`
    a.click()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Link copied!'))
      .catch(() => {})
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-border-subtle text-text-secondary hover:text-accent-primary hover:border-accent-primary/30 transition-all"
      >
        <QrCode size={14} />Share Card
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-elevated rounded-2xl border border-border-accent shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Share2 size={14} className="text-accent-primary" />Share Your Analysis
              </h3>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={16} />
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center h-40">
                <Loader size={24} className="animate-spin text-accent-primary" />
              </div>
            )}

            {!loading && cardUrl && (
              <>
                <img src={cardUrl} alt="Analysis summary card" className="w-full rounded-xl mb-4 border border-border-subtle" />
                <div className="flex gap-2 mb-4">
                  <button onClick={downloadCard}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm bg-accent-primary/15 border border-accent-primary/30 text-accent-primary hover:bg-accent-primary/25 transition-all">
                    <Download size={13} />Download PNG
                  </button>
                  <button onClick={copyLink}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm glass border border-border-subtle text-text-secondary hover:text-text-primary transition-all">
                    <Share2 size={13} />Copy Link
                  </button>
                </div>

                {qrUrl && (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-bg-elevated border border-border-subtle">
                    <img src={qrUrl} alt="QR code" className="w-20 h-20 rounded-lg" />
                    <div>
                      <p className="text-xs font-semibold text-text-primary mb-1">QR Code</p>
                      <p className="text-xs text-text-muted leading-relaxed">Scan to open InjuryLens on another device or share on social media.</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
