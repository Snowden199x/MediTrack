import { create } from 'zustand'

const TOKEN_KEY = 'meditrack_token'

interface AuthTokenState {
  token: string | null
  setToken: (token: string | null) => void
}

export const useAuthTokenStore = create<AuthTokenState>((set) => ({
  token: typeof window === 'undefined' ? null : window.sessionStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) window.sessionStorage.setItem(TOKEN_KEY, token)
      else window.sessionStorage.removeItem(TOKEN_KEY)
    }

    set({ token })
  },
}))

export function getToken() {
  return useAuthTokenStore.getState().token
}

export function setToken(token) {
  useAuthTokenStore.getState().setToken(token)
}

interface ApiOptions {
  method?: string
  body?: unknown
}

export async function api(path: string, { method = 'GET', body }: ApiOptions = {}): Promise<any> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const firstError = Object.values(payload.errors || {}).flat()[0]
    const error = new Error(firstError || payload.message || 'Request failed. Please try again.') as Error & { status: number }
    error.status = response.status
    throw error
  }

  return payload
}
