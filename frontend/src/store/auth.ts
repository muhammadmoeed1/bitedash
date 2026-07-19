import { create } from 'zustand'
import { api } from '../lib/api'
import { tokens } from '../lib/tokens'
import { disconnectSocket } from '../lib/socket'
import type { AuthResponse, AuthUser } from '../types'

interface RegisterPayload {
  role: 'customer' | 'restaurant_owner' | 'delivery_agent'
  email: string
  password: string
  // customer / delivery_agent
  name?: string
  phone?: string
  // restaurant_owner
  restaurant_name?: string
  address?: string
  // delivery_agent
  vehicle_number?: string
}

interface AuthState {
  user: AuthUser | null
  initializing: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  loadCurrentUser: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  initializing: true,

  login: async (email, password) => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password })
    tokens.set(res.data.accessToken, res.data.refreshToken)
    set({ user: res.data.user })
  },

  register: async (payload) => {
    const res = await api.post<AuthResponse>('/auth/register', payload)
    tokens.set(res.data.accessToken, res.data.refreshToken)
    set({ user: res.data.user })
  },

  logout: async () => {
    const refreshToken = tokens.getRefresh()
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => undefined)
    }
    tokens.clear()
    disconnectSocket()
    set({ user: null })
  },

  // Restore session on app load using the stored access/refresh token.
  loadCurrentUser: async () => {
    if (!tokens.getAccess()) {
      set({ initializing: false })
      return
    }
    try {
      const res = await api.get<{ data: AuthUser }>('/auth/me')
      set({ user: { user_id: res.data.data.user_id, email: res.data.data.email, role: res.data.data.role } })
    } catch {
      tokens.clear()
    } finally {
      set({ initializing: false })
    }
  },
}))
