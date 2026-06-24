import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

/**
 * options: string[] | { value: string; label: string }[]
 * onChange: (value: string) => void  — receives the value directly, not an event
 */
export default function GlassSelect({ value, onChange, options = [], className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const normalised = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o || '— None —' } : o
  )
  const selected = normalised.find((o) => o.value === value) ?? { value, label: value || '— None —' }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-2 pl-3 pr-2.5 py-2 w-full rounded-xl glass border border-border-subtle text-sm text-text-primary transition-all duration-150 hover:border-accent-primary/50 hover:bg-white/5 hover:shadow-sm focus:outline-none focus:border-accent-primary"
      >
        <span className="flex-1 text-left truncate group-hover:text-accent-primary transition-colors duration-150">
          {selected.label}
        </span>
        <ChevronDown
          size={13}
          className={`flex-shrink-0 transition-all duration-200 group-hover:text-accent-primary ${
            open ? 'rotate-180 text-accent-primary' : 'text-text-muted'
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            className="absolute z-50 mt-1.5 w-full min-w-max rounded-xl glass-elevated border border-border-accent shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {normalised.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`group/item relative px-3 py-2.5 text-sm cursor-pointer select-none transition-all duration-150 ${
                  opt.value === value
                    ? 'bg-gradient-to-r from-accent-primary/20 to-accent-primary/5 text-accent-primary font-semibold'
                    : 'text-text-primary hover:bg-gradient-to-r hover:from-accent-primary/10 hover:to-transparent hover:text-accent-primary hover:pl-4'
                }`}
              >
                {opt.value === value && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-accent-primary" />
                )}
                {opt.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
