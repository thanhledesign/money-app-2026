export interface ChartPrefs {
  curveType: 'smooth' | 'sharp'
  showDots: boolean
  accountColors: Record<string, string>
  labelColors: Record<string, string>
  dashboardOrder: string[]
  savedLayouts: Record<string, { order: string[]; hidden: string[] }>
  hiddenSections: string[]
}

const PREFS_KEY = 'money-app-chart-prefs'

const DEFAULT_ACCOUNT_COLORS: Record<string, string> = {
  'wf-cash': '#22c55e',
  'wf-checking': '#3b82f6',
  'wf-savings': '#06b6d4',
  'wf-biz-checking': '#8b5cf6',
  'wf-biz-savings': '#a855f7',
  'abefcu-checking': '#f59e0b',
  'abefcu-savings': '#eab308',
  'fidelity-cma': '#6b7280',
  'wf-bond': '#14b8a6',
  'saks-401k': '#6b7280',
  'fidelity-brokerage': '#ef4444',
  'fidelity-roth': '#f97316',
  'fidelity-trad': '#6b7280',
  'disney-401k-sip': '#ec4899',
  'disney-401k-rsp': '#d946ef',
  'disney-equity': '#6b7280',
  'disney-lti': '#f43f5e',
  'apple-card': '#a3a3a3',
  'capital-one': '#ef4444',
  'chase-sw': '#3b82f6',
  'discover': '#f59e0b',
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
