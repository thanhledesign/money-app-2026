import { useState, useEffect, useRef, useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardTitle } from '@/components/ui/Card'
import { NumberInput } from '@/components/ui/NumberInput'
import { PageHeader } from '@/components/ui/PageHeader'
import { CHART_TOOLTIP, AXIS_TICK } from '@/components/ui/chartConstants'

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
  const set = (k: keyof DebtInputs) => (v: number) =>
    setInputs(prev => ({ ...prev, [k]: v }))

  // Live auto-calculate
  useEffect(() => {
    const { balance, apr, payment } = inputs
    const monthlyRate = apr / 12
    if (payment <= balance * monthlyRate || balance <= 0) return
    const months = Math.ceil(-Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate))
    const totalPaid = payment * months
    const totalInterest = totalPaid - balance
    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)
    setResult({ months, totalInterest, payoffDate: payoffDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })
  }, [inputs])

  function calculate() {
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
          <NumberInput value={inputs.apr * 100} onChange={v => set('apr')(v / 100)} label="APR %" isCurrency={false} isPercent={true} min={0} max={100} />
          <input type="range" min={0} max={35} step={0.5} value={inputs.apr * 100} onChange={e => set('apr')(Number(e.target.value) / 100)} className="w-full mt-1.5 accent-accent h-1" />
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

  // Live auto-calculate
  useEffect(() => {
    const targetAmount = inputs.monthlyExpenses * inputs.targetMonths
    if (targetAmount <= 0) return
    const shortfall = Math.max(0, targetAmount - inputs.currentSaved)
    const progressPct = Math.min(100, (inputs.currentSaved / targetAmount) * 100)
    setResult({ targetAmount, shortfall, progressPct })
  }, [inputs])

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
          <NumberInput value={inputs.targetMonths} onChange={set('targetMonths')} label="Target Months" isCurrency={false} min={1} max={90} />
          <input type="range" min={1} max={90} step={1} value={inputs.targetMonths} onChange={e => set('targetMonths')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
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

interface PaycheckInputs { grossSalary: number; taxRate: number; bonus: number; lti: number; pretaxDeductions: number }

const PAY_PERIODS = [
  { label: 'Hourly', divisor: 52 * 40 },
  { label: 'Daily', divisor: 260 },
  { label: 'Weekly', divisor: 52 },
  { label: 'Bi-Weekly', divisor: 26 },
  { label: 'Semi-Monthly', divisor: 24 },
  { label: 'Monthly', divisor: 12 },
  { label: 'Quarterly', divisor: 4 },
  { label: 'Annual', divisor: 1 },
]

function PaycheckEstimatorTool() {
  const [inputs, setInputs] = useState<PaycheckInputs>(() =>
    loadDraft('paycheck-estimator', { grossSalary: 100000, taxRate: 0.28, bonus: 0, lti: 0, pretaxDeductions: 0 })
  )

  const set = (k: keyof PaycheckInputs) => (v: number) =>
    setInputs(prev => ({ ...prev, [k]: v }))

  const fmt = (v: number) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  const fmtFull = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Computed values
  const grossSemiMonthly = inputs.grossSalary / 24
  const taxesSemiMonthly = grossSemiMonthly * inputs.taxRate
  const netSemiMonthly = grossSemiMonthly - taxesSemiMonthly - inputs.pretaxDeductions
  const netAnnual = netSemiMonthly * 24
  const totalComp = inputs.grossSalary + inputs.bonus + inputs.lti

  // Pay period table rows
  const payRows = PAY_PERIODS.map(p => ({
    label: p.label,
    gross: inputs.grossSalary / p.divisor,
    tax: (inputs.grossSalary * inputs.taxRate) / p.divisor,
    net: netAnnual / (p.divisor === 1 ? 1 : p.divisor === 4 ? 4 : p.divisor === 12 ? 12 : p.divisor === 24 ? 24 : p.divisor === 26 ? 26 : p.divisor === 52 ? 52 : p.divisor === 260 ? 260 : 2080),
  }))

  // Comp package pie
  const compPie = useMemo(() => [
    { name: 'Salary', value: inputs.grossSalary, color: '#34d399' },
    ...(inputs.bonus > 0 ? [{ name: 'Bonus', value: inputs.bonus, color: '#fbbf24' }] : []),
    ...(inputs.lti > 0 ? [{ name: 'LTI/RSU', value: inputs.lti, color: '#c084fc' }] : []),
  ], [inputs.grossSalary, inputs.bonus, inputs.lti])

  // Paycheck distribution pie
  const distPie = useMemo(() => {
    const slices = [
      { name: 'Taxes', value: taxesSemiMonthly, color: '#f87171' },
      ...(inputs.pretaxDeductions > 0 ? [{ name: 'Pre-Tax', value: inputs.pretaxDeductions, color: '#60a5fa' }] : []),
      { name: 'Take-Home', value: Math.max(0, netSemiMonthly), color: '#34d399' },
    ]
    return slices
  }, [taxesSemiMonthly, inputs.pretaxDeductions, netSemiMonthly])

  // Bar chart: gross vs net by period
  const barData = useMemo(() =>
    PAY_PERIODS.filter(p => ['Semi-Monthly', 'Monthly', 'Annual'].includes(p.label)).map(p => ({
      period: p.label === 'Semi-Monthly' ? 'Semi-Mo' : p.label === 'Annual' ? 'Annual' : p.label,
      Gross: inputs.grossSalary / p.divisor,
      Net: netAnnual / (p.divisor === 1 ? 1 : p.divisor === 12 ? 12 : 24),
    })),
  [inputs.grossSalary, netAnnual])

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>💰 Paycheck X-Ray</CardTitle>
        <p className="text-xs text-text-muted mt-1 mb-4">Full compensation breakdown — gross to net, every pay period, with charts.</p>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">Annual Salary</label>
            <NumberInput value={inputs.grossSalary} onChange={set('grossSalary')} label="Salary" />
            <input type="range" min={30000} max={300000} step={5000} value={inputs.grossSalary} onChange={e => set('grossSalary')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Tax Rate</label>
            <NumberInput value={inputs.taxRate * 100} onChange={v => set('taxRate')(v / 100)} label="Tax %" isCurrency={false} isPercent={true} min={0} max={100} />
            <input type="range" min={10} max={50} step={0.5} value={inputs.taxRate * 100} onChange={e => set('taxRate')(Number(e.target.value) / 100)} className="w-full mt-1.5 accent-accent h-1" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Bonus (annual)</label>
            <NumberInput value={inputs.bonus} onChange={set('bonus')} label="Bonus" />
            <input type="range" min={0} max={100000} step={1000} value={inputs.bonus} onChange={e => set('bonus')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">LTI / RSU (annual)</label>
            <NumberInput value={inputs.lti} onChange={set('lti')} label="LTI" />
            <input type="range" min={0} max={200000} step={5000} value={inputs.lti} onChange={e => set('lti')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">Pre-Tax Deductions (per check)</label>
            <NumberInput value={inputs.pretaxDeductions} onChange={set('pretaxDeductions')} label="Pre-Tax" />
            <input type="range" min={0} max={3000} step={50} value={inputs.pretaxDeductions} onChange={e => set('pretaxDeductions')(Number(e.target.value))} className="w-full mt-1.5 accent-accent h-1" />
          </div>
        </div>
        <button onClick={() => saveDraft('paycheck-estimator', inputs)} className="px-3 py-1.5 border border-border text-text-muted rounded-lg text-xs hover:text-text-secondary transition-colors mb-4">
          Save Draft
        </button>
      </Card>

      {/* Total Comp Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Total Compensation Package</CardTitle>
          <p className="text-center text-xs text-text-muted mt-2">
            Total: <span className="text-green font-semibold">{fmt(totalComp)}</span>
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={compPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {compPie.map((s, i) => <Cell key={i} fill={s.color} stroke={s.color + '60'} strokeWidth={1.5} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} formatter={(v: any, name: any) => {
                const pct = totalComp > 0 ? ((v as number) / totalComp * 100).toFixed(1) : '0'
                return [`${fmt(v)} (${pct}%)`, name]
              }} />
              <Legend formatter={(name: string) => <span style={{ color: '#9090a8', fontSize: 11 }}>{name}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>Paycheck Distribution</CardTitle>
          <p className="text-center text-xs text-text-muted mt-2">
            Per semi-monthly: <span className="text-green font-semibold">{fmt(grossSemiMonthly)}</span> gross
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={distPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {distPie.map((s, i) => <Cell key={i} fill={s.color} stroke={s.color + '60'} strokeWidth={1.5} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP} formatter={(v: any, name: any) => {
                const pct = grossSemiMonthly > 0 ? ((v as number) / grossSemiMonthly * 100).toFixed(1) : '0'
                return [`${fmt(v)} (${pct}%)`, name]
              }} />
              <Legend formatter={(name: string) => <span style={{ color: '#9090a8', fontSize: 11 }}>{name}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Gross-to-Net Waterfall */}
      <Card>
        <CardTitle>Gross → Net Waterfall</CardTitle>
        <div className="mt-4 space-y-2 max-w-lg">
          <div className="flex justify-between text-sm py-1.5">
            <span className="text-text-secondary">Gross Semi-Monthly</span>
            <span className="text-text-primary font-semibold tabular-nums">{fmtFull(grossSemiMonthly)}</span>
          </div>
          <div className="flex justify-between text-sm py-1.5">
            <span className="text-text-secondary">Federal & State Taxes ({(inputs.taxRate * 100).toFixed(1)}%)</span>
            <span className="text-red font-medium tabular-nums">-{fmtFull(taxesSemiMonthly)}</span>
          </div>
          {inputs.pretaxDeductions > 0 && (
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-text-secondary">Pre-Tax (401K, Medical, etc.)</span>
              <span className="text-blue font-medium tabular-nums">-{fmtFull(inputs.pretaxDeductions)}</span>
            </div>
          )}
          <div className="border-t-2 border-green/30 pt-2 flex justify-between text-sm font-bold">
            <span className="text-text-primary">Net Take-Home</span>
            <span className="text-green tabular-nums">{fmtFull(netSemiMonthly)}</span>
          </div>
        </div>
      </Card>

      {/* Pay Period Table */}
      <Card>
        <CardTitle>Pay Period Breakdown</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-3 text-left text-xs text-text-muted uppercase">Period</th>
                <th className="py-2 px-3 text-right text-xs text-text-muted uppercase">Gross</th>
                <th className="py-2 px-3 text-right text-xs text-text-muted uppercase">Tax</th>
                <th className="py-2 px-3 text-right text-xs text-text-muted uppercase">Net</th>
              </tr>
            </thead>
            <tbody>
              {payRows.map(row => (
                <tr key={row.label} className={`border-b border-border-light hover:bg-surface-hover ${row.label === 'Annual' ? 'bg-accent/5 font-semibold' : ''}`}>
                  <td className="py-2 px-3 text-text-secondary">{row.label}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-text-primary">{fmtFull(row.gross)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-red">{fmtFull(row.tax)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-green font-medium">{fmtFull(row.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Gross vs Net Bar Chart */}
      <Card>
        <CardTitle>Gross vs Net Comparison</CardTitle>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
            <XAxis dataKey="period" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip {...CHART_TOOLTIP} formatter={(v: any, name: any) => [fmt(v), name]} />
            <Legend formatter={(name: string) => <span style={{ color: '#9090a8', fontSize: 11 }}>{name}</span>} />
            <Bar dataKey="Gross" fill="#34d399" fillOpacity={0.3} stroke="#34d399" strokeWidth={1} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Net" fill="#34d399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Total Comp Summary */}
      {(inputs.bonus > 0 || inputs.lti > 0) && (
        <Card>
          <CardTitle>Total Comp Summary</CardTitle>
          <div className="mt-4 space-y-2 max-w-lg">
            <div className="flex justify-between text-sm py-1">
              <span className="text-text-secondary">Base Salary</span>
              <span className="text-text-primary tabular-nums">{fmt(inputs.grossSalary)}</span>
            </div>
            {inputs.bonus > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-text-secondary">Bonus</span>
                <span className="text-amber tabular-nums">{fmt(inputs.bonus)}</span>
              </div>
            )}
            {inputs.lti > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-text-secondary">LTI / RSU</span>
                <span className="text-purple tabular-nums">{fmt(inputs.lti)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
              <span className="text-text-primary">Total Compensation</span>
              <span className="text-green tabular-nums">{fmt(totalComp)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-text-muted">After-Tax Total</span>
              <span className="text-text-secondary tabular-nums">{fmt(totalComp * (1 - inputs.taxRate))}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
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

  // Live auto-calculate
  useEffect(() => {
    if (inputs.income <= 0) return
    const totalExpenses = inputs.categories.reduce((s, c) => s + c.amount, 0)
    const savings = inputs.income - totalExpenses
    const savingsRate = inputs.income > 0 ? savings / inputs.income : 0
    setResult({ totalExpenses, savings, savingsRate })
  }, [inputs])

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
