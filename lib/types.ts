// Workout Plan Types
export interface Exercise {
  key: string
  name: string
  sets: number
  reps: string
  notes?: string
}

export interface WorkoutDay {
  dayIndex: number
  name: string
  description: string
  exercises: Exercise[]
}

// Session Types
export interface WorkoutSet {
  id: string
  sessionId: string
  exerciseKey: string
  exerciseName: string
  setNumber: number
  weight: number | null
  reps: number | null
  rpe: number | null
  notes: string
}

export interface WorkoutSession {
  id: string
  date: string // ISO date string
  dayIndex: number
  dayName: string
  notes: string
  durationMin: number | null
  startTime: string | null // ISO date string of when workout started
  completed: boolean
  sets: WorkoutSet[]
}

// Steps Types
export interface StepsEntry {
  id: string
  date: string // ISO date string YYYY-MM-DD
  stepCount: number
}

// Settings Types
export interface AppSettings {
  units: 'kg' | 'lb'
  stepGoal: number
  cycleStartDay: number // 1-7
  manualNextDay: number | null // null = auto, 1-7 = manual override
  includeDay4Recovery: boolean
}

// Store State
export interface AppState {
  sessions: WorkoutSession[]
  steps: StepsEntry[]
  settings: AppSettings
}
