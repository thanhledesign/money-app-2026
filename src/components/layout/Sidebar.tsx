import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, Landmark, TrendingUp,
  Skull, Diamond, Scale, Trophy, DollarSign, Settings,
} from 'lucide-react'
import { UserMenu } from '@/components/auth/UserMenu'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/enter', icon: PlusCircle, label: 'Enter Data' },
  { to: '/accounts', icon: Landmark, label: 'Cash Accounts' },
  { to: '/investments', icon: TrendingUp, label: 'Investments' },
  { to: '/debt', icon: Skull, label: 'Debt' },
  { to: '/net-worth', icon: Diamond, label: 'Net Worth' },
  { to: '/income', icon: DollarSign, label: 'Income' },
  { to: '/budget', icon: Scale, label: 'Budget' },
  { to: '/goals', icon: Trophy, label: 'Goals' },
]

interface Props {
  userEmail?: string
  userAvatar?: string
  userName?: string
  onSignOut: () => void
  isLocal: boolean
}

export default function Sidebar({ userEmail, userAvatar, userName, onSignOut, isLocal }: Props) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-surface border-r border-border flex flex-col z-50">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary tracking-tight">Money 2026</h1>
        <p className="text-xs text-text-muted mt-0.5">Financial Dashboard</p>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-accent bg-accent/10 border-r-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              isActive ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-secondary'
            }`
          }
        >
          <Settings size={16} />
          Settings
        </NavLink>
        <UserMenu
          email={userEmail}
          avatarUrl={userAvatar}
          displayName={userName}
          onSignOut={onSignOut}
          isLocal={isLocal}
        />
      </div>
    </aside>
  )
}
