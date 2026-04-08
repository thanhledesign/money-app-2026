import type { AppData, Snapshot, Account, BudgetItem, Goal, Dashboard, DashboardIndex } from '@/data/types'
import {
  defaultAccounts, seedSnapshots, defaultComp, defaultDeductions,
  defaultAllocations, defaultBudgetItems, defaultGoals,
} from '@/data/seed'

// ── Prefix system ──
// Format: money-app-[u-{userId}-]d-{dashboardId}-
let _userPrefix = 'money-app-'
let _dashboardId = 'default'

export function setStoragePrefix(userId?: string) {
  _userPrefix = userId ? `money-app-u-${userId}-` : 'money-app-'
}

export function setDashboardId(dashboardId: string) {
  _dashboardId = dashboardId
}

export function getStorageKey(base: string): string {
  return `${_userPrefix}d-${_dashboardId}-${base}`
}

// Key that's NOT dashboard-scoped (for dashboard index, wizard, etc.)
export function getUserKey(base: string): string {
  return `${_userPrefix}${base}`
}

// ── Dashboard Index ──

function getDefaultDashboardIndex(): DashboardIndex {
  return {
    dashboards: [
      {
        id: 'default',
        name: 'My Finances',
        emoji: '📊',
        mode: 'scenario',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sample',
        name: 'Sample Dashboard',
        emoji: '🎯',
        mode: 'scenario',
        createdAt: new Date().toISOString(),
      },
    ],
    activeId: 'default',
  }
}

// Initialize the sample dashboard with seed data
function initSampleDashboard(): void {
  const key = `${_userPrefix}d-sample-data`
  if (localStorage.getItem(key)) return // already exists
  const data = getSeededData()
  localStorage.setItem(key, JSON.stringify(data))
  // Mark wizard done for sample
  localStorage.setItem(`${_userPrefix}d-sample-wizard-done`, 'true')
}

export function loadDashboardIndex(): DashboardIndex {
  const key = getUserKey('dashboards')
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as DashboardIndex

    // Migration: check if old data exists under the legacy key
    const legacyKey = `${_userPrefix}data`
    const legacyData = localStorage.getItem(legacyKey)
    const idx = getDefaultDashboardIndex()

    if (legacyData) {
      // Migrate: copy old data to new dashboard-scoped key
      const newKey = `${_userPrefix}d-default-data`
      localStorage.setItem(newKey, legacyData)
      // Also migrate wizard-done flag
      const legacyWizard = localStorage.getItem(`${_userPrefix}wizard-done`)
      if (legacyWizard) {
        localStorage.setItem(`${_userPrefix}d-default-wizard-done`, legacyWizard)
      }
      // Remove legacy keys
      localStorage.removeItem(legacyKey)
      localStorage.removeItem(`${_userPrefix}wizard-done`)
    }

    saveDashboardIndex(idx)
    initSampleDashboard()
    return idx
  } catch {
    const idx = getDefaultDashboardIndex()
    saveDashboardIndex(idx)
    initSampleDashboard()
    return idx
  }
}

export function saveDashboardIndex(index: DashboardIndex): void {
  localStorage.setItem(getUserKey('dashboards'), JSON.stringify(index))
}

export function createDashboardEntry(dashboard: Dashboard): DashboardIndex {
  const idx = loadDashboardIndex()
  idx.dashboards.push(dashboard)
  idx.activeId = dashboard.id
  saveDashboardIndex(idx)

  // Initialize empty data for scenario dashboards
  if (dashboard.mode === 'scenario') {
    setDashboardId(dashboard.id)
    saveData(getEmptyData())
  }

  return idx
}

export function deleteDashboardEntry(id: string): DashboardIndex {
  if (id === 'default') return loadDashboardIndex() // Can't delete default
  const idx = loadDashboardIndex()
  idx.dashboards = idx.dashboards.filter(d => d.id !== id)
  if (idx.activeId === id) idx.activeId = 'default'
  saveDashboardIndex(idx)

  // Remove stored data
  const dataKey = `${_userPrefix}d-${id}-data`
  localStorage.removeItem(dataKey)
  localStorage.removeItem(`${_userPrefix}d-${id}-wizard-done`)

  return idx
}

export function renameDashboardEntry(id: string, name: string, emoji: string): DashboardIndex {
  const idx = loadDashboardIndex()
  const dash = idx.dashboards.find(d => d.id === id)
  if (dash) {
    dash.name = name
    dash.emoji = emoji
  }
  saveDashboardIndex(idx)
  return idx
}

// ── Merged data for combined dashboards ──

export function getMergedData(mergeIds: string[]): AppData {
  const merged = getEmptyData()
  const seenAccountIds = new Set<string>()

  for (const did of mergeIds) {
    setDashboardId(did)
    const data = loadData()

    // Merge accounts (deduplicate by id)
    for (const acc of data.accounts) {
      if (!seenAccountIds.has(acc.id)) {
        seenAccountIds.add(acc.id)
        merged.accounts.push(acc)
      }
    }

    // Merge snapshots (keep all, tag with dashboard source)
    merged.snapshots.push(...data.snapshots)

    // Merge budget items (keep all — may have duplicates, user can review)
    merged.budgetItems.push(...data.budgetItems)

    // Merge goals
    merged.goals.push(...data.goals)

    // Use the first non-zero comp found
    if (merged.comp.annualSalary === 0 && data.comp.annualSalary > 0) {
      merged.comp = { ...data.comp }
      merged.deductions = [...data.deductions]
      merged.allocations = [...data.allocations]
      merged.payFrequency = data.payFrequency
      merged.paychecksPerMonth = [...data.paychecksPerMonth]
    }
  }

  // Sort snapshots by date
  merged.snapshots.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  return merged
}

// ── AppData CRUD ──

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

function getDefaultData(): AppData {
  // All dashboards start empty — sample dashboard is initialized separately
  return getEmptyData()
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

export function resetSnapshots(): AppData {
  const data = loadData()
  data.snapshots = []
  saveData(data)
  return data
}

export function resetAccounts(): AppData {
  const data = loadData()
  data.accounts = []
  saveData(data)
  return data
}

export function resetBudget(): AppData {
  const data = loadData()
  data.budgetItems = []
  data.budgetActuals = []
  saveData(data)
  return data
}

export function resetGoals(): AppData {
  const data = loadData()
  data.goals = []
  saveData(data)
  return data
}

export function resetIncome(): AppData {
  const data = loadData()
  data.comp = { annualSalary: 0, bonus: 0, ltiPreTax: 0, taxRate: 0 }
  data.deductions = []
  data.allocations = []
  saveData(data)
  return data
}

export function nukeAllData(): void {
  localStorage.removeItem(getStorageKey('data'))
  localStorage.removeItem(getStorageKey('wizard-done'))
}

export function exportData(): string {
  return localStorage.getItem(getStorageKey('data')) || '{}'
}

export function importData(json: string): AppData {
  const data = JSON.parse(json) as AppData
  saveData(data)
  return data
}
