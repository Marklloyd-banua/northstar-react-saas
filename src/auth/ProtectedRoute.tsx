import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { canAccessPath } from './permissions'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <div className="page-loading"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div><span>Checking session</span></div>
  }
  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!canAccessPath(user, location.pathname)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />
  }
  return <>{children}</>
}
