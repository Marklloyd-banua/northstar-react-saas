import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { BaseRecord } from '../../types/models'
import { deletePlatformRecord, listPlatformRecords, savePlatformRecord } from '../../services/dataRepository'
import { toApiError } from '../../services/api/errorHandler'
import { Modal } from '../../components/common/Modal'
import { StatusBadge } from '../../components/common/StatusBadge'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { repositoryConfig } from '../../services/repositoryConfig'
import { formValuesFromRecord, getResourceFieldSchemas, validateResourceForm } from '../resource/resourceForm'
import type { StoreWorkspaceContext } from './StoreWorkspaceLayout'
import { categoryFields, getStoreById, isStoreCategoryOwnedBy, storeCategoryResource, storeProductResource } from './storeWorkspace'

function pretty(value: string) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase()) }
function display(value: unknown) { return String(value ?? '—') || '—' }

export function StoreCategoriesPage() {
  const { store, storeId } = useOutletContext<StoreWorkspaceContext>()
  const { toast } = useApp()
  const { hasPermission } = useAuth()
  const mockMode = repositoryConfig.useMockApi
  const resource = storeCategoryResource(storeId)
  const productResource = storeProductResource(storeId)

  const canCreate = hasPermission('resource:create')
  const canEdit = hasPermission('resource:edit')
  const canDelete = hasPermission('resource:delete') // Administrator only

  const [rows, setRows] = useState<BaseRecord[]>([])
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

  const fields = useMemo(() => [...categoryFields], [])
  const schemas = useMemo(() => getResourceFieldSchemas(resource, fields), [resource, fields])

  const verifyStore = useCallback(async () => {
    const found = await getStoreById(storeId)
    if (!found) throw { message: 'Store not found. Category operations are blocked for safety.', code: 'NOT_FOUND' }
    return found
  }, [storeId])

  const loadScoped = useCallback(async (res: string) => {
    const data = await listPlatformRecords(res, '', 'All', 1, 500)
    return data.items.filter((row) => String(row.storeId ?? '') === storeId)
  }, [storeId])

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      await verifyStore()
      const data = await listPlatformRecords(resource, query, statusFilter, page, 8)
      const items = data.items.filter((row) => isStoreCategoryOwnedBy(row, storeId))
      setRows(items)
      setTotal(items.length === data.items.length ? data.total : items.length)
    } catch (err) {
      setLoadError(toApiError(err).message)
      setRows([]); setTotal(0)
    } finally { setLoading(false) }
  }, [resource, query, statusFilter, page, storeId, verifyStore])

  useEffect(() => { void load() }, [load])

  const openForm = (record?: BaseRecord) => {
    if (record) {
      if (!canEdit) return
      if (!isStoreCategoryOwnedBy(record, storeId)) { toast('This category does not belong to the selected store.', 'error'); return }
    } else if (!canCreate) return
    setSelected(record ?? null)
    setForm(formValuesFromRecord(fields, record))
    setFieldErrors({}); setFormError(''); setModal(record ? 'edit' : 'create')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy) return
    if (selected && !isStoreCategoryOwnedBy(selected, storeId)) { toast('This category does not belong to the selected store.', 'error'); return }
    const validation = validateResourceForm(resource, fields, form)
    if (Object.keys(validation.fieldErrors).length) {
      setFieldErrors(validation.fieldErrors); setFormError(validation.formError ?? 'Please correct the highlighted fields.'); return
    }
    setBusy(true); setFieldErrors({}); setFormError('')
    try {
      await verifyStore()
      const existing = await loadScoped(resource)
      const name = String(validation.values.name ?? '').trim()
      const slug = String(validation.values.slug ?? '').trim().toLowerCase()
      const dupName = existing.find((row) => row.id !== selected?.id && String(row.name ?? '').trim().toLowerCase() === name.toLowerCase())
      const dupSlug = existing.find((row) => row.id !== selected?.id && String(row.slug ?? '').trim().toLowerCase() === slug)
      if (dupName || dupSlug) {
        const nextErrors: Record<string, string> = {}
        if (dupName) nextErrors.name = 'A category with this name already exists in this store.'
        if (dupSlug) nextErrors.slug = 'A category with this slug already exists in this store.'
        setFieldErrors(nextErrors)
        setFormError('Please correct the highlighted fields.')
        return
      }
      // Force route storeId ownership. Never trust submitted storeId.
      const payload: Record<string, string | number> = { ...validation.values, storeId }
      await savePlatformRecord(resource, payload, selected?.id)
      setModal(null); await load(); toast(`Category ${selected ? 'updated' : 'created'}${mockMode ? ' in demo data' : ''}.`, 'success')
    } catch (err) {
      const apiError = toApiError(err)
      setFormError(apiError.message)
      toast(apiError.message, 'error')
    } finally { setBusy(false) }
  }

  const requestDelete = async (row: BaseRecord) => {
    if (!canDelete) return
    if (!isStoreCategoryOwnedBy(row, storeId)) { toast('This category does not belong to the selected store.', 'error'); return }
    setBusy(true)
    try {
      await verifyStore()
      const products = await loadScoped(productResource)
      const name = String(row.name ?? '').trim().toLowerCase()
      const slug = String(row.slug ?? '').trim().toLowerCase()
      const assigned = products.filter((p) => {
        const cat = String(p.category ?? '').trim().toLowerCase()
        return cat && (cat === name || (!!slug && cat === slug))
      })
      if (assigned.length) {
        toast(`Cannot delete "${String(row.name)}": ${assigned.length} product(s) in this store still use this category. Reassign those products first.`, 'error')
        return
      }
      setSelected(row); setModal('delete')
    } catch (err) {
      toast(toApiError(err).message, 'error')
    } finally { setBusy(false) }
  }

  const handleDelete = async () => {
    if (!selected || !canDelete || busy) return
    if (!isStoreCategoryOwnedBy(selected, storeId)) { toast('This category does not belong to the selected store.', 'error'); return }
    setBusy(true)
    try {
      await verifyStore()
      // Re-check assignment at delete time for safety.
      const products = await loadScoped(productResource)
      const name = String(selected.name ?? '').trim().toLowerCase()
      const slug = String(selected.slug ?? '').trim().toLowerCase()
      const assigned = products.filter((p) => { const cat = String(p.category ?? '').trim().toLowerCase(); return cat && (cat === name || (!!slug && cat === slug)) })
      if (assigned.length) throw { message: `Cannot delete category: ${assigned.length} product(s) still assigned. Reassign first.`, code: 'CONFLICT' }
      await deletePlatformRecord(resource, selected.id)
      setModal(null); await load(); toast(`Category deleted${mockMode ? ' from demo data' : ''}.`, 'success')
    } catch (err) { toast(toApiError(err).message, 'error') }
    finally { setBusy(false) }
  }

  const inputProps = (schema: ReturnType<typeof getResourceFieldSchemas>[number]) => {
    const id = `category-${schema.key}`
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
          <h2 style={{ margin: 0, fontSize: 18 }}>Categories</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 12 }}>Store-scoped categories for <strong>{store.name}</strong> ({storeId}). Categories are isolated to this store.</p>
        </div>
        <div className="page-actions">{canCreate && <button className="btn btn-primary" onClick={() => openForm()}><i className="bi bi-plus-lg me-2" />Add category</button>}</div>
      </div>

      {mockMode && <div className="settings-notice" role="status"><i className="bi bi-info-circle" /> Demo mode: category changes are stored in browser-local demo data for this store only.</div>}

      <section className="panel resource-panel">
        <div className="resource-toolbar">
          <div className="table-title"><h2>Category directory</h2><span className="table-count">{total} records</span></div>
          <div className="table-filters">
            <label className="table-search"><i className="bi bi-search" /><input aria-label="Search categories" placeholder="Search categories..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} /></label>
            <select className="form-select status-filter" aria-label="Filter by status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
              <option>All</option><option value="Active">Active</option><option value="Draft">Draft</option>
            </select>
            <button className="btn btn-outline-secondary" title="Refresh list" onClick={() => void load()}><i className="bi bi-arrow-clockwise" /></button>
          </div>
        </div>

        {loadError ? <div className="error-state"><i className="bi bi-exclamation-triangle" /><strong>Couldn’t load categories</strong><span>{loadError}</span><button className="btn btn-outline-secondary btn-sm" onClick={() => void load()}>Try again</button></div>
          : loading ? <div className="loading-skeleton"><span /><span /><span /><span /></div>
            : <>
              <div className="table-responsive"><table className="table align-middle data-table"><thead><tr><th>Name</th><th>Slug</th><th>Description</th><th>Status</th><th className="text-end">Actions</th></tr></thead><tbody>
                {rows.map((row) => <tr key={row.id}>
                  <td><strong className="record-id" style={{ color: 'var(--ink)', fontSize: 11 }}>{String(row.name)}</strong><div style={{ color: 'var(--muted)', fontSize: 9 }}>{row.id}</div></td>
                  <td>{display(row.slug)}</td>
                  <td>{display(row.description)}</td>
                  <td><StatusBadge status={String(row.status)} /></td>
                  <td><div className="row-actions">
                    <button className="btn-icon" aria-label="View details" title="View details" onClick={() => { setSelected(row); setModal('details') }}><i className="bi bi-eye" /></button>
                    {canEdit && <button className="btn-icon" aria-label="Edit" title="Edit" onClick={() => openForm(row)}><i className="bi bi-pencil" /></button>}
                    {canDelete && <button className="btn-icon text-danger" aria-label="Delete" title="Delete" onClick={() => void requestDelete(row)} disabled={busy}><i className="bi bi-trash" /></button>}
                  </div></td>
                </tr>)}
                {!rows.length && <tr><td colSpan={5}><div className="empty-state"><i className="bi bi-tags" /><strong>No categories found</strong><span>This store has no matching categories. Categories are isolated to {store.name}.</span>{canCreate && <button className="btn btn-primary btn-sm" onClick={() => openForm()}>Add category</button>}</div></td></tr>}
              </tbody></table></div>
              <div className="table-pagination"><span>Showing <b>{total ? ((page - 1) * 8 + 1) : 0}–{Math.min(page * 8, total)}</b> of <b>{total}</b> categories</span><div><button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button><button className="btn btn-outline-secondary btn-sm" disabled={page * 8 >= total} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
            </>}
      </section>

      {(modal === 'create' || modal === 'edit') && <Modal title={`${modal === 'create' ? 'Add' : 'Edit'} category`} onClose={() => { setFormError(''); setFieldErrors({}); setModal(null) }}>
        <form onSubmit={submit} noValidate>
          <div className="modal-body form-grid">
            {schemas.map((schema) => {
              const id = `category-${schema.key}`
              const hasError = Boolean(fieldErrors[schema.key])
              const common = inputProps(schema)
              return <div key={schema.key} style={schema.type === 'textarea' ? { gridColumn: '1 / -1' } : undefined}>
                <label htmlFor={id}>{schema.label}{schema.required && <span aria-hidden="true"> *</span>}</label>
                {schema.type === 'textarea' ? <textarea {...common} rows={3} placeholder={schema.placeholder} />
                  : schema.type === 'select' ? <select {...common}><option value="">Select status</option>{(schema.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>
                  : <input {...common} type="text" placeholder={schema.placeholder} />}
                {hasError && <p id={`${id}-error`} className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors[schema.key]}</p>}
              </div>
            })}
            {formError && !Object.values(fieldErrors).some(Boolean) && <p className="form-hint text-danger" role="alert"><i className="bi bi-exclamation-circle me-1" />{formError}</p>}
            <p className="form-hint"><i className="bi bi-lock me-1" />Store ownership is fixed to <strong>{storeId}</strong> and cannot be changed by form input.</p>
          </div>
          <div className="modal-actions"><button type="button" className="btn btn-outline-secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : modal === 'create' ? 'Add category' : 'Save changes'}</button></div>
        </form>
      </Modal>}

      {modal === 'details' && selected && <Modal title="Category details" onClose={() => setModal(null)}>
        <div className="details-list">{Object.entries(selected).map(([key, value]) => <div key={key}><span>{pretty(key)}</span><strong>{key === 'status' ? <StatusBadge status={String(value)} /> : display(value)}</strong></div>)}</div>
        <div className="modal-actions"><button className="btn btn-outline-secondary" onClick={() => setModal(null)}>Close</button>{canEdit && <button className="btn btn-primary" onClick={() => openForm(selected)}>Edit category</button>}</div>
      </Modal>}

      {modal === 'delete' && selected && <Modal title="Delete this category?" onClose={() => setModal(null)}>
        <div className="modal-body"><p>This removes <strong>{String(selected.name ?? selected.id)}</strong> from <strong>{store.name}</strong>{mockMode ? '’s demo dataset' : ''}. This cannot be undone.</p><p className="text-muted" style={{ fontSize: 12, marginBottom: 0 }}>Deletion was checked against products assigned to this store. Reassign products before deleting if assignments exist.</p></div>
        <div className="modal-actions"><button className="btn btn-outline-secondary" onClick={() => setModal(null)} disabled={busy}>Cancel</button><button className="btn btn-danger" onClick={() => void handleDelete()} disabled={busy}>{busy ? 'Deleting…' : 'Delete category'}</button></div>
      </Modal>}
    </>
  )
}
