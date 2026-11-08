import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { BaseRecord } from '../../types/models'
import { listPlatformRecords, savePlatformRecord } from '../../services/dataRepository'
import { toApiError } from '../../services/api/errorHandler'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { repositoryConfig } from '../../services/repositoryConfig'
import { isValidStoreDomain } from '../resource/resourceForm'
import type { Store } from '../../types/models'
import type { StoreWorkspaceContext } from './StoreWorkspaceLayout'
import { getStoreById } from './storeWorkspace'

type FormState = {
  name: string
  description: string
  logoImageUrl: string
  bannerImageUrl: string
  contactEmail: string
  phoneNumber: string
  businessAddress: string
  currency: string
  timezone: string
  dateFormat: string
  domain: string
  status: string
}

const CURRENCIES = ['PHP', 'USD', 'EUR', 'GBP'] as const
const BASE_STATUSES = ['Active', 'Inactive'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function str(value: unknown): string {
  return value == null ? '' : String(value)
}

function toForm(record: BaseRecord | null): FormState {
  return {
    name: str(record?.name),
    description: str(record?.description),
    logoImageUrl: str(record?.logoImageUrl),
    bannerImageUrl: str(record?.bannerImageUrl),
    contactEmail: str(record?.contactEmail),
    phoneNumber: str(record?.phoneNumber),
    businessAddress: str(record?.businessAddress),
    currency: str(record?.currency) || 'USD',
    timezone: str(record?.timezone) || 'UTC',
    dateFormat: str(record?.dateFormat) || 'YYYY-MM-DD',
    domain: str(record?.domain),
    status: str(record?.status) || 'Active',
  }
}

export function StoreSettingsPage() {
  const { store, storeId, refreshStore } = useOutletContext<StoreWorkspaceContext>()
  const { toast } = useApp()
  const { hasPermission } = useAuth()
  const mockMode = repositoryConfig.useMockApi

  // Administrator: full settings access. Manager: read-only unless existing RBAC explicitly permits (none in current model). Viewer: read-only.
  const canEdit = hasPermission('admin:sensitive')
  const canView = hasPermission('dashboard:access')

  const [record, setRecord] = useState<BaseRecord | null>(null)
  const [form, setForm] = useState<FormState>(() => toForm(null))
  const [saved, setSaved] = useState<FormState>(() => toForm(null))
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [missingStore, setMissingStore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [formError, setFormError] = useState('')

  const statusOptions = useMemo(() => {
    const current = saved.status || str(record?.status)
    const opts = [...BASE_STATUSES]
    if (current && !opts.includes(current as (typeof BASE_STATUSES)[number])) opts.unshift(current as 'Active')
    return opts
  }, [saved.status, record?.status])

  const load = useCallback(async () => {
    setLoading(true); setLoadError(''); setMissingStore(false)
    try {
      const found = await getStoreById(storeId)
      if (!found) { setMissingStore(true); setRecord(null); return }
      // Load freshest record for the selected store only.
      const listed = await listPlatformRecords('stores', storeId, 'All', 1, 100)
      const fresh = listed.items.find((row) => row.id === storeId && String(row.id) === storeId) ?? (found as unknown as BaseRecord)
      const next = toForm(fresh)
      setRecord(fresh)
      setForm(next)
      setSaved(next)
      setFieldErrors({}); setFormError('')
    } catch (err) {
      setLoadError(toApiError(err).message)
    } finally { setLoading(false) }
  }, [storeId])

  useEffect(() => { void load() }, [load])

  const setField = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!canEdit) return
    const value = event.target.value
    setForm((current) => ({ ...current, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((current) => ({ ...current, [key]: '' }))
    if (formError) setFormError('')
  }

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {}
    const name = form.name.trim()
    const domain = form.domain.trim()
    const email = form.contactEmail.trim()
    if (!name) errors.name = 'Store name is required.'
    if (!domain) errors.domain = 'Store domain is required.'
    else {
      if (/^https?:\/\//i.test(domain) || domain.includes('/') || domain.includes('?') || domain.includes('#')) errors.domain = 'Enter a hostname only, without "https://" or a path.'
      else if (/\s/.test(domain) || !isValidStoreDomain(domain)) errors.domain = 'Enter a valid store domain, such as store.example.com.'
    }
    if (email && !EMAIL_RE.test(email)) errors.contactEmail = 'Enter a valid contact email address.'
    if (!CURRENCIES.includes(form.currency as (typeof CURRENCIES)[number])) errors.currency = 'Select a valid currency.'
    if (!form.timezone.trim()) errors.timezone = 'Timezone is required.'
    if (!form.dateFormat.trim()) errors.dateFormat = 'Date format is required.'
    if (!form.status.trim()) errors.status = 'Store status is required.'
    setFieldErrors(errors)
    setFormError(Object.keys(errors).length ? 'Please correct the highlighted fields.' : '')
    return Object.keys(errors).length === 0
  }

  const onCancel = () => {
    setForm(saved)
    setFieldErrors({})
    setFormError('')
    toast('Changes discarded.', 'success')
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !canEdit) return
    if (!validate()) return
    if (!record || String(record.id) !== storeId) { toast('Store not found. Settings cannot be saved.', 'error'); return }
    setBusy(true); setFormError('')
    try {
      // Re-verify store exists and belongs to route before saving.
      const found = await getStoreById(storeId)
      if (!found || String(found.id) !== storeId) throw { message: 'Store not found. Settings cannot be saved.', code: 'NOT_FOUND' }
      // Data safety: send only editable settings fields. Mock merge preserves existing fields (owner, plan, mrr, products, id, createdAt, and any unknown metadata).
      const payload: Partial<BaseRecord> = {
        name: form.name.trim(),
        description: form.description.trim(),
        logoImageUrl: form.logoImageUrl.trim(),
        bannerImageUrl: form.bannerImageUrl.trim(),
        contactEmail: form.contactEmail.trim(),
        phoneNumber: form.phoneNumber.trim(),
        businessAddress: form.businessAddress.trim(),
        currency: form.currency,
        timezone: form.timezone.trim(),
        dateFormat: form.dateFormat.trim(),
        domain: form.domain.trim(), // validated; existing value preserved unless explicitly changed
        status: form.status as BaseRecord['status'],
      }
      const savedRecord = await savePlatformRecord('stores', payload, storeId)
      const next = toForm(savedRecord)
      setRecord(savedRecord)
      setForm(next)
      setSaved(next)
      setFieldErrors({})
      // Sync workspace header (name/domain/status) immediately without a full page refresh.
      if (String(savedRecord.id) === storeId) void refreshStore(savedRecord as Store)
      toast(`Store settings saved${mockMode ? ' in demo data' : ''}.`, 'success')
    } catch (err) {
      const apiError = toApiError(err)
      setFormError(apiError.message)
      toast(apiError.message, 'error')
    } finally { setBusy(false) }
  }

  if (!canView) return <div className="empty-state" role="alert"><strong>Access restricted</strong><span>You do not have permission to view store settings.</span></div>
  if (loading) return <div className="loading-skeleton" aria-label="Loading store settings"><span /><span /><span /><span /></div>
  if (missingStore) return <div className="error-state"><i className="bi bi-exclamation-triangle" /><strong>Store not found</strong><span>The selected store ({storeId}) could not be found. Settings are unavailable.</span><button className="btn btn-outline-secondary btn-sm" onClick={() => void load()}>Retry</button></div>
  if (loadError) return <div className="error-state"><i className="bi bi-exclamation-triangle" /><strong>Couldn’t load store settings</strong><span>{loadError}</span><button className="btn btn-outline-secondary btn-sm" onClick={() => void load()}>Retry</button></div>

  const readOnly = !canEdit
  const fieldClass = (key: keyof FormState) => `form-control${fieldErrors[key] ? ' is-invalid' : ''}`

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="page-heading" style={{ marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>Store Settings</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 12 }}>Store-specific settings for <strong>{record?.name ? String(record.name) : store.name}</strong> ({storeId}). Changes affect only this store and preserve unrelated store fields/metadata.</p>
        </div>
        <div className="page-actions">
          {canEdit ? <><button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={busy}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></> : <span className="badge bg-secondary">Read-only</span>}
        </div>
      </div>

      {mockMode && <div className="settings-notice" role="status"><i className="bi bi-info-circle" /> Demo mode: settings are saved to browser-local demo data for this store only. Refreshing preserves saved values.</div>}
      {readOnly && <div className="settings-notice" role="status"><i className="bi bi-shield-lock" /> You have read-only access to store settings. Frontend permissions are not production security; backend authorization is required in production.</div>}
      {formError && !Object.keys(fieldErrors).length && <p className="form-hint text-danger" role="alert"><i className="bi bi-exclamation-circle me-1" />{formError}</p>}

      <section className="panel resource-panel" style={{ marginBottom: 14 }}>
        <div className="table-title" style={{ marginBottom: 12 }}><h2>General</h2></div>
        <div className="modal-body form-grid" style={{ padding: 0 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="store-name">Store name <span aria-hidden="true">*</span></label>
            <input id="store-name" className={fieldClass('name')} value={form.name} onChange={setField('name')} disabled={readOnly || busy} required />
            {fieldErrors.name && <p className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors.name}</p>}
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="store-description">Store description</label>
            <textarea id="store-description" className={fieldClass('description')} rows={3} value={form.description} onChange={setField('description')} disabled={readOnly || busy} />
          </div>
          <div>
            <label htmlFor="store-logo">Logo image URL</label>
            <input id="store-logo" className={fieldClass('logoImageUrl')} value={form.logoImageUrl} onChange={setField('logoImageUrl')} disabled={readOnly || busy} placeholder="https://..." />
            <p className="form-hint" style={{ marginTop: 4, marginBottom: 0 }}>URL only (no image upload in this phase).</p>
          </div>
          <div>
            <label htmlFor="store-banner">Banner image URL</label>
            <input id="store-banner" className={fieldClass('bannerImageUrl')} value={form.bannerImageUrl} onChange={setField('bannerImageUrl')} disabled={readOnly || busy} placeholder="https://..." />
          </div>
        </div>
      </section>

      <section className="panel resource-panel" style={{ marginBottom: 14 }}>
        <div className="table-title" style={{ marginBottom: 12 }}><h2>Contact</h2></div>
        <div className="modal-body form-grid" style={{ padding: 0 }}>
          <div>
            <label htmlFor="store-email">Contact email</label>
            <input id="store-email" type="email" className={fieldClass('contactEmail')} value={form.contactEmail} onChange={setField('contactEmail')} disabled={readOnly || busy} placeholder="store@example.com" />
            {fieldErrors.contactEmail && <p className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors.contactEmail}</p>}
          </div>
          <div>
            <label htmlFor="store-phone">Phone number</label>
            <input id="store-phone" className={fieldClass('phoneNumber')} value={form.phoneNumber} onChange={setField('phoneNumber')} disabled={readOnly || busy} placeholder="+1 555 0100" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="store-address">Business address</label>
            <textarea id="store-address" className={fieldClass('businessAddress')} rows={2} value={form.businessAddress} onChange={setField('businessAddress')} disabled={readOnly || busy} placeholder="Street, city, region, postal code, country" />
          </div>
        </div>
      </section>

      <section className="panel resource-panel" style={{ marginBottom: 14 }}>
        <div className="table-title" style={{ marginBottom: 12 }}><h2>Regional</h2></div>
        <div className="modal-body form-grid" style={{ padding: 0 }}>
          <div>
            <label htmlFor="store-currency">Currency <span aria-hidden="true">*</span></label>
            <select id="store-currency" className={fieldClass('currency')} value={form.currency} onChange={setField('currency')} disabled={readOnly || busy}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {fieldErrors.currency && <p className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors.currency}</p>}
          </div>
          <div>
            <label htmlFor="store-timezone">Timezone <span aria-hidden="true">*</span></label>
            <input id="store-timezone" className={fieldClass('timezone')} value={form.timezone} onChange={setField('timezone')} disabled={readOnly || busy} placeholder="UTC" />
            {fieldErrors.timezone && <p className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors.timezone}</p>}
          </div>
          <div>
            <label htmlFor="store-date-format">Date format <span aria-hidden="true">*</span></label>
            <input id="store-date-format" className={fieldClass('dateFormat')} value={form.dateFormat} onChange={setField('dateFormat')} disabled={readOnly || busy} placeholder="YYYY-MM-DD" />
            {fieldErrors.dateFormat && <p className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors.dateFormat}</p>}
          </div>
        </div>
      </section>

      <section className="panel resource-panel">
        <div className="table-title" style={{ marginBottom: 12 }}><h2>Configuration</h2></div>
        <div className="modal-body form-grid" style={{ padding: 0 }}>
          <div>
            <label htmlFor="store-domain">Store domain <span aria-hidden="true">*</span></label>
            <input id="store-domain" className={fieldClass('domain')} value={form.domain} onChange={setField('domain')} disabled={readOnly || busy} placeholder="store.example.com" />
            {fieldErrors.domain && <p className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors.domain}</p>}
            <p className="form-hint" style={{ marginTop: 4, marginBottom: 0 }}>Hostname only (no https:// or path). Existing values are preserved unless you change them.</p>
          </div>
          <div>
            <label htmlFor="store-status">Store status <span aria-hidden="true">*</span></label>
            <select id="store-status" className={fieldClass('status')} value={form.status} onChange={setField('status')} disabled={readOnly || busy}>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {fieldErrors.status && <p className="form-hint text-danger" role="alert" style={{ marginTop: 4, marginBottom: 0 }}>{fieldErrors.status}</p>}
            <p className="form-hint" style={{ marginTop: 4, marginBottom: 0 }}>Affects only this store. Non-standard existing statuses are preserved as selectable values.</p>
          </div>
        </div>
        {formError && Object.keys(fieldErrors).length > 0 && <p className="form-hint text-danger" role="alert" style={{ marginTop: 10 }}><i className="bi bi-exclamation-circle me-1" />{formError}</p>}
        <p className="form-hint" style={{ marginTop: 10, marginBottom: 0 }}><i className="bi bi-lock me-1" />Store identity/metadata not shown here (ID, creation timestamp, owner, plan, MRR, product counts) are preserved. Global platform settings are unchanged.</p>
      </section>
    </form>
  )
}
