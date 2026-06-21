import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Database, Bell, Shield, Download, Trash2, ChevronRight, CheckCircle } from 'lucide-react'
import { useStore } from '../store'

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-accent-primary' : 'bg-bg-elevated border border-border-subtle'
      }`}
      style={checked ? { background: '#4f46e5' } : { background: 'rgba(15,23,42,0.10)' }}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-border-subtle overflow-hidden mb-4"
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-bg-elevated/50">
        <Icon size={15} className="text-accent-primary" />
        <p className="text-xs font-bold text-text-primary uppercase tracking-wide">{title}</p>
      </div>
      <div className="divide-y divide-border-subtle">
        {children}
      </div>
    </motion.div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

export default function SettingsScreen() {
  const settings       = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const authUser       = useStore((s) => s.authUser)
  const logout         = useStore((s) => s.logout)
  const clearHistory   = useStore((s) => s.clearHistory)
  const history        = useStore((s) => s.history)
  const goals          = useStore((s) => s.goals)
  const recoveryLogs   = useStore((s) => s.recoveryLogs)
  const totalXP        = useStore((s) => s.totalXP ?? 0)
  const earnedAchievements = useStore((s) => s.earnedAchievements)

  const [saved, setSaved]         = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  function handleExportData() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: authUser,
      history,
      goals,
      recoveryLogs,
      settings,
      stats: {
        totalAnalyses: history.length,
        totalXP,
        achievementsUnlocked: earnedAchievements.length,
      },
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `injurylens-data-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function flash() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function set(key, val) {
    updateSettings({ [key]: val })
    flash()
  }

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Settings size={22} className="text-accent-primary" />
              Settings
            </h1>
            <p className="text-sm text-text-muted mt-0.5">Customize your InjuryLens experience</p>
          </div>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-success text-xs font-semibold px-3 py-1.5 rounded-lg bg-success/10"
            >
              <CheckCircle size={13} />
              Saved
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Account */}
      <Section title="Account" icon={User}>
        <SettingRow label="Name" description="Your display name across the app">
          <span className="text-sm text-text-muted font-medium">{authUser?.name ?? '—'}</span>
        </SettingRow>
        <SettingRow label="Email" description="Linked account email">
          <span className="text-sm text-text-muted">{authUser?.email ?? '—'}</span>
        </SettingRow>
        <SettingRow label="Total XP" description="Experience points earned from achievements">
          <span className="text-sm font-bold text-accent-primary">{totalXP} XP</span>
        </SettingRow>
        <SettingRow label="Analyses Completed" description="Total videos analysed">
          <span className="text-sm font-mono font-bold text-text-primary">{history.length}</span>
        </SettingRow>
      </Section>

      {/* Analysis Behaviour */}
      <Section title="Analysis Behaviour" icon={Settings}>
        <SettingRow label="Auto-save to History" description="Automatically save results after each analysis">
          <Toggle checked={settings.autoSaveHistory ?? true} onChange={(v) => set('autoSaveHistory', v)} />
        </SettingRow>
        <SettingRow label="Show Frame Timeline" description="Display joint angle chart in results">
          <Toggle checked={settings.showTimeline ?? true} onChange={(v) => set('showTimeline', v)} />
        </SettingRow>
        <SettingRow label="Show Body Heat Map" description="Display body diagram with risk zones">
          <Toggle checked={settings.showBodyMap ?? true} onChange={(v) => set('showBodyMap', v)} />
        </SettingRow>
        <SettingRow label="Show Warm-up Routine" description="Display warm-up exercises in AI coaching">
          <Toggle checked={settings.showWarmup ?? true} onChange={(v) => set('showWarmup', v)} />
        </SettingRow>
        <SettingRow label="Show Weekly Training Plan" description="Include 5-day plan in AI coaching output">
          <Toggle checked={settings.showWeeklyPlan ?? true} onChange={(v) => set('showWeeklyPlan', v)} />
        </SettingRow>
      </Section>

      {/* Risk Alerts */}
      <Section title="Risk Alerts" icon={Bell}>
        <SettingRow label="Enable Risk Alerts" description="Show warnings when metric trends worsen">
          <Toggle checked={settings.showRiskAlerts ?? true} onChange={(v) => set('showRiskAlerts', v)} />
        </SettingRow>
        <SettingRow label="Alert Threshold" description="Alert when a metric exceeds this percentage">
          <div className="flex items-center gap-2">
            <input
              type="range" min={30} max={90} step={5}
              value={settings.riskAlertThreshold ?? 60}
              onChange={(e) => set('riskAlertThreshold', Number(e.target.value))}
              className="w-24 accent-indigo-500"
            />
            <span className="text-sm font-bold font-mono text-accent-primary w-8">{settings.riskAlertThreshold ?? 60}%</span>
          </div>
        </SettingRow>
      </Section>

      {/* Display */}
      <Section title="Display" icon={Settings}>
        <SettingRow label="Measurement Units" description="Units used in data display">
          <select
            value={settings.units ?? 'metric'}
            onChange={(e) => set('units', e.target.value)}
            className="text-sm border border-border-subtle rounded-lg px-2 py-1 bg-bg-base text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="metric">Metric (kg, cm)</option>
            <option value="imperial">Imperial (lbs, in)</option>
          </select>
        </SettingRow>
        <SettingRow label="Weekly Report Day" description="Day for automated weekly summary">
          <select
            value={settings.weeklyReportDay ?? 'Sunday'}
            onChange={(e) => set('weeklyReportDay', e.target.value)}
            className="text-sm border border-border-subtle rounded-lg px-2 py-1 bg-bg-base text-text-primary focus:outline-none focus:border-accent-primary"
          >
            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      {/* Data Management */}
      <Section title="Data Management" icon={Database}>
        <SettingRow label="Export All Data" description={`Export ${history.length} analyses, ${goals.length} goals, and ${recoveryLogs.length} recovery logs as JSON`}>
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent-primary border border-accent-primary/30 rounded-lg px-3 py-1.5 hover:bg-accent-primary/10 transition-colors"
          >
            <Download size={13} />
            Export
          </button>
        </SettingRow>
        <SettingRow label="Clear Analysis History" description={`Permanently delete all ${history.length} saved analyses`}>
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-danger">Are you sure?</span>
              <button onClick={() => { clearHistory(); setShowClearConfirm(false) }}
                className="text-xs font-semibold text-white bg-danger rounded-lg px-2 py-1">Yes, clear</button>
              <button onClick={() => setShowClearConfirm(false)}
                className="text-xs text-text-muted">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 text-xs font-semibold text-danger border border-danger/30 rounded-lg px-3 py-1.5 hover:bg-danger/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </SettingRow>
      </Section>

      {/* Privacy */}
      <Section title="Privacy & Security" icon={Shield}>
        <SettingRow label="Data Storage" description="All analysis data is stored locally in your browser">
          <span className="text-xs text-success font-semibold bg-success/10 px-2 py-1 rounded-lg">Local Only</span>
        </SettingRow>
        <SettingRow label="Video Processing" description="Videos are sent to the backend server for analysis only and are not stored">
          <span className="text-xs text-success font-semibold bg-success/10 px-2 py-1 rounded-lg">Not Stored</span>
        </SettingRow>
        <SettingRow label="AI Coaching" description="Movement descriptions are sent to Gemini AI for coaching generation">
          <span className="text-xs text-warning font-semibold bg-warning/10 px-2 py-1 rounded-lg">Gemini API</span>
        </SettingRow>
      </Section>

      {/* About */}
      <Section title="About" icon={Shield}>
        <SettingRow label="Version" description="InjuryLens application version">
          <span className="text-sm text-text-muted font-mono">v2.0.0</span>
        </SettingRow>
        <SettingRow label="AI Model" description="Vision model used for pose detection">
          <span className="text-sm text-text-muted">MediaPipe 0.10 + Gemini 2.0 Flash</span>
        </SettingRow>
        <SettingRow label="Backend" description="API framework">
          <span className="text-sm text-text-muted">FastAPI + SQLite</span>
        </SettingRow>
      </Section>

      {/* Sign out */}
      <div className="mt-2 mb-8">
        <button
          onClick={logout}
          className="w-full py-3 rounded-xl border border-danger/30 text-danger text-sm font-semibold hover:bg-danger/5 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
