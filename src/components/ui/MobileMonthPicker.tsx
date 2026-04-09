import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  monthKeys: string[]
  labelMonth: (key: string) => string
  currentMonthKey: string
  selectedMonth: string
  onSelect: (key: string) => void
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

export function MobileMonthPicker({ monthKeys, labelMonth, currentMonthKey, selectedMonth, onSelect }: Props) {
  const isMobile = useIsMobile()
  if (!isMobile || monthKeys.length === 0) return null

  const idx = monthKeys.indexOf(selectedMonth)
  const hasPrev = idx > 0
  const hasNext = idx < monthKeys.length - 1

  return (
    <div className="flex items-center justify-between gap-2 mb-3 sm:hidden">
      <button
        onClick={() => hasPrev && onSelect(monthKeys[idx - 1])}
        disabled={!hasPrev}
        className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <select
        value={selectedMonth}
        onChange={e => onSelect(e.target.value)}
        className="flex-1 text-center py-1.5 px-2 rounded-lg bg-background border border-border text-sm text-text-primary font-medium"
      >
        {monthKeys.map(mk => (
          <option key={mk} value={mk}>
            {labelMonth(mk)}{mk === currentMonthKey ? ' (current)' : ''}
          </option>
        ))}
      </select>
      <button
        onClick={() => hasNext && onSelect(monthKeys[idx + 1])}
        disabled={!hasNext}
        className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text-secondary disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export function useMobileMonth(monthKeys: string[], currentMonthKey: string) {
  const [selected, setSelected] = useState(() => {
    // Default to current month or latest available
    if (monthKeys.includes(currentMonthKey)) return currentMonthKey
    return monthKeys[monthKeys.length - 1] ?? ''
  })

  // If monthKeys change and selected is no longer in list, snap to latest
  useEffect(() => {
    if (monthKeys.length > 0 && !monthKeys.includes(selected)) {
      setSelected(monthKeys[monthKeys.length - 1])
    }
  }, [monthKeys, selected])

  return [selected, setSelected] as const
}
