'use client'

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useStore } from '@/lib/store-context'
import { getWorkoutDay } from '@/lib/workout-plan'
import { generateId, getTodayDate, createSession } from '@/lib/store'
import { WorkoutSession, WorkoutSet, Exercise } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ExerciseCard } from '@/components/workout/exercise-card'
import { ArrowLeft, Save, CheckCircle2, Clock, Play } from 'lucide-react'
import Link from 'next/link'
import { WorkoutCompleteCard } from '@/components/dashboard/workout-complete-card'

function WorkoutTodayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state, isLoading, getNextWorkoutDay, saveSession, getTodaySession } = useStore()
  
  // Compute session synchronously from state to avoid flash
  const today = getTodayDate()
  const todayCompletedWorkout = state.sessions.find(
    s => s.date === today && s.completed
  )
  const existingSession = getTodaySession()
  
  // Compute session synchronously - no useEffect needed
  const computedSession = useMemo(() => {
    if (isLoading) return null
    
    // If workout is completed, return null
    if (todayCompletedWorkout) return null
    
    // If existing session, return it (this includes drafts with startTime)
    if (existingSession) {
      console.log('Found existing session:', {
        id: existingSession.id,
        date: existingSession.date,
        completed: existingSession.completed,
        startTime: existingSession.startTime,
        setsCount: existingSession.sets.length
      })
      return existingSession
    }
    
    // Otherwise create new session
    const nextDayIndex = getNextWorkoutDay()
    const workout = getWorkoutDay(nextDayIndex)
    if (!workout) return null

    const newSession = createSession(state, nextDayIndex, workout.name)
    
    // Pre-create sets for each exercise
    const sets: WorkoutSet[] = []
    workout.exercises.forEach((exercise) => {
      for (let i = 1; i <= exercise.sets; i++) {
        sets.push({
          id: generateId(),
          sessionId: newSession.id,
          exerciseKey: exercise.key,
          exerciseName: exercise.name,
          setNumber: i,
          weight: null,
          reps: null,
          rpe: null,
          notes: '',
        })
      }
    })
    
    newSession.sets = sets
    console.log('Creating new session:', {
      id: newSession.id,
      date: newSession.date,
      setsCount: newSession.sets.length
    })
    return newSession
  }, [isLoading, state, existingSession, todayCompletedWorkout, getNextWorkoutDay])
  
  const [session, setSession] = useState<WorkoutSession | null>(computedSession)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false)
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)
  
  // Update session when computed session changes
  useEffect(() => {
    if (computedSession) {
      setSession(computedSession)
      
      // If this is a new session (not from existing), save it immediately to localStorage
      // This ensures it persists on refresh
      if (!existingSession && computedSession && !computedSession.startTime) {
        console.log('Saving new session to localStorage:', {
          id: computedSession.id,
          date: computedSession.date
        })
        saveSession(computedSession)
      }
    }
  }, [computedSession, existingSession, saveSession])

  // Timer effect - only runs when workout is started
  useEffect(() => {
    if (!isWorkoutStarted || !startTime) return

    const interval = setInterval(() => {
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      const totalSeconds = Math.floor(diffMs / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      
      setElapsedMinutes(minutes)
      setElapsedSeconds(seconds)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isWorkoutStarted, startTime])

  // Check if workout was already started (from existing session)
  useEffect(() => {
    if (session && session.startTime) {
      // Restore timer state from saved start time
      const savedStartTime = new Date(session.startTime)
      setStartTime(savedStartTime)
      setIsWorkoutStarted(true)
      
      // Calculate and set initial elapsed time immediately
      const now = new Date()
      const diffMs = now.getTime() - savedStartTime.getTime()
      const totalSeconds = Math.floor(diffMs / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      
      setElapsedMinutes(minutes)
      setElapsedSeconds(seconds)
    } else if (session && session.durationMin !== null && session.durationMin > 0) {
      // Fallback: If session has duration but no startTime, estimate start time
      // This handles old sessions that don't have startTime
      setIsWorkoutStarted(true)
      const estimatedStart = new Date(Date.now() - (session.durationMin * 60000))
      setStartTime(estimatedStart)
      
      // Set elapsed time from duration
      setElapsedMinutes(session.durationMin)
      setElapsedSeconds(0)
    } else if (session && !session.startTime) {
      // Reset timer state if session doesn't have startTime
      setStartTime(null)
      setIsWorkoutStarted(false)
      setElapsedMinutes(0)
      setElapsedSeconds(0)
    }
  }, [session])


  const workout = session ? getWorkoutDay(session.dayIndex) : null

  // Auto-save debounce timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSetUpdate = useCallback((setId: string, updates: Partial<WorkoutSet>) => {
    if (!session) return
    
    // Update session state immediately
    setSession(prev => {
      if (!prev) return prev
      const updatedSession = {
        ...prev,
        sets: prev.sets.map(s => 
          s.id === setId ? { ...s, ...updates } : s
        ),
      }
      
      // Auto-save with debounce (500ms delay)
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
      
      saveTimerRef.current = setTimeout(() => {
        const duration = isWorkoutStarted && startTime 
          ? elapsedMinutes 
          : (updatedSession.durationMin ?? 0)
        const startTimeToSave = startTime ? startTime.toISOString() : updatedSession.startTime
        saveSession({ 
          ...updatedSession, 
          durationMin: duration, 
          startTime: startTimeToSave 
        })
      }, 500)
      
      return updatedSession
    })
  }, [session, isWorkoutStarted, startTime, elapsedMinutes, saveSession])

  const handleAddSet = useCallback((exerciseKey: string, exerciseName: string) => {
    if (!session) return
    
    const exerciseSets = session.sets.filter(s => s.exerciseKey === exerciseKey)
    const nextSetNumber = exerciseSets.length + 1
    
    const newSet: WorkoutSet = {
      id: generateId(),
      sessionId: session.id,
      exerciseKey,
      exerciseName,
      setNumber: nextSetNumber,
      weight: null,
      reps: null,
      rpe: null,
      notes: '',
    }
    
    setSession(prev => {
      if (!prev) return prev
      // Insert after the last set of this exercise
      const lastIndex = prev.sets.findLastIndex(s => s.exerciseKey === exerciseKey)
      const newSets = [...prev.sets]
      newSets.splice(lastIndex + 1, 0, newSet)
      return { ...prev, sets: newSets }
    })
  }, [session])

  const handleDeleteSet = useCallback((setId: string) => {
    if (!session) return
    
    setSession(prev => {
      if (!prev) return prev
      const setToDelete = prev.sets.find(s => s.id === setId)
      if (!setToDelete) return prev
      
      // Remove the set and renumber remaining sets for this exercise
      const filteredSets = prev.sets.filter(s => s.id !== setId)
      let setNumber = 1
      const renumberedSets = filteredSets.map(s => {
        if (s.exerciseKey === setToDelete.exerciseKey) {
          return { ...s, setNumber: setNumber++ }
        }
        return s
      })
      
      return { ...prev, sets: renumberedSets }
    })
  }, [session])

  const handleStartWorkout = () => {
    if (!session) return
    const now = new Date()
    const startTimeISO = now.toISOString()
    
    console.log('Starting workout:', {
      sessionId: session.id,
      startTime: startTimeISO,
      setsCount: session.sets.length
    })
    
    setStartTime(now)
    setIsWorkoutStarted(true)
    
    // Save session with start time (ISO string) - this saves to both localStorage and Supabase
    const sessionToSave = { ...session, startTime: startTimeISO, durationMin: 0 }
    saveSession(sessionToSave)
    
    // Also update local session state immediately so it's available right away
    setSession(sessionToSave)
  }

  // Auto-start workout if coming from home page with start=true
  useEffect(() => {
    const shouldAutoStart = searchParams.get('start') === 'true'
    if (shouldAutoStart && session && !isWorkoutStarted && !startTime) {
      // Small delay to ensure session is fully initialized
      const timer = setTimeout(() => {
        handleStartWorkout()
        // Remove the query parameter from URL
        router.replace('/workout/today', { scroll: false })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [session, isWorkoutStarted, startTime, searchParams, router, handleStartWorkout])

  const handleSaveDraft = () => {
    if (!session) return
    const duration = isWorkoutStarted && startTime 
      ? elapsedMinutes 
      : (session.durationMin ?? 0)
    const startTimeToSave = startTime ? startTime.toISOString() : session.startTime
    saveSession({ ...session, durationMin: duration, startTime: startTimeToSave })
  }

  const handleComplete = () => {
    if (!session) return
    
    // Show completion message briefly before redirecting
    setShowCompletionMessage(true)
    
    const finalDuration = isWorkoutStarted && startTime 
      ? elapsedMinutes 
      : (session.durationMin ?? 0)
    const startTimeToSave = startTime ? startTime.toISOString() : session.startTime
    
    saveSession({ 
      ...session, 
      completed: true, 
      durationMin: finalDuration,
      startTime: startTimeToSave
    })
    
    // Redirect after showing message for 2 seconds
    setTimeout(() => {
      router.push('/')
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Show completion message if workout is already completed or just completed
  if (todayCompletedWorkout || showCompletionMessage) {
    const workoutToShow = todayCompletedWorkout || session
    return (
      <div className="mx-auto max-w-lg px-4 py-6">      
        {workoutToShow && (
          <WorkoutCompleteCard 
            workoutName={workoutToShow.dayName}
            dayIndex={workoutToShow.dayIndex}
          />
        )}
      </div>
    )
  }

  if (!session || !workout) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // For incline walk, check if reps (total seconds) is set
  // For other exercises, check if both weight and reps are set
  const completedSets = session.sets.filter(s => {
    const exercise = workout?.exercises.find(e => e.key === s.exerciseKey)
    const isInclineWalk = exercise?.key.startsWith('cardio-incline-walk') ?? false
    if (isInclineWalk) {
      return s.reps !== null && s.reps > 0
    }
    return s.weight !== null && s.reps !== null
  }).length
  const totalSets = session.sets.length

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Day {session.dayIndex} - {session.dayName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {workout.description}
            </p>
          </div>
          {isWorkoutStarted ? (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Clock className="h-5 w-5 animate-pulse" />
              <span className="font-semibold">
                {String(Math.floor(elapsedMinutes)).padStart(2, '0')}:
                {String(elapsedSeconds).padStart(2, '0')}
              </span>
            </Badge>
          ) : (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1.5 bg-secondary text-muted-foreground"
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs font-medium">
                Not started
              </span>
            </Badge>
          )}
        </div>
        
        <div className="mt-3 flex items-center gap-2">
          <Badge variant="outline">
            {completedSets}/{totalSets} sets logged
          </Badge>
        </div>
      </header>

      {/* Start Workout Button or Exercise List */}
      {!isWorkoutStarted ? (
        <Card className="mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Ready to Start?</h2>
            <p className="mb-6 text-sm text-muted-foreground max-w-sm">
              Click the button below to start your workout timer and begin tracking your gym session.
            </p>
            <Button 
              size="lg" 
              className="gap-2 px-8"
              onClick={handleStartWorkout}
            >
              <Play className="h-5 w-5" />
              Start Workout
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Exercise List */}
          <div className="space-y-4">
            {workout.exercises.map((exercise) => {
              const exerciseSets = session.sets.filter(s => s.exerciseKey === exercise.key)
              
              return (
                <ExerciseCard
                  key={exercise.key}
                  exercise={exercise}
                  sets={exerciseSets}
                  units={state.settings.units}
                  onSetUpdate={handleSetUpdate}
                  onAddSet={handleAddSet}
                  onDeleteSet={handleDeleteSet}
                />
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-16 mt-6 flex gap-3 bg-background/95 py-4 backdrop-blur-sm">
            <Button 
              variant="outline" 
              className="flex-1 gap-2 bg-transparent"
              onClick={handleSaveDraft}
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={handleComplete}
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default function WorkoutTodayPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <WorkoutTodayContent />
    </Suspense>
  )
}
