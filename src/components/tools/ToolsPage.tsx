import { useState, useEffect, useRef } from 'react'
import { Card, CardTitle } from '@/components/ui/Card'
import { NumberInput } from '@/components/ui/NumberInput'
import { PageHeader } from '@/components/ui/PageHeader'

function saveDraft(toolName: string, data: unknown) {
  localStorage.setItem(`money-app-tool-draft-${toolName}`, JSON.stringify(data))
}

function loadDraft<T>(toolName: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`money-app-tool-draft-${toolName}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Debt Payoff Calculator ───────────────────────────────────────────────────

interface DebtInputs { balance: number; apr: number; payment: number }
interface DebtResult { months: number; totalInterest: number; payoffDate: string }

function DebtPayoffTool() {
  const [inputs, setInputs] = useState<DebtInputs>(() =>
    loadDraft('debt-payoff', { balance: 5000, apr: 0.20, payment: 200 })
  )
  const [result, setResult] = useState<DebtResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const [autoCalc, setAutoCalc] = useState(false)

  const set = (k: keyof DebtInputs) => (v: number) =>
    setInputs(prev => ({ ...prev, [k]: v }))

  // Auto-calculate when inputs change (after first manual calculate)
  useEffect(() => {
    if (!autoCalc) return
    const { balance, apr, payment } = inputs
    const monthlyRate = apr / 12
    if (payment <= balance * monthlyRate || balance <= 0) return
    const months = Math.ceil(-Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate))
    const totalPaid = payment * months
    const totalInterest = totalPaid - balance
    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)
    setResult({ months, totalInterest, payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })
  }, [inputs, autoCalc])

  function calculate() {
    setAutoCalc(true)
    const { balance, apr, payment } = inputs
    const monthlyRate = apr / 12
    if (payment <= balance * monthlyRate) {
      setResult({ months: Infinity, totalInterest: Infinity, payoffDate: 'Never — increase payment' })
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
      return
    }
    const months = Math.ceil(
      -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
    )
    const totalPaid = payment * months
    const totalInterest = totalPaid - balance
    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)
    setResult({
      months,
      totalInterest,
      payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    })
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  return (
    <Card className="mb-6">
      <CardTitle>🥊 Debt Fighter</CardTitle>
      <p className="text-xs text-text-muted mt-1 mb-4">Enter balance, APR, and monthly payment to see your payoff timeline.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Balance</label>
          <NumberInput value={inputs.balance} onChange={set('balance')} label="Balance" />
          <input type="range" min={0} max={50000} step={500} value={inputs.balance} onChange={e => set('balance')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">APR</label>
          <NumberInput value={inputs.apr} onChange={set('apr')} label="APR" isCurrency={false} isPercent={true} min={0} max={1} />
          <input type="range" min={0} max={0.35} step={0.005} value={inputs.apr} onChange={e => set('apr')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Monthly Payment</label>
          <NumberInput value={inputs.payment} onChange={set('payment')} label="Monthly Payment" />
          <input type="range" min={50} max={2000} step={25} value={inputs.payment} onChange={e => set('payment')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={calculate} className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors">
          Calculate
        </button>
        <button onClick={() => saveDraft('debt-payoff', inputs)} className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors">
          Save Draft
        </button>
        {result && result.months !== Infinity && (
          <button
            onClick={() => downloadCSV('debt-payoff.csv', [
              ['Balance', 'APR', 'Monthly Payment', 'Months', 'Total Interest', 'Payoff Date'],
              [String(inputs.balance), String(inputs.apr), String(inputs.payment),
               String(result.months), result.totalInterest.toFixed(2), result.payoffDate],
            ])}
            className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>
      {result && (
        <div ref={resultRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-background rounded-xl border border-border">
          <div>
            <p className="text-xs text-text-muted">Payoff Date</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{result.payoffDate}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Months to Payoff</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {result.months === Infinity ? '—' : result.months}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Total Interest Paid</p>
            <p className="text-sm font-semibold text-red mt-0.5">
              {result.totalInterest === Infinity ? '—' : `$${result.totalInterest.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Emergency Fund Calculator ────────────────────────────────────────────────

interface EmergencyInputs { monthlyExpenses: number; targetMonths: number; currentSaved: number }
interface EmergencyResult { targetAmount: number; shortfall: number; progressPct: number }

function EmergencyFundTool() {
  const [inputs, setInputs] = useState<EmergencyInputs>(() =>
    loadDraft('emergency-fund', { monthlyExpenses: 3000, targetMonths: 6, currentSaved: 0 })
  )
  const [result, setResult] = useState<EmergencyResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const set = (k: keyof EmergencyInputs) => (v: number) =>
    setInputs(prev => ({ ...prev, [k]: v }))

  function calculate() {
    const targetAmount = inputs.monthlyExpenses * inputs.targetMonths
    const shortfall = Math.max(0, targetAmount - inputs.currentSaved)
    const progressPct = Math.min(100, (inputs.currentSaved / targetAmount) * 100)
    setResult({ targetAmount, shortfall, progressPct })
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  return (
    <Card className="mb-6">
      <CardTitle>🛡️ Safety Net Builder</CardTitle>
      <p className="text-xs text-text-muted mt-1 mb-4">Calculate your target emergency fund and how close you are.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Monthly Expenses</label>
          <NumberInput value={inputs.monthlyExpenses} onChange={set('monthlyExpenses')} label="Monthly Expenses" />
          <input type="range" min={500} max={15000} step={100} value={inputs.monthlyExpenses} onChange={e => set('monthlyExpenses')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Target Months</label>
          <NumberInput value={inputs.targetMonths} onChange={set('targetMonths')} label="Target Months" isCurrency={false} min={1} max={24} />
          <input type="range" min={1} max={24} step={1} value={inputs.targetMonths} onChange={e => set('targetMonths')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Currently Saved</label>
          <NumberInput value={inputs.currentSaved} onChange={set('currentSaved')} label="Currently Saved" />
          <input type="range" min={0} max={100000} step={500} value={inputs.currentSaved} onChange={e => set('currentSaved')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={calculate} className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors">
          Calculate
        </button>
        <button onClick={() => saveDraft('emergency-fund', inputs)} className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors">
          Save Draft
        </button>
        {result && (
          <button
            onClick={() => downloadCSV('emergency-fund.csv', [
              ['Monthly Expenses', 'Target Months', 'Currently Saved', 'Target Amount', 'Shortfall', 'Progress %'],
              [String(inputs.monthlyExpenses), String(inputs.targetMonths), String(inputs.currentSaved),
               result.targetAmount.toFixed(2), result.shortfall.toFixed(2), result.progressPct.toFixed(1)],
            ])}
            className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>
      {result && (
        <div ref={resultRef} className="space-y-3 p-4 bg-background rounded-xl border border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-text-muted">Target Amount</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5">${result.targetAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Shortfall</p>
              <p className="text-sm font-semibold text-red mt-0.5">${result.shortfall.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Progress</p>
              <p className="text-sm font-semibold text-green mt-0.5">{result.progressPct.toFixed(1)}%</p>
            </div>
          </div>
          <div className="w-full bg-surface rounded-full h-2">
            <div
              className="bg-green h-2 rounded-full transition-all"
              style={{ width: `${result.progressPct}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Paycheck Estimator ───────────────────────────────────────────────────────

interface PaycheckInputs { grossSalary: number; taxRate: number }
interface PaycheckResult { netAnnual: number; netMonthly: number; netSemiMonthly: number; netBiweekly: number }

function PaycheckEstimatorTool() {
  const [inputs, setInputs] = useState<PaycheckInputs>(() =>
    loadDraft('paycheck-estimator', { grossSalary: 100000, taxRate: 0.28 })
  )
  const [result, setResult] = useState<PaycheckResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const set = (k: keyof PaycheckInputs) => (v: number) =>
    setInputs(prev => ({ ...prev, [k]: v }))

  function calculate() {
    const netAnnual = inputs.grossSalary * (1 - inputs.taxRate)
    setResult({
      netAnnual,
      netMonthly: netAnnual / 12,
      netSemiMonthly: netAnnual / 24,
      netBiweekly: netAnnual / 26,
    })
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  const fmt = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  return (
    <Card className="mb-6">
      <CardTitle>💰 Paycheck X-Ray</CardTitle>
      <p className="text-xs text-text-muted mt-1 mb-4">Estimate take-home pay by period based on gross salary and effective tax rate.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-text-muted mb-1">Gross Annual Salary</label>
          <NumberInput value={inputs.grossSalary} onChange={set('grossSalary')} label="Gross Salary" />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Effective Tax Rate (e.g. 0.28 = 28%)</label>
          <NumberInput value={inputs.taxRate} onChange={set('taxRate')} label="Tax Rate" isCurrency={false} isPercent={true} min={0} max={1} />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={calculate} className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors">
          Calculate
        </button>
        <button onClick={() => saveDraft('paycheck-estimator', inputs)} className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors">
          Save Draft
        </button>
        {result && (
          <button
            onClick={() => downloadCSV('paycheck-estimator.csv', [
              ['Gross Salary', 'Tax Rate', 'Net Annual', 'Net Monthly', 'Net Semi-Monthly', 'Net Bi-Weekly'],
              [String(inputs.grossSalary), String(inputs.taxRate),
               result.netAnnual.toFixed(2), result.netMonthly.toFixed(2),
               result.netSemiMonthly.toFixed(2), result.netBiweekly.toFixed(2)],
            ])}
            className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>
      {result && (
        <div ref={resultRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-background rounded-xl border border-border">
          <div>
            <p className="text-xs text-text-muted">Annual</p>
            <p className="text-sm font-semibold text-green mt-0.5">{fmt(result.netAnnual)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Monthly</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{fmt(result.netMonthly)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Semi-Monthly</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{fmt(result.netSemiMonthly)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Bi-Weekly</p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">{fmt(result.netBiweekly)}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Budget Planner ───────────────────────────────────────────────────────────

interface BudgetCategory { name: string; amount: number }
interface BudgetInputs { income: number; categories: BudgetCategory[] }
interface BudgetResult { totalExpenses: number; savings: number; savingsRate: number }

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { name: 'Housing', amount: 0 },
  { name: 'Transportation', amount: 0 },
  { name: 'Food & Living', amount: 0 },
  { name: 'Subscriptions', amount: 0 },
  { name: 'Other', amount: 0 },
]

function BudgetPlannerTool() {
  const [inputs, setInputs] = useState<BudgetInputs>(() =>
    loadDraft('budget-planner', { income: 5000, categories: DEFAULT_CATEGORIES })
  )
  const [result, setResult] = useState<BudgetResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  function setIncome(v: number) {
    setInputs(prev => ({ ...prev, income: v }))
  }

  function setCategoryAmount(idx: number, v: number) {
    setInputs(prev => {
      const cats = [...prev.categories]
      cats[idx] = { ...cats[idx], amount: v }
      return { ...prev, categories: cats }
    })
  }

  function calculate() {
    const totalExpenses = inputs.categories.reduce((s, c) => s + c.amount, 0)
    const savings = inputs.income - totalExpenses
    const savingsRate = inputs.income > 0 ? savings / inputs.income : 0
    setResult({ totalExpenses, savings, savingsRate })
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  const fmt = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`

  return (
    <Card className="mb-6">
      <CardTitle>📋 Budget Architect</CardTitle>
      <p className="text-xs text-text-muted mt-1 mb-4">Enter monthly income and expenses to calculate your savings rate.</p>
      <div className="mb-4">
        <label className="block text-xs text-text-muted mb-1">Monthly Income</label>
        <div className="max-w-xs">
          <NumberInput value={inputs.income} onChange={setIncome} label="Monthly Income" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {inputs.categories.map((cat, idx) => (
          <div key={cat.name}>
            <label className="block text-xs text-text-muted mb-1">{cat.name}</label>
            <NumberInput value={cat.amount} onChange={(v) => setCategoryAmount(idx, v)} label={cat.name} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <button onClick={calculate} className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs hover:bg-accent-hover transition-colors">
          Calculate
        </button>
        <button onClick={() => saveDraft('budget-planner', inputs)} className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors">
          Save Draft
        </button>
        {result && (
          <button
            onClick={() => {
              const rows: string[][] = [['Category', 'Amount']]
              rows.push(['Income', String(inputs.income)])
              inputs.categories.forEach(c => rows.push([c.name, String(c.amount)]))
              rows.push(['Total Expenses', result.totalExpenses.toFixed(2)])
              rows.push(['Savings', result.savings.toFixed(2)])
              rows.push(['Savings Rate', `${(result.savingsRate * 100).toFixed(1)}%`])
              downloadCSV('budget-planner.csv', rows)
            }}
            className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>
      {result && (
        <div ref={resultRef} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-background rounded-xl border border-border">
          <div>
            <p className="text-xs text-text-muted">Total Expenses</p>
            <p className="text-sm font-semibold text-red mt-0.5">{fmt(result.totalExpenses)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Savings</p>
            <p className={`text-sm font-semibold mt-0.5 ${result.savings >= 0 ? 'text-green' : 'text-red'}`}>
              {fmt(result.savings)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Savings Rate</p>
            <p className={`text-sm font-semibold mt-0.5 ${result.savingsRate >= 0.2 ? 'text-green' : result.savingsRate >= 0 ? 'text-amber' : 'text-red'}`}>
              {(result.savingsRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  { id: 'debt', emoji: '🥊', name: 'Debt Fighter', description: 'Calculate your debt payoff timeline' },
  { id: 'emergency', emoji: '🛡️', name: 'Safety Net Builder', description: 'Size your emergency fund' },
  { id: 'paycheck', emoji: '💰', name: 'Paycheck X-Ray', description: 'Estimate take-home pay' },
  { id: 'budget', emoji: '📋', name: 'Budget Planner', description: 'Plan monthly spending' },
]

// ─── Main ToolsPage ───────────────────────────────────────────────────────────

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<string | null>(null)

  return (
    <div>
      <PageHeader
        icon="🔧"
        title="Tools"
        titleKey="tools"
        subtitle="Financial calculators and planners"
      />

      {!activeTool ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="flex items-start gap-4 p-5 bg-surface border border-border rounded-xl text-left hover:border-accent/40 hover:bg-surface-hover transition-colors group"
            >
              <span className="text-3xl">{tool.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">{tool.name}</p>
                <p className="text-xs text-text-muted mt-1">{tool.description}</p>
              </div>
              <span className="text-text-muted group-hover:text-accent transition-colors mt-1">&rarr;</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <button
            onClick={() => setActiveTool(null)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors mb-4"
          >
            &larr; All Tools
          </button>
          {activeTool === 'debt' && <DebtPayoffTool />}
          {activeTool === 'emergency' && <EmergencyFundTool />}
          {activeTool === 'paycheck' && <PaycheckEstimatorTool />}
          {activeTool === 'budget' && <BudgetPlannerTool />}
        </>
      )}
    </div>
  )
}
