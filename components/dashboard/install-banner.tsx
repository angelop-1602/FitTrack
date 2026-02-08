'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import Link from 'next/link'

export function InstallBanner() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('install-banner-dismissed')
    if (dismissed) {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('install-banner-dismissed', 'true')
    setIsDismissed(true)
  }

  if (isInstalled || isDismissed) {
    return null
  }

  return (
    <Card className="mb-4 bg-primary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Install FitTrack</h3>
            <p className="text-xs text-muted-foreground">
              Get the app experience with offline support
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/install">
              <Button 
                size="sm"
                className="text-xs"
              >
                Learn More
              </Button>
            </Link>
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
  )
}
