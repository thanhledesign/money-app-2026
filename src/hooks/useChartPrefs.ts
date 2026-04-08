import { useState, useCallback } from 'react'
import type { ChartPrefs } from '@/data/chartPrefs'
import { loadChartPrefs, saveChartPrefs, resetChartPrefs } from '@/data/chartPrefs'

export function useChartPrefs() {
  const [prefs, setPrefs] = useState<ChartPrefs>(() => loadChartPrefs())

  const update = useCallback((partial: Partial<ChartPrefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...partial }
      saveChartPrefs(next)
      return next
    })
  }, [])

  const setAccountColor = useCallback((accountId: string, color: string) => {
    setPrefs(prev => {
      const next = { ...prev, accountColors: { ...prev.accountColors, [accountId]: color } }
      saveChartPrefs(next)
      return next
    })
  }, [])

  const setLabelColor = useCallback((label: string, color: string) => {
    setPrefs(prev => {
      const next = { ...prev, labelColors: { ...prev.labelColors, [label]: color } }
      saveChartPrefs(next)
      return next
    })
  }, [])

  const setDashboardOrder = useCallback((order: string[]) => {
    setPrefs(prev => {
      const next = { ...prev, dashboardOrder: order }
      saveChartPrefs(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setPrefs(resetChartPrefs())
  }, [])

  return { prefs, update, setAccountColor, setLabelColor, setDashboardOrder, reset }
}
