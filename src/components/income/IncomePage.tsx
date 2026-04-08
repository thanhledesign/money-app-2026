import { useState } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { AppData, CompBreakdown, PaycheckDeduction, PaycheckAllocation } from '@/data/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'

interface IncomePageProps {
  data: AppData
  updateComp: (comp: CompBreakdown) => void
  updateDeductions: (d: PaycheckDeduction[]) => void
  updateAllocations: (a: PaycheckAllocation[]) => void
}

// ── Shared chart style ────────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: '#12121a',
  border: '1px solid #2a2a3a',
  borderRadius: '8px',
  fontSize: '12px',
}

// ── Pay Period Calculations ───────────────────────────────────────────────────

interface PayRow {
  label: string
  gross: number
  taxed: number
  net: number
}

function computePayRows(comp: CompBreakdown): PayRow[] {
  const { annualSalary, bonus, ltiPreTax, taxRate } = comp

  const weeklyGross = annualSalary / 52
  const tax = (v: number) => v * taxRate

  const periods: { label: string; multiplier: number }[] = [
    { label: 'Hourly',       multiplier: 1 / 40 },
    { label: 'Daily',        multiplier: 1 / 5 },
    { label: 'Weekly',       multiplier: 1 },
    { label: 'Bi-Weekly',    multiplier: 2 },
    { label: 'Semi-Monthly', multiplier: annualSalary / 24 / weeklyGross },
    { label: 'Monthly',      multiplier: annualSalary / 12 / weeklyGross },
    { label: 'Quarterly',    multiplier: annualSalary / 4 / weeklyGross },
    { label: 'Annual',       multiplier: 52 },
  ]

  const rows: PayRow[] = periods.map(({ label, multiplier }) => {
    const gross = weeklyGross * multiplier
    const taxed = tax(gross)
    return { label, gross, taxed, net: gross - taxed }
  })

  // Bonus row
  rows.push({
    label: 'Bonus',
    gross: bonus,
    taxed: tax(bonus),
    net: bonus - tax(bonus),
  })

  // LTI row — pre-taxed, no additional tax hit
  rows.push({
    label: 'LTI (Pre-Tax)',
    gross: ltiPreTax,
    taxed: 0,
    net: ltiPreTax,
  })

  // TOTAL row
  const totalGross = annualSalary + bonus + ltiPreTax
  const totalTaxed = tax(annualSalary) + tax(bonus)
  rows.push({
    label: 'TOTAL',
    gross: totalGross,
    taxed: totalTaxed,
    net: totalGross - totalTaxed,
  })

  return rows
}

// ── Editable Number Input ─────────────────────────────────────────────────────

interface EditableInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  format?: 'currency' | 'percent'
  prefix?: string
  suffix?: string
}

function EditableInput({ label, value, onChange, format = 'currency' }: EditableInputProps) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  const display =
    format === 'percent'
      ? formatPercent(value, 4)
      : formatCurrency(value)

  return (
    <div className="flex items-center justify-between py-2 border-b border-border-light">
      <span className="text-sm text-text-secondary">{label}</span>
      {editing ? (
        <input
          autoFocus
          type="number"
          step="any"
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onBlur={() => {
            const parsed = parseFloat(raw)
            if (!isNaN(parsed)) onChange(parsed)
            setEditing(false)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-36 bg-surface border border-accent rounded px-2 py-1 text-sm text-green text-right focus:outline-none"
        />
      ) : (
        <button
          onClick={() => { setRaw(String(value)); setEditing(true) }}
          className="text-sm font-medium text-green tabular-nums hover:text-accent transition-colors cursor-pointer bg-transparent border-none"
        >
          {display}
        </button>
      )}
    </div>
  )
}

// ── Chart 1: Total Compensation Package Donut ─────────────────────────────────

function CompPackagePieChart({ comp }: { comp: CompBreakdown }) {
  const slices = [
    { name: 'Annual Pay', value: comp.annualSalary, color: '#22c55e' },
    { name: 'Bonus',      value: comp.bonus,        color: '#f59e0b' },
    { name: 'LTI',        value: comp.ltiPreTax,    color: '#a855f7' },
  ].filter(s => s.value > 0)

  const total = slices.reduce((s, d) => s + d.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Compensation Package</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }: any) =>
              `${name}: ${formatCurrency(value)}`
            }
            labelLine={true}
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: any) => [formatCurrency(value as number), '']}
          />
          <Legend
            formatter={(value: any) => (
              <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-text-muted mt-1">
        Total: <span className="text-green font-medium">{formatCurrency(total)}</span>
      </p>
    </Card>
  )
}

// ── Chart 2: Gross Pay 2026 Horizontal Bar ────────────────────────────────────

function GrossPayBarChart({ comp }: { comp: CompBreakdown }) {
  const rows = computePayRows(comp)
  // Exclude the TOTAL row from the bar chart; show everything else
  const chartData = rows
    .filter(r => r.label !== 'TOTAL' && r.label !== 'LTI (Pre-Tax)')
    .concat(rows.filter(r => r.label === 'LTI (Pre-Tax)').map(r => ({ ...r, label: 'LTI' })))
    .map(r => ({ name: r.label, Gross: r.gross }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gross Pay — 2026</CardTitle>
      </CardHeader>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 24, bottom: 0, left: 72 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v: any) => formatCurrency(v as number)}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a3a' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={68}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: any) => [formatCurrency(value as number), 'Gross']}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="Gross" fill="#22c55e" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ── Chart 3 & 4: Gross Paycheck Distribution ──────────────────────────────────

const DIST_COLORS = [
  '#ef4444', // Taxes — red
  '#06b6d4', // Dental — cyan
  '#3b82f6', // Medical — blue
  '#8b5cf6', // Vision — violet
  '#f59e0b', // 401K — amber
  '#22c55e', // accounts start — green
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#84cc16',
  '#64748b',
]

interface DistSlice {
  name: string
  value: number
  color: string
}

function buildDistSlices(
  comp: CompBreakdown,
  deductions: PaycheckDeduction[],
  allocations: PaycheckAllocation[],
  accounts: AppData['accounts'],
): DistSlice[] {
  const grossSemiMonthly = comp.annualSalary / 24

  const slices: DistSlice[] = []
  let colorIdx = 0

  // Taxes (all deductions lumped: tax + pretax lines appear individually)
  const taxLines = deductions.filter(d => d.type === 'tax')
  const pretaxLines = deductions.filter(d => d.type === 'pretax')

  const allDeducLines = [...taxLines, ...pretaxLines]
  for (const d of allDeducLines) {
    if (d.amount > 0) {
      slices.push({ name: d.name, value: d.amount, color: DIST_COLORS[colorIdx] })
      colorIdx++
    }
  }

  // Net = gross - all deductions
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0)
  const netPaycheck = grossSemiMonthly - totalDeductions

  // Allocation accounts
  for (const alloc of allocations) {
    const account = accounts.find(a => a.id === alloc.accountId)
    const amount = netPaycheck * alloc.percentage
    if (amount > 0) {
      slices.push({
        name: account?.name ?? alloc.accountId,
        value: amount,
        color: DIST_COLORS[Math.min(colorIdx, DIST_COLORS.length - 1)],
      })
      colorIdx++
    }
  }

  return slices
}

function GrossDistPieChart({
  comp,
  deductions,
  allocations,
  accounts,
}: {
  comp: CompBreakdown
  deductions: PaycheckDeduction[]
  allocations: PaycheckAllocation[]
  accounts: AppData['accounts']
}) {
  const slices = buildDistSlices(comp, deductions, allocations, accounts)
  const grossSemiMonthly = comp.annualSalary / 24

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gross Paycheck Distribution — Pie</CardTitle>
        <p className="text-xs text-text-muted mt-1">Per semi-monthly paycheck</p>
      </CardHeader>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: any, name: any) => [
              `${formatCurrency(value as number)} (${formatPercent((value as number) / grossSemiMonthly)})`,
              name,
            ]}
          />
          <Legend
            formatter={(value: any) => (
              <span style={{ color: '#9ca3af', fontSize: '11px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  )
}

function GrossDistBarChart({
  comp,
  deductions,
  allocations,
  accounts,
}: {
  comp: CompBreakdown
  deductions: PaycheckDeduction[]
  allocations: PaycheckAllocation[]
  accounts: AppData['accounts']
}) {
  const slices = buildDistSlices(comp, deductions, allocations, accounts)
  const chartData = slices.map(s => ({ name: s.name, Amount: s.value, color: s.color }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gross Paycheck Distribution — Bar</CardTitle>
        <p className="text-xs text-text-muted mt-1">Per semi-monthly paycheck</p>
      </CardHeader>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 24, bottom: 0, left: 110 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v: any) => formatCurrency(v as number)}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#2a2a3a' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={106}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: any) => [formatCurrency(value as number), 'Amount']}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="Amount" radius={[0, 4, 4, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

// ── Section 1: Total Comp Breakdown ──────────────────────────────────────────

function CompSection({
  comp,
  onChange,
}: {
  comp: CompBreakdown
  onChange: (c: CompBreakdown) => void
}) {
  const rows = computePayRows(comp)
  const isTotal = (label: string) => label === 'TOTAL'
  const isBonus = (label: string) => label === 'Bonus' || label === 'LTI (Pre-Tax)'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Comp Breakdown</CardTitle>
      </CardHeader>

      {/* Editable inputs */}
      <div className="mb-6">
        <EditableInput
          label="Annual Salary"
          value={comp.annualSalary}
          onChange={v => onChange({ ...comp, annualSalary: v })}
        />
        <EditableInput
          label="Bonus"
          value={comp.bonus}
          onChange={v => onChange({ ...comp, bonus: v })}
        />
        <EditableInput
          label="LTI (Pre-Taxed)"
          value={comp.ltiPreTax}
          onChange={v => onChange({ ...comp, ltiPreTax: v })}
        />
        <EditableInput
          label="Tax Rate"
          value={comp.taxRate}
          format="percent"
          onChange={v => onChange({ ...comp, taxRate: v })}
        />
      </div>

      {/* Pay period table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Period</th>
              <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Gross</th>
              <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Tax</th>
              <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const total = isTotal(row.label)
              const special = isBonus(row.label)
              return (
                <tr
                  key={i}
                  className={`border-b border-border-light transition-colors hover:bg-surface-hover ${
                    total ? 'bg-accent/5 font-semibold' : ''
                  } ${special ? 'opacity-80' : ''}`}
                >
                  <td className={`py-2.5 px-3 ${total ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}>
                    {row.label}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-text-primary">{formatCurrency(row.gross)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-red">{row.taxed > 0 ? formatCurrency(row.taxed) : '—'}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-green font-medium">{formatCurrency(row.net)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ── Section 2: Taxes & Deductions ─────────────────────────────────────────────

function DeductionsSection({
  deductions,
  comp,
  onChange,
}: {
  deductions: PaycheckDeduction[]
  comp: CompBreakdown
  onChange: (d: PaycheckDeduction[]) => void
}) {
  const taxes = deductions.filter(d => d.type === 'tax')
  const pretax = deductions.filter(d => d.type === 'pretax')

  // Gross semi-monthly for percentage reference
  const grossSemiMonthly = comp.annualSalary / 24

  const taxTotal = taxes.reduce((s, d) => s + d.amount, 0)
  const pretaxTotal = pretax.reduce((s, d) => s + d.amount, 0)

  function handleAmountChange(name: string, amount: number) {
    onChange(deductions.map(d => d.name === name ? { ...d, amount } : d))
  }

  function DeductionGroup({
    items,
    title,
    total,
  }: {
    items: PaycheckDeduction[]
    title: string
    total: number
  }) {
    return (
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{title}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 px-2 text-left text-xs text-text-muted">Item</th>
              <th className="py-2 px-2 text-right text-xs text-text-muted">Amount</th>
              <th className="py-2 px-2 text-right text-xs text-text-muted">%</th>
            </tr>
          </thead>
          <tbody>
            {items.map(d => {
              const pct = grossSemiMonthly > 0 ? d.amount / grossSemiMonthly : 0
              return (
                <DeductionRow
                  key={d.name}
                  item={d}
                  pct={pct}
                  onAmountChange={v => handleAmountChange(d.name, v)}
                />
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-accent/5">
              <td className="py-2.5 px-2 text-xs font-semibold text-text-secondary uppercase">Total</td>
              <td className="py-2.5 px-2 text-right tabular-nums text-sm font-semibold text-text-primary">{formatCurrency(total)}</td>
              <td className="py-2.5 px-2 text-right tabular-nums text-xs text-text-muted">
                {grossSemiMonthly > 0 ? formatPercent(total / grossSemiMonthly) : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxes &amp; Deductions</CardTitle>
        <p className="text-xs text-text-muted mt-1">Per paycheck (semi-monthly). Gross: {formatCurrency(grossSemiMonthly)}</p>
      </CardHeader>
      <div className="flex gap-6 flex-wrap">
        <DeductionGroup items={taxes} title="Taxes" total={taxTotal} />
        <div className="w-px bg-border hidden sm:block" />
        <DeductionGroup items={pretax} title="Pre-Tax Deductions" total={pretaxTotal} />
      </div>
    </Card>
  )
}

function DeductionRow({
  item,
  pct,
  onAmountChange,
}: {
  item: PaycheckDeduction
  pct: number
  onAmountChange: (v: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  return (
    <tr className="border-b border-border-light hover:bg-surface-hover transition-colors">
      <td className="py-2 px-2 text-text-secondary">{item.name}</td>
      <td className="py-2 px-2 text-right tabular-nums">
        {editing ? (
          <input
            autoFocus
            type="number"
            step="0.01"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onBlur={() => {
              const parsed = parseFloat(raw)
              if (!isNaN(parsed)) onAmountChange(parsed)
              setEditing(false)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-24 bg-surface border border-accent rounded px-2 py-0.5 text-sm text-green text-right focus:outline-none"
          />
        ) : (
          <button
            onClick={() => { setRaw(String(item.amount)); setEditing(true) }}
            className="text-green tabular-nums text-sm hover:text-accent transition-colors cursor-pointer bg-transparent border-none"
          >
            {formatCurrency(item.amount)}
          </button>
        )}
      </td>
      <td className="py-2 px-2 text-right tabular-nums text-xs text-text-muted">{formatPercent(pct)}</td>
    </tr>
  )
}

// ── Section 3: Paycheck Allocation ────────────────────────────────────────────

function AllocationSection({
  allocations,
  data,
  onChange,
}: {
  allocations: PaycheckAllocation[]
  data: AppData
  onChange: (a: PaycheckAllocation[]) => void
}) {
  const grossSemiMonthly = data.comp.annualSalary / 24
  const totalDeductions = data.deductions.reduce((s, d) => s + d.amount, 0)
  const netPaycheck = grossSemiMonthly - totalDeductions

  const totalAllocated = allocations.reduce((s, a) => s + a.percentage, 0)
  const balance = 1 - totalAllocated

  function handlePercentChange(accountId: string, pct: number) {
    onChange(allocations.map(a => a.accountId === accountId ? { ...a, percentage: pct } : a))
  }

  const adjustabilityColor = (adj: PaycheckAllocation['adjustability']) => {
    if (adj === 'flexible') return 'text-green'
    if (adj === 'variable') return 'text-blue'
    return 'text-text-muted'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paycheck Breakdown</CardTitle>
        <p className="text-xs text-text-muted mt-1">
          Net paycheck: <span className="text-green font-medium">{formatCurrency(netPaycheck)}</span>
          &nbsp;—&nbsp;How it splits across accounts
        </p>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Account</th>
              <th className="py-2.5 px-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider">Adjustability</th>
              <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">%</th>
              <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map(alloc => {
              const account = data.accounts.find(a => a.id === alloc.accountId)
              const amount = netPaycheck * alloc.percentage
              return (
                <AllocationRow
                  key={alloc.accountId}
                  accountName={account?.name ?? alloc.accountId}
                  adjustability={alloc.adjustability}
                  percentage={alloc.percentage}
                  amount={amount}
                  adjustabilityColor={adjustabilityColor(alloc.adjustability)}
                  onPercentChange={pct => handlePercentChange(alloc.accountId, pct)}
                />
              )
            })}
          </tbody>
          <tfoot>
            <tr className={`border-t-2 ${Math.abs(balance) < 0.001 ? 'border-green/40 bg-green/5' : 'border-amber/40 bg-amber/5'}`}>
              <td className="py-2.5 px-3 font-semibold text-text-primary" colSpan={2}>BALANCE</td>
              <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                <span className={Math.abs(balance) < 0.001 ? 'text-green' : 'text-amber'}>
                  {formatPercent(balance)}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                <span className={Math.abs(balance) < 0.001 ? 'text-green' : 'text-amber'}>
                  {formatCurrency(netPaycheck * balance)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {Math.abs(balance) >= 0.001 && (
        <p className="text-xs text-amber mt-3">
          Allocations {balance > 0 ? 'under' : 'over'} by {formatPercent(Math.abs(balance))} ({formatCurrency(Math.abs(netPaycheck * balance))}). Adjust percentages to reach 100%.
        </p>
      )}
    </Card>
  )
}

function AllocationRow({
  accountName,
  adjustability,
  percentage,
  amount,
  adjustabilityColor,
  onPercentChange,
}: {
  accountName: string
  adjustability: PaycheckAllocation['adjustability']
  percentage: number
  amount: number
  adjustabilityColor: string
  onPercentChange: (pct: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  return (
    <tr className="border-b border-border-light hover:bg-surface-hover transition-colors">
      <td className="py-2.5 px-3 text-text-primary">{accountName}</td>
      <td className={`py-2.5 px-3 text-center text-xs font-medium capitalize ${adjustabilityColor}`}>
        {adjustability}
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums">
        {editing ? (
          <input
            autoFocus
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onBlur={() => {
              const parsed = parseFloat(raw)
              if (!isNaN(parsed)) onPercentChange(parsed / 100)
              setEditing(false)
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="w-20 bg-surface border border-accent rounded px-2 py-0.5 text-sm text-green text-right focus:outline-none"
          />
        ) : (
          <button
            onClick={() => { setRaw((percentage * 100).toFixed(1)); setEditing(true) }}
            className="text-green tabular-nums text-sm hover:text-accent transition-colors cursor-pointer bg-transparent border-none"
          >
            {formatPercent(percentage)}
          </button>
        )}
      </td>
      <td className="py-2.5 px-3 text-right tabular-nums text-text-primary">{formatCurrency(amount)}</td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function IncomePage({ data, updateComp, updateDeductions, updateAllocations }: IncomePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon="💰"
        title="Income"
        subtitle="How much you get paid, where the money goes"
      />

      {/* ── Section 1: Comp Breakdown table ── */}
      <CompSection comp={data.comp} onChange={updateComp} />

      {/* ── Charts: Total Comp Package + Gross Pay by Period ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompPackagePieChart comp={data.comp} />
        <GrossPayBarChart comp={data.comp} />
      </div>

      {/* ── Section 2: Taxes & Deductions ── */}
      <DeductionsSection
        deductions={data.deductions}
        comp={data.comp}
        onChange={updateDeductions}
      />

      {/* ── Section 3: Paycheck Allocation table ── */}
      <AllocationSection
        allocations={data.allocations}
        data={data}
        onChange={updateAllocations}
      />

      {/* ── Charts: Gross Paycheck Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GrossDistPieChart
          comp={data.comp}
          deductions={data.deductions}
          allocations={data.allocations}
          accounts={data.accounts}
        />
        <GrossDistBarChart
          comp={data.comp}
          deductions={data.deductions}
          allocations={data.allocations}
          accounts={data.accounts}
        />
      </div>
    </div>
  )
}
