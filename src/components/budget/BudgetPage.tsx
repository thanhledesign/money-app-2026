import { useState } from 'react'
import type { AppData, BudgetItem } from '@/data/types'
import { NumberInput } from '@/components/ui/NumberInput'
import {
  formatCurrency,
  getSavingsRate,
  getMonthlyBurnRate,
  getRunwayMonths,
  getLatestSnapshot,
  getTotalCash,
} from '@/lib/calculations'
import { Card, CardHeader, CardTitle, KPICard } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Trash2, Plus } from 'lucide-react'

// ── Per-row input mode tracking ───────────────────────────────────────────────
type InputMode = '$' | '%'

interface BudgetPageProps {
  data: AppData
  updateBudgetItems: (items: BudgetItem[]) => void
}

// ── Tier config ───────────────────────────────────────────────────────────────

type Tier = BudgetItem['tier']

const TIER_CONFIG: Record<Tier, { label: string; desc: string; accent: string; bg: string; badge: string }> = {
  fixed:    { label: '🏠 Fixed — Survival',      desc: 'Non-negotiable monthly obligations',   accent: 'text-red',    bg: 'bg-red/5',    badge: 'bg-red/10 text-red' },
  variable: { label: '🛒 Variable — Lifestyle',  desc: 'Recurring expenses that flex a bit',    accent: 'text-amber',  bg: 'bg-amber/5',  badge: 'bg-amber/10 text-amber' },
  wealth:   { label: '💎 Wealth Building',       desc: 'Savings and investment contributions',  accent: 'text-green',  bg: 'bg-green/5',  badge: 'bg-green/10 text-green' },
  optional: { label: '✨ Optional — Luxury',     desc: 'Nice-to-haves and one-time expenses',  accent: 'text-purple', bg: 'bg-purple/5', badge: 'bg-purple/10 text-purple' },
}

const TIER_ORDER: Tier[] = ['fixed', 'variable', 'wealth', 'optional']

const EMERGENCY_FUND_TARGET = 50_000

// ── Budget group card (editable) ──────────────────────────────────────────────

interface BudgetGroupProps {
  tier: Tier
  items: BudgetItem[]
  allItems: BudgetItem[]
  monthlyNetPay: number
  onUpdate: (items: BudgetItem[]) => void
}

function BudgetGroup({ tier, items, allItems, monthlyNetPay, onUpdate }: BudgetGroupProps) {
  const cfg = TIER_CONFIG[tier]
  const subtotal = items.reduce((s, i) => s + i.amount, 0)

  // Track per-item input mode ($/%): keyed by item id
  const [inputModes, setInputModes] = useState<Record<string, InputMode>>({})

  function getMode(id: string): InputMode {
    return inputModes[id] ?? '$'
  }

  function toggleMode(id: string) {
    setInputModes(prev => ({ ...prev, [id]: prev[id] === '%' ? '$' : '%' }))
  }

  function handleNameChange(id: string, name: string) {
    const updated = allItems.map(i => i.id === id ? { ...i, name } : i)
    onUpdate(updated)
  }

  function handleCategoryChange(id: string, category: string) {
    const updated = allItems.map(i => i.id === id ? { ...i, category } : i)
    onUpdate(updated)
  }

  function handleAmountChange(id: string, amount: number) {
    const updated = allItems.map(i => i.id === id ? { ...i, amount } : i)
    onUpdate(updated)
  }

  function handlePercentageAmountChange(id: string, pct: number) {
    // pct is 0–100; compute dollar amount
    const amount = (pct / 100) * monthlyNetPay
    handleAmountChange(id, amount)
  }

  function handleDelete(id: string) {
    const updated = allItems.filter(i => i.id !== id)
    onUpdate(updated)
    // clean up mode state
    setInputModes(prev => { const n = { ...prev }; delete n[id]; return n })
  }

  function handleAdd() {
    const newItem: BudgetItem = {
      id: `b-${Date.now()}`,
      name: '',
      amount: 0,
      tier,
      category: 'Uncategorized',
    }
    onUpdate([...allItems, newItem])
  }

  return (
    <Card className={cfg.bg}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className={cfg.accent}>{cfg.label}</CardTitle>
            <p className="text-xs text-text-muted mt-0.5">{cfg.desc}</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.badge}`}>
            {formatCurrency(subtotal)}
          </span>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Name</th>
              <th className="py-2.5 px-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Category</th>
              <th className="py-2.5 px-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Monthly</th>
              <th className="py-2.5 px-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const mode = getMode(item.id)
              const pctValue = monthlyNetPay > 0 ? (item.amount / monthlyNetPay) * 100 : 0
              const computedDollar = (pctValue / 100) * monthlyNetPay
              return (
                <tr key={item.id} className="border-b border-border-light hover:bg-surface-hover transition-colors">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleNameChange(item.id, e.target.value)}
                      placeholder="Item name"
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.category}
                      onChange={e => handleCategoryChange(item.id, e.target.value)}
                      placeholder="Category"
                      className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {mode === '$' ? (
                        <NumberInput
                          value={item.amount}
                          onChange={(v) => handleAmountChange(item.id, v)}
                          isCurrency={true}
                          label={item.name}
                          className="w-24"
                        />
                      ) : (
                        <div className="flex flex-col items-end gap-0.5">
                          <NumberInput
                            value={pctValue}
                            onChange={(v) => handlePercentageAmountChange(item.id, v)}
                            isPercent={true}
                            min={0}
                            max={100}
                            label={item.name}
                            className="w-24"
                          />
                          <span className="text-xs text-text-muted tabular-nums">
                            {formatCurrency(computedDollar)}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => toggleMode(item.id)}
                        title={mode === '$' ? 'Switch to % of net pay' : 'Switch to dollar amount'}
                        className="px-1.5 py-0.5 rounded text-xs font-medium border border-border text-text-muted hover:text-text-secondary hover:border-accent transition-colors"
                      >
                        {mode === '$' ? '%' : '$'}
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded text-text-muted hover:text-red hover:bg-red/10 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={4} className="py-2 px-3">
                <button
                  onClick={handleAdd}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded hover:bg-surface-hover transition-colors ${cfg.accent}`}
                >
                  <Plus size={13} />
                  Add Item
                </button>
              </td>
            </tr>
            <tr className="border-t border-border bg-accent/5">
              <td className="py-2.5 px-3 text-xs font-semibold text-text-secondary uppercase" colSpan={2}>Subtotal</td>
              <td className={`py-2.5 px-3 text-right tabular-nums font-semibold ${cfg.accent}`}>
                {formatCurrency(subtotal)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}

// ── Summary helpers ───────────────────────────────────────────────────────────

function computeSummary(items: BudgetItem[]) {
  const totalMonthly = items.reduce((s, i) => s + i.amount, 0)

  const needs = items
    .filter(i => i.tier === 'fixed')
    .reduce((s, i) => s + i.amount, 0)

  const wants = items
    .filter(i => i.tier === 'variable' || i.tier === 'optional')
    .reduce((s, i) => s + i.amount, 0)

  const savings = items
    .filter(i => i.tier === 'wealth')
    .reduce((s, i) => s + i.amount, 0)

  const pct = (n: number) =>
    totalMonthly > 0 ? `${((n / totalMonthly) * 100).toFixed(1)}%` : '0%'

  return { totalMonthly, needs, wants, savings, pct }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function BudgetPage({ data, updateBudgetItems }: BudgetPageProps) {
  const [localItems, setLocalItems] = useState<BudgetItem[]>(data.budgetItems)

  function handleUpdate(items: BudgetItem[]) {
    setLocalItems(items)
    updateBudgetItems(items)
  }

  const { totalMonthly, needs, wants, savings, pct } = computeSummary(localItems)

  // Monthly net pay from comp data
  const grossSemiMonthly = data.comp.annualSalary / 24
  const totalDeductions = data.deductions.reduce((s, d) => s + d.amount, 0)
  const monthlyNetPay = (grossSemiMonthly - totalDeductions) * 2

  // Actionable insight metrics
  const savingsRate = getSavingsRate(data)
  const burnRate = getMonthlyBurnRate(data)
  const runwayMonths = getRunwayMonths(data)
  const latestSnapshot = getLatestSnapshot(data)
  const cashBalance = latestSnapshot ? getTotalCash(latestSnapshot, data) : 0
  const emergencyPct = Math.min((cashBalance / EMERGENCY_FUND_TARGET) * 100, 100)
  const savingsRateLow = savingsRate < 30

  // Group by tier
  const grouped = TIER_ORDER.reduce<Record<Tier, BudgetItem[]>>((acc, tier) => {
    acc[tier] = localItems.filter(i => i.tier === tier)
    return acc
  }, { fixed: [], variable: [], wealth: [], optional: [] })

  return (
    <div className="space-y-6">
      <PageHeader
        icon="⚖️"
        title="Budget"
        titleKey="budget"
        subtitle="Track spending, savings, and investment allocation"
        rightContent={<div className="text-right"><p className="text-xs text-text-muted">Monthly Cost of Living</p><p className="text-lg font-semibold text-amber tabular-nums">{formatCurrency(burnRate)}</p></div>}
      />

      {/* ── Actionable Insights ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Monthly" value={formatCurrency(burnRate)} emoji="💸" />
        <KPICard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} emoji="📊"
          subValue={savingsRateLow ? 'Below 30% target' : 'On track'} />
        <KPICard label="Runway" value={`${runwayMonths.toFixed(1)} mo`} emoji="⏳"
          subValue="at current burn rate" />
        <KPICard label="Emergency Fund" value={formatCurrency(cashBalance)} emoji="🛡️"
          subValue={`${emergencyPct.toFixed(0)}% of $50K target`} />
      </div>

      {/* Emergency fund progress bar */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-text-primary">Emergency Fund Progress</p>
            <p className="text-xs text-text-muted mt-0.5">
              {formatCurrency(cashBalance)} of {formatCurrency(EMERGENCY_FUND_TARGET)} target
            </p>
          </div>
          <span className={`text-sm font-semibold tabular-nums ${emergencyPct >= 100 ? 'text-green' : emergencyPct >= 60 ? 'text-amber' : 'text-red'}`}>
            {emergencyPct.toFixed(0)}%
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden bg-border">
          <div
            className={`h-full rounded-full transition-all ${emergencyPct >= 100 ? 'bg-green' : emergencyPct >= 60 ? 'bg-amber' : 'bg-red'}`}
            style={{ width: `${emergencyPct}%` }}
          />
        </div>
        {savingsRateLow && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber/10 border border-amber/20 px-3 py-2.5">
            <span className="text-amber text-base leading-none mt-0.5">⚠</span>
            <p className="text-xs text-amber">
              <span className="font-semibold">Savings rate is {savingsRate.toFixed(1)}%</span> — below the 30% recommended threshold.
              Consider reducing Variable or Optional spending to boost wealth-building contributions.
            </p>
          </div>
        )}
      </Card>

      {/* ── Budget Tiers (editable) ── */}
      {TIER_ORDER.map(tier => (
        <BudgetGroup
          key={tier}
          tier={tier}
          items={grouped[tier]}
          allItems={localItems}
          monthlyNetPay={monthlyNetPay}
          onUpdate={handleUpdate}
        />
      ))}

      {/* ── Grand Total ── */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Grand Total</p>
            <p className="text-xs text-text-muted">All budget categories combined</p>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-text-primary">
            {formatCurrency(totalMonthly)}
          </p>
        </div>

        {/* Visual breakdown bar */}
        <div className="mt-4 h-2.5 rounded-full overflow-hidden flex bg-border">
          {totalMonthly > 0 && (
            <>
              <div
                className="h-full bg-red transition-all"
                style={{ width: `${(needs / totalMonthly) * 100}%` }}
                title={`Needs: ${formatCurrency(needs)}`}
              />
              <div
                className="h-full bg-amber transition-all"
                style={{ width: `${(wants / totalMonthly) * 100}%` }}
                title={`Wants: ${formatCurrency(wants)}`}
              />
              <div
                className="h-full bg-green transition-all"
                style={{ width: `${(savings / totalMonthly) * 100}%` }}
                title={`Savings: ${formatCurrency(savings)}`}
              />
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-2.5 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red" />
            Needs {pct(needs)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber" />
            Wants {pct(wants)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green" />
            Savings {pct(savings)}
          </span>
        </div>
      </Card>
    </div>
  )
}
