import type { WorkItem } from '@orbit/types'
import type { StateCreator } from 'zustand'
import type { AppState } from './index'

export interface ItemsSlice {
  byId: Record<string, WorkItem>
  add: (item: WorkItem) => void
  update: (id: string, patch: Partial<WorkItem>) => void
  move: (id: string, stateId: string, sortOrder: number) => void
  remove: (id: string) => void
}

export const createItemsSlice: StateCreator<AppState, [['zustand/immer', never]], [], ItemsSlice> = (set) => ({
  byId: {},
  add: (item) =>
    set((s) => {
      s.byId[item.id] = item
    }),
  update: (id, patch) =>
    set((s) => {
      const item = s.byId[id]
      if (item) Object.assign(item, patch)
    }),
  move: (id, stateId, sortOrder) =>
    set((s) => {
      const item = s.byId[id]
      if (item) {
        item.stateId = stateId
        item.sortOrder = sortOrder
      }
    }),
  remove: (id) =>
    set((s) => {
      delete s.byId[id]
    }),
})
