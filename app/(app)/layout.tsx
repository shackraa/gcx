'use client'

import { AppHeader } from '@/components/layout/AppHeader'
import { AwardShell } from '@/components/layout/AwardShell'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { TourGuide } from '@/components/tour/TourGuide'
import { GuideModal } from '@/components/tour/GuideModal'
import { WelcomePrompt } from '@/components/tour/WelcomePrompt'
import { FloatingHelpButton } from '@/components/tour/FloatingHelpButton'
import { MobileNav } from '@/components/layout/MobileNav'
import { useUIStore } from '@/lib/store/ui'
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
  const { uiMode } = useUIStore()

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
    <>
      {uiMode === 'award' ? (
        <AwardShell>{children}</AwardShell>
      ) : (
        <div className="min-h-screen bg-background">
          <AppHeader />
          <main className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pb-28 sm:pb-20 pt-3 sm:pt-5">
            {children}
          </main>
        </div>
      )}
      <MobileNav />
      <CommandPalette />
      <TourGuide />
      <GuideModal />
      <WelcomePrompt />
      <FloatingHelpButton />
    </>
  )
}
