'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Smartphone, Chrome, Apple, Monitor, Check, Dumbbell, TrendingUp, Calendar, Target } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | 'unknown'>('unknown')

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase()
    if (/android/.test(userAgent)) {
      setPlatform('android')
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios')
    } else {
      setPlatform('desktop')
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-25">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header with Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary blur-3xl opacity-30 rounded-full"></div>
              <div className="relative bg-primary p-6 rounded-3xl">
                <Image 
                  src="/logo.png" 
                  alt="FitTrack Logo" 
                  width={120} 
                  height={120}
                  className="drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-primary">
            FitTrack
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Your Complete Workout & Steps Tracker
          </p>
          <Badge variant="outline" className="border-primary/50 text-primary">
            Progressive Web App
          </Badge>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/90 p-3 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Track Workouts</h3>
                  <p className="text-sm text-muted-foreground">
                    Log exercises, sets, reps, and RPE with an intuitive interface
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/90 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Monitor Steps</h3>
                  <p className="text-sm text-muted-foreground">
                    Track daily steps and reach your 10,000 steps goal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/90 p-3 rounded-xl">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Workout Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Follow a structured 3-day workout split with recovery days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/90 p-3 rounded-xl">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Offline Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Works offline - your data syncs when you're back online
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Installation Section */}
        <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 backdrop-blur-md mb-8">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-3">Install FitTrack</h2>
              <p className="text-muted-foreground">
                Get the app-like experience on your device
              </p>
            </div>

            {isInstalled ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Already Installed!</h3>
                <p className="text-muted-foreground mb-6">
                  You can access FitTrack from your home screen
                </p>
                <Link href="/">
                  <Button size="lg">
                    Open App
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Quick Install Button (for supported browsers) */}
                {deferredPrompt && (
                  <div className="mb-8 text-center">
                    <Button 
                      size="lg" 
                      onClick={handleInstallClick}
                      className="text-lg px-8 py-6 h-auto"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Install Now
                    </Button>
                    <p className="text-sm text-muted-foreground mt-3">
                      One-click installation available
                    </p>
                  </div>
                )}

                {/* Platform-specific instructions */}
                <div className="space-y-6">
                  {/* Android */}
                  <div className={`p-6 rounded-xl border ${platform === 'android' ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Smartphone className="w-6 h-6 text-primary" />
                      <h3 className="text-xl font-semibold">Android (Chrome/Edge)</h3>
                      {platform === 'android' && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Your Device
                        </Badge>
                      )}
                    </div>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">1.</span>
                        <span>Tap the menu (⋮) in the top-right corner</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">2.</span>
                        <span>Select "Install app" or "Add to Home screen"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">3.</span>
                        <span>Tap "Install" to confirm</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">4.</span>
                        <span>FitTrack will appear on your home screen!</span>
                      </li>
                    </ol>
                  </div>

                  {/* iOS */}
                  <div className={`p-6 rounded-xl border ${platform === 'ios' ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Apple className="w-6 h-6 text-primary" />
                      <h3 className="text-xl font-semibold">iOS (Safari)</h3>
                      {platform === 'ios' && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Your Device
                        </Badge>
                      )}
                    </div>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">1.</span>
                        <span>Tap the Share button (⬆️) at the bottom</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">2.</span>
                        <span>Scroll down and tap "Add to Home Screen"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">3.</span>
                        <span>Tap "Add" in the top-right corner</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">4.</span>
                        <span>FitTrack will appear on your home screen!</span>
                      </li>
                    </ol>
                  </div>

                  {/* Desktop */}
                  <div className={`p-6 rounded-xl border ${platform === 'desktop' ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <Monitor className="w-6 h-6 text-primary" />
                      <h3 className="text-xl font-semibold">Desktop (Chrome/Edge)</h3>
                      {platform === 'desktop' && (
                        <Badge className="bg-primary/20 text-primary border-primary/30">
                          Your Device
                        </Badge>
                      )}
                    </div>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">1.</span>
                        <span>Look for the install icon (⊕) in the address bar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">2.</span>
                        <span>Click the install icon or wait for the prompt</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">3.</span>
                        <span>Click "Install" in the dialog</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold min-w-[20px]">4.</span>
                        <span>FitTrack will open in its own window!</span>
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Skip to App Link */}
                <div className="text-center mt-8 pt-6 border-t border-white/10">
                  <p className="text-muted-foreground mb-4">
                    Want to try it first?
                  </p>
                  <Link href="/">
                    <Button variant="outline" size="lg" className="border-white/20 hover:bg-white/10">
                      Continue to Web App
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="text-3xl mb-2">⚡</div>
            <h4 className="font-semibold mb-1">Lightning Fast</h4>
            <p className="text-sm text-muted-foreground">Loads instantly from cache</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">📱</div>
            <h4 className="font-semibold mb-1">App-Like</h4>
            <p className="text-sm text-muted-foreground">Full screen, no browser UI</p>
          </div>
          <div className="p-4">
            <div className="text-3xl mb-2">🔒</div>
            <h4 className="font-semibold mb-1">Your Data</h4>
            <p className="text-sm text-muted-foreground">Stored locally & synced securely</p>
          </div>
        </div>
      </div>
    </div>
  )
}
