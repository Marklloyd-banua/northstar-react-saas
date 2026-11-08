import type { BaseRecord, PaginatedResponse } from '../../types/models'
import type { ListPlatformRecordsParams, PlatformResourceRepository } from '../platformRepository'
import { normalizeListParams } from '../platformRepository'
import { listRecords, removeRecord, saveRecord, updateStatus } from './repository'

export const platformResourceMockRepository: PlatformResourceRepository = {
  async listRecords(params: ListPlatformRecordsParams): Promise<PaginatedResponse<BaseRecord>> {
    const p = normalizeListParams(params)
    return listRecords(p.resource, p.query, p.status, p.page, p.pageSize, p.sortBy, p.sortDirection)
  },
  saveRecord(resource: string, value: Partial<BaseRecord>, id?: string): Promise<BaseRecord> {
    return saveRecord(resource, value, id)
  },
  removeRecord(resource: string, id: string): Promise<void> {
    return removeRecord(resource, id)
  },
  updateStatus(resource: string, id: string, status: BaseRecord['status']): Promise<void> {
    return updateStatus(resource, id, status)
  },
}
