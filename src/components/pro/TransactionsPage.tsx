import { useState, useMemo } from 'react'
import { Plus, Trash2, Search, Filter, ArrowUpDown } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { NumberInput } from '@/components/ui/NumberInput'
import { formatCurrency } from '@/lib/calculations'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense'
  account?: string
  notes?: string
}

const STORAGE_KEY = 'money-app-transactions'

const DEFAULT_CATEGORIES = [
  'Housing', 'Transportation', 'Food & Dining', 'Groceries', 'Utilities',
  'Subscriptions', 'Entertainment', 'Shopping', 'Health', 'Travel',
  'Education', 'Personal Care', 'Gifts', 'Income', 'Transfer', 'Other',
]

function loadTransactions(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function saveTransactions(txns: Transaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txns))
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState<'' | 'income' | 'expense'>('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [category, setCategory] = useState('Other')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [notes, setNotes] = useState('')

  function addTransaction() {
    if (!description.trim() || amount === 0) return
    const txn: Transaction = {
      id: `txn-${Date.now()}`,
      date,
      description: description.trim(),
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category,
      type,
      notes: notes.trim() || undefined,
    }
    const updated = [txn, ...transactions]
    setTransactions(updated)
    saveTransactions(updated)
    // Reset form
    setDescription('')
    setAmount(0)
    setNotes('')
    setShowForm(false)
  }

  function deleteTransaction(id: string) {
    const updated = transactions.filter(t => t.id !== id)
    setTransactions(updated)
    saveTransactions(updated)
  }

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = [...transactions]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
      )
    }
    if (filterCategory) result = result.filter(t => t.category === filterCategory)
    if (filterType) result = result.filter(t => t.type === filterType)
    result.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'date') return mul * a.date.localeCompare(b.date)
      return mul * (Math.abs(a.amount) - Math.abs(b.amount))
    })
    return result
  }, [transactions, search, filterCategory, filterType, sortBy, sortDir])

  // Summary stats
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
  const netFlow = totalIncome - totalExpenses

  // Category breakdown
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>()
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount))
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [transactions])

  const usedCategories = [...new Set(transactions.map(t => t.category))]

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📒"
        title="Transactions"
        titleKey="transactions"
        subtitle="Track individual transactions for granular insights"
        rightContent={
          <div className="text-right">
            <p className="text-xs text-text-muted mb-0.5">Net Cash Flow</p>
            <p className={`text-2xl font-bold tabular-nums ${netFlow >= 0 ? 'text-green' : 'text-red'}`}>
              {formatCurrency(netFlow)}
            </p>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-text-muted uppercase">Income</p>
          <p className="text-lg font-bold text-green tabular-nums mt-1">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-muted uppercase">Expenses</p>
          <p className="text-lg font-bold text-red tabular-nums mt-1">{formatCurrency(totalExpenses)}</p>
        </Card>
        <Card>
          <p className="text-xs text-text-muted uppercase">Transactions</p>
          <p className="text-lg font-bold text-text-primary tabular-nums mt-1">{transactions.length}</p>
        </Card>
      </div>

      {/* Category breakdown */}
      {categoryTotals.length > 0 && (
        <Card>
          <CardTitle>Spending by Category</CardTitle>
          <div className="mt-3 space-y-2">
            {categoryTotals.slice(0, 8).map(([cat, total]) => {
              const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-text-secondary">{cat}</span>
                    <span className="text-text-primary tabular-nums">{formatCurrency(total)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Add transaction */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
            showForm ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-accent text-white hover:bg-accent-hover'
          }`}
        >
          {showForm ? 'Cancel' : <><Plus size={14} /> Add Transaction</>}
        </button>
      </div>

      {showForm && (
        <Card>
          <CardTitle>New Transaction</CardTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs text-text-muted mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Coffee, rent, paycheck..."
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Amount</label>
              <NumberInput value={amount} onChange={setAmount} label="Amount" />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Type</label>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setType('expense')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                    type === 'expense' ? 'bg-red/20 text-red' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >Expense</button>
                <button
                  onClick={() => setType('income')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
                    type === 'income' ? 'bg-green/20 text-green' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >Income</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary"
              >
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Additional details..."
                className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>
          <button
            onClick={addTransaction}
            disabled={!description.trim() || amount === 0}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover transition-colors disabled:opacity-30"
          >
            Add Transaction
          </button>
        </Card>
      )}

      {/* Filters + search */}
      {transactions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-text-secondary"
          >
            <option value="">All categories</option>
            {usedCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as '' | 'income' | 'expense')}
            className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-text-secondary"
          >
            <option value="">All types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <button
            onClick={() => { setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}
            className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg text-xs text-text-muted hover:text-text-secondary"
          >
            <ArrowUpDown size={12} />
            {sortBy === 'date' ? 'Date' : 'Amount'} {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      )}

      {/* Transaction list */}
      {filtered.length > 0 && (
        <Card>
          <div className="space-y-0">
            {filtered.map(txn => (
              <div key={txn.id} className="flex items-center gap-3 py-3 border-b border-border-light last:border-0 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: txn.type === 'income' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                    color: txn.type === 'income' ? '#34d399' : '#f87171',
                  }}>
                  {txn.type === 'income' ? '+' : '-'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{txn.description}</p>
                  <p className="text-[10px] text-text-muted">
                    {new Date(txn.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}{txn.category}
                    {txn.notes && ` · ${txn.notes}`}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums shrink-0 ${txn.amount >= 0 ? 'text-green' : 'text-red'}`}>
                  {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                </span>
                <button
                  onClick={() => deleteTransaction(txn.id)}
                  className="p-1 text-text-muted hover:text-red opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {transactions.length === 0 && (
        <Card>
          <div className="py-12 text-center">
            <p className="text-3xl mb-3">📒</p>
            <p className="text-sm text-text-primary font-medium">No transactions yet</p>
            <p className="text-xs text-text-muted mt-1">Add your first transaction to start tracking spending at a granular level.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
