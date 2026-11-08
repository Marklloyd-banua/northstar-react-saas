import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { BaseRecord, OrderAddress, OrderItem, OrderStatusHistoryEntry } from '../../types/models'
import { listPlatformRecords, savePlatformRecord } from '../../services/dataRepository'
import { toApiError } from '../../services/api/errorHandler'
import { Modal } from '../../components/common/Modal'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { repositoryConfig } from '../../services/repositoryConfig'
import type { StoreWorkspaceContext } from './StoreWorkspaceLayout'
import { getStoreById, isStoreOrderOwnedBy, storeOrderResource } from './storeWorkspace'

type PaymentFilter = 'All' | 'Unpaid' | 'Pending' | 'Paid' | 'Failed' | 'Refunded' | 'Partially paid'
type FulfillmentFilter = 'All' | 'Unfulfilled' | 'Processing' | 'Partially fulfilled' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned'

const FULFILLMENT_TRANSITIONS: Record<string, string[]> = {
  Unfulfilled: ['Processing', 'Cancelled'],
  Processing: ['Partially fulfilled', 'Shipped', 'Cancelled'],
  'Partially fulfilled': ['Shipped', 'Delivered', 'Cancelled'],
  Shipped: ['Delivered', 'Returned'],
  Delivered: ['Returned'],
  Cancelled: [],
  Returned: [],
}

function money(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(String(value ?? 0))
  return `$${(Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(value: unknown): string {
  if (!value) return '—'
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const t = Date.parse(s)
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : s
}

function asItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return {
      productId: String(row.productId ?? ''),
      productName: String(row.productName ?? ''),
      quantity: Number(row.quantity ?? 0) || 0,
      unitPrice: Number(row.unitPrice ?? 0) || 0,
    }
  })
}

function asAddress(value: unknown): OrderAddress {
  const row = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    line1: String(row.line1 ?? ''),
    line2: row.line2 ? String(row.line2) : undefined,
    city: String(row.city ?? ''),
    state: row.state ? String(row.state) : undefined,
    postalCode: String(row.postalCode ?? ''),
    country: String(row.country ?? ''),
  }
}

function asHistory(value: unknown): OrderStatusHistoryEntry[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    return {
      previousStatus: String(row.previousStatus ?? ''),
      newStatus: String(row.newStatus ?? ''),
      timestamp: String(row.timestamp ?? ''),
      reason: String(row.reason ?? ''),
      actorId: row.actorId ? String(row.actorId) : undefined,
      actorName: row.actorName ? String(row.actorName) : undefined,
      actorEmail: row.actorEmail ? String(row.actorEmail) : undefined,
    }
  })
}

function paymentBadge(status: string): string {
  if (status === 'Paid') return 'Paid'
  if (status === 'Failed') return 'Failed'
  if (status === 'Refunded') return 'Cancelled'
  if (status === 'Pending' || status === 'Partially paid') return 'Pending'
  return 'Draft'
}

function fulfillmentBadge(status: string): string {
  if (status === 'Delivered') return 'Resolved'
  if (status === 'Shipped' || status === 'Processing' || status === 'Partially fulfilled') return 'Active'
  if (status === 'Cancelled' || status === 'Returned') return 'Cancelled'
  return 'Open'
}

export function StoreOrdersPage() {
  const { store, storeId } = useOutletContext<StoreWorkspaceContext>()
  const { toast } = useApp()
  const { hasPermission, user } = useAuth()
  const mockMode = repositoryConfig.useMockApi
  const resource = storeOrderResource(storeId)

  const canManage = hasPermission('resource:edit') // Admin: full order management (implemented actions) + Manager: update permitted fulfillment statuses
  const canView = hasPermission('dashboard:access')

  const [rows, setRows] = useState<BaseRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('All')
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>('All')
  const [selected, setSelected] = useState<BaseRecord | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [nextFulfillment, setNextFulfillment] = useState('')
  const [reason, setReason] = useState('')
  const [confirmedCancel, setConfirmedCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const verifyStore = useCallback(async () => {
    const found = await getStoreById(storeId)
    if (!found) throw { message: 'Store not found. Order operations are blocked for safety.', code: 'NOT_FOUND' }
    return found
  }, [storeId])

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      await verifyStore()
      const data = await listPlatformRecords(resource, '', 'All', 1, 500)
      const items = data.items.filter((row) => isStoreOrderOwnedBy(row, storeId))
      items.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')) || String(b.orderNumber ?? '').localeCompare(String(a.orderNumber ?? '')))
      setRows(items)
    } catch (err) {
      setLoadError(toApiError(err).message)
      setRows([])
    } finally { setLoading(false) }
  }, [resource, storeId, verifyStore])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!selected) return
    const fresh = rows.find((r) => r.id === selected.id)
    if (fresh) setSelected(fresh)
  }, [rows, selected?.id])

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (paymentFilter !== 'All' && String(row.paymentStatus ?? '') !== paymentFilter) return false
      if (fulfillmentFilter !== 'All' && String(row.fulfillmentStatus ?? '') !== fulfillmentFilter) return false
      if (!q) return true
      return [row.orderNumber, row.customerName, row.customerEmail, row.id].some((v) => String(v ?? '').toLowerCase().includes(q))
    })
  }, [rows, query, paymentFilter, fulfillmentFilter])

  const openDetails = (row: BaseRecord) => {
    if (!isStoreOrderOwnedBy(row, storeId)) { toast('This order does not belong to the selected store.', 'error'); return }
    setSelected(row); setDetailsOpen(true)
  }

  const openStatus = (row: BaseRecord) => {
    if (!canManage) return
    if (!isStoreOrderOwnedBy(row, storeId)) { toast('This order does not belong to the selected store.', 'error'); return }
    const current = String(row.fulfillmentStatus ?? row.status ?? '')
    const allowed = FULFILLMENT_TRANSITIONS[current] ?? []
    if (!allowed.length) { toast(`No fulfillment transitions are available from "${current}".`, 'error'); return }
    setSelected(row); setNextFulfillment(''); setReason(''); setConfirmedCancel(false); setError(''); setStatusOpen(true)
  }

  const submitStatus = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy || !selected || !canManage) return
    if (!isStoreOrderOwnedBy(selected, storeId)) { toast('This order does not belong to the selected store.', 'error'); return }
    const current = String(selected.fulfillmentStatus ?? selected.status ?? '')
    const allowed = FULFILLMENT_TRANSITIONS[current] ?? []
    if (!nextFulfillment || !allowed.includes(nextFulfillment)) { setError('Select a valid fulfillment status transition.'); return }
    if (!reason.trim()) { setError('A reason is required for fulfillment status changes.'); return }
    if (nextFulfillment === 'Cancelled' && !confirmedCancel) { setError('Cancellation requires confirmation.'); return }

    setBusy(true); setError('')
    try {
      await verifyStore()
      const now = new Date().toISOString()
      const history = asHistory(selected.statusHistory)
      const entry: OrderStatusHistoryEntry = {
        previousStatus: current,
        newStatus: nextFulfillment,
        timestamp: now,
        reason: reason.trim(),
        actorId: String(user?.id ?? ''),
        actorName: String(user?.name ?? ''),
        actorEmail: String(user?.email ?? ''),
      }
      await savePlatformRecord(resource, {
        storeId, // forced from route
        fulfillmentStatus: nextFulfillment,
        status: nextFulfillment as BaseRecord['status'], // BaseRecord compatibility / status filtering alignment
        statusHistory: [...history, entry],
      }, String(selected.id))
      setStatusOpen(false)
      await load()
      toast(`Fulfillment status updated to ${nextFulfillment}${mockMode ? ' in demo data' : ''}.`, 'success')
    } catch (err) {
      const apiError = toApiError(err)
      setError(apiError.message)
      toast(apiError.message, 'error')
    } finally { setBusy(false) }
  }

  if (!canView) return <div className="empty-state" role="alert"><strong>Access restricted</strong><span>You do not have permission to view orders.</span></div>

  const detailsItems = selected ? asItems(selected.items) : []
  const detailsAddress = selected ? asAddress(selected.shippingAddress) : asAddress(null)
  const detailsHistory = selected ? asHistory(selected.statusHistory) : []
  const statusCurrent = selected ? String(selected.fulfillmentStatus ?? selected.status ?? '') : ''
  const allowedTransitions = FULFILLMENT_TRANSITIONS[statusCurrent] ?? []

  return (
    <>
      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Orders</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 12 }}>Store-scoped order management for <strong>{store.name}</strong> ({storeId}). Demo orders only — not real customer transactions. No real payment processing, refunds, or gateway integration.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline-secondary" title="Refresh orders" onClick={() => void load()}><i className="bi bi-arrow-clockwise me-2" />Refresh</button>
        </div>
      </div>

      {mockMode && <div className="settings-notice" role="status"><i className="bi bi-info-circle" /> Demo mode: orders are browser-local demo data for this store only. Payment status is displayed for context and is not processed by this UI. Changing fulfillment status does <strong>not</strong> automatically deduct or restore inventory.</div>}

      <section className="panel resource-panel">
        <div className="resource-toolbar">
          <div className="table-title"><h2>Order list</h2><span className="table-count">{filteredRows.length} of {rows.length}</span></div>
          <div className="table-filters">
            <label className="table-search"><i className="bi bi-search" /><input aria-label="Search orders by order number or customer" placeholder="Search order #, customer..." value={query} onChange={(e) => setQuery(e.target.value)} /></label>
            <select className="form-select status-filter" aria-label="Filter by payment status" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}>
              <option value="All">All payments</option><option>Unpaid</option><option>Pending</option><option>Paid</option><option>Failed</option><option>Refunded</option><option value="Partially paid">Partially paid</option>
            </select>
            <select className="form-select status-filter" aria-label="Filter by fulfillment status" value={fulfillmentFilter} onChange={(e) => setFulfillmentFilter(e.target.value as FulfillmentFilter)}>
              <option value="All">All fulfillment</option><option>Unfulfilled</option><option>Processing</option><option value="Partially fulfilled">Partially fulfilled</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option><option>Returned</option>
            </select>
          </div>
        </div>

        {loadError ? <div className="error-state"><i className="bi bi-exclamation-triangle" /><strong>Couldn’t load orders</strong><span>{loadError}</span><button className="btn btn-outline-secondary btn-sm" onClick={() => void load()}>Try again</button></div>
          : loading ? <div className="loading-skeleton"><span /><span /><span /><span /></div>
            : <div className="table-responsive"><table className="table align-middle data-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment status</th><th>Fulfillment status</th><th className="text-end">Actions</th></tr></thead><tbody>
              {filteredRows.map((row) => {
                const fulfillment = String(row.fulfillmentStatus ?? row.status ?? '—')
                const payment = String(row.paymentStatus ?? '—')
                return <tr key={row.id}>
                  <td><strong className="record-id" style={{ color: 'var(--ink)', fontSize: 11 }}>{String(row.orderNumber ?? row.id)}</strong><div style={{ color: 'var(--muted)', fontSize: 9 }}>{row.id}</div></td>
                  <td><div>{String(row.customerName ?? '—')}</div><div style={{ color: 'var(--muted)', fontSize: 9 }}>{String(row.customerEmail ?? '')}</div></td>
                  <td>{fmtDate(row.createdAt)}</td>
                  <td>{money(row.total)}</td>
                  <td><StatusBadge status={paymentBadge(payment)} /> <span style={{ fontSize: 9, color: 'var(--muted)' }}>{payment}</span></td>
                  <td><StatusBadge status={fulfillmentBadge(fulfillment)} /> <span style={{ fontSize: 9, color: 'var(--muted)' }}>{fulfillment}</span></td>
                  <td><div className="row-actions">
                    <button className="btn-icon" aria-label="View order details" title="View details" onClick={() => openDetails(row)}><i className="bi bi-eye" /></button>
                    {canManage && (FULFILLMENT_TRANSITIONS[fulfillment]?.length ?? 0) > 0 && <button className="btn-icon" aria-label="Update fulfillment status" title="Update fulfillment status" onClick={() => openStatus(row)}><i className="bi bi-truck" /></button>}
                  </div></td>
                </tr>
              })}
              {!filteredRows.length && <tr><td colSpan={7}><div className="empty-state"><i className="bi bi-receipt" /><strong>No orders found</strong><span>{rows.length ? 'No orders match the current search/filters for this store.' : `This store has no demo orders. Orders are isolated to ${store.name}.`}</span></div></td></tr>}
            </tbody></table></div>}
      </section>

      {detailsOpen && selected && <Modal title={`Order ${String(selected.orderNumber ?? selected.id)}`} onClose={() => setDetailsOpen(false)}>
        <div className="modal-body" style={{ display: 'grid', gap: 14 }}>
          <div className="settings-notice" role="status" style={{ margin: 0 }}><i className="bi bi-info-circle" /> Demo order data (not a real customer transaction). Payment status is informational only; no payment/refund/gateway actions are performed.</div>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="panel" style={{ padding: 12 }}><h3 style={{ margin: '0 0 8px', fontSize: 13 }}>Customer</h3><div><strong>{String(selected.customerName ?? '—')}</strong></div><div style={{ color: 'var(--muted)', fontSize: 12 }}>{String(selected.customerEmail ?? '—')}</div>{selected.customerPhone ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>{String(selected.customerPhone)}</div> : null}</div>
            <div className="panel" style={{ padding: 12 }}><h3 style={{ margin: '0 0 8px', fontSize: 13 }}>Shipping address</h3><div style={{ fontSize: 12, color: 'var(--muted)' }}>{detailsAddress.line1 || '—'}{detailsAddress.line2 ? <><br />{detailsAddress.line2}</> : null}<br />{[detailsAddress.city, detailsAddress.state, detailsAddress.postalCode].filter(Boolean).join(', ')}<br />{detailsAddress.country}</div></div>
            <div className="panel" style={{ padding: 12 }}><h3 style={{ margin: '0 0 8px', fontSize: 13 }}>Status</h3><div style={{ display: 'grid', gap: 6, fontSize: 12 }}><div><span style={{ color: 'var(--muted)' }}>Payment: </span><StatusBadge status={paymentBadge(String(selected.paymentStatus ?? ''))} /> {String(selected.paymentStatus ?? '—')}</div><div><span style={{ color: 'var(--muted)' }}>Fulfillment: </span><StatusBadge status={fulfillmentBadge(String(selected.fulfillmentStatus ?? selected.status ?? ''))} /> {String(selected.fulfillmentStatus ?? selected.status ?? '—')}</div><div><span style={{ color: 'var(--muted)' }}>Date: </span>{fmtDate(selected.createdAt)}</div></div></div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13 }}>Line items</h3>
            <div className="table-responsive"><table className="table align-middle data-table"><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead><tbody>
              {detailsItems.map((item, idx) => <tr key={`${item.productId}-${idx}`}><td><strong style={{ fontSize: 11 }}>{item.productName || item.productId || '—'}</strong><div style={{ color: 'var(--muted)', fontSize: 9 }}>{item.productId}</div></td><td>{item.quantity.toLocaleString()}</td><td>{money(item.unitPrice)}</td><td>{money(item.quantity * item.unitPrice)}</td></tr>)}
              {!detailsItems.length && <tr><td colSpan={4} style={{ color: 'var(--muted)' }}>No line items.</td></tr>}
            </tbody></table></div>
          </div>
          <div className="panel" style={{ padding: 12, maxWidth: 360, justifySelf: 'end', width: '100%' }}>
            <div style={{ display: 'grid', gap: 6, fontSize: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><strong>{money(selected.subtotal)}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><strong>{money(selected.shipping)}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><strong>-{money(selected.discount)}</strong></div><div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: 6, fontSize: 13 }}><span>Total</span><strong>{money(selected.total)}</strong></div></div>
          </div>
          {selected.notes ? <div><h3 style={{ margin: '0 0 6px', fontSize: 13 }}>Notes</h3><p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{String(selected.notes)}</p></div> : null}
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: 13 }}>Fulfillment status history</h3>
            <div className="table-responsive"><table className="table align-middle data-table"><thead><tr><th>Timestamp</th><th>Previous</th><th>New</th><th>Reason</th><th>Acting user</th></tr></thead><tbody>
              {detailsHistory.slice().reverse().map((entry, idx) => <tr key={`${entry.timestamp}-${idx}`}><td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}</td><td>{entry.previousStatus || '—'}</td><td>{entry.newStatus || '—'}</td><td>{entry.reason || '—'}</td><td>{entry.actorName || entry.actorEmail || entry.actorId || '—'}</td></tr>)}
              {!detailsHistory.length && <tr><td colSpan={5} style={{ color: 'var(--muted)' }}>No fulfillment status changes recorded.</td></tr>}
            </tbody></table></div>
          </div>
          <p className="form-hint" style={{ margin: 0 }}><i className="bi bi-shield-check me-1" />Order is scoped to store <strong>{storeId}</strong>. Frontend RBAC is demo-only; production authorization must also be enforced by the backend.</p>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline-secondary" onClick={() => setDetailsOpen(false)}>Close</button>
          {canManage && (FULFILLMENT_TRANSITIONS[String(selected.fulfillmentStatus ?? selected.status ?? '')]?.length ?? 0) > 0 && <button className="btn btn-primary" onClick={() => { setDetailsOpen(false); openStatus(selected) }}><i className="bi bi-truck me-2" />Update fulfillment</button>}
        </div>
      </Modal>}

      {statusOpen && selected && <Modal title={`Update fulfillment: ${String(selected.orderNumber ?? selected.id)}`} onClose={() => { setError(''); setConfirmedCancel(false); setStatusOpen(false) }}>
        <form onSubmit={submitStatus} noValidate>
          <div className="modal-body form-grid">
            <div style={{ gridColumn: '1 / -1' }}><p className="form-hint" style={{ margin: 0 }}>Order <strong>{String(selected.orderNumber)}</strong> · Current fulfillment: <strong>{statusCurrent}</strong> · Payment: <strong>{String(selected.paymentStatus ?? '—')}</strong> (displayed only; no payment processing/refunds). Fulfillment changes do <strong>not</strong> deduct or restore inventory.</p></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="next-fulfillment">New fulfillment status <span aria-hidden="true">*</span></label>
              <select id="next-fulfillment" className="form-control" value={nextFulfillment} onChange={(e) => { setNextFulfillment(e.target.value); setConfirmedCancel(false) }} disabled={busy} required>
                <option value="">Select permitted status</option>
                {allowedTransitions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {!allowedTransitions.length && <p className="form-hint text-muted" style={{ marginTop: 4, marginBottom: 0 }}>No valid transitions from this status.</p>}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="fulfillment-reason">Reason <span aria-hidden="true">*</span></label>
              <textarea id="fulfillment-reason" className="form-control" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Packed and handed to carrier (demo)" disabled={busy} required />
            </div>
            {nextFulfillment === 'Cancelled' && <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontWeight: 400 }}>
                <input type="checkbox" checked={confirmedCancel} onChange={(e) => setConfirmedCancel(e.target.checked)} disabled={busy} />
                <span>I confirm cancellation of this demo order’s fulfillment. This records status history and does <strong>not</strong> process refunds or restore inventory automatically.</span>
              </label>
            </div>}
            {error && <p className="form-hint text-danger" role="alert" style={{ gridColumn: '1 / -1' }}><i className="bi bi-exclamation-circle me-1" />{error}</p>}
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setStatusOpen(false)} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy || !nextFulfillment || !allowedTransitions.length}>{busy ? 'Saving…' : 'Update status'}</button></div>
        </form>
      </Modal>}
    </>
  )
}
