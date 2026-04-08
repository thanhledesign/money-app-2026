import { formatCurrency } from '@/lib/calculations'

interface Column {
  key: string
  label: string
  isMonetary?: boolean
  align?: 'left' | 'right' | 'center'
  className?: string
}

interface DataTableProps {
  columns: Column[]
  rows: Record<string, string | number | null>[]
  highlightLast?: boolean
}

export function DataTable({ columns, rows, highlightLast }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th
                key={col.key}
                className={`py-2.5 px-3 font-medium text-text-muted text-xs uppercase tracking-wider ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-border-light transition-colors hover:bg-surface-hover ${
                highlightLast && i === rows.length - 1 ? 'bg-accent/5 font-semibold' : ''
              }`}
            >
              {columns.map(col => {
                const val = row[col.key]
                const numVal = typeof val === 'number' ? val : null
                return (
                  <td
                    key={col.key}
                    className={`py-2.5 px-3 tabular-nums ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${
                      col.isMonetary && numVal !== null
                        ? numVal > 0 ? 'text-green' : numVal < 0 ? 'text-red' : 'text-text-secondary'
                        : 'text-text-primary'
                    } ${col.className || ''}`}
                  >
                    {col.isMonetary && numVal !== null ? formatCurrency(numVal) : (val ?? '—')}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
