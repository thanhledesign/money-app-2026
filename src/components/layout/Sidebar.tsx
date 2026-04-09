import { useState, useCallback, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Camera, Landmark, TrendingUp,
  Skull, Diamond, Scale, Trophy, DollarSign, Settings,
  Menu, X, Building2, Home as HomeIcon, Wrench,
} from 'lucide-react'
import type { Dashboard } from '@/data/types'
import { UserMenu } from '@/components/auth/UserMenu'
import { DashboardSwitcher } from '@/components/dashboard/DashboardSwitcher'
import { CreateDashboardModal } from '@/components/dashboard/CreateDashboardModal'

const navItems = [
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

const proItems = [
  { to: '/business', icon: Building2, label: 'Business', pro: true },
  { to: '/properties', icon: HomeIcon, label: 'Properties', pro: true },
]

interface Props {
  userEmail?: string
  userAvatar?: string
  userName?: string
  onSignOut: () => void
  onSignIn?: () => void
  isLocal: boolean
  width: number
  onWidthChange: (w: number) => void
  dashboards: Dashboard[]
  activeId: string
  activeDashboard?: Dashboard
  canCreateDashboard: boolean
  onSwitchDashboard: (id: string) => void
  onCreateDashboard: (d: Dashboard) => void
  onDeleteDashboard: (id: string) => void
  onRenameDashboard: (id: string, name: string, emoji: string) => void
  onDuplicateDashboard: (id: string) => void
}

export default function Sidebar({
  userEmail, userAvatar, userName, onSignOut, onSignIn, isLocal,
  width, onWidthChange,
  dashboards, activeId, canCreateDashboard,
  onSwitchDashboard, onCreateDashboard, onDeleteDashboard, onRenameDashboard, onDuplicateDashboard,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const location = useLocation()

  const closeMobile = () => setMobileOpen(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width
  }, [width])

  useEffect(() => {
    if (!isResizing) return
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current
      onWidthChange(startWidthRef.current + delta)
    }
    const handleMouseUp = () => setIsResizing(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, onWidthChange])

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-text-primary tracking-tight truncate">Money 2026</h1>
          <p className="text-xs text-text-muted mt-0.5 truncate">Financial Dashboard</p>
        </div>
        <button
          type="button"
          onClick={closeMobile}
          className="lg:hidden p-1 text-text-muted hover:text-text-primary flex-shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      {/* Dashboard Switcher */}
      <DashboardSwitcher
        dashboards={dashboards}
        activeId={activeId}
        canCreate={canCreateDashboard}
        onSwitch={(id) => { onSwitchDashboard(id); closeMobile() }}
        onCreateClick={() => setShowCreateModal(true)}
        onDelete={onDeleteDashboard}
        onRename={onRenameDashboard}
        onDuplicate={onDuplicateDashboard}
      />

      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-accent bg-accent/10 border-r-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}

        <div className="px-4 pt-4 pb-1">
          <p className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1">
            Pro Features
            <span className="px-1.5 py-0.5 text-[8px] bg-amber/10 text-amber rounded-full border border-amber/20">Free Preview</span>
          </p>
        </div>
        {proItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'text-amber bg-amber/10 border-r-2 border-amber'
                  : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <NavLink
          to="/settings"
          onClick={closeMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
              isActive ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-secondary'
            }`
          }
        >
          <Settings size={16} className="flex-shrink-0" />
          <span className="truncate">Settings</span>
        </NavLink>
        <UserMenu
          email={userEmail}
          avatarUrl={userAvatar}
          displayName={userName}
          onSignOut={onSignOut}
          onSignIn={onSignIn}
          isLocal={isLocal}
        />
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface/90 backdrop-blur-lg border-b border-border/50 flex items-center px-4 z-50">
        <button type="button" onClick={() => setMobileOpen(true)} className="p-1 text-text-secondary">
          <Menu size={24} />
        </button>
        <h1 className="ml-3 text-sm font-semibold text-text-primary">Money 2026</h1>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={closeMobile} />
          <aside className="relative w-64 h-full bg-surface border-r border-border flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 h-screen border-r border-border/50 flex-col z-50 backdrop-blur-xl"
        style={{ width, background: 'linear-gradient(180deg, var(--color-surface) 0%, color-mix(in oklab, var(--color-surface) 90%, transparent) 100%)' }}
      >
        {sidebarContent}
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={() => onWidthChange(224)}
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-accent/40 ${
            isResizing ? 'bg-accent/60' : 'bg-transparent'
          }`}
        />
      </aside>

      {/* Create Dashboard Modal */}
      {showCreateModal && (
        <CreateDashboardModal
          dashboards={dashboards}
          onClose={() => setShowCreateModal(false)}
          onCreate={onCreateDashboard}
        />
      )}
    </>
  )
}
