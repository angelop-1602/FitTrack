// Database types matching Supabase schema
export interface Database {
  public: {
    Tables: {
      workout_sessions: {
        Row: {
          id: string
          date: string
          day_index: number
          day_name: string
          notes: string
          duration_min: number | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          date: string
          day_index: number
          day_name: string
          notes?: string
          duration_min?: number | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          day_index?: number
          day_name?: string
          notes?: string
          duration_min?: number | null
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workout_sets: {
        Row: {
          id: string
          session_id: string
          exercise_key: string
          exercise_name: string
          set_number: number
          weight: number | null
          reps: number | null
          rpe: number | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          session_id: string
          exercise_key: string
          exercise_name: string
          set_number: number
          weight?: number | null
          reps?: number | null
          rpe?: number | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_key?: string
          exercise_name?: string
          set_number?: number
          weight?: number | null
          reps?: number | null
          rpe?: number | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      steps_entries: {
        Row: {
          id: string
          date: string
          step_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          date: string
          step_count: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          step_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      app_settings: {
        Row: {
          id: string
          units: 'kg' | 'lb'
          step_goal: number
          cycle_start_day: number
          manual_next_day: number | null
          include_day4_recovery: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          units?: 'kg' | 'lb'
          step_goal?: number
          cycle_start_day?: number
          manual_next_day?: number | null
          include_day4_recovery?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          units?: 'kg' | 'lb'
          step_goal?: number
          cycle_start_day?: number
          manual_next_day?: number | null
          include_day4_recovery?: boolean
          updated_at?: string
        }
      }
    }
  }
}
