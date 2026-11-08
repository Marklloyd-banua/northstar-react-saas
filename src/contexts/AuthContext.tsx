import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthContextValue, AuthStatus, AuthUser, LoginInput, Permission } from '../auth/types'
import { hasPermission as hasUserPermission } from '../auth/permissions'
import { getAuthAdapter } from '../auth/authAdapter'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const auth = useMemo(() => getAuthAdapter(), [])

  const refreshCurrentUser = useCallback(async () => {
    setError(null)
    setStatus((current) => (current === 'authenticated' ? current : 'loading'))
    try {
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)
      setStatus(currentUser ? 'authenticated' : 'unauthenticated')
    } catch (err) {
      setUser(null)
      setStatus('unauthenticated')
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unable to restore the demo session.')
    }
  }, [auth])

  useEffect(() => {
    void refreshCurrentUser()
  }, [refreshCurrentUser])

  const login = useCallback(async (input: LoginInput) => {
    setLoading(true)
    setError(null)
    try {
      const result = await auth.login(input)
      setUser(result.user)
      setStatus('authenticated')
    } catch (err) {
      setUser(null)
      setStatus('unauthenticated')
      const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unable to sign in.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [auth])

  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await auth.logout()
    } finally {
      setUser(null)
      setStatus('unauthenticated')
      setLoading(false)
    }
  }, [auth])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    loading,
    error,
    login,
    logout,
    refreshCurrentUser,
    hasPermission: (permission: Permission) => hasUserPermission(user, permission),
  }), [status, user, loading, error, login, logout, refreshCurrentUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
