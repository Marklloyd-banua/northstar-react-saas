import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const mockMode = env.VITE_USE_MOCK_API

  if (mockMode !== 'true' && mockMode !== 'false') {
    throw new Error('Set VITE_USE_MOCK_API explicitly to true or false. Copy .env.example to .env.local for local development.')
  }

  const timeout = env.VITE_API_TIMEOUT
  if (timeout && (!Number.isFinite(Number(timeout)) || Number(timeout) <= 0)) {
    throw new Error('VITE_API_TIMEOUT must be a positive number of milliseconds.')
  }

  if (mockMode === 'false') {
    if (!env.VITE_API_BASE_URL) {
      throw new Error('VITE_API_BASE_URL is required when VITE_USE_MOCK_API=false.')
    }

    let apiUrl: URL
    try {
      apiUrl = new URL(env.VITE_API_BASE_URL)
    } catch {
      throw new Error('VITE_API_BASE_URL must be an absolute HTTP or HTTPS URL.')
    }

    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)
    if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
      throw new Error('VITE_API_BASE_URL must not contain credentials, query parameters, or a fragment.')
    }
    if (!['http:', 'https:'].includes(apiUrl.protocol) || (!isLocal && apiUrl.protocol !== 'https:')) {
      throw new Error('VITE_API_BASE_URL must use HTTPS outside localhost.')
    }
  }

  return { plugins: [react()] }
})
