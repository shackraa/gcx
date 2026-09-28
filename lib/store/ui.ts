import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FilterKey, ViewMode } from '@/types'

interface UIState {
  // Filters
  filter: FilterKey
  search: string
  channelFilter: string

  // View
  view: ViewMode

  // Modal
  modalOpen: boolean
  editingId: string | null

  // Actions
  setFilter: (filter: FilterKey) => void
  setSearch: (search: string) => void
  setChannelFilter: (channel: string) => void
  setView: (view: ViewMode) => void
  openModal: (id?: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      filter: 'all',
      search: '',
      channelFilter: 'all',
      view: 'list',
      modalOpen: false,
      editingId: null,

      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),
      setChannelFilter: (channelFilter) => set({ channelFilter }),
      setView: (view) => set({ view }),
      openModal: (id) => set({ modalOpen: true, editingId: id ?? null }),
      closeModal: () => set({ modalOpen: false, editingId: null }),
    }),
    {
      name: 'gcx-ui',
      partialize: (state) => ({
        view: state.view,
        filter: state.filter,
        channelFilter: state.channelFilter,
      }),
    }
  )
)
