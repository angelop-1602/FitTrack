'use client'

import { use, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store-context'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ArrowLeft, Clock, Calendar, Trash2, Dumbbell, Pencil, Save, X } from 'lucide-react'
import type { WorkoutSession, WorkoutSet } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function WorkoutDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { state, isLoading, getSessionById, deleteSession, saveSession } = useStore()

  const session = getSessionById(id)
  const [isEditing, setIsEditing] = useState(false)
  const [editSession, setEditSession] = useState<WorkoutSession | null>(null)

  const startEditing = useCallback(() => {
    if (session) {
      setEditSession(JSON.parse(JSON.stringify(session)))
      setIsEditing(true)
    }
  }, [session])

  const cancelEditing = useCallback(() => {
    setEditSession(null)
    setIsEditing(false)
  }, [])

  const saveEditing = useCallback(() => {
    if (editSession) {
      saveSession(editSession)
      setEditSession(null)
      setIsEditing(false)
    }
  }, [editSession, saveSession])

  const updateSet = useCallback((setId: string, updates: Partial<WorkoutSet>) => {
    setEditSession(prev => {
      if (!prev) return null
      return {
        ...prev,
        sets: prev.sets.map(s => s.id === setId ? { ...s, ...updates } : s),
      }
    })
  }, [])

  const updateSessionField = useCallback(<K extends keyof WorkoutSession>(key: K, value: WorkoutSession[K]) => {
    setEditSession(prev => prev ? { ...prev, [key]: value } : null)
  }, [])

  const displaySession = isEditing ? editSession : session

  // Group sets by exercise
  const exerciseGroups = useMemo(() => {
    if (!displaySession) return []
    const sets = displaySession.sets
    const groups: { [key: string]: typeof sets } = {}
    sets.forEach(set => {
      if (!groups[set.exerciseKey]) {
        groups[set.exerciseKey] = []
      }
      groups[set.exerciseKey].push(set)
    })
    return Object.entries(groups).map(([key, groupSets]) => ({
      exerciseKey: key,
      exerciseName: groupSets[0].exerciseName,
      sets: groupSets.sort((a, b) => a.setNumber - b.setNumber),
    }))
  }, [displaySession])

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

  const totalSets = displaySession.sets.length
  const completedSets = displaySession.sets.filter(s => {
    const isInclineWalk = s.exerciseKey.startsWith('cardio-incline-walk')
    if (isInclineWalk) {
      return s.reps !== null && s.reps > 0
    }
    return s.weight !== null && s.reps !== null
  }).length
  const totalVolume = displaySession.sets.reduce((sum, s) => {
    const isInclineWalk = s.exerciseKey.startsWith('cardio-incline-walk')
    if (isInclineWalk) return sum
    if (s.weight && s.reps) return sum + (s.weight * s.reps)
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
              Day {displaySession.dayIndex} - {displaySession.dayName}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(parseISO(displaySession.date), 'EEEE, MMM d, yyyy')}
              </span>
              {(displaySession.durationMin != null && displaySession.durationMin > 0) && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {displaySession.durationMin} min
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Button variant="ghost" size="icon" onClick={cancelEditing} className="text-muted-foreground hover:text-foreground" aria-label="Cancel">
                  <X className="h-5 w-5" />
                </Button>
                <Button size="sm" onClick={saveEditing} className="gap-1.5">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={startEditing} className="text-muted-foreground hover:text-primary" aria-label="Edit workout">
                  <Pencil className="h-5 w-5" />
                </Button>
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
              </>
            )}
          </div>
        </div>

        {/* Edit: Duration */}
        {isEditing && editSession && (
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <Label className="text-xs">Duration (min)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={editSession.durationMin ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    updateSessionField('durationMin', v === '' ? null : Math.max(0, parseInt(v, 10) || 0))
                  }}
                  placeholder="Optional"
                  className="max-w-[120px]"
                />
              </div>
            </CardContent>
          </Card>
        )}

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
                  {sets.map((set) => (
                    <div 
                      key={set.id} 
                      className={isInclineWalk ? "grid grid-cols-3 gap-2 py-1.5 text-sm items-center" : "grid grid-cols-4 gap-2 py-1.5 text-sm items-center"}
                    >
                      <span className="font-medium">{set.setNumber}</span>
                      {isEditing ? (
                        isInclineWalk ? (
                          <>
                            <div className="flex gap-1 items-center">
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-14 text-sm"
                                placeholder="M"
                                value={set.reps != null ? Math.floor(set.reps / 60) : ''}
                                onChange={(e) => {
                                  const m = parseInt(e.target.value, 10) || 0
                                  const sec = set.reps != null ? set.reps % 60 : 0
                                  updateSet(set.id, { reps: m * 60 + sec || null })
                                }}
                              />
                              <span className="text-muted-foreground">:</span>
                              <Input
                                type="number"
                                min={0}
                                max={59}
                                className="h-8 w-14 text-sm"
                                placeholder="S"
                                value={set.reps != null ? set.reps % 60 : ''}
                                onChange={(e) => {
                                  const s = Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0))
                                  const min = set.reps != null ? Math.floor(set.reps / 60) : 0
                                  updateSet(set.id, { reps: min * 60 + s || null })
                                }}
                              />
                            </div>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              step={0.5}
                              className="h-8 w-14 text-sm"
                              placeholder="RPE"
                              value={set.rpe ?? ''}
                              onChange={(e) => {
                                const v = e.target.value
                                updateSet(set.id, { rpe: v === '' ? null : parseFloat(v) || null })
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              className="h-8 text-sm"
                              placeholder="-"
                              value={set.weight ?? ''}
                              onChange={(e) => {
                                const v = e.target.value
                                updateSet(set.id, { weight: v === '' ? null : parseFloat(v) || null })
                              }}
                            />
                            <Input
                              type="number"
                              min={0}
                              className="h-8 text-sm"
                              placeholder="-"
                              value={set.reps ?? ''}
                              onChange={(e) => {
                                const v = e.target.value
                                updateSet(set.id, { reps: v === '' ? null : parseInt(v, 10) || null })
                              }}
                            />
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              step={0.5}
                              className="h-8 w-14 text-sm"
                              placeholder="RPE"
                              value={set.rpe ?? ''}
                              onChange={(e) => {
                                const v = e.target.value
                                updateSet(set.id, { rpe: v === '' ? null : parseFloat(v) || null })
                              }}
                            />
                          </>
                        )
                      ) : (
                        isInclineWalk ? (
                          <>
                            <span>{formatTime(set.reps)}</span>
                            <span className="text-muted-foreground">{set.rpe ?? '-'}</span>
                          </>
                        ) : (
                          <>
                            <span>{set.weight ?? '-'}</span>
                            <span>{set.reps ?? '-'}</span>
                            <span className="text-muted-foreground">{set.rpe ?? '-'}</span>
                          </>
                        )
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
      {(displaySession.notes || (isEditing && editSession)) && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && editSession ? (
              <Input
                value={editSession.notes ?? ''}
                onChange={(e) => updateSessionField('notes', e.target.value)}
                placeholder="Optional notes"
                className="w-full"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{displaySession.notes || '—'}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
