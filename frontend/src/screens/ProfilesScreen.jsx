import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Plus, Edit2, Trash2, Check, X, Users, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import Navbar from '../components/Navbar'

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite Athlete']
const AGE_GROUPS     = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+']
const GOALS          = ['Injury Prevention', 'Performance Improvement', 'Rehabilitation', 'General Fitness', 'Sport-Specific Training']
const SPORTS         = ['', 'Football', 'Basketball', 'Tennis', 'Running/Athletics', 'Swimming', 'Cycling', 'CrossFit', 'Weightlifting', 'Rugby', 'Martial Arts', 'Other']

const AVATAR_COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#0d9488']

function ProfileForm({ initial, onSave, onCancel }) {
  const [name,         setName]         = useState(initial?.name ?? '')
  const [fitnessLevel, setFitnessLevel] = useState(initial?.fitnessLevel ?? 'Intermediate')
  const [ageGroup,     setAgeGroup]     = useState(initial?.ageGroup ?? '25–34')
  const [goal,         setGoal]         = useState(initial?.goal ?? 'Injury Prevention')
  const [sport,        setSport]        = useState(initial?.sport ?? '')

  const valid = name.trim().length > 0

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      className="glass rounded-2xl p-5 border border-accent-primary/20">
      <h3 className="text-sm font-semibold text-text-primary mb-4">{initial ? 'Edit Profile' : 'New Athlete Profile'}</h3>
      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-text-muted mb-1 block">Athlete Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Johnson"
            className="w-full px-3 py-2.5 rounded-xl glass border border-border-subtle text-sm text-text-primary bg-transparent focus:outline-none focus:border-accent-primary placeholder:text-text-muted"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Fitness Level', value: fitnessLevel, onChange: setFitnessLevel, options: FITNESS_LEVELS },
            { label: 'Age Group',     value: ageGroup,     onChange: setAgeGroup,     options: AGE_GROUPS     },
            { label: 'Primary Goal',  value: goal,         onChange: setGoal,         options: GOALS          },
            { label: 'Sport (opt.)',  value: sport,        onChange: setSport,        options: SPORTS         },
          ].map(({ label, value, onChange, options }) => (
            <div key={label}>
              <label className="text-xs text-text-muted mb-1 block">{label}</label>
              <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass border border-border-subtle text-sm text-text-primary bg-transparent focus:outline-none"
              >
                {options.map((o) => <option key={o} value={o}>{o || '— None —'}</option>)}
              </select>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-1">
          <button
            onClick={() => valid && onSave({ name: name.trim(), fitnessLevel, ageGroup, goal, sport })}
            disabled={!valid}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-primary/90 text-white text-sm font-medium disabled:opacity-50 hover:bg-accent-primary transition-all"
          >
            <Check size={13} />{initial ? 'Save Changes' : 'Create Profile'}
          </button>
          <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">
            <X size={13} />Cancel
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function ProfileCard({ profile, isActive, onSelect, onEdit, onDelete, historyCount }) {
  const colorIdx = Math.abs(profile.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % AVATAR_COLORS.length
  const color    = AVATAR_COLORS[colorIdx]
  const initials = profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`glass rounded-2xl p-4 border transition-all duration-200 ${isActive ? 'border-accent-primary/40 bg-accent-primary/5' : 'border-border-subtle hover:border-border-accent'}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: color }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary text-sm">{profile.name}</span>
            {isActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/30 font-medium">Active</span>
            )}
          </div>
          <div className="text-xs text-text-muted mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{profile.fitnessLevel}</span>
            <span>{profile.ageGroup}</span>
            {profile.sport && <span>{profile.sport}</span>}
          </div>
          <div className="text-xs text-text-muted mt-0.5">{profile.goal}</div>
          <div className="text-xs text-text-muted mt-1 flex items-center gap-1">
            <span>{historyCount} {historyCount === 1 ? 'analysis' : 'analyses'}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {!isActive && (
          <button onClick={() => onSelect(profile.id)}
            className="flex items-center gap-1.5 flex-1 justify-center py-1.5 rounded-xl text-xs bg-accent-primary/10 text-accent-primary border border-accent-primary/20 hover:bg-accent-primary/20 transition-all">
            <ChevronRight size={12} />Set Active
          </button>
        )}
        <button onClick={() => onEdit(profile)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs glass border border-border-subtle text-text-secondary hover:text-text-primary transition-all">
          <Edit2 size={12} />Edit
        </button>
        {profile.id !== 'default' && (
          <button onClick={() => onDelete(profile.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs glass border border-danger/20 text-danger/70 hover:text-danger hover:border-danger/40 transition-all">
            <Trash2 size={12} />Delete
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function ProfilesScreen() {
  const profiles        = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const history         = useStore((s) => s.history)
  const setActiveProfile = useStore((s) => s.setActiveProfile)
  const addProfile      = useStore((s) => s.addProfile)
  const updateProfile   = useStore((s) => s.updateProfile)
  const deleteProfile   = useStore((s) => s.deleteProfile)
  const setScreen       = useStore((s) => s.setScreen)

  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const handleSave = (data) => {
    if (editTarget) {
      updateProfile(editTarget.id, data)
    } else {
      addProfile(data)
    }
    setShowForm(false)
    setEditTarget(null)
  }

  const handleEdit = (profile) => {
    setEditTarget(profile)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditTarget(null)
  }

  const profileHistoryCount = (id) => history.filter((h) => h.profileId === id).length

  return (
    <div className="min-h-screen mesh-bg pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Users size={22} className="text-accent-primary" /> Athlete Profiles
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">Manage athletes — each with their own history and analysis context</p>
            </div>
            <div className="flex gap-2">
              {!showForm && (
                <button
                  onClick={() => { setEditTarget(null); setShowForm(true) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-medium hover:brightness-110 transition-all"
                >
                  <Plus size={14} />New Profile
                </button>
              )}
              <button onClick={() => setScreen('upload')} className="px-4 py-2 rounded-xl glass border border-border-subtle text-sm text-text-secondary hover:text-text-primary transition-all">
                Back
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showForm && (
              <div className="mb-5">
                <ProfileForm initial={editTarget} onSave={handleSave} onCancel={handleCancel} />
              </div>
            )}
          </AnimatePresence>

          {/* Active profile banner */}
          <div className="glass rounded-2xl p-4 border border-accent-primary/20 mb-5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/20 flex items-center justify-center">
              <User size={16} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Currently active profile</p>
              <p className="text-sm font-semibold text-text-primary">
                {profiles.find((p) => p.id === activeProfileId)?.name ?? 'Default Athlete'}
              </p>
            </div>
            <button onClick={() => setScreen('upload')} className="ml-auto text-xs text-accent-primary hover:underline">
              Analyze with this profile →
            </button>
          </div>

          {/* Profile grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  isActive={profile.id === activeProfileId}
                  onSelect={setActiveProfile}
                  onEdit={handleEdit}
                  onDelete={deleteProfile}
                  historyCount={profileHistoryCount(profile.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {profiles.length === 0 && (
            <div className="text-center py-16 text-text-muted">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p>No profiles yet. Create one to get started.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
