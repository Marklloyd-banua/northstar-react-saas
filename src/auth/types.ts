export type AuthRole = 'administrator' | 'manager' | 'viewer'

export type Permission =
  | 'dashboard:access'
  | 'resource:create'
  | 'resource:edit'
  | 'resource:delete'
  | 'admin:sensitive'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: AuthRole
  /** Demo-only session marker from the mock adapter; not a secure backend token. */
  demoSessionId?: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResult {
  user: AuthUser
}

/** Authentication adapter seam. Default implementation is the frontend mock adapter.
 * Future API adapters must implement the same contract only after a backend contract is defined.
 * No real auth/token refresh/CSRF/cookie integration is implemented in this phase. */
export interface AuthAdapter {
  login(input: LoginInput): Promise<AuthResult>
  logout(): Promise<void>
  getCurrentUser(): Promise<AuthUser | null>
}

export interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  loading: boolean
  error: string | null
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  refreshCurrentUser: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
}
