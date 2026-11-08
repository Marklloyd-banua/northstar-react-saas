import type { AuthAdapter } from './types'
import * as mockAuthAdapter from './mockAuthAdapter'

/** Returns the active auth adapter. Mock is the default and preserves demo behavior/credentials. */
export function getAuthAdapter(): AuthAdapter {
  return mockAuthAdapter
}

export { mockAuthAdapter }
