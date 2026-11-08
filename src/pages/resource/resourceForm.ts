import type { BaseRecord } from '../../types/models'

export type ResourceFieldType = 'text' | 'email' | 'number' | 'integer' | 'date' | 'select' | 'textarea'

export interface ResourceFieldSchema {
  key: string
  label: string
  type: ResourceFieldType
  required?: boolean
  min?: number
  max?: number
  step?: number
  options?: string[]
  placeholder?: string
}

export interface ResourceValidationResult {
  values: Record<string, string | number>
  fieldErrors: Record<string, string>
  formError?: string
}

function prettyLabel(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase())
}

function isValidDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) && !/[A-Za-z]{3,}/.test(value)) return false
  const time = Date.parse(value)
  return Number.isFinite(time)
}

export function isValidStoreDomain(value: string): boolean {
  // Hostname only (no URL scheme/path/query/fragment, no spaces). Existing seed domains remain valid.
  return /^(?!-)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/.test(value)
}

function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

function normalizeResourceSchemaKey(resource: string): string {
  if (resource.startsWith('store-products:') || resource === 'store-products') return 'store-products'
  if (resource.startsWith('store-categories:') || resource === 'store-categories') return 'store-categories'
  return resource
}

const commonStatusOptions = ['Active', 'Trial', 'Past due', 'Suspended', 'Draft', 'Paid', 'Failed', 'Pending', 'Open', 'Resolved', 'Cancelled']

export function getResourceFieldSchemas(resource: string, fields: string[]): ResourceFieldSchema[] {
  const schemaResource = normalizeResourceSchemaKey(resource)
  const known: Record<string, Record<string, Partial<ResourceFieldSchema>>> = {
    stores: {
      name: { type: 'text', required: true },
      owner: { type: 'text', required: true },
      domain: { type: 'text', required: true, placeholder: 'store.example.com' },
      plan: { type: 'select', required: true, options: ['Free', 'Starter', 'Professional', 'Enterprise'] },
    },
    tenants: {
      name: { type: 'text', required: true },
      email: { type: 'email', required: true },
      plan: { type: 'select', required: true, options: ['Free', 'Starter', 'Professional', 'Enterprise'] },
    },
    'platform-users': {
      name: { type: 'text', required: true },
      email: { type: 'email', required: true },
      role: { type: 'select', required: true, options: ['Super Admin', 'Platform Admin', 'Billing Admin', 'Support Agent', 'Analyst'] },
    },
    roles: {
      name: { type: 'text', required: true },
      users: { type: 'integer', required: true, min: 0, max: 100000 },
      permissions: { type: 'integer', required: true, min: 0, max: 100000 },
    },
    plans: {
      name: { type: 'text', required: true },
      monthly: { type: 'number', required: true, min: 0, max: 1000000, step: 0.01 },
      annual: { type: 'number', required: true, min: 0, max: 10000000, step: 0.01 },
      stores: { type: 'integer', required: true, min: 0, max: 100000 },
      products: { type: 'integer', required: true, min: 0, max: 10000000 },
    },
    subscriptions: {
      tenant: { type: 'text', required: true },
      store: { type: 'text', required: true },
      plan: { type: 'select', required: true, options: ['Free', 'Starter', 'Professional', 'Enterprise'] },
      cycle: { type: 'select', required: true, options: ['Monthly', 'Annual'] },
      nextBilling: { type: 'date', required: true, placeholder: 'YYYY-MM-DD or Nov 24, 2026' },
      amount: { type: 'number', required: true, min: 0, max: 1000000, step: 0.01 },
    },
    billing: {
      number: { type: 'text', required: true },
      tenant: { type: 'text', required: true },
      amount: { type: 'number', required: true, min: 0, max: 1000000, step: 0.01 },
      dueDate: { type: 'date', required: true, placeholder: 'YYYY-MM-DD or Nov 24, 2026' },
    },
    payments: {
      tenant: { type: 'text', required: true },
      invoice: { type: 'text', required: true },
      gateway: { type: 'select', required: true, options: ['Stripe', 'Adyen', 'PayPal', 'Manual'] },
      amount: { type: 'number', required: true, min: 0, max: 1000000, step: 0.01 },
      date: { type: 'date', required: true },
    },
    promotions: {
      name: { type: 'text', required: true },
      code: { type: 'text', required: true },
      discount: { type: 'text', required: true, placeholder: '20% or $10' },
      redemptions: { type: 'integer', required: true, min: 0, max: 10000000 },
      expires: { type: 'date', required: true, placeholder: 'YYYY-MM-DD or Dec 31, 2026' },
    },
    monitoring: {
      name: { type: 'text', required: true },
      usage: { type: 'text' },
      lastSync: { type: 'text' },
    },
    'audit-logs': {
      user: { type: 'text', required: true },
      action: { type: 'text', required: true },
      resource: { type: 'text', required: true },
      ip: { type: 'text', required: true },
    },
    notifications: {
      title: { type: 'text', required: true },
      type: { type: 'select', required: true, options: ['Maintenance', 'Feature update', 'Announcement', 'Security', 'Billing'] },
      audience: { type: 'text', required: true },
      sent: { type: 'text' },
    },
    integrations: {
      name: { type: 'text', required: true },
      category: { type: 'select', required: true, options: ['Payments', 'Email', 'Shipping', 'Analytics', 'Support', 'Other'] },
      usage: { type: 'text' },
      lastSync: { type: 'text' },
    },
    settings: {
      platformName: { type: 'text', required: true },
      currency: { type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] },
      timezone: { type: 'text', required: true },
      language: { type: 'select', required: true, options: ['en', 'es', 'fr', 'de'] },
    },
    security: {
      name: { type: 'text', required: true },
      email: { type: 'email', required: true },
      role: { type: 'text' },
      lastLogin: { type: 'text' },
    },
    support: {
      subject: { type: 'text', required: true },
      tenant: { type: 'text', required: true },
      priority: { type: 'select', required: true, options: ['Low', 'Normal', 'High', 'Urgent'] },
      assignee: { type: 'text' },
    },
    'store-products': {
      name: { type: 'text', required: true, label: 'Name' },
      slug: { type: 'text', required: true, label: 'Slug', placeholder: 'canvas-tote' },
      description: { type: 'textarea', required: false, label: 'Description', placeholder: 'Short product description' },
      price: { type: 'number', required: true, min: 0, max: 1000000, step: 0.01, label: 'Price' },
      image: { type: 'text', required: false, label: 'Image URL', placeholder: 'https://...' },
      category: { type: 'text', required: true, label: 'Category' },
      stockQuantity: { type: 'integer', required: true, min: 0, max: 10000000, label: 'Stock quantity' },
    },
    'store-categories': {
      name: { type: 'text', required: true, label: 'Name' },
      slug: { type: 'text', required: true, label: 'Slug', placeholder: 'accessories' },
      description: { type: 'textarea', required: false, label: 'Description', placeholder: 'Optional description' },
      image: { type: 'text', required: false, label: 'Image URL', placeholder: 'https://...' },
      status: { type: 'select', required: true, label: 'Status', options: ['Active', 'Draft'] },
    },
  }
  const resourceSchema = known[schemaResource] ?? {}
  return fields.map((fieldKey) => {
    const field = resourceSchema[fieldKey] ?? {}
    const type = field.type ?? (fieldKey === 'email' ? 'email' : fieldKey === 'status' ? 'select' : 'text')
    return {
      key: fieldKey,
      label: field.label ?? prettyLabel(fieldKey),
      type,
      required: field.required ?? false,
      min: field.min,
      max: field.max,
      step: field.step,
      options: field.options ?? (fieldKey === 'status' ? commonStatusOptions : undefined),
      placeholder: field.placeholder ?? `Enter ${prettyLabel(fieldKey).toLowerCase()}`,
    }
  })
}

export function validateResourceForm(resource: string, fields: string[], form: Record<string, string>): ResourceValidationResult {
  const schemas = getResourceFieldSchemas(resource, fields)
  const values: Record<string, string | number> = {}
  const fieldErrors: Record<string, string> = {}

  for (const schema of schemas) {
    const raw = form[schema.key] ?? ''
    const value = String(raw).trim()
    if (!value) {
      if (schema.required) fieldErrors[schema.key] = `${schema.label} is required.`
      else if (schema.type !== 'number' && schema.type !== 'integer') values[schema.key] = ''
      // Empty optional numeric/integer fields are omitted (not coerced to 0).
      continue
    }

    if (schema.type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fieldErrors[schema.key] = `Enter a valid ${schema.label.toLowerCase()}.`
      else values[schema.key] = value
      continue
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      const num = Number(value)
      if (!Number.isFinite(num)) { fieldErrors[schema.key] = `${schema.label} must be a valid number.`; continue }
      if (schema.type === 'integer' && !Number.isInteger(num)) { fieldErrors[schema.key] = `${schema.label} must be a whole number.`; continue }
      if (schema.min !== undefined && num < schema.min) { fieldErrors[schema.key] = `${schema.label} must be at least ${schema.min}.`; continue }
      if (schema.max !== undefined && num > schema.max) { fieldErrors[schema.key] = `${schema.label} must be ${schema.max} or less.`; continue }
      values[schema.key] = num
      continue
    }

    if (schema.type === 'date') {
      if (!isValidDateValue(value)) fieldErrors[schema.key] = `${schema.label} must be a valid date.`
      else values[schema.key] = value
      continue
    }

    if (schema.type === 'select' && schema.options?.length && !schema.options.includes(value)) {
      fieldErrors[schema.key] = `Select a valid ${schema.label.toLowerCase()}.`
      continue
    }

    const schemaResource = normalizeResourceSchemaKey(resource)
    if (schemaResource === 'stores' && schema.key === 'domain') {
      if (/^https?:\/\//i.test(value) || value.includes('/') || value.includes('?') || value.includes('#')) {
        fieldErrors[schema.key] = 'Enter a hostname only, without "https://" or a path.'
        continue
      }
      if (/\s/.test(value) || !isValidStoreDomain(value)) {
        fieldErrors[schema.key] = 'Enter a valid store domain, such as store.example.com.'
        continue
      }
    }

    if ((schemaResource === 'store-products' || schemaResource === 'store-categories') && schema.key === 'slug') {
      if (!isValidSlug(value)) {
        fieldErrors[schema.key] = 'Slug must use lowercase letters, numbers, and hyphens only.'
        continue
      }
    }

    values[schema.key] = value
  }

  return { values, fieldErrors, formError: Object.keys(fieldErrors).length ? 'Please correct the highlighted fields.' : undefined }
}

export function formValuesFromRecord(fields: string[], record?: BaseRecord | null): Record<string, string> {
  if (!record) return {}
  return Object.fromEntries(fields.map((field) => [field, String(record[field] ?? '')]))
}
