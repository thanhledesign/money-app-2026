import type { AppData, Account, Snapshot } from '@/data/types'

export function getLatestSnapshot(data: AppData): Snapshot | null {
  return data.snapshots.length > 0 ? data.snapshots[data.snapshots.length - 1] : null
}

export function getPreviousSnapshot(data: AppData): Snapshot | null {
  return data.snapshots.length > 1 ? data.snapshots[data.snapshots.length - 2] : null
}

export function getAccountsByCategory(data: AppData, category: Account['category']): Account[] {
  return data.accounts.filter(a => a.category === category)
}

export function getActiveAccounts(data: AppData): Account[] {
  return data.accounts.filter(a => a.isActive)
}

export function getCategoryTotal(snapshot: Snapshot, accounts: Account[]): number {
  return accounts.reduce((sum, acc) => sum + (snapshot.balances[acc.id] || 0), 0)
}

export function getTotalCash(snapshot: Snapshot, data: AppData): number {
  return getCategoryTotal(snapshot, getAccountsByCategory(data, 'cash'))
}

export function getTotalInvestments(snapshot: Snapshot, data: AppData): number {
  return getCategoryTotal(snapshot, getAccountsByCategory(data, 'investment'))
}

export function getTotalDebt(snapshot: Snapshot, data: AppData): number {
  return getCategoryTotal(snapshot, getAccountsByCategory(data, 'debt'))
}

export function getNetWorth(snapshot: Snapshot, data: AppData): number {
  return getTotalCash(snapshot, data) + getTotalInvestments(snapshot, data) + getTotalDebt(snapshot, data)
}

export function getDisneyConcentration(snapshot: Snapshot, data: AppData): number {
  const disneyAccounts = data.accounts.filter(a => a.institution === 'Disney Streaming' && a.category === 'investment')
  const disneyTotal = getCategoryTotal(snapshot, disneyAccounts)
  const investmentTotal = getTotalInvestments(snapshot, data)
  if (investmentTotal <= 0) return 0
  return disneyTotal / investmentTotal
}

export function getCreditUtilization(snapshot: Snapshot, data: AppData): number {
  const debtAccounts = getAccountsByCategory(data, 'debt')
  const totalDebt = Math.abs(getCategoryTotal(snapshot, debtAccounts))
  const totalLimit = debtAccounts.reduce((sum, a) => sum + (a.creditLimit || 0), 0)
  if (totalLimit <= 0) return 0
  return totalDebt / totalLimit
}

export function getMonthlyBurnRate(data: AppData): number {
  return data.budgetItems.reduce((sum, item) => {
    if (item.tier === 'fixed' || item.tier === 'variable') return sum + item.amount
    return sum
  }, 0)
}

export function getRunwayMonths(data: AppData): number {
  const latest = getLatestSnapshot(data)
  if (!latest) return 0
  const cash = getTotalCash(latest, data)
  const burn = getMonthlyBurnRate(data)
  if (burn <= 0) return Infinity
  return cash / burn
}

export function getSavingsRate(data: AppData): number {
  const monthlyNet = data.comp.annualSalary * (1 - data.comp.taxRate) / 12
  const burn = getMonthlyBurnRate(data)
  if (monthlyNet <= 0) return 0
  return (monthlyNet - burn) / monthlyNet
}

export function getMonthlyNetPay(data: AppData): number {
  const grossSemiMonthly = data.comp.annualSalary / 24
  const totalDeductions = data.deductions.reduce((sum, d) => sum + d.amount, 0)
  return (grossSemiMonthly - totalDeductions) * 2
}

export function getHealthScore(data: AppData): number {
  const latest = getLatestSnapshot(data)
  if (!latest) return 0

  let score = 0

  // Credit utilization < 30%: +15
  const utilization = getCreditUtilization(latest, data)
  if (utilization < 0.30) score += 15

  // Savings rate > 30%: +20
  const savingsRate = getSavingsRate(data)
  if (savingsRate > 0.30) score += 20
  else if (savingsRate > 0.15) score += 10

  // Disney concentration < 50%: +15
  const disney = getDisneyConcentration(latest, data)
  if (disney < 0.50) score += 15
  else if (disney < 0.70) score += 5

  // Runway > 3 months: +15
  const runway = getRunwayMonths(data)
  if (runway > 6) score += 15
  else if (runway > 3) score += 10

  // Debt trending down or zero: +15
  const debtTotal = getTotalDebt(latest, data)
  if (debtTotal >= 0) score += 15
  else {
    const prev = getPreviousSnapshot(data)
    if (prev) {
      const prevDebt = getTotalDebt(prev, data)
      if (debtTotal > prevDebt) score += 10 // improving (less negative)
    }
  }

  // Net worth growing: +10
  if (data.snapshots.length >= 2) {
    const prev = data.snapshots[data.snapshots.length - 2]
    const nwNow = getNetWorth(latest, data)
    const nwPrev = getNetWorth(prev, data)
    if (nwNow > nwPrev) score += 10
  }

  // Credit score > 750: +10
  if (latest.creditScore && latest.creditScore >= 750) score += 10
  else if (latest.creditScore && latest.creditScore >= 700) score += 5

  return score
}

export function getSnapshotDiff(current: Snapshot, previous: Snapshot, data: AppData) {
  const changes: { accountId: string; name: string; prev: number; curr: number; diff: number }[] = []
  for (const acc of data.accounts) {
    const curr = current.balances[acc.id] || 0
    const prev = previous.balances[acc.id] || 0
    if (Math.abs(curr - prev) > 0.01) {
      changes.push({ accountId: acc.id, name: acc.name, prev, curr, diff: curr - prev })
    }
  }
  changes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
  return changes
}

export function getMonthKey(timestamp: string): string {
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthlySnapshots(data: AppData): Map<string, Snapshot> {
  const monthly = new Map<string, Snapshot>()
  for (const s of data.snapshots) {
    const key = getMonthKey(s.timestamp)
    monthly.set(key, s) // last snapshot of each month wins
  }
  return monthly
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      notation: 'compact', maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatDateShort(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
}
