import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { BaseRecord } from '../../types/models'
import { deletePlatformRecord, listPlatformRecords, savePlatformRecord, setPlatformRecordStatus } from '../../services/dataRepository'
import { toApiError } from '../../services/api/errorHandler'
import { Modal } from '../../components/common/Modal'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { repositoryConfig } from '../../services/repositoryConfig'
import { formValuesFromRecord, getResourceFieldSchemas, validateResourceForm } from '../resource/resourceForm'
import type { StoreWorkspaceContext } from './StoreWorkspaceLayout'
import { getStoreById, isStoreCategoryOwnedBy, isStoreProductOwnedBy, productFields, publishLabel, storeCategoryResource, storeProductResource } from './storeWorkspace'

function pretty(value: string) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase()) }
function display(value: unknown) {
  if (typeof value === 'number') return value.toLocaleString()
  return String(value ?? '—')
}

export function StoreProductsPage() {
  const { store, storeId } = useOutletContext<StoreWorkspaceContext>()
  const { toast } = useApp()
  const { hasPermission } = useAuth()
  const mockMode = repositoryConfig.useMockApi
  const resource = storeProductResource(storeId)
  const categoryResource = storeCategoryResource(storeId)

  const canCreate = hasPermission('resource:create')
  const canEdit = hasPermission('resource:edit')
  const canDelete = hasPermission('resource:delete')
  const canPublish = hasPermission('resource:edit') // Admin + Manager

  const [rows, setRows] = useState<BaseRecord[]>([])
  const [categories, setCategories] = useState<BaseRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState<'create' | 'edit' | 'details' | 'delete' | null>(null)
  const [selected, setSelected] = useState<BaseRecord | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionBusy, setActionBusy] = useState<string | null>(null)

  const fields = useMemo(() => [...productFields], [])
  const categoryRecords = useMemo(() => categories.filter((row) => isStoreCategoryOwnedBy(row, storeId)), [categories, storeId])
  const currentCategoryValue = String(form.category ?? '')
  const schemas = useMemo(() => {
    const base = getResourceFieldSchemas(resource, fields)
    return base.map((schema) => {
      if (schema.key !== 'category') return schema
      const activeNames = Array.from(new Set(categoryRecords.filter((c) => c.status === 'Active').map((c) => String(c.name ?? '').trim()).filter(Boolean)))
      const options = [...activeNames]
      const editingExisting = modal === 'edit' && selected
      const current = currentCategoryValue.trim()
      if (editingExisting && current && !options.includes(current)) options.unshift(current)
      return { ...schema, type: 'select' as const, options, placeholder: activeNames.length ? 'Select a category' : 'No active categories available' }
    })
  }, [resource, fields, categoryRecords, modal, selected, currentCategoryValue])
  const unmatchedCategory = useMemo(() => {
    if (!(modal === 'edit' && selected)) return ''
    const current = String(form.category ?? '').trim()
    if (!current) return ''
    const matches = categoryRecords.some((c) => String(c.name ?? '').trim().toLowerCase() === current.toLowerCase() || String(c.slug ?? '').trim().toLowerCase() === current.toLowerCase())
    return matches ? '' : current
  }, [modal, selected, form.category, categoryRecords])

  const verifyStore = useCallback(async () => {
    const found = await getStoreById(storeId)
    if (!found) throw { message: 'Store not found. Product operations are blocked for safety.', code: 'NOT_FOUND' }
    return found
  }, [storeId])

  const loadCategories = useCallback(async () => {
    try {
      await verifyStore()
      const data = await listPlatformRecords(categoryResource, '', 'All', 1, 500)
      setCategories(data.items.filter((row) => isStoreCategoryOwnedBy(row, storeId)))
    } catch {
      setCategories([])
    }
  }, [categoryResource, storeId, verifyStore])

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      await verifyStore()
      const [data] = await Promise.all([
        listPlatformRecords(resource, query, statusFilter, page, 8),
        loadCategories(),
      ])
      // Strict isolation: only show records that belong to this store.
      const items = data.items.filter((row) => isStoreProductOwnedBy(row, storeId))
      setRows(items)
      setTotal(items.length === data.items.length ? data.total : items.length)
    } catch (err) {
      setLoadError(toApiError(err).message)
      setRows([]); setTotal(0)
    } finally { setLoading(false) }
  }, [resource, query, statusFilter, page, storeId, verifyStore, loadCategories])

  useEffect(() => { void load() }, [load])

  const openForm = (record?: BaseRecord) => {
    if (record) {
      if (!canEdit) return
      if (!isStoreProductOwnedBy(record, storeId)) { toast('This product does not belong to the selected store.', 'error'); return }
    } else if (!canCreate) return
    void loadCategories()
    setSelected(record ?? null)
    setForm(formValuesFromRecord(fields, record))
    setFieldErrors({}); setFormError(''); setModal(record ? 'edit' : 'create')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy) return
    if (selected && !isStoreProductOwnedBy(selected, storeId)) { toast('This product does not belong to the selected store.', 'error'); return }
    const validation = validateResourceForm(resource, fields, form)
    if (Object.keys(validation.fieldErrors).length) {
      setFieldErrors(validation.fieldErrors); setFormError(validation.formError ?? 'Please correct the highlighted fields.'); return
    }
    setBusy(true); setFieldErrors({}); setFormError('')
    try {
      await verifyStore()
      // Force route storeId ownership. Never allow submitted form data to change store ownership.
      const payload: Record<string, string | number> = { ...validation.values, storeId }
      await savePlatformRecord(resource, payload, selected?.id)
      setModal(null); await load(); toast(`Product ${selected ? 'updated' : 'created'}${mockMode ? ' in demo data' : ''}.`, 'success')
    } catch (err) {
      const apiError = toApiError(err)
      setFormError(apiError.message)
      toast(apiError.message, 'error')
    } finally { setBusy(false) }
  }

  const togglePublish = async (row: BaseRecord) => {
    if (!canPublish || actionBusy) return
    if (!isStoreProductOwnedBy(row, storeId)) { toast('This product does not belong to the selected store.', 'error'); return }
    const next = row.status === 'Active' ? 'Draft' : 'Active'
    setActionBusy(`status:${row.id}`)
    try {
      await verifyStore()
      await setPlatformRecordStatus(resource, row.id, next)
      await load()
      toast(`${String(row.name ?? row.id)} ${next === 'Active' ? 'published' : 'unpublished'}${mockMode ? ' in demo data' : ''}.`, 'success')
    } catch (err) { toast(toApiError(err).message, 'error') }
    finally { setActionBusy(null) }
  }

  const handleDelete = async () => {
    if (!selected || !canDelete || busy) return
    if (!isStoreProductOwnedBy(selected, storeId)) { toast('This product does not belong to the selected store.', 'error'); return }
    setBusy(true)
    try {
      await verifyStore()
      await deletePlatformRecord(resource, selected.id)
      setModal(null); await load(); toast(`Product deleted${mockMode ? ' from demo data' : ''}.`, 'success')
    } catch (err) { toast(toApiError(err).message, 'error') }
    finally { setBusy(false) }
  }

  const inputProps = (schema: ReturnType<typeof getResourceFieldSchemas>[number]) => {
    const id = `product-${schema.key}`
    const hasError = Boolean(fieldErrors[schema.key])
    return {
      id, name: schema.key, className: `form-control${hasError ? ' is-invalid' : ''}`, value: form[schema.key] ?? '',
      required: schema.required, 'aria-invalid': hasError ? true : undefined, 'aria-describedby': hasError ? `${id}-error` : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((current) => ({ ...current, [schema.key]: event.target.value }))
        if (fieldErrors[schema.key]) setFieldErrors((current) => ({ ...current, [schema.key]: '' }))
        if (formError) setFormError('')
      },
    }
  }

  return (
    <>
      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Products</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 12 }}>Store-scoped products for <strong>{store.name}</strong> ({storeId}). Products are isolated to this store.</p>
        </div>
        <div className="page-actions">
          {canCreate && <button className="btn btn-primary" onClick={() => openForm()}><i className="bi bi-plus-lg me-2" />Add product</button>}
        </div>
      </div>

      {mockMode && <div className="settings-notice" role="status"><i className="bi bi-info-circle" /> Demo mode: product changes are stored in browser-local demo data for this store only.</div>}

      <section className="panel resource-panel">
        <div className="resource-toolbar">
          <div className="table-title"><h2>Product directory</h2><span className="table-count">{total} records</span></div>
          <div className="table-filters">
            <label className="table-search"><i className="bi bi-search" /><input aria-label="Search products" placeholder="Search products..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} /></label>
            <select className="form-select status-filter" aria-label="Filter by status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option>All</option><option value="Active">Published</option><option value="Draft">Unpublished</option><option>Suspended</option>
            </select>
            <button className="btn btn-outline-secondary" title="Refresh list" onClick={() => void load()}><i className="bi bi-arrow-clockwise" /></button>
          </div>
        </div>

        {loadError ? <div className="error-state"><i className="bi bi-exclamation-triangle" /><strong>Couldn’t load products</strong><span>{loadError}</span><button className="btn btn-outline-secondary btn-sm" onClick={() => void load()}>Try again</button></div>
          : loading ? <div className="loading-skeleton"><span /><span /><span /><span /></div>
            : <>
              <div className="table-responsive"><table className="table align-middle data-table"><thead><tr><th>Name</th><th>Slug</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-end">Actions</th></tr></thead><tbody>
                {rows.map((row) => <tr key={row.id}>
                  <td><strong className="record-id" style={{ color: 'var(--ink)', fontSize: 11 }}>{String(row.name)}</strong><div style={{ color: 'var(--muted)', fontSize: 9 }}>{row.id}</div></td>
                  <td>{String(row.slug)}</td>
                  <td>{(() => { const value = String(row.category ?? ''); const matched = categories.some((c) => String(c.storeId ?? '') === storeId && (String(c.name ?? '').trim().toLowerCase() === value.trim().toLowerCase() || String(c.slug ?? '').trim().toLowerCase() === value.trim().toLowerCase())); return <>{value}{value && !matched && <span className="text-warning" title="Category value does not match a store category record"> (unmatched)</span>}</> })()}</td>
                  <td>${Number(row.price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{display(row.stockQuantity)}</td>
                  <td><StatusBadge status={String(row.status)} /> <span style={{ fontSize: 9, color: 'var(--muted)' }}>{publishLabel(String(row.status))}</span></td>
                  <td><div className="row-actions">
                    <button className="btn-icon" aria-label="View details" title="View details" onClick={() => { setSelected(row); setModal('details') }}><i className="bi bi-eye" /></button>
                    {canEdit && <button className="btn-icon" aria-label="Edit" title="Edit" onClick={() => openForm(row)}><i className="bi bi-pencil" /></button>}
                    {(canPublish || canDelete) && <div className="dropdown"><button className="btn-icon" data-bs-toggle="dropdown" aria-label="More actions"><i className="bi bi-three-dots" /></button><div className="dropdown-menu dropdown-menu-end">
                      {canPublish && <button className="dropdown-item" disabled={actionBusy === `status:${row.id}`} onClick={() => void togglePublish(row)}>{actionBusy === `status:${row.id}` ? 'Updating…' : row.status === 'Active' ? 'Unpublish' : 'Publish'}</button>}
                      {canDelete && <button className="dropdown-item text-danger" disabled={!!actionBusy} onClick={() => { setSelected(row); setModal('delete') }}>Delete product</button>}
                    </div></div>}
                  </div></td>
                </tr>)}
                {!rows.length && <tr><td colSpan={7}><div className="empty-state"><i className="bi bi-inbox" /><strong>No products found</strong><span>This store has no matching products. Products are isolated to {store.name}.</span>{canCreate && <button className="btn btn-primary btn-sm" onClick={() => openForm()}>Add product</button>}</div></td></tr>}
              </tbody></table></div>
              <div className="table-pagination"><span>Showing <b>{total ? ((page - 1) * 8 + 1) : 0}–{Math.min(page * 8, total)}</b> of <b>{total}</b> products</span><div><button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button><button className="btn btn-outline-secondary btn-sm" disabled={page * 8 >= total} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
            </>}
      </section>

      {(modal === 'create' || modal === 'edit') && <Modal title={`${modal === 'create' ? 'Add' : 'Edit'} product`} onClose={() => { setFormError(''); setFieldErrors({}); setModal(null) }}>
        <form onSubmit={submit} noValidate>
          <div className="modal-body form-grid">
            {schemas.map((schema) => {
              const id = `product-${schema.key}`
              const hasError = Boolean(fieldErrors[schema.key])
              const common = inputProps(schema)
              return <div key={schema.key} style={schema.type === 'textarea' ? { gridColumn: '1 / -1' } : undefined}>
                <label htmlFor={id}>{schema.label}{schema.required && <span aria-hidden="true"> *</span>}</label>
                {schema.type === 'textarea'
                  ? <textarea {...common} rows={3} placeholder={schema.placeholder} />
                  : schema.type === 'select'
                    ? <select {...common}><option value="">Select {schema.label.toLowerCase()}</option>{(schema.options ?? []).map((opt) => <option key={opt} value={opt}>{opt === currentCategoryValue && unmatchedCategory ? `Unmatched (existing): ${opt}` : opt}</option>)}</select>
                    : <input {...common} type={schema.type === 'integer' || schema.type === 'number' ? 'number' : 'text'} inputMode={schema.type === 'integer' ? 'numeric' : schema.type === 'number' ? 'decimal' : undefined} min={schema.min} max={schema.max} step={schema.step ?? (schema.type === 'integer' ? 1 : undefined)} placeholder={schema.placeholder} />}
                {hasError && <p id={`${id}-error`} className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors[schema.key]}</p>}
                {schema.key === 'category' && unmatchedCategory && <p className="form-hint text-warning" role="status" style={{ marginTop: 4, marginBottom: 0 }}><i className="bi bi-exclamation-triangle me-1" />Existing category value <strong>{unmatchedCategory}</strong> does not match a category record in this store. It has been preserved (not discarded). To reconcile safely, create or rename a matching category, or select a different category and save.</p>}
                {schema.key === 'category' && modal === 'create' && !(schema.options ?? []).length && <p className="form-hint text-muted" role="status" style={{ marginTop: 4, marginBottom: 0 }}><i className="bi bi-info-circle me-1" />No Active categories found for this store. Add categories in the Categories tab before creating categorized products (or save will be blocked by validation).</p>}
              </div>
            })}
            {formError && !Object.values(fieldErrors).some(Boolean) && <p className="form-hint text-danger" role="alert"><i className="bi bi-exclamation-circle me-1" />{formError}</p>}
            <p className="form-hint"><i className="bi bi-lock me-1" />Store ownership is fixed to <strong>{storeId}</strong> and cannot be changed by form input.</p>
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : modal === 'create' ? 'Add product' : 'Save changes'}</button></div>
        </form>
      </Modal>}

      {modal === 'details' && selected && <Modal title="Product details" onClose={() => setModal(null)}>
        <div className="details-list">{Object.entries(selected).filter(([k]) => k !== 'storeId' || true).map(([key, value]) => <div key={key}><span>{pretty(key)}</span><strong>{key === 'status' ? <>{String(value)} ({publishLabel(String(value))})</> : key === 'price' ? `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : display(value)}</strong></div>)}</div>
        <div className="modal-actions"><button className="btn btn-outline-secondary" onClick={() => setModal(null)}>Close</button>{canEdit && <button className="btn btn-primary" onClick={() => openForm(selected)}>Edit product</button>}</div>
      </Modal>}

      {modal === 'delete' && selected && <Modal title="Delete this product?" onClose={() => setModal(null)}>
        <div className="modal-body"><p>This removes <strong>{String(selected.name ?? selected.id)}</strong> from <strong>{store.name}</strong>{mockMode ? '’s demo dataset' : ''}. This cannot be undone.</p></div>
        <div className="modal-actions"><button className="btn btn-outline-secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button className="btn btn-danger" onClick={() => void handleDelete()} disabled={busy}>{busy ? 'Deleting…' : 'Delete product'}</button></div>
      </Modal>}
    </>
  )
}
