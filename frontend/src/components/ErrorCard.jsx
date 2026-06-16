import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Lightbulb } from 'lucide-react'

/**
 * Props
 * -----
 * message    : string   — primary error description
 * suggestion : string   — optional user-facing hint (how to fix it)
 * onRetry    : function — called when the "Try Again" button is clicked
 */
export default function ErrorCard({ message, suggestion, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-danger/20 bg-danger/5 p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex gap-3 items-start">
        <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-danger mb-0.5">Analysis Error</p>
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>

          {suggestion && (
            <div className="flex items-start gap-1.5 mt-2">
              <Lightbulb size={13} className="text-warning flex-shrink-0 mt-0.5" aria-hidden />
              <p className="text-xs text-text-muted leading-relaxed">{suggestion}</p>
            </div>
          )}
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border-accent px-3 py-1.5 rounded-lg transition-all duration-200"
            aria-label="Retry analysis"
          >
            <RefreshCw size={12} aria-hidden />
            Try Again
          </button>
        )}
      </div>
    </motion.div>
  )
}
