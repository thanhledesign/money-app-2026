import { useMemo, useState, useRef, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { GripVertical, Pencil, X, Columns2, Square, Save, Copy } from 'lucide-react'
import type { AppData } from '@/data/types'
import type { ChartPrefs, SectionWidth } from '@/data/chartPrefs'
import { KPICard, Card, CardTitle } from '@/components/ui/Card'
import { SectionMenu } from './SectionMenu'
import { ShareButton } from '@/components/ui/ShareButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { HealthScoreTooltip } from '@/components/ui/HealthScoreTooltip'
import { UVPBadge } from '@/components/ui/UVPBadge'
import * as calc from '@/lib/calculations'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props {
  data: AppData
  prefs: ChartPrefs
  onUpdatePrefs: (partial: Partial<ChartPrefs>) => void
  userId?: string
}

import { CHART_TOOLTIP, AXIS_TICK, LEGEND_TEXT_STYLE, COLORS, VIVID } from '@/components/ui/chartConstants'

const KPI_KEYS = [
  'kpi-net-worth', 'kpi-cash', 'kpi-investments', 'kpi-debt',
  'kpi-credit-score', 'kpi-savings-rate', 'kpi-runway', 'kpi-paycheck',
]

const CHART_KEYS = [
  'warnings', 'net-worth-chart', 'cash-vs-investments',
  'comp-pie', 'annual-bar', 'debt-trend', 'latest-changes',
]

export default function DashboardPage({ data, prefs, onUpdatePrefs, userId }: Props) {
  // Section accent color: use custom sectionColors if set, otherwise defaults
  const sc = (key: string, fallback: string) => prefs.sectionColors?.[key] || fallback

  const [editMode, setEditMode] = useState(false)
  const [showFirstSnapshotBanner, setShowFirstSnapshotBanner] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('money-app-first-snapshot-done') === 'true') {
      setShowFirstSnapshotBanner(true)
      localStorage.removeItem('money-app-first-snapshot-done')
      const timer = setTimeout(() => setShowFirstSnapshotBanner(false), 8000)
      return () => clearTimeout(timer)
    }
  }, [])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dashTitle, setDashTitle] = useState(() => localStorage.getItem('money-app-dash-title') || 'Dashboard')
  const latest = calc.getLatestSnapshot(data)
  const prev = calc.getPreviousSnapshot(data)

  const curveType = prefs.curveType === 'smooth' ? 'monotone' : 'linear'

  const metrics = useMemo(() => {
    if (!latest) return null
    const cash = calc.getTotalCash(latest, data)
    const investments = calc.getTotalInvestments(latest, data)
    const debt = calc.getTotalDebt(latest, data)
    const netWorth = calc.getNetWorth(latest, data)
    const disneyConc = calc.getDisneyConcentration(latest, data)
    const topConc = calc.getTopConcentration(latest, data)
    const utilization = calc.getCreditUtilization(latest, data)
    const runway = calc.getRunwayMonths(data)
    const savingsRate = calc.getSavingsRate(data)
    const healthScore = calc.getHealthScore(data)
    let nwDelta = 0
    if (prev) nwDelta = netWorth - calc.getNetWorth(prev, data)
    return { cash, investments, debt, netWorth, nwDelta, disneyConc, topConc, utilization, runway, savingsRate, healthScore }
  }, [latest, prev, data])

  const netWorthHistory = useMemo(() => {
    return data.snapshots.map(s => ({
      date: calc.formatDateShort(s.timestamp),
      netWorth: calc.getNetWorth(s, data),
      cash: calc.getTotalCash(s, data),
      investments: calc.getTotalInvestments(s, data),
    }))
  }, [data])

  const debtHistory = useMemo(() => {
    return data.snapshots.map(s => ({
      date: calc.formatDateShort(s.timestamp),
      debt: Math.abs(calc.getTotalDebt(s, data)),
    }))
  }, [data])

  // Pie chart: paycheck distribution
  const pieData = useMemo(() => {
    const totalTaxes = data.deductions.filter(d => d.type === 'tax').reduce((s, d) => s + d.amount, 0)
    const totalPretax = data.deductions.filter(d => d.type === 'pretax').reduce((s, d) => s + d.amount, 0)
    const grossSemiMonthly = data.comp.annualSalary / 24
    const netPay = grossSemiMonthly - totalTaxes - totalPretax
    const items = [
      { name: 'Taxes', value: totalTaxes, color: COLORS.taxes },
      ...data.deductions.filter(d => d.type === 'pretax').map(d => ({
        name: d.name, value: d.amount,
        color: d.name.includes('401k') ? COLORS.k401 : d.name.includes('Dental') ? COLORS.dental : d.name.includes('Medical') ? COLORS.medical : '#c4b5fd',
      })),
    ]
    // Add allocations as slices
    data.allocations.forEach(alloc => {
      const acc = data.accounts.find(a => a.id === alloc.accountId)
      if (acc) {
        items.push({
          name: acc.name.replace('Wells Fargo ', 'WF ').replace(' Account', '').replace('Fidelity Individual ', 'Fidelity '),
          value: netPay * alloc.percentage,
          color: prefs.accountColors[alloc.accountId] || '#6b7280',
        })
      }
    })
    return items
  }, [data, prefs.accountColors])

  // Annual bar chart: monthly totals by category
  const annualBarData = useMemo(() => {
    const monthly = calc.getMonthlySnapshots(data)
    const months = Array.from(monthly.keys()).sort()
    return months.map(m => {
      const s = monthly.get(m)!
      const label = new Date(m + '-15').toLocaleDateString('en-US', { month: 'short' })
      return {
        month: label,
        Cash: calc.getTotalCash(s, data),
        Investments: calc.getTotalInvestments(s, data),
        Debt: calc.getTotalDebt(s, data),
        'Net Worth': calc.getNetWorth(s, data),
      }
    })
  }, [data])

  if (!latest || !metrics) {
    return <EmptyState icon="📊" title="Welcome to Money 2026" message="Your dashboard is empty. Run the setup wizard to add your accounts, income, budget, and goals — or switch to the Sample Dashboard to explore." />
  }

  const lastUpdated = new Date(latest.timestamp).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  // Individual KPI sections
  const sectionMap: Record<string, React.ReactNode> = {
    'kpi-net-worth': (
      <KPICard key="kpi-net-worth" label="Net Worth" value={calc.formatCurrency(metrics.netWorth, true)}
        trend={metrics.nwDelta >= 0 ? 'up' : 'down'} trendValue={calc.formatCurrency(metrics.nwDelta, true)} emoji="💎" />
    ),
    'kpi-cash': (
      <KPICard key="kpi-cash" label="Cash" value={calc.formatCurrency(metrics.cash, true)}
        subValue={`${data.accounts.filter(a => a.category === 'cash' && a.isActive).length} accounts`} emoji="💵" />
    ),
    'kpi-investments': (
      <KPICard key="kpi-investments" label="Investments" value={calc.formatCurrency(metrics.investments, true)}
        subValue={`Top holding: ${calc.formatPercent(metrics.disneyConc)}`} emoji="📈" />
    ),
    'kpi-debt': (
      <KPICard key="kpi-debt" label="Debt" value={calc.formatCurrency(metrics.debt)}
        subValue={`${calc.formatPercent(metrics.utilization)} utilization`} emoji="💀" />
    ),
    'kpi-credit-score': (
      <KPICard key="kpi-credit-score" label="Credit Score" value={String(latest.creditScore || '—')} emoji="🏆" />
    ),
    'kpi-savings-rate': (
      <KPICard key="kpi-savings-rate" label="Savings Rate" value={calc.formatPercent(metrics.savingsRate)} emoji="📊" />
    ),
    'kpi-runway': (
      <KPICard key="kpi-runway" label="Runway" value={`${metrics.runway.toFixed(1)} mo`}
        subValue="months of expenses" emoji="⏳" />
    ),
    'kpi-paycheck': (
      <KPICard key="kpi-paycheck" label="Latest Paycheck" value={latest.paycheckAmount ? calc.formatCurrency(latest.paycheckAmount) : '—'} emoji="💰" />
    ),
    'warnings': (() => {
      const debtAccounts = data.accounts.filter(a => a.category === 'debt' && a.isActive)
      const highBalanceCards = debtAccounts.filter(a => (latest.balances[a.id] ?? 0) < -2000)
      return (
        <div key="warnings">
          {metrics.disneyConc > 0.70 && (
            <div className="bg-amber/10 backdrop-blur-sm border border-amber/20 rounded-xl p-4 mb-6 shadow-sm">
              <p className="text-amber text-sm font-medium">
                {metrics.topConc.institution} equity at {calc.formatPercent(metrics.disneyConc)} of investments. Single-employer concentration above 70% increases risk.
              </p>
            </div>
          )}
          {highBalanceCards.map(card => {
            const bal = latest.balances[card.id] ?? 0
            const prevBal = prev ? (prev.balances[card.id] ?? 0) : 0
            return (
              <div key={card.id} className="bg-red/10 backdrop-blur-sm border border-red/20 rounded-xl p-4 mb-6 shadow-sm">
                <p className="text-red text-sm font-medium">
                  {card.name} balance: {calc.formatCurrency(bal)}.
                  {prev && ` Was ${calc.formatCurrency(prevBal)} last snapshot.`}
                  {` At ~20% APR, this costs ~$${Math.round(Math.abs(bal) * 0.20 / 12)}/mo in interest.`}
                </p>
              </div>
            )
          })}
        </div>
      )
    })(),
    'net-worth-chart': (
      <Card className="mb-6" key="net-worth-chart" style={prefs.sectionColors?.['net-worth-chart'] ? { borderTopColor: prefs.sectionColors['net-worth-chart'], borderTopWidth: '2px' } : undefined}>
        <div className="flex items-center justify-between">
          <CardTitle>Net Worth Overview</CardTitle>
          <SectionMenu sectionKey="net-worth-chart" currentWidth={prefs.sectionWidths?.['net-worth-chart'] ?? 'full'} currentColor={prefs.sectionColors?.['net-worth-chart']} onWidthChange={(w) => handleSectionWidthChange('net-worth-chart', w)} onColorChange={(c) => handleSectionColorChange('net-worth-chart', c)} onReset={() => handleSectionReset('net-worth-chart')} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Pie: current net worth breakdown */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cash', value: calc.getTotalCash(latest, data), color: COLORS.cash },
                    { name: 'Investments', value: calc.getTotalInvestments(latest, data), color: COLORS.investments },
                    { name: 'Debt', value: Math.abs(calc.getTotalDebt(latest, data)), color: COLORS.debt },
                  ].filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={60}
                  innerRadius={28}
                  paddingAngle={2}
                >
                  {[
                    { name: 'Cash', value: calc.getTotalCash(latest, data), color: COLORS.cash },
                    { name: 'Investments', value: calc.getTotalInvestments(latest, data), color: COLORS.investments },
                    { name: 'Debt', value: Math.abs(calc.getTotalDebt(latest, data)), color: COLORS.debt },
                  ].filter(d => d.value > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke={entry.color + '60'} strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip {...CHART_TOOLTIP} formatter={(v: any, name: any, props: any) => {
                  const total = props?.payload ? [props.payload].flat().reduce((s: number, e: any) => s + (e.value || 0), 0) || metrics.netWorth : metrics.netWorth
                  const items = [
                    { name: 'Cash', value: calc.getTotalCash(latest, data) },
                    { name: 'Investments', value: calc.getTotalInvestments(latest, data) },
                    { name: 'Debt', value: Math.abs(calc.getTotalDebt(latest, data)) },
                  ].filter(d => d.value > 0)
                  const grandTotal = items.reduce((s, d) => s + d.value, 0)
                  const pct = grandTotal > 0 ? ((v as number) / grandTotal * 100).toFixed(1) : '0'
                  return [`${calc.formatCurrency(v)} (${pct}%)`, name]
                }} />
                <Legend
                  verticalAlign="bottom"
                  formatter={(name: string) => <span style={LEGEND_TEXT_STYLE}>{name}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Area: net worth over time — takes 2 cols */}
          <div className="lg:col-span-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sc('net-worth-chart', VIVID.netWorth)} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={sc('net-worth-chart', VIVID.netWorth)} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip {...CHART_TOOLTIP} formatter={(v: any) => [calc.formatCurrency(v), 'Net Worth']} />
                <Area type={curveType} dataKey="netWorth" stroke={sc('net-worth-chart', VIVID.netWorth)} fill="url(#nwGrad)" strokeWidth={2}
                  dot={prefs.showDots ? { r: 3, fill: sc('net-worth-chart', VIVID.netWorth) } : false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    ),
    'cash-vs-investments': (
      <Card className="mb-6" key="cash-vs-investments" style={prefs.sectionColors?.['cash-vs-investments'] ? { borderTopColor: prefs.sectionColors['cash-vs-investments'], borderTopWidth: '2px' } : undefined}>
        <div className="flex items-center justify-between">
          <CardTitle>Cash vs Investments</CardTitle>
          <SectionMenu sectionKey="cash-vs-investments" currentWidth={prefs.sectionWidths?.['cash-vs-investments'] ?? 'half'} currentColor={prefs.sectionColors?.['cash-vs-investments']} onWidthChange={(w) => handleSectionWidthChange('cash-vs-investments', w)} onColorChange={(c) => handleSectionColorChange('cash-vs-investments', c)} onReset={() => handleSectionReset('cash-vs-investments')} />
        </div>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netWorthHistory}>
              <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...CHART_TOOLTIP}
                formatter={(v: any, name: any) => [calc.formatCurrency(v), name === 'cash' ? 'Cash' : 'Investments']} />
              <Line type={curveType} dataKey="cash" stroke={sc('cash-vs-investments', VIVID.cash)} strokeWidth={2}
                dot={prefs.showDots ? { r: 3, fill: sc('cash-vs-investments', VIVID.cash) } : false} />
              <Line type={curveType} dataKey="investments" stroke={VIVID.investments} strokeWidth={2}
                dot={prefs.showDots ? { r: 3, fill: VIVID.investments } : false} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    'comp-pie': (
      <Card className="mb-6" key="comp-pie" style={prefs.sectionColors?.['comp-pie'] ? { borderTopColor: prefs.sectionColors['comp-pie'], borderTopWidth: '2px' } : undefined}>
        <div className="flex items-center justify-between">
          <CardTitle>Paycheck Distribution</CardTitle>
          <SectionMenu sectionKey="comp-pie" currentWidth={prefs.sectionWidths?.['comp-pie'] ?? 'half'} currentColor={prefs.sectionColors?.['comp-pie']} onWidthChange={(w) => handleSectionWidthChange('comp-pie', w)} onColorChange={(c) => handleSectionColorChange('comp-pie', c)} onReset={() => handleSectionReset('comp-pie')} />
        </div>
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="40%"
                outerRadius={80} innerRadius={30} paddingAngle={2}
                fontSize={9}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke={entry.color + '60'} strokeWidth={1.5} />
                ))}
              </Pie>
              <Tooltip {...CHART_TOOLTIP}
                formatter={(v: any, name: any) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0)
                  const pct = total > 0 ? ((v as number) / total * 100).toFixed(1) : '0'
                  return [`${calc.formatCurrency(v)} (${pct}%)`, name]
                }} />
              <Legend wrapperStyle={{ fontSize: '10px', lineHeight: '18px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    'annual-bar': (
      <Card className="mb-6" key="annual-bar" style={prefs.sectionColors?.['annual-bar'] ? { borderTopColor: prefs.sectionColors['annual-bar'], borderTopWidth: '2px' } : undefined}>
        <div className="flex items-center justify-between">
          <CardTitle>Monthly Summary by Category</CardTitle>
          <SectionMenu sectionKey="annual-bar" currentWidth={prefs.sectionWidths?.['annual-bar'] ?? 'full'} currentColor={prefs.sectionColors?.['annual-bar']} onWidthChange={(w) => handleSectionWidthChange('annual-bar', w)} onColorChange={(c) => handleSectionColorChange('annual-bar', c)} onReset={() => handleSectionReset('annual-bar')} />
        </div>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualBarData} stackOffset="sign">
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...CHART_TOOLTIP}
                formatter={(v: any, name: any) => [calc.formatCurrency(v), name]} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Cash" fill={COLORS.cash} radius={[2, 2, 0, 0]} />
              <Bar dataKey="Investments" fill={COLORS.investments} radius={[2, 2, 0, 0]} />
              <Bar dataKey="Debt" fill={COLORS.debt} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    'debt-trend': debtHistory.some(d => d.debt > 0) ? (
      <Card className="mb-6" key="debt-trend" style={prefs.sectionColors?.['debt-trend'] ? { borderTopColor: prefs.sectionColors['debt-trend'], borderTopWidth: '2px' } : undefined}>
        <div className="flex items-center justify-between">
          <CardTitle>Debt Trend</CardTitle>
          <SectionMenu sectionKey="debt-trend" currentWidth={prefs.sectionWidths?.['debt-trend'] ?? 'half'} currentColor={prefs.sectionColors?.['debt-trend']} onWidthChange={(w) => handleSectionWidthChange('debt-trend', w)} onColorChange={(c) => handleSectionColorChange('debt-trend', c)} onReset={() => handleSectionReset('debt-trend')} />
        </div>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={debtHistory}>
              <defs>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sc('debt-trend', VIVID.debt)} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={sc('debt-trend', VIVID.debt)} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}K`} reversed={true} />
              <Tooltip {...CHART_TOOLTIP} formatter={(v: any) => [calc.formatCurrency(v), 'Debt']} />
              <Area type={curveType} dataKey="debt" stroke={sc('debt-trend', VIVID.debt)} fill="url(#debtGrad)" strokeWidth={2}
                dot={prefs.showDots ? { r: 3, fill: sc('debt-trend', VIVID.debt) } : false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ) : null,
    'latest-changes': prev ? (
      <Card className="mb-6" key="latest-changes" style={prefs.sectionColors?.['latest-changes'] ? { borderTopColor: prefs.sectionColors['latest-changes'], borderTopWidth: '2px' } : undefined}>
        <div className="flex items-center justify-between">
          <CardTitle>Latest Changes</CardTitle>
          <SectionMenu sectionKey="latest-changes" currentWidth={prefs.sectionWidths?.['latest-changes'] ?? 'half'} currentColor={prefs.sectionColors?.['latest-changes']} onWidthChange={(w) => handleSectionWidthChange('latest-changes', w)} onColorChange={(c) => handleSectionColorChange('latest-changes', c)} onReset={() => handleSectionReset('latest-changes')} />
        </div>
        <p className="text-xs text-text-muted mb-3">{calc.formatDate(prev.timestamp)} → {calc.formatDate(latest.timestamp)}</p>
        <div className="space-y-1.5">
          {calc.getSnapshotDiff(latest, prev, data).slice(0, 10).map(ch => (
            <div key={ch.accountId} className="flex justify-between items-center text-sm">
              <span className="text-text-secondary truncate">{ch.name}</span>
              <span className={`tabular-nums font-medium ${ch.diff > 0 ? 'text-green' : 'text-red'}`}>
                {ch.diff > 0 ? '+' : ''}{calc.formatCurrency(ch.diff)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    ) : null,
  }

  // Migrate old kpi-row-1/kpi-row-2 in saved order to individual keys
  const migrateOrder = (order: string[]) => {
    const result: string[] = []
    for (const k of order) {
      if (k === 'kpi-row-1') {
        result.push('kpi-net-worth', 'kpi-cash', 'kpi-investments', 'kpi-debt')
      } else if (k === 'kpi-row-2') {
        result.push('kpi-credit-score', 'kpi-savings-rate', 'kpi-runway', 'kpi-paycheck')
      } else {
        result.push(k)
      }
    }
    return result
  }

  const rawOrder = prefs.dashboardOrder.length > 0 ? migrateOrder(prefs.dashboardOrder) : Object.keys(sectionMap)
  const allKeys = Object.keys(sectionMap)
  const finalOrder = [...rawOrder.filter(k => allKeys.includes(k)), ...allKeys.filter(k => !rawOrder.includes(k))]
  const hiddenSections = prefs.hiddenSections ?? []
  const visibleOrder = finalOrder.filter(k => !hiddenSections.includes(k))

  // Group visible KPIs into a grid row
  const visibleKPIs = KPI_KEYS.filter(k => !hiddenSections.includes(k))

  const SECTION_LABELS: Record<string, string> = {
    'kpi-net-worth': 'Net Worth',
    'kpi-cash': 'Cash',
    'kpi-investments': 'Investments',
    'kpi-debt': 'Debt',
    'kpi-credit-score': 'Credit Score',
    'kpi-savings-rate': 'Savings Rate',
    'kpi-runway': 'Runway',
    'kpi-paycheck': 'Latest Paycheck',
    'warnings': 'Warnings',
    'net-worth-chart': 'Net Worth Chart',
    'cash-vs-investments': 'Cash vs Investments',
    'comp-pie': 'Paycheck Distribution',
    'annual-bar': 'Monthly Summary by Category',
    'debt-trend': 'Debt Trend',
    'latest-changes': 'Latest Changes',
  }

  function handleSaveLayout() {
    // "Save" overwrites current active layout (no prompt)
    if (prefs.activeLayoutName) {
      const newLayouts = {
        ...prefs.savedLayouts,
        [prefs.activeLayoutName]: { order: finalOrder, hidden: prefs.hiddenSections ?? [] },
      }
      onUpdatePrefs({ savedLayouts: newLayouts })
      return
    }
    // No active layout — behave like Save As
    handleSaveAsLayout()
  }

  function handleSaveAsLayout() {
    const name = window.prompt('Enter a name for this layout:')
    if (!name) return
    const newLayouts = {
      ...prefs.savedLayouts,
      [name]: { order: finalOrder, hidden: prefs.hiddenSections ?? [] },
    }
    onUpdatePrefs({ savedLayouts: newLayouts, activeLayoutName: name })
  }

  function handleLoadLayout(name: string) {
    if (!name) return
    const layout = prefs.savedLayouts[name]
    if (!layout) return
    onUpdatePrefs({ dashboardOrder: layout.order, hiddenSections: layout.hidden, activeLayoutName: name })
  }

  function handleResetLayout() {
    onUpdatePrefs({ dashboardOrder: [], hiddenSections: [], activeLayoutName: null })
  }

  function handleSectionWidthChange(key: string, width: SectionWidth) {
    onUpdatePrefs({ sectionWidths: { ...prefs.sectionWidths, [key]: width } })
  }

  function handleSectionColorChange(key: string, color: string) {
    onUpdatePrefs({ sectionColors: { ...prefs.sectionColors, [key]: color } })
  }

  function handleSectionReset(key: string) {
    const { [key]: _w, ...restWidths } = prefs.sectionWidths ?? {}
    const { [key]: _c, ...restColors } = prefs.sectionColors ?? {}
    onUpdatePrefs({ sectionWidths: restWidths, sectionColors: restColors })
  }

  function handleToggleSection(key: string) {
    const hidden = prefs.hiddenSections ?? []
    const next = hidden.includes(key) ? hidden.filter(k => k !== key) : [...hidden, key]
    onUpdatePrefs({ hiddenSections: next })
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const newOrder = [...finalOrder]
    const [removed] = newOrder.splice(dragIdx, 1)
    newOrder.splice(idx, 0, removed)
    onUpdatePrefs({ dashboardOrder: newOrder })
    setDragIdx(idx)
  }
  const handleDragEnd = () => setDragIdx(null)

  // Render KPI grid from visible KPIs (non-edit mode)
  const renderKPIGrid = () => {
    if (visibleKPIs.length === 0) return null
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {visibleKPIs.map(key => sectionMap[key])}
      </div>
    )
  }

  // Non-KPI sections in order
  const nonKPIOrder = visibleOrder.filter(k => !KPI_KEYS.includes(k) && k !== 'warnings')

  return (
    <div>
      {showFirstSnapshotBanner && (
        <div className="mb-4 px-4 py-3 bg-green/10 border border-green/30 rounded-lg text-sm text-green animate-fadeIn">
          Your first snapshot is recorded! Your dashboard is now tracking your finances. Add a new snapshot each pay period to see trends over time.
        </div>
      )}
      <PageHeader
        icon="📊"
        title={dashTitle}
        titleKey="dashboard"
        subtitle={`Last updated: ${lastUpdated}`}
        rightContent={
          <div className="flex flex-col items-end gap-1">
            <HealthScoreTooltip data={data} score={metrics.healthScore} />
            <UVPBadge label="Unique" description="Composite of 7 metrics no other app tracks together. Tap the score for details." />
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
            editMode
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-text-muted hover:text-text-secondary'
          }`}
        >
          {editMode ? <X size={14} /> : <Pencil size={14} />}
          {editMode ? 'Done' : 'Edit Layout'}
        </button>
        <ShareButton data={data} userId={userId} dashboardName={dashTitle} />
      </div>

      {editMode && (
        <div className="sticky top-0 z-40 mb-6 p-4 rounded-xl border border-accent/20 bg-surface/90 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-accent uppercase tracking-wide">Layout Editor</p>
              {prefs.activeLayoutName && (
                <span className="text-xs text-text-muted">— {prefs.activeLayoutName}</span>
              )}
            </div>
          </div>

          {/* KPI Card toggles */}
          <div>
            <p className="text-xs text-text-muted mb-2">KPI Cards</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {KPI_KEYS.map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={!hiddenSections.includes(key)}
                    onChange={() => handleToggleSection(key)}
                    className="accent-accent"
                  />
                  {SECTION_LABELS[key] ?? key}
                </label>
              ))}
            </div>
          </div>

          {/* Chart section toggles */}
          <div>
            <p className="text-xs text-text-muted mb-2">Chart Sections</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {CHART_KEYS.map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                  <input
                    type="checkbox"
                    checked={!hiddenSections.includes(key)}
                    onChange={() => handleToggleSection(key)}
                    className="accent-accent"
                  />
                  {SECTION_LABELS[key] ?? key}
                </label>
              ))}
            </div>
          </div>

          {/* Save / Save As / Load / Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              <Save size={12} /> Save
            </button>
            <button
              onClick={handleSaveAsLayout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-accent text-accent hover:bg-accent/10 transition-colors"
            >
              <Copy size={12} /> Save As
            </button>

            {Object.keys(prefs.savedLayouts ?? {}).length > 0 && (
              <select
                defaultValue=""
                onChange={e => { handleLoadLayout(e.target.value); e.target.value = '' }}
                className="px-2 py-1.5 rounded-lg text-xs bg-background border border-border text-text-secondary"
              >
                <option value="" disabled>Load layout…</option>
                {Object.keys(prefs.savedLayouts).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleResetLayout}
              className="px-3 py-1.5 rounded-lg text-xs border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Warnings always at top, above KPIs */}
      {!editMode && !hiddenSections.includes('warnings') && sectionMap['warnings']}

      {/* KPI Grid */}
      {!editMode && renderKPIGrid()}

      {/* Edit mode: WYSIWYG grid with drag overlays */}
      {editMode ? (
        <>
          {/* KPI grid in edit mode */}
          {visibleKPIs.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {visibleKPIs.map((key, idx) => {
                const globalIdx = finalOrder.indexOf(key)
                return (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => handleDragStart(globalIdx)}
                    onDragOver={(e) => handleDragOver(e, globalIdx)}
                    onDragEnd={handleDragEnd}
                    className={`relative group cursor-grab active:cursor-grabbing ${
                      dragIdx === globalIdx ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="absolute inset-0 z-10 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity text-accent">
                      <GripVertical size={14} />
                    </div>
                    {sectionMap[key]}
                  </div>
                )
              })}
            </div>
          )}

          {/* Chart sections in 2-col grid with overlays */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 [&>*]:flex [&>*]:flex-col [&>*>*]:flex-1">
            {nonKPIOrder.map(key => {
              const section = sectionMap[key]
              if (!section) return null
              const w = prefs.sectionWidths?.[key] ?? 'full'
              const globalIdx = finalOrder.indexOf(key)
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => handleDragStart(globalIdx)}
                  onDragOver={(e) => handleDragOver(e, globalIdx)}
                  onDragEnd={handleDragEnd}
                  className={`relative group cursor-grab active:cursor-grabbing ${
                    w === 'half' ? 'lg:col-span-1' : 'lg:col-span-2'
                  } ${dragIdx === globalIdx ? 'opacity-50' : ''}`}
                >
                  {/* Translucent overlay */}
                  <div className="absolute inset-0 z-10 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Overlay controls: drag handle + width toggle */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-accent"><GripVertical size={16} /></span>
                    <span className="text-[10px] text-accent font-medium bg-accent/20 px-1.5 py-0.5 rounded">
                      {SECTION_LABELS[key] ?? key}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSectionWidthChange(key, 'full') }}
                      title="Full width"
                      className={`p-1 rounded transition-colors ${w === 'full' ? 'bg-accent/30 text-accent' : 'bg-black/40 text-text-muted hover:text-white'}`}
                    >
                      <Square size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSectionWidthChange(key, 'half') }}
                      title="Half width"
                      className={`p-1 rounded transition-colors ${w === 'half' ? 'bg-accent/30 text-accent' : 'bg-black/40 text-text-muted hover:text-white'}`}
                    >
                      <Columns2 size={14} />
                    </button>
                  </div>
                  {section}
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 [&>*]:flex [&>*]:flex-col [&>*>*]:flex-1">
          {nonKPIOrder.map(key => {
            const section = sectionMap[key]
            if (!section) return null
            const w = prefs.sectionWidths?.[key] ?? 'full'
            return (
              <div key={key} className={w === 'half' ? 'lg:col-span-1' : 'lg:col-span-2'}>
                {section}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
