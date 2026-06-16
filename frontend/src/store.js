import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
            avg_left_knee_angle: results.supplementary?.avg_left_knee_angle,
            avg_right_knee_angle: results.supplementary?.avg_right_knee_angle,
            avg_trunk_lean_angle: results.supplementary?.avg_trunk_lean_angle,
            total_frames_analyzed: results.supplementary?.total_frames_analyzed,
            rep_count: results.supplementary?.rep_count,
            fatigue_score: results.supplementary?.fatigue_score,
          },
          ai_coaching: {
            overall_risk_level: results.ai_coaching?.overall_risk_level,
            overall_summary: results.ai_coaching?.overall_summary,
            priority_issue: results.ai_coaching?.priority_issue,
          },
          annotated_frame: results.annotated_frame,
        }
        set((state) => ({
          history: [entry, ...state.history.filter((h) => h.id !== entry.id)].slice(0, 50),
        }))
      },

      saveCurrentToHistory: () => {
        const results = get().results
        if (results) get()._saveToHistory(results)
      },

      removeFromHistory: (id) =>
        set((state) => ({ history: state.history.filter((h) => h.id !== id) })),

      clearHistory: () => set({ history: [] }),

      viewHistoryItem: (id) => {
        const entry = get().history.find((h) => h.id === id)
        if (entry) set({ screen: 'history-detail', results: null, _historyDetail: entry })
      },

      setCompareData: (data) => set({ compareData: data }),
      clearCompare: () => set({ compareData: null }),

      updateSettings: (updates) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
    }),
    {
      name: 'injurylens-v2',
      partialize: (state) => ({
        history: state.history,
        settings: state.settings,
      }),
    }
  )
)
