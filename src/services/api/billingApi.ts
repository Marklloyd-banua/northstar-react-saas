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
import type { ApiResponse,Invoice } from '../../types/models'
export const billingApi={...createResourceApi<Invoice>(endpoints.invoices),send:(id:string)=>request<ApiResponse<Invoice>>(`${endpoints.invoices}/${encodeURIComponent(id)}/send`,{method:'POST'}),void:(id:string)=>request<ApiResponse<Invoice>>(`${endpoints.invoices}/${encodeURIComponent(id)}/void`,{method:'POST'})}
