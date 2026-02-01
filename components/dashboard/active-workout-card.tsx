'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { WorkoutSession } from '@/lib/types'
import { getWorkoutDay } from '@/lib/workout-plan'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ChevronRight, Dumbbell } from 'lucide-react'

interface ActiveWorkoutCardProps {
  session: WorkoutSession
  elapsedMinutes: number
  elapsedSeconds: number
}

export function ActiveWorkoutCard({ session, elapsedMinutes, elapsedSeconds }: ActiveWorkoutCardProps) {
  const workout = getWorkoutDay(session.dayIndex)
  if (!workout) return null

  // Debug: Log session data to verify it's from drafts
  console.log('ActiveWorkoutCard - Session data:', {
    id: session.id,
    date: session.date,
    completed: session.completed,
    startTime: session.startTime,
    setsCount: session.sets.length,
    sets: session.sets.slice(0, 3), // First 3 sets for debugging
  })

  // Group sets by exercise
  const exerciseGroups = useMemo(() => {
    const groups: { [key: string]: typeof session.sets } = {}
    session.sets.forEach(set => {
      if (!groups[set.exerciseKey]) {
        groups[set.exerciseKey] = []
      }
      groups[set.exerciseKey].push(set)
    })
    
    return workout.exercises.map(exercise => {
      const sets = (groups[exercise.key] || []).sort((a, b) => a.setNumber - b.setNumber)
      return {
        exercise,
        sets,
      }
    })
  }, [session.sets, workout.exercises])

  // Find current and next exercise
  const { currentExercise, nextExercise, isLastSet } = useMemo(() => {
    for (let i = 0; i < exerciseGroups.length; i++) {
      const { exercise, sets } = exerciseGroups[i]
      const expectedSets = exercise.sets
      const isInclineWalk = exercise.key.startsWith('cardio-incline-walk')
      
      // Check if all sets are completed
      const allSetsCompleted = sets.length === expectedSets && sets.every(set => {
        if (isInclineWalk) {
          return set.reps !== null && set.reps > 0
        }
        return set.weight !== null && set.reps !== null
      })
      
      if (allSetsCompleted) {
        // This exercise is done, check next one
        const next = i + 1 < exerciseGroups.length ? exerciseGroups[i + 1] : null
        if (next) {
          // Check if next exercise's first set is filled
          const nextFirstSet = next.sets[0]
          const nextIsInclineWalk = next.exercise.key.startsWith('cardio-incline-walk')
          const nextFirstSetFilled = nextFirstSet && (
            nextIsInclineWalk
              ? (nextFirstSet.reps !== null && nextFirstSet.reps > 0)
              : (nextFirstSet.weight !== null && nextFirstSet.reps !== null)
          )
          
          return {
            currentExercise: { 
              exercise: next.exercise, 
              sets: next.sets,
              isCompleted: false,
              isNext: !nextFirstSetFilled
            },
            nextExercise: i + 2 < exerciseGroups.length ? exerciseGroups[i + 2] : null,
            isLastSet: false,
          }
        }
        continue
      }
      
      // This is the current exercise (not all sets completed)
      // Check if we're on the last set - if we have all sets created, last set exists, 
      // we've filled at least one set, and the last set is not filled yet
      const isLast = sets.length === expectedSets
      const lastSet = sets.find(s => s.setNumber === expectedSets)
      
      // Count filled sets
      const filledSets = sets.filter(set => {
        if (isInclineWalk) {
          return set.reps !== null && set.reps > 0
        }
        return set.weight !== null && set.reps !== null
      })
      const filledSetsCount = filledSets.length
      
      // Check if last set is not filled yet (we're about to do it)
      const lastSetNotFilled = lastSet && (
        isInclineWalk
          ? (lastSet.reps === null || lastSet.reps === 0)
          : (lastSet.weight === null || lastSet.reps === null)
      )
      
      // We're on the last set if: all sets exist, last set exists, we have at least one filled set, and last set is not filled
      // Simplified: if we have all sets and the last set is not filled yet, we're on the last set
      const isOnLastSet = isLast && lastSet !== undefined && lastSetNotFilled && filledSetsCount > 0
      
      // Debug logging for this exercise
      console.log(`Exercise "${exercise.name}":`, {
        expectedSets,
        actualSets: sets.length,
        filledSetsCount,
        isLast,
        lastSetExists: lastSet !== undefined,
        lastSetNumber: lastSet?.setNumber,
        lastSetNotFilled,
        isOnLastSet,
        setNumbers: sets.map(s => s.setNumber).sort((a, b) => a - b),
      })
      
      const next = i + 1 < exerciseGroups.length ? exerciseGroups[i + 1] : null
      
      return {
        currentExercise: { exercise, sets, isCompleted: false, isNext: false },
        nextExercise: next ? { exercise: next.exercise, sets: next.sets } : null,
        isLastSet: isOnLastSet, // Show next exercise when on last set
      }
    }
    
    // All exercises completed, show last exercise as current
    const lastGroup = exerciseGroups[exerciseGroups.length - 1]
    return {
      currentExercise: { 
        exercise: lastGroup.exercise, 
        sets: lastGroup.sets,
        isCompleted: true,
        isNext: false
      },
      nextExercise: null,
      isLastSet: false,
    }
  }, [exerciseGroups])

  // Debug: Log the final result
  console.log('ActiveWorkoutCard - Final result:', {
    currentExercise: currentExercise.exercise.name,
    nextExercise: nextExercise?.exercise.name || 'none',
    isLastSet,
    currentExerciseSets: currentExercise.sets.length,
    nextExerciseSets: nextExercise?.sets.length || 0,
  })

  // Get the first set of current exercise to show weight/reps
  const firstSet = currentExercise.sets[0]
  const isInclineWalk = currentExercise.exercise.key.startsWith('cardio-incline-walk')
  
  // Format time for incline walk
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  return (
    <Card className="mb-4 overflow-hidden border-primary/20 bg-gradient-to-br from-card to-accent/30">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3 w-full">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between w-full gap-2 mb-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
                Active Workout
              </p>
              <Badge 
                variant="secondary" 
                className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 flex-shrink-0"
              >
                <Clock className="h-4 w-4 animate-pulse" />
                <span className="font-semibold text-xs">
                  {String(Math.floor(elapsedMinutes)).padStart(2, '0')}:
                  {String(elapsedSeconds).padStart(2, '0')}
                </span>
              </Badge>
            </div>
            <CardTitle className="text-lg truncate">
              Day {session.dayIndex} - {session.dayName}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Exercise with sets */}
        <div className="space-y-3">
          <div className="rounded-lg bg-background/50 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">{currentExercise.exercise.name}</span>
              {currentExercise.isCompleted && (
                <Badge variant="outline" className="text-xs">Completed</Badge>
              )}
              {!currentExercise.isCompleted && currentExercise.isNext && (
                <Badge variant="outline" className="text-xs">Next</Badge>
              )}
              {!currentExercise.isCompleted && !currentExercise.isNext && (
                <Badge variant="default" className="text-xs">Current</Badge>
              )}
            </div>
            
            {/* Show sets in 3 columns */}
            {currentExercise.sets.length > 0 && (
              <div className="mt-2 space-y-1">
                {/* Header row */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-medium text-muted-foreground border-b border-border/50 pb-1">
                  <div>Set</div>
                  {isInclineWalk ? (
                    <>
                      <div>Time</div>
                      <div>--</div>
                    </>
                  ) : (
                    <>
                      <div>kg</div>
                      <div>reps / RPE</div>
                    </>
                  )}
                </div>
                {/* Sets rows */}
                {currentExercise.sets.map((set) => {
                  const setIsInclineWalk = currentExercise.exercise.key.startsWith('cardio-incline-walk')
                  return (
                    <div key={set.id} className="grid grid-cols-3 gap-2 text-xs">
                      <div className="font-medium">
                        {set.setNumber}{set.setNumber === 1 ? 'st' : set.setNumber === 2 ? 'nd' : set.setNumber === 3 ? 'rd' : 'th'}
                      </div>
                      {setIsInclineWalk ? (
                        <>
                          <div className="text-muted-foreground">
                            {set.reps !== null && set.reps > 0 ? formatTime(set.reps) : '--'}
                          </div>
                          <div className="text-muted-foreground">--</div>
                        </>
                      ) : (
                        <>
                          <div className="text-muted-foreground">
                            {set.weight !== null ? set.weight : '--'}
                          </div>
                          <div className="text-muted-foreground">
                            {set.reps !== null ? set.reps : '--'} {set.rpe !== null ? `/ ${set.rpe}` : ''}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Show next exercise preview when on last set */}
          {isLastSet && nextExercise && (
            <div className="rounded-lg bg-background/50 px-3 py-2.5 opacity-60">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold">{nextExercise.exercise.name}</span>
                <Badge variant="default" className="text-xs">Next</Badge>
              </div>
              {nextExercise.sets[0] && !nextExercise.exercise.key.startsWith('cardio-incline-walk') && 
               nextExercise.sets[0].weight !== null && nextExercise.sets[0].reps !== null && (
                <p className="text-xs text-muted-foreground">
                  {nextExercise.sets[0].weight}kg × {nextExercise.sets[0].reps} reps
                </p>
              )}
              {nextExercise.sets[0] && nextExercise.exercise.key.startsWith('cardio-incline-walk') && 
               nextExercise.sets[0].reps !== null && nextExercise.sets[0].reps > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatTime(nextExercise.sets[0].reps)}
                </p>
              )}
              {(!nextExercise.sets[0] || 
                (nextExercise.sets[0] && !nextExercise.exercise.key.startsWith('cardio-incline-walk') && 
                 (nextExercise.sets[0].weight === null || nextExercise.sets[0].reps === null)) ||
                (nextExercise.sets[0] && nextExercise.exercise.key.startsWith('cardio-incline-walk') && 
                 (nextExercise.sets[0].reps === null || nextExercise.sets[0].reps === 0))) && (
                <p className="text-xs text-muted-foreground">Ready to start</p>
              )}
            </div>
          )}
        </div>

        <Link href="/workout/today" className="block">
          <Button className="w-full gap-2" size="lg">
            Continue Workout
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
