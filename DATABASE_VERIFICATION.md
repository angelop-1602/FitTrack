# Database Verification Checklist

Follow these steps to ensure data is properly saving to your Supabase database.

## ✅ Step 1: Run the Database Migration

**This is REQUIRED before data can be saved.**

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**
5. Open `supabase/migrations/001_initial_schema.sql` in your project
6. Copy the entire contents
7. Paste into the SQL Editor
8. Click **"Run"** (or press Ctrl+Enter)

**Expected result:** You should see "Success. No rows returned"

## ✅ Step 2: Verify Tables Were Created

1. In Supabase dashboard, click **"Table Editor"** in the left sidebar
2. You should see 4 tables:
   - ✅ `workout_sessions`
   - ✅ `workout_sets`
   - ✅ `steps_entries`
   - ✅ `app_settings`

If you don't see these tables, go back to Step 1 and run the migration again.

## ✅ Step 3: Verify Environment Variables

Check that your `.env.local` file exists and has the correct values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find these values:**
1. Go to Supabase dashboard → Your project
2. Click **"Settings"** (gear icon)
3. Click **"API"**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Important:** Restart your dev server after adding/updating environment variables:
```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

## ✅ Step 4: Test Data Saving

### Test 1: Save a Workout Session
1. Open your app in the browser
2. Go to the workout page
3. Complete a workout (or just save a draft)
4. Open browser DevTools (F12) → Console tab
5. Look for messages like:
   - ✅ "Synced saveSession operation" (success)
   - ❌ "Failed to sync session to Supabase" (error - check console for details)

### Test 2: Verify in Database
1. Go to Supabase dashboard → **Table Editor**
2. Click on `workout_sessions` table
3. You should see your workout session there
4. Click on `workout_sets` table
5. You should see the sets for that session

### Test 3: Save Steps
1. In your app, update your steps for today
2. Check Supabase → `steps_entries` table
3. You should see an entry with today's date

### Test 4: Update Settings
1. In your app, go to Settings
2. Change any setting (e.g., step goal)
3. Check Supabase → `app_settings` table
4. You should see the updated settings

## ✅ Step 5: Test Offline Sync

1. Open browser DevTools (F12) → Network tab
2. Check "Offline" checkbox (or use airplane mode)
3. Make some changes in the app (save workout, update steps)
4. Uncheck "Offline" (or turn off airplane mode)
5. Check Console - you should see:
   - "Connection restored, processing sync queue..."
   - "Synced saveSession operation" (or similar)
6. Verify in Supabase that the changes are there

## 🔍 Troubleshooting

### Data not appearing in database?

1. **Check browser console for errors:**
   - Open DevTools (F12) → Console
   - Look for red error messages
   - Common errors:
     - "Supabase client not initialized" → Check environment variables
     - "relation does not exist" → Migration not run
     - "permission denied" → RLS policies issue

2. **Check network requests:**
   - Open DevTools → Network tab
   - Filter by "supabase"
   - Look for failed requests (red)
   - Check the response for error details

3. **Verify Supabase project is active:**
   - Go to Supabase dashboard
   - Make sure project is not paused
   - Check project status

4. **Check sync queue:**
   - Open browser console
   - Type: `localStorage.getItem('supabase-sync-queue')`
   - If you see operations, they're queued and will sync when online
   - Check console for sync messages

### Common Issues

**Issue: "Missing Supabase environment variables"**
- ✅ Solution: Add `.env.local` file with correct variables
- ✅ Restart dev server

**Issue: "relation does not exist"**
- ✅ Solution: Run the migration (Step 1)

**Issue: "permission denied"**
- ✅ Solution: Check RLS policies in Supabase
- ✅ Go to Authentication → Policies
- ✅ Make sure policies allow INSERT/UPDATE/DELETE

**Issue: Data saves locally but not to database**
- ✅ Check if you're offline (data will queue)
- ✅ Check browser console for errors
- ✅ Verify environment variables are correct
- ✅ Check Supabase project is active

## 🎯 Quick Verification Script

Open browser console (F12) and run:

```javascript
// Check if Supabase is configured
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

// Check sync queue
const queue = localStorage.getItem('supabase-sync-queue')
console.log('Sync queue:', queue ? JSON.parse(queue).length + ' operations' : 'Empty ✅')

// Check if online
console.log('Online status:', navigator.onLine ? '✅ Online' : '❌ Offline')
```

## 📊 Monitoring Data

### View All Data in Supabase

1. **Workout Sessions:**
   - Table Editor → `workout_sessions`
   - Shows all saved workouts

2. **Workout Sets:**
   - Table Editor → `workout_sets`
   - Shows all exercise sets

3. **Steps:**
   - Table Editor → `steps_entries`
   - Shows all step entries

4. **Settings:**
   - Table Editor → `app_settings`
   - Shows app configuration

### Check Sync Status

The app automatically syncs:
- ✅ Immediately when online
- ✅ When connection is restored
- ✅ Every 30 seconds when online
- ✅ On app load

Check browser console for sync messages to verify it's working.
