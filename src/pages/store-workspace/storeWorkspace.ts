import type { BaseRecord, Store } from '../../types/models'
import { listPlatformRecords } from '../../services/dataRepository'

export const storeProductResource = (storeId: string) => `store-products:${encodeURIComponent(storeId)}`
export const storeCategoryResource = (storeId: string) => `store-categories:${encodeURIComponent(storeId)}`
export const storeStockAdjustmentResource = (storeId: string) => `store-stock-adjustments:${encodeURIComponent(storeId)}`
export const storeOrderResource = (storeId: string) => `store-orders:${encodeURIComponent(storeId)}`

export async function getStoreById(storeId: string): Promise<Store | null> {
  const result = await listPlatformRecords('stores', storeId, 'All', 1, 100)
  const found = result.items.find((row) => row.id === storeId)
  return (found as Store | undefined) ?? null
}

export function isStoreScopedRecordOwnedBy(record: BaseRecord, storeId: string): boolean {
  return String(record.storeId ?? '') === storeId
}

export const isStoreProductOwnedBy = isStoreScopedRecordOwnedBy
export const isStoreCategoryOwnedBy = isStoreScopedRecordOwnedBy
export const isStoreStockAdjustmentOwnedBy = isStoreScopedRecordOwnedBy
export const isStoreOrderOwnedBy = isStoreScopedRecordOwnedBy

export const productFields = ['name', 'slug', 'description', 'price', 'image', 'category', 'stockQuantity'] as const
export const categoryFields = ['name', 'slug', 'description', 'image', 'status'] as const

export function getLowStockThreshold(record: BaseRecord, fallback = 5): number {
  const raw = record.lowStockThreshold
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? ''))
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : fallback
}

export function publishLabel(status: string): string {
  return status === 'Active' ? 'Published' : 'Unpublished'
}