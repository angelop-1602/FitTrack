'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw, X } from 'lucide-react'

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                setShowUpdate(true)
              }
            })
          }
        })
      })

      // Also listen for controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!showUpdate) {
          window.location.reload()
        }
      })
    }
  }, [showUpdate])

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to activate
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowUpdate(false)
  }

  const handleDismiss = () => {
    setShowUpdate(false)
    // Show again after 1 hour
    setTimeout(() => setShowUpdate(true), 60 * 60 * 1000)
  }

  if (!showUpdate) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 duration-500 max-w-md w-full px-4">
      <Card className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md border-green-500/30 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Update Available</h3>
              <p className="text-xs text-muted-foreground">
                A new version of FitTrack is ready to install
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                size="sm"
                onClick={handleUpdate}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-xs h-8"
              >
                Update Now
              </Button>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
