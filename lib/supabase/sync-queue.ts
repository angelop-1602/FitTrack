/**
 * Offline sync queue for Supabase
 * Queues operations when offline and syncs when online
 */

import * as supabaseService from './service'
import { WorkoutSession, StepsEntry, AppSettings } from '../types'

export type SyncOperation = 
  | { type: 'saveSession'; data: WorkoutSession }
  | { type: 'deleteSession'; sessionId: string }
  | { type: 'saveSteps'; date: string; stepCount: number }
  | { type: 'updateSettings'; settings: AppSettings }

const SYNC_QUEUE_KEY = 'supabase-sync-queue'
const SYNC_IN_PROGRESS_KEY = 'supabase-sync-in-progress'

// Get the sync queue from localStorage
function getSyncQueue(): SyncOperation[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error('Failed to load sync queue:', e)
    return []
  }
}

// Save the sync queue to localStorage
function saveSyncQueue(queue: SyncOperation[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  } catch (e) {
    console.error('Failed to save sync queue:', e)
  }
}

// Check if sync is in progress
function isSyncInProgress(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    return localStorage.getItem(SYNC_IN_PROGRESS_KEY) === 'true'
  } catch {
    return false
  }
}

// Set sync in progress flag
function setSyncInProgress(inProgress: boolean): void {
  if (typeof window === 'undefined') return
  
  try {
    if (inProgress) {
      localStorage.setItem(SYNC_IN_PROGRESS_KEY, 'true')
    } else {
      localStorage.removeItem(SYNC_IN_PROGRESS_KEY)
    }
  } catch (e) {
    console.error('Failed to set sync status:', e)
  }
}

// Check if online
export function isOnline(): boolean {
  if (typeof window === 'undefined') return false
  return navigator.onLine
}

// Add operation to sync queue
export function queueOperation(operation: SyncOperation): void {
  const queue = getSyncQueue()
  queue.push(operation)
  saveSyncQueue(queue)
  
  // Try to sync immediately if online
  if (isOnline()) {
    processSyncQueue().catch(err => {
      console.error('Failed to process sync queue:', err)
    })
  }
}

// Process a single operation
async function processOperation(operation: SyncOperation): Promise<void> {
  switch (operation.type) {
    case 'saveSession':
      await supabaseService.saveSessionToSupabase(operation.data)
      break
    case 'deleteSession':
      await supabaseService.deleteSessionFromSupabase(operation.sessionId)
      break
    case 'saveSteps':
      await supabaseService.saveStepsToSupabase(operation.date, operation.stepCount)
      break
    case 'updateSettings':
      await supabaseService.saveSettingsToSupabase(operation.settings)
      break
  }
}

// Process the entire sync queue
export async function processSyncQueue(): Promise<void> {
  // Don't process if already in progress
  if (isSyncInProgress()) {
    return
  }

  // Don't process if offline
  if (!isOnline()) {
    return
  }

  const queue = getSyncQueue()
  if (queue.length === 0) {
    return
  }

  setSyncInProgress(true)

  try {
    const failedOperations: SyncOperation[] = []

    // Process each operation
    for (const operation of queue) {
      try {
        await processOperation(operation)
        console.log(`Synced ${operation.type} operation`)
      } catch (error) {
        console.error(`Failed to sync ${operation.type}:`, error)
        // Keep failed operations to retry later
        failedOperations.push(operation)
      }
    }

    // Update queue with only failed operations
    saveSyncQueue(failedOperations)

    if (failedOperations.length === 0) {
      console.log('All queued operations synced successfully')
    } else {
      console.warn(`${failedOperations.length} operations failed to sync`)
    }
  } catch (error) {
    console.error('Error processing sync queue:', error)
  } finally {
    setSyncInProgress(false)
  }
}

// Clear the sync queue (use with caution)
export function clearSyncQueue(): void {
  saveSyncQueue([])
}

// Get queue length
export function getQueueLength(): number {
  return getSyncQueue().length
}

// Initialize sync queue processing
export function initSyncQueue(): void {
  if (typeof window === 'undefined') return

  // Process queue on load if online
  if (isOnline()) {
    processSyncQueue().catch(err => {
      console.error('Failed to process sync queue on init:', err)
    })
  }

  // Listen for online event
  window.addEventListener('online', () => {
    console.log('Connection restored, processing sync queue...')
    processSyncQueue().catch(err => {
      console.error('Failed to process sync queue after coming online:', err)
    })
  })

  // Process queue periodically when online (every 30 seconds)
  setInterval(() => {
    if (isOnline()) {
      processSyncQueue().catch(err => {
        console.error('Failed to process sync queue (periodic):', err)
      })
    }
  }, 30000)
}
