import type { BaseRecord, PaginatedResponse } from '../types/models'
import { platformResourceApiRepository } from './api/platformResourceApiRepository'
import { platformResourceMockRepository } from './mock/platformResourceMockRepository'
import type { PlatformResourceRepository, SortDirection } from './platformRepository'
import { isMockRepositoryMode } from './repositoryConfig'

/**
 * Environment-selected facade for directory/resource operations consumed by UI pages.
 * - Mock mode (`VITE_USE_MOCK_API=true`): browser-local fixtures/persistence.
 * - API mode: configurable HTTP backend via `http.ts` + API repository mapping.
 * Public function signatures are preserved for existing consumers.
 */
export const platformResourceRepository: PlatformResourceRepository = isMockRepositoryMode()
  ? platformResourceMockRepository
  : platformResourceApiRepository

export async function listPlatformRecords(
  resource: string,
  query = '',
  status = 'All',
  page = 1,
  pageSize = 8,
  sortBy = '',
  sortDirection: SortDirection = 'asc',
): Promise<PaginatedResponse<BaseRecord>> {
  return platformResourceRepository.listRecords({ resource, query, status, page, pageSize, sortBy, sortDirection })
}

export async function savePlatformRecord(resource: string, value: Partial<BaseRecord>, id?: string): Promise<BaseRecord> {
  return platformResourceRepository.saveRecord(resource, value, id)
}

export async function deletePlatformRecord(resource: string, id: string): Promise<void> {
  return platformResourceRepository.removeRecord(resource, id)
}

export async function setPlatformRecordStatus(resource: string, id: string, status: BaseRecord['status']): Promise<void> {
  return platformResourceRepository.updateStatus(resource, id, status)
}
