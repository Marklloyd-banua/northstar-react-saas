export const repositoryConfig = {
  useMockApi: import.meta.env.VITE_USE_MOCK_API === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
} as const

export function isMockRepositoryMode(): boolean {
  return repositoryConfig.useMockApi
}
