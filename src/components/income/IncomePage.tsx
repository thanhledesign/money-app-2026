import { useState } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import type { AppData, CompBreakdown, PaycheckDeduction, PaycheckAllocation } from '@/data/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { ScrollableTable } from '@/components/ui/ScrollableTable'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { UVPBadge } from '@/components/ui/UVPBadge'
import { NumberInput } from '@/components/ui/NumberInput'
import { Plus, Trash2, ChevronDown } from 'lucide-react'

interface IncomePageProps {
  data: AppData
  updateComp: (comp: CompBreakdown) => void
  updateDeductions: (d: PaycheckDeduction[]) => void
  updateAllocations: (a: PaycheckAllocation[]) => void
}

// ── Shared chart style ────────────────────────────────────────────────────────

import { CHART_TOOLTIP, TOOLTIP_CONTENT_STYLE, AXIS_TICK, LEGEND_TEXT_STYLE } from '@/components/ui/chartConstants'

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
// (replaced by NumberInput — local wrapper kept for layout only)

interface EditableInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  format?: 'currency' | 'percent'
}

function EditableInput({ label, value, onChange, format = 'currency' }: EditableInputProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-light">
      <span className="text-sm text-text-secondary">{label}</span>
      <NumberInput
        value={value}
        onChange={onChange}
        label={label}
        isCurrency={format === 'currency'}
        isPercent={format === 'percent'}
        className="w-36"
      />
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
            label={false}
            labelLine={false}
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} stroke={s.color + '60'} strokeWidth={1.5} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
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

// ── Chart 2: Gross/Net Pay 2026 Horizontal Bar ───────────────────────────────

function GrossPayBarChart({ comp }: { comp: CompBreakdown }) {
  const [view, setView] = useState<'gross' | 'net'>('gross')
  const rows = computePayRows(comp)
  // Exclude the TOTAL row from the bar chart; show everything else
  const chartData = rows
    .filter(r => r.label !== 'TOTAL' && r.label !== 'LTI (Pre-Tax)')
    .concat(rows.filter(r => r.label === 'LTI (Pre-Tax)').map(r => ({ ...r, label: 'LTI' })))
    .map(r => ({ name: r.label, Pay: view === 'gross' ? r.gross : r.net }))

  const barColor = view === 'gross' ? '#22c55e' : '#3b82f6'
  const label = view === 'gross' ? 'Gross' : 'Net'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{label} Pay — 2026</CardTitle>
          <div className="flex rounded-lg overflow-hidden border border-border text-xs">
            <button
              onClick={() => setView('gross')}
              className={`px-3 py-1 transition-colors ${
                view === 'gross'
                  ? 'bg-green/20 text-green font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Gross
            </button>
            <button
              onClick={() => setView('net')}
              className={`px-3 py-1 transition-colors border-l border-border ${
                view === 'net'
                  ? 'bg-blue/20 text-blue font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              Net
            </button>
          </div>
        </div>
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
            tick={AXIS_TICK}
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
            contentStyle={TOOLTIP_CONTENT_STYLE}
            formatter={(value: any) => [formatCurrency(value as number), label]}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="Pay" fill={barColor} radius={[0, 4, 4, 0]} />
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
              <Cell key={i} fill={s.color} stroke={s.color + '60'} strokeWidth={1.5} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
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
            tick={AXIS_TICK}
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
            contentStyle={TOOLTIP_CONTENT_STYLE}
            formatter={(value: any) => [formatCurrency(value as number), 'Amount']}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="Amount" radius={[0, 4, 4, 0]}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} stroke={d.color + '60'} strokeWidth={1.5} />
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
        <div className="flex items-center gap-2 flex-wrap">
          <CardTitle>Total Comp Breakdown</CardTitle>
          <UVPBadge label="Unique" description="Full total compensation modeling including RSUs, bonus, and LTI. YNAB and Monarch don't do this." />
        </div>
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
      <ScrollableTable>
        <table className="w-full text-sm" style={{ minWidth: '480px' }}>
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
      </ScrollableTable>
    </Card>
  )
}

// ── Section 2: Taxes & Deductions ─────────────────────────────────────────────

function DeductionRow({
  item,
  grossSemiMonthly,
  onAmountChange,
  onPercentChange,
  onDelete,
}: {
  item: PaycheckDeduction
  grossSemiMonthly: number
  onAmountChange: (v: number) => void
  onPercentChange: (v: number) => void
  onDelete: () => void
}) {
  const pct = grossSemiMonthly > 0 ? item.amount / grossSemiMonthly : 0
  return (
    <tr className="border-b border-border-light hover:bg-surface-hover transition-colors">
      <td className="py-2 px-2 text-text-secondary text-xs sm:text-sm">{item.name}</td>
      <td className="py-2 px-2 text-right tabular-nums">
        <NumberInput
          value={item.amount}
          onChange={onAmountChange}
          label={item.name}
          isCurrency={true}
          className="w-20 sm:w-28"
        />
      </td>
      <td className="py-2 px-2 text-right tabular-nums hidden sm:table-cell">
        <NumberInput
          value={pct * 100}
          onChange={v => onPercentChange(v / 100)}
          label={`${item.name} %`}
          isPercent={true}
          min={0}
          max={100}
          className="w-20"
        />
      </td>
      <td className="py-2 px-2">
        <button
          onClick={onDelete}
          className="p-1 rounded text-text-muted hover:text-red hover:bg-red/10 transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

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

  const grossSemiMonthly = comp.annualSalary / 24

  const taxTotal = taxes.reduce((s, d) => s + d.amount, 0)
  const pretaxTotal = pretax.reduce((s, d) => s + d.amount, 0)

  function handleAmountChange(name: string, amount: number) {
    onChange(deductions.map(d => d.name === name ? { ...d, amount } : d))
  }

  function handlePercentChange(name: string, pct: number) {
    const newAmount = pct * grossSemiMonthly
    onChange(deductions.map(d => d.name === name ? { ...d, amount: newAmount } : d))
  }

  function handleDelete(name: string) {
    onChange(deductions.filter(d => d.name !== name))
  }

  function handleAddItem(type: 'tax' | 'pretax') {
    const newItem: PaycheckDeduction = {
      name: 'New Item',
      amount: 0,
      type,
      isFixed: false,
    }
    onChange([...deductions, newItem])
  }

  function DeductionGroup({
    items,
    title,
    total,
    groupType,
  }: {
    items: PaycheckDeduction[]
    title: string
    total: number
    groupType: 'tax' | 'pretax'
  }) {
    return (
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{title}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 px-2 text-left text-xs text-text-muted">Item</th>
              <th className="py-2 px-2 text-right text-xs text-text-muted">Amount</th>
              <th className="py-2 px-2 text-right text-xs text-text-muted hidden sm:table-cell">%</th>
              <th className="py-2 px-2 w-6" />
            </tr>
          </thead>
          <tbody>
            {items.map(d => (
              <DeductionRow
                key={d.name}
                item={d}
                grossSemiMonthly={grossSemiMonthly}
                onAmountChange={v => handleAmountChange(d.name, v)}
                onPercentChange={v => handlePercentChange(d.name, v)}
                onDelete={() => handleDelete(d.name)}
              />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="py-2 px-2">
                <button
                  onClick={() => handleAddItem(groupType)}
                  className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-text-secondary"
                >
                  <Plus size={12} />
                  Add Item
                </button>
              </td>
            </tr>
            <tr className="border-t border-border bg-accent/5">
              <td className="py-2.5 px-2 text-xs font-semibold text-text-secondary uppercase">Total</td>
              <td className="py-2.5 px-2 text-right tabular-nums text-sm font-semibold text-text-primary">{formatCurrency(total)}</td>
              <td className="py-2.5 px-2 text-right tabular-nums text-xs text-text-muted">
                {grossSemiMonthly > 0 ? formatPercent(total / grossSemiMonthly) : '—'}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  const [collapsed, setCollapsed] = useState(false)
  const totalDeductions = taxTotal + pretaxTotal

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full text-left sm:pointer-events-none"
        >
          <div>
            <CardTitle>Taxes &amp; Deductions</CardTitle>
            <p className="text-xs text-text-muted mt-1">Per paycheck (semi-monthly). Gross: {formatCurrency(grossSemiMonthly)}</p>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-sm font-semibold text-text-primary tabular-nums">{formatCurrency(totalDeductions)}</span>
            <ChevronDown size={16} className={`text-text-muted transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </div>
        </button>
      </CardHeader>
      <div className={`${collapsed ? 'hidden sm:flex' : 'flex'} flex-col sm:flex-row gap-6`}>
        <DeductionGroup items={taxes} title="Taxes" total={taxTotal} groupType="tax" />
        <div className="w-px bg-border hidden sm:block" />
        <DeductionGroup items={pretax} title="Pre-Tax Deductions" total={pretaxTotal} groupType="pretax" />
      </div>
    </Card>
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

  // Compute the variable account's percentage as 1 - sum(all non-variable)
  const variableId = allocations.find(a => a.adjustability === 'variable')?.accountId ?? null
  const nonVariableSum = allocations
    .filter(a => a.accountId !== variableId)
    .reduce((s, a) => s + a.percentage, 0)
  const variablePct = variableId !== null ? Math.max(0, 1 - nonVariableSum) : 0

  const effectiveAllocations = allocations.map(a =>
    a.accountId === variableId ? { ...a, percentage: variablePct } : a
  )

  const totalAllocated = effectiveAllocations.reduce((s, a) => s + a.percentage, 0)
  const balance = 1 - totalAllocated

  function handlePercentChange(accountId: string, pct: number) {
    // Don't allow editing a variable account's percentage directly
    if (accountId === variableId) return
    onChange(allocations.map(a => a.accountId === accountId ? { ...a, percentage: pct } : a))
  }

  function handleAdjustabilityChange(accountId: string, adj: PaycheckAllocation['adjustability']) {
    let updated = allocations.map(a => a.accountId === accountId ? { ...a, adjustability: adj } : a)
    if (adj === 'variable') {
      // Only one variable at a time — switch any other variable back to flexible
      updated = updated.map(a => a.accountId !== accountId && a.adjustability === 'variable'
        ? { ...a, adjustability: 'flexible' }
        : a
      )
    }
    onChange(updated)
  }

  const [collapsed, setCollapsed] = useState(false)

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-between w-full text-left sm:pointer-events-none"
        >
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle>Paycheck Breakdown</CardTitle>
              <UVPBadge label="Exclusive" description="Paycheck allocation tool — split your net pay across accounts before it arrives. No other finance app does this." />
            </div>
            <p className="text-xs text-text-muted mt-1">
              Net paycheck: <span className="text-green font-medium">{formatCurrency(netPaycheck)}</span>
              &nbsp;—&nbsp;How it splits across accounts
            </p>
          </div>
          <ChevronDown size={16} className={`text-text-muted transition-transform sm:hidden shrink-0 ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </CardHeader>

      <div className={collapsed ? 'hidden sm:block' : ''}>
      <ScrollableTable>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2.5 px-2 sm:px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Account</th>
              <th className="py-2.5 px-3 text-center text-xs font-medium text-text-muted uppercase tracking-wider hidden sm:table-cell">Adjustability</th>
              <th className="py-2.5 px-1 sm:px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">%</th>
              <th className="py-2.5 px-1 sm:px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {effectiveAllocations.map(alloc => {
              const account = data.accounts.find(a => a.id === alloc.accountId)
              const amount = netPaycheck * alloc.percentage
              const isVariable = alloc.adjustability === 'variable'
              return (
                <AllocationRow
                  key={alloc.accountId}
                  accountName={account?.name ?? alloc.accountId}
                  adjustability={alloc.adjustability}
                  percentage={alloc.percentage}
                  amount={amount}
                  isVariable={isVariable}
                  onPercentChange={pct => handlePercentChange(alloc.accountId, pct)}
                  onAdjustabilityChange={adj => handleAdjustabilityChange(alloc.accountId, adj)}
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
      </ScrollableTable>

      {Math.abs(balance) >= 0.001 && variableId === null && (
        <p className="text-xs text-amber mt-3">
          Allocations {balance > 0 ? 'under' : 'over'} by {formatPercent(Math.abs(balance))} ({formatCurrency(Math.abs(netPaycheck * balance))}). Adjust percentages or mark one account as variable to auto-fill the remainder.
        </p>
      )}
      </div>
    </Card>
  )
}

function AllocationRow({
  accountName,
  adjustability,
  percentage,
  amount,
  isVariable,
  onPercentChange,
  onAdjustabilityChange,
}: {
  accountName: string
  adjustability: PaycheckAllocation['adjustability']
  percentage: number
  amount: number
  isVariable: boolean
  onPercentChange: (pct: number) => void
  onAdjustabilityChange: (adj: PaycheckAllocation['adjustability']) => void
}) {
  return (
    <tr className="border-b border-border-light hover:bg-surface-hover transition-colors">
      <td className="py-2.5 px-2 sm:px-3 text-text-primary text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{accountName}</td>
      <td className="py-2.5 px-1 sm:px-3 text-center hidden sm:table-cell">
        <select
          value={adjustability}
          onChange={e => onAdjustabilityChange(e.target.value as PaycheckAllocation['adjustability'])}
          className="bg-surface border border-border rounded px-2 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent capitalize"
        >
          <option value="flexible">flexible</option>
          <option value="variable">variable</option>
          <option value="fixed">fixed</option>
        </select>
      </td>
      <td className="py-2.5 px-1 sm:px-3 text-right tabular-nums">
        {isVariable ? (
          <span className="text-blue text-xs font-medium tabular-nums">{formatPercent(percentage)}</span>
        ) : (
          <NumberInput
            value={percentage * 100}
            onChange={v => onPercentChange(v / 100)}
            label={accountName}
            isPercent={true}
            min={0}
            max={100}
            className="w-20 sm:w-28"
          />
        )}
      </td>
      <td className="py-2.5 px-1 sm:px-3 text-right tabular-nums text-text-primary text-xs sm:text-sm">{formatCurrency(amount)}</td>
    </tr>
  )
}

// ── Section 4: Paychecks Frequency ───────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function PaychecksFrequencySection({
  data,
}: {
  data: AppData
}) {
  const grossSemiMonthly = data.comp.annualSalary / 24
  const totalDeductions = data.deductions.reduce((s, d) => s + d.amount, 0)
  const netSemiMonthly = grossSemiMonthly - totalDeductions

  const perMonth = data.paychecksPerMonth.slice(0, 12)
  const total = perMonth.reduce((s, n) => s + n, 0)
  // Net per paycheck based on frequency: paychecksPerMonth total tells us the schedule
  const annualNet = netSemiMonthly * 24
  const netPerCheck = total > 0 ? annualNet / total : 0

  const chartData = perMonth.map((qty, i) => ({
    month: MONTH_LABELS[i],
    Amount: qty * netPerCheck,
    qty,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paychecks Frequency</CardTitle>
        <p className="text-xs text-text-muted mt-1">Number of paychecks in 2026 with amounts</p>
      </CardHeader>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Left: Month / Qty table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Month</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Qty</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Net Total</th>
              </tr>
            </thead>
            <tbody>
              {perMonth.map((qty, i) => (
                <tr key={i} className="border-b border-border-light hover:bg-surface-hover transition-colors">
                  <td className="py-2 px-3 text-text-secondary">{MONTH_LABELS[i]}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-text-primary">{qty}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-green">{formatCurrency(qty * netPerCheck)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-green/40 bg-green/5 font-semibold">
                <td className="py-2.5 px-3 text-text-primary uppercase text-xs">TOTAL</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-text-primary">{total}</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-green">{formatCurrency(annualNet)}</td>
              </tr>
              <tr className="border-t border-border-light">
                <td className="py-2 px-3 text-xs text-text-muted" colSpan={2}>Bonus (annual)</td>
                <td className="py-2 px-3 text-right tabular-nums text-xs text-amber">{formatCurrency(data.comp.bonus * (1 - data.comp.taxRate))}</td>
              </tr>
              <tr className="border-t border-border-light">
                <td className="py-2 px-3 text-xs text-text-muted" colSpan={2}>LTI (annual)</td>
                <td className="py-2 px-3 text-right tabular-nums text-xs text-purple">{formatCurrency(data.comp.ltiPreTax * (1 - data.comp.taxRate))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Right: Bar chart — net amount per month */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
              <XAxis
                dataKey="month"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: any) => `$${((v as number) / 1000).toFixed(0)}K`}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                formatter={(value: any, _name: any, props: any) => [
                  `${formatCurrency(value as number)} (${props.payload.qty} checks)`,
                  'Net',
                ]}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="Amount" fill="#22c55e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function IncomePage({ data, updateComp, updateDeductions, updateAllocations }: IncomePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon="💰"
        title="Income"
        titleKey="income"
        subtitle="How much you get paid, where the money goes"
        rightContent={<div className="text-right"><p className="text-xs text-text-muted">Total Comp Package</p><p className="text-lg font-semibold text-green tabular-nums">{formatCurrency(data.comp.annualSalary + data.comp.bonus + data.comp.ltiPreTax)}</p></div>}
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

      {/* ── Section 4: Paychecks Frequency ── */}
      <PaychecksFrequencySection data={data} />
    </div>
  )
}
