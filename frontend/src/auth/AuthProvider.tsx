import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { login, logout, me, setUnauthorizedHandler } from '../lib/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    me()
      .then((result) => {
        if (active) setUser(result?.username ?? null)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const signIn = useCallback(async (username: string, password: string) => {
    const result = await login(username, password)
    setUser(result.username)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } finally {
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>
  )
}