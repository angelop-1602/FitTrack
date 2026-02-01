'use client'

import { APP_VERSION, BUILD_DATE } from '@/lib/version'
import { Badge } from '@/components/ui/badge'

export function VersionDisplay({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <Badge variant="outline" className="text-xs font-mono">
        v{APP_VERSION}
      </Badge>
    )
  }

  return (
    <div className="text-center text-xs text-muted-foreground space-y-1">
      <div className="font-mono">
        Version {APP_VERSION}
      </div>
      <div className="text-[10px]">
        Built on {BUILD_DATE}
      </div>
    </div>
  )
}
