/**
 * @deprecated-scaffold Not consumed by the active UI. The canonical active directory
 * CRUD path is `src/services/dataRepository.ts` + `platformResourceApiRepository.ts`
 * using `directoryEndpoints`/`PlatformResourceRepository` contracts.
 * Keep for future specialized/domain API work; align contracts before wiring.
 * Do not delete without approval. No backend implemented in this phase.
 */

import { request } from './http'
import type { ApiResponse,BaseRecord,FilterParams,PaginatedResponse } from '../../types/models'

/**
 * Generic typed resource API factory (scaffolding for domain-specific modules).
 * The active directory UI currently consumes `src/services/dataRepository.ts` (repository facade).
 * Keep signatures/contracts aligned when connecting real backend resources.
 */
export function createResourceApi<T extends BaseRecord>(endpoint:string){return {
 list:(params:FilterParams={})=>{const query=new URLSearchParams();Object.entries(params).forEach(([key,value])=>{if(value!==undefined)query.set(key,String(value))});return request<PaginatedResponse<T>>(`${endpoint}${query.size?`?${query.toString()}`:''}`)},
 get:(id:string)=>request<ApiResponse<T>>(`${endpoint}/${encodeURIComponent(id)}`),
 create:(payload:Partial<T>)=>request<ApiResponse<T>>(endpoint,{method:'POST',body:JSON.stringify(payload)}),
 update:(id:string,payload:Partial<T>)=>request<ApiResponse<T>>(`${endpoint}/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(payload)}),
 remove:(id:string)=>request<void>(`${endpoint}/${encodeURIComponent(id)}`,{method:'DELETE'}),
}}
