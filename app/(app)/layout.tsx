'use client'

import { AppHeader } from '@/components/layout/AppHeader'
import { TourGuide } from '@/components/tour/TourGuide'
import { GuideModal } from '@/components/tour/GuideModal'
import { WelcomePrompt } from '@/components/tour/WelcomePrompt'
import { FloatingHelpButton } from '@/components/tour/FloatingHelpButton'
import { useConvexAuth } from 'convex/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useConvexAuth()
  const isLoading = auth?.isLoading ?? true
  const isAuthenticated = auth?.isAuthenticated ?? false
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 pb-20 pt-4">{children}</main>
      <TourGuide />
      <GuideModal />
      <WelcomePrompt />
      <FloatingHelpButton />
    </div>
  )
}
