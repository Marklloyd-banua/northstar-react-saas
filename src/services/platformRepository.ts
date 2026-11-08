import type { BaseRecord, PaginatedResponse } from '../types/models'

export type SortDirection = 'asc' | 'desc'

export interface ListPlatformRecordsParams {
  resource: string
  query?: string
  status?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: SortDirection
}

/**
 * UI-facing repository contract for platform directory resources.
 * Implementations may be browser-local mock data or HTTP-backed API adapters.
 * Pages/components should depend on this contract (via `dataRepository`) rather than transport details.
 */
export interface PlatformResourceRepository {
  listRecords(params: ListPlatformRecordsParams): Promise<PaginatedResponse<BaseRecord>>
  saveRecord(resource: string, value: Partial<BaseRecord>, id?: string): Promise<BaseRecord>
  removeRecord(resource: string, id: string): Promise<void>
  updateStatus(resource: string, id: string, status: BaseRecord['status']): Promise<void>
}

export function normalizeListParams(params: ListPlatformRecordsParams): Required<ListPlatformRecordsParams> {
  return {
    resource: params.resource,
    query: params.query ?? '',
    status: params.status ?? 'All',
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 8,
    sortBy: params.sortBy ?? '',
    sortDirection: params.sortDirection ?? 'asc',
  }
}
