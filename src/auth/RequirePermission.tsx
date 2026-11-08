import type { ReactNode } from 'react'
import type { Permission } from './types'
import { useAuth } from '../contexts/AuthContext'

export function RequirePermission({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>
}
