'use client'

import { AppState, AppSettings, WorkoutSession, WorkoutSet, StepsEntry } from './types'
import { getNextDayIndex } from './workout-plan'
import * as supabaseService from './supabase/service'
import { queueOperation, isOnline } from './supabase/sync-queue'

const STORAGE_KEY = 'workout-tracker-data'
const SYNC_ENABLED = typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const defaultSettings: AppSettings = {
  units: 'kg',
  stepGoal: 10000,
  cycleStartDay: 1,
  manualNextDay: null,
  includeDay4Recovery: true,
}

const defaultState: AppState = {
  sessions: [],
  steps: [],
  settings: defaultSettings,
}

// Load state from localStorage
export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        sessions: parsed.sessions || [],
        steps: parsed.steps || [],
        settings: { ...defaultSettings, ...parsed.settings },
      }
    }
  } catch (e) {
    console.error('Failed to load state:', e)
  }
  return defaultState
}

// Save state to localStorage
export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to save state:', e)
  }
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Get today's date as ISO string (YYYY-MM-DD)
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Calculate the next workout day based on history
export function getNextWorkoutDay(state: AppState): number {
  // Manual override takes precedence
  if (state.settings.manualNextDay !== null) {
    return state.settings.manualNextDay
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayDateStr = getTodayDate()
  const todayDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // First, check if there's a workout scheduled for today based on cycle
  const cycleStartDate = getCycleStartDate(state)
  
  if (cycleStartDate) {
    const todayWorkoutDay = getWorkoutDayForDate(today, cycleStartDate)
    
    // Check if today's workout is completed
    const todaySession = state.sessions.find(s => s.date === todayDateStr && s.completed)
    
    // If today has a workout day and it's not completed, return today's workout day
    if (todayWorkoutDay && !todaySession) {
      return todayWorkoutDay
    }
    
    // If today's workout is completed or no workout for today, find next workout day
    // Check tomorrow and subsequent days
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
      const futureDate = new Date(today)
      futureDate.setDate(futureDate.getDate() + daysAhead)
      const futureWorkoutDay = getWorkoutDayForDate(futureDate, cycleStartDate)
      
      if (futureWorkoutDay) {
        return futureWorkoutDay
      }
    }
  } else {
    // No cycle start date yet - use default mapping: Day 1 = Monday
    // Map day of week to workout day: Sunday (0) = Day 7, Monday (1) = Day 1, etc.
    const defaultWorkoutDay = todayDayOfWeek === 0 ? 7 : todayDayOfWeek
    
    // Check if today's workout is completed
    const todaySession = state.sessions.find(s => s.date === todayDateStr && s.completed)
    
    // If today's workout is not completed, return today's workout day
    if (!todaySession) {
      return defaultWorkoutDay
    }
    
    // If today's workout is completed, find next workout day
    // Check tomorrow and subsequent days
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
      const futureDate = new Date(today)
      futureDate.setDate(futureDate.getDate() + daysAhead)
      const futureDayOfWeek = futureDate.getDay()
      const futureWorkoutDay = futureDayOfWeek === 0 ? 7 : futureDayOfWeek
      
      // Check if this future workout day is completed
      const futureDateStr = futureDate.toISOString().split('T')[0]
      const futureSession = state.sessions.find(s => s.date === futureDateStr && s.completed && s.dayIndex === futureWorkoutDay)
      
      if (!futureSession) {
        return futureWorkoutDay
      }
    }
  }
  
  // Fallback: Find the most recent completed session
  const completedSessions = state.sessions
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  if (completedSessions.length === 0) {
    // Default to today's workout day based on day of week
    return todayDayOfWeek === 0 ? 7 : todayDayOfWeek
  }
  
  const lastDay = completedSessions[0].dayIndex
  return getNextDayIndex(lastDay, state.settings.includeDay4Recovery)
}

/**
 * Find the cycle start date (when Day 1 was first completed)
 * If no Day 1 found, returns null
 */
export function getCycleStartDate(state: AppState): Date | null {
  // Find the first completed Day 1 session
  const day1Sessions = state.sessions
    .filter(s => s.completed && s.dayIndex === 1)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  if (day1Sessions.length === 0) {
    return null
  }
  
  return new Date(day1Sessions[0].date)
}

/**
 * Get the day of week name for a workout day based on cycle start
 * Day 1 always falls on Monday
 */
export function getDayOfWeekForWorkoutDay(dayIndex: number, cycleStartDate: Date | null): string {
  if (!cycleStartDate) {
    // If no cycle start, use default mapping: Day 1 = Monday
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return dayNames[dayIndex === 7 ? 0 : dayIndex] || 'Unknown'
  }
  
  // Calculate which day of week Day 1 falls on
  const startDate = new Date(cycleStartDate)
  startDate.setHours(0, 0, 0, 0)
  const dayOfWeek = startDate.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Day 1 falls on the day of week of cycleStartDate
  // Calculate which day of week dayIndex falls on
  // dayIndex 1 = same as cycleStartDate, dayIndex 2 = next day, etc.
  const targetDayOfWeek = (dayOfWeek + dayIndex - 1) % 7
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return dayNames[targetDayOfWeek]
}

/**
 * Get the workout day that should be done on a specific date
 * based on the cycle start date
 */
export function getWorkoutDayForDate(date: Date, cycleStartDate: Date | null): number | null {
  if (!cycleStartDate) {
    return null
  }
  
  const startDate = new Date(cycleStartDate)
  startDate.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  // Calculate days since cycle start
  const diffTime = targetDate.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return null // Date is before cycle start
  }
  
  // Calculate which day of the cycle (1-7)
  const cycleDay = (diffDays % 7) + 1
  return cycleDay
}

// Session operations
export function createSession(state: AppState, dayIndex: number, dayName: string): WorkoutSession {
  const session: WorkoutSession = {
    id: generateId(),
    date: getTodayDate(),
    dayIndex,
    dayName,
    notes: '',
    durationMin: null,
    startTime: null,
    completed: false,
    sets: [],
  }
  return session
}

export function saveSession(state: AppState, session: WorkoutSession): AppState {
  const existingIndex = state.sessions.findIndex(s => s.id === session.id)
  const newSessions = existingIndex >= 0
    ? state.sessions.map((s, i) => i === existingIndex ? session : s)
    : [...state.sessions, session]
  
  const newState = { ...state, sessions: newSessions }
  
  // If completing, clear manual override
  if (session.completed && state.settings.manualNextDay !== null) {
    newState.settings = { ...newState.settings, manualNextDay: null }
  }
  
  saveState(newState)
  
  // Sync to Supabase (with offline queue support)
  if (SYNC_ENABLED) {
    if (isOnline()) {
      // Try immediate sync if online
      supabaseService.saveSessionToSupabase(session).catch(err => {
        console.error('Failed to sync session to Supabase:', {
          error: err,
          message: err?.message,
          details: err?.details,
          hint: err?.hint,
          code: err?.code,
          sessionId: session.id,
        })
        // Queue for retry if immediate sync fails
        queueOperation({ type: 'saveSession', data: session })
      })
    } else {
      // Queue for later if offline
      queueOperation({ type: 'saveSession', data: session })
    }
  }
  
  return newState
}

export function deleteSession(state: AppState, sessionId: string): AppState {
  const newState = {
    ...state,
    sessions: state.sessions.filter(s => s.id !== sessionId),
  }
  saveState(newState)
  
  // Sync to Supabase (with offline queue support)
  if (SYNC_ENABLED) {
    if (isOnline()) {
      // Try immediate sync if online
      supabaseService.deleteSessionFromSupabase(sessionId).catch(err => {
        console.error('Failed to delete session from Supabase:', err)
        // Queue for retry if immediate sync fails
        queueOperation({ type: 'deleteSession', sessionId })
      })
    } else {
      // Queue for later if offline
      queueOperation({ type: 'deleteSession', sessionId })
    }
  }
  
  return newState
}

export function getSessionById(state: AppState, id: string): WorkoutSession | undefined {
  return state.sessions.find(s => s.id === id)
}

export function getTodaySession(state: AppState): WorkoutSession | undefined {
  const today = getTodayDate()
  const todaySession = state.sessions.find(s => s.date === today && !s.completed)
  
  console.log('getTodaySession - Looking for today session:', {
    today,
    totalSessions: state.sessions.length,
    todaySessions: state.sessions.filter(s => s.date === today).length,
    todayDrafts: state.sessions.filter(s => s.date === today && !s.completed).length,
    found: todaySession ? {
      id: todaySession.id,
      date: todaySession.date,
      completed: todaySession.completed,
      setsCount: todaySession.sets.length,
      startTime: todaySession.startTime
    } : null
  })
  
  return todaySession
}

// Steps operations
export function getStepsForDate(state: AppState, date: string): StepsEntry | undefined {
  return state.steps.find(s => s.date === date)
}

export function saveSteps(state: AppState, date: string, stepCount: number): AppState {
  const existingIndex = state.steps.findIndex(s => s.date === date)
  
  let newSteps: StepsEntry[]
  if (existingIndex >= 0) {
    newSteps = state.steps.map((s, i) => 
      i === existingIndex ? { ...s, stepCount } : s
    )
  } else {
    newSteps = [...state.steps, { id: generateId(), date, stepCount }]
  }
  
  const newState = { ...state, steps: newSteps }
  saveState(newState)
  
  // Sync to Supabase (with offline queue support)
  if (SYNC_ENABLED) {
    if (isOnline()) {
      // Try immediate sync if online
      supabaseService.saveStepsToSupabase(date, stepCount).catch(err => {
        console.error('Failed to sync steps to Supabase:', err)
        // Queue for retry if immediate sync fails
        queueOperation({ type: 'saveSteps', date, stepCount })
      })
    } else {
      // Queue for later if offline
      queueOperation({ type: 'saveSteps', date, stepCount })
    }
  }
  
  return newState
}

// Settings operations
export function updateSettings(state: AppState, newSettings: Partial<AppSettings>): AppState {
  const newState = {
    ...state,
    settings: { ...state.settings, ...newSettings },
  }
  saveState(newState)
  
  // Sync to Supabase (with offline queue support)
  if (SYNC_ENABLED) {
    if (isOnline()) {
      // Try immediate sync if online
      supabaseService.saveSettingsToSupabase(newState.settings).catch(err => {
        console.error('Failed to sync settings to Supabase:', err)
        // Queue for retry if immediate sync fails
        queueOperation({ type: 'updateSettings', settings: newState.settings })
      })
    } else {
      // Queue for later if offline
      queueOperation({ type: 'updateSettings', settings: newState.settings })
    }
  }
  
  return newState
}

// Analytics helpers
export function getWorkoutsThisWeek(state: AppState): number {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  return state.sessions.filter(s => {
    const sessionDate = new Date(s.date)
    return s.completed && sessionDate >= startOfWeek
  }).length
}

export function getStepsAverage7Days(state: AppState): number {
  const now = new Date()
  const last7Days: string[] = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    last7Days.push(date.toISOString().split('T')[0])
  }
  
  const stepsInRange = state.steps.filter(s => last7Days.includes(s.date))
  if (stepsInRange.length === 0) return 0
  
  const total = stepsInRange.reduce((sum, s) => sum + s.stepCount, 0)
  return Math.round(total / stepsInRange.length)
}

export function getWorkoutStreak(state: AppState): number {
  const completedSessions = state.sessions
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  if (completedSessions.length === 0) return 0
  
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check if there's a session today or yesterday to start the streak
  const mostRecent = new Date(completedSessions[0].date)
  mostRecent.setHours(0, 0, 0, 0)
  
  const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff > 1) return 0 // Streak broken
  
  // Count consecutive days with workouts
  const uniqueDates = [...new Set(completedSessions.map(s => s.date))].sort().reverse()
  
  let currentDate = mostRecent
  for (const dateStr of uniqueDates) {
    const sessionDate = new Date(dateStr)
    sessionDate.setHours(0, 0, 0, 0)
    
    const diff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diff <= 1) {
      streak++
      currentDate = sessionDate
    } else {
      break
    }
  }
  
  return streak
}

// Export data as JSON
export function exportData(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

// Load state from Supabase (with localStorage fallback)
export async function loadStateFromSupabase(): Promise<AppState> {
  // Try Supabase first if enabled
  if (SYNC_ENABLED) {
    try {
      const { sessions, steps, settings } = await supabaseService.loadAllFromSupabase()
      const drafts = await supabaseService.fetchAllDrafts()
      
      console.log('loadStateFromSupabase - Data loaded:', {
        completedSessions: sessions.length,
        drafts: drafts.length,
        draftDetails: drafts.map(d => ({
          id: d.id,
          date: d.date,
          completed: d.completed,
          setsCount: d.sets.length,
          startTime: d.startTime
        }))
      })
      
      // Merge with localStorage (localStorage takes precedence for conflicts)
      const localState = loadState()
      
      // Combine completed sessions with drafts
      // If a draft exists in localStorage, prefer that (it might be more recent)
      const allSessions = [...sessions]
      drafts.forEach(draft => {
        const existingIndex = allSessions.findIndex(s => s.id === draft.id)
        if (existingIndex >= 0) {
          // If draft exists in sessions, don't add it (it should be completed)
          console.log(`Draft ${draft.id} already exists in completed sessions, skipping`)
        } else {
          // Add draft if not in completed sessions
          allSessions.push(draft)
          console.log(`Added draft ${draft.id} to sessions`)
        }
      })
      
      // Check if localStorage has more recent drafts
      const localDrafts = localState.sessions.filter(s => !s.completed)
      localDrafts.forEach(localDraft => {
        const existingIndex = allSessions.findIndex(s => s.id === localDraft.id)
        if (existingIndex >= 0) {
          // Replace with localStorage version if it exists (might be more recent)
          allSessions[existingIndex] = localDraft
          console.log(`Replaced draft ${localDraft.id} with localStorage version`)
        } else {
          // Add local draft if not in Supabase sessions
          allSessions.push(localDraft)
          console.log(`Added localStorage draft ${localDraft.id} to sessions`)
        }
      })
      
      console.log('loadStateFromSupabase - Final sessions:', {
        total: allSessions.length,
        completed: allSessions.filter(s => s.completed).length,
        drafts: allSessions.filter(s => !s.completed).length,
        todayDrafts: allSessions.filter(s => !s.completed && s.date === getTodayDate()).length
      })
      
      return {
        sessions: allSessions.length > 0 ? allSessions : localState.sessions,
        steps: steps.length > 0 ? steps : localState.steps,
        settings: settings || localState.settings,
      }
    } catch (error) {
      console.error('Failed to load from Supabase, using localStorage:', error)
    }
  }
  
  // Fallback to localStorage
  return loadState()
}

// Sync all data to Supabase
export async function syncAllToSupabase(state: AppState): Promise<void> {
  if (!SYNC_ENABLED) {
    console.warn('Supabase sync is not enabled')
    return
  }
  
  try {
    await supabaseService.syncAllToSupabase(
      state.sessions,
      state.steps,
      state.settings
    )
    console.log('Successfully synced all data to Supabase')
  } catch (error) {
    console.error('Failed to sync to Supabase:', error)
    throw error
  }
}
