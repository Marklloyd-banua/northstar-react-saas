/**
 * @deprecated-scaffold Not consumed by the active UI. The canonical active directory
 * CRUD path is `src/services/dataRepository.ts` + `platformResourceApiRepository.ts`
 * using `directoryEndpoints`/`PlatformResourceRepository` contracts.
 * Keep for future specialized/domain API work; align contracts before wiring.
 * Do not delete without approval. No backend implemented in this phase.
 */

import { createResourceApi } from './resource'
import { endpoints } from './endpoints'
import { request } from './http'
import type { ApiResponse,Notification } from '../../types/models'
export const notificationsApi={...createResourceApi<Notification>(endpoints.notifications),send:(id:string)=>request<ApiResponse<Notification>>(`${endpoints.notifications}/${encodeURIComponent(id)}/send`,{method:'POST'})}
