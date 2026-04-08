import type { AppData, Snapshot, Account, BudgetItem, Goal } from '@/data/types'
import {
  defaultAccounts, seedSnapshots, defaultComp, defaultDeductions,
  defaultAllocations, defaultBudgetItems, defaultGoals,
} from '@/data/seed'

// User-scoped storage prefix
let _prefix = 'money-app-'

export function setStoragePrefix(userId?: string) {
  _prefix = userId ? `money-app-u-${userId}-` : 'money-app-'
}

export function getStorageKey(base: string): string {
  return `${_prefix}${base}`
}

function getEmptyData(): AppData {
  return {
    accounts: [],
    snapshots: [],
    comp: { annualSalary: 0, bonus: 0, ltiPreTax: 0, taxRate: 0 },
    deductions: [],
    allocations: [],
    budgetItems: [],
    goals: [],
    budgetActuals: [],
    payFrequency: 'semimonthly',
    paychecksPerMonth: [5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 5],
  }
}

function getSeededData(): AppData {
  return {
    accounts: defaultAccounts,
    snapshots: seedSnapshots,
    comp: defaultComp,
    deductions: defaultDeductions,
    allocations: defaultAllocations,
    budgetItems: defaultBudgetItems,
    goals: defaultGoals,
    budgetActuals: [],
    payFrequency: 'semimonthly',
    paychecksPerMonth: [5, 4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 5],
  }
}

// Local (anonymous) users get seed data; authenticated users start empty
function getDefaultData(): AppData {
  const isUserScoped = _prefix !== 'money-app-'
  return isUserScoped ? getEmptyData() : getSeededData()
}

export function loadData(): AppData {
  try {
    const key = getStorageKey('data')
    const raw = localStorage.getItem(key)
    if (!raw) {
      const data = getDefaultData()
      saveData(data)
      return data
    }
    return JSON.parse(raw) as AppData
  } catch {
    const data = getDefaultData()
    saveData(data)
    return data
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(getStorageKey('data'), JSON.stringify(data))
}

export function addSnapshot(snapshot: Snapshot): AppData {
  const data = loadData()
  data.snapshots.push(snapshot)
  data.snapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  saveData(data)
  return data
}

export function updateSnapshot(id: string, updates: Partial<Snapshot>): AppData {
  const data = loadData()
  const idx = data.snapshots.findIndex(s => s.id === id)
  if (idx !== -1) data.snapshots[idx] = { ...data.snapshots[idx], ...updates }
  saveData(data)
  return data
}

export function deleteSnapshot(id: string): AppData {
  const data = loadData()
  data.snapshots = data.snapshots.filter(s => s.id !== id)
  saveData(data)
  return data
}

export function addAccount(account: Account): AppData {
  const data = loadData()
  data.accounts.push(account)
  saveData(data)
  return data
}

export function updateAccounts(accounts: Account[]): AppData {
  const data = loadData()
  data.accounts = accounts
  saveData(data)
  return data
}

export function updateBudgetItems(items: BudgetItem[]): AppData {
  const data = loadData()
  data.budgetItems = items
  saveData(data)
  return data
}

export function addGoal(goal: Goal): AppData {
  const data = loadData()
  data.goals.push(goal)
  data.goals.sort((a, b) => new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime())
  saveData(data)
  return data
}

export function updateComp(comp: AppData['comp']): AppData {
  const data = loadData()
  data.comp = comp
  saveData(data)
  return data
}

export function updateDeductions(deductions: AppData['deductions']): AppData {
  const data = loadData()
  data.deductions = deductions
  saveData(data)
  return data
}

export function updateAllocations(allocations: AppData['allocations']): AppData {
  const data = loadData()
  data.allocations = allocations
  saveData(data)
  return data
}

export function resetData(): AppData {
  const data = getDefaultData()
  saveData(data)
  return data
}

export function exportData(): string {
  return localStorage.getItem(getStorageKey('data')) || '{}'
}

export function importData(json: string): AppData {
  const data = JSON.parse(json) as AppData
  saveData(data)
  return data
}
