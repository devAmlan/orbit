import type { State } from '@orbit/types'
import type { StateCreator } from 'zustand'
import type { AppState } from './index'

export interface BoardRecord {
  id: string
  projectName: string
  summary: string
  updatedAt: number
}

export interface BoardSlice {
  boards: BoardRecord[]
  activeBoardId: string | null
  states: State[]
  load: (boards: BoardRecord[]) => void
  create: (board: BoardRecord, states: State[]) => void
  rename: (boardId: string, projectName: string) => void
  remove: (boardId: string) => void
}

export const createBoardSlice: StateCreator<AppState, [['zustand/immer', never]], [], BoardSlice> = (set) => ({
  boards: [],
  activeBoardId: null,
  states: [],
  load: (boards) =>
    set((s) => {
      s.boards = boards
    }),
  create: (board, states) =>
    set((s) => {
      s.boards.push(board)
      s.activeBoardId = board.id
      s.states = states
    }),
  rename: (boardId, projectName) =>
    set((s) => {
      const board = s.boards.find((b) => b.id === boardId)
      if (board) board.projectName = projectName
    }),
  remove: (boardId) =>
    set((s) => {
      s.boards = s.boards.filter((b) => b.id !== boardId)
      if (s.activeBoardId === boardId) s.activeBoardId = null
    }),
})
