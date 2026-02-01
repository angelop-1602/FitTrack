'use client'

import { Exercise, WorkoutSet } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ExerciseCardProps {
  exercise: Exercise
  sets: WorkoutSet[]
  units: 'kg' | 'lb'
  onSetUpdate: (setId: string, updates: Partial<WorkoutSet>) => void
  onAddSet: (exerciseKey: string, exerciseName: string) => void
  onDeleteSet: (setId: string) => void
}

export function ExerciseCard({
  exercise,
  sets,
  units,
  onSetUpdate,
  onAddSet,
  onDeleteSet,
}: ExerciseCardProps) {
  const isInclineWalk = exercise.key.startsWith('cardio-incline-walk')
  
  // For incline walk, check if reps (total seconds) is set
  // For other exercises, check if both weight and reps are set
  const completedSets = isInclineWalk
    ? sets.filter(s => s.reps !== null && s.reps > 0).length
    : sets.filter(s => s.weight !== null && s.reps !== null).length

  // Helper function to convert total seconds to minutes and seconds
  const getMinutesAndSeconds = (totalSeconds: number | null): { minutes: number; seconds: number } => {
    if (totalSeconds === null || totalSeconds === 0) return { minutes: 0, seconds: 0 }
    return {
      minutes: Math.floor(totalSeconds / 60),
      seconds: totalSeconds % 60
    }
  }

  // Helper function to convert minutes and seconds to total seconds
  const getTotalSeconds = (minutes: number, seconds: number): number => {
    return minutes * 60 + seconds
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base leading-tight">
              {exercise.name}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {exercise.sets} sets x {exercise.reps} reps
            </p>
          </div>
          <div className="flex items-center gap-2">
            {exercise.notes && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-transparent">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px]">
                    <p className="text-xs">{exercise.notes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Badge 
              variant={completedSets === sets.length ? "default" : "secondary"}
              className="text-xs"
            >
              {completedSets}/{sets.length}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Header Row */}
        {isInclineWalk ? (
          <div className="grid grid-cols-[40px_1fr_1fr_32px] gap-2 text-xs font-medium text-muted-foreground">
            <span>Set</span>
            <span>Min</span>
            <span>Sec</span>
            <span></span>
          </div>
        ) : (
          <div className="grid grid-cols-[40px_1fr_1fr_1fr_32px] gap-2 text-xs font-medium text-muted-foreground">
            <span>Set</span>
            <span>{units.toUpperCase()}</span>
            <span>Reps</span>
            <span>RPE</span>
            <span></span>
          </div>
        )}

        {/* Set Rows */}
        {sets.map((set) => {
          if (isInclineWalk) {
            const { minutes, seconds } = getMinutesAndSeconds(set.reps)
            return (
              <div 
                key={set.id} 
                className="grid grid-cols-[40px_1fr_1fr_32px] items-center gap-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-medium">
                  {set.setNumber}
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  value={minutes || ''}
                  onChange={(e) => {
                    const newMinutes = parseInt(e.target.value, 10) || 0
                    const totalSeconds = getTotalSeconds(newMinutes, seconds)
                    onSetUpdate(set.id, { reps: totalSeconds > 0 ? totalSeconds : null })
                  }}
                  className="h-10 text-center"
                  min={0}
                  max={59}
                />
                <Input
                  type="number"
                  placeholder="0"
                  value={seconds || ''}
                  onChange={(e) => {
                    const newSeconds = parseInt(e.target.value, 10) || 0
                    const clampedSeconds = Math.min(59, Math.max(0, newSeconds))
                    const totalSeconds = getTotalSeconds(minutes, clampedSeconds)
                    onSetUpdate(set.id, { reps: totalSeconds > 0 ? totalSeconds : null })
                  }}
                  className="h-10 text-center"
                  min={0}
                  max={59}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-transparent text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteSet(set.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          } else {
            return (
              <div 
                key={set.id} 
                className="grid grid-cols-[40px_1fr_1fr_1fr_32px] items-center gap-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-medium">
                  {set.setNumber}
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  value={set.weight ?? ''}
                  onChange={(e) => onSetUpdate(set.id, { 
                    weight: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  className="h-10 text-center"
                  min={0}
                  step={0.5}
                />
                <Input
                  type="number"
                  placeholder="0"
                  value={set.reps ?? ''}
                  onChange={(e) => onSetUpdate(set.id, { 
                    reps: e.target.value ? parseInt(e.target.value, 10) : null 
                  })}
                  className="h-10 text-center"
                  min={0}
                />
                <Input
                  type="number"
                  placeholder="-"
                  value={set.rpe ?? ''}
                  onChange={(e) => onSetUpdate(set.id, { 
                    rpe: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  className="h-10 text-center"
                  min={1}
                  max={10}
                  step={0.5}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-transparent text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteSet(set.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        })}

        {/* Add Set Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full gap-1 bg-transparent text-muted-foreground"
          onClick={() => onAddSet(exercise.key, exercise.name)}
        >
          <Plus className="h-4 w-4" />
          Add Set
        </Button>
      </CardContent>
    </Card>
  )
}
