/**
 * Canonical API endpoint catalog (base URL applied by `http.ts`).
 * Keep paths aligned with the backend contract. Some domains have multiple endpoints
 * (e.g., monitoring health vs incidents, security sessions vs events); directory UI
 * uses `directoryEndpoints` for the active resource-mapped CRUD flows.
 */
export const endpoints = {
  overview: '/platform/overview',
  analytics: '/platform/analytics',
  health: '/platform/health',
  stores: '/stores',
  tenants: '/tenants',
  users: '/platform/users',
  roles: '/roles',
  permissions: '/permissions',
  plans: '/plans',
  subscriptions: '/subscriptions',
  invoices: '/billing/invoices',
  payments: '/payments',
  promotions: '/promotions',
  monitoring: '/monitoring/health',
  monitoringIncidents: '/monitoring/incidents',
  auditLogs: '/audit-logs',
  notifications: '/notifications',
  integrations: '/integrations',
  webhooks: '/webhooks',
  settings: '/settings',
  sessions: '/security/sessions',
  securityEvents: '/security/events',
  support: '/support/tickets',
} as const

/**
 * Authoritative endpoint mapping for active directory/resource UI flows.
 * `platformResourceApiRepository` and future directory adapters should use this map.
 */
export const directoryEndpoints: Record<string, string> = {
  stores: endpoints.stores,
  tenants: endpoints.tenants,
  'platform-users': endpoints.users,
  roles: endpoints.roles,
  plans: endpoints.plans,
  subscriptions: endpoints.subscriptions,
  billing: endpoints.invoices,
  payments: endpoints.payments,
  promotions: endpoints.promotions,
  monitoring: endpoints.monitoringIncidents,
  'audit-logs': endpoints.auditLogs,
  notifications: endpoints.notifications,
  integrations: endpoints.integrations,
  settings: endpoints.settings,
  security: endpoints.sessions,
  support: endpoints.support,
}
