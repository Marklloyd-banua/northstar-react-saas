import type { BaseRecord, PaginatedResponse } from '../../types/models'
import type { ListPlatformRecordsParams, PlatformResourceRepository } from '../platformRepository'
import { normalizeListParams } from '../platformRepository'
import { directoryEndpoints } from './endpoints'
import { request } from './http'

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return !!value && typeof value === 'object' && Array.isArray((value as PaginatedResponse<T>).items)
    && typeof (value as PaginatedResponse<T>).total === 'number'
}

function normalizePaginatedResponse(payload: unknown, fallback: { page: number; pageSize: number }): PaginatedResponse<BaseRecord> {
  if (isPaginatedResponse<BaseRecord>(payload)) return payload
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    if (isPaginatedResponse<BaseRecord>(obj.data)) return obj.data
    if (Array.isArray(obj.items)) {
      return {
        items: obj.items as BaseRecord[],
        page: typeof obj.page === 'number' ? obj.page : fallback.page,
        pageSize: typeof obj.pageSize === 'number' ? obj.pageSize : fallback.pageSize,
        total: typeof obj.total === 'number' ? obj.total : (obj.items as unknown[]).length,
      }
    }
    if (Array.isArray(obj.data)) {
      const items = obj.data as BaseRecord[]
      const meta = (obj.meta && typeof obj.meta === 'object' ? obj.meta : obj.pagination && typeof obj.pagination === 'object' ? obj.pagination : {}) as Record<string, unknown>
      return {
        items,
        page: typeof meta.page === 'number' ? meta.page : fallback.page,
        pageSize: typeof meta.pageSize === 'number' ? meta.pageSize : fallback.pageSize,
        total: typeof meta.total === 'number' ? meta.total : items.length,
      }
    }
  }
  // Conservative fallback: avoid inventing success; surface a clear error if shape is unexpected.
  throw { message: 'The API returned an unexpected list response shape.', code: 'INVALID_RESPONSE' }
}

function normalizeRecordResponse(payload: unknown): BaseRecord {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    const candidate = obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data) ? obj.data : payload
    if (candidate && typeof candidate === 'object' && typeof (candidate as BaseRecord).id === 'string') return candidate as BaseRecord
  }
  throw { message: 'The API returned an unexpected record response shape.', code: 'INVALID_RESPONSE' }
}

function parseScopedStoreResource(resource: string, prefix: 'store-products' | 'store-categories' | 'store-stock-adjustments' | 'store-orders'): { storeId: string } | null {
  const match = new RegExp(`^${prefix.replace(/-/g, '\\-')}:(.+)$`).exec(resource)
  return match ? { storeId: decodeURIComponent(match[1]) } : null
}

/**
 * Active directory API adapter for `PlatformResourceRepository`.
 * Uses authoritative `directoryEndpoints` and the canonical directory contracts
 * expected by `dataRepository` consumers (no UI/dataRepository signature changes).
 * Supports store-scoped resources for future API mapping (no backend introduced).
 */
function endpoint(resource: string): string {
  const storeProducts = parseScopedStoreResource(resource, 'store-products')
  if (storeProducts) return `/stores/${encodeURIComponent(storeProducts.storeId)}/products`
  const storeCategories = parseScopedStoreResource(resource, 'store-categories')
  if (storeCategories) return `/stores/${encodeURIComponent(storeCategories.storeId)}/categories`
  const stockAdjustments = parseScopedStoreResource(resource, 'store-stock-adjustments')
  if (stockAdjustments) return `/stores/${encodeURIComponent(stockAdjustments.storeId)}/stock-adjustments`
  const storeOrders = parseScopedStoreResource(resource, 'store-orders')
  if (storeOrders) return `/stores/${encodeURIComponent(storeOrders.storeId)}/orders`
  return directoryEndpoints[resource] ?? `/${resource}`
}

function queryString(params: Required<ListPlatformRecordsParams>): string {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) })
  if (params.query) query.set('search', params.query)
  if (params.status !== 'All') query.set('status', params.status)
  if (params.sortBy) query.set('sortBy', params.sortBy)
  query.set('sortDirection', params.sortDirection)
  return query.toString()
}

export const platformResourceApiRepository: PlatformResourceRepository = {
  async listRecords(params: ListPlatformRecordsParams): Promise<PaginatedResponse<BaseRecord>> {
    const p = normalizeListParams(params)
    const payload = await request<unknown>(`${endpoint(p.resource)}?${queryString(p)}`)
    return normalizePaginatedResponse(payload, { page: p.page, pageSize: p.pageSize })
  },
  async saveRecord(resource: string, value: Partial<BaseRecord>, id?: string): Promise<BaseRecord> {
    const path = id ? `${endpoint(resource)}/${encodeURIComponent(id)}` : endpoint(resource)
    const payload = await request<unknown>(path, {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(value),
    })
    return normalizeRecordResponse(payload)
  },
  async removeRecord(resource: string, id: string): Promise<void> {
    return request<void>(`${endpoint(resource)}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
  async updateStatus(resource: string, id: string, status: BaseRecord['status']): Promise<void> {
    const storeProducts = parseScopedStoreResource(resource, 'store-products')
    const storeCategories = parseScopedStoreResource(resource, 'store-categories')
    const storeOrders = parseScopedStoreResource(resource, 'store-orders')
    if (!storeProducts && !storeCategories && !storeOrders && !['stores', 'tenants'].includes(resource)) {
      throw { message: `Status changes are not configured for ${resource}.`, code: 'UNSUPPORTED_ACTION' }
    }
    return request<void>(`${endpoint(resource)}/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
