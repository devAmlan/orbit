import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { type AuthSlice, createAuthSlice } from './auth-slice'
import { type BoardSlice, createBoardSlice } from './board-slice'
import { type ChatSlice, createChatSlice } from './chat-slice'
import { createDraftSlice, type DraftSlice } from './draft-slice'
import { createItemsSlice, type ItemsSlice } from './items-slice'
import { createUiSlice, type UiSlice } from './ui-slice'

export type AppState = BoardSlice & ItemsSlice & DraftSlice & ChatSlice & UiSlice & AuthSlice

export const useAppStore = create<AppState>()(
  devtools(
    immer((...a) => ({
      ...createBoardSlice(...a),
      ...createItemsSlice(...a),
      ...createDraftSlice(...a),
      ...createChatSlice(...a),
      ...createUiSlice(...a),
      ...createAuthSlice(...a),
    })),
    { enabled: import.meta.env.DEV, name: 'orbit' },
  ),
)

export type { AuthStatus } from './auth-slice'
export type { BoardRecord } from './board-slice'
export type { ChatMessage } from './chat-slice'
export type { DraftStatus } from './draft-slice'
export type { UiFilters } from './ui-slice'
