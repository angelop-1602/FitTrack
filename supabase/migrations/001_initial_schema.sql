-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workout Sessions Table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  day_index INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  duration_min INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout Sets Table
CREATE TABLE IF NOT EXISTS workout_sets (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
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

-- Steps Entries Table
CREATE TABLE IF NOT EXISTS steps_entries (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  step_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table (single row)
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  units TEXT NOT NULL DEFAULT 'kg' CHECK (units IN ('kg', 'lb')),
  step_goal INTEGER NOT NULL DEFAULT 10000,
  cycle_start_day INTEGER NOT NULL DEFAULT 1 CHECK (cycle_start_day BETWEEN 1 AND 7),
  manual_next_day INTEGER CHECK (manual_next_day BETWEEN 1 AND 7),
  include_day4_recovery BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 'default')
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_completed ON workout_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session_id ON workout_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_steps_entries_date ON steps_entries(date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_workout_sessions_updated_at 
  BEFORE UPDATE ON workout_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sets_updated_at 
  BEFORE UPDATE ON workout_sets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steps_entries_updated_at 
  BEFORE UPDATE ON steps_entries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON app_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Allow all operations for now
-- You can add user authentication later and restrict access
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (public access)
-- TODO: Add user authentication and restrict to user's data
CREATE POLICY "Allow all operations on workout_sessions" ON workout_sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on workout_sets" ON workout_sets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on steps_entries" ON steps_entries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on app_settings" ON app_settings
  FOR ALL USING (true) WITH CHECK (true);
