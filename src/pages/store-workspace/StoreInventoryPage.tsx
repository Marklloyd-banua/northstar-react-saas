import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { BaseRecord } from '../../types/models'
import { listPlatformRecords, savePlatformRecord } from '../../services/dataRepository'
import { toApiError } from '../../services/api/errorHandler'
import { Modal } from '../../components/common/Modal'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { repositoryConfig } from '../../services/repositoryConfig'
import type { StoreWorkspaceContext } from './StoreWorkspaceLayout'
import { getStoreById, isStoreProductOwnedBy, isStoreStockAdjustmentOwnedBy, storeProductResource, storeStockAdjustmentResource } from './storeWorkspace'

type StockState = 'All' | 'In stock' | 'Low stock' | 'Out of stock'

function asInt(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? ''))
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

function thresholdOf(row: BaseRecord): number {
  const raw = row.lowStockThreshold
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? ''))
  if (Number.isFinite(n) && n >= 0) return Math.trunc(n)
  return 5
}

function stockStatusOf(row: BaseRecord): Exclude<StockState, 'All'> {
  const qty = Math.max(0, asInt(row.stockQuantity, 0))
  if (qty <= 0) return 'Out of stock'
  if (qty <= thresholdOf(row)) return 'Low stock'
  return 'In stock'
}

function lastUpdatedOf(row: BaseRecord): string {
  const v = row.inventoryUpdatedAt ?? row.updatedAt ?? row.createdAt
  if (!v) return '—'
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const t = Date.parse(s)
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : s
}

function statusBadge(status: Exclude<StockState, 'All'>): string {
  if (status === 'Out of stock') return 'Failed'
  if (status === 'Low stock') return 'Pending'
  return 'Active'
}

function nowIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function StoreInventoryPage() {
  const { store, storeId } = useOutletContext<StoreWorkspaceContext>()
  const { toast } = useApp()
  const { hasPermission, user } = useAuth()
  const mockMode = repositoryConfig.useMockApi
  const productResource = storeProductResource(storeId)
  const adjustmentResource = storeStockAdjustmentResource(storeId)

  const canAdjust = hasPermission('resource:edit') // Administrator + Manager
  const canView = hasPermission('dashboard:access')

  const [rows, setRows] = useState<BaseRecord[]>([])
  const [history, setHistory] = useState<BaseRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<StockState>('All')
  const [modal, setModal] = useState<'adjust' | 'set' | 'threshold' | 'history' | null>(null)
  const [selected, setSelected] = useState<BaseRecord | null>(null)
  const [historyQuery, setHistoryQuery] = useState('')
  const [historyProductId, setHistoryProductId] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // adjust/set form
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract'>('add')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [setQuantity, setSetQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [thresholdValue, setThresholdValue] = useState('')

  const verifyStore = useCallback(async () => {
    const found = await getStoreById(storeId)
    if (!found) throw { message: 'Store not found. Inventory operations are blocked for safety.', code: 'NOT_FOUND' }
    return found
  }, [storeId])

  const loadInventory = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      await verifyStore()
      const data = await listPlatformRecords(productResource, '', 'All', 1, 500)
      const items = data.items.filter((row) => isStoreProductOwnedBy(row, storeId))
      setRows(items)
    } catch (err) {
      setLoadError(toApiError(err).message)
      setRows([])
    } finally { setLoading(false) }
  }, [productResource, storeId, verifyStore])

  const loadHistory = useCallback(async (productId?: string) => {
    try {
      await verifyStore()
      const data = await listPlatformRecords(adjustmentResource, '', 'All', 1, 500)
      let items = data.items.filter((row) => isStoreStockAdjustmentOwnedBy(row, storeId))
      if (productId) items = items.filter((row) => String(row.productId ?? '') === productId)
      items.sort((a, b) => String(b.timestamp ?? b.createdAt ?? '').localeCompare(String(a.timestamp ?? a.createdAt ?? '')))
      setHistory(items)
    } catch (err) {
      setHistory([])
      toast(toApiError(err).message, 'error')
    }
  }, [adjustmentResource, storeId, verifyStore, toast])

  useEffect(() => { void loadInventory() }, [loadInventory])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (stockFilter !== 'All' && stockStatusOf(row) !== stockFilter) return false
      if (!q) return true
      return [row.name, row.sku, row.id, row.category].some((v) => String(v ?? '').toLowerCase().includes(q))
    })
  }, [rows, query, stockFilter])

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase()
    return history.filter((row) => {
      if (historyProductId && String(row.productId ?? '') !== historyProductId) return false
      if (!q) return true
      return [row.productName, row.productId, row.reason, row.actorName, row.sku].some((v) => String(v ?? '').toLowerCase().includes(q))
    })
  }, [history, historyQuery, historyProductId])

  const openAdjust = (row: BaseRecord) => {
    if (!canAdjust) return
    if (!isStoreProductOwnedBy(row, storeId)) { toast('This product does not belong to the selected store.', 'error'); return }
    setSelected(row); setAdjustMode('add'); setAdjustAmount(''); setReason(''); setError(''); setModal('adjust')
  }
  const openSet = (row: BaseRecord) => {
    if (!canAdjust) return
    if (!isStoreProductOwnedBy(row, storeId)) { toast('This product does not belong to the selected store.', 'error'); return }
    setSelected(row); setSetQuantity(String(Math.max(0, asInt(row.stockQuantity, 0)))); setReason(''); setConfirmed(false); setError(''); setModal('set')
  }
  const openThreshold = (row: BaseRecord) => {
    if (!canAdjust) return
    if (!isStoreProductOwnedBy(row, storeId)) { toast('This product does not belong to the selected store.', 'error'); return }
    setSelected(row); setThresholdValue(String(thresholdOf(row))); setReason(''); setError(''); setModal('threshold')
  }
  const openHistory = (row?: BaseRecord) => {
    setHistoryProductId(row?.id ? String(row.id) : '')
    setHistoryQuery('')
    setModal('history')
    void loadHistory(row?.id ? String(row.id) : undefined)
  }

  const createAdjustment = async (product: BaseRecord, previousQuantity: number, newQuantity: number, adjustmentAmount: number, reasonText: string) => {
    const now = new Date().toISOString()
    const payload: Record<string, string | number> = {
      storeId, // forced from route
      productId: String(product.id),
      productName: String(product.name ?? ''),
      sku: String(product.sku ?? ''),
      previousQuantity,
      adjustmentAmount,
      newQuantity,
      reason: reasonText,
      timestamp: now,
      actorId: String(user?.id ?? ''),
      actorName: String(user?.name ?? ''),
      actorEmail: String(user?.email ?? ''),
      status: 'Active',
    }
    await savePlatformRecord(adjustmentResource, payload)
  }

  const applyStockUpdate = async (product: BaseRecord, newQuantity: number, adjustmentAmount: number, reasonText: string, extra?: Record<string, string | number>) => {
    if (!isStoreProductOwnedBy(product, storeId)) throw { message: 'This product does not belong to the selected store.', code: 'FORBIDDEN' }
    await verifyStore()
    const previousQuantity = Math.max(0, asInt(product.stockQuantity, 0))
    const payload: Record<string, string | number> = {
      storeId, // forced
      stockQuantity: newQuantity,
      inventoryUpdatedAt: nowIsoDate(),
      ...extra,
    }
    await savePlatformRecord(productResource, payload, String(product.id))
    await createAdjustment(product, previousQuantity, newQuantity, adjustmentAmount, reasonText)
  }

  const submitAdjust = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy || !selected || !canAdjust) return
    const amount = Number(adjustAmount)
    if (!Number.isInteger(amount) || amount <= 0) { setError('Adjustment amount must be a whole number greater than 0.'); return }
    if (!reason.trim()) { setError('Reason is required for stock adjustments.'); return }
    const previous = Math.max(0, asInt(selected.stockQuantity, 0))
    const delta = adjustMode === 'add' ? amount : -amount
    const next = previous + delta
    if (next < 0) { setError(`Cannot subtract ${amount}. Current stock is ${previous}; resulting quantity cannot be negative.`); return }
    setBusy(true); setError('')
    try {
      await applyStockUpdate(selected, next, delta, reason.trim())
      setModal(null); await loadInventory()
      toast(`Stock ${adjustMode === 'add' ? 'increased' : 'decreased'} for ${String(selected.name)}${mockMode ? ' in demo data' : ''}.`, 'success')
    } catch (err) { setError(toApiError(err).message); toast(toApiError(err).message, 'error') }
    finally { setBusy(false) }
  }

  const submitSet = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy || !selected || !canAdjust) return
    const qty = Number(setQuantity)
    if (!Number.isInteger(qty) || qty < 0) { setError('Stock quantity must be a whole number of 0 or greater.'); return }
    if (!reason.trim()) { setError('Reason is required when setting stock quantity.'); return }
    if (!confirmed) { setError('Please confirm that you want to set the stock quantity.'); return }
    const previous = Math.max(0, asInt(selected.stockQuantity, 0))
    setBusy(true); setError('')
    try {
      await applyStockUpdate(selected, qty, qty - previous, reason.trim())
      setModal(null); await loadInventory()
      toast(`Stock quantity set for ${String(selected.name)}${mockMode ? ' in demo data' : ''}.`, 'success')
    } catch (err) { setError(toApiError(err).message); toast(toApiError(err).message, 'error') }
    finally { setBusy(false) }
  }

  const submitThreshold = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy || !selected || !canAdjust) return
    const qty = Number(thresholdValue)
    if (!Number.isInteger(qty) || qty < 0) { setError('Low-stock threshold must be a whole number of 0 or greater.'); return }
    if (!isStoreProductOwnedBy(selected, storeId)) { toast('This product does not belong to the selected store.', 'error'); return }
    setBusy(true); setError('')
    try {
      await verifyStore()
      await savePlatformRecord(productResource, { storeId, lowStockThreshold: qty, inventoryUpdatedAt: nowIsoDate() }, String(selected.id))
      setModal(null); await loadInventory()
      toast(`Low-stock threshold updated for ${String(selected.name)}${mockMode ? ' in demo data' : ''}.`, 'success')
    } catch (err) { setError(toApiError(err).message); toast(toApiError(err).message, 'error') }
    finally { setBusy(false) }
  }

  if (!canView) return <div className="empty-state" role="alert"><strong>Access restricted</strong><span>You do not have permission to view inventory.</span></div>

  const selectedPrev = selected ? Math.max(0, asInt(selected.stockQuantity, 0)) : 0
  const adjustPreview = (() => {
    if (modal !== 'adjust' || !selected) return null
    const amount = Number(adjustAmount)
    if (!Number.isInteger(amount) || amount <= 0) return null
    const delta = adjustMode === 'add' ? amount : -amount
    return selectedPrev + delta
  })()

  return (
    <>
      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Inventory</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 12 }}>Store-scoped inventory for <strong>{store.name}</strong> ({storeId}). Stock changes update the corresponding product record (single source of truth) and create adjustment history.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline-secondary" onClick={() => openHistory()}><i className="bi bi-clock-history me-2" />Adjustment history</button>
        </div>
      </div>

      {mockMode && <div className="settings-notice" role="status"><i className="bi bi-info-circle" /> Demo mode: inventory changes update browser-local demo product data and adjustment history for this store only.</div>}

      <section className="panel resource-panel">
        <div className="resource-toolbar">
          <div className="table-title"><h2>Inventory by product</h2><span className="table-count">{filteredRows.length} of {rows.length}</span></div>
          <div className="table-filters">
            <label className="table-search"><i className="bi bi-search" /><input aria-label="Search inventory" placeholder="Search name, SKU, ID..." value={query} onChange={(e) => setQuery(e.target.value)} /></label>
            <select className="form-select status-filter" aria-label="Filter by stock status" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as StockState)}>
              <option value="All">All stock</option><option value="In stock">In stock</option><option value="Low stock">Low stock</option><option value="Out of stock">Out of stock</option>
            </select>
            <button className="btn btn-outline-secondary" title="Refresh inventory" onClick={() => void loadInventory()}><i className="bi bi-arrow-clockwise" /></button>
          </div>
        </div>

        {loadError ? <div className="error-state"><i className="bi bi-exclamation-triangle" /><strong>Couldn’t load inventory</strong><span>{loadError}</span><button className="btn btn-outline-secondary btn-sm" onClick={() => void loadInventory()}>Try again</button></div>
          : loading ? <div className="loading-skeleton"><span /><span /><span /><span /></div>
            : <div className="table-responsive"><table className="table align-middle data-table"><thead><tr><th>Product</th><th>SKU</th><th>Current stock</th><th>Low-stock threshold</th><th>Stock status</th><th>Last updated</th><th className="text-end">Actions</th></tr></thead><tbody>
              {filteredRows.map((row) => {
                const state = stockStatusOf(row)
                const qty = Math.max(0, asInt(row.stockQuantity, 0))
                return <tr key={row.id}>
                  <td><strong className="record-id" style={{ color: 'var(--ink)', fontSize: 11 }}>{String(row.name ?? row.id)}</strong><div style={{ color: 'var(--muted)', fontSize: 9 }}>{row.id}</div></td>
                  <td>{String(row.sku ?? '—') || '—'}</td>
                  <td>{qty.toLocaleString()}</td>
                  <td>{thresholdOf(row).toLocaleString()}</td>
                  <td><StatusBadge status={statusBadge(state)} /> <span style={{ fontSize: 9, color: 'var(--muted)' }}>{state}</span></td>
                  <td>{lastUpdatedOf(row)}</td>
                  <td><div className="row-actions">
                    <button className="btn-icon" aria-label="View adjustment history" title="Adjustment history" onClick={() => openHistory(row)}><i className="bi bi-clock-history" /></button>
                    {canAdjust && <button className="btn-icon" aria-label="Adjust stock" title="Adjust stock (add/subtract)" onClick={() => openAdjust(row)}><i className="bi bi-plus-slash-minus" /></button>}
                    {canAdjust && <button className="btn-icon" aria-label="Set stock quantity" title="Set stock quantity" onClick={() => openSet(row)}><i className="bi bi-123" /></button>}
                    {canAdjust && <button className="btn-icon" aria-label="Configure low-stock threshold" title="Configure low-stock threshold" onClick={() => openThreshold(row)}><i className="bi bi-sliders" /></button>}
                  </div></td>
                </tr>
              })}
              {!filteredRows.length && <tr><td colSpan={7}><div className="empty-state"><i className="bi bi-box-seam" /><strong>No inventory records found</strong><span>{rows.length ? 'No products match the current search/filter for this store.' : `This store has no products yet. Add products in the Products tab; inventory is derived from store-scoped products.`}</span></div></td></tr>}
            </tbody></table></div>}
      </section>

      {modal === 'adjust' && selected && <Modal title={`Adjust stock: ${String(selected.name)}`} onClose={() => { setError(''); setModal(null) }}>
        <form onSubmit={submitAdjust} noValidate>
          <div className="modal-body form-grid">
            <div style={{ gridColumn: '1 / -1' }}><p className="form-hint" style={{ margin: 0 }}>Product <strong>{String(selected.name)}</strong> ({String(selected.sku ?? selected.id)}) · Current stock: <strong>{selectedPrev.toLocaleString()}</strong> · Store <strong>{storeId}</strong></p></div>
            <div>
              <label htmlFor="adjust-mode">Adjustment type <span aria-hidden="true">*</span></label>
              <select id="adjust-mode" className="form-control" value={adjustMode} onChange={(e) => setAdjustMode(e.target.value as 'add' | 'subtract')} disabled={busy}>
                <option value="add">Add stock</option><option value="subtract">Subtract stock</option>
              </select>
            </div>
            <div>
              <label htmlFor="adjust-amount">Amount <span aria-hidden="true">*</span></label>
              <input id="adjust-amount" className="form-control" type="number" min={1} step={1} inputMode="numeric" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} disabled={busy} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="adjust-reason">Reason <span aria-hidden="true">*</span></label>
              <textarea id="adjust-reason" className="form-control" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Received shipment, damaged items, manual correction" disabled={busy} required />
            </div>
            {adjustPreview !== null && <div style={{ gridColumn: '1 / -1' }} className={`settings-notice ${adjustPreview < 0 ? '' : ''}`} role="status"><i className={`bi ${adjustPreview < 0 ? 'bi-exclamation-triangle' : 'bi-calculator'}`} /> New quantity preview: <strong>{adjustPreview.toLocaleString()}</strong> ({adjustMode === 'add' ? '+' : '-'}{Math.abs(Number(adjustAmount) || 0).toLocaleString()}).{adjustPreview < 0 ? ' Negative stock is not allowed.' : ''}</div>}
            {error && <p className="form-hint text-danger" role="alert" style={{ gridColumn: '1 / -1' }}><i className="bi bi-exclamation-circle me-1" />{error}</p>}
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy || (adjustPreview !== null && adjustPreview < 0)}>{busy ? 'Saving…' : 'Apply adjustment'}</button></div>
        </form>
      </Modal>}

      {modal === 'set' && selected && <Modal title={`Set stock quantity: ${String(selected.name)}`} onClose={() => { setError(''); setConfirmed(false); setModal(null) }}>
        <form onSubmit={submitSet} noValidate>
          <div className="modal-body form-grid">
            <div style={{ gridColumn: '1 / -1' }}><p className="form-hint" style={{ margin: 0 }}>Product <strong>{String(selected.name)}</strong> ({String(selected.sku ?? selected.id)}) · Current stock: <strong>{selectedPrev.toLocaleString()}</strong>. Setting an absolute quantity creates an adjustment record for the difference.</p></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="set-quantity">New stock quantity <span aria-hidden="true">*</span></label>
              <input id="set-quantity" className="form-control" type="number" min={0} step={1} inputMode="numeric" value={setQuantity} onChange={(e) => { setSetQuantity(e.target.value); setConfirmed(false) }} disabled={busy} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="set-reason">Reason <span aria-hidden="true">*</span></label>
              <textarea id="set-reason" className="form-control" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Stocktake correction, system reconciliation" disabled={busy} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 400 }}>
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={busy} />
                <span>I confirm I want to set stock for <strong>{String(selected.name)}</strong> to <strong>{Number.isInteger(Number(setQuantity)) && Number(setQuantity) >= 0 ? Number(setQuantity).toLocaleString() : '—'}</strong> (from {selectedPrev.toLocaleString()}).</span>
              </label>
            </div>
            {error && <p className="form-hint text-danger" role="alert" style={{ gridColumn: '1 / -1' }}><i className="bi bi-exclamation-circle me-1" />{error}</p>}
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy || !confirmed}>{busy ? 'Saving…' : 'Set quantity'}</button></div>
        </form>
      </Modal>}

      {modal === 'threshold' && selected && <Modal title={`Low-stock threshold: ${String(selected.name)}`} onClose={() => { setError(''); setModal(null) }}>
        <form onSubmit={submitThreshold} noValidate>
          <div className="modal-body form-grid">
            <div style={{ gridColumn: '1 / -1' }}><p className="form-hint" style={{ margin: 0 }}>Configure when <strong>{String(selected.name)}</strong> is considered low stock. Current stock: <strong>{selectedPrev.toLocaleString()}</strong>.</p></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="threshold-value">Low-stock threshold <span aria-hidden="true">*</span></label>
              <input id="threshold-value" className="form-control" type="number" min={0} step={1} inputMode="numeric" value={thresholdValue} onChange={(e) => setThresholdValue(e.target.value)} disabled={busy} required />
              <p className="form-hint" style={{ marginTop: 4, marginBottom: 0 }}>Products with stock at or below this value (and above 0) are marked low stock. 0 means only out-of-stock is flagged by threshold logic.</p>
            </div>
            {error && <p className="form-hint text-danger" role="alert" style={{ gridColumn: '1 / -1' }}><i className="bi bi-exclamation-circle me-1" />{error}</p>}
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save threshold'}</button></div>
        </form>
      </Modal>}

      {modal === 'history' && <Modal title="Stock adjustment history" onClose={() => setModal(null)}>
        <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
          <div className="table-filters" style={{ margin: 0 }}>
            <label className="table-search"><i className="bi bi-search" /><input aria-label="Search adjustment history" placeholder="Search product, reason, actor..." value={historyQuery} onChange={(e) => setHistoryQuery(e.target.value)} /></label>
            <select className="form-select status-filter" aria-label="Filter history by product" value={historyProductId} onChange={(e) => { const v = e.target.value; setHistoryProductId(v); void loadHistory(v || undefined) }}>
              <option value="">All products</option>
              {rows.map((r) => <option key={r.id} value={String(r.id)}>{String(r.name ?? r.id)}</option>)}
            </select>
          </div>
          <div className="table-responsive" style={{ maxHeight: 360, overflow: 'auto' }}>
            <table className="table align-middle data-table"><thead><tr><th>Timestamp</th><th>Product</th><th>Previous</th><th>Change</th><th>New</th><th>Reason</th><th>Acting user</th></tr></thead><tbody>
              {filteredHistory.map((row) => {
                const delta = asInt(row.adjustmentAmount, 0)
                return <tr key={row.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{String(row.timestamp ?? row.createdAt ?? '—')}</td>
                  <td><strong style={{ fontSize: 11 }}>{String(row.productName ?? row.productId ?? '—')}</strong><div style={{ color: 'var(--muted)', fontSize: 9 }}>{String(row.productId ?? '')}{row.sku ? ` · ${String(row.sku)}` : ''}</div></td>
                  <td>{asInt(row.previousQuantity, 0).toLocaleString()}</td>
                  <td style={{ color: delta > 0 ? 'var(--bs-success, #198754)' : delta < 0 ? 'var(--bs-danger, #dc3545)' : undefined }}>{delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()}</td>
                  <td>{asInt(row.newQuantity, 0).toLocaleString()}</td>
                  <td>{String(row.reason ?? '—')}</td>
                  <td>{String(row.actorName || row.actorEmail || row.actorId || '—')}{row.actorEmail && row.actorName ? <div style={{ color: 'var(--muted)', fontSize: 9 }}>{String(row.actorEmail)}</div> : null}</td>
                </tr>
              })}
              {!filteredHistory.length && <tr><td colSpan={7}><div className="empty-state"><i className="bi bi-clock-history" /><strong>No adjustment history</strong><span>No stock adjustments match the current filter for this store.</span></div></td></tr>}
            </tbody></table>
          </div>
          <p className="form-hint" style={{ margin: 0 }}><i className="bi bi-lock me-1" />History is store-scoped to <strong>{storeId}</strong>. Records are created by inventory actions (adjust/set quantity).</p>
        </div>
        <div className="modal-actions"><button className="btn btn-outline-secondary" onClick={() => setModal(null)}>Close</button></div>
      </Modal>}
    </>
  )
}
