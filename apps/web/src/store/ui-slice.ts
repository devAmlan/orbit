import type { Priority } from '@orbit/types'
import type { StateCreator } from 'zustand'
import type { AppState } from './index'

export interface UiFilters {
  label?: string
  priority?: Priority
}

export interface UiSlice {
  peekItemId: string | null
  filters: UiFilters
  paletteOpen: boolean
  theme: 'light' | 'dark'
  setPeekItemId: (id: string | null) => void
  setFilters: (filters: UiFilters) => void
  setPaletteOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const createUiSlice: StateCreator<AppState, [['zustand/immer', never]], [], UiSlice> = (set) => ({
  peekItemId: null,
  filters: {},
  paletteOpen: false,
  theme: 'light',
  setPeekItemId: (id) =>
    set((s) => {
      s.peekItemId = id
    }),
  setFilters: (filters) =>
    set((s) => {
      s.filters = filters
    }),
  setPaletteOpen: (open) =>
    set((s) => {
      s.paletteOpen = open
    }),
  setTheme: (theme) =>
    set((s) => {
      s.theme = theme
    }),
})
