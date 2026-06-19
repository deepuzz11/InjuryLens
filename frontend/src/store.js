import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Achievement definitions ──────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_analysis',    label: 'First Step',        desc: 'Complete your first analysis',           icon: '🎯', condition: (h) => h.length >= 1  },
  { id: 'ten_analyses',      label: 'Dedicated Athlete', desc: 'Complete 10 analyses',                   icon: '🏅', condition: (h) => h.length >= 10 },
  { id: 'low_risk',          label: 'Clean Form',        desc: 'Score below 20% risk',                   icon: '✅', condition: (h) => h.some((e) => (e.scores?.overall ?? 100) < 20) },
  { id: 'streak_3',          label: '3-Day Streak',      desc: 'Analyze 3 days in a row',                icon: '🔥', condition: (_, streak) => streak >= 3  },
  { id: 'streak_7',          label: 'Week Warrior',      desc: 'Analyze 7 days in a row',                icon: '⚡', condition: (_, streak) => streak >= 7  },
  { id: 'improvement_10',    label: 'Getting Better',    desc: 'Improve risk score by 10+ points',       icon: '📈', condition: (h) => h.length >= 2 && (h[1]?.scores?.overall ?? 0) - (h[0]?.scores?.overall ?? 0) >= 10 },
  { id: 'improvement_30',    label: 'Transformation',    desc: 'Improve risk score by 30+ points',       icon: '🏆', condition: (h) => h.length >= 2 && (h[h.length-1]?.scores?.overall ?? 0) - (h[0]?.scores?.overall ?? 0) >= 30 },
  { id: 'five_movements',    label: 'Well Rounded',      desc: 'Analyze 5 different movement types',     icon: '🤸', condition: (h) => new Set(h.map((e) => e.movement_type)).size >= 5 },
  { id: 'perfect_squat',     label: 'Squat King',        desc: 'Score A-grade MQS on a squat',           icon: '👑', condition: (h) => h.some((e) => e.movement_type === 'Squat' && (e.supplementary?.mqs_grade === 'A')) },
]

function computeAchievements(history, streak) {
  return ACHIEVEMENTS.filter((a) => a.condition(history, streak)).map((a) => a.id)
}

function computeStreak(history) {
  if (!history.length) return 0
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date))
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date)
    const curr = new Date(sorted[i].date)
    const diffDays = Math.floor((prev - curr) / 86400000)
    if (diffDays <= 1) streak++
    else break
  }
  return streak
}

// ─── Default profile ──────────────────────────────────────────────────────────
const DEFAULT_PROFILE = {
  id:           'default',
  name:         'Default Athlete',
  fitnessLevel: 'Intermediate',
  ageGroup:     '25–34',
  goal:         'Injury Prevention',
  sport:        '',
  createdAt:    new Date().toISOString(),
}

export const useStore = create(
  persist(
    (set, get) => ({
      screen: 'upload',
      results: null,
      error: null,
      isLoading: false,
      history: [],
      compareData: null,
      settings: {
        autoSaveHistory: true,
        showTimeline: true,
        showBodyMap: true,
        showWarmup: true,
        showWeeklyPlan: true,
      },

      // ── Feature 7: Athlete profiles ─────────────────────────────────────────
      profiles: [DEFAULT_PROFILE],
      activeProfileId: 'default',

      addProfile: (profile) => {
        const newProfile = { ...profile, id: String(Date.now()), createdAt: new Date().toISOString() }
        set((state) => ({ profiles: [...state.profiles, newProfile] }))
        return newProfile.id
      },

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfileId: state.activeProfileId === id ? 'default' : state.activeProfileId,
        })),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getActiveProfile: () => {
        const state = get()
        return state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0] ?? DEFAULT_PROFILE
      },

      // ── Feature 8: Gamification ─────────────────────────────────────────────
      streak: 0,
      longestStreak: 0,
      earnedAchievements: [],
      weeklyChallenge: {
        goal: 3,
        completedThisWeek: 0,
        weekStart: null,
      },

      _updateGamification: (history) => {
        const streak    = computeStreak(history)
        const earned    = computeAchievements(history, streak)
        const longest   = Math.max(get().longestStreak, streak)
        const now       = new Date()
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toDateString()
        const weeklyCount = history.filter((h) => {
          const d = new Date(h.date)
          return d >= new Date(weekStart)
        }).length
        set((state) => ({
          streak,
          longestStreak: longest,
          earnedAchievements: earned,
          weeklyChallenge: {
            ...state.weeklyChallenge,
            completedThisWeek: weeklyCount,
            weekStart,
          },
        }))
      },

      // ── Core navigation ──────────────────────────────────────────────────────
      setScreen: (screen) => set({ screen }),

      setResults: (results) => {
        set({ results, screen: 'results', error: null, isLoading: false })
        if (get().settings.autoSaveHistory && results) {
          get()._saveToHistory(results)
        }
      },

      setError: (error) =>
        set({
          error:
            typeof error === 'string'
              ? { message: error, suggestion: 'Please try again.' }
              : error,
          screen: 'upload',
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set({ screen: 'upload', results: null, error: null, isLoading: false }),

      _saveToHistory: (results) => {
        const entry = {
          id: results.analysis_id || String(Date.now()),
          date: new Date().toISOString(),
          movement_type: results.movement_type,
          scores: results.scores,
          supplementary: {
            avg_left_knee_angle:  results.supplementary?.avg_left_knee_angle,
            avg_right_knee_angle: results.supplementary?.avg_right_knee_angle,
            avg_trunk_lean_angle: results.supplementary?.avg_trunk_lean_angle,
            total_frames_analyzed: results.supplementary?.total_frames_analyzed,
            rep_count:            results.supplementary?.rep_count,
            fatigue_score:        results.supplementary?.fatigue_score,
            mqs_score:            results.supplementary?.mqs_score,
            mqs_grade:            results.supplementary?.mqs_grade,
            injury_probability_4w: results.supplementary?.injury_probability_4w,
          },
          ai_coaching: {
            overall_risk_level: results.ai_coaching?.overall_risk_level,
            overall_summary:    results.ai_coaching?.overall_summary,
            priority_issue:     results.ai_coaching?.priority_issue,
          },
          annotated_frame: results.annotated_frame,
          profileId: get().activeProfileId,
        }
        const newHistory = [entry, ...get().history.filter((h) => h.id !== entry.id)].slice(0, 50)
        set({ history: newHistory })
        get()._updateGamification(newHistory)
      },

      saveCurrentToHistory: () => {
        const results = get().results
        if (results) get()._saveToHistory(results)
      },

      removeFromHistory: (id) => {
        const newHistory = get().history.filter((h) => h.id !== id)
        set({ history: newHistory })
        get()._updateGamification(newHistory)
      },

      clearHistory: () => {
        set({ history: [], streak: 0, earnedAchievements: [], weeklyChallenge: { goal: 3, completedThisWeek: 0, weekStart: null } })
      },

      viewHistoryItem: (id) => {
        const entry = get().history.find((h) => h.id === id)
        if (entry) set({ screen: 'history-detail', results: null, _historyDetail: entry })
      },

      setCompareData: (data) => set({ compareData: data }),
      clearCompare:   () => set({ compareData: null }),

      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
    }),
    {
      name: 'injurylens-v3',
      partialize: (state) => ({
        history:             state.history,
        settings:            state.settings,
        profiles:            state.profiles,
        activeProfileId:     state.activeProfileId,
        streak:              state.streak,
        longestStreak:       state.longestStreak,
        earnedAchievements:  state.earnedAchievements,
        weeklyChallenge:     state.weeklyChallenge,
      }),
    }
  )
)

export { ACHIEVEMENTS }
