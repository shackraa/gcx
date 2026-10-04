'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTourStore } from '@/lib/store/tour'
import { useUIStore } from '@/lib/store/ui'
import { TOUR_STEPS } from '@/lib/tourSteps'
import { Button } from '@/components/ui/button'
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RectPosition {
  top: number
  left: number
  width: number
  height: number
  isInsideHeader?: boolean
}

const PADDING = 8
const NAVBAR_CLEARANCE = 62 // 56px sticky navbar + 6px clean safety margin

export function TourGuide() {
  const {
    isTourOpen,
    currentStepIndex,
    nextStep,
    prevStep,
    closeTour,
    completeTour,
    openGuideModal,
    dontShowAutoPrompt,
    setDontShowAutoPrompt,
  } = useTourStore()

  const [targetRect, setTargetRect] = useState<RectPosition | null>(null)
  const [isCentered, setIsCentered] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1

  // Update target rect with navbar offset awareness and clamping
  const updatePosition = useCallback((shouldScroll = false) => {
    if (!isTourOpen || !currentStep) return

    const selector = currentStep.targetSelector
    const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
    const element =
      elements.find((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && (el.offsetParent !== null || window.getComputedStyle(el).display !== 'none')
      }) || elements[0] || null

    if (element) {
      const rect = element.getBoundingClientRect()
      // Check if rect is visible
      if (rect.width > 0 && rect.height > 0) {
        const isInsideHeader = Boolean(element.closest('header'))

        // Smoothly scroll into view with top clearance so target never sits behind the navbar
        if (shouldScroll && !isInsideHeader) {
          const elementDocTop = window.scrollY + rect.top
          const targetScrollY = Math.max(0, elementDocTop - NAVBAR_CLEARANCE - 16)
          const isTopComfortablyVisible =
            rect.top >= NAVBAR_CLEARANCE + 12 && rect.top <= window.innerHeight - 100

          if (!isTopComfortablyVisible) {
            window.scrollTo({
              top: targetScrollY,
              behavior: 'smooth',
            })
          }
        }

        // Calculate highlight box coordinates including padding
        let boxTop = rect.top - PADDING
        let boxHeight = rect.height + PADDING * 2
        const boxLeft = rect.left - PADDING
        const boxWidth = rect.width + PADDING * 2

        // If target is in the page body, strictly clamp boxTop to prevent any overlap with the top navbar
        if (!isInsideHeader) {
          if (boxTop < NAVBAR_CLEARANCE) {
            const overlap = NAVBAR_CLEARANCE - boxTop
            boxTop = NAVBAR_CLEARANCE
            boxHeight = Math.max(0, boxHeight - overlap)
          }
        }

        if (boxWidth > 0 && boxHeight > 0) {
          setTargetRect({
            top: boxTop,
            left: boxLeft,
            width: boxWidth,
            height: boxHeight,
            isInsideHeader,
          })
          setIsCentered(false)
          return
        }
      }
    }

    // Fallback: If element not found or hidden, center the popover
    setTargetRect(null)
    setIsCentered(true)
  }, [isTourOpen, currentStep])

  // Recalculate on step change, resize, scroll, and view changes
  useEffect(() => {
    if (!isTourOpen || !currentStep) return

    // Immediately trigger view switch if step specifies targetView
    if (currentStep.targetView) {
      useUIStore.getState().setView(currentStep.targetView)
    }

    // Delay to allow React view transitions to mount target elements and initiate scroll
    const timer1 = setTimeout(() => {
      updatePosition(true)
    }, 120)

    const timer2 = setTimeout(() => {
      updatePosition(false)
    }, 350)

    const handleResize = () => updatePosition(false)
    const handleScroll = () => updatePosition(false)

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isTourOpen, currentStepIndex, currentStep, updatePosition])

  // Keyboard navigation (Escape, ArrowRight, ArrowLeft)
  useEffect(() => {
    if (!isTourOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeTour()
      } else if (e.key === 'ArrowRight') {
        nextStep()
      } else if (e.key === 'ArrowLeft') {
        prevStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isTourOpen, nextStep, prevStep, closeTour])

  if (!isTourOpen || !currentStep) return null

  // Calculate Popover Position
  const getPopoverStyle = () => {
    if (isCentered || !targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const,
      }
    }

    const popoverWidth = 420
    const popoverHeight = 360
    const margin = 16

    let top = targetRect.top + targetRect.height + 12
    let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2

    // Check if bottom overflow -> place above
    if (top + popoverHeight > window.innerHeight - margin) {
      const topPlacement = targetRect.top - popoverHeight - 12
      if (topPlacement >= NAVBAR_CLEARANCE + 10) {
        top = topPlacement
      } else {
        top = Math.max(NAVBAR_CLEARANCE + 12, (window.innerHeight - popoverHeight) / 2)
      }
    }

    // Never let popover go above navbar if target is in page body
    if (!targetRect.isInsideHeader && top < NAVBAR_CLEARANCE + 8) {
      top = NAVBAR_CLEARANCE + 12
    }

    // Check horizontal constraints
    if (left < margin) {
      left = margin
    } else if (left + popoverWidth > window.innerWidth - margin) {
      left = window.innerWidth - popoverWidth - margin
    }

    return {
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      position: 'fixed' as const,
    }
  }

  return (
    <div className="fixed inset-0 z-[9998] overflow-hidden">
      {/* SVG Spotlight Mask */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-auto transition-all duration-300"
        style={{ width: '100vw', height: '100vh' }}
        onClick={closeTour}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire screen (opaque) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight hole */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Dark backdrop overlay */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Element Pulsing Ring */}
      {targetRect && (
        <div
          className="fixed pointer-events-none z-[9999] rounded-xl ring-2 ring-primary/80 ring-offset-2 ring-offset-background/40 shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-all duration-300 animate-pulse"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Tour Popover Card */}
      <div
        ref={popoverRef}
        style={getPopoverStyle()}
        className="z-[10000] w-[92vw] sm:w-[440px] max-w-[460px] bg-card text-card-foreground border border-border/90 rounded-2xl shadow-2xl p-5 sm:p-6 transition-all duration-200 animate-in fade-in zoom-in-95 pointer-events-auto"
        role="dialog"
        aria-modal="true"
        aria-label={currentStep.title}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Bar */}
        <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mb-4">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{
              width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Header: Step & Badge & Close */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full">
              {currentStep.badge}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              {currentStepIndex + 1} / {TOUR_STEPS.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openGuideModal()}
              title="Kullanım Rehberi Modalı"
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors text-xs flex items-center gap-1"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span className="text-[11px] hidden sm:inline">Kılavuz</span>
            </button>
            <button
              onClick={closeTour}
              title="Turu Kapat (ESC)"
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug tracking-tight mb-2">
          {currentStep.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3.5">
          {currentStep.description}
        </p>

        {/* Bullet Points */}
        {currentStep.bulletPoints && currentStep.bulletPoints.length > 0 && (
          <div className="space-y-2 bg-muted/30 border border-border/50 rounded-xl p-3 mb-4">
            {currentStep.bulletPoints.map((point, index) => (
              <div key={index} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex flex-col gap-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={isFirstStep}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Önceki
            </Button>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeTour}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Turu Atla
              </Button>

              <Button
                size="sm"
                onClick={isLastStep ? completeTour : nextStep}
                className="h-8 px-3.5 text-xs font-semibold gap-1"
              >
                <span>{isLastStep ? 'Turu Tamamla' : 'Sonraki'}</span>
                {!isLastStep && <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Quick toggle: Don't show again automatically */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground">
              <input
                type="checkbox"
                checked={dontShowAutoPrompt}
                onChange={(e) => setDontShowAutoPrompt(e.target.checked)}
                className="rounded border-border h-3.5 w-3.5 text-primary focus:ring-primary/40 cursor-pointer"
              />
              <span>Açılışta bir daha otomatik başlatma</span>
            </label>

            <span className="text-[10px] opacity-70 hidden sm:inline">
              ESC ile kapatılabilir
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
