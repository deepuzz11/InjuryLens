import { create } from 'zustand'

export const useStore = create((set) => ({
  screen: 'upload',       // 'upload' | 'loading' | 'results'
  results: null,
  error: null,

  setScreen: (screen) => set({ screen }),
  setResults: (results) => set({ results, screen: 'results', error: null }),
  setError: (error) => set({ error, screen: 'upload' }),
  reset: () => set({ screen: 'upload', results: null, error: null }),
}))
