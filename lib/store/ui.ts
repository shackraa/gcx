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

  // Actions
  setFilter: (filter: FilterKey) => void
  setSearch: (search: string) => void
  setChannelFilter: (channel: string) => void
  setResumeFilter: (resumeFilter: string) => void
  setView: (view: ViewMode) => void
  openModal: (id?: string) => void
  closeModal: () => void
  openResumeModal: (id?: string) => void
  closeResumeModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      filter: 'all',
      search: '',
      channelFilter: 'all',
      resumeFilter: 'all',
      view: 'list',
      modalOpen: false,
      editingId: null,
      resumeModalOpen: false,
      editingResumeId: null,

      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),
      setChannelFilter: (channelFilter) => set({ channelFilter }),
      setResumeFilter: (resumeFilter) => set({ resumeFilter }),
      setView: (view) => set({ view }),
      openModal: (id) => set({ modalOpen: true, editingId: id ?? null }),
      closeModal: () => set({ modalOpen: false, editingId: null }),
      openResumeModal: (id) => set({ resumeModalOpen: true, editingResumeId: id ?? null }),
      closeResumeModal: () => set({ resumeModalOpen: false, editingResumeId: null }),
    }),
    {
      name: 'gcx-ui',
      partialize: (state) => ({
        view: state.view,
        filter: state.filter,
        channelFilter: state.channelFilter,
        resumeFilter: state.resumeFilter,
      }),
    }
  )
)
