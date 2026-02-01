import React from "react"
import type { Metadata } from 'next'
import { PWARegistration } from '@/components/pwa-registration'
import { NetworkStatus } from '@/components/network-status'

export const metadata: Metadata = {
  title: 'Install FitTrack - Workout & Steps Tracker',
  description: 'Install FitTrack as a Progressive Web App for the best experience',
}

export default function InstallLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <PWARegistration />
      <NetworkStatus />
      {children}
    </>
  )
}
