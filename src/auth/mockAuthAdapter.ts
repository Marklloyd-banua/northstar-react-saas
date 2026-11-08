import type { AuthResult, AuthUser, LoginInput } from './types'

/**
 * Demo-only mock authentication adapter.
 * This is NOT secure authentication and must not be treated as production security.
 * Real deployments must validate credentials/sessions server-side.
 */
const STORAGE_KEY = 'saas-admin-demo-session'

interface DemoAccount extends AuthUser {
  password: string
}

export const demoCredentials = [
  { email: 'admin@northstar.demo', password: 'AdminDemo123!', role: 'Administrator' },
  { email: 'manager@northstar.demo', password: 'ManagerDemo123!', role: 'Manager' },
  { email: 'viewer@northstar.demo', password: 'ViewerDemo123!', role: 'Viewer' },
] as const

const accounts: DemoAccount[] = [
  { id: 'USR-ADMIN', name: 'Olivia Rhye', email: 'admin@northstar.demo', role: 'administrator', password: 'AdminDemo123!' },
  { id: 'USR-MANAGER', name: 'Phoenix Baker', email: 'manager@northstar.demo', role: 'manager', password: 'ManagerDemo123!' },
  { id: 'USR-VIEWER', name: 'Lana Steiner', email: 'viewer@northstar.demo', role: 'viewer', password: 'ViewerDemo123!' },
]

const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

function toUser(account: DemoAccount): AuthUser {
  return { id: account.id, name: account.name, email: account.email, role: account.role, demoSessionId: `demo-${account.id}` }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  await wait(320)
  const email = input.email.trim().toLowerCase()
  const account = accounts.find((item) => item.email.toLowerCase() === email)
  if (!account || account.password !== input.password) {
    throw { message: 'Invalid email or password. Use a documented demo account.', code: 'INVALID_CREDENTIALS' }
  }
  const user = toUser(account)
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: user.id }))
  return { user }
}

export async function logout(): Promise<void> {
  await wait(120)
  sessionStorage.removeItem(STORAGE_KEY)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  await wait(160)
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { userId?: string }
    const account = accounts.find((item) => item.id === parsed.userId)
    return account ? toUser(account) : null
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}
