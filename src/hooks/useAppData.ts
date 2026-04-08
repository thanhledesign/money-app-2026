import { useState, useCallback, useEffect, useRef } from 'react'
import type { AppData, Snapshot, Account, BudgetItem, Goal } from '@/data/types'
import * as store from '@/lib/store'

export function useAppData(userId?: string) {
  const prevUserIdRef = useRef(userId)

  // Set prefix on initial call (before first render's useState)
  if (prevUserIdRef.current !== userId) {
    store.setStoragePrefix(userId)
    prevUserIdRef.current = userId
  }

  // Ensure prefix is set for initial load
  store.setStoragePrefix(userId)

  const [data, setData] = useState<AppData>(() => store.loadData())

  // When userId changes, switch storage scope and reload
  useEffect(() => {
    store.setStoragePrefix(userId)
    setData(store.loadData())
  }, [userId])

  const refresh = useCallback(() => setData(store.loadData()), [])

  const addSnapshot = useCallback((snapshot: Snapshot) => {
    setData(store.addSnapshot(snapshot))
  }, [])

  const updateSnapshot = useCallback((id: string, updates: Partial<Snapshot>) => {
    setData(store.updateSnapshot(id, updates))
  }, [])

  const deleteSnapshot = useCallback((id: string) => {
    setData(store.deleteSnapshot(id))
  }, [])

  const addAccount = useCallback((account: Account) => {
    setData(store.addAccount(account))
  }, [])

  const updateAccounts = useCallback((accounts: Account[]) => {
    setData(store.updateAccounts(accounts))
  }, [])

  const updateBudgetItems = useCallback((items: BudgetItem[]) => {
    setData(store.updateBudgetItems(items))
  }, [])

  const addGoal = useCallback((goal: Goal) => {
    setData(store.addGoal(goal))
  }, [])

  const updateComp = useCallback((comp: AppData['comp']) => {
    setData(store.updateComp(comp))
  }, [])

  const updateDeductions = useCallback((deductions: AppData['deductions']) => {
    setData(store.updateDeductions(deductions))
  }, [])

  const updateAllocations = useCallback((allocations: AppData['allocations']) => {
    setData(store.updateAllocations(allocations))
  }, [])

  const resetData = useCallback(() => {
    setData(store.resetData())
  }, [])

  return {
    data, refresh, addSnapshot, updateSnapshot, deleteSnapshot,
    addAccount, updateAccounts, updateBudgetItems, addGoal,
    updateComp, updateDeductions, updateAllocations, resetData,
  }
}
