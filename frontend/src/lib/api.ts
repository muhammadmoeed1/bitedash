import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { tokens } from './tokens'

// In dev, requests are relative and Vite proxies them to the backend. In prod, set
// VITE_API_URL to the deployed API origin at build time.
const baseURL = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({ baseURL: `${baseURL}/api/v1` })

api.interceptors.request.use((config) => {
  const token = tokens.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On a 401, try a one-time refresh then replay the original request. Concurrent 401s share
// a single in-flight refresh so we don't fire N refreshes at once.
let refreshing: Promise<boolean> | null = null

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokens.getRefresh()
  if (!refreshToken) return false
  try {
    const res = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken })
    tokens.set(res.data.accessToken, res.data.refreshToken)
    return true
  } catch {
    tokens.clear()
    return false
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retried?: boolean }
    const isAuthCall = original?.url?.includes('/auth/')
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true
      refreshing ??= tryRefresh()
      const ok = await refreshing
      refreshing = null
      if (ok) {
        original.headers = { ...original.headers, Authorization: `Bearer ${tokens.getAccess()}` }
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

/** Extracts a human-readable message from an API error response. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: { message?: string } })?.error?.message ?? err.message ?? fallback
  }
  return fallback
}
