'use client'

import { useTourStore } from '@/lib/store/tour'
import { HelpCircle } from 'lucide-react'

export function FloatingHelpButton() {
  const { openGuideModal, isTourOpen, isGuideModalOpen } = useTourStore()

  // Don't show floating button if tour or modal is already active
  if (isTourOpen || isGuideModalOpen) return null

  return (
    <div className="fixed bottom-20 sm:bottom-4 right-4 z-40">
      <button
        onClick={() => openGuideModal()}
        title="Kullanım Rehberi"
        className="h-8 w-8 rounded-full bg-card/90 border border-border text-muted-foreground hover:text-foreground hover:border-border/80 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    </div>
  )
}
