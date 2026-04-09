import { useState, useCallback, useEffect } from 'react'
import type { AppData, Snapshot, Account, BudgetItem, Goal, Dashboard } from '@/data/types'
import * as store from '@/lib/store'
import { loadFromCloud } from '@/lib/sync'
import { useUndoRedo } from './useUndoRedo'

export function useAppData(userId?: string, dashboard?: Dashboard) {
  const dashboardId = dashboard?.id ?? 'default'
  const isReadOnly = dashboard?.mode === 'combined'

  // Set prefixes before first load
  store.setStoragePrefix(userId)
  store.setDashboardId(
    dashboard?.mode === 'view' ? (dashboard.sourceId ?? 'default') : dashboardId
  )

  const [data, setData] = useState<AppData>(() => {
    if (dashboard?.mode === 'combined' && dashboard.mergeIds?.length) {
      return store.getMergedData(dashboard.mergeIds)
    }
    return store.loadData()
  })

  // When userId or dashboard changes, reload from local then try cloud
  useEffect(() => {
    store.setStoragePrefix(userId)
    if (dashboard?.mode === 'combined' && dashboard.mergeIds?.length) {
      setData(store.getMergedData(dashboard.mergeIds))
    } else {
      const effectiveDashboardId = dashboard?.mode === 'view' ? (dashboard.sourceId ?? 'default') : dashboardId
      store.setDashboardId(effectiveDashboardId)
      setData(store.loadData())

      // Hydrate from cloud if authenticated
      if (userId && dashboard?.mode !== 'combined') {
        loadFromCloud(userId, `dashboards/${effectiveDashboardId}/data`).then(cloudData => {
          if (cloudData && typeof cloudData === 'object') {
            const cd = cloudData as AppData
            const localData = store.loadData()
            // Use cloud data if it has more snapshots OR newer latest snapshot
            const cloudLatest = cd.snapshots?.length ? cd.snapshots[cd.snapshots.length - 1]?.timestamp : ''
            const localLatest = localData.snapshots?.length ? localData.snapshots[localData.snapshots.length - 1]?.timestamp : ''
            const cloudIsNewer = (cd.snapshots?.length ?? 0) > (localData.snapshots?.length ?? 0)
              || (cloudLatest && cloudLatest > localLatest)
            if (cd.snapshots && cloudIsNewer) {
              store.saveData(cd)
              setData(cd)
            }
          }
        })
      }
    }
  }, [userId, dashboardId, dashboard?.mode, dashboard?.sourceId])

  const refresh = useCallback(() => {
    if (dashboard?.mode === 'combined' && dashboard.mergeIds?.length) {
      setData(store.getMergedData(dashboard.mergeIds))
    } else {
      setData(store.loadData())
    }
  }, [dashboard])

  // Mutation functions — no-op for combined (read-only) dashboards
  const noop = (() => data) as any

  const addSnapshot = useCallback((snapshot: Snapshot) => {
    if (isReadOnly) return
    setData(store.addSnapshot(snapshot))
  }, [isReadOnly])

  const updateSnapshot = useCallback((id: string, updates: Partial<Snapshot>) => {
    if (isReadOnly) return
    setData(store.updateSnapshot(id, updates))
  }, [isReadOnly])

  const deleteSnapshot = useCallback((id: string) => {
    if (isReadOnly) return
    setData(store.deleteSnapshot(id))
  }, [isReadOnly])

  const addAccount = useCallback((account: Account) => {
    if (isReadOnly) return
    setData(store.addAccount(account))
  }, [isReadOnly])

  const updateAccounts = useCallback((accounts: Account[]) => {
    if (isReadOnly) return
    setData(store.updateAccounts(accounts))
  }, [isReadOnly])

  const updateBudgetItems = useCallback((items: BudgetItem[]) => {
    if (isReadOnly) return
    setData(store.updateBudgetItems(items))
  }, [isReadOnly])

  const addGoal = useCallback((goal: Goal) => {
    if (isReadOnly) return
    setData(store.addGoal(goal))
  }, [isReadOnly])

  const updateComp = useCallback((comp: AppData['comp']) => {
    if (isReadOnly) return
    setData(store.updateComp(comp))
  }, [isReadOnly])

  const updateDeductions = useCallback((deductions: AppData['deductions']) => {
    if (isReadOnly) return
    setData(store.updateDeductions(deductions))
  }, [isReadOnly])

  const updateAllocations = useCallback((allocations: AppData['allocations']) => {
    if (isReadOnly) return
    setData(store.updateAllocations(allocations))
  }, [isReadOnly])

  const resetData = useCallback(() => {
    if (isReadOnly) return
    setData(store.resetData())
  }, [isReadOnly])

  const { undo, redo, canUndo, canRedo, showBar: showUndoBar } = useUndoRedo(data, setData)

  return {
    data, isReadOnly, refresh, addSnapshot, updateSnapshot, deleteSnapshot,
    addAccount, updateAccounts, updateBudgetItems, addGoal,
    updateComp, updateDeductions, updateAllocations, resetData,
    undo, redo, canUndo, canRedo, showUndoBar,
  }
}
