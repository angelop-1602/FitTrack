'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store-context'
import { getTodayDate } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Footprints, Check } from 'lucide-react'

export function StepsTodayCard() {
  const { state, getStepsForDate, saveSteps } = useStore()
  const today = getTodayDate()
  const todaySteps = getStepsForDate(today)
  
  const [inputValue, setInputValue] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (todaySteps) {
      setInputValue(todaySteps.stepCount.toString())
    }
  }, [todaySteps])

  const handleSave = () => {
    const stepCount = parseInt(inputValue, 10)
    if (!isNaN(stepCount) && stepCount >= 0) {
      saveSteps(today, stepCount)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const stepGoal = state.settings.stepGoal
  const currentSteps = todaySteps?.stepCount ?? 0
  const progress = Math.min((currentSteps / stepGoal) * 100, 100)

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 w-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 flex-shrink-0">
            <Footprints className="h-5 w-5 text-chart-2" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <CardTitle className="text-base truncate">Steps Today</CardTitle>
            <p className="text-xs text-muted-foreground truncate">
              Goal: {stepGoal.toLocaleString()} steps
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {currentSteps.toLocaleString()} steps
            </span>
            <span className="text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Enter steps"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
            min={0}
          />
          <Button 
            onClick={handleSave}
            variant={saved ? "secondary" : "default"}
            className="min-w-[80px]"
          >
            {saved ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
