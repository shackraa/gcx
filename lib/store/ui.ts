import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilterKey, ViewMode } from '@/types'

interface UIState {
  // Filters
  filter: FilterKey
  search: string
  channelFilter: string
  resumeFilter: string

  // View
  view: ViewMode

  // Application Modal
  modalOpen: boolean
  editingId: string | null

  // Resume Modal
  resumeModalOpen: boolean
  editingResumeId: string | null

  // UI Style Mode ('award' = new high-craft UI, 'classic' = original UI)
  uiMode: 'award' | 'classic'

  // Command Palette (Cmd+K)
  commandOpen: boolean

  // Studio Prefill (when jumping from Job Radar to CV Studio)
  studioPrefill: {
    jobUrl?: string
    company?: string
    role?: string
    description?: string
  } | null

  // Actions
  setFilter: (filter: FilterKey) => void
  setSearch: (search: string) => void
  setChannelFilter: (channel: string) => void
  setResumeFilter: (resumeFilter: string) => void
  setView: (view: ViewMode) => void
  setUIMode: (uiMode: 'award' | 'classic') => void
  toggleUIMode: () => void
  setCommandOpen: (open: boolean) => void
  openModal: (id?: string) => void
  closeModal: () => void
  openResumeModal: (id?: string) => void
  closeResumeModal: () => void
  openStudioWithJob: (prefill: { jobUrl?: string; company?: string; role?: string; description?: string }) => void
  clearStudioPrefill: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      filter: 'all',
      search: '',
      channelFilter: 'all',
      resumeFilter: 'all',
      view: 'list',
      uiMode: 'award',
      commandOpen: false,
      modalOpen: false,
      editingId: null,
      resumeModalOpen: false,
      editingResumeId: null,
      studioPrefill: null,

      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),
      setChannelFilter: (channelFilter) => set({ channelFilter }),
      setResumeFilter: (resumeFilter) => set({ resumeFilter }),
      setView: (view) => set({ view }),
      setUIMode: (uiMode) => set({ uiMode }),
      toggleUIMode: () =>
        set((state) => ({ uiMode: state.uiMode === 'award' ? 'classic' : 'award' })),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      openModal: (id) => set({ modalOpen: true, editingId: id ?? null }),
      closeModal: () => set({ modalOpen: false, editingId: null }),
      openResumeModal: (id) => set({ resumeModalOpen: true, editingResumeId: id ?? null }),
      closeResumeModal: () => set({ resumeModalOpen: false, editingResumeId: null }),
      openStudioWithJob: (prefill) => set({ view: 'studio', studioPrefill: prefill }),
      clearStudioPrefill: () => set({ studioPrefill: null }),
    }),
    {
      name: 'gcx-ui',
      partialize: (state) => ({
        view: state.view,
        filter: state.filter,
        channelFilter: state.channelFilter,
        resumeFilter: state.resumeFilter,
        uiMode: state.uiMode,
      }),
    }
  )
)

