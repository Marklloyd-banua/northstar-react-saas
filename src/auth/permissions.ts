import type { AuthRole, AuthUser, Permission } from './types'

const rolePermissions: Record<AuthRole, readonly Permission[]> = {
  administrator: ['dashboard:access', 'resource:create', 'resource:edit', 'resource:delete', 'admin:sensitive'],
  manager: ['dashboard:access', 'resource:create', 'resource:edit'],
  viewer: ['dashboard:access'],
}

/** Sensitive areas/actions require explicit admin capability in this demo model. */
export const sensitiveAdminResources = new Set(['platform-users', 'roles', 'settings', 'security', 'integrations'])

export function hasPermission(user: AuthUser | null | undefined, permission: Permission): boolean {
  if (!user) return false
  return rolePermissions[user.role].includes(permission)
}

export function canAccessPath(user: AuthUser | null | undefined, path: string): boolean {
  if (!hasPermission(user, 'dashboard:access')) return false
  if (!path || path === '/' || path === '/analytics') return true
  const resource = path.replace(/^\//, '').split('/')[0] ?? ''
  if (sensitiveAdminResources.has(resource)) return hasPermission(user, 'admin:sensitive')
  return true
}

export function canMutateResource(user: AuthUser | null | undefined, _resource: string, action: 'create' | 'edit' | 'delete'): boolean {
  if (action === 'create') return hasPermission(user, 'resource:create')
  if (action === 'edit') return hasPermission(user, 'resource:edit')
  return hasPermission(user, 'resource:delete')
}

export function canPerformSensitiveAdminAction(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'admin:sensitive')
}

export function getRoleLabel(role: AuthRole): string {
  if (role === 'administrator') return 'Administrator'
  if (role === 'manager') return 'Manager'
  return 'Viewer'
}
