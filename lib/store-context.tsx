'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AppState, AppSettings, WorkoutSession, StepsEntry } from './types'
import * as store from './store'
import { initSyncQueue } from './supabase/sync-queue'

interface StoreContextType {
  state: AppState
  isLoading: boolean
  // Session actions
  saveSession: (session: WorkoutSession) => void
  deleteSession: (sessionId: string) => void
  getSessionById: (id: string) => WorkoutSession | undefined
  getTodaySession: () => WorkoutSession | undefined
  // Steps actions
  saveSteps: (date: string, stepCount: number) => void
  getStepsForDate: (date: string) => StepsEntry | undefined
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void
  // Computed values
  getNextWorkoutDay: () => number
  getWorkoutsThisWeek: () => number
  getStepsAverage7Days: () => number
  getWorkoutStreak: () => number
  // Workout day mapping
  getCycleStartDate: () => Date | null
  getDayOfWeekForWorkoutDay: (dayIndex: number) => string
  // Export
  exportData: () => string
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage immediately for instant display
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      return store.loadState()
    }
    return {
      sessions: [],
      steps: [],
      settings: {
        units: 'kg',
        stepGoal: 10000,
        cycleStartDay: 1,
        manualNextDay: null,
        includeDay4Recovery: true,
      },
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Get current state (from localStorage initialization)
        const currentState = store.loadState()
        
        // Load from Supabase and merge with current state (localStorage)
        const loaded = await store.loadStateFromSupabase()
        
        // Merge intelligently: prefer the most recent version of each session
        const mergedState = mergeStates(currentState, loaded)
        setState(mergedState)
        
        // Save merged state to localStorage for offline access
        store.saveState(mergedState)
      } catch (error) {
        console.error('Error loading data from Supabase:', error)
        // Keep current state (from localStorage) if Supabase fails
        // Don't overwrite with empty state
      } finally {
        setIsLoading(false)
      }
    }
    
    // Only load from Supabase if we have sync enabled
    // Otherwise, we already have localStorage data loaded
    if (typeof window !== 'undefined' && 
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      loadData()
    } else {
      setIsLoading(false)
    }
    
    // Initialize sync queue for offline support
    initSyncQueue()
  }, [])
  
  // Helper function to merge two states, preferring the most recent version
  function mergeStates(currentState: AppState, newState: AppState): AppState {
    // Create a map of sessions by ID for quick lookup
    const sessionMap = new Map<string, WorkoutSession>()
    
    // Add all sessions from current state (localStorage)
    currentState.sessions.forEach(session => {
      sessionMap.set(session.id, session)
    })
    
    // Merge with new state (Supabase), preferring the one with more recent data
    newState.sessions.forEach(session => {
      const existing = sessionMap.get(session.id)
      if (!existing) {
        // New session, add it
        sessionMap.set(session.id, session)
      } else {
        // Session exists in both, prefer the one with more sets or more recent updates
        // For drafts, prefer the one with more sets (more progress)
        if (!session.completed && !existing.completed) {
          // Both are drafts, prefer the one with more sets
          if (session.sets.length > existing.sets.length) {
            sessionMap.set(session.id, session)
          } else if (session.sets.length === existing.sets.length) {
            // Same number of sets, prefer the one with more filled sets
            const sessionFilled = session.sets.filter(s => 
              s.weight !== null || s.reps !== null || s.rpe !== null
            ).length
            const existingFilled = existing.sets.filter(s => 
              s.weight !== null || s.reps !== null || s.rpe !== null
            ).length
            if (sessionFilled > existingFilled) {
              sessionMap.set(session.id, session)
            }
          }
        } else if (session.completed && !existing.completed) {
          // New one is completed, prefer it
          sessionMap.set(session.id, session)
        }
        // If existing is completed and new is not, keep existing
      }
    })
    
    return {
      sessions: Array.from(sessionMap.values()),
      steps: newState.steps.length > 0 ? newState.steps : currentState.steps,
      settings: newState.settings || currentState.settings,
    }
  }

  const contextValue: StoreContextType = {
    state,
    isLoading,
    
    saveSession: (session: WorkoutSession) => {
      setState(prev => store.saveSession(prev, session))
    },
    
    deleteSession: (sessionId: string) => {
      setState(prev => store.deleteSession(prev, sessionId))
    },
    
    getSessionById: (id: string) => store.getSessionById(state, id),
    
    getTodaySession: () => store.getTodaySession(state),
    
    saveSteps: (date: string, stepCount: number) => {
      setState(prev => store.saveSteps(prev, date, stepCount))
    },
    
    getStepsForDate: (date: string) => store.getStepsForDate(state, date),
    
    updateSettings: (settings: Partial<AppSettings>) => {
      setState(prev => store.updateSettings(prev, settings))
    },
    
    getNextWorkoutDay: () => store.getNextWorkoutDay(state),
    
    getWorkoutsThisWeek: () => store.getWorkoutsThisWeek(state),
    
    getStepsAverage7Days: () => store.getStepsAverage7Days(state),
    
    getWorkoutStreak: () => store.getWorkoutStreak(state),
    
    getCycleStartDate: () => store.getCycleStartDate(state),
    
    getDayOfWeekForWorkoutDay: (dayIndex: number) => store.getDayOfWeekForWorkoutDay(dayIndex, store.getCycleStartDate(state)),
    
    exportData: () => store.exportData(state),
  }

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
