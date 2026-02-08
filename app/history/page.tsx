'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useStore } from '@/lib/store-context'
import { format, parseISO, startOfMonth } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronRight, Calendar, Footprints, Search, Check, Dumbbell, Pencil, X } from 'lucide-react'

export default function HistoryPage() {
  const { state, isLoading, saveSteps } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSteps, setEditingSteps] = useState<{ date: string; value: string } | null>(null)

  // Group sessions by month
  const groupedSessions = useMemo(() => {
    const completed = state.sessions
      .filter(s => s.completed)
      .filter(s => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return (
          s.dayName.toLowerCase().includes(query) ||
          s.sets.some(set => set.exerciseName.toLowerCase().includes(query))
        )
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const groups: { [key: string]: typeof completed } = {}
    completed.forEach(session => {
      const monthKey = format(startOfMonth(parseISO(session.date)), 'MMMM yyyy')
      if (!groups[monthKey]) groups[monthKey] = []
      groups[monthKey].push(session)
    })
    return groups
  }, [state.sessions, searchQuery])

  // Sort steps by date descending
  const sortedSteps = useMemo(() => {
    return [...state.steps].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [state.steps])

  const handleSaveSteps = (date: string) => {
    if (!editingSteps || editingSteps.date !== date) return
    // Allow saving zero or empty (empty = 0)
    const trimmed = editingSteps.value.trim()
    const stepCount = trimmed === '' ? 0 : parseInt(trimmed, 10)
    if (!isNaN(stepCount) && stepCount >= 0) {
      saveSteps(date, stepCount)
    }
    setEditingSteps(null)
  }

  const handleCancelEditSteps = () => {
    setEditingSteps(null)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted-foreground">
          View your workout and steps history
        </p>
      </header>

      <Tabs defaultValue="workouts" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="workouts" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="steps" className="gap-2">
            <Footprints className="h-4 w-4" />
            Steps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sessions List */}
          {Object.keys(groupedSessions).length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  No workouts found
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Complete your first workout to see it here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedSessions).map(([month, sessions]) => (
              <div key={month}>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {month}
                </h2>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <Link key={session.id} href={`/history/${session.id}`}>
                      <Card className="transition-colors hover:bg-accent/50">
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                              D{session.dayIndex}
                            </div>
                            <div>
                              <p className="font-medium">{session.dayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(session.date), 'EEE, MMM d')}
                                {session.durationMin && ` · ${session.durationMin} min`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {session.sets.length} sets
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="steps" className="space-y-2">
          {sortedSteps.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Footprints className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">
                  No steps logged yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Log your daily steps from the dashboard
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedSteps.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">
                      {format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingSteps?.date === entry.date ? (
                      <>
                        <Input
                          type="number"
                          value={editingSteps.value}
                          onChange={(e) => setEditingSteps({ 
                            date: entry.date, 
                            value: e.target.value 
                          })}
                          onBlur={() => handleSaveSteps(entry.date)}
                          className="h-8 w-24 text-right"
                          min={0}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleSaveSteps(entry.date)}
                          aria-label="Save"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={handleCancelEditSteps}
                          aria-label="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-right transition-colors hover:text-primary flex items-baseline"
                          onClick={() => setEditingSteps({ 
                            date: entry.date, 
                            value: entry.stepCount.toString() 
                          })}
                        >
                          <span className="text-lg font-bold">
                            {entry.stepCount.toLocaleString()}
                          </span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            steps
                          </span>
                        </button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
                          onClick={() => setEditingSteps({ 
                            date: entry.date, 
                            value: entry.stepCount.toString() 
                          })}
                          aria-label="Edit steps"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
