'use client'

import { useStore } from '@/lib/store-context'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Target } from 'lucide-react'

export function QuickStats() {
  const { getWorkoutsThisWeek, getStepsAverage7Days } = useStore()
  
  const workoutsThisWeek = getWorkoutsThisWeek()
  const stepsAvg = getStepsAverage7Days()

  const stats = [
    {
      label: 'This Week',
      value: workoutsThisWeek,
      unit: 'workouts',
      icon: Target,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10',
    },
    {
      label: '7-Day Avg',
      value: stepsAvg.toLocaleString(),
      unit: 'steps',
      icon: TrendingUp,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
  ]

  return (
    <div className="mb-6 grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-none bg-secondary/50">
          <CardContent className="flex flex-col items-center p-3 text-center">
            <div className={`mb-2 rounded-lg p-2 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.unit}</p>
            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
              {stat.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
