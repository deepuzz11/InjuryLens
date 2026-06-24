import React from 'react'
import { User } from 'lucide-react'
import { useStore } from '../store'

export default function TopBar() {
  const totalXP         = useStore((s) => s.totalXP)
  const streak          = useStore((s) => s.streak)
  const profiles        = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const setScreen       = useStore((s) => s.setScreen)

  const activeProfile = profiles?.find((p) => p.id === activeProfileId)
  const initials = activeProfile?.name
    ? activeProfile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : null

  return (
    <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-1">
      {/* XP + streak pill */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-full glass-premium border border-border-accent shadow-lg backdrop-blur-md">
        <span className="text-xs font-bold" style={{ color: 'var(--color-accent-primary, #4f46e5)' }}>
          {(totalXP ?? 0).toLocaleString()} XP
        </span>
        <div className="w-px h-3 bg-border-subtle" />
        <span className="text-xs font-semibold text-text-primary whitespace-nowrap">
          🔥 <span className="text-warning">{streak ?? 0}-day streak</span>
        </span>
      </div>

      {/* Profile avatar button */}
      <button
        onClick={() => setScreen('profiles')}
        title={activeProfile?.name ?? 'Profile'}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:brightness-110 hover:scale-105 transition-all duration-150"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
      >
        {initials ?? <User size={15} />}
      </button>
    </div>
  )
}
