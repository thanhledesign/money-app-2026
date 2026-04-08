import type { Account, Snapshot, CompBreakdown, PaycheckDeduction, PaycheckAllocation, BudgetItem, Goal } from './types'

export const defaultAccounts: Account[] = [
  { id: 'wf-cash', name: 'Wealthfront Cash Account', institution: 'Wealthfront', type: 'savings', category: 'cash', isActive: true },
  { id: 'wf-checking', name: 'Wells Fargo Checking', institution: 'Wells Fargo', type: 'checking', category: 'cash', isActive: true },
  { id: 'wf-savings', name: 'Wells Fargo Savings', institution: 'Wells Fargo', type: 'savings', category: 'cash', isActive: true },
  { id: 'wf-biz-checking', name: 'Wells Fargo Business Checking', institution: 'Wells Fargo', type: 'checking', category: 'cash', isActive: true },
  { id: 'wf-biz-savings', name: 'Wells Fargo Business Savings', institution: 'Wells Fargo', type: 'savings', category: 'cash', isActive: true },
  { id: 'abefcu-checking', name: 'ABEFCU Checking', institution: 'ABEFCU', type: 'checking', category: 'cash', isActive: true },
  { id: 'abefcu-savings', name: 'ABEFCU Savings', institution: 'ABEFCU', type: 'savings', category: 'cash', isActive: true },
  { id: 'fidelity-cma', name: 'Fidelity CMA', institution: 'Fidelity', type: 'other', category: 'cash', isActive: false },
  { id: 'wf-bond', name: 'Wealthfront Bond Portfolio', institution: 'Wealthfront', type: 'investment', category: 'investment', isActive: true },
  { id: 'saks-401k', name: 'Saks Fifth Avenue HBC 401K', institution: 'Saks', type: 'retirement', category: 'investment', isActive: false },
  { id: 'fidelity-brokerage', name: 'Fidelity Individual Brokerage', institution: 'Fidelity', type: 'brokerage', category: 'investment', isActive: true },
  { id: 'fidelity-roth', name: 'Fidelity ROTH IRA', institution: 'Fidelity', type: 'retirement', category: 'investment', isActive: true },
  { id: 'fidelity-trad', name: 'Fidelity Traditional IRA', institution: 'Fidelity', type: 'retirement', category: 'investment', isActive: false },
  { id: 'disney-401k-sip', name: 'Disney 401K SIP', institution: 'Disney Streaming', type: 'retirement', category: 'investment', isActive: true },
  { id: 'disney-401k-rsp', name: 'Disney 401K Retirement Savings', institution: 'Disney Streaming', type: 'retirement', category: 'investment', isActive: true },
  { id: 'disney-equity', name: 'Disney Equity Brokerage', institution: 'Disney Streaming', type: 'brokerage', category: 'investment', isActive: false },
  { id: 'disney-lti', name: 'Disney Streaming LTI', institution: 'Disney Streaming', type: 'other', category: 'investment', isActive: true },
  { id: 'apple-card', name: 'Apple Card', institution: 'Apple', type: 'credit', category: 'debt', creditLimit: 2300, isActive: true },
  { id: 'capital-one', name: 'Capital One Credit Card', institution: 'Capital One', type: 'credit', category: 'debt', creditLimit: 12000, isActive: true },
  { id: 'chase-sw', name: 'Chase Southwest Credit Card', institution: 'Chase', type: 'credit', category: 'debt', creditLimit: 17300, isActive: true },
  { id: 'discover', name: 'Discover Card', institution: 'Discover', type: 'credit', category: 'debt', creditLimit: 17000, isActive: true },
]

export const seedSnapshots: Snapshot[] = [
  {
    id: 's-2026-01-23',
    timestamp: '2026-01-23T18:12:47Z',
    paycheckAmount: 1740.44,
    creditScore: 770,
    balances: {
      'wf-cash': 11001.14, 'wf-checking': 2329.37, 'wf-savings': 1798.84,
      'wf-biz-checking': 837.10, 'wf-biz-savings': 548.84,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1352.78, 'saks-401k': 30504.48,
      'fidelity-brokerage': 19590.29, 'fidelity-roth': 14530.31, 'fidelity-trad': 0,
      'disney-401k-sip': 90422.28, 'disney-401k-rsp': 44496.66,
      'disney-equity': 7460.41, 'disney-lti': 28868.55,
      'apple-card': -768.15, 'capital-one': 0, 'chase-sw': -5515.63, 'discover': -300,
    }
  },
  {
    id: 's-2026-01-31',
    timestamp: '2026-01-31T06:28:49Z',
    paycheckAmount: 1771.22,
    creditScore: 770,
    balances: {
      'wf-cash': 11443.94, 'wf-checking': 3264.85, 'wf-savings': 1798.84,
      'wf-biz-checking': 881.38, 'wf-biz-savings': 548.84,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1353.22, 'saks-401k': 30598,
      'fidelity-brokerage': 19819.65, 'fidelity-roth': 14594.80, 'fidelity-trad': 0,
      'disney-401k-sip': 92031.89, 'disney-401k-rsp': 44659.20,
      'disney-equity': 7582.35, 'disney-lti': 28764,
      'apple-card': -474.24, 'capital-one': 0, 'chase-sw': -6236.83, 'discover': -300,
    }
  },
  {
    id: 's-2026-02-07',
    timestamp: '2026-02-07T13:18:58Z',
    paycheckAmount: 1781.09,
    creditScore: 770,
    balances: {
      'wf-cash': 4726.33, 'wf-checking': 1906.39, 'wf-savings': 1600.08,
      'wf-biz-checking': 600, 'wf-biz-savings': 545.09,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1354.64, 'saks-401k': 30807.99,
      'fidelity-brokerage': 20125.39, 'fidelity-roth': 14582.10, 'fidelity-trad': 0,
      'disney-401k-sip': 93178.74, 'disney-401k-rsp': 44906.20,
      'disney-equity': 7307.65, 'disney-lti': 68481,
      'apple-card': 0, 'capital-one': 0, 'chase-sw': -243.03, 'discover': 0,
    }
  },
  {
    id: 's-2026-02-14',
    timestamp: '2026-02-14T07:08:48Z',
    paycheckAmount: 1781.10,
    creditScore: 750,
    balances: {
      'wf-cash': 6951.25, 'wf-checking': 923.80, 'wf-savings': 1601.32,
      'wf-biz-checking': 644.53, 'wf-biz-savings': 546.33,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1356.64, 'saks-401k': 30812.49,
      'fidelity-brokerage': 20207.62, 'fidelity-roth': 14386.12, 'fidelity-trad': 0,
      'disney-401k-sip': 93650.91, 'disney-401k-rsp': 44826,
      'disney-equity': 7089.90, 'disney-lti': 66433.50,
      'apple-card': 0, 'capital-one': 0, 'chase-sw': -818.01, 'discover': 0,
    }
  },
  {
    id: 's-2026-02-25',
    timestamp: '2026-02-25T18:10:18Z',
    paycheckAmount: 1781.10,
    creditScore: 750,
    balances: {
      'wf-cash': 7836.85, 'wf-checking': 2874.61, 'wf-savings': 1603.82,
      'wf-biz-checking': 689.06, 'wf-biz-savings': 547.57,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1357.78, 'saks-401k': 30812.49,
      'fidelity-brokerage': 20958.29, 'fidelity-roth': 14624.05, 'fidelity-trad': 0,
      'disney-401k-sip': 95020.47, 'disney-401k-rsp': 45176.41,
      'disney-equity': 7063.10, 'disney-lti': 66811.50,
      'apple-card': 0, 'capital-one': 0, 'chase-sw': -2509.70, 'discover': 0,
    }
  },
  {
    id: 's-2026-02-27',
    timestamp: '2026-02-27T05:26:05Z',
    paycheckAmount: 1781.10,
    creditScore: 750,
    balances: {
      'wf-cash': 7836.85, 'wf-checking': 2874.61, 'wf-savings': 1603.82,
      'wf-biz-checking': 733.59, 'wf-biz-savings': 548.81,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1357.87, 'saks-401k': 0,
      'fidelity-brokerage': 20890.13, 'fidelity-roth': 14545.98, 'fidelity-trad': 0,
      'disney-401k-sip': 117195.96, 'disney-401k-rsp': 45247.47,
      'disney-equity': 7104.64, 'disney-lti': 66496.50,
      'apple-card': 0, 'capital-one': 0, 'chase-sw': -2564.24, 'discover': 0,
    }
  },
  {
    id: 's-2026-03-14',
    timestamp: '2026-03-14T10:06:01Z',
    paycheckAmount: 1781.10,
    creditScore: 773,
    balances: {
      'wf-cash': 9188.60, 'wf-checking': 1341.74, 'wf-savings': 1606.30,
      'wf-biz-checking': 778.45, 'wf-biz-savings': 551.29,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1349.79, 'saks-401k': 0,
      'fidelity-brokerage': 20391.54, 'fidelity-roth': 13974.68, 'fidelity-trad': 0,
      'disney-401k-sip': 112775.76, 'disney-401k-rsp': 43051.57,
      'disney-equity': 7104.64, 'disney-lti': 62552.70,
      'apple-card': 0, 'capital-one': 0, 'chase-sw': -2965.45, 'discover': 0,
    }
  },
  {
    id: 's-2026-03-25',
    timestamp: '2026-03-25T18:30:14Z',
    paycheckAmount: 1781.10,
    creditScore: 773,
    balances: {
      'wf-cash': 10074.20, 'wf-checking': 3089.41, 'wf-savings': 1830.19,
      'wf-biz-checking': 799.98, 'wf-biz-savings': 552.53,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1352.07, 'saks-401k': 0,
      'fidelity-brokerage': 27962.15, 'fidelity-roth': 13894.19, 'fidelity-trad': 0,
      'disney-401k-sip': 112492.31, 'disney-401k-rsp': 42697.19,
      'disney-equity': 0, 'disney-lti': 60725.70,
      'apple-card': 0, 'capital-one': 0, 'chase-sw': -4041.85, 'discover': 0,
    }
  },
  {
    id: 's-2026-04-04',
    timestamp: '2026-04-04T01:00:17Z',
    paycheckAmount: 1781.09,
    creditScore: 773,
    balances: {
      'wf-cash': 10542.61, 'wf-checking': 1706.43, 'wf-savings': 1610.03,
      'wf-biz-checking': 874.04, 'wf-biz-savings': 555.01,
      'abefcu-checking': 2500, 'abefcu-savings': 2500, 'fidelity-cma': 0,
      'wf-bond': 1354.90, 'saks-401k': 0,
      'fidelity-brokerage': 28188.81, 'fidelity-roth': 13878.45, 'fidelity-trad': 0,
      'disney-401k-sip': 114609.04, 'disney-401k-rsp': 43007.29,
      'disney-equity': 0, 'disney-lti': 60864.30,
      'apple-card': 0, 'capital-one': 0, 'chase-sw': -5048.34, 'discover': 0,
    }
  },
]

export const defaultComp: CompBreakdown = {
  annualSalary: 174709,
  bonus: 50200,
  ltiPreTax: 42427,
  taxRate: 0.290207,
}

export const defaultDeductions: PaycheckDeduction[] = [
  { name: 'FED Withholding', amount: 444.81, type: 'tax', isFixed: true },
  { name: 'FED Social Security', amount: 206.70, type: 'tax', isFixed: true },
  { name: 'FED Medicare Tax', amount: 48.35, type: 'tax', isFixed: true },
  { name: 'NY Withholding', amount: 153.57, type: 'tax', isFixed: true },
  { name: 'NY EE Family', amount: 14.52, type: 'tax', isFixed: true },
  { name: 'NY Disability', amount: 0.60, type: 'tax', isFixed: true },
  { name: 'CITY Withholding', amount: 106.48, type: 'tax', isFixed: true },
  { name: 'Dental Pre-Tax', amount: 2, type: 'pretax', isFixed: true },
  { name: 'Medical Pre-Tax', amount: 30, type: 'pretax', isFixed: true },
  { name: 'Vision Pre-Tax', amount: 0.50, type: 'pretax', isFixed: true },
  { name: '401k Salary EE', amount: 571.16, type: 'pretax', isFixed: false },
]

export const defaultAllocations: PaycheckAllocation[] = [
  { accountId: 'wf-checking', percentage: 0.60, adjustability: 'variable' },
  { accountId: 'wf-savings', percentage: 0.125, adjustability: 'flexible' },
  { accountId: 'wf-biz-checking', percentage: 0.025, adjustability: 'flexible' },
  { accountId: 'wf-biz-savings', percentage: 0.125, adjustability: 'flexible' },
  { accountId: 'fidelity-brokerage', percentage: 0.125, adjustability: 'flexible' },
]

export const defaultBudgetItems: BudgetItem[] = [
  { id: 'b-rent', name: 'Rent', amount: 2035, tier: 'fixed', category: 'Housing' },
  { id: 'b-internet', name: 'Spectrum Internet', amount: 110, tier: 'fixed', category: 'Housing' },
  { id: 'b-electric', name: 'ConEd Electricity', amount: 150, tier: 'fixed', category: 'Housing' },
  { id: 'b-renters', name: "Renter's Insurance", amount: 50, tier: 'fixed', category: 'Housing' },
  { id: 'b-car', name: 'Car Insurance', amount: 175, tier: 'fixed', category: 'Transportation' },
  { id: 'b-icloud', name: 'iCloud', amount: 15, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-gsuite', name: 'GSuite', amount: 15, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-figma', name: 'Figma', amount: 18, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-adobe', name: 'Adobe CC', amount: 75, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-squarespace', name: 'Squarespace', amount: 16, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-godaddy', name: 'GoDaddy', amount: 25, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-chatgpt', name: 'ChatGPT', amount: 21.78, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-copilot', name: 'Copilot (Money)', amount: 8, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-discord', name: 'Discord Nitro', amount: 8.50, tier: 'variable', category: 'Subscriptions' },
  { id: 'b-food', name: 'Food', amount: 1000, tier: 'variable', category: 'Food & Living' },
  { id: 'b-emergency', name: 'Emergency Fund ($50K Target)', amount: 4166.67, tier: 'wealth', category: 'Savings' },
  { id: 'b-downpayment', name: 'Home Down Payment ($25K Target)', amount: 2083.33, tier: 'wealth', category: 'Savings' },
  { id: 'b-investing', name: 'Investing', amount: 0, tier: 'wealth', category: 'Investing' },
]

export const defaultGoals: Goal[] = [
  { id: 'g1', ranking: '3', completedDate: '2024-12-14', milestone: 'Paid off Chase CC ($10,769.61)' },
  { id: 'g2', ranking: '3', completedDate: '2024-12-14', milestone: 'Paid off Discover CC ($11,774.00)' },
  { id: 'g3', ranking: '2', completedDate: '2024-12-15', milestone: 'Paid ~50% Capital One CC ($5300.53)' },
  { id: 'g4', ranking: '1', completedDate: '2024-12-15', milestone: 'Increase 401k contributions (From 4% to 6%)' },
  { id: 'g5', ranking: '1', completedDate: '2024-12-15', milestone: 'Divvy up paychecks to auto split into 401k, 4 bank accounts via direct deposit' },
  { id: 'g6', ranking: '1', completedDate: '2025-01-20', milestone: 'Credit Score 700 (+50 by EOY)' },
  { id: 'g7', ranking: '3', completedDate: '2025-01-24', milestone: 'Paid off Capital One CC' },
  { id: 'g8', ranking: '3', completedDate: '2025-02-07', milestone: 'Debt Free' },
  { id: 'g9', ranking: '2', completedDate: '2025-05-04', milestone: '15% 401K contribution' },
  { id: 'g10', ranking: '2', completedDate: '2025-05-04', milestone: '4% contributions to ROTH IRA (2025)' },
  { id: 'g11', ranking: '2', completedDate: '2025-05-09', milestone: '$125K 401K & Portfolio Milestone' },
  { id: 'g12', ranking: '1', completedDate: '2025-05-31', milestone: '$150K Net Worth' },
  { id: 'g13', ranking: '2', completedDate: '2025-10-31', milestone: '$200K Net Worth' },
]
