import { useMemo, useState, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts'
import { GripVertical, Pencil, X } from 'lucide-react'
import type { AppData } from '@/data/types'
import type { ChartPrefs } from '@/data/chartPrefs'
import { KPICard, Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { HealthScoreTooltip } from '@/components/ui/HealthScoreTooltip'
import { UVPBadge } from '@/components/ui/UVPBadge'
import * as calc from '@/lib/calculations'
import { EmptyState } from '@/components/ui/EmptyState'

interface Props {
  data: AppData
  prefs: ChartPrefs
  onUpdatePrefs: (partial: Partial<ChartPrefs>) => void
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#12121a', border: '1px solid #2a2a3a', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: '#8888a0' },
}

const KPI_KEYS = [
  'kpi-net-worth', 'kpi-cash', 'kpi-investments', 'kpi-debt',
  'kpi-credit-score', 'kpi-savings-rate', 'kpi-runway', 'kpi-paycheck',
]

const CHART_KEYS = [
  'warnings', 'net-worth-chart', 'cash-vs-investments',
  'comp-pie', 'annual-bar', 'debt-trend', 'latest-changes',
]

export default function DashboardPage({ data, prefs, onUpdatePrefs }: Props) {
  const [editMode, setEditMode] = useState(false)
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
    const utilization = calc.getCreditUtilization(latest, data)
    const runway = calc.getRunwayMonths(data)
    const savingsRate = calc.getSavingsRate(data)
    const healthScore = calc.getHealthScore(data)
    let nwDelta = 0
    if (prev) nwDelta = netWorth - calc.getNetWorth(prev, data)
    return { cash, investments, debt, netWorth, nwDelta, disneyConc, utilization, runway, savingsRate, healthScore }
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
      { name: 'Taxes', value: totalTaxes, color: '#ef4444' },
      ...data.deductions.filter(d => d.type === 'pretax').map(d => ({
        name: d.name, value: d.amount,
        color: d.name.includes('401k') ? '#3b82f6' : d.name.includes('Dental') ? '#06b6d4' : d.name.includes('Medical') ? '#22c55e' : '#8b5cf6',
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
            <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 mb-6">
              <p className="text-amber text-sm font-medium">
                Single-employer equity at {calc.formatPercent(metrics.disneyConc)} of investments. Concentration above 70% increases risk.
              </p>
            </div>
          )}
          {highBalanceCards.map(card => {
            const bal = latest.balances[card.id] ?? 0
            const prevBal = prev ? (prev.balances[card.id] ?? 0) : 0
            return (
              <div key={card.id} className="bg-red/10 border border-red/30 rounded-xl p-4 mb-6">
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
      <Card className="mb-6" key="net-worth-chart">
        <CardTitle>Net Worth Overview</CardTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Pie: current net worth breakdown */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cash', value: calc.getTotalCash(latest, data), color: '#22c55e' },
                    { name: 'Investments', value: calc.getTotalInvestments(latest, data), color: '#3b82f6' },
                    { name: 'Debt', value: Math.abs(calc.getTotalDebt(latest, data)), color: '#ef4444' },
                  ].filter(d => d.value > 0)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={28}
                  paddingAngle={2}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#55556a' }}
                  fontSize={10}
                >
                  {[
                    { name: 'Cash', value: calc.getTotalCash(latest, data), color: '#22c55e' },
                    { name: 'Investments', value: calc.getTotalInvestments(latest, data), color: '#3b82f6' },
                    { name: 'Debt', value: Math.abs(calc.getTotalDebt(latest, data)), color: '#ef4444' },
                  ].filter(d => d.value > 0).map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke={entry.color + '60'} strokeWidth={1.5} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any, name: any) => [calc.formatCurrency(v), name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Area: net worth over time — takes 2 cols */}
          <div className="lg:col-span-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory}>
                <defs>
                  <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [calc.formatCurrency(v), 'Net Worth']} />
                <Area type={curveType} dataKey="netWorth" stroke="#a855f7" fill="url(#nwGrad)" strokeWidth={2}
                  dot={prefs.showDots ? { r: 3, fill: '#a855f7' } : false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    ),
    'cash-vs-investments': (
      <Card className="mb-6" key="cash-vs-investments">
        <CardTitle>Cash vs Investments</CardTitle>
        <div className="h-56 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={netWorthHistory}>
              <XAxis dataKey="date" tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...TOOLTIP_STYLE}
                formatter={(v: any, name: any) => [calc.formatCurrency(v), name === 'cash' ? 'Cash' : 'Investments']} />
              <Line type={curveType} dataKey="cash" stroke="#22c55e" strokeWidth={2}
                dot={prefs.showDots ? { r: 3, fill: '#22c55e' } : false} />
              <Line type={curveType} dataKey="investments" stroke="#3b82f6" strokeWidth={2}
                dot={prefs.showDots ? { r: 3, fill: '#3b82f6' } : false} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    'comp-pie': (
      <Card className="mb-6" key="comp-pie">
        <CardTitle>Paycheck Distribution</CardTitle>
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
              <Tooltip {...TOOLTIP_STYLE}
                formatter={(v: any, name: any) => [calc.formatCurrency(v), name]} />
              <Legend wrapperStyle={{ fontSize: '10px', lineHeight: '18px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    'annual-bar': (
      <Card className="mb-6" key="annual-bar">
        <CardTitle>Monthly Summary by Category</CardTitle>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={annualBarData} stackOffset="sign">
              <XAxis dataKey="month" tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip {...TOOLTIP_STYLE}
                formatter={(v: any, name: any) => [calc.formatCurrency(v), name]} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Cash" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Investments" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Debt" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    'debt-trend': debtHistory.some(d => d.debt > 0) ? (
      <Card className="mb-6" key="debt-trend">
        <CardTitle>Debt Trend</CardTitle>
        <div className="h-48 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={debtHistory}>
              <defs>
                <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55556a', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}K`} reversed={true} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [calc.formatCurrency(v), 'Debt']} />
              <Area type={curveType} dataKey="debt" stroke="#ef4444" fill="url(#debtGrad)" strokeWidth={2}
                dot={prefs.showDots ? { r: 3, fill: '#ef4444' } : false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ) : null,
    'latest-changes': prev ? (
      <Card className="mb-6" key="latest-changes">
        <CardTitle>Latest Changes</CardTitle>
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
    const name = window.prompt('Enter a name for this layout:')
    if (!name) return
    const newLayouts = {
      ...prefs.savedLayouts,
      [name]: { order: finalOrder, hidden: prefs.hiddenSections ?? [] },
    }
    onUpdatePrefs({ savedLayouts: newLayouts })
  }

  function handleLoadLayout(name: string) {
    if (!name) return
    const layout = prefs.savedLayouts[name]
    if (!layout) return
    onUpdatePrefs({ dashboardOrder: layout.order, hiddenSections: layout.hidden })
  }

  function handleResetLayout() {
    onUpdatePrefs({ dashboardOrder: [], hiddenSections: [] })
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
  const nonKPIOrder = visibleOrder.filter(k => !KPI_KEYS.includes(k))

  return (
    <div>
      <PageHeader
        icon="📊"
        title={dashTitle}
        titleKey="dashboard"
        subtitle={`Last updated: ${lastUpdated}`}
        rightContent={
          <div className="flex items-center gap-4">
            <UVPBadge label="Unique" description="Financial Health Score — a composite of 7 metrics no other app tracks together. Hover for details." />
            <HealthScoreTooltip data={data} score={metrics.healthScore} />
          </div>
        }
      />

      <div className="mb-4">
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
      </div>

      {editMode && (
        <div className="sticky top-0 z-40 mb-6 p-4 rounded-xl border border-accent/30 bg-surface shadow-lg space-y-4">
          <p className="text-xs font-semibold text-accent uppercase tracking-wide">Layout Editor</p>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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

          {/* Save / Load / Reset */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveLayout}
              className="px-3 py-1.5 rounded-lg text-xs bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Save Layout
            </button>

            {Object.keys(prefs.savedLayouts ?? {}).length > 0 && (
              <select
                defaultValue=""
                onChange={e => { handleLoadLayout(e.target.value); e.target.value = '' }}
                className="px-2 py-1.5 rounded-lg text-xs bg-background border border-border text-text-secondary"
              >
                <option value="" disabled>Load saved layout…</option>
                {Object.keys(prefs.savedLayouts).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}

            <button
              onClick={handleResetLayout}
              className="px-3 py-1.5 rounded-lg text-xs border border-border text-text-muted hover:text-text-secondary transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      {!editMode && renderKPIGrid()}

      {/* Edit mode: show all sections individually for drag reorder */}
      {editMode ? (
        finalOrder.map((key, idx) => {
          const section = sectionMap[key]
          if (!section) return null
          const isKPI = KPI_KEYS.includes(key)
          return (
            <div
              key={key}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`relative group cursor-grab active:cursor-grabbing mb-3 ${
                dragIdx === idx ? 'opacity-50' : ''
              } ${hiddenSections.includes(key) ? 'opacity-30' : ''}`}
            >
              <div className="absolute -left-8 top-4 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">
                <GripVertical size={16} />
              </div>
              <div className={`ring-1 ring-accent/20 ring-dashed rounded-xl ${isKPI ? 'inline-block' : ''}`}>
                {isKPI ? (
                  <div className="p-1">
                    {section}
                  </div>
                ) : section}
              </div>
            </div>
          )
        })
      ) : (
        nonKPIOrder.map(key => {
          const section = sectionMap[key]
          if (!section) return null
          return <div key={key}>{section}</div>
        })
      )}
    </div>
  )
}
