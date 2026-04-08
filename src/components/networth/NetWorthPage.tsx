import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { AppData } from '@/data/types'
import type { Account } from '@/data/types'
import type { ChartPrefs } from '@/data/chartPrefs'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTheme } from '@/components/ui/PageTheme'
import { AccountManager } from '@/components/ui/AccountManager'
import {
  getActiveAccounts,
  getLatestSnapshot,
  getMonthlySnapshots,
  getMonthKey,
  getNetWorth,
  getTotalCash,
  getTotalInvestments,
  getTotalDebt,
  formatCurrency,
} from '@/lib/calculations'

interface Props {
  data: AppData
  prefs: ChartPrefs
  onUpdatePrefs: (partial: Partial<ChartPrefs>) => void
  addAccount: (a: Account) => void
  updateAccounts: (a: Account[]) => void
}

const TOOLTIP_STYLE = {
  background: '#12121a',
  border: '1px solid #2a2a3a',
  borderRadius: '8px',
  fontSize: '12px',
}

export default function NetWorthPage({ data, prefs, addAccount, updateAccounts }: Props) {
  const curveType = prefs.curveType === 'smooth' ? 'monotone' : 'linear'

  const latest = getLatestSnapshot(data)
  const activeAccounts = useMemo(() => getActiveAccounts(data), [data])

  // ----- Monthly snapshot map & sorted keys -----
  const { monthKeys, monthLabels, monthlyMap } = useMemo(() => {
    const map = getMonthlySnapshots(data)
    const keys = Array.from(map.keys()).sort()
    const labels = keys.map(k => {
      const [year, month] = k.split('-')
      return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      })
    })
    return { monthKeys: keys, monthLabels: labels, monthlyMap: map }
  }, [data])

  const latestMonthKey = latest ? getMonthKey(latest.timestamp) : ''

  // Per-month total net worth
  const monthNetWorthTotals = useMemo(
    () =>
      monthKeys.map(mk => {
        const snap = monthlyMap.get(mk)
        return snap ? getNetWorth(snap, data) : null
      }),
    [monthKeys, monthlyMap, data]
  )

  // Month-over-month net change data for the bar chart
  const netChangeData = useMemo(() => {
    const result: { label: string; change: number }[] = []
    for (let i = 1; i < monthKeys.length; i++) {
      const prev = monthNetWorthTotals[i - 1]
      const curr = monthNetWorthTotals[i]
      if (prev !== null && curr !== null) {
        result.push({ label: monthLabels[i], change: curr - prev })
      }
    }
    return result
  }, [monthKeys, monthLabels, monthNetWorthTotals])

  // Area chart series: net worth over all snapshots
  const netWorthSeries = useMemo(
    () =>
      data.snapshots.map(s => ({
        date: new Date(s.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        }),
        netWorth: getNetWorth(s, data),
      })),
    [data]
  )

  // Group accounts by category for the table ordering
  const orderedAccounts = useMemo(() => {
    const cash = activeAccounts.filter(a => a.category === 'cash')
    const investments = activeAccounts.filter(a => a.category === 'investment')
    const debt = activeAccounts.filter(a => a.category === 'debt')
    return [...cash, ...investments, ...debt]
  }, [activeAccounts])

  // Current net worth
  const currentNetWorth = latest ? getNetWorth(latest, data) : 0

  // ----- Donut pie chart data (snapshot) -----
  const pieData = useMemo(() => {
    if (!latest) return []
    const positiveSlices = activeAccounts
      .filter(a => a.category !== 'debt')
      .map(acc => ({
        name: acc.name,
        id: acc.id,
        value: Math.max(0, latest.balances[acc.id] ?? 0),
      }))
      .filter(s => s.value > 0)

    const totalDebtAbs = Math.abs(getTotalDebt(latest, data))
    const slices = [...positiveSlices]
    if (totalDebtAbs > 0) {
      slices.push({ name: 'Debt', id: '__debt__', value: totalDebtAbs })
    }
    return slices
  }, [activeAccounts, latest, data])

  // ----- Stacked bar chart data (cash / investments / debt by month) -----
  const stackedBarData = useMemo(() =>
    monthKeys.map((mk, i) => {
      const snap = monthlyMap.get(mk)
      if (!snap) return { month: monthLabels[i], cash: 0, investments: 0, debt: 0, total: 0 }
      const cash = getTotalCash(snap, data)
      const investments = getTotalInvestments(snap, data)
      const debt = getTotalDebt(snap, data) // negative
      const total = cash + investments + debt
      return { month: monthLabels[i], cash, investments, debt, total }
    }),
    [monthKeys, monthLabels, monthlyMap, data]
  )

  // Previous month key for delta column (second-to-last)
  const prevMonthKey = monthKeys.length >= 2 ? monthKeys[monthKeys.length - 2] : null

  if (!latest) {
    return (
      <div className="text-text-muted text-center py-20">
        No snapshots yet. Enter your first snapshot to see net worth data.
      </div>
    )
  }

  const categoryLabel: Record<string, string> = {
    cash: 'Cash',
    investment: 'Investment',
    debt: 'Debt',
  }

  const categoryHeaderStyle: Record<string, string> = {
    cash: 'text-green',
    investment: 'text-blue',
    debt: 'text-red',
  }

  return (
    <PageTheme page="net-worth">
    <div>
      <PageHeader
        icon="💎"
        title="Net Worth"
        subtitle="Complete financial status"
        rightContent={
          <div className="text-right">
            <div className="text-xs text-text-muted mb-1">Current Net Worth</div>
            <div className={`text-3xl font-bold tabular-nums ${currentNetWorth >= 0 ? 'text-purple' : 'text-red'}`}>
              {formatCurrency(currentNetWorth)}
            </div>
          </div>
        }
      />

      {/* ── Account Managers ── */}
      <div className="flex flex-wrap gap-4 mb-2">
        <div className="flex-1 min-w-[200px]">
          <AccountManager
            accounts={data.accounts}
            category="cash"
            onAdd={addAccount}
            onRemove={(id) => updateAccounts(data.accounts.filter(a => a.id !== id))}
            onToggleActive={(id) => updateAccounts(data.accounts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <AccountManager
            accounts={data.accounts}
            category="investment"
            onAdd={addAccount}
            onRemove={(id) => updateAccounts(data.accounts.filter(a => a.id !== id))}
            onToggleActive={(id) => updateAccounts(data.accounts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <AccountManager
            accounts={data.accounts}
            category="debt"
            onAdd={addAccount}
            onRemove={(id) => updateAccounts(data.accounts.filter(a => a.id !== id))}
            onToggleActive={(id) => updateAccounts(data.accounts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))}
          />
        </div>
      </div>

      {/* ── Section 1: All-accounts monthly table ── */}
      <Card className="mb-6" style={{ borderColor: 'var(--page-accent, #a855f7)' }}>
        <CardTitle style={{ color: 'var(--page-accent, #a855f7)' }}>All Accounts — Monthly Balances</CardTitle>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2.5 px-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider whitespace-nowrap">
                  Account
                </th>
                <th className="py-2.5 px-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider whitespace-nowrap">
                  Type
                </th>
                {monthLabels.map((label, i) => (
                  <th
                    key={monthKeys[i]}
                    className={`py-2.5 px-3 text-right font-medium text-xs uppercase tracking-wider whitespace-nowrap ${
                      monthKeys[i] === latestMonthKey ? 'text-accent' : 'text-text-muted'
                    }`}
                  >
                    {label}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right font-medium text-text-muted text-xs uppercase tracking-wider whitespace-nowrap">
                  Delta
                </th>
              </tr>
            </thead>
            <tbody>
              {(['cash', 'investment', 'debt'] as const).map(cat => {
                const catAccounts = orderedAccounts.filter(a => a.category === cat)
                if (catAccounts.length === 0) return null
                return [
                  // Category header row
                  <tr key={`header-${cat}`} className="bg-surface-hover">
                    <td
                      colSpan={3 + monthKeys.length}
                      className={`py-1.5 px-3 text-xs font-semibold uppercase tracking-widest ${categoryHeaderStyle[cat]}`}
                    >
                      {categoryLabel[cat]}
                    </td>
                  </tr>,
                  // Account rows
                  ...catAccounts.map(acc => {
                    const lastMonthSnap = monthKeys.length > 0 ? monthlyMap.get(monthKeys[monthKeys.length - 1]) : null
                    const prevMonthSnap = prevMonthKey ? monthlyMap.get(prevMonthKey) : null
                    const lastVal = lastMonthSnap ? (lastMonthSnap.balances[acc.id] ?? 0) : 0
                    const prevVal = prevMonthSnap ? (prevMonthSnap.balances[acc.id] ?? 0) : 0
                    const delta = monthKeys.length >= 2 ? lastVal - prevVal : 0
                    return (
                      <tr
                        key={acc.id}
                        className="border-b border-border-light hover:bg-surface-hover transition-colors"
                      >
                        <td className="py-2.5 px-3 text-text-primary whitespace-nowrap">
                          <div className="font-medium">{acc.name}</div>
                          <div className="text-xs text-text-muted">{acc.institution}</div>
                        </td>
                        <td className="py-2.5 px-3 text-text-muted capitalize text-xs whitespace-nowrap">
                          {acc.type}
                        </td>
                        {monthKeys.map(mk => {
                          const snap = monthlyMap.get(mk)
                          const val = snap ? (snap.balances[acc.id] ?? null) : null
                          return (
                            <td
                              key={mk}
                              className={`py-2.5 px-3 text-right tabular-nums ${
                                val === null
                                  ? 'text-text-muted'
                                  : val < 0
                                  ? 'text-red'
                                  : val > 0
                                  ? 'text-text-primary'
                                  : 'text-text-secondary'
                              }`}
                            >
                              {val !== null ? formatCurrency(val) : '—'}
                            </td>
                          )
                        })}
                        <td
                          className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                            delta > 0 ? 'text-green' : delta < 0 ? 'text-red' : 'text-text-muted'
                          }`}
                        >
                          {delta !== 0 ? `${delta > 0 ? '+' : ''}${formatCurrency(delta)}` : '—'}
                        </td>
                      </tr>
                    )
                  }),
                ]
              })}

              {/* NET WORTH total row */}
              <tr className="bg-accent/5 font-semibold border-t border-border">
                <td
                  colSpan={2}
                  className="py-2.5 px-3 text-text-primary text-xs uppercase tracking-wider"
                >
                  Net Worth
                </td>
                {monthNetWorthTotals.map((total, i) => (
                  <td
                    key={monthKeys[i]}
                    className={`py-2.5 px-3 text-right tabular-nums ${
                      total === null
                        ? 'text-text-muted'
                        : total >= 0
                        ? 'text-purple'
                        : 'text-red'
                    }`}
                  >
                    {total !== null ? formatCurrency(total) : '—'}
                  </td>
                ))}
                {(() => {
                  const lastNW = monthNetWorthTotals[monthNetWorthTotals.length - 1] ?? null
                  const prevNW = prevMonthKey ? monthNetWorthTotals[monthKeys.indexOf(prevMonthKey)] ?? null : null
                  const nwDelta = lastNW !== null && prevNW !== null ? lastNW - prevNW : null
                  return (
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                        nwDelta === null
                          ? 'text-text-muted'
                          : nwDelta >= 0
                          ? 'text-purple'
                          : 'text-red'
                      }`}
                    >
                      {nwDelta !== null && nwDelta !== 0
                        ? `${nwDelta > 0 ? '+' : ''}${formatCurrency(nwDelta)}`
                        : '—'}
                    </td>
                  )
                })()}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Section 2: Two-column chart grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Net Worth Snapshot donut pie chart */}
        <Card>
          <CardTitle>Net Worth — Snapshot</CardTitle>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map(entry => (
                    <Cell
                      key={entry.id}
                      fill={
                        entry.id === '__debt__'
                          ? '#ef4444'
                          : (prefs.accountColors[entry.id] ?? '#6b7280')
                      }
                      fillOpacity={0.85}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: any, name: any) => [formatCurrency(v as number), name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Net Worth Cumulative stacked bar chart */}
        <Card>
          <CardTitle>Net Worth — Cumulative</CardTitle>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stackedBarData}
                margin={{ top: 16, right: 4, bottom: 0, left: 0 }}
                stackOffset="sign"
              >
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#55556a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#55556a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#8888a0' }}
                  formatter={(v: any, name: any) => [formatCurrency(v as number), name]}
                />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="cash" name="Cash" stackId="nw" fill="#22c55e" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
                <Bar dataKey="investments" name="Investments" stackId="nw" fill="#3b82f6" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
                <Bar dataKey="debt" name="Debt" stackId="nw" fill="#ef4444" fillOpacity={0.85} radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Section 3: Monthly Net Change bar chart ── */}
      {netChangeData.length > 0 && (
        <Card className="mb-6">
          <CardTitle>Monthly Net Change</CardTitle>
          <div className="h-52 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netChangeData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#55556a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#55556a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v: number) => {
                    const abs = Math.abs(v)
                    const sign = v < 0 ? '-' : '+'
                    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(0)}K`
                    return `${sign}$${abs.toFixed(0)}`
                  }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: '#8888a0' }}
                  formatter={(v: any) => [
                    `${v >= 0 ? '+' : ''}${formatCurrency(v)}`,
                    'Net Change',
                  ]}
                />
                <Bar dataKey="change" radius={[3, 3, 0, 0]}>
                  {netChangeData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.change >= 0 ? '#22c55e' : '#ef4444'}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Summary stats */}
          <div className="flex gap-6 mt-3 pt-3 border-t border-border flex-wrap">
            {(() => {
              const positiveMonths = netChangeData.filter(d => d.change > 0).length
              const totalChange = netChangeData.reduce((s, d) => s + d.change, 0)
              const best = netChangeData.reduce(
                (b, d) => (d.change > b.change ? d : b),
                netChangeData[0]
              )
              const worst = netChangeData.reduce(
                (w, d) => (d.change < w.change ? d : w),
                netChangeData[0]
              )
              return (
                <>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Positive Months</p>
                    <p className="text-sm font-semibold text-green">
                      {positiveMonths} / {netChangeData.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Total Change</p>
                    <p className={`text-sm font-semibold tabular-nums ${totalChange >= 0 ? 'text-green' : 'text-red'}`}>
                      {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
                    </p>
                  </div>
                  {best && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">Best Month</p>
                      <p className="text-sm font-semibold text-green tabular-nums">
                        {best.label} +{formatCurrency(best.change)}
                      </p>
                    </div>
                  )}
                  {worst && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">Worst Month</p>
                      <p className="text-sm font-semibold text-red tabular-nums">
                        {worst.label} {formatCurrency(worst.change)}
                      </p>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </Card>
      )}

      {/* ── Section 4: Net Worth Over Time area chart ── */}
      <Card>
        <CardTitle>Net Worth Over Time</CardTitle>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthSeries} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="nwPageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#55556a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#55556a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: '#8888a0' }}
                formatter={(v: any) => [formatCurrency(v), 'Net Worth']}
              />
              <Area
                type={curveType}
                dataKey="netWorth"
                stroke="#a855f7"
                fill="url(#nwPageGrad)"
                strokeWidth={2.5}
                dot={prefs.showDots ? { r: 3, fill: '#a855f7' } : false}
                activeDot={{ r: 4, fill: '#a855f7' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Milestones reference */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-border flex-wrap">
          {[150000, 200000, 250000, 300000].map(milestone => (
            <div key={milestone} className="text-xs text-text-muted">
              <span className={currentNetWorth >= milestone ? 'text-green' : 'text-text-muted'}>
                {currentNetWorth >= milestone ? '✓ ' : ''}
              </span>
              ${(milestone / 1000).toFixed(0)}K
              {currentNetWorth >= milestone
                ? ' reached'
                : ` — ${formatCurrency(milestone - currentNetWorth)} away`}
            </div>
          ))}
        </div>
      </Card>
    </div>
    </PageTheme>
  )
}
