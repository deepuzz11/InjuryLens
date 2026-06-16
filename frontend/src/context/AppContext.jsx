import React, { createContext, useContext } from 'react'
import { useStore } from '../store'

const AppContext = createContext(null)

/**
 * Wraps the Zustand store in a React context for components that prefer
 * context-based consumption over direct store access.
 */
export function AppProvider({ children }) {
  const store = useStore()
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>
}

/**
 * Hook to access the full app state and actions from any component.
 * Throws if used outside <AppProvider>.
 */
export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext must be used inside <AppProvider>')
  }
  return ctx
}
