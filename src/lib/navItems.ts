import {
  LayoutDashboard, Camera, Landmark, TrendingUp,
  Skull, Diamond, Scale, Trophy, DollarSign, Settings,
  Building2, Home as HomeIcon, Wrench, Receipt,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  icon: LucideIcon
  label: string
}

export interface ProNavItem extends NavItem {
  featureId: string
}

// Primary nav — used in Sidebar AND BottomNav prev/next
export const navItems: NavItem[] = [
  { to: '/enter', icon: Camera, label: 'Add Snapshot' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Landmark, label: 'Cash Accounts' },
  { to: '/investments', icon: TrendingUp, label: 'Investments' },
  { to: '/debt', icon: Skull, label: 'Debt' },
  { to: '/net-worth', icon: Diamond, label: 'Net Worth' },
  { to: '/income', icon: DollarSign, label: 'Income' },
  { to: '/budget', icon: Scale, label: 'Budget' },
  { to: '/goals', icon: Trophy, label: 'Goals' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
]

// Pro features — included in BottomNav jump menu but rendered separately in Sidebar
export const proItems: ProNavItem[] = [
  { to: '/transactions', icon: Receipt, label: 'Transactions', featureId: 'transactions' },
  { to: '/business', icon: Building2, label: 'Business', featureId: 'business' },
  { to: '/properties', icon: HomeIcon, label: 'Properties', featureId: 'properties' },
]

// Settings — last entry, included in jump menu
export const settingsItem: NavItem = { to: '/settings', icon: Settings, label: 'Settings' }

// Full ordered list for BottomNav prev/next walking
export const allNavItems: NavItem[] = [
  ...navItems,
  ...proItems,
  settingsItem,
]
