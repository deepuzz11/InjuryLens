import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

function scoreMeta(score) {
  if (score == null) return null
  const s = Math.max(0, Math.min(100, score))
  if (s <= 30) return { color: '#22c55e', label: 'Low' }
  if (s <= 60) return { color: '#f59e0b', label: 'Moderate' }
  return { color: '#ef4444', label: 'High' }
}

/**
 * Props
 * -----
 * items : Array<{ title: string, content: string, score?: number }>
 *
 * Each item shows its title (and optional colored score badge) when collapsed.
 * Only one item is open at a time.
 */
export default function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i))

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        const meta = scoreMeta(item.score)

        return (
          <div
            key={i}
            className="rounded-xl border border-border-subtle overflow-hidden"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary"
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${i}`}
            >
              <span className="text-sm font-medium text-text-primary">{item.title}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Score badge — only visible when collapsed */}
                {!isOpen && meta && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs px-2 py-0.5 rounded-full font-mono font-medium"
                    style={{
                      color: meta.color,
                      background: `${meta.color}1a`,
                      border: `1px solid ${meta.color}33`,
                    }}
                  >
                    {item.score}%
                  </motion.span>
                )}
                <ChevronDown
                  size={15}
                  className="text-text-muted flex-shrink-0 transition-transform duration-200"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  aria-hidden
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`accordion-panel-${i}`}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-4 pb-4 pt-1 border-t border-border-subtle">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
