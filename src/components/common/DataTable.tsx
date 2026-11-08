import type { ReactNode } from 'react'

export interface DataColumn<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  empty
}: {
  rows: T[]
  columns: DataColumn<T>[]
  empty?: ReactNode
}) {
  return (
    <div className="table-responsive">
      <table className="table align-middle data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={`header-${column.key}`}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              {columns.map(column => (
                <td key={`${row.id}-${column.key}`}>
                  {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
