'use client'

import Link from 'next/link'
import { WorkoutDay } from '@/lib/types'
import { useStore } from '@/lib/store-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, ChevronRight } from 'lucide-react'

interface NextWorkoutCardProps {
  workout: WorkoutDay
}

export function NextWorkoutCard({ workout }: NextWorkoutCardProps) {
  const { getDayOfWeekForWorkoutDay } = useStore()
  const dayOfWeek = getDayOfWeekForWorkoutDay(workout.dayIndex)
  const previewExercises = workout.exercises.slice(0, 4)
  const remainingCount = workout.exercises.length - previewExercises.length

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
                Next Workout
              </p>
              <Badge variant="secondary" className="font-medium flex-shrink-0">
                {workout.exercises.length} exercises
              </Badge>
            </div>
            <CardTitle className="text-lg truncate">
              Day {workout.dayIndex} - {workout.name}
            </CardTitle>
            {dayOfWeek && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {dayOfWeek}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{workout.description}</p>

        <div className="space-y-2">
          {previewExercises.map((exercise) => (
            <div
              key={exercise.key}
              className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-sm"
            >
              <span className="font-medium">{exercise.name}</span>
              <span className="text-muted-foreground">
                {exercise.sets}x{exercise.reps}
              </span>
            </div>
          ))}
          {remainingCount > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              +{remainingCount} more exercises
            </p>
          )}
        </div>

        <Link href="/workout/today?start=true" className="block">
          <Button className="w-full gap-2" size="lg">
            Start Workout
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
