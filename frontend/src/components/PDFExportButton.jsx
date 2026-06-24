import React, { useState, useRef } from 'react'
import { FileDown, Loader } from 'lucide-react'

export default function PDFExportButton({ results, targetRef }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (exporting) return
    setExporting(true)
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const element = targetRef?.current ?? document.getElementById('results-container')
      if (!element) {
        throw new Error('Results container not found')
      }

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#f8fafc',
        logging: false,
        ignoreElements: (el) => el.classList?.contains('pdf-exclude'),
        onclone: (_doc, clonedEl) => {
          // html2canvas cannot render <video> — replace each with a neutral placeholder
          clonedEl.querySelectorAll('video').forEach((v) => {
            const ph = _doc.createElement('div')
            ph.style.cssText = [
              `width:${v.offsetWidth || 320}px`,
              `height:${v.offsetHeight || 240}px`,
              'background:#f1f5f9',
              'border-radius:8px',
              'display:flex',
              'align-items:center',
              'justify-content:center',
              'color:#94a3b8',
              'font-size:12px',
              'font-family:sans-serif',
            ].join(';')
            ph.textContent = 'Annotated video — open in app to view'
            v.replaceWith(ph)
          })
        },
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW  = pdf.internal.pageSize.getWidth()
      const pageH  = pdf.internal.pageSize.getHeight()
      const margin = 10
      const imgW   = pageW - margin * 2
      const imgH   = (canvas.height * imgW) / canvas.width

      // Header — deep indigo on white
      pdf.setFillColor(79, 70, 229)
      pdf.rect(0, 0, pageW, 18, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('InjuryLens', margin, 12)
      pdf.setTextColor(224, 220, 255)
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text('AI Movement Analysis Report', margin + 32, 12)
      pdf.text(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), pageW - margin, 12, { align: 'right' })

      // Risk summary line — light surface
      const overall   = results?.scores?.overall ?? 0
      const riskLevel = results?.ai_coaching?.overall_risk_level ?? 'Unknown'
      pdf.setFillColor(241, 245, 249)
      pdf.rect(0, 18, pageW, 10, 'F')
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(15, 23, 42)
      pdf.text(`${results?.movement_type ?? ''} Analysis`, margin, 25)
      const riskColors = { Low: [34, 197, 94], Moderate: [245, 158, 11], High: [239, 68, 68] }
      const [r, g, b] = riskColors[riskLevel] ?? [148, 163, 184]
      pdf.setTextColor(r, g, b)
      pdf.text(`${riskLevel} Risk — ${overall}% Overall`, pageW - margin, 25, { align: 'right' })

      // Screenshot content
      const imgData    = canvas.toDataURL('image/jpeg', 0.88)
      const startY     = 30
      let   currentY   = startY

      if (imgH <= pageH - currentY - margin) {
        pdf.addImage(imgData, 'JPEG', margin, currentY, imgW, imgH)
      } else {
        // Multi-page: slice canvas into page-sized chunks
        const pageImgH  = pageH - currentY - margin
        const totalPages = Math.ceil(imgH / pageImgH)
        for (let p = 0; p < totalPages; p++) {
          if (p > 0) { pdf.addPage(); currentY = margin }
          const sliceCanvas  = document.createElement('canvas')
          const sliceRatio   = canvas.width / imgW
          sliceCanvas.width  = canvas.width
          sliceCanvas.height = pageImgH * sliceRatio
          const sliceCtx     = sliceCanvas.getContext('2d')
          sliceCtx.drawImage(canvas, 0, p * pageImgH * sliceRatio, canvas.width, pageImgH * sliceRatio, 0, 0, sliceCanvas.width, sliceCanvas.height)
          const sliceData    = sliceCanvas.toDataURL('image/jpeg', 0.88)
          pdf.addImage(sliceData, 'JPEG', margin, currentY, imgW, pageImgH)
        }
      }

      // Footer on last page
      pdf.setFontSize(7)
      pdf.setTextColor(71, 85, 105)
      pdf.text(
        'InjuryLens is an AI-assisted tool and does not replace professional medical advice. Consult a qualified physiotherapist.',
        pageW / 2, pageH - 6, { align: 'center' }
      )

      pdf.save(`InjuryLens_${(results?.movement_type ?? 'Report').replace(/\s+/g, '_')}_${Date.now()}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export failed. Please try the text download instead.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-border-subtle text-text-secondary hover:text-accent-primary hover:border-accent-primary/30 transition-all disabled:opacity-60"
      aria-label="Export clinic-quality PDF report"
    >
      {exporting
        ? <><Loader size={14} className="animate-spin" />Generating PDF…</>
        : <><FileDown size={14} />Export PDF</>
      }
    </button>
  )
}
