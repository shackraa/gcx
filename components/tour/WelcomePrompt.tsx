'use client'

import { useState, useEffect } from 'react'
import { useTourStore } from '@/lib/store/tour'
import { Button } from '@/components/ui/button'
import { Sparkles, X, Play, BookOpen } from 'lucide-react'

export function WelcomePrompt() {
  const {
    hasSeenTour,
    dontShowAutoPrompt,
    isTourOpen,
    isGuideModalOpen,
    startTour,
    openGuideModal,
    setDontShowAutoPrompt,
    completeTour,
  } = useTourStore()

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show if user hasn't seen the tour and hasn't suppressed the prompt
    if (!hasSeenTour && !dontShowAutoPrompt && !isTourOpen && !isGuideModalOpen) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1200)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [hasSeenTour, dontShowAutoPrompt, isTourOpen, isGuideModalOpen])

  if (!isVisible) return null

  function handleStart() {
    setIsVisible(false)
    startTour(0)
  }

  function handleOpenGuide() {
    setIsVisible(false)
    openGuideModal()
  }

  function handleDismiss() {
    setIsVisible(false)
    setDontShowAutoPrompt(true)
  }

  function handleNeverShow() {
    setIsVisible(false)
    completeTour()
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9990] max-w-sm w-[calc(100vw-2.5rem)] bg-card/95 text-card-foreground backdrop-blur-md border border-primary/30 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">GCX&apos;e Hoş Geldiniz</h4>
            <p className="text-[11px] text-muted-foreground">Nasıl kullanacağınızı öğrenin</p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
          title="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-xs text-muted-foreground/90 leading-relaxed mb-3.5">
        Çoklu CV yönetimi, yapay zekâlı ilan radarı ve sessiz başvuru takibi özelliklerini keşfetmek için 1 dakikalık hızlı turu başlatın.
      </p>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
        <button
          onClick={handleNeverShow}
          className="text-[11px] text-muted-foreground hover:text-foreground hover:underline"
        >
          Bir daha gösterme
        </button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenGuide}
            className="h-7 text-xs px-2.5"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Rehber
          </Button>
          <Button
            size="sm"
            onClick={handleStart}
            className="h-7 text-xs px-3 font-semibold gap-1"
          >
            <Play className="h-3 w-3 fill-current" />
            Turu Başlat
          </Button>
        </div>
      </div>
    </div>
  )
}
