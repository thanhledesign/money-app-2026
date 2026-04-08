import { useState } from 'react'
import type { Account, BudgetItem, Goal, AppData } from '@/data/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WizardPageProps {
  onComplete: () => void
  addAccount: (account: Account) => void
  updateComp: (comp: AppData['comp']) => void
  updateBudgetItems: (items: BudgetItem[]) => void
  addGoal: (goal: Goal) => void
}

type EmploymentType = 'employed' | 'self-employed' | 'student' | 'retired'
type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
type BudgetTemplate = 'debt-destroyer' | 'foundation-builder' | 'wealth-builder' | 'full-control'

interface WizardAccount {
  id: string
  name: string
  institution: string
  type: Account['type']
  category: Account['category']
  creditLimit?: number
}

interface WizardGoal {
  id: string
  milestone: string
  targetDate: string
  ranking: '1' | '2' | '3'
}

// ── Budget Templates ──────────────────────────────────────────────────────────

const BUDGET_TEMPLATES: Record<BudgetTemplate, { label: string; desc: string; emoji: string; items: Omit<BudgetItem, 'id'>[] }> = {
  'debt-destroyer': {
    label: 'Debt Destroyer',
    desc: 'Aggressively eliminate debt — every extra dollar goes to payoff.',
    emoji: '⚔️',
    items: [
      { name: 'Rent / Mortgage', amount: 1500, tier: 'fixed', category: 'Housing' },
      { name: 'Utilities', amount: 150, tier: 'fixed', category: 'Housing' },
      { name: 'Groceries', amount: 400, tier: 'variable', category: 'Food & Living' },
      { name: 'Transportation', amount: 150, tier: 'variable', category: 'Transportation' },
      { name: 'Minimum Debt Payments', amount: 200, tier: 'fixed', category: 'Debt' },
      { name: 'Extra Debt Payoff', amount: 800, tier: 'wealth', category: 'Debt' },
      { name: 'Emergency Fund', amount: 200, tier: 'wealth', category: 'Savings' },
      { name: 'Entertainment', amount: 100, tier: 'optional', category: 'Lifestyle' },
    ],
  },
  'foundation-builder': {
    label: 'Foundation Builder',
    desc: 'Build a solid financial base: emergency fund + basic savings.',
    emoji: '🏗️',
    items: [
      { name: 'Rent / Mortgage', amount: 1500, tier: 'fixed', category: 'Housing' },
      { name: 'Utilities', amount: 150, tier: 'fixed', category: 'Housing' },
      { name: 'Groceries', amount: 500, tier: 'variable', category: 'Food & Living' },
      { name: 'Transportation', amount: 200, tier: 'variable', category: 'Transportation' },
      { name: 'Emergency Fund', amount: 500, tier: 'wealth', category: 'Savings' },
      { name: 'Subscriptions', amount: 100, tier: 'variable', category: 'Subscriptions' },
      { name: 'Entertainment', amount: 200, tier: 'optional', category: 'Lifestyle' },
      { name: 'Personal Care', amount: 100, tier: 'variable', category: 'Lifestyle' },
    ],
  },
  'wealth-builder': {
    label: 'Wealth Builder',
    desc: 'Maximize investing and savings — grow your net worth fast.',
    emoji: '💎',
    items: [
      { name: 'Rent / Mortgage', amount: 1500, tier: 'fixed', category: 'Housing' },
      { name: 'Utilities', amount: 150, tier: 'fixed', category: 'Housing' },
      { name: 'Groceries', amount: 500, tier: 'variable', category: 'Food & Living' },
      { name: 'Transportation', amount: 200, tier: 'variable', category: 'Transportation' },
      { name: '401k / Retirement', amount: 500, tier: 'wealth', category: 'Investing' },
      { name: 'Brokerage Investing', amount: 400, tier: 'wealth', category: 'Investing' },
      { name: 'Emergency Fund', amount: 300, tier: 'wealth', category: 'Savings' },
      { name: 'Entertainment', amount: 200, tier: 'optional', category: 'Lifestyle' },
    ],
  },
  'full-control': {
    label: 'Full Control',
    desc: 'Start from scratch — fully customize every budget line.',
    emoji: '🎛️',
    items: [
      { name: 'Rent / Mortgage', amount: 0, tier: 'fixed', category: 'Housing' },
      { name: 'Groceries', amount: 0, tier: 'variable', category: 'Food & Living' },
      { name: 'Transportation', amount: 0, tier: 'variable', category: 'Transportation' },
      { name: 'Savings', amount: 0, tier: 'wealth', category: 'Savings' },
    ],
  },
}

// ── Suggested Accounts ────────────────────────────────────────────────────────

const SUGGESTED_CASH: WizardAccount[] = [
  { id: `w-cash-1-${Date.now()}`, name: 'Checking Account', institution: '', type: 'checking', category: 'cash' },
  { id: `w-cash-2-${Date.now() + 1}`, name: 'Savings Account', institution: '', type: 'savings', category: 'cash' },
]

const SUGGESTED_INVESTMENT: WizardAccount[] = [
  { id: `w-inv-1-${Date.now() + 2}`, name: '401(k)', institution: '', type: 'retirement', category: 'investment' },
]

const SUGGESTED_DEBT: WizardAccount[] = [
  { id: `w-debt-1-${Date.now() + 3}`, name: 'Credit Card', institution: '', type: 'credit', category: 'debt', creditLimit: 5000 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function calcMonthlyNet(salary: number, bonus: number, lti: number, taxRate: number, freq: PayFrequency): number {
  const gross = salary + bonus + lti
  const net = gross * (1 - taxRate / 100)
  const perMonth = net / 12
  return Math.max(0, perMonth)
}

function paychecksPerMonth(freq: PayFrequency): number {
  if (freq === 'weekly') return 4.33
  if (freq === 'biweekly') return 2.17
  if (freq === 'semimonthly') return 2
  return 1
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / (total - 1)) * 100)
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-text-muted">Step {step + 1} of {total}</span>
        <span className="text-xs text-text-muted">{pct}% complete</span>
      </div>
      <div className="h-1 bg-surface-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Step Shell ────────────────────────────────────────────────────────────────

function StepShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-semibold text-text-primary mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-text-muted mb-6">{subtitle}</p>}
      {children}
    </div>
  )
}

// ── Input helpers ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-text-muted uppercase tracking-wider mb-1 block">{children}</label>
}

function TextInput({ value, onChange, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors w-full ${className}`}
    />
  )
}

function NumberField({ value, onChange, placeholder, prefix }: {
  value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string
}) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">{prefix}</span>
      )}
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors w-full ${prefix ? 'pl-7' : ''}`}
      />
    </div>
  )
}

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function StepWelcome({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  return (
    <div className="text-center py-6 animate-fadeIn">
      <div className="text-6xl mb-4">💰</div>
      <h1 className="text-3xl font-bold text-text-primary mb-3">Welcome to Money 2026</h1>
      <p className="text-text-secondary text-base mb-2 max-w-md mx-auto">
        Your personal finance command center.
      </p>
      <p className="text-text-muted text-sm mb-10 max-w-sm mx-auto">
        Takes about 3 minutes to set up your dashboard with your accounts, income, and budget.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onStart}
          className="px-8 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Set Up My Dashboard
        </button>
        <button
          onClick={onSkip}
          className="px-8 py-3 border border-border hover:border-border-light text-text-secondary hover:text-text-primary rounded-xl transition-colors text-sm"
        >
          Skip, I'll explore
        </button>
      </div>
    </div>
  )
}

// ── Step 1: Profile ───────────────────────────────────────────────────────────

function StepProfile({
  employment, setEmployment, payFrequency, setPayFrequency,
}: {
  employment: EmploymentType
  setEmployment: (v: EmploymentType) => void
  payFrequency: PayFrequency
  setPayFrequency: (v: PayFrequency) => void
}) {
  const employmentOptions: { value: EmploymentType; label: string; emoji: string }[] = [
    { value: 'employed', label: 'Employed', emoji: '🏢' },
    { value: 'self-employed', label: 'Self-employed', emoji: '💼' },
    { value: 'student', label: 'Student', emoji: '🎓' },
    { value: 'retired', label: 'Retired', emoji: '🌴' },
  ]

  const freqOptions: { value: PayFrequency; label: string; desc: string }[] = [
    { value: 'weekly', label: 'Weekly', desc: '52x / year' },
    { value: 'biweekly', label: 'Biweekly', desc: 'Every 2 weeks' },
    { value: 'semimonthly', label: 'Semi-monthly', desc: '1st & 15th' },
    { value: 'monthly', label: 'Monthly', desc: '12x / year' },
  ]

  return (
    <StepShell title="What best describes you?" subtitle="Helps tailor your budget templates and income calculations.">
      <div className="space-y-6">
        <div>
          <Label>Employment Type</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {employmentOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setEmployment(opt.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  employment === opt.value
                    ? 'border-accent bg-accent/10 text-text-primary'
                    : 'border-border hover:border-border-light text-text-secondary'
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Pay Frequency</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {freqOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPayFrequency(opt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  payFrequency === opt.value
                    ? 'border-accent bg-accent/10 text-text-primary'
                    : 'border-border hover:border-border-light text-text-secondary'
                }`}
              >
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </StepShell>
  )
}

// ── Step 2: Accounts ──────────────────────────────────────────────────────────

interface AccountRowProps {
  account: WizardAccount
  onUpdate: (updated: WizardAccount) => void
  onRemove: () => void
}

function AccountRow({ account, onUpdate, onRemove }: AccountRowProps) {
  const typeOptions: Account['type'][] = account.category === 'cash'
    ? ['checking', 'savings', 'other']
    : account.category === 'investment'
    ? ['investment', 'retirement', 'brokerage', 'other']
    : ['credit', 'other']

  return (
    <div className="flex items-center gap-2 py-2 border-b border-border last:border-0">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <TextInput
          value={account.name}
          onChange={v => onUpdate({ ...account, name: v })}
          placeholder="Account name"
        />
        <TextInput
          value={account.institution}
          onChange={v => onUpdate({ ...account, institution: v })}
          placeholder="Institution"
        />
        <select
          value={account.type}
          onChange={e => onUpdate({ ...account, type: e.target.value as Account['type'] })}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
        >
          {typeOptions.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        {account.category === 'debt' && (
          <NumberField
            value={account.creditLimit?.toString() ?? ''}
            onChange={v => onUpdate({ ...account, creditLimit: v ? Number(v) : undefined })}
            placeholder="Credit limit"
            prefix="$"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 text-text-muted hover:text-red transition-colors flex-shrink-0"
        title="Remove"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface AccountSectionProps {
  label: string
  emoji: string
  accounts: WizardAccount[]
  category: Account['category']
  onAdd: () => void
  onUpdate: (idx: number, updated: WizardAccount) => void
  onRemove: (idx: number) => void
}

function AccountSection({ label, emoji, accounts, onAdd, onUpdate, onRemove }: AccountSectionProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary">
          <span className="mr-2">{emoji}</span>{label}
          <span className="ml-2 text-xs text-text-muted">({accounts.length})</span>
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Account
        </button>
      </div>
      {accounts.length === 0 ? (
        <p className="text-xs text-text-muted py-2 text-center">No accounts yet</p>
      ) : (
        <div>
          {accounts.map((acc, i) => (
            <AccountRow
              key={acc.id}
              account={acc}
              onUpdate={u => onUpdate(i, u)}
              onRemove={() => onRemove(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StepAccounts({
  cashAccounts, investmentAccounts, debtAccounts,
  setCashAccounts, setInvestmentAccounts, setDebtAccounts,
}: {
  cashAccounts: WizardAccount[]
  investmentAccounts: WizardAccount[]
  debtAccounts: WizardAccount[]
  setCashAccounts: (a: WizardAccount[]) => void
  setInvestmentAccounts: (a: WizardAccount[]) => void
  setDebtAccounts: (a: WizardAccount[]) => void
}) {
  function makeAccount(category: Account['category']): WizardAccount {
    const type: Account['type'] = category === 'cash' ? 'checking' : category === 'investment' ? 'retirement' : 'credit'
    return {
      id: `w-${category}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: '',
      institution: '',
      type,
      category,
      ...(category === 'debt' ? { creditLimit: 0 } : {}),
    }
  }

  return (
    <StepShell title="Add your financial accounts" subtitle="Add accounts you want to track. You can always add more later.">
      <div className="space-y-4">
        <AccountSection
          label="Cash" emoji="💵" category="cash" accounts={cashAccounts}
          onAdd={() => setCashAccounts([...cashAccounts, makeAccount('cash')])}
          onUpdate={(i, u) => { const a = [...cashAccounts]; a[i] = u; setCashAccounts(a) }}
          onRemove={i => setCashAccounts(cashAccounts.filter((_, idx) => idx !== i))}
        />
        <AccountSection
          label="Investments" emoji="📈" category="investment" accounts={investmentAccounts}
          onAdd={() => setInvestmentAccounts([...investmentAccounts, makeAccount('investment')])}
          onUpdate={(i, u) => { const a = [...investmentAccounts]; a[i] = u; setInvestmentAccounts(a) }}
          onRemove={i => setInvestmentAccounts(investmentAccounts.filter((_, idx) => idx !== i))}
        />
        <AccountSection
          label="Debt" emoji="💳" category="debt" accounts={debtAccounts}
          onAdd={() => setDebtAccounts([...debtAccounts, makeAccount('debt')])}
          onUpdate={(i, u) => { const a = [...debtAccounts]; a[i] = u; setDebtAccounts(a) }}
          onRemove={i => setDebtAccounts(debtAccounts.filter((_, idx) => idx !== i))}
        />
      </div>
    </StepShell>
  )
}

// ── Step 3: Income ────────────────────────────────────────────────────────────

function StepIncome({
  salary, setSalary,
  bonus, setBonus,
  lti, setLti,
  taxRate, setTaxRate,
  payFrequency,
}: {
  salary: string; setSalary: (v: string) => void
  bonus: string; setBonus: (v: string) => void
  lti: string; setLti: (v: string) => void
  taxRate: string; setTaxRate: (v: string) => void
  payFrequency: PayFrequency
}) {
  const salaryNum = parseFloat(salary) || 0
  const bonusNum = parseFloat(bonus) || 0
  const ltiNum = parseFloat(lti) || 0
  const taxNum = parseFloat(taxRate) || 0

  const monthlyNet = calcMonthlyNet(salaryNum, bonusNum, ltiNum, taxNum, payFrequency)
  const perPaycheck = monthlyNet / paychecksPerMonth(payFrequency)

  return (
    <StepShell title="How much do you earn?" subtitle="Used to calculate your take-home pay and savings potential.">
      <div className="space-y-4">
        <div>
          <Label>Annual Salary</Label>
          <NumberField value={salary} onChange={setSalary} placeholder="e.g. 120000" prefix="$" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Annual Bonus (optional)</Label>
            <NumberField value={bonus} onChange={setBonus} placeholder="e.g. 15000" prefix="$" />
          </div>
          <div>
            <Label>LTI / Equity (optional)</Label>
            <NumberField value={lti} onChange={setLti} placeholder="e.g. 40000" prefix="$" />
          </div>
        </div>
        <div>
          <Label>Effective Tax Rate (%)</Label>
          <NumberField value={taxRate} onChange={setTaxRate} placeholder="e.g. 28" prefix="%" />
        </div>

        {salaryNum > 0 && taxNum > 0 && (
          <div className="mt-4 p-4 bg-accent/10 border border-accent/30 rounded-xl">
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Live Preview</p>
            <div className="flex items-end gap-4">
              <div>
                <p className="text-2xl font-semibold text-accent tabular-nums">{formatCurrency(monthlyNet)}</p>
                <p className="text-xs text-text-muted mt-0.5">estimated monthly net pay</p>
              </div>
              <div className="pb-1">
                <p className="text-base font-medium text-text-secondary tabular-nums">{formatCurrency(perPaycheck)}</p>
                <p className="text-xs text-text-muted mt-0.5">per paycheck ({payFrequency})</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </StepShell>
  )
}

// ── Step 4: Budget ────────────────────────────────────────────────────────────

function StepBudget({
  selectedTemplate, setSelectedTemplate,
  budgetItems, setBudgetItems,
  employment,
}: {
  selectedTemplate: BudgetTemplate | null
  setSelectedTemplate: (t: BudgetTemplate) => void
  budgetItems: BudgetItem[]
  setBudgetItems: (items: BudgetItem[]) => void
  employment: EmploymentType
}) {
  // Suggest templates based on employment type
  const suggested: BudgetTemplate =
    employment === 'student' ? 'foundation-builder' :
    employment === 'retired' ? 'wealth-builder' :
    'wealth-builder'

  function selectTemplate(t: BudgetTemplate) {
    setSelectedTemplate(t)
    const tpl = BUDGET_TEMPLATES[t]
    setBudgetItems(
      tpl.items.map((item, i) => ({
        ...item,
        id: `bw-${t}-${i}-${Date.now()}`,
      }))
    )
  }

  const templates = (Object.keys(BUDGET_TEMPLATES) as BudgetTemplate[])

  return (
    <StepShell title="Set your monthly budget" subtitle="Choose a template to get started. You can customize amounts on the right.">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {templates.map(t => {
            const tpl = BUDGET_TEMPLATES[t]
            const isSuggested = t === suggested
            const isSelected = selectedTemplate === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => selectTemplate(t)}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-border-light'
                }`}
              >
                {isSuggested && !isSelected && (
                  <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-green/20 text-green rounded-full">
                    Suggested
                  </span>
                )}
                <p className="text-lg mb-1">{tpl.emoji}</p>
                <p className={`text-sm font-medium ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{tpl.label}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-snug">{tpl.desc}</p>
              </button>
            )
          })}
        </div>

        {budgetItems.length > 0 && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-surface-hover">
              <p className="text-xs text-text-muted uppercase tracking-wider">Budget Items — edit amounts below</p>
            </div>
            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {budgetItems.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2">
                  <span className="flex-1 text-sm text-text-secondary truncate">{item.name}</span>
                  <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-surface-hover capitalize">{item.tier}</span>
                  <div className="w-28">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs">$</span>
                      <input
                        type="number"
                        value={item.amount}
                        onChange={e => {
                          const updated = [...budgetItems]
                          updated[i] = { ...item, amount: parseFloat(e.target.value) || 0 }
                          setBudgetItems(updated)
                        }}
                        className="bg-surface-hover border border-border rounded-lg pl-5 pr-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-border flex justify-between">
              <span className="text-xs text-text-muted">Monthly total</span>
              <span className="text-xs font-semibold text-text-primary tabular-nums">
                {formatCurrency(budgetItems.reduce((s, i) => s + i.amount, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </StepShell>
  )
}

// ── Step 5: Goals ─────────────────────────────────────────────────────────────

const RANKING_LABELS: Record<'1' | '2' | '3', string> = {
  '1': '🏆 Win',
  '2': '🏆🏆 Big Win',
  '3': '🏆🏆🏆 Major Milestone',
}

function StepGoals({ goals, setGoals }: { goals: WizardGoal[]; setGoals: (g: WizardGoal[]) => void }) {
  const today = new Date().toISOString().slice(0, 10)

  function addGoal() {
    if (goals.length >= 3) return
    setGoals([
      ...goals,
      { id: `wg-${Date.now()}`, milestone: '', targetDate: today, ranking: '1' },
    ])
  }

  function updateGoal(idx: number, updates: Partial<WizardGoal>) {
    const updated = [...goals]
    updated[idx] = { ...updated[idx], ...updates }
    setGoals(updated)
  }

  function removeGoal(idx: number) {
    setGoals(goals.filter((_, i) => i !== idx))
  }

  return (
    <StepShell title="What are you working toward?" subtitle="Add 1–3 financial goals or milestones you want to achieve.">
      <div className="space-y-3">
        {goals.map((goal, i) => (
          <div key={goal.id} className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted uppercase tracking-wider">Goal {i + 1}</span>
              <button
                type="button"
                onClick={() => removeGoal(i)}
                className="text-xs text-text-muted hover:text-red transition-colors"
              >
                Remove
              </button>
            </div>
            <div>
              <Label>Milestone</Label>
              <TextInput
                value={goal.milestone}
                onChange={v => updateGoal(i, { milestone: v })}
                placeholder="e.g. Pay off credit card debt"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Date</Label>
                <input
                  type="date"
                  value={goal.targetDate}
                  onChange={e => updateGoal(i, { targetDate: e.target.value })}
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors w-full"
                />
              </div>
              <div>
                <Label>Tier</Label>
                <select
                  value={goal.ranking}
                  onChange={e => updateGoal(i, { ranking: e.target.value as '1' | '2' | '3' })}
                  className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors w-full"
                >
                  {(['1', '2', '3'] as const).map(r => (
                    <option key={r} value={r}>{RANKING_LABELS[r]}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        {goals.length < 3 && (
          <button
            type="button"
            onClick={addGoal}
            className="w-full py-3 border border-dashed border-border hover:border-accent text-text-muted hover:text-accent rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add a goal
          </button>
        )}

        {goals.length === 0 && (
          <p className="text-xs text-text-muted text-center py-2">Optional — you can skip this and add goals later.</p>
        )}
      </div>
    </StepShell>
  )
}

// ── Step 6: Done ──────────────────────────────────────────────────────────────

function StepDone({
  cashAccounts, investmentAccounts, debtAccounts,
  salary, budgetItems, goals,
  onFinish,
}: {
  cashAccounts: WizardAccount[]
  investmentAccounts: WizardAccount[]
  debtAccounts: WizardAccount[]
  salary: string
  budgetItems: BudgetItem[]
  goals: WizardGoal[]
  onFinish: () => void
}) {
  const accountCount = cashAccounts.length + investmentAccounts.length + debtAccounts.length
  const validGoals = goals.filter(g => g.milestone.trim())
  const salaryNum = parseFloat(salary) || 0

  const summaryItems = [
    { emoji: '🏦', label: 'Accounts configured', value: `${accountCount} account${accountCount !== 1 ? 's' : ''}` },
    ...(salaryNum > 0 ? [{ emoji: '💵', label: 'Annual income', value: formatCurrency(salaryNum) }] : []),
    ...(budgetItems.length > 0 ? [{ emoji: '📊', label: 'Budget items', value: `${budgetItems.length} items set` }] : []),
    ...(validGoals.length > 0 ? [{ emoji: '🏆', label: 'Goals added', value: `${validGoals.length} goal${validGoals.length !== 1 ? 's' : ''}` }] : []),
  ]

  return (
    <div className="text-center py-4 animate-fadeIn">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">You're all set!</h2>
      <p className="text-text-muted text-sm mb-8 max-w-sm mx-auto">
        Your dashboard is ready. Here's a summary of what was configured:
      </p>

      <div className="bg-surface border border-border rounded-xl p-4 mb-8 text-left max-w-sm mx-auto space-y-3">
        {summaryItems.length > 0 ? summaryItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-lg">{item.emoji}</span>
            <div>
              <p className="text-xs text-text-muted">{item.label}</p>
              <p className="text-sm font-medium text-text-primary">{item.value}</p>
            </div>
          </div>
        )) : (
          <p className="text-xs text-text-muted text-center py-2">You skipped setup — explore and add data manually.</p>
        )}
      </div>

      <button
        onClick={onFinish}
        className="px-10 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-sm"
      >
        Go to Dashboard
      </button>
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7

export default function WizardPage({ onComplete, addAccount, updateComp, updateBudgetItems, addGoal }: WizardPageProps) {
  const [step, setStep] = useState(0)

  // Profile
  const [employment, setEmployment] = useState<EmploymentType>('employed')
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('semimonthly')

  // Accounts
  const [cashAccounts, setCashAccounts] = useState<WizardAccount[]>(() =>
    SUGGESTED_CASH.map(a => ({ ...a, id: `w-cash-${Date.now()}-${Math.random().toString(36).slice(2)}` }))
  )
  const [investmentAccounts, setInvestmentAccounts] = useState<WizardAccount[]>(() =>
    SUGGESTED_INVESTMENT.map(a => ({ ...a, id: `w-inv-${Date.now()}-${Math.random().toString(36).slice(2)}` }))
  )
  const [debtAccounts, setDebtAccounts] = useState<WizardAccount[]>(() =>
    SUGGESTED_DEBT.map(a => ({ ...a, id: `w-debt-${Date.now()}-${Math.random().toString(36).slice(2)}` }))
  )

  // Income
  const [salary, setSalary] = useState('')
  const [bonus, setBonus] = useState('')
  const [lti, setLti] = useState('')
  const [taxRate, setTaxRate] = useState('')

  // Budget
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | null>(null)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])

  // Goals
  const [goals, setGoals] = useState<WizardGoal[]>([])

  function next() {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
  }

  function back() {
    if (step > 1) setStep(s => s - 1)
  }

  function saveAndFinish() {
    // Save accounts
    const allAccounts: Account[] = [
      ...cashAccounts,
      ...investmentAccounts,
      ...debtAccounts,
    ]
      .filter(a => a.name.trim())
      .map(a => ({
        id: `wizard-${a.id}`,
        name: a.name.trim(),
        institution: a.institution.trim(),
        type: a.type,
        category: a.category,
        isActive: true,
        ...(a.creditLimit !== undefined ? { creditLimit: a.creditLimit } : {}),
      }))

    allAccounts.forEach(acc => addAccount(acc))

    // Save comp
    const salaryNum = parseFloat(salary) || 0
    if (salaryNum > 0) {
      updateComp({
        annualSalary: salaryNum,
        bonus: parseFloat(bonus) || 0,
        ltiPreTax: parseFloat(lti) || 0,
        taxRate: (parseFloat(taxRate) || 0) / 100,
      })
    }

    // Save budget
    if (budgetItems.length > 0) {
      updateBudgetItems(budgetItems)
    }

    // Save goals
    goals
      .filter(g => g.milestone.trim())
      .forEach(g => {
        addGoal({
          id: `wizard-goal-${g.id}`,
          ranking: g.ranking,
          completedDate: g.targetDate,
          milestone: g.milestone.trim(),
          emoji: g.ranking === '3' ? '🏆' : g.ranking === '2' ? '⭐' : '✅',
        })
      })

    onComplete()
  }

  // Render
  const isFirstStep = step === 0
  const isLastStep = step === TOTAL_STEPS - 1
  const showNav = step > 0 && step < TOTAL_STEPS - 1

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header strip */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-semibold text-text-primary tracking-tight">Money 2026</span>
          {!isFirstStep && !isLastStep && (
            <button
              type="button"
              onClick={onComplete}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Skip setup
            </button>
          )}
        </div>

        {/* Progress (skip on step 0 and last step) */}
        {!isFirstStep && !isLastStep && (
          <ProgressBar step={step - 1} total={TOTAL_STEPS - 2} />
        )}

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-lg">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <StepWelcome onStart={next} onSkip={onComplete} />
          )}

          {/* Step 1: Profile */}
          {step === 1 && (
            <StepProfile
              employment={employment} setEmployment={setEmployment}
              payFrequency={payFrequency} setPayFrequency={setPayFrequency}
            />
          )}

          {/* Step 2: Accounts */}
          {step === 2 && (
            <StepAccounts
              cashAccounts={cashAccounts} investmentAccounts={investmentAccounts} debtAccounts={debtAccounts}
              setCashAccounts={setCashAccounts} setInvestmentAccounts={setInvestmentAccounts} setDebtAccounts={setDebtAccounts}
            />
          )}

          {/* Step 3: Income */}
          {step === 3 && (
            <StepIncome
              salary={salary} setSalary={setSalary}
              bonus={bonus} setBonus={setBonus}
              lti={lti} setLti={setLti}
              taxRate={taxRate} setTaxRate={setTaxRate}
              payFrequency={payFrequency}
            />
          )}

          {/* Step 4: Budget */}
          {step === 4 && (
            <StepBudget
              selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate}
              budgetItems={budgetItems} setBudgetItems={setBudgetItems}
              employment={employment}
            />
          )}

          {/* Step 5: Goals */}
          {step === 5 && (
            <StepGoals goals={goals} setGoals={setGoals} />
          )}

          {/* Step 6: Done */}
          {step === 6 && (
            <StepDone
              cashAccounts={cashAccounts} investmentAccounts={investmentAccounts} debtAccounts={debtAccounts}
              salary={salary} budgetItems={budgetItems} goals={goals}
              onFinish={saveAndFinish}
            />
          )}

          {/* Nav buttons */}
          {showNav && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                type="button"
                onClick={back}
                className="px-5 py-2 border border-border hover:border-border-light text-text-secondary hover:text-text-primary rounded-xl text-sm transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={step === TOTAL_STEPS - 2 ? () => setStep(TOTAL_STEPS - 1) : next}
                className="px-6 py-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl text-sm transition-colors"
              >
                {step === TOTAL_STEPS - 2 ? 'Finish' : 'Next'}
              </button>
            </div>
          )}
        </div>

        {/* Bottom hint */}
        {isFirstStep && (
          <p className="text-center text-xs text-text-muted mt-4">Your data stays local — nothing is sent to any server unless you sign in.</p>
        )}
      </div>
    </div>
  )
}
