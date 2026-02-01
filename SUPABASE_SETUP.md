# Supabase Setup Guide

This guide will help you set up Supabase for the workout tracker app.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step 1: Environment Variables

Make sure you have these environment variables set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings under "API".

## Step 2: Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click "Run" to execute the migration

This will create:
- `workout_sessions` table
- `workout_sets` table
- `steps_entries` table
- `app_settings` table
- All necessary indexes and triggers

## Step 3: Verify Setup

After running the migration, verify the tables were created:

1. Go to "Table Editor" in your Supabase dashboard
2. You should see 4 tables:
   - `workout_sessions`
   - `workout_sets`
   - `steps_entries`
   - `app_settings`

## Step 4: Test the Connection

Start your Next.js app:

```bash
npm run dev
```

The app will automatically:
- Load data from Supabase on startup
- Sync all changes to Supabase in real-time
- Fall back to localStorage if Supabase is unavailable

## How It Works

### Data Flow

1. **On App Load**: 
   - Tries to load from Supabase first
   - Falls back to localStorage if Supabase fails
   - Saves Supabase data to localStorage for offline access

2. **On Data Changes**:
   - Saves to localStorage immediately (for offline support)
   - Syncs to Supabase in the background (fire and forget)
   - If Supabase sync fails, data is still saved locally

3. **Offline Support**:
   - App works fully offline using localStorage
   - When back online, changes sync to Supabase automatically

### Row Level Security (RLS)

Currently, all tables have permissive policies that allow all operations. This is fine for a single-user app.

**For multi-user support later**, you'll need to:
1. Add user authentication
2. Update RLS policies to restrict access to user's own data
3. Add a `user_id` column to all tables

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists and has the correct variables
- Restart your dev server after adding environment variables

### "Failed to load from Supabase"
- Check your Supabase URL and anon key are correct
- Verify the database migration ran successfully
- Check the browser console for detailed error messages

### Data not syncing
- Check browser console for errors
- Verify your Supabase project is active
- Check network tab to see if requests are being made

## Next Steps

- [ ] Add user authentication (if you want multi-user support)
- [ ] Update RLS policies for user-specific data
- [ ] Add data migration script for existing localStorage data
- [ ] Add sync status indicator in the UI
