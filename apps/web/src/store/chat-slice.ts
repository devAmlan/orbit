import type { Change } from '@orbit/types'
import type { StateCreator } from 'zustand'
import type { AppState } from './index'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatSlice {
  messages: ChatMessage[]
  pendingChanges: Change[] | null
  send: (message: string) => void
  applyChanges: (changes: Change[]) => void
  discard: () => void
  undo: () => void
}

export const createChatSlice: StateCreator<AppState, [['zustand/immer', never]], [], ChatSlice> = (set) => ({
  messages: [],
  pendingChanges: null,
  send: (message) =>
    set((s) => {
      s.messages.push({ role: 'user', content: message })
    }),
  applyChanges: (changes) =>
    set((s) => {
      s.pendingChanges = changes
    }),
  discard: () =>
    set((s) => {
      s.pendingChanges = null
    }),
  undo: () =>
    set((s) => {
      s.pendingChanges = null
    }),
})
