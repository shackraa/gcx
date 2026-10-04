import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useUIStore } from '@/lib/store/ui'
import { TOUR_STEPS } from '@/lib/tourSteps'

interface TourState {
  isTourOpen: boolean
  currentStepIndex: number
  isGuideModalOpen: boolean
  hasSeenTour: boolean
  dontShowAutoPrompt: boolean

  // Actions
  startTour: (stepIndex?: number) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (stepIndex: number) => void
  closeTour: () => void
  completeTour: () => void
  openGuideModal: () => void
  closeGuideModal: () => void
  resetTour: () => void
  setDontShowAutoPrompt: (val: boolean) => void
}

export const useTourStore = create<TourState>()(
  persist(
    (set, get) => ({
      isTourOpen: false,
      currentStepIndex: 0,
      isGuideModalOpen: false,
      hasSeenTour: false,
      dontShowAutoPrompt: false,

      startTour: (stepIndex = 0) => {
        const step = TOUR_STEPS[stepIndex] || TOUR_STEPS[0]
        if (step?.targetView) {
          useUIStore.getState().setView(step.targetView)
        }
        set({
          isTourOpen: true,
          currentStepIndex: stepIndex,
          isGuideModalOpen: false,
        })
      },

      nextStep: () => {
        const { currentStepIndex } = get()
        const nextIndex = currentStepIndex + 1
        if (nextIndex < TOUR_STEPS.length) {
          const nextStep = TOUR_STEPS[nextIndex]
          if (nextStep?.targetView) {
            useUIStore.getState().setView(nextStep.targetView)
          }
          set({ currentStepIndex: nextIndex })
        } else {
          get().completeTour()
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get()
        const prevIndex = Math.max(0, currentStepIndex - 1)
        const prevStep = TOUR_STEPS[prevIndex]
        if (prevStep?.targetView) {
          useUIStore.getState().setView(prevStep.targetView)
        }
        set({ currentStepIndex: prevIndex })
      },

      goToStep: (stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < TOUR_STEPS.length) {
          const step = TOUR_STEPS[stepIndex]
          if (step?.targetView) {
            useUIStore.getState().setView(step.targetView)
          }
          set({ currentStepIndex: stepIndex })
        }
      },

      closeTour: () => {
        set({ isTourOpen: false })
      },

      completeTour: () => {
        set({
          isTourOpen: false,
          hasSeenTour: true,
          dontShowAutoPrompt: true,
        })
      },

      openGuideModal: () => {
        set({ isGuideModalOpen: true, isTourOpen: false })
      },

      closeGuideModal: () => {
        set({ isGuideModalOpen: false })
      },

      resetTour: () => {
        set({
          hasSeenTour: false,
          dontShowAutoPrompt: false,
          currentStepIndex: 0,
        })
        get().startTour(0)
      },

      setDontShowAutoPrompt: (val: boolean) => {
        set({ dontShowAutoPrompt: val })
      },
    }),
    {
      name: 'gcx-tour-settings',
      partialize: (state) => ({
        hasSeenTour: state.hasSeenTour,
        dontShowAutoPrompt: state.dontShowAutoPrompt,
      }),
    }
  )
)
