export type SectionWidth = 'full' | 'half'

export interface ChartPrefs {
  curveType: 'smooth' | 'sharp'
  showDots: boolean
  accountColors: Record<string, string>
  labelColors: Record<string, string>
  dashboardOrder: string[]
  savedLayouts: Record<string, { order: string[]; hidden: string[] }>
  hiddenSections: string[]
  sectionWidths: Record<string, SectionWidth>
}

const PREFS_KEY = 'money-app-chart-prefs'

const DEFAULT_ACCOUNT_COLORS: Record<string, string> = {
  // Cash
  'hysa-1': '#22c55e',
  'checking-1': '#3b82f6',
  'savings-1': '#06b6d4',
  'checking-2': '#8b5cf6',
  'cu-checking': '#f59e0b',
  'cu-savings': '#eab308',
  // Investments
  'bond-fund': '#14b8a6',
  'brokerage-1': '#ef4444',
  'roth-ira': '#f97316',
  'employer-401k': '#ec4899',
  'employer-match': '#d946ef',
  'employer-lti': '#f43f5e',
  // Debt
  'cc-rewards': '#a3a3a3',
  'cc-travel': '#3b82f6',
  'cc-cashback': '#f59e0b',
}

const DEFAULT_LABEL_COLORS: Record<string, string> = {
  'Housing': '#ef4444',
  'Transportation': '#f59e0b',
  'Subscriptions': '#a855f7',
  'Food & Living': '#22c55e',
  'Savings': '#3b82f6',
  'Investing': '#06b6d4',
  'cash': '#22c55e',
  'investment': '#3b82f6',
  'debt': '#ef4444',
}

const DEFAULT_DASHBOARD_ORDER = [
  'warnings',
  'kpi-net-worth', 'kpi-cash', 'kpi-investments', 'kpi-debt',
  'kpi-credit-score', 'kpi-savings-rate', 'kpi-runway', 'kpi-paycheck',
  'net-worth-chart',
  'debt-trend',
  'cash-vs-investments',
  'comp-pie',
  'latest-changes',
]

function getDefaults(): ChartPrefs {
  return {
    curveType: 'smooth',
    showDots: false,
    accountColors: { ...DEFAULT_ACCOUNT_COLORS },
    labelColors: { ...DEFAULT_LABEL_COLORS },
    dashboardOrder: [...DEFAULT_DASHBOARD_ORDER],
    savedLayouts: {},
    hiddenSections: [],
    sectionWidths: {
      'comp-pie': 'half',
      'debt-trend': 'half',
      'cash-vs-investments': 'half',
      'latest-changes': 'half',
    },
  }
}

export function loadChartPrefs(): ChartPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) {
      const prefs = getDefaults()
      saveChartPrefs(prefs)
      return prefs
    }
    const stored = JSON.parse(raw) as Partial<ChartPrefs>
    const defaults = getDefaults()
    return {
      curveType: stored.curveType ?? defaults.curveType,
      showDots: stored.showDots ?? defaults.showDots,
      accountColors: { ...defaults.accountColors, ...stored.accountColors },
      labelColors: { ...defaults.labelColors, ...stored.labelColors },
      dashboardOrder: stored.dashboardOrder?.length ? stored.dashboardOrder : defaults.dashboardOrder,
      savedLayouts: stored.savedLayouts ?? defaults.savedLayouts,
      hiddenSections: stored.hiddenSections ?? defaults.hiddenSections,
      sectionWidths: stored.sectionWidths ?? defaults.sectionWidths,
    }
  } catch {
    return getDefaults()
  }
}

export function saveChartPrefs(prefs: ChartPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function getAccountColor(prefs: ChartPrefs, accountId: string): string {
  return prefs.accountColors[accountId] || '#6b7280'
}

export function getLabelColor(prefs: ChartPrefs, label: string): string {
  return prefs.labelColors[label] || '#8888a0'
}

export function resetChartPrefs(): ChartPrefs {
  const prefs = getDefaults()
  saveChartPrefs(prefs)
  return prefs
}
