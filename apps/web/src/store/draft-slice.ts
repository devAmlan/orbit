import type { State, WorkItem } from '@orbit/types'
import type { StateCreator } from 'zustand'
import type { AppState } from './index'

export type DraftStatus = 'idle' | 'streaming' | 'error' | 'done'

export interface DraftSlice {
  draftStatus: DraftStatus
  draftStates: State[]
  draftItems: WorkItem[]
  draftError: string | null
  start: () => void
  applyDelta: (delta: { states?: State[]; items?: WorkItem[] }) => void
  cancel: () => void
  commit: () => void
}

export const createDraftSlice: StateCreator<AppState, [['zustand/immer', never]], [], DraftSlice> = (set) => ({
  draftStatus: 'idle',
  draftStates: [],
  draftItems: [],
  draftError: null,
  start: () =>
    set((s) => {
      s.draftStatus = 'streaming'
      s.draftStates = []
      s.draftItems = []
      s.draftError = null
    }),
  applyDelta: (delta) =>
    set((s) => {
      if (delta.states) s.draftStates = delta.states
      if (delta.items) {
        for (const item of delta.items) {
          const idx = s.draftItems.findIndex((i) => i.id === item.id)
          if (idx === -1) s.draftItems.push(item)
          else s.draftItems[idx] = item
        }
      }
    }),
  cancel: () =>
    set((s) => {
      s.draftStatus = 'idle'
    }),
  commit: () =>
    set((s) => {
      s.draftStatus = 'done'
    }),
})
