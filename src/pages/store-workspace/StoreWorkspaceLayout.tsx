import { NavLink, Navigate, Outlet, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import type { Store } from '../../types/models'
import { StatusBadge } from '../../components/common/StatusBadge'
import { getStoreById } from './storeWorkspace'

const tabs = [
  { to: 'overview', label: 'Overview', icon: 'bi-grid-1x2' },
  { to: 'products', label: 'Products', icon: 'bi-box-seam' },
  { to: 'categories', label: 'Categories', icon: 'bi-tags' },
  { to: 'orders', label: 'Orders', icon: 'bi-bag-check' },
  { to: 'inventory', label: 'Inventory', icon: 'bi-clipboard-data' },
  { to: 'settings', label: 'Store Settings', icon: 'bi-gear' },
]

export type StoreWorkspaceContext = {
  store: Store
  storeId: string
  /** Updates the workspace header/store snapshot (e.g. after settings save). Pass a saved store to apply immediately; omit to re-fetch via the existing repository. */
  refreshStore: (next?: Store) => Promise<void>
}

export function StoreWorkspaceLayout() {
  const { storeId } = useParams<{ storeId: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!storeId) { setError('Missing store ID.'); setLoading(false); return }
    setLoading(true); setError('')
    void getStoreById(storeId).then((result) => {
      if (!active) return
      if (!result) setError('Store not found.')
      setStore(result)
    }).catch((err) => {
      if (!active) return
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unable to load store.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [storeId])

  const refreshStore = useCallback(async (next?: Store) => {
    if (next) {
      // Only accept updates for the active route store (isolation).
      if (!storeId || String(next.id) !== storeId) return
      setStore(next)
      return
    }
    if (!storeId) return
    const result = await getStoreById(storeId)
    if (result && String(result.id) === storeId) setStore(result)
  }, [storeId])

  if (!storeId) return <Navigate to="/stores" replace />
  if (loading) return <div className="page-loading"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div><span>Loading store workspace</span></div>
  if (error || !store) return <div className="error-state"><i className="bi bi-exclamation-triangle"/><strong>Store workspace unavailable</strong><span>{error || 'Store not found.'}</span><NavLink className="btn btn-outline-secondary btn-sm" to="/stores">Back to stores</NavLink></div>

  return (
    <div className="store-workspace">
      <div className="page-heading" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-eyebrow"><NavLink to="/stores">Stores</NavLink><span>/</span><b>{store.name}</b></div>
          <h1>{store.name}</h1>
          <p>{store.domain} · {store.id} · <StatusBadge status={String(store.status)} /></p>
        </div>
      </div>
      <nav className="store-workspace-tabs" aria-label="Store workspace">
        {tabs.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.to === 'overview'} className={({ isActive }) => `store-workspace-tab${isActive ? ' active' : ''}`}>
            <i className={`bi ${tab.icon}`} /><span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
      <Outlet context={{ store, storeId, refreshStore } satisfies StoreWorkspaceContext} />
    </div>
  )
}