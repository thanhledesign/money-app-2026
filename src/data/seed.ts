import type { Account, Snapshot, CompBreakdown, PaycheckDeduction, PaycheckAllocation, BudgetItem, Goal } from './types'

export const defaultAccounts: Account[] = [
  // Cash accounts
  { id: 'hysa-1', name: 'Maple HYSA', institution: 'Maple Savings Bank', type: 'savings', category: 'cash', isActive: true },
  { id: 'checking-1', name: 'Cornerstone Checking', institution: 'Cornerstone Bank', type: 'checking', category: 'cash', isActive: true },
  { id: 'savings-1', name: 'Cornerstone Savings', institution: 'Cornerstone Bank', type: 'savings', category: 'cash', isActive: true },
  { id: 'checking-2', name: 'Cornerstone Biz Checking', institution: 'Cornerstone Bank', type: 'checking', category: 'cash', isActive: true },
  { id: 'cu-checking', name: 'Horizon CU Checking', institution: 'Horizon Credit Union', type: 'checking', category: 'cash', isActive: true },
  { id: 'cu-savings', name: 'Horizon CU Savings', institution: 'Horizon Credit Union', type: 'savings', category: 'cash', isActive: true },

  // Investment accounts
  { id: 'bond-fund', name: 'Maple Bond Portfolio', institution: 'Maple Savings Bank', type: 'investment', category: 'investment', isActive: true },
  { id: 'brokerage-1', name: 'Summit Brokerage', institution: 'Summit Investments', type: 'brokerage', category: 'investment', isActive: true },
  { id: 'roth-ira', name: 'Summit Roth IRA', institution: 'Summit Investments', type: 'retirement', category: 'investment', isActive: true },
  { id: 'employer-401k', name: 'Employer 401K (Employee)', institution: 'Acme Corp Benefits', type: 'retirement', category: 'investment', isActive: true },
  { id: 'employer-match', name: 'Employer 401K (Match)', institution: 'Acme Corp Benefits', type: 'retirement', category: 'investment', isActive: true },
  { id: 'employer-lti', name: 'Acme Stock Awards (LTI)', institution: 'Acme Corp Benefits', type: 'other', category: 'investment', isActive: true },

  // Debt accounts
  { id: 'cc-rewards', name: 'Pinnacle Rewards Visa', institution: 'Pinnacle Financial', type: 'credit', category: 'debt', creditLimit: 8000, isActive: true },
  { id: 'cc-travel', name: 'Voyager Travel Mastercard', institution: 'Voyager Bank', type: 'credit', category: 'debt', creditLimit: 12000, isActive: true },
  { id: 'cc-cashback', name: 'Thrive Cashback Card', institution: 'Thrive Financial', type: 'credit', category: 'debt', creditLimit: 10000, isActive: true },
]

// $100K salary → ~$4,166.67 gross/semi-monthly → ~$2,850 net after taxes & deductions
export const seedSnapshots: Snapshot[] = [
  {
    id: 's-2026-01-23',
    timestamp: '2026-01-23T18:00:00Z',
    paycheckAmount: 2847.50,
    creditScore: 720,
    balances: {
      'hysa-1': 5200, 'checking-1': 1800, 'savings-1': 1200,
      'checking-2': 500, 'cu-checking': 1500, 'cu-savings': 1500,
      'bond-fund': 800, 'brokerage-1': 4500, 'roth-ira': 6200,
      'employer-401k': 18500, 'employer-match': 9200, 'employer-lti': 3200,
      'cc-rewards': -450, 'cc-travel': -1200, 'cc-cashback': -180,
    }
  },
  {
    id: 's-2026-01-31',
    timestamp: '2026-01-31T06:00:00Z',
    paycheckAmount: 2847.50,
    creditScore: 722,
    balances: {
      'hysa-1': 5600, 'checking-1': 2100, 'savings-1': 1250,
      'checking-2': 520, 'cu-checking': 1500, 'cu-savings': 1500,
      'bond-fund': 810, 'brokerage-1': 4650, 'roth-ira': 6350,
      'employer-401k': 19100, 'employer-match': 9500, 'employer-lti': 3200,
      'cc-rewards': -320, 'cc-travel': -900, 'cc-cashback': -100,
    }
  },
  {
    id: 's-2026-02-14',
    timestamp: '2026-02-14T12:00:00Z',
    paycheckAmount: 2847.50,
    creditScore: 725,
    balances: {
      'hysa-1': 6100, 'checking-1': 1650, 'savings-1': 1300,
      'checking-2': 540, 'cu-checking': 1500, 'cu-savings': 1500,
      'bond-fund': 820, 'brokerage-1': 4800, 'roth-ira': 6500,
      'employer-401k': 19700, 'employer-match': 9800, 'employer-lti': 3400,
      'cc-rewards': -200, 'cc-travel': -650, 'cc-cashback': 0,
    }
  },
  {
    id: 's-2026-02-28',
    timestamp: '2026-02-28T18:00:00Z',
    paycheckAmount: 2847.50,
    creditScore: 728,
    balances: {
      'hysa-1': 6800, 'checking-1': 2300, 'savings-1': 1350,
      'checking-2': 560, 'cu-checking': 1500, 'cu-savings': 1500,
      'bond-fund': 830, 'brokerage-1': 5100, 'roth-ira': 6700,
      'employer-401k': 20300, 'employer-match': 10100, 'employer-lti': 3600,
      'cc-rewards': -150, 'cc-travel': -400, 'cc-cashback': 0,
    }
  },
  {
    id: 's-2026-03-14',
    timestamp: '2026-03-14T12:00:00Z',
    paycheckAmount: 2847.50,
    creditScore: 732,
    balances: {
      'hysa-1': 7400, 'checking-1': 1900, 'savings-1': 1400,
      'checking-2': 580, 'cu-checking': 1500, 'cu-savings': 1500,
      'bond-fund': 840, 'brokerage-1': 5350, 'roth-ira': 6900,
      'employer-401k': 20900, 'employer-match': 10400, 'employer-lti': 3800,
      'cc-rewards': -80, 'cc-travel': -250, 'cc-cashback': 0,
    }
  },
  {
    id: 's-2026-03-28',
    timestamp: '2026-03-28T18:00:00Z',
    paycheckAmount: 2847.50,
    creditScore: 735,
    balances: {
      'hysa-1': 8000, 'checking-1': 2500, 'savings-1': 1450,
      'checking-2': 600, 'cu-checking': 1500, 'cu-savings': 1500,
      'bond-fund': 850, 'brokerage-1': 5600, 'roth-ira': 7100,
      'employer-401k': 21500, 'employer-match': 10700, 'employer-lti': 4000,
      'cc-rewards': 0, 'cc-travel': -100, 'cc-cashback': 0,
    }
  },
  {
    id: 's-2026-04-04',
    timestamp: '2026-04-04T12:00:00Z',
    paycheckAmount: 2847.50,
    creditScore: 738,
    balances: {
      'hysa-1': 8500, 'checking-1': 2200, 'savings-1': 1500,
      'checking-2': 620, 'cu-checking': 1500, 'cu-savings': 1500,
      'bond-fund': 860, 'brokerage-1': 5900, 'roth-ira': 7300,
      'employer-401k': 22100, 'employer-match': 11000, 'employer-lti': 4200,
      'cc-rewards': -350, 'cc-travel': 0, 'cc-cashback': -75,
    }
  },
]

// $100K salary, $10K bonus, $5K LTI
export const defaultComp: CompBreakdown = {
  annualSalary: 100000,
  bonus: 10000,
  ltiPreTax: 5000,
  taxRate: 0.25,
}

// Semi-monthly gross = $4,166.67
export const defaultDeductions: PaycheckDeduction[] = [
  { name: 'Federal Withholding', amount: 520, type: 'tax', isFixed: true },
  { name: 'Social Security', amount: 258, type: 'tax', isFixed: true },
  { name: 'Medicare', amount: 60, type: 'tax', isFixed: true },
  { name: 'State Withholding', amount: 180, type: 'tax', isFixed: true },
  { name: 'Dental', amount: 5, type: 'pretax', isFixed: true },
  { name: 'Medical', amount: 45, type: 'pretax', isFixed: true },
  { name: 'Vision', amount: 2, type: 'pretax', isFixed: true },
  { name: '401K Employee', amount: 250, type: 'pretax', isFixed: false },
]

export const defaultAllocations: PaycheckAllocation[] = [
  { accountId: 'checking-1', percentage: 0.60, adjustability: 'variable' },
  { accountId: 'savings-1', percentage: 0.10, adjustability: 'flexible' },
  { accountId: 'hysa-1', percentage: 0.20, adjustability: 'flexible' },
  { accountId: 'brokerage-1', percentage: 0.10, adjustability: 'flexible' },
]

export const defaultBudgetItems: BudgetItem[] = [
  { id: 'b-rent', name: 'Rent / Mortgage', amount: 1500, tier: 'fixed', category: 'Housing' },
  { id: 'b-internet', name: 'Internet', amount: 70, tier: 'fixed', category: 'Housing' },
  { id: 'b-electric', name: 'Electric / Gas', amount: 120, tier: 'fixed', category: 'Housing' },
  { id: 'b-insurance-rent', name: "Renter's Insurance", amount: 25, tier: 'fixed', category: 'Housing' },
  { id: 'b-car-insurance', name: 'Car Insurance', amount: 150, tier: 'fixed', category: 'Transportation' },
  { id: 'b-gas', name: 'Gas / Transit', amount: 100, tier: 'variable', category: 'Transportation' },
  { id: 'b-phone', name: 'Phone Plan', amount: 50, tier: 'fixed', category: 'Subscriptions' },
  { id: 'b-streaming', name: 'Streaming Services', amount: 35, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-cloud', name: 'Cloud Storage', amount: 10, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-gym', name: 'Gym Membership', amount: 40, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-groceries', name: 'Groceries', amount: 500, tier: 'variable', category: 'Food & Living' },
  { id: 'b-dining', name: 'Dining Out', amount: 200, tier: 'variable', category: 'Food & Living' },
  { id: 'b-personal', name: 'Personal / Misc', amount: 150, tier: 'variable', category: 'Food & Living' },
  { id: 'b-emergency', name: 'Emergency Fund', amount: 500, tier: 'wealth', category: 'Savings' },
  { id: 'b-vacation', name: 'Vacation Fund', amount: 200, tier: 'wealth', category: 'Savings' },
  { id: 'b-investing', name: 'Extra Investing', amount: 300, tier: 'wealth', category: 'Investing' },
]

export const defaultGoals: Goal[] = [
  { id: 'g1', ranking: '3', completedDate: '2025-06-15', milestone: 'Paid off Pinnacle Rewards Visa' },
  { id: 'g2', ranking: '2', completedDate: '2025-09-01', milestone: 'Built $5K emergency fund' },
  { id: 'g3', ranking: '1', completedDate: '2025-11-30', milestone: 'Credit score above 720' },
  { id: 'g4', ranking: '2', completedDate: '2026-01-15', milestone: 'Maxed out 401K match (6%)' },
  { id: 'g5', ranking: '1', completedDate: '2026-03-01', milestone: '$50K net worth milestone' },
  { id: 'g6', ranking: '1', completedDate: '2026-06-30', milestone: '$10K emergency fund target' },
  { id: 'g7', ranking: '2', completedDate: '2026-12-31', milestone: 'Open and fund Roth IRA' },
]
