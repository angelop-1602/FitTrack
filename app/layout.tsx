import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { StoreProvider } from '@/lib/store-context'
import { BottomNav } from '@/components/bottom-nav'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { PWARegistration } from '@/components/pwa-registration'
import { NetworkStatus } from '@/components/network-status'
import { LayoutWrapper } from '@/components/layout-wrapper'
import './globals.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'FitTrack - Workout & Steps Tracker',
  description: 'Track your workouts, log daily steps, and monitor your fitness progress',
  applicationName: 'FitTrack',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FitTrack',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f5' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <PWARegistration />
        <StoreProvider>
          <NetworkStatus />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <BottomNav />
          <PWAInstallPrompt />
        </StoreProvider>
        <Analytics />
      </body>
    </html>
  )
}
