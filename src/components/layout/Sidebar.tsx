import { useState, useCallback, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Camera, Landmark, TrendingUp,
  Skull, Diamond, Scale, Trophy, DollarSign, Settings,
  Menu, X, Building2, Home as HomeIcon, Wrench, Receipt,
} from 'lucide-react'
import type { Dashboard } from '@/data/types'
import { UserMenu } from '@/components/auth/UserMenu'
import { DashboardSwitcher } from '@/components/dashboard/DashboardSwitcher'
import { CreateDashboardModal } from '@/components/dashboard/CreateDashboardModal'
import { FeatureBadge } from '@/components/ui/UpgradeGate'
import { getUserTier, canUseFeature } from '@/lib/tiers'

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
  { to: '/transactions', icon: Receipt, label: 'Transactions', featureId: 'transactions' },
  { to: '/business', icon: Building2, label: 'Business', featureId: 'business' },
  { to: '/properties', icon: HomeIcon, label: 'Properties', featureId: 'properties' },
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
  const sidebarRef = useRef<HTMLElement>(null)

  // Fix sidebar height on iOS Safari where CSS vh/dvh doesn't work reliably
  useEffect(() => {
    const updateHeight = () => {
      if (sidebarRef.current) {
        const h = window.visualViewport?.height ?? window.innerHeight
        sidebarRef.current.style.height = `${h}px`
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    window.visualViewport?.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
      window.visualViewport?.removeEventListener('resize', updateHeight)
    }
  }, [])
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
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-text-primary tracking-tight truncate">Money 2026</h1>
            <p className="text-xs text-text-muted mt-0.5 truncate">Financial Dashboard</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <NavLink
              to="/settings"
              onClick={closeMobile}
              className={({ isActive }) =>
                `p-1.5 rounded-lg transition-colors ${isActive ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-secondary'}`
              }
              title="Settings"
            >
              <Settings size={16} />
            </NavLink>
            <button
              type="button"
              onClick={closeMobile}
              className="lg:hidden p-1 text-text-muted hover:text-text-primary"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        {/* User status */}
        <div className="mt-2">
          <UserMenu
            email={userEmail}
            avatarUrl={userAvatar}
            displayName={userName}
            onSignOut={onSignOut}
            onSignIn={onSignIn}
            isLocal={isLocal}
          />
        </div>
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

      <nav className="flex-1 min-h-0 py-2 overflow-y-auto">
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
          <p className="text-[10px] text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            Pro Features
            <span className="px-1.5 py-0.5 text-[8px] bg-accent/15 text-accent rounded-full border border-accent/25">Beta — Free</span>
          </p>
        </div>
        {proItems.map(({ to, icon: Icon, label, featureId }) => {
          const userTier = getUserTier()
          return (
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
              <FeatureBadge featureId={featureId} userTier={userTier} />
              {canUseFeature(userTier, featureId) && (
                <span className="px-1 py-0.5 text-[7px] font-bold uppercase rounded bg-accent/10 text-accent/70 border border-accent/15">
                  {featureId === 'business' || featureId === 'properties' ? 'Premium' : 'Pro'}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

    </>
  )

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface/90 backdrop-blur-lg border-b border-border/50 flex items-center px-4 z-50">
        <button type="button" onClick={() => setMobileOpen(true)} className="p-1 text-text-secondary" aria-label="Open menu">
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
        ref={sidebarRef}
        className="hidden lg:flex fixed left-0 top-0 sidebar-height border-r border-border/50 flex-col z-50 backdrop-blur-xl overflow-hidden"
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
