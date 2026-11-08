/**
 * @deprecated-scaffold Not consumed by the active UI. The canonical active directory
 * CRUD path is `src/services/dataRepository.ts` + `platformResourceApiRepository.ts`
 * using `directoryEndpoints`/`PlatformResourceRepository` contracts.
 * Keep for future specialized/domain API work; align contracts before wiring.
 * Do not delete without approval. No backend implemented in this phase.
 */

import { createResourceApi } from './resource'
import { endpoints } from './endpoints'
import type { Role } from '../../types/models'
export const rolesApi={...createResourceApi<Role>(endpoints.roles),permissions:()=>import('./http').then(({request})=>request(endpoints.permissions))}
