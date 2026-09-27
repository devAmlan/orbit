import type { User } from '@orbit/types'
import type { StateCreator } from 'zustand'
import { api, ApiError } from '@/services/api'
import type { AppState } from './index'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthSlice {
  user: User | null
  authStatus: AuthStatus
  authError: string | null
  hydrate: () => Promise<void>
  login: (input: { email: string; password: string; remember?: boolean }) => Promise<void>
  signup: (input: { name: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

export const createAuthSlice: StateCreator<AppState, [['zustand/immer', never]], [], AuthSlice> = (set) => ({
  user: null,
  authStatus: 'idle',
  authError: null,
  hydrate: async () => {
    set((s) => {
      s.authStatus = 'loading'
    })
    try {
      const { user } = await api.me()
      set((s) => {
        s.user = user
        s.authStatus = 'authenticated'
      })
    } catch {
      set((s) => {
        s.user = null
        s.authStatus = 'unauthenticated'
      })
    }
  },
  login: async (input) => {
    set((s) => {
      s.authStatus = 'loading'
      s.authError = null
    })
    try {
      const { user } = await api.login(input)
      set((s) => {
        s.user = user
        s.authStatus = 'authenticated'
      })
    } catch (err) {
      set((s) => {
        s.authStatus = 'unauthenticated'
        s.authError = err instanceof ApiError ? err.message : 'Something went wrong'
      })
      throw err
    }
  },
  signup: async (input) => {
    set((s) => {
      s.authStatus = 'loading'
      s.authError = null
    })
    try {
      const { user } = await api.signup(input)
      set((s) => {
        s.user = user
        s.authStatus = 'authenticated'
      })
    } catch (err) {
      set((s) => {
        s.authStatus = 'unauthenticated'
        s.authError = err instanceof ApiError ? err.message : 'Something went wrong'
      })
      throw err
    }
  },
  logout: async () => {
    await api.logout().catch(() => {})
    set((s) => {
      s.user = null
      s.authStatus = 'unauthenticated'
    })
  },
})
