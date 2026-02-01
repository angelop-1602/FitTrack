# Analytics Enhancement Plan

## Current Analytics Features

### ✅ What's Already Implemented:
1. **Steps Tracking**
   - 14/30 day chart with goal line
   - Weekly steps total summary

2. **Workout Frequency**
   - Workouts per week (bar chart, last 8 weeks)
   - Total workouts count

3. **Exercise Progression**
   - Weight progression over time (best set)
   - Volume progression over time
   - Selectable exercise dropdown

4. **Summary Stats**
   - Weekly steps total
   - Total workouts
   - Most trained exercise

---

## Proposed Analytics Additions

### 🎯 Priority 1: High Value, Easy Implementation

#### 1. **Workout Duration Analytics**
- **Average workout duration** (trend over time)
- **Duration per workout day** (which days take longer)
- **Duration chart** (line chart showing duration trends)
- **Quick stat**: Average duration this week vs last week

#### 2. **Total Volume Analytics**
- **Total volume per workout** (sum of all weight × reps)
- **Volume trend chart** (over time, weekly/monthly)
- **Volume by workout day** (which days have highest volume)
- **Quick stat**: Total volume this week

#### 3. **RPE (Rate of Perceived Exertion) Tracking**
- **Average RPE per workout** (trend over time)
- **RPE by exercise** (which exercises feel hardest)
- **RPE distribution** (histogram showing RPE frequency)
- **RPE vs Volume correlation** (scatter plot)

#### 4. **Cardio Tracking (Incline Walk)**
- **Total cardio time per week** (sum of all incline walk sessions)
- **Cardio frequency** (how many days per week you do cardio)
- **Cardio duration trend** (average time per session over time)
- **Quick stat**: Cardio time this week

---

### 🎯 Priority 2: Medium Value, Moderate Implementation

#### 5. **Workout Day Distribution**
- **Workout day frequency** (bar chart: how often each day is completed)
- **Day completion rate** (percentage of times each day was done)
- **Day preference over time** (which days you do most)

#### 6. **Exercise Frequency Analysis**
- **Top 10 most performed exercises** (bar chart)
- **Exercise frequency over time** (heatmap or line chart)
- **Exercise variety score** (how many unique exercises per week)

#### 7. **Personal Records (PRs)**
- **PR tracker** (best weight for each exercise)
- **PR timeline** (when you hit each PR)
- **PR notifications** (highlight when new PR is set)
- **PR by exercise** (table/list view)

#### 8. **Progress Indicators**
- **Improvement markers** (exercises where weight/volume increased)
- **Plateau detection** (exercises with no progress in X weeks)
- **Consistency score** (workout frequency consistency)

---

### 🎯 Priority 3: Advanced Features

#### 9. **Body Part/Muscle Group Analysis**
- **Volume by muscle group** (chest, back, legs, arms, etc.)
- **Muscle group frequency** (which groups you train most)
- **Muscle group balance** (pie chart showing distribution)

#### 10. **Time-Based Patterns**
- **Workouts by day of week** (which days you work out most)
- **Workout frequency by month** (seasonal patterns)
- **Rest day analysis** (average days between workouts)

#### 11. **Comparative Analytics**
- **This week vs last week** (comparison cards)
- **This month vs last month** (comparison cards)
- **Best week/month** (highlight top performing periods)

#### 12. **Advanced Exercise Metrics**
- **Volume per exercise** (total volume for each exercise over time)
- **Average reps per exercise** (trend analysis)
- **Set completion rate** (percentage of planned sets completed)
- **Exercise efficiency** (volume per minute of workout)

---

## Implementation Suggestions

### Phase 0: Refactor Existing Charts (1 day)
**Before adding new features, refactor current charts to use shadcn properly:**
- Replace hardcoded `CHART_COLORS` with shadcn chart config using CSS variables
- Use `hsl(var(--chart-1))`, `hsl(var(--chart-2))`, etc. for colors
- Ensure all charts use `ChartContainer` with proper config
- Remove `ResponsiveContainer` wrapper (ChartContainer already includes it)
- Standardize chart styling and margins

**Example refactor:**

```typescript
// OLD (hardcoded colors):
const CHART_COLORS = {
  primary: '#22c55e',
  secondary: '#3b82f6',
  muted: '#6b7280',
}

<ChartContainer
  config={{
    steps: { label: 'Steps', color: CHART_COLORS.secondary },
    goal: { label: 'Goal', color: CHART_COLORS.muted },
  }}
>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart>
      <Line stroke={CHART_COLORS.secondary} />
    </LineChart>
  </ResponsiveContainer>
</ChartContainer>

// NEW (shadcn chart config with CSS variables):
const chartConfig = {
  steps: { label: 'Steps', color: 'hsl(var(--chart-2))' },
  goal: { label: 'Goal', color: 'hsl(var(--muted))' },
  workouts: { label: 'Workouts', color: 'hsl(var(--chart-1))' },
  weight: { label: 'Weight', color: 'hsl(var(--chart-1))' },
  volume: { label: 'Volume', color: 'hsl(var(--chart-2))' },
  duration: { label: 'Duration', color: 'hsl(var(--chart-3))' },
  rpe: { label: 'RPE', color: 'hsl(var(--chart-4))' },
  cardio: { label: 'Cardio', color: 'hsl(var(--chart-5))' },
}

<ChartContainer config={chartConfig}>
  <LineChart>
    <Line dataKey="steps" stroke="hsl(var(--chart-2))" />
    <Line dataKey="goal" stroke="hsl(var(--muted))" />
  </LineChart>
</ChartContainer>
```

**Key changes:**
- ✅ Remove `CHART_COLORS` constant
- ✅ Use `hsl(var(--chart-N))` for all colors
- ✅ Remove `ResponsiveContainer` (ChartContainer includes it)
- ✅ Colors automatically work in light/dark mode
- ✅ Consistent color scheme across all charts

### Phase 1: Quick Wins (1-2 days)
- Workout Duration Analytics
- Total Volume Analytics
- Cardio Tracking

### Phase 2: Core Features (3-5 days)
- RPE Tracking
- Workout Day Distribution
- Personal Records
- Exercise Frequency Analysis

### Phase 3: Advanced Features (1-2 weeks)
- Body Part Analysis
- Comparative Analytics
- Progress Indicators
- Time-Based Patterns

---

## UI/UX Considerations

### New Chart Types Needed (all using shadcn ChartContainer):
- **Area Chart** (`AreaChart` from Recharts): For volume trends (shows cumulative effect)
- **Scatter Plot** (`ScatterChart` from Recharts): For RPE vs Volume correlation
- **Pie Chart** (`PieChart` from Recharts): For muscle group distribution
- **Heatmap**: For exercise frequency over time (may need custom implementation or use BarChart)
- **Comparison Cards**: Side-by-side this week vs last week (using Card components)

**All charts must:**
- Use `ChartContainer` wrapper with proper config
- Use `ChartTooltip` and `ChartTooltipContent` for tooltips
- Use shadcn color system (CSS variables) via chart config
- Follow shadcn styling patterns

### New Summary Cards:
- Average workout duration
- Total volume this week
- Cardio time this week
- Current streak
- PRs this month
- Consistency score

### Filtering Options:
- Date range selector (7 days, 30 days, 90 days, all time)
- Exercise filter (for detailed views)
- Workout day filter
- Muscle group filter

---

## Data Requirements

### Already Available:
- ✅ Workout sessions with duration
- ✅ Sets with weight, reps, RPE
- ✅ Exercise names and keys
- ✅ Workout day indices
- ✅ Steps data

### May Need Enhancement:
- Muscle group mapping (could be derived from exercise names or added to workout plan)
- Exercise categories (could be added to Exercise type)

---

## Technical Considerations

### Chart Implementation Standards:
- **Always use `ChartContainer`** from `@/components/ui/chart`
- **Use chart config** for colors and labels with CSS variables:
  ```typescript
  // Available chart colors (already defined in globals.css):
  // --chart-1: emerald (primary)
  // --chart-2: blue (secondary)
  // --chart-3: purple
  // --chart-4: yellow/green
  // --chart-5: orange/red
  
  const chartConfig = {
    steps: { 
      label: "Steps", 
      color: "hsl(var(--chart-2))"  // Use CSS variable, not hardcoded
    },
    goal: { 
      label: "Goal", 
      color: "hsl(var(--muted))"  // Use muted for reference lines
    },
    workouts: { 
      label: "Workouts", 
      color: "hsl(var(--chart-1))" 
    },
    volume: { 
      label: "Volume", 
      color: "hsl(var(--chart-2))" 
    },
    duration: { 
      label: "Duration", 
      color: "hsl(var(--chart-3))" 
    },
  }
  ```
- **Use `ChartTooltip` and `ChartTooltipContent`** for all tooltips
- **Use `ChartLegend` and `ChartLegendContent`** when legends are needed
- **Remove hardcoded colors** - Replace `CHART_COLORS` object with chart config
- **Remove `ResponsiveContainer`** - `ChartContainer` already includes it
- **Consistent styling** - all charts should have same height, margins, etc.
- **Theme-aware** - Colors automatically adapt to light/dark mode via CSS variables

### Performance:
- Memoize expensive calculations
- Consider pagination for large datasets
- Cache computed analytics

### Data Structure:
- May need to add muscle group to Exercise type
- Consider adding exercise categories
- May need helper functions for muscle group detection

### Chart Library:
- **Using shadcn Chart Components** (wraps Recharts with better theming)
  - `ChartContainer` - Wraps all charts with consistent styling
  - `ChartTooltip` & `ChartTooltipContent` - Consistent tooltip styling
  - `ChartLegend` & `ChartLegendContent` - For chart legends
  - Chart config system for colors (use CSS variables, not hardcoded colors)
- Recharts components used inside ChartContainer:
  - `LineChart`, `BarChart`, `AreaChart`, `ScatterChart`, `PieChart`
  - All wrapped in `ChartContainer` with proper config
- **Color System**: Use shadcn chart config with CSS variables:
  ```typescript
  const chartConfig = {
    duration: { label: "Duration", color: "hsl(var(--chart-1))" },
    volume: { label: "Volume", color: "hsl(var(--chart-2))" },
    // etc.
  }
  ```

---

## Questions to Consider

1. **Muscle Group Mapping**: Should we manually map exercises to muscle groups, or try to auto-detect from names?
2. **PR Definition**: Should PR be best single set, best average, or best total volume?
3. **Comparison Periods**: Should comparisons be rolling (last 7 days) or calendar-based (this week vs last week)?
4. **Cardio Integration**: Should cardio be integrated into volume calculations or kept separate?
5. **RPE Weighting**: Should RPE be used to weight volume calculations (higher RPE = more effective volume)?

---

## Recommended Starting Point

**Start with Phase 0** - Refactor existing charts to use shadcn properly, then **Phase 1** for new features:

### Phase 0: Refactor (Recommended First)
1. **Update color system** - Replace hardcoded colors with shadcn CSS variables
2. **Standardize chart configs** - Create consistent chart config objects
3. **Remove ResponsiveContainer** - ChartContainer already handles this
4. **Test theme switching** - Ensure charts work in light/dark mode

### Phase 1: New Features
1. **Workout Duration Analytics** - Simple line chart, already have duration data
2. **Total Volume Analytics** - Sum calculation, easy to implement
3. **Cardio Tracking** - Track incline walk sessions, simple aggregation

These will give users:
- Better understanding of workout intensity (duration + volume)
- Cardio consistency tracking
- Quick wins that feel valuable immediately
- Consistent, theme-aware chart styling
