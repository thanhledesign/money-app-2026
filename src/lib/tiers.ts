// Tier system — foundation for monetization
// Currently all users get 'free'. When Stripe/payment is added,
// upgrade the tier in Supabase user metadata.

export type Tier = 'free' | 'pro' | 'premium'

export interface TierConfig {
  name: string
  price: string
  badge: string
  color: string
  features: string[]
}

export const TIER_CONFIGS: Record<Tier, TierConfig> = {
  free: {
    name: 'Free',
    price: '$0',
    badge: 'Free',
    color: '#9090a8',
    features: [
      'Up to 3 dashboards',
      '5 built-in background themes',
      'All core pages (Dashboard, Accounts, Income, Budget, Goals)',
      'Basic tools (Debt Fighter, Safety Net)',
      'Cloud sync for 1 dashboard',
      'Light/dark mode',
    ],
  },
  pro: {
    name: 'Pro',
    price: '$8/mo',
    badge: 'PRO',
    color: '#7c6ff7',
    features: [
      'Everything in Free',
      'Transaction Tracker — granular expense logging',
      'Unlimited dashboards',
      'Photo backgrounds + custom upload + URL',
      'Cloud sync all dashboards & settings',
      'Paycheck X-Ray full breakdown with charts',
      'Share dashboard links',
      'Custom themes + CSS injection',
      'Advanced tool exports (CSV)',
    ],
  },
  premium: {
    name: 'Premium',
    price: '$20/mo',
    badge: 'PREMIUM',
    color: '#fbbf24',
    features: [
      'Everything in Pro',
      'Business page — LLC & freelance income',
      'Properties page — real estate portfolio',
      'Priority real-time sync',
      'Multi-user household dashboards',
      'PDF export for accountants',
      'API integrations (coming soon)',
    ],
  },
}

// Feature gates — maps feature IDs to minimum required tier
export const FEATURE_GATES: Record<string, Tier> = {
  // Pro features
  'transactions': 'pro',
  'unlimited-dashboards': 'pro',
  'photo-backgrounds': 'pro',
  'custom-upload-bg': 'pro',
  'cloud-sync-all': 'pro',
  'paycheck-xray-full': 'pro',
  'share-links': 'pro',
  'custom-themes': 'pro',
  'tool-exports': 'pro',

  // Premium features
  'business': 'premium',
  'properties': 'premium',
  'multi-user': 'premium',
  'pdf-export': 'premium',
  'api-integrations': 'premium',
}

const TIER_ORDER: Tier[] = ['free', 'pro', 'premium']

export function tierRank(tier: Tier): number {
  return TIER_ORDER.indexOf(tier)
}

export function hasAccess(userTier: Tier, requiredTier: Tier): boolean {
  return tierRank(userTier) >= tierRank(requiredTier)
}

export function canUseFeature(userTier: Tier, featureId: string): boolean {
  const required = FEATURE_GATES[featureId]
  if (!required) return true // ungated feature
  return hasAccess(userTier, required)
}

export function getRequiredTier(featureId: string): Tier {
  return FEATURE_GATES[featureId] ?? 'free'
}

// Get user tier — currently always 'free', but ready for Supabase/Stripe
const TIER_STORAGE_KEY = 'money-app-user-tier'

export function getUserTier(userId?: string): Tier {
  // Admin override — thethanhster gets premium
  if (userId === 'admin' || typeof window !== 'undefined') {
    const override = localStorage.getItem(TIER_STORAGE_KEY)
    if (override && TIER_ORDER.includes(override as Tier)) {
      return override as Tier
    }
  }
  return 'free'
}

export function setUserTier(tier: Tier): void {
  localStorage.setItem(TIER_STORAGE_KEY, tier)
}
