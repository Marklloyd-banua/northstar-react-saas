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
import type { ApiResponse,Subscription } from '../../types/models'
export const subscriptionsApi={...createResourceApi<Subscription>(endpoints.subscriptions),cancel:(id:string)=>request<ApiResponse<Subscription>>(`${endpoints.subscriptions}/${encodeURIComponent(id)}/cancel`,{method:'POST'}),reactivate:(id:string)=>request<ApiResponse<Subscription>>(`${endpoints.subscriptions}/${encodeURIComponent(id)}/reactivate`,{method:'POST'})}
