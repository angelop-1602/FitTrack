-- Workout Drafts Table (for incomplete workouts)
CREATE TABLE IF NOT EXISTS workout_drafts (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  day_index INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  duration_min INTEGER,
  start_time TEXT, -- ISO date string
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout Draft Sets Table
CREATE TABLE IF NOT EXISTS workout_draft_sets (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES workout_drafts(id) ON DELETE CASCADE,
  exercise_key TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  rpe NUMERIC,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_drafts_date ON workout_drafts(date);
CREATE INDEX IF NOT EXISTS idx_workout_draft_sets_draft_id ON workout_draft_sets(draft_id);

-- Function to update updated_at timestamp (already exists, but ensure it's available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_workout_drafts_updated_at 
  BEFORE UPDATE ON workout_drafts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_draft_sets_updated_at 
  BEFORE UPDATE ON workout_draft_sets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE workout_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_draft_sets ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (public access)
-- TODO: Add user authentication and restrict to user's data
CREATE POLICY "Allow all operations on workout_drafts" ON workout_drafts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on workout_draft_sets" ON workout_draft_sets
  FOR ALL USING (true) WITH CHECK (true);
