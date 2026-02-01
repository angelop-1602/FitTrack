'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Sparkles, CheckCircle2 } from 'lucide-react'

interface WorkoutCompleteCardProps {
  workoutName: string
  dayIndex: number
}

export function WorkoutCompleteCard({ workoutName, dayIndex }: WorkoutCompleteCardProps) {
  return (
    <Card className="mb-4 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/20">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>
        
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Workout Complete! 🎉
        </h2>
        
        <p className="mb-1 text-base font-medium text-muted-foreground">
          Day {dayIndex} - {workoutName}
        </p>
        
        <div className="mt-4 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-primary">
            Great job today!
          </span>
        </div>
        
        <p className="mt-4 max-w-sm text-sm text-muted-foreground">
          You've crushed it! Rest up and come back stronger tomorrow. 💪
        </p>
        
        <div className="mt-4 flex gap-1">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <Sparkles className="h-4 w-4 text-primary animate-pulse delay-75" />
          <Sparkles className="h-4 w-4 text-primary animate-pulse delay-150" />
        </div>
      </CardContent>
    </Card>
  )
}
