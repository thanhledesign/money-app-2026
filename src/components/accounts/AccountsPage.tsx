import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts'
import type { AppData } from '@/data/types'
import type { Account } from '@/data/types'
import type { ChartPrefs } from '@/data/chartPrefs'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { PageTheme } from '@/components/ui/PageTheme'
import { AccountManager } from '@/components/ui/AccountManager'
import {
  getLatestSnapshot,
  getMonthKey,
  getMonthlySnapshots,
  formatCurrency,
  formatDateShort,
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

export default function AccountsPage({ data, prefs, addAccount, updateAccounts }: Props) {
  const curveType = prefs.curveType === 'smooth' ? 'monotone' : 'linear'

  const accounts = useMemo(
    () => data.accounts.filter(a => a.category === 'cash' && a.isActive),
    [data.accounts],
  )

  const latest = useMemo(() => getLatestSnapshot(data), [data])

  // Build ordered month keys from the monthly-snapshot map
  const { monthKeys, monthlyMap } = useMemo(() => {
    const map = getMonthlySnapshots(data)
    const keys = Array.from(map.keys()).sort()
    return { monthKeys: keys, monthlyMap: map }
  }, [data])

  // Friendly label for a month key like "2026-03" → "Mar '26"
  function labelMonth(key: string): string {
    const [year, month] = key.split('-')
    const d = new Date(Number(year), Number(month) - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  // Balance for an account in a given monthly snapshot (0 if not recorded)
  function balanceFor(accountId: string, monthKey: string): number {
    const snap = monthlyMap.get(monthKey)
    return snap ? (snap.balances[accountId] ?? 0) : 0
  }

  // Column totals across all cash accounts
  function monthTotal(monthKey: string): number {
    return accounts.reduce((sum, acc) => sum + balanceFor(acc.id, monthKey), 0)
  }

  const currentTotal = latest
    ? accounts.reduce((sum, acc) => sum + (latest.balances[acc.id] ?? 0), 0)
    : 0

  // Determine if current month is already represented in monthKeys so we
  // know whether to show "Current" as a distinct column or collapse it.
  const latestMonthKey = latest ? getMonthKey(latest.timestamp) : null
  const currentIsNewColumn =
    latestMonthKey !== null && !monthKeys.includes(latestMonthKey)

  // ── Snapshot pie data (current balances per account) ──
  const pieData = useMemo(() => {
    if (!latest) return []
    return accounts
      .map(acc => ({
        id: acc.id,
        name: acc.name,
        value: latest.balances[acc.id] ?? 0,
      }))
      .filter(d => d.value > 0)
  }, [latest, accounts])

  // ── Individual line chart: one point per snapshot, one series per account ──
  const lineData = useMemo(() => {
    return data.snapshots.map(snap => {
      const point: Record<string, number | string> = {
        date: formatDateShort(snap.timestamp),
      }
      for (const acc of accounts) {
        point[acc.id] = snap.balances[acc.id] ?? 0
      }
      return point
    })
  }, [data.snapshots, accounts])

  // ── Cumulative stacked bar chart: one bar per month, stacked by account ──
  const barData = useMemo(() => {
    return monthKeys.map(mk => {
      const point: Record<string, number | string> = { month: labelMonth(mk) }
      for (const acc of accounts) {
        point[acc.id] = balanceFor(acc.id, mk)
      }
      point['__total'] = monthTotal(mk)
      return point
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKeys, accounts, monthlyMap])

  // Previous month key for delta computation (second-to-last)
  const prevMonthKey = monthKeys.length >= 2 ? monthKeys[monthKeys.length - 2] : null

  return (
    <PageTheme page="accounts">
    <div>
      <PageHeader
        icon="🏦"
        title="Cash Accounts"
        subtitle="Checking, savings, high-yield savings balances"
      />

      <AccountManager
        accounts={data.accounts}
        category="cash"
        onAdd={addAccount}
        onRemove={(id) => updateAccounts(data.accounts.filter(a => a.id !== id))}
        onToggleActive={(id) => updateAccounts(data.accounts.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a))}
      />

      {accounts.length === 0 && (
        <p className="text-text-muted text-center py-20">No active cash accounts found.</p>
      )}

      {accounts.length > 0 && (
        <>
          {/* ── Section 1: Monthly Balance Table ── */}
          <Card className="mb-6 overflow-x-auto" style={{ borderColor: 'var(--page-accent, #22c55e)' }}>
            <CardTitle style={{ color: 'var(--page-accent, #22c55e)' }}>Monthly Balances</CardTitle>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-text-muted whitespace-nowrap min-w-[160px]">
                      Account
                    </th>
                    {monthKeys.map(mk => (
                      <th
                        key={mk}
                        className="text-right py-2 px-3 font-medium text-text-muted whitespace-nowrap tabular-nums"
                      >
                        {labelMonth(mk)}
                      </th>
                    ))}
                    {currentIsNewColumn && (
                      <th className="text-right py-2 px-3 font-medium text-text-secondary whitespace-nowrap tabular-nums">
                        Current
                      </th>
                    )}
                    <th className="text-right py-2 px-3 font-medium text-text-muted whitespace-nowrap tabular-nums">
                      Delta
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map(acc => {
                    const currentBal = latest ? (latest.balances[acc.id] ?? 0) : 0
                    const lastMonthBal = monthKeys.length > 0 ? balanceFor(acc.id, monthKeys[monthKeys.length - 1]) : 0
                    const deltaBase = currentIsNewColumn ? lastMonthBal : (prevMonthKey ? balanceFor(acc.id, prevMonthKey) : 0)
                    const delta = currentIsNewColumn ? currentBal - lastMonthBal : (monthKeys.length >= 2 ? lastMonthBal - deltaBase : 0)
                    return (
                      <tr
                        key={acc.id}
                        className="border-b border-border/50 hover:bg-surface-hover transition-colors"
                      >
                        <td className="py-2 pr-4 whitespace-nowrap">
                          <span className="text-text-primary font-medium">{acc.name}</span>
                          <span className="ml-2 text-text-muted text-xs">{acc.institution}</span>
                        </td>
                        {monthKeys.map(mk => {
                          const bal = balanceFor(acc.id, mk)
                          return (
                            <td
                              key={mk}
                              className={`text-right py-2 px-3 tabular-nums whitespace-nowrap ${
                                bal >= 0 ? 'text-text-primary' : 'text-red'
                              }`}
                            >
                              {formatCurrency(bal)}
                            </td>
                          )
                        })}
                        {currentIsNewColumn && (
                          <td
                            className={`text-right py-2 px-3 tabular-nums whitespace-nowrap font-medium ${
                              currentBal >= 0 ? 'text-green' : 'text-red'
                            }`}
                          >
                            {formatCurrency(currentBal)}
                          </td>
                        )}
                        <td
                          className={`text-right py-2 px-3 tabular-nums whitespace-nowrap font-medium ${
                            delta > 0 ? 'text-green' : delta < 0 ? 'text-red' : 'text-text-muted'
                          }`}
                        >
                          {delta !== 0 ? `${delta > 0 ? '+' : ''}${formatCurrency(delta)}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* TOTAL row */}
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td className="py-2 pr-4 font-semibold text-text-primary">Total</td>
                    {monthKeys.map(mk => {
                      const total = monthTotal(mk)
                      return (
                        <td
                          key={mk}
                          className={`text-right py-2 px-3 tabular-nums font-semibold whitespace-nowrap ${
                            total >= 0 ? 'text-text-primary' : 'text-red'
                          }`}
                        >
                          {formatCurrency(total)}
                        </td>
                      )
                    })}
                    {currentIsNewColumn && (
                      <td
                        className={`text-right py-2 px-3 tabular-nums font-semibold whitespace-nowrap ${
                          currentTotal >= 0 ? 'text-green' : 'text-red'
                        }`}
                      >
                        {formatCurrency(currentTotal)}
                      </td>
                    )}
                    {(() => {
                      const prevTotal = currentIsNewColumn
                        ? monthTotal(monthKeys[monthKeys.length - 1] ?? '')
                        : (prevMonthKey ? monthTotal(prevMonthKey) : 0)
                      const totalDelta = currentIsNewColumn
                        ? currentTotal - prevTotal
                        : (monthKeys.length >= 2 ? monthTotal(monthKeys[monthKeys.length - 1]) - prevTotal : 0)
                      return (
                        <td
                          className={`text-right py-2 px-3 tabular-nums font-semibold whitespace-nowrap ${
                            totalDelta > 0 ? 'text-green' : totalDelta < 0 ? 'text-red' : 'text-text-muted'
                          }`}
                        >
                          {totalDelta !== 0 ? `${totalDelta > 0 ? '+' : ''}${formatCurrency(totalDelta)}` : '—'}
                        </td>
                      )
                    })()}
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* ── Section 2: Two-column grid — Snapshot + Individual ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left: Snapshot donut pie */}
            <Card>
              <CardTitle>Cash Accounts — Snapshot</CardTitle>
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                    >
                      {pieData.map(entry => (
                        <Cell
                          key={entry.id}
                          fill={prefs.accountColors[entry.id] ?? '#6b7280'}
                          stroke={(prefs.accountColors[entry.id] ?? '#6b7280') + '60'}
                          strokeWidth={1.5}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: '#8888a0' }}
                      formatter={(v: any, name: any) => [formatCurrency(v), name]}
                    />
                    <Legend
                      formatter={(name: string) => (
                        <span style={{ color: '#8888a0', fontSize: 11 }}>{name}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Right: Individual line chart */}
            <Card>
              <CardTitle>Cash Accounts — Individual</CardTitle>
              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: '#8888a0' }}
                      formatter={(v: any, id: any) => {
                        const acc = accounts.find(a => a.id === id)
                        return [formatCurrency(v), acc ? acc.name : id]
                      }}
                    />
                    <Legend
                      formatter={(id: string) => {
                        const acc = accounts.find(a => a.id === id)
                        return (
                          <span style={{ color: '#8888a0', fontSize: 11 }}>
                            {acc ? acc.name : id}
                          </span>
                        )
                      }}
                    />
                    {accounts.map(acc => {
                      const color = prefs.accountColors[acc.id] ?? '#6b7280'
                      return (
                        <Line
                          key={acc.id}
                          type={curveType}
                          dataKey={acc.id}
                          stroke={color}
                          strokeWidth={2}
                          dot={prefs.showDots ? { r: 3, fill: color } : false}
                          activeDot={{ r: 4 }}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ── Section 3: Full-width cumulative stacked bar chart ── */}
          <Card>
            <CardTitle>Cash Accounts — Cumulative</CardTitle>
            <div className="h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
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
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: '#8888a0' }}
                    formatter={(v: any, id: any) => {
                      const acc = accounts.find(a => a.id === id)
                      return [formatCurrency(v), acc ? acc.name : id]
                    }}
                  />
                  <Legend
                    formatter={(id: string) => {
                      const acc = accounts.find(a => a.id === id)
                      return (
                        <span style={{ color: '#8888a0', fontSize: 11 }}>
                          {acc ? acc.name : id}
                        </span>
                      )
                    }}
                  />
                  {accounts.map(acc => (
                    <Bar
                      key={acc.id}
                      dataKey={acc.id}
                      stackId="total"
                      fill={prefs.accountColors[acc.id] ?? '#6b7280'}
                      label={false}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
    </PageTheme>
  )
}
