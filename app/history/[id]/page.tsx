'use client'

import { use, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store-context'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Clock, Calendar, Trash2, Dumbbell } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function WorkoutDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { state, isLoading, getSessionById, deleteSession } = useStore()

  const session = getSessionById(id)

  // Group sets by exercise
  const exerciseGroups = useMemo(() => {
    if (!session) return []
    
    const groups: { [key: string]: typeof session.sets } = {}
    session.sets.forEach(set => {
      if (!groups[set.exerciseKey]) {
        groups[set.exerciseKey] = []
      }
      groups[set.exerciseKey].push(set)
    })
    
    return Object.entries(groups).map(([key, sets]) => ({
      exerciseKey: key,
      exerciseName: sets[0].exerciseName,
      sets: sets.sort((a, b) => a.setNumber - b.setNumber),
    }))
  }, [session])

  const handleDelete = () => {
    deleteSession(id)
    router.push('/history')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link 
          href="/history" 
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Dumbbell className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Workout not found
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalSets = session.sets.length
  // For incline walk, check if reps (total seconds) is set
  // For other exercises, check if both weight and reps are set
  const completedSets = session.sets.filter(s => {
    const isInclineWalk = s.exerciseKey.startsWith('cardio-incline-walk')
    if (isInclineWalk) {
      return s.reps !== null && s.reps > 0
    }
    return s.weight !== null && s.reps !== null
  }).length
  const totalVolume = session.sets.reduce((sum, s) => {
    const isInclineWalk = s.exerciseKey.startsWith('cardio-incline-walk')
    if (isInclineWalk) {
      // Don't count incline walk in volume calculation
      return sum
    }
    if (s.weight && s.reps) {
      return sum + (s.weight * s.reps)
    }
    return sum
  }, 0)

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <Link 
          href="/history" 
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">
              Day {session.dayIndex} - {session.dayName}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(parseISO(session.date), 'EEEE, MMM d, yyyy')}
              </span>
              {session.durationMin && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {session.durationMin} min
                </span>
              )}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="bg-transparent text-muted-foreground hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete workout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this workout session and all its data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Card className="border-none bg-secondary/50">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{completedSets}</p>
              <p className="text-xs text-muted-foreground">Sets</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-secondary/50">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">{exerciseGroups.length}</p>
              <p className="text-xs text-muted-foreground">Exercises</p>
            </CardContent>
          </Card>
          <Card className="border-none bg-secondary/50">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold">
                {totalVolume > 1000 
                  ? `${(totalVolume / 1000).toFixed(1)}k` 
                  : totalVolume}
              </p>
              <p className="text-xs text-muted-foreground">
                Volume ({state.settings.units})
              </p>
            </CardContent>
          </Card>
        </div>
      </header>

      {/* Exercises */}
      <div className="space-y-4">
        {exerciseGroups.map(({ exerciseKey, exerciseName, sets }) => {
          const isInclineWalk = exerciseKey.startsWith('cardio-incline-walk')
          
          // Helper function to format seconds as MM:SS
          const formatTime = (totalSeconds: number | null): string => {
            if (totalSeconds === null || totalSeconds === 0) return '-'
            const minutes = Math.floor(totalSeconds / 60)
            const seconds = totalSeconds % 60
            return `${minutes}:${seconds.toString().padStart(2, '0')}`
          }
          
          return (
            <Card key={exerciseKey}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{exerciseName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {/* Header */}
                  {isInclineWalk ? (
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground">
                      <span>Set</span>
                      <span>Time</span>
                      <span>RPE</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
                      <span>Set</span>
                      <span>{state.settings.units.toUpperCase()}</span>
                      <span>Reps</span>
                      <span>RPE</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  {/* Rows */}
                  {sets.map((set) => (
                    <div 
                      key={set.id} 
                      className={isInclineWalk ? "grid grid-cols-3 gap-2 py-1.5 text-sm" : "grid grid-cols-4 gap-2 py-1.5 text-sm"}
                    >
                      <span className="font-medium">{set.setNumber}</span>
                      {isInclineWalk ? (
                        <>
                          <span>{formatTime(set.reps)}</span>
                          <span className="text-muted-foreground">
                            {set.rpe ?? '-'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span>{set.weight ?? '-'}</span>
                          <span>{set.reps ?? '-'}</span>
                          <span className="text-muted-foreground">
                            {set.rpe ?? '-'}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Notes */}
      {session.notes && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{session.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
