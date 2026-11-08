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
import type { ApiResponse,Payment } from '../../types/models'
export const paymentsApi={...createResourceApi<Payment>(endpoints.payments),refund:(id:string,amount:number,reason:string)=>request<ApiResponse<Payment>>(`${endpoints.payments}/${encodeURIComponent(id)}/refunds`,{method:'POST',body:JSON.stringify({amount,reason})})}
