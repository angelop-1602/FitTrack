'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Settings2, Target, Dumbbell, RotateCcw, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { VersionDisplay } from '@/components/version-display'

export default function SettingsPage() {
  const { state, isLoading, updateSettings, exportData } = useStore()
  const { toast } = useToast()
  const [stepGoalInput, setStepGoalInput] = useState(state.settings.stepGoal.toString())

  const handleUnitsChange = (value: string) => {
    updateSettings({ units: value as 'kg' | 'lb' })
    toast({
      title: 'Units updated',
      description: `Weight units set to ${value.toUpperCase()}`,
    })
  }

  const handleStepGoalSave = () => {
    const goal = parseInt(stepGoalInput, 10)
    if (!isNaN(goal) && goal > 0) {
      updateSettings({ stepGoal: goal })
      toast({
        title: 'Step goal updated',
        description: `Daily step goal set to ${goal.toLocaleString()}`,
      })
    }
  }

  const handleCycleStartChange = (value: string) => {
    updateSettings({ cycleStartDay: parseInt(value, 10) })
    toast({
      title: 'Cycle start updated',
      description: `Workout cycle will start from Day ${value}`,
    })
  }

  const handleManualNextDayChange = (value: string) => {
    const day = value === 'auto' ? null : parseInt(value, 10)
    updateSettings({ manualNextDay: day })
    toast({
      title: 'Next workout updated',
      description: day ? `Next workout manually set to Day ${day}` : 'Next workout set to auto',
    })
  }

  const handleDay4Toggle = (checked: boolean) => {
    updateSettings({ includeDay4Recovery: checked })
    toast({
      title: 'Recovery day updated',
      description: checked 
        ? 'Day 4 Active Recovery included in rotation' 
        : 'Day 4 Active Recovery excluded from rotation',
    })
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fittrack-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: 'Data exported',
      description: 'Your workout data has been downloaded as JSON',
    })
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
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customize your workout tracker
        </p>
      </header>

      {/* Units */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Units</CardTitle>
              <CardDescription className="text-xs">
                Choose your preferred weight unit
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={state.settings.units} onValueChange={handleUnitsChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilograms (kg)</SelectItem>
              <SelectItem value="lb">Pounds (lb)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step Goal */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
              <Target className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <CardTitle className="text-base">Daily Step Goal</CardTitle>
              <CardDescription className="text-xs">
                Set your target steps per day
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="number"
              value={stepGoalInput}
              onChange={(e) => setStepGoalInput(e.target.value)}
              min={1000}
              max={50000}
              step={500}
              className="flex-1"
            />
            <Button onClick={handleStepGoalSave}>Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* Workout Rotation */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
              <Dumbbell className="h-5 w-5 text-chart-1" />
            </div>
            <div>
              <CardTitle className="text-base">Workout Rotation</CardTitle>
              <CardDescription className="text-xs">
                Configure your 7-day workout cycle
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cycle Start Day */}
          <div className="space-y-2">
            <Label className="text-sm">Cycle Start Day</Label>
            <Select 
              value={state.settings.cycleStartDay.toString()} 
              onValueChange={handleCycleStartChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    Day {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When no history exists, start from this day
            </p>
          </div>

          <Separator />

          {/* Manual Override */}
          <div className="space-y-2">
            <Label className="text-sm">Manual Override: Next Workout</Label>
            <Select 
              value={state.settings.manualNextDay?.toString() ?? 'auto'} 
              onValueChange={handleManualNextDayChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (based on history)</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <SelectItem key={day} value={day.toString()}>
                    Day {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Override the next workout day. Resets after completing a workout.
            </p>
          </div>

          <Separator />

          {/* Day 4 Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm">Include Day 4 Recovery</Label>
              <p className="text-xs text-muted-foreground">
                Include Active Recovery day in rotation
              </p>
            </div>
            <Switch
              checked={state.settings.includeDay4Recovery}
              onCheckedChange={handleDay4Toggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Download className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Data Controls</CardTitle>
              <CardDescription className="text-xs">
                Export your workout data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full gap-2 bg-transparent"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export Data as JSON
          </Button>
        </CardContent>
      </Card>

      {/* App Version */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Info className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">App Information</CardTitle>
              <CardDescription className="text-xs">
                Current version and build details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4">
            <VersionDisplay />
          </div>
        </CardContent>
      </Card>

      <Toaster />
    </div>
  )
}
