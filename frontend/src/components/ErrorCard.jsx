import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorCard({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-danger/20 bg-danger/5 p-4 flex gap-3 items-start"
      role="alert"
    >
      <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-danger mb-0.5">Analysis Error</p>
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border-accent px-3 py-1.5 rounded-lg transition-all"
          aria-label="Retry analysis"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </motion.div>
  )
}
