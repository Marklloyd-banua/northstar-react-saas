/**
 * @deprecated-scaffold Not consumed by the active UI. The canonical active directory
 * CRUD path is `src/services/dataRepository.ts` + `platformResourceApiRepository.ts`
 * using `directoryEndpoints`/`PlatformResourceRepository` contracts.
 * Keep for future specialized/domain API work; align contracts before wiring.
 * Do not delete without approval. No backend implemented in this phase.
 */

import { request } from './http'
import { endpoints } from './endpoints'
import type { ApiResponse } from '../../types/models'
export const monitoringApi={health:()=>request<ApiResponse<Record<string,unknown>>>(endpoints.monitoring),metrics:()=>request<ApiResponse<Record<string,unknown>>>('/monitoring/metrics'),incidents:()=>request<ApiResponse<Record<string,unknown>>>('/monitoring/incidents')}
