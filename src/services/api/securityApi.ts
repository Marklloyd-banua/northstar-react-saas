/**
 * @deprecated-scaffold Not consumed by the active UI. The canonical active directory
 * CRUD path is `src/services/dataRepository.ts` + `platformResourceApiRepository.ts`
 * using `directoryEndpoints`/`PlatformResourceRepository` contracts.
 * Keep for future specialized/domain API work; align contracts before wiring.
 * Do not delete without approval. No backend implemented in this phase.
 */

import { request } from './http'
import { endpoints } from './endpoints'
import type { ApiResponse,BaseRecord } from '../../types/models'
export const securityApi={sessions:()=>request<ApiResponse<BaseRecord[]>>(endpoints.sessions),revokeSession:(id:string)=>request<void>(`${endpoints.sessions}/${encodeURIComponent(id)}`,{method:'DELETE'}),events:()=>request<ApiResponse<BaseRecord[]>>(endpoints.securityEvents)}
