import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'reporter'
  full_name: string
  phone: string
  avatar_url: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (data: ProfileUpdateData) => Promise<void>
}

interface RegisterData {
  username: string
  email: string
  password: string
  full_name: string
}

interface ProfileUpdateData {
  full_name?: string
  email?: string
  phone?: string
}

interface AuthResponse {
  token: string
  user: User
}

const AuthContext = createContext<AuthState | null>(null)

async function authRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/auth${url}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const saveAuth = useCallback((authToken: string, authUser: User) => {
    localStorage.setItem('token', authToken)
    setToken(authToken)
    setUser(authUser)
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    authRequest<User>('/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((u) => {
        setUser(u)
      })
      .catch(() => {
        clearAuth()
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token, clearAuth])

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await authRequest<AuthResponse>('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      saveAuth(data.token, data.user)
    },
    [saveAuth],
  )

  const register = useCallback(
    async (data: RegisterData) => {
      const res = await authRequest<AuthResponse>('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      saveAuth(res.token, res.user)
    },
    [saveAuth],
  )

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  const updateProfile = useCallback(
    async (data: ProfileUpdateData) => {
      if (!token) throw new Error('Not authenticated')
      const updated = await authRequest<User>('/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      setUser(updated)
    },
    [token],
  )

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
