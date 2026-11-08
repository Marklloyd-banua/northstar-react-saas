// Central request behavior belongs here when the SaaS API is connected.
// Future production integration should prefer secure HttpOnly cookie sessions (with CSRF
// protections as required by the backend) over storing long-lived tokens in frontend code.
// If a backend uses bearer tokens, provide headers via `setApiAuthHeaderProvider` from an
// auth/session module. Do not hardcode tokens or store secrets in VITE_* env vars.

export type ApiAuthHeaderProvider = () => Record<string, string>

let apiAuthHeaderProvider: ApiAuthHeaderProvider | null = null

export function setApiAuthHeaderProvider(provider: ApiAuthHeaderProvider | null): void {
  apiAuthHeaderProvider = provider
}

export function getApiAuthHeaders(): Record<string, string> {
  return apiAuthHeaderProvider?.() ?? {}
}

/** @deprecated-unused Scaffolding export; `http.ts` uses `getApiAuthHeaders()` directly. Kept for compatibility/future use. */
export const apiRequestHeaders = (): Record<string, string> => ({ Accept: 'application/json', ...getApiAuthHeaders() })
