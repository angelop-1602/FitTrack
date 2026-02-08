'use client'

import { useStore } from '@/lib/store-context'
import { getWorkoutDay } from '@/lib/workout-plan'
import { getTodayDate } from '@/lib/store'
import { format } from 'date-fns'
import { NextWorkoutCard } from '@/components/dashboard/next-workout-card'
import { WorkoutCompleteCard } from '@/components/dashboard/workout-complete-card'
import { ActiveWorkoutCard } from '@/components/dashboard/active-workout-card'
import { StepsTodayCard } from '@/components/dashboard/steps-today-card'
import { QuickStats } from '@/components/dashboard/quick-stats'
import { RecentSessions } from '@/components/dashboard/recent-sessions'
import { InstallBanner } from '@/components/dashboard/install-banner'
import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  const { state, isLoading, getNextWorkoutDay, getWorkoutStreak, getTodaySession } = useStore()
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const today = getTodayDate()
  const streak = getWorkoutStreak()
  
  // Check if there's a completed workout for today
  const todayCompletedWorkout = state.sessions.find(
    s => s.date === today && s.completed
  )

  // Check if there's an active workout (not completed, has startTime)
  const activeSession = getTodaySession()
  const hasActiveWorkout = activeSession && activeSession.startTime && !activeSession.completed

  // Calculate elapsed time for active workout
  const elapsedTime = hasActiveWorkout && activeSession.startTime ? (() => {
    const now = new Date()
    const startTime = new Date(activeSession.startTime)
    const diffMs = now.getTime() - startTime.getTime()
    const totalSeconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return { minutes, seconds }
  })() : null

  const nextDayIndex = getNextWorkoutDay()
  const nextWorkout = getWorkoutDay(nextDayIndex)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Today</h1>
          <Badge 
            variant="secondary" 
            className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Flame className="h-5 w-5" />
            <span className="font-semibold">{streak}</span>
            <span className="text-xs">day{streak !== 1 ? 's' : ''}</span>
          </Badge>
        </div>
      </header>

      {/* Show active workout, completed message, or next workout */}
      {hasActiveWorkout && activeSession && elapsedTime ? (
        <ActiveWorkoutCard 
          session={activeSession}
          elapsedMinutes={elapsedTime.minutes}
          elapsedSeconds={elapsedTime.seconds}
        />
      ) : todayCompletedWorkout ? (
        <WorkoutCompleteCard 
          workoutName={todayCompletedWorkout.dayName}
          dayIndex={todayCompletedWorkout.dayIndex}
        />
      ) : (
        nextWorkout && (
          <NextWorkoutCard workout={nextWorkout} />
        )
      )}

      {/* Steps Today */}
      <StepsTodayCard />

      {/* Quick Stats */}
      <QuickStats />

      {/* Install Banner */}
      <InstallBanner />

      {/* Recent Sessions */}
      <RecentSessions />
    </div>
  )
}
