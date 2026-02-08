'use client'

import { useMemo, useState, useEffect } from 'react'
import { useStore } from '@/lib/store-context'
import { format, subDays, parseISO, startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks, getDay, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Footprints, Dumbbell, TrendingUp, Target, Clock, Activity, Heart, Zap, Trophy, BarChart3, TrendingDown, ArrowUp, ArrowDown, Minus } from 'lucide-react'

// Helper to get computed CSS variable values
function useChartColors() {
  const [colors, setColors] = useState({
    chart1: 'oklch(0.68 0.18 47)',
    chart2: 'oklch(0.6 0.16 260)',
    chart3: 'oklch(0.6 0.18 280)',
    chart4: 'oklch(0.75 0.14 58)',
    chart5: 'oklch(0.6 0.2 30)',
    muted: 'oklch(0.95 0 0)',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const root = document.documentElement
    const computed = getComputedStyle(root)
    
    setColors({
      chart1: computed.getPropertyValue('--chart-1').trim() || 'oklch(0.68 0.18 47)',
      chart2: computed.getPropertyValue('--chart-2').trim() || 'oklch(0.6 0.16 260)',
      chart3: computed.getPropertyValue('--chart-3').trim() || 'oklch(0.6 0.18 280)',
      chart4: computed.getPropertyValue('--chart-4').trim() || 'oklch(0.75 0.14 58)',
      chart5: computed.getPropertyValue('--chart-5').trim() || 'oklch(0.6 0.2 30)',
      muted: computed.getPropertyValue('--muted').trim() || 'oklch(0.95 0 0)',
    })
  }, [])

  return colors
}

export default function AnalyticsPage() {
  const { state, isLoading, getWorkoutsThisWeek } = useStore()
  const [stepsRange, setStepsRange] = useState<'14' | '30'>('14')
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const chartColors = useChartColors()

  // Chart config using CSS variables
  const chartConfig = useMemo(() => ({
    steps: { label: 'Steps', color: 'var(--chart-2)' },
    goal: { label: 'Goal', color: 'var(--muted)' },
    workouts: { label: 'Workouts', color: 'var(--chart-1)' },
    weight: { label: 'Best Set (kg)', color: 'var(--chart-1)' },
    volume: { label: 'Volume', color: 'var(--chart-2)' },
    duration: { label: 'Duration (min)', color: 'var(--chart-3)' },
    cardio: { label: 'Cardio (min)', color: 'var(--chart-5)' },
    rpe: { label: 'RPE', color: 'var(--chart-4)' },
    day: { label: 'Day', color: 'var(--chart-1)' },
    frequency: { label: 'Frequency', color: 'var(--chart-2)' },
  }), [])

  // Get all unique exercises from history
  const allExercises = useMemo(() => {
    const exercises = new Set<string>()
    state.sessions.forEach(session => {
      session.sets.forEach(set => {
        exercises.add(set.exerciseName)
      })
    })
    return Array.from(exercises).sort()
  }, [state.sessions])

  // Steps chart data
  const stepsChartData = useMemo(() => {
    const days = parseInt(stepsRange, 10)
    const data = []
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const stepsEntry = state.steps.find(s => s.date === dateStr)
      
      data.push({
        date: format(date, 'MMM d'),
        steps: stepsEntry?.stepCount ?? 0,
        goal: state.settings.stepGoal,
      })
    }
    
    return data
  }, [state.steps, state.settings.stepGoal, stepsRange])

  const weekOpt = { weekStartsOn: 1 } as const // Monday–Sunday

  // Workouts per week data
  const workoutsPerWeekData = useMemo(() => {
    const today = new Date()
    const weeks = eachWeekOfInterval(
      { start: subWeeks(today, 7), end: today },
      weekOpt
    )
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, weekOpt)
      const weekSessions = state.sessions.filter(s => {
        if (!s.completed) return false
        const sessionDate = parseISO(s.date)
        return sessionDate >= weekStart && sessionDate <= weekEnd
      })
      
      return {
        week: format(weekStart, 'MMM d'),
        workouts: weekSessions.length,
      }
    })
  }, [state.sessions])

  // Exercise progression data
  const exerciseProgressionData = useMemo(() => {
    if (!selectedExercise) return []
    
    const data: { date: string; weight: number; volume: number }[] = []
    
    state.sessions
      .filter(s => s.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(session => {
        const exerciseSets = session.sets.filter(
          s => s.exerciseName === selectedExercise && s.weight && s.reps
        )
        
        if (exerciseSets.length === 0) return
        
        // Find best set (highest weight)
        const bestSet = exerciseSets.reduce((best, current) => 
          (current.weight ?? 0) > (best.weight ?? 0) ? current : best
        )
        
        // Calculate total volume
        const totalVolume = exerciseSets.reduce((sum, set) => 
          sum + ((set.weight ?? 0) * (set.reps ?? 0)), 0
        )
        
        data.push({
          date: format(parseISO(session.date), 'MMM d'),
          weight: bestSet.weight ?? 0,
          volume: totalVolume,
        })
      })
    
    return data
  }, [state.sessions, selectedExercise])

  // Summary stats (Monday–Sunday week)
  const weeklyStepsTotal = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, weekOpt)
    const weekEnd = endOfWeek(today, weekOpt)
    return state.steps
      .filter(s => {
        const d = parseISO(s.date)
        return d >= weekStart && d <= weekEnd
      })
      .reduce((sum, s) => sum + s.stepCount, 0)
  }, [state.steps])

  const totalWorkouts = state.sessions.filter(s => s.completed).length

  const mostTrainedExercise = useMemo(() => {
    const counts: { [key: string]: number } = {}
    state.sessions.forEach(session => {
      session.sets.forEach(set => {
        counts[set.exerciseName] = (counts[set.exerciseName] || 0) + 1
      })
    })
    
    let maxExercise = ''
    let maxCount = 0
    Object.entries(counts).forEach(([exercise, count]) => {
      if (count > maxCount) {
        maxCount = count
        maxExercise = exercise
      }
    })
    
    return maxExercise || 'N/A'
  }, [state.sessions])

  // Workout Duration Analytics
  const durationChartData = useMemo(() => {
    return state.sessions
      .filter(s => s.completed && s.durationMin !== null && s.durationMin > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(session => ({
        date: format(parseISO(session.date), 'MMM d'),
        duration: session.durationMin ?? 0,
      }))
  }, [state.sessions])

  const avgDuration = useMemo(() => {
    const durations = state.sessions
      .filter(s => s.completed && s.durationMin !== null && s.durationMin > 0)
      .map(s => s.durationMin ?? 0)
    if (durations.length === 0) return 0
    return Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
  }, [state.sessions])

  // Total Volume Analytics
  const volumeChartData = useMemo(() => {
    return state.sessions
      .filter(s => s.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(session => {
        const totalVolume = session.sets.reduce((sum, set) => {
          if (set.weight && set.reps) {
            return sum + (set.weight * set.reps)
          }
          return sum
        }, 0)
        return {
          date: format(parseISO(session.date), 'MMM d'),
          volume: totalVolume,
        }
      })
      .filter(d => d.volume > 0)
  }, [state.sessions])

  const weeklyVolume = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, weekOpt)
    const weekEnd = endOfWeek(today, weekOpt)
    return state.sessions
      .filter(s => {
        if (!s.completed) return false
        const sessionDate = parseISO(s.date)
        return sessionDate >= weekStart && sessionDate <= weekEnd
      })
      .reduce((sum, session) => {
        const sessionVolume = session.sets.reduce((setSum, set) => {
          if (set.weight && set.reps) {
            return setSum + (set.weight * set.reps)
          }
          return setSum
        }, 0)
        return sum + sessionVolume
      }, 0)
  }, [state.sessions])

  // Cardio Tracking Analytics
  const cardioData = useMemo(() => {
    const cardioSessions: { date: string; minutes: number }[] = []
    
    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        const cardioSets = session.sets.filter(set => 
          set.exerciseKey.startsWith('cardio-incline-walk') || 
          set.exerciseKey === 'cardio-recovery' ||
          set.exerciseKey === 'conditioning'
        )
        
        if (cardioSets.length > 0) {
          // For incline walk, reps field contains total seconds
          const totalSeconds = cardioSets.reduce((sum, set) => {
            if (set.reps) {
              return sum + set.reps
            }
            return sum
          }, 0)
          
          const minutes = Math.round(totalSeconds / 60)
          if (minutes > 0) {
            cardioSessions.push({
              date: format(parseISO(session.date), 'MMM d'),
              minutes,
            })
          }
        }
      })
    
    return cardioSessions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [state.sessions])

  const weeklyCardio = useMemo(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, weekOpt)
    const weekEnd = endOfWeek(today, weekOpt)
    return state.sessions
      .filter(s => {
        if (!s.completed) return false
        const sessionDate = parseISO(s.date)
        return sessionDate >= weekStart && sessionDate <= weekEnd
      })
      .reduce((sum, session) => {
        const cardioSets = session.sets.filter(set => 
          set.exerciseKey.startsWith('cardio-incline-walk') || 
          set.exerciseKey === 'cardio-recovery' ||
          set.exerciseKey === 'conditioning'
        )
        
        const sessionSeconds = cardioSets.reduce((setSum, set) => {
          if (set.reps) {
            return setSum + set.reps
          }
          return setSum
        }, 0)
        
        return sum + Math.round(sessionSeconds / 60)
      }, 0)
  }, [state.sessions])

  // RPE Tracking Analytics
  const rpeChartData = useMemo(() => {
    return state.sessions
      .filter(s => s.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(session => {
        const rpeValues = session.sets
          .filter(set => set.rpe !== null && set.rpe > 0)
          .map(set => set.rpe ?? 0)
        
        if (rpeValues.length === 0) return null
        
        const avgRPE = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length
        
        return {
          date: format(parseISO(session.date), 'MMM d'),
          rpe: Math.round(avgRPE * 10) / 10, // Round to 1 decimal
        }
      })
      .filter(d => d !== null) as { date: string; rpe: number }[]
  }, [state.sessions])

  const rpeByExercise = useMemo(() => {
    const exerciseRPE: { [key: string]: number[] } = {}
    
    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        session.sets.forEach(set => {
          if (set.rpe !== null && set.rpe > 0 && !set.exerciseKey.startsWith('cardio')) {
            if (!exerciseRPE[set.exerciseName]) {
              exerciseRPE[set.exerciseName] = []
            }
            exerciseRPE[set.exerciseName].push(set.rpe)
          }
        })
      })
    
    return Object.entries(exerciseRPE)
      .map(([exercise, rpes]) => ({
        exercise,
        avgRPE: rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length,
        count: rpes.length,
      }))
      .filter(e => e.count >= 3) // Only show exercises with at least 3 RPE entries
      .sort((a, b) => b.avgRPE - a.avgRPE)
      .slice(0, 10) // Top 10
  }, [state.sessions])

  const rpeDistribution = useMemo(() => {
    const distribution: { [key: number]: number } = {}
    
    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        session.sets.forEach(set => {
          if (set.rpe !== null && set.rpe > 0) {
            const rpe = Math.round(set.rpe) // Round to nearest integer
            distribution[rpe] = (distribution[rpe] || 0) + 1
          }
        })
      })
    
    return Array.from({ length: 11 }, (_, i) => i)
      .map(rpe => ({
        rpe,
        count: distribution[rpe] || 0,
      }))
      .filter(d => d.count > 0)
  }, [state.sessions])

  // Workout Day Distribution
  const workoutDayDistribution = useMemo(() => {
    const dayCounts: { [key: number]: number } = {}
    
    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        dayCounts[session.dayIndex] = (dayCounts[session.dayIndex] || 0) + 1
      })
    
    return Array.from({ length: 7 }, (_, i) => i + 1)
      .map(dayIndex => ({
        day: `Day ${dayIndex}`,
        count: dayCounts[dayIndex] || 0,
      }))
  }, [state.sessions])

  // Personal Records
  const personalRecords = useMemo(() => {
    const prs: { [key: string]: { weight: number; date: string; reps: number } } = {}
    
    state.sessions
      .filter(s => s.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(session => {
        session.sets.forEach(set => {
          if (set.weight && set.reps && !set.exerciseKey.startsWith('cardio')) {
            const currentPR = prs[set.exerciseName]
            if (!currentPR || set.weight > currentPR.weight) {
              prs[set.exerciseName] = {
                weight: set.weight,
                date: session.date,
                reps: set.reps,
              }
            }
          }
        })
      })
    
    return Object.entries(prs)
      .map(([exercise, pr]) => ({
        exercise,
        weight: pr.weight,
        reps: pr.reps,
        date: format(parseISO(pr.date), 'MMM d, yyyy'),
      }))
      .sort((a, b) => b.weight - a.weight)
  }, [state.sessions])

  // Exercise Frequency Analysis
  const exerciseFrequency = useMemo(() => {
    const frequency: { [key: string]: number } = {}
    
    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        const uniqueExercises = new Set<string>()
        session.sets.forEach(set => {
          if (!set.exerciseKey.startsWith('cardio')) {
            uniqueExercises.add(set.exerciseName)
          }
        })
        uniqueExercises.forEach(exercise => {
          frequency[exercise] = (frequency[exercise] || 0) + 1
        })
      })
    
    return Object.entries(frequency)
      .map(([exercise, count]) => ({ exercise, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10
  }, [state.sessions])

  // Comparative Analytics - This Week vs Last Week (Monday–Sunday)
  const weeklyComparison = useMemo(() => {
    const today = new Date()
    const thisWeekStart = startOfWeek(today, weekOpt)
    const thisWeekEnd = endOfWeek(today, weekOpt)
    const lastWeekStart = subWeeks(thisWeekStart, 1)
    const lastWeekEnd = endOfWeek(lastWeekStart, weekOpt)

    const thisWeekSessions = state.sessions.filter(s => {
      if (!s.completed) return false
      const sessionDate = parseISO(s.date)
      return sessionDate >= thisWeekStart && sessionDate <= thisWeekEnd
    })

    const lastWeekSessions = state.sessions.filter(s => {
      if (!s.completed) return false
      const sessionDate = parseISO(s.date)
      return sessionDate >= lastWeekStart && sessionDate <= lastWeekEnd
    })

    const calculateVolume = (sessions: typeof thisWeekSessions) => {
      return sessions.reduce((sum, session) => {
        const sessionVolume = session.sets.reduce((setSum, set) => {
          if (set.weight && set.reps) {
            return setSum + (set.weight * set.reps)
          }
          return setSum
        }, 0)
        return sum + sessionVolume
      }, 0)
    }

    const calculateDuration = (sessions: typeof thisWeekSessions) => {
      const durations = sessions
        .filter(s => s.durationMin !== null && s.durationMin > 0)
        .map(s => s.durationMin ?? 0)
      if (durations.length === 0) return 0
      return Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    }

    const calculateCardio = (sessions: typeof thisWeekSessions) => {
      return sessions.reduce((sum, session) => {
        const cardioSets = session.sets.filter(set => 
          set.exerciseKey.startsWith('cardio-incline-walk') || 
          set.exerciseKey === 'cardio-recovery' ||
          set.exerciseKey === 'conditioning'
        )
        const sessionSeconds = cardioSets.reduce((setSum, set) => {
          if (set.reps) {
            return setSum + set.reps
          }
          return setSum
        }, 0)
        return sum + Math.round(sessionSeconds / 60)
      }, 0)
    }

    return {
      workouts: {
        thisWeek: thisWeekSessions.length,
        lastWeek: lastWeekSessions.length,
      },
      volume: {
        thisWeek: calculateVolume(thisWeekSessions),
        lastWeek: calculateVolume(lastWeekSessions),
      },
      duration: {
        thisWeek: calculateDuration(thisWeekSessions),
        lastWeek: calculateDuration(lastWeekSessions),
      },
      cardio: {
        thisWeek: calculateCardio(thisWeekSessions),
        lastWeek: calculateCardio(lastWeekSessions),
      },
    }
  }, [state.sessions])

  // Time-Based Patterns - Workouts by Day of Week
  const workoutsByDayOfWeek = useMemo(() => {
    const dayCounts: { [key: number]: number } = {}
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        const sessionDate = parseISO(session.date)
        const dayOfWeek = getDay(sessionDate) // 0 = Sunday, 6 = Saturday
        dayCounts[dayOfWeek] = (dayCounts[dayOfWeek] || 0) + 1
      })

    return Array.from({ length: 7 }, (_, i) => ({
      day: dayNames[i],
      count: dayCounts[i] || 0,
    }))
  }, [state.sessions])

  // Workout Frequency by Month
  const workoutsByMonth = useMemo(() => {
    const monthCounts: { [key: string]: number } = {}

    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        const sessionDate = parseISO(session.date)
        const monthKey = format(sessionDate, 'MMM yyyy')
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
      })

    return Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6) // Last 6 months
  }, [state.sessions])

  // Advanced Metrics - Set Completion Rate
  const setCompletionRate = useMemo(() => {
    let totalPlannedSets = 0
    let totalCompletedSets = 0

    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        // Group sets by exercise
        const exerciseGroups: { [key: string]: typeof session.sets } = {}
        session.sets.forEach(set => {
          if (!exerciseGroups[set.exerciseKey]) {
            exerciseGroups[set.exerciseKey] = []
          }
          exerciseGroups[set.exerciseKey].push(set)
        })

        // For each exercise, count planned vs completed
        Object.values(exerciseGroups).forEach(sets => {
          if (sets.length > 0 && !sets[0].exerciseKey.startsWith('cardio')) {
            // Estimate planned sets (use max set number as indicator)
            const maxSetNumber = Math.max(...sets.map(s => s.setNumber))
            totalPlannedSets += maxSetNumber

            // Count completed sets (has weight and reps)
            const completed = sets.filter(s => s.weight && s.reps).length
            totalCompletedSets += completed
          }
        })
      })

    if (totalPlannedSets === 0) return 0
    return Math.round((totalCompletedSets / totalPlannedSets) * 100)
  }, [state.sessions])

  // Volume per Exercise (Top 10)
  const volumePerExercise = useMemo(() => {
    const exerciseVolume: { [key: string]: number } = {}

    state.sessions
      .filter(s => s.completed)
      .forEach(session => {
        session.sets.forEach(set => {
          if (set.weight && set.reps && !set.exerciseKey.startsWith('cardio')) {
            const volume = set.weight * set.reps
            exerciseVolume[set.exerciseName] = (exerciseVolume[set.exerciseName] || 0) + volume
          }
        })
      })

    return Object.entries(exerciseVolume)
      .map(([exercise, volume]) => ({ exercise, volume }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
  }, [state.sessions])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg px-3 py-4 pb-24 overflow-x-hidden">
      <header className="mb-4">
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-xs text-muted-foreground">
          Track your fitness progress
        </p>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
          <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          {/* Summary Cards - 2 columns for mobile */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="border-none bg-secondary/50">
              <CardContent className="flex flex-col items-center p-2.5 text-center">
                <div className="mb-1 rounded-lg bg-chart-2/10 p-1.5">
                  <Footprints className="h-3.5 w-3.5 text-chart-2" />
                </div>
                <p className="text-base font-bold">
                  {(weeklyStepsTotal / 1000).toFixed(1)}k
                </p>
                <p className="text-[10px] text-muted-foreground">Steps this week</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-secondary/50">
              <CardContent className="flex flex-col items-center p-2.5 text-center">
                <div className="mb-1 rounded-lg bg-primary/10 p-1.5">
                  <Dumbbell className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-base font-bold">{totalWorkouts}</p>
                <p className="text-[10px] text-muted-foreground">Total workouts</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-secondary/50">
              <CardContent className="flex flex-col items-center p-2.5 text-center">
                <div className="mb-1 rounded-lg bg-chart-3/10 p-1.5">
                  <Clock className="h-3.5 w-3.5 text-chart-3" />
                </div>
                <p className="text-base font-bold">{avgDuration}</p>
                <p className="text-[10px] text-muted-foreground">Avg duration</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-secondary/50">
              <CardContent className="flex flex-col items-center p-2.5 text-center">
                <div className="mb-1 rounded-lg bg-chart-2/10 p-1.5">
                  <Activity className="h-3.5 w-3.5 text-chart-2" />
                </div>
                <p className="text-base font-bold">
                  {weeklyVolume > 1000 ? `${(weeklyVolume / 1000).toFixed(1)}k` : weeklyVolume}
                </p>
                <p className="text-[10px] text-muted-foreground">Volume this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Cards - Stack vertically on mobile */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-3">This Week vs Last Week</h3>
            <div className="space-y-3">
              {/* Workouts Comparison */}
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-xs text-muted-foreground mb-1.5">Workouts</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold">{weeklyComparison.workouts.thisWeek}</p>
                    <p className="text-[10px] text-muted-foreground">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{weeklyComparison.workouts.lastWeek}</p>
                    <p className="text-[10px] text-muted-foreground">Last week</p>
                  </div>
                </div>
                {weeklyComparison.workouts.lastWeek > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                    {weeklyComparison.workouts.thisWeek > weeklyComparison.workouts.lastWeek ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-primary" />
                        <span className="text-primary">
                          +{weeklyComparison.workouts.thisWeek - weeklyComparison.workouts.lastWeek}
                        </span>
                      </>
                    ) : weeklyComparison.workouts.thisWeek < weeklyComparison.workouts.lastWeek ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">
                          {weeklyComparison.workouts.thisWeek - weeklyComparison.workouts.lastWeek}
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">No change</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Volume Comparison */}
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-xs text-muted-foreground mb-1.5">Volume</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold">
                      {weeklyComparison.volume.thisWeek > 1000 
                        ? `${(weeklyComparison.volume.thisWeek / 1000).toFixed(1)}k`
                        : weeklyComparison.volume.thisWeek}
                    </p>
                    <p className="text-[10px] text-muted-foreground">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {weeklyComparison.volume.lastWeek > 1000 
                        ? `${(weeklyComparison.volume.lastWeek / 1000).toFixed(1)}k`
                        : weeklyComparison.volume.lastWeek}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Last week</p>
                  </div>
                </div>
                {weeklyComparison.volume.lastWeek > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                    {weeklyComparison.volume.thisWeek > weeklyComparison.volume.lastWeek ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-primary" />
                        <span className="text-primary">
                          +{((weeklyComparison.volume.thisWeek - weeklyComparison.volume.lastWeek) / weeklyComparison.volume.lastWeek * 100).toFixed(0)}%
                        </span>
                      </>
                    ) : weeklyComparison.volume.thisWeek < weeklyComparison.volume.lastWeek ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">
                          {((weeklyComparison.volume.thisWeek - weeklyComparison.volume.lastWeek) / weeklyComparison.volume.lastWeek * 100).toFixed(0)}%
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">No change</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Duration Comparison */}
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-xs text-muted-foreground mb-1.5">Avg Duration</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold">{weeklyComparison.duration.thisWeek}m</p>
                    <p className="text-[10px] text-muted-foreground">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{weeklyComparison.duration.lastWeek}m</p>
                    <p className="text-[10px] text-muted-foreground">Last week</p>
                  </div>
                </div>
                {weeklyComparison.duration.lastWeek > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                    {weeklyComparison.duration.thisWeek > weeklyComparison.duration.lastWeek ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-primary" />
                        <span className="text-primary">
                          +{weeklyComparison.duration.thisWeek - weeklyComparison.duration.lastWeek}m
                        </span>
                      </>
                    ) : weeklyComparison.duration.thisWeek < weeklyComparison.duration.lastWeek ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">
                          {weeklyComparison.duration.thisWeek - weeklyComparison.duration.lastWeek}m
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">No change</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cardio Comparison */}
              <div className="rounded-lg border bg-card p-2.5">
                <p className="text-xs text-muted-foreground mb-1.5">Cardio</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold">{weeklyComparison.cardio.thisWeek}m</p>
                    <p className="text-[10px] text-muted-foreground">This week</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{weeklyComparison.cardio.lastWeek}m</p>
                    <p className="text-[10px] text-muted-foreground">Last week</p>
                  </div>
                </div>
                {weeklyComparison.cardio.lastWeek > 0 && (
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                    {weeklyComparison.cardio.thisWeek > weeklyComparison.cardio.lastWeek ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-primary" />
                        <span className="text-primary">
                          +{weeklyComparison.cardio.thisWeek - weeklyComparison.cardio.lastWeek}m
                        </span>
                      </>
                    ) : weeklyComparison.cardio.thisWeek < weeklyComparison.cardio.lastWeek ? (
                      <>
                        <ArrowDown className="h-3 w-3 text-destructive" />
                        <span className="text-destructive">
                          {weeklyComparison.cardio.thisWeek - weeklyComparison.cardio.lastWeek}m
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">No change</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Steps Chart */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Steps</h3>
              <Select value={stepsRange} onValueChange={(v) => setStepsRange(v as '14' | '30')}>
                <SelectTrigger className="h-7 w-20 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ChartContainer
              config={chartConfig}
              className="h-[180px]"
            >
              <LineChart data={stepsChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="steps"
                  stroke={chartColors.chart2}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="goal"
                  stroke={chartColors.muted}
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>

          {/* Workouts per Week */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2">Workouts per Week</h3>
            <ChartContainer
              config={chartConfig}
              className="h-[180px]"
            >
              <BarChart data={workoutsPerWeekData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="workouts" 
                  fill={chartColors.chart1}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4 mt-0">
          {/* Exercise Progression */}
          <Card className="mb-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Exercise Progression</CardTitle>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="mt-2 h-8 text-xs">
                  <SelectValue placeholder="Select an exercise" />
                </SelectTrigger>
                <SelectContent>
                  {allExercises.map(exercise => (
                    <SelectItem key={exercise} value={exercise}>
                      {exercise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {exerciseProgressionData.length > 0 ? (
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <LineChart data={exerciseProgressionData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke={chartColors.chart1}
                      strokeWidth={2}
                      dot={{ fill: chartColors.chart1, r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[180px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {selectedExercise 
                      ? 'No data for this exercise yet'
                      : 'Select an exercise to view progression'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workout Duration Chart */}
          {durationChartData.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Workout Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <LineChart data={durationChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}m`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke={chartColors.chart3}
                      strokeWidth={2}
                      dot={{ fill: chartColors.chart3, r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Total Volume Chart */}
          {volumeChartData.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Volume per Workout</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <LineChart data={volumeChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v > 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="volume"
                      stroke={chartColors.chart2}
                      strokeWidth={2}
                      dot={{ fill: chartColors.chart2, r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Cardio Tracking Chart */}
          {cardioData.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cardio Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <BarChart data={cardioData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}m`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="minutes" 
                      fill={chartColors.chart5}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4 mt-0">
          {/* RPE Tracking Chart */}
          {rpeChartData.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average RPE per Workout</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <LineChart data={rpeChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 10]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="rpe"
                      stroke={chartColors.chart4}
                      strokeWidth={2}
                      dot={{ fill: chartColors.chart4, r: 3 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* RPE by Exercise */}
          {rpeByExercise.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average RPE by Exercise</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <BarChart data={rpeByExercise} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="exercise" 
                      tick={{ fontSize: 9 }} 
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 10]}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="avgRPE" 
                      fill={chartColors.chart4}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* RPE Distribution */}
          {rpeDistribution.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">RPE Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <BarChart data={rpeDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="rpe" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill={chartColors.chart4}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Workout Day Distribution */}
          {workoutDayDistribution.some(d => d.count > 0) && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Workout Day Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <BarChart data={workoutDayDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill={chartColors.chart1}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Exercise Frequency */}
          {exerciseFrequency.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top 10 Most Performed Exercises</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <BarChart data={exerciseFrequency} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="exercise" 
                      tick={{ fontSize: 9 }} 
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill={chartColors.chart2}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Personal Records */}
          {personalRecords.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5" />
                  Personal Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {personalRecords.slice(0, 10).map((pr, index) => (
                    <div
                      key={pr.exercise}
                      className="flex items-center justify-between rounded-lg border bg-card p-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{pr.exercise}</p>
                        <p className="text-[10px] text-muted-foreground">{pr.date}</p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="text-xs font-bold">
                          {pr.weight} {state.settings.units}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{pr.reps} reps</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Workouts by Day of Week */}
          {workoutsByDayOfWeek.some(d => d.count > 0) && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Workouts by Day of Week</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <BarChart data={workoutsByDayOfWeek} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill={chartColors.chart3}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Workouts by Month */}
          {workoutsByMonth.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Workouts by Month</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <BarChart data={workoutsByMonth} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 9 }} 
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill={chartColors.chart1}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Advanced Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="border-none bg-secondary/50">
              <CardContent className="flex flex-col items-center p-2.5 text-center">
                <div className="mb-1 rounded-lg bg-chart-2/10 p-1.5">
                  <Target className="h-3.5 w-3.5 text-chart-2" />
                </div>
                <p className="text-base font-bold">{setCompletionRate}%</p>
                <p className="text-[10px] text-muted-foreground">Set completion</p>
              </CardContent>
            </Card>
            <Card className="border-none bg-secondary/50">
              <CardContent className="flex flex-col items-center p-2.5 text-center">
                <div className="mb-1 rounded-lg bg-primary/10 p-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-base font-bold">{volumePerExercise.length}</p>
                <p className="text-[10px] text-muted-foreground">Top exercises</p>
              </CardContent>
            </Card>
          </div>

          {/* Volume per Exercise */}
          {volumePerExercise.length > 0 && (
            <Card className="mb-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Exercises by Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[180px]"
                >
                  <BarChart data={volumePerExercise} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="exercise" 
                      tick={{ fontSize: 9 }} 
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v > 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="volume" 
                      fill={chartColors.chart2}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
