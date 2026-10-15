import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, tokenStore, type User } from './api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  logout: () => void
  setUser: (u: User) => void
}

const AuthContext = createContext<AuthContextValue>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(!!tokenStore.get())

  useEffect(() => {
    if (!tokenStore.get()) return
    api
      .get<User>('/me')
      .then((r) => setUser(r.data))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  const authenticate = useCallback(async (path: string, body: object) => {
    const { data } = await api.post<{ token: string; user: User }>(path, body)
    tokenStore.set(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    setUser,
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (name, email, password) => authenticate('/auth/register', { name, email, password }),
    logout: () => {
      tokenStore.clear()
      setUser(null)
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
