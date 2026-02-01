'use client'

import Link from 'next/link'
import { useStore } from '@/lib/store-context'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Calendar } from 'lucide-react'

export function RecentSessions() {
  const { state } = useStore()
  
  const recentSessions = state.sessions
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  if (recentSessions.length === 0) {
    return (
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Recent Sessions
        </h2>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No completed workouts yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Start your first workout to see your history
            </p>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Recent Sessions
        </h2>
        <Link 
          href="/history" 
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      
      <div className="space-y-2">
        {recentSessions.map((session) => {
          const totalSets = session.sets.length
          
          return (
            <Link key={session.id} href={`/history/${session.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary flex-shrink-0">
                      D{session.dayIndex}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium truncate">{session.dayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {format(parseISO(session.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {totalSets} sets
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
