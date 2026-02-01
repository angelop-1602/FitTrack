'use client'

import { usePathname } from 'next/navigation'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isInstallPage = pathname === '/install'

  return (
    <main className={isInstallPage ? 'min-h-screen' : 'min-h-screen pb-20'}>
      {children}
    </main>
  )
}
