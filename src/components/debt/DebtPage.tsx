import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LabelList,
} from 'recharts'
import type { AppData } from '@/data/types'
import type { Account } from '@/data/types'
import type { ChartPrefs } from '@/data/chartPrefs'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageTheme } from '@/components/ui/PageTheme'
import { AccountManager } from '@/components/ui/AccountManager'
import {
  getAccountsByCategory,
  getMonthlySnapshots,
  getMonthKey,
  getCurrentMonthKey,
  getLatestSnapshot,
  formatCurrency,
  formatPercent,
} from '@/lib/calculations'
import { ScrollableTable } from '@/components/ui/ScrollableTable'

interface Props {
  data: AppData
  prefs: ChartPrefs
  onUpdatePrefs: (partial: Partial<ChartPrefs>) => void
  addAccount: (a: Account) => void
  updateAccounts: (a: Account[]) => void
}

import { CHART_TOOLTIP, TOOLTIP_CONTENT_STYLE, AXIS_TICK, LEGEND_TEXT_STYLE } from '@/components/ui/chartConstants'

export default function DebtPage({ data, prefs, addAccount, updateAccounts }: Props) {
  const curveType = prefs.curveType === 'smooth' ? 'monotone' : 'linear'

  const latest = getLatestSnapshot(data)
  const debtAccounts = useMemo(
    () => getAccountsByCategory(data, 'debt').filter(a => a.isActive),
    [data]
  )

  // ----- Monthly balance table -----
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

  // ----- Credit card status (latest snapshot) -----
  const cardStatuses = useMemo(() => {
    if (!latest) return []
    return debtAccounts.map(acc => {
      const balance = latest.balances[acc.id] ?? 0
      const absBalance = Math.abs(balance)
      const limit = acc.creditLimit ?? 0
      const utilized = limit > 0 ? absBalance / limit : 0
      return { acc, balance, absBalance, limit, utilized }
    })
  }, [debtAccounts, latest])

  const totalDebt = useMemo(() => {
    if (!latest) return 0
    return debtAccounts.reduce((sum, acc) => sum + (latest.balances[acc.id] ?? 0), 0)
  }, [debtAccounts, latest])

  const totalLimit = useMemo(
    () => debtAccounts.reduce((sum, acc) => sum + (acc.creditLimit ?? 0), 0),
    [debtAccounts]
  )

  // Totals per month for the table footer
  const monthTotals = useMemo(
    () =>
      monthKeys.map(mk => {
        const snap = monthlyMap.get(mk)
        if (!snap) return null
        return debtAccounts.reduce((sum, acc) => sum + (snap.balances[acc.id] ?? 0), 0)
      }),
    [monthKeys, monthlyMap, debtAccounts]
  )

  // ----- Snapshot bar chart data (current balances, horizontal) -----
  const snapshotBarData = useMemo(() => {
    if (!latest) return []
    return debtAccounts.map(acc => ({
      name: acc.name,
      id: acc.id,
      balance: latest.balances[acc.id] ?? 0,
    }))
  }, [debtAccounts, latest])

  // ----- Individual debt line chart over time -----
  const debtLineData = useMemo(() => {
    return monthKeys.map((mk, i) => {
      const snap = monthlyMap.get(mk)
      const point: Record<string, string | number> = { month: monthLabels[i] }
      debtAccounts.forEach(acc => {
        point[acc.id] = snap ? (snap.balances[acc.id] ?? 0) : 0
      })
      return point
    })
  }, [monthKeys, monthLabels, monthlyMap, debtAccounts])

  // ----- Previous month key for delta computation -----
  const prevMonthKey = monthKeys.length >= 2 ? monthKeys[monthKeys.length - 2] : null

  // ----- Cumulative stacked bar chart data (one bar per month, stacked per debt account) -----
  const cumulativeBarData = useMemo(() => {
    return monthKeys.map((mk, i) => {
      const snap = monthlyMap.get(mk)
      const point: Record<string, string | number> = { month: monthLabels[i] }
      let total = 0
      debtAccounts.forEach(acc => {
        const val = snap ? (snap.balances[acc.id] ?? 0) : 0
        point[acc.id] = val
        total += val
      })
      point['__total'] = total
      return point
    })
  }, [monthKeys, monthLabels, monthlyMap, debtAccounts])

  // ----- FICO score history -----
  const ficoHistory = useMemo(
    () =>
      data.snapshots
        .filter(s => s.creditScore !== null)
        .map(s => ({
          date: new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          score: s.creditScore as number,
        })),
    [data.snapshots]
  )

  const utilizationBarColor = (pct: number) => {
    if (pct < 0.3) return 'bg-green'
    if (pct < 0.5) return 'bg-amber'
    return 'bg-red'
  }

  const utilizationTextColor = (pct: number) => {
    if (pct < 0.3) return 'text-green'
    if (pct < 0.5) return 'text-amber'
    return 'text-red'
  }

  const latestMonthKey = latest ? getMonthKey(latest.timestamp) : ''
  const currentMonthKey = getCurrentMonthKey()

  return (
    <PageTheme page="debt">
    <div>
      <PageHeader
        icon="👿"
        title="Debt"
        titleKey="debt"
        subtitle="Credit cards, loans, and debt status"
        rightContent={latest ?
          <div className="text-right">
            <div className="text-xs text-text-muted mb-1">Total Debt</div>
            <div className={`text-3xl font-bold tabular-nums ${totalDebt < 0 ? 'text-red' : 'text-green'}`}>
              {formatCurrency(totalDebt)}
            </div>
            <div className="text-xs text-text-muted mt-1">
              of {formatCurrency(totalLimit)} total limit
            </div>
          </div>
        : undefined}
      />

      <AccountManager
        accounts={data.accounts}
        category="debt"
        onAdd={addAccount}
        onRemove={(id) => updateAccounts(data.accounts.filter(a => a.id !== id))}
        onToggleActive={(id) => updateAccounts(data.accounts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))}
      />

      {!latest && (
        <EmptyState icon="💀" title="No debt data" message="Add your credit cards and loans above, then record a snapshot to see your debt dashboard." accountsRoute="/debt" />
      )}

      {latest && <>
      {/* ── Section 1: Monthly Balance Table ── */}
      <Card className="mb-6" style={{ borderColor: 'var(--page-accent, #f59e0b)' }}>
        <CardTitle style={{ color: 'var(--page-accent, #f59e0b)' }}>Monthly Balance History</CardTitle>
        <ScrollableTable className="mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2.5 px-3 text-left font-medium text-text-muted text-xs uppercase tracking-wider whitespace-nowrap">
                  Account
                </th>
                {monthLabels.map((label, i) => (
                  <th
                    key={monthKeys[i]}
                    className={`py-2.5 px-3 text-right font-medium text-xs uppercase tracking-wider whitespace-nowrap ${
                      monthKeys[i] === currentMonthKey ? 'text-text-primary' : 'text-text-muted opacity-60'
                    }`}
                  >
                    {label}
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right font-medium text-xs uppercase tracking-wider whitespace-nowrap text-text-muted">
                  Delta
                </th>
              </tr>
            </thead>
            <tbody>
              {debtAccounts.map(acc => {
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
                    {monthKeys.map(mk => {
                      const snap = monthlyMap.get(mk)
                      const val = snap ? (snap.balances[acc.id] ?? null) : null
                      const isPast = mk < currentMonthKey
                      return (
                        <td
                          key={mk}
                          className={`py-2.5 px-3 text-right tabular-nums ${
                            isPast ? 'opacity-60' : ''
                          } ${
                            val === null
                              ? 'text-text-muted'
                              : val < 0
                              ? 'text-red'
                              : val > 0
                              ? 'text-green'
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
              })}

              {/* TOTAL row */}
              <tr className="bg-accent/5 font-semibold border-t border-border">
                <td className="py-2.5 px-3 text-text-primary text-xs uppercase tracking-wider">
                  Total
                </td>
                {monthTotals.map((total, i) => {
                  const isPast = monthKeys[i] < currentMonthKey
                  return (
                    <td
                      key={monthKeys[i]}
                      className={`py-2.5 px-3 text-right tabular-nums ${
                        isPast ? 'opacity-60' : ''
                      } ${
                        total === null
                          ? 'text-text-muted'
                          : total < 0
                          ? 'text-red'
                          : total > 0
                          ? 'text-green'
                          : 'text-text-secondary'
                      }`}
                    >
                      {total !== null ? formatCurrency(total) : '—'}
                    </td>
                  )
                })}
                {(() => {
                  const lastTotal = monthTotals[monthTotals.length - 1] ?? null
                  const prevTotal = prevMonthKey ? monthTotals[monthKeys.indexOf(prevMonthKey)] ?? null : null
                  const totalDelta = lastTotal !== null && prevTotal !== null ? lastTotal - prevTotal : null
                  return (
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                        totalDelta === null
                          ? 'text-text-muted'
                          : totalDelta > 0
                          ? 'text-green'
                          : totalDelta < 0
                          ? 'text-red'
                          : 'text-text-secondary'
                      }`}
                    >
                      {totalDelta !== null && totalDelta !== 0
                        ? `${totalDelta > 0 ? '+' : ''}${formatCurrency(totalDelta)}`
                        : '—'}
                    </td>
                  )
                })()}
              </tr>
            </tbody>
          </table>
        </ScrollableTable>
      </Card>

      {/* ── Section 2: Credit Card Status ── */}
      <Card className="mb-6">
        <CardTitle>Credit Card Status</CardTitle>

        {/* Summary totals */}
        <div className="flex gap-6 mt-3 mb-5 pb-4 border-b border-border">
          <div>
            <p className="text-xs text-text-muted mb-1">Total Balance</p>
            <p className={`text-xl font-semibold tabular-nums ${totalDebt < 0 ? 'text-red' : 'text-green'}`}>
              {formatCurrency(totalDebt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Total Limit</p>
            <p className="text-xl font-semibold tabular-nums text-text-primary">
              {formatCurrency(totalLimit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Overall Utilization</p>
            <p className={`text-xl font-semibold tabular-nums ${
              totalLimit > 0
                ? utilizationTextColor(Math.abs(totalDebt) / totalLimit)
                : 'text-text-secondary'
            }`}>
              {totalLimit > 0 ? formatPercent(Math.abs(totalDebt) / totalLimit) : '—'}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {cardStatuses.map(({ acc, balance, absBalance, limit, utilized }) => (
            <div key={acc.id}>
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <p className="text-sm font-medium text-text-primary">{acc.name}</p>
                  <p className="text-xs text-text-muted">{acc.institution}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold tabular-nums ${balance < 0 ? 'text-red' : 'text-green'}`}>
                    {formatCurrency(balance)}
                  </p>
                  {limit > 0 && (
                    <p className="text-xs text-text-muted">
                      of {formatCurrency(limit)} limit
                    </p>
                  )}
                </div>
              </div>

              {limit > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-muted">Utilized</span>
                    <span className={`text-xs font-medium ${utilizationTextColor(utilized)}`}>
                      {formatPercent(utilized)}
                      {utilized < 0.3 && ' · Good'}
                      {utilized >= 0.3 && utilized < 0.5 && ' · Moderate'}
                      {utilized >= 0.5 && ' · High'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${utilizationBarColor(utilized)}`}
                      style={{ width: `${Math.min(utilized * 100, 100).toFixed(1)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-text-muted">$0</span>
                    <span className="text-xs text-text-muted">{formatCurrency(absBalance)} used of {formatCurrency(limit)}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-text-muted italic">No credit limit on file</p>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-5 pt-4 border-t border-border">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green" />
            <span className="text-xs text-text-muted">Under 30% — Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber" />
            <span className="text-xs text-text-muted">30–50% — Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red" />
            <span className="text-xs text-text-muted">Over 50% — High</span>
          </div>
        </div>
      </Card>

      {/* ── Section 3: Two-column chart grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Debt Snapshot horizontal bar chart */}
        <Card>
          <CardTitle>Debt — Snapshot</CardTitle>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={snapshotBarData}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: '#55556a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => {
                    const abs = Math.abs(v)
                    if (abs >= 1000) return `-$${(abs / 1000).toFixed(0)}K`
                    return `-$${abs.toFixed(0)}`
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={CHART_TOOLTIP.labelStyle}
                  formatter={(v: any) => [formatCurrency(v), 'Balance']}
                />
                <Bar dataKey="balance" radius={[0, 3, 3, 0]}>
                  {snapshotBarData.map(entry => (
                    <Cell
                      key={entry.id}
                      fill={prefs.accountColors[entry.id] ?? '#6b7280'}
                      fillOpacity={0.85}
                      stroke={(prefs.accountColors[entry.id] ?? '#6b7280') + '60'}
                      strokeWidth={1.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right: Debt Individual line chart over time */}
        <Card>
          <CardTitle>Debt — Individual</CardTitle>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={debtLineData}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
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
                  tickFormatter={(v: number) => {
                    const abs = Math.abs(v)
                    if (abs >= 1000) return `-$${(abs / 1000).toFixed(0)}K`
                    return `$${v.toFixed(0)}`
                  }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={CHART_TOOLTIP.labelStyle}
                  formatter={(v: any, name: any) => [formatCurrency(v), name]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                {debtAccounts.map(acc => (
                  <Line
                    key={acc.id}
                    type={curveType}
                    dataKey={acc.id}
                    name={acc.name}
                    stroke={prefs.accountColors[acc.id] ?? '#6b7280'}
                    strokeWidth={2}
                    dot={prefs.showDots ? { r: 3, fill: prefs.accountColors[acc.id] ?? '#6b7280' } : false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Section 4: Debt — Monthly Cumulative stacked bar ── */}
      {cumulativeBarData.length > 0 && (
        <Card className="mb-6">
          <CardTitle>Debt — Monthly Cumulative</CardTitle>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cumulativeBarData} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
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
                  tickFormatter={(v: number) => {
                    const abs = Math.abs(v)
                    if (abs >= 1000) return `$${(abs / 1000).toFixed(0)}K`
                    return `$${abs.toFixed(0)}`
                  }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={CHART_TOOLTIP.labelStyle}
                  formatter={(v: any, id: any) => {
                    const acc = debtAccounts.find(a => a.id === id)
                    return [formatCurrency(v), acc ? acc.name : id]
                  }}
                />
                <Legend
                  formatter={(id: string) => {
                    const acc = debtAccounts.find(a => a.id === id)
                    return (
                      <span style={LEGEND_TEXT_STYLE}>
                        {acc ? acc.name : id}
                      </span>
                    )
                  }}
                />
                {debtAccounts.map((acc, idx) => (
                  <Bar
                    key={acc.id}
                    dataKey={acc.id}
                    stackId="debt"
                    fill={prefs.accountColors[acc.id] ?? '#6b7280'}
                    fillOpacity={0.85}
                  >
                    {idx === debtAccounts.length - 1 && (
                      <LabelList
                        dataKey="__total"
                        position="top"
                        style={{ fill: '#55556a', fontSize: 10 }}
                        formatter={(v: any) => v !== 0 ? formatCurrency(v) : ''}
                      />
                    )}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* ── Section 5: FICO Score History ── */}
      {ficoHistory.length > 0 && (
        <Card>
          <CardTitle>FICO Score History</CardTitle>
          <div className="flex items-baseline gap-3 mt-2 mb-4">
            <span className={`text-3xl font-bold tabular-nums ${
              (latest.creditScore ?? 0) >= 750
                ? 'text-green'
                : (latest.creditScore ?? 0) >= 700
                ? 'text-amber'
                : 'text-red'
            }`}>
              {latest.creditScore ?? '—'}
            </span>
            <span className="text-sm text-text-muted">
              {(latest.creditScore ?? 0) >= 750
                ? 'Excellent'
                : (latest.creditScore ?? 0) >= 700
                ? 'Good'
                : (latest.creditScore ?? 0) >= 650
                ? 'Fair'
                : 'Poor'}
            </span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ficoHistory} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="ficoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#55556a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#55556a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={CHART_TOOLTIP.labelStyle}
                  formatter={(v: any) => [v, 'FICO Score']}
                />
                <Area
                  type={curveType}
                  dataKey="score"
                  stroke="#22c55e"
                  fill="url(#ficoGrad)"
                  strokeWidth={2}
                  dot={prefs.showDots ? { r: 3, fill: '#22c55e' } : false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Score bands reference */}
          <div className="flex gap-4 mt-3 flex-wrap">
            {[
              { label: '800+ Exceptional', color: 'text-green' },
              { label: '740–799 Very Good', color: 'text-green' },
              { label: '670–739 Good', color: 'text-amber' },
              { label: '580–669 Fair', color: 'text-amber' },
              { label: 'Below 580 Poor', color: 'text-red' },
            ].map(band => (
              <span key={band.label} className={`text-xs ${band.color}`}>
                {band.label}
              </span>
            ))}
          </div>
        </Card>
      )}
      </>}
    </div>
    </PageTheme>
  )
}
