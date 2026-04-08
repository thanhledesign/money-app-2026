export interface Account {
  id: string
  name: string
  institution: string
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'retirement' | 'brokerage' | 'other'
  category: 'cash' | 'investment' | 'debt'
  creditLimit?: number
  isActive: boolean
}

export interface Snapshot {
  id: string
  timestamp: string
  paycheckAmount: number | null
  balances: Record<string, number>
  creditScore: number | null
  notes?: string
}

export interface CompBreakdown {
  annualSalary: number
  bonus: number
  ltiPreTax: number
  taxRate: number
}

export interface PaycheckDeduction {
  name: string
  amount: number
  type: 'tax' | 'pretax' | 'posttax'
  isFixed: boolean
}

export interface PaycheckAllocation {
  accountId: string
  percentage: number
  adjustability: 'fixed' | 'flexible' | 'variable'
}

export interface BudgetItem {
  id: string
  name: string
  amount: number
  tier: 'fixed' | 'variable' | 'wealth' | 'optional'
  category: string
}

export interface Goal {
  id: string
  ranking: string
  completedDate: string
  milestone: string
}

export interface MonthlyBudgetActual {
  month: string
  itemId: string
  actual: number
}

export interface AppData {
  accounts: Account[]
  snapshots: Snapshot[]
  comp: CompBreakdown
  deductions: PaycheckDeduction[]
  allocations: PaycheckAllocation[]
  budgetItems: BudgetItem[]
  goals: Goal[]
  budgetActuals: MonthlyBudgetActual[]
  payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
  paychecksPerMonth: number[]
}
