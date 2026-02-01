import { WorkoutDay } from './types'

export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    dayIndex: 1,
    name: "Upper Push",
    description: "Incline Chest + Triceps + Delts",
    exercises: [
      { key: "incline-db-press", name: "Incline DB Press", sets: 3, reps: "6-10", notes: "Start 27.5 kg; progress to 30 when you hit 4x8 clean" },
      { key: "incline-machine-press", name: "Incline Machine Press", sets: 3, reps: "8-12", notes: "Or Smith incline" },
      { key: "cable-fly", name: "Cable Fly (mid or high-to-low)", sets: 3, reps: "12-15" },
      { key: "seated-db-shoulder-press", name: "Seated DB Shoulder Press", sets: 3, reps: "6-10" },
      { key: "db-lateral-raise", name: "DB Lateral Raise", sets: 3, reps: "12-20", notes: "Avoid cable laterals for now" },
      { key: "rope-triceps-pushdown", name: "Rope Triceps Pushdown", sets: 3, reps: "10-15" },
      { key: "overhead-triceps-extension", name: "Overhead Triceps Extension", sets: 3, reps: "10-15", notes: "Cable/rope" },
      { key: "cardio-incline-walk", name: "Optional: Incline Walk", sets: 1, reps: "20-30 min" },
    ]
  },
  {
    dayIndex: 2,
    name: "Lower A",
    description: "Quads/Squat Pattern + Core",
    exercises: [
      { key: "leg-press", name: "Leg Press", sets: 3, reps: "8-15" },
      { key: "squat-variation", name: "Squat Variation", sets: 3, reps: "6-10", notes: "Goblet / Smith / Barbell" },
      { key: "leg-curl", name: "Leg Curl", sets: 3, reps: "10-15" },
      { key: "leg-extension", name: "Leg Extension", sets: 3, reps: "12-15" },
      { key: "calf-raise-standing", name: "Calf Raise (Standing/Seated)", sets: 3, reps: "10-15" },
      { key: "cable-crunch", name: "Cable Crunch", sets: 3, reps: "10-15" },
      { key: "cardio-incline-walk-2", name: "Optional: Incline Walk", sets: 1, reps: "20-30 min" },
    ]
  },
  {
    dayIndex: 3,
    name: "Pull",
    description: "Back + Biceps",
    exercises: [
      { key: "lat-pulldown", name: "Lat Pulldown", sets: 3, reps: "6-12" },
      { key: "chest-supported-row", name: "Chest-Supported Row", sets: 3, reps: "8-12" },
      { key: "seated-cable-row", name: "Seated Cable Row", sets: 3, reps: "10-12" },
      { key: "face-pull", name: "Face Pull", sets: 3, reps: "12-20" },
      { key: "ez-bar-curl", name: "EZ-Bar Curl", sets: 3, reps: "6-10" },
      { key: "incline-db-curl", name: "Incline DB Curl", sets: 3, reps: "10-15" },
      { key: "hammer-curl", name: "Hammer Curl", sets: 2, reps: "12-15", notes: "If time" },
      { key: "cardio-incline-walk-3", name: "Optional: Incline Walk", sets: 1, reps: "20-30 min" },
    ]
  },
  {
    dayIndex: 4,
    name: "Active Recovery",
    description: "Shoulder Health (Easy Day)",
    exercises: [
      { key: "cardio-recovery", name: "Cardio: Incline Walk / Bike", sets: 1, reps: "25-35 min", notes: "Easy-moderate" },
      { key: "band-external-rotation", name: "Band/Cable External Rotation", sets: 2, reps: "12-15/side" },
      { key: "rear-delt-fly-machine", name: "Rear Delt Fly Machine", sets: 2, reps: "15-20" },
      { key: "straight-arm-pulldown", name: "Straight-arm Pulldown (light)", sets: 2, reps: "12-15" },
      { key: "serratus-wall-slides", name: "Serratus Wall Slides", sets: 2, reps: "8-12" },
      { key: "cardio-incline-walk-4", name: "Optional: Incline Walk", sets: 1, reps: "20-30 min" },
    ]
  },
  {
    dayIndex: 5,
    name: "Arms + Delts",
    description: "Specialization Day",
    exercises: [
      { key: "cable-curl", name: "Cable Curl", sets: 3, reps: "10-15" },
      { key: "preacher-curl", name: "Preacher Curl (Machine/EZ)", sets: 3, reps: "8-12" },
      { key: "hammer-curl-5", name: "Hammer Curl", sets: 2, reps: "12-15" },
      { key: "rope-pushdown", name: "Rope Pushdown", sets: 3, reps: "10-15" },
      { key: "single-arm-cable-pushdown", name: "Single-arm Cable Pushdown", sets: 2, reps: "12-15/side" },
      { key: "overhead-cable-extension", name: "Overhead Cable Extension", sets: 3, reps: "10-15" },
      { key: "db-lateral-raise-5", name: "DB Lateral Raise", sets: 3, reps: "12-20" },
      { key: "rear-delt-fly-5", name: "Rear Delt Fly", sets: 3, reps: "15-20" },
      { key: "cardio-incline-walk-5", name: "Optional: Incline Walk", sets: 1, reps: "20-30 min" },
    ]
  },
  {
    dayIndex: 6,
    name: "Lower B",
    description: "Hinge/Glutes + Conditioning",
    exercises: [
      { key: "romanian-deadlift", name: "Romanian Deadlift", sets: 3, reps: "6-10" },
      { key: "hip-thrust", name: "Hip Thrust", sets: 3, reps: "8-12" },
      { key: "bulgarian-split-squat", name: "Bulgarian Split Squat", sets: 3, reps: "8-12/side" },
      { key: "leg-curl-6", name: "Leg Curl", sets: 3, reps: "10-15" },
      { key: "calf-raise-6", name: "Calf Raise", sets: 3, reps: "10-15" },
      { key: "conditioning", name: "Conditioning: Incline Walk/Bike", sets: 1, reps: "15-25 min" },
      { key: "cardio-incline-walk-6", name: "Optional: Incline Walk", sets: 1, reps: "20-30 min" },
    ]
  },
  {
    dayIndex: 7,
    name: "Upper Mix",
    description: "Chest/Back + Light Arms",
    exercises: [
      { key: "incline-db-press-7", name: "Incline DB Press", sets: 3, reps: "8-12" },
      { key: "cable-fly-7", name: "Cable Fly", sets: 2, reps: "12-15" },
      { key: "lat-pulldown-7", name: "Lat Pulldown", sets: 3, reps: "8-12" },
      { key: "row-machine", name: "Row Machine", sets: 3, reps: "10-12" },
      { key: "triceps-pushdown-7", name: "Triceps Pushdown", sets: 2, reps: "12-15" },
      { key: "db-curl-7", name: "DB Curl", sets: 2, reps: "12-15" },
      { key: "cardio-incline-walk-7", name: "Optional: Incline Walk", sets: 1, reps: "20-30 min" },
    ]
  },
]

export function getWorkoutDay(dayIndex: number): WorkoutDay | undefined {
  return WORKOUT_PLAN.find(d => d.dayIndex === dayIndex)
}

export function getNextDayIndex(currentDayIndex: number, includeDay4: boolean = true): number {
  let nextDay = currentDayIndex >= 7 ? 1 : currentDayIndex + 1
  // Skip Day 4 if not included
  if (!includeDay4 && nextDay === 4) {
    nextDay = 5
  }
  return nextDay
}

/**
 * Get the day of week (0-6, where 0 = Sunday, 1 = Monday, etc.) for a workout day
 * Day 1 always falls on Monday (1)
 */
export function getDayOfWeekForWorkoutDay(dayIndex: number): number {
  // Day 1 = Monday (1), Day 2 = Tuesday (2), etc.
  // JavaScript Date.getDay() returns 0-6 (0 = Sunday, 1 = Monday, etc.)
  // So we need to map: Day 1 -> Monday (1), Day 2 -> Tuesday (2), etc.
  return dayIndex === 7 ? 0 : dayIndex // Day 7 = Sunday (0), others map directly
}

/**
 * Get the day name for a workout day
 */
export function getDayNameForWorkoutDay(dayIndex: number): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayOfWeek = getDayOfWeekForWorkoutDay(dayIndex)
  return dayNames[dayOfWeek]
}

/**
 * Get the workout day index for a specific date
 * This calculates which workout day should be done on a given date
 * based on the cycle start date (when Day 1 was first done)
 */
export function getWorkoutDayForDate(date: Date, cycleStartDate: Date): number {
  // Calculate days since cycle start
  const startDate = new Date(cycleStartDate)
  startDate.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)
  
  const diffTime = targetDate.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Calculate which day of the cycle we're on (1-7)
  // Day 1 was done on cycleStartDate
  const cycleDay = ((diffDays % 7) + 7) % 7 // Handle negative days
  const workoutDay = cycleDay + 1 // Convert 0-6 to 1-7
  
  return workoutDay
}

/**
 * Get the workout day index for today based on cycle start
 */
export function getWorkoutDayForToday(cycleStartDate: Date): number {
  return getWorkoutDayForDate(new Date(), cycleStartDate)
}
