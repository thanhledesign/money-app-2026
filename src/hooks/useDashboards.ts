import { useState, useCallback, useEffect } from 'react'
import type { Dashboard, DashboardIndex } from '@/data/types'
import { MAX_FREE_DASHBOARDS } from '@/data/types'
import {
  setStoragePrefix, loadDashboardIndex, saveDashboardIndex,
  createDashboardEntry, deleteDashboardEntry, renameDashboardEntry,
} from '@/lib/store'

export function useDashboards(userId?: string) {
  setStoragePrefix(userId)

  const [index, setIndex] = useState<DashboardIndex>(() => loadDashboardIndex())

  // Reload when userId changes
  useEffect(() => {
    setStoragePrefix(userId)
    setIndex(loadDashboardIndex())
  }, [userId])

  const dashboards = index.dashboards
  const activeId = index.activeId
  const activeDashboard = dashboards.find(d => d.id === activeId) ?? dashboards[0]
  const canCreate = dashboards.length < MAX_FREE_DASHBOARDS
  const atLimit = dashboards.length >= MAX_FREE_DASHBOARDS

  const switchDashboard = useCallback((id: string) => {
    const idx = loadDashboardIndex()
    idx.activeId = id
    saveDashboardIndex(idx)
    setIndex(idx)
  }, [])

  const createDashboard = useCallback((dashboard: Dashboard) => {
    const idx = createDashboardEntry(dashboard)
    setIndex(idx)
    return idx
  }, [])

  const deleteDashboard = useCallback((id: string) => {
    const idx = deleteDashboardEntry(id)
    setIndex(idx)
  }, [])

  const renameDashboard = useCallback((id: string, name: string, emoji: string) => {
    const idx = renameDashboardEntry(id, name, emoji)
    setIndex(idx)
  }, [])

  return {
    dashboards,
    activeId,
    activeDashboard,
    canCreate,
    atLimit,
    switchDashboard,
    createDashboard,
    deleteDashboard,
    renameDashboard,
  }
}
