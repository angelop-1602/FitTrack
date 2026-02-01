import { supabase } from './client'
import { WorkoutSession, WorkoutSet, StepsEntry, AppSettings } from '../types'
import type { Database } from './types'

if (!supabase) {
  console.warn('Supabase client not initialized. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.')
}

type WorkoutSessionRow = Database['public']['Tables']['workout_sessions']['Row']
type WorkoutSetRow = Database['public']['Tables']['workout_sets']['Row']
type StepsEntryRow = Database['public']['Tables']['steps_entries']['Row']
type AppSettingsRow = Database['public']['Tables']['app_settings']['Row']

// Convert database rows to app types
function sessionRowToSession(row: WorkoutSessionRow, sets: WorkoutSet[]): WorkoutSession {
  return {
    id: row.id,
    date: row.date,
    dayIndex: row.day_index,
    dayName: row.day_name,
    notes: row.notes,
    durationMin: row.duration_min,
    startTime: null, // startTime not in database schema yet, will be stored in localStorage
    completed: row.completed,
    sets,
  }
}

function setRowToSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseKey: row.exercise_key,
    exerciseName: row.exercise_name,
    setNumber: row.set_number,
    weight: row.weight,
    reps: row.reps,
    rpe: row.rpe,
    notes: row.notes,
  }
}

function stepsRowToEntry(row: StepsEntryRow): StepsEntry {
  return {
    id: row.id,
    date: row.date,
    stepCount: row.step_count,
  }
}

function settingsRowToSettings(row: AppSettingsRow): AppSettings {
  return {
    units: row.units,
    stepGoal: row.step_goal,
    cycleStartDay: row.cycle_start_day,
    manualNextDay: row.manual_next_day,
    includeDay4Recovery: row.include_day4_recovery,
  }
}

// Workout Sessions
export async function fetchAllSessions(): Promise<WorkoutSession[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching sessions:', error)
    throw error
  }

  if (!sessions || sessions.length === 0) {
    return []
  }

  // Fetch all sets for these sessions
  const sessionIds = sessions.map(s => s.id)
  const { data: sets, error: setsError } = await supabase!
    .from('workout_sets')
    .select('*')
    .in('session_id', sessionIds)
    .order('set_number', { ascending: true })

  if (setsError) {
    console.error('Error fetching sets:', setsError)
    throw setsError
  }

  // Group sets by session
  const setsBySession = new Map<string, WorkoutSet[]>()
  sets?.forEach(set => {
    const sessionSets = setsBySession.get(set.session_id) || []
    sessionSets.push(setRowToSet(set))
    setsBySession.set(set.session_id, sessionSets)
  })

  // Combine sessions with their sets
  return sessions.map(session => 
    sessionRowToSession(session, setsBySession.get(session.id) || [])
  )
}

export async function saveSessionToSupabase(session: WorkoutSession): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  // If session is completed, save to main sessions table
  // If not completed, save to drafts table
  if (session.completed) {
    // Save completed session to main table
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .upsert({
        id: session.id,
        date: session.date,
        day_index: session.dayIndex,
        day_name: session.dayName,
        notes: session.notes || '',
        duration_min: session.durationMin ?? null,
        completed: true,
      })
      .select()

    if (sessionError) {
      console.error('Error saving completed session:', {
        error: sessionError,
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint,
        code: sessionError.code,
        session: {
          id: session.id,
          date: session.date,
          dayIndex: session.dayIndex,
          dayName: session.dayName,
        },
      })
      throw sessionError
    }
    
    console.log(`Successfully saved completed session ${session.id}`)

    // Save sets to main workout_sets table
    if (session.sets.length > 0) {
      const setsToInsert = session.sets
        .filter(set => {
          if (!set.id || !set.sessionId || !set.exerciseKey || !set.exerciseName) {
            return false
          }
          return true
        })
        .map(set => {
          const parseNumber = (val: number | null | undefined): number | null => {
            if (val === null || val === undefined) return null
            const num = Number(val)
            if (isNaN(num) || !isFinite(num)) return null
            return num
          }
          
          const weight = parseNumber(set.weight)
          const reps = parseNumber(set.reps)
          const rpe = parseNumber(set.rpe)
          const setNumber = Number(set.setNumber)
          
          return {
            id: String(set.id),
            session_id: String(set.sessionId),
            exercise_key: String(set.exerciseKey || ''),
            exercise_name: String(set.exerciseName || ''),
            set_number: isNaN(setNumber) || setNumber < 1 ? 1 : setNumber,
            weight: weight,
            reps: reps,
            rpe: rpe,
            notes: String(set.notes || ''),
          }
        })
        .filter(set => {
          if (!set.id || !set.session_id || !set.exercise_key || !set.exercise_name) {
            return false
          }
          return true
        })

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('workout_sets')
          .upsert(setsToInsert, { onConflict: 'id' })

        if (setsError) {
          console.error('Error saving sets:', {
            error: setsError,
            message: setsError.message,
            details: setsError.details,
            hint: setsError.hint,
            code: setsError.code,
            sessionId: session.id,
          })
          throw setsError
        }
        
        console.log(`Successfully saved ${setsToInsert.length} sets for completed session ${session.id}`)
      }
      
      // Delete draft if it exists (since we're completing the workout)
      await supabase
        .from('workout_drafts')
        .delete()
        .eq('id', session.id)
      
      await supabase
        .from('workout_draft_sets')
        .delete()
        .eq('draft_id', session.id)
    }
  } else {
    // Save draft to drafts table
    console.log('saveSessionToSupabase - Saving draft to workout_drafts table:', {
      id: session.id,
      date: session.date,
      dayIndex: session.dayIndex,
      completed: session.completed,
      setsCount: session.sets.length,
      startTime: session.startTime
    })
    
    const { data: draftData, error: draftError } = await supabase
      .from('workout_drafts')
      .upsert({
        id: session.id,
        date: session.date,
        day_index: session.dayIndex,
        day_name: session.dayName,
        notes: session.notes || '',
        duration_min: session.durationMin ?? null,
        start_time: session.startTime ?? null,
      })
      .select()

    if (draftError) {
      console.error('Error saving draft:', {
        error: draftError,
        message: draftError.message,
        details: draftError.details,
        hint: draftError.hint,
        code: draftError.code,
        session: {
          id: session.id,
          date: session.date,
          dayIndex: session.dayIndex,
          dayName: session.dayName,
        },
      })
      throw draftError
    }
    
    console.log(`Successfully saved draft ${session.id}`)

    // Save sets to draft_sets table
    if (session.sets.length > 0) {
      const setsToInsert = session.sets
        .filter(set => {
          if (!set.id || !set.sessionId || !set.exerciseKey || !set.exerciseName) {
            return false
          }
          return true
        })
        .map(set => {
          const parseNumber = (val: number | null | undefined): number | null => {
            if (val === null || val === undefined) return null
            const num = Number(val)
            if (isNaN(num) || !isFinite(num)) return null
            return num
          }
          
          const weight = parseNumber(set.weight)
          const reps = parseNumber(set.reps)
          const rpe = parseNumber(set.rpe)
          const setNumber = Number(set.setNumber)
          
          return {
            id: String(set.id),
            draft_id: String(set.sessionId),
            exercise_key: String(set.exerciseKey || ''),
            exercise_name: String(set.exerciseName || ''),
            set_number: isNaN(setNumber) || setNumber < 1 ? 1 : setNumber,
            weight: weight,
            reps: reps,
            rpe: rpe,
            notes: String(set.notes || ''),
          }
        })
        .filter(set => {
          if (!set.id || !set.draft_id || !set.exercise_key || !set.exercise_name) {
            return false
          }
          return true
        })

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('workout_draft_sets')
          .upsert(setsToInsert, { onConflict: 'id' })

        if (setsError) {
          console.error('Error saving draft sets:', {
            error: setsError,
            message: setsError.message,
            details: setsError.details,
            hint: setsError.hint,
            code: setsError.code,
            draftId: session.id,
          })
          throw setsError
        }
        
        console.log(`Successfully saved ${setsToInsert.length} sets for draft ${session.id}`)
      }
    }
  }
}

export async function deleteSessionFromSupabase(sessionId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  // Sets will be deleted automatically due to CASCADE
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting session:', error)
    throw error
  }
}

// Steps
export async function fetchAllSteps(): Promise<StepsEntry[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  const { data, error } = await supabase
    .from('steps_entries')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching steps:', error)
    throw error
  }

  return (data || []).map(stepsRowToEntry)
}

export async function saveStepsToSupabase(date: string, stepCount: number): Promise<StepsEntry> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  // Validate inputs
  if (!date || typeof date !== 'string') {
    throw new Error('Invalid date provided for steps entry')
  }
  if (typeof stepCount !== 'number' || isNaN(stepCount) || stepCount < 0) {
    throw new Error(`Invalid stepCount: ${stepCount}`)
  }
  
  // First, try to get existing entry (it's okay if it doesn't exist)
  const { data: existing, error: fetchError } = await supabase
    .from('steps_entries')
    .select('id')
    .eq('date', date)
    .maybeSingle()

  // Ignore fetch errors if it's just "not found" - that's expected for new entries
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching existing steps entry:', {
      error: fetchError,
      message: fetchError.message,
      details: fetchError.details,
      hint: fetchError.hint,
      code: fetchError.code,
      date,
    })
  }

  const entry: StepsEntry = {
    id: existing?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date,
    stepCount: Math.round(stepCount), // Ensure integer
  }

  const dataToInsert = {
    id: entry.id,
    date: entry.date,
    step_count: entry.stepCount,
  }

  console.log('Saving steps to Supabase:', dataToInsert)

  const { error, data } = await supabase
    .from('steps_entries')
    .upsert(dataToInsert, { onConflict: 'id' })

  if (error) {
    console.error('Error saving steps - Details:', {
      error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
      rawError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      dataBeingSent: dataToInsert,
    })
    throw error
  }

  console.log('Successfully saved steps:', data || entry)
  return entry
}

// Settings
export async function fetchSettings(): Promise<AppSettings | null> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 'default')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return null
      return null
    }
    console.error('Error fetching settings:', error)
    throw error
  }

  return data ? settingsRowToSettings(data) : null
}

export async function saveSettingsToSupabase(settings: AppSettings): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  const { error } = await supabase
    .from('app_settings')
    .upsert({
      id: 'default',
      units: settings.units,
      step_goal: settings.stepGoal,
      cycle_start_day: settings.cycleStartDay,
      manual_next_day: settings.manualNextDay,
      include_day4_recovery: settings.includeDay4Recovery,
    })

  if (error) {
    console.error('Error saving settings:', error)
    throw error
  }
}

// Sync all data
export async function syncAllToSupabase(
  sessions: WorkoutSession[],
  steps: StepsEntry[],
  settings: AppSettings
): Promise<void> {
  try {
    // Save all sessions
    for (const session of sessions) {
      await saveSessionToSupabase(session)
    }

    // Save all steps
    for (const step of steps) {
      await saveStepsToSupabase(step.date, step.stepCount)
    }

    // Save settings
    await saveSettingsToSupabase(settings)
  } catch (error) {
    console.error('Error syncing to Supabase:', error)
    throw error
  }
}

export async function loadAllFromSupabase(): Promise<{
  sessions: WorkoutSession[]
  steps: StepsEntry[]
  settings: AppSettings | null
}> {
  try {
    const [sessions, steps, settings] = await Promise.all([
      fetchAllSessions(), // Only completed sessions
      fetchAllSteps(),
      fetchSettings(),
    ])

    return { sessions, steps, settings }
  } catch (error) {
    console.error('Error loading from Supabase:', error)
    throw error
  }
}

// Fetch drafts from Supabase
export async function fetchAllDrafts(): Promise<WorkoutSession[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized')
  }
  
  console.log('fetchAllDrafts - Fetching from workout_drafts table...')
  const { data: drafts, error } = await supabase
    .from('workout_drafts')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching drafts:', error)
    throw error
  }

  console.log('fetchAllDrafts - Raw drafts from database:', {
    count: drafts?.length || 0,
    drafts: drafts?.map(d => ({
      id: d.id,
      date: d.date,
      day_index: d.day_index,
      start_time: d.start_time
    }))
  })

  if (!drafts || drafts.length === 0) {
    console.log('fetchAllDrafts - No drafts found')
    return []
  }

  // Fetch all sets for these drafts
  const draftIds = drafts.map(d => d.id)
  const { data: sets, error: setsError } = await supabase!
    .from('workout_draft_sets')
    .select('*')
    .in('draft_id', draftIds)
    .order('set_number', { ascending: true })

  if (setsError) {
    console.error('Error fetching draft sets:', setsError)
    throw setsError
  }

  // Group sets by draft
  const setsByDraft = new Map<string, WorkoutSet[]>()
  sets?.forEach(set => {
    const draftSets = setsByDraft.get(set.draft_id) || []
    draftSets.push({
      id: set.id,
      sessionId: set.draft_id,
      exerciseKey: set.exercise_key,
      exerciseName: set.exercise_name,
      setNumber: set.set_number,
      weight: set.weight,
      reps: set.reps,
      rpe: set.rpe,
      notes: set.notes,
    })
    setsByDraft.set(set.draft_id, draftSets)
  })

  // Combine drafts with their sets
  return drafts.map(draft => ({
    id: draft.id,
    date: draft.date,
    dayIndex: draft.day_index,
    dayName: draft.day_name,
    notes: draft.notes,
    durationMin: draft.duration_min,
    startTime: draft.start_time,
    completed: false,
    sets: setsByDraft.get(draft.id) || [],
  }))
}
