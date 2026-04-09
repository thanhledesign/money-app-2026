import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import type { Dashboard } from '@/data/types'
import Sidebar from './Sidebar'

const SIDEBAR_KEY = 'money-app-sidebar-width'
const DEFAULT_WIDTH = 224
const MIN_WIDTH = 180
const MAX_WIDTH = 360

function loadWidth(): number {
  const raw = localStorage.getItem(SIDEBAR_KEY)
  if (raw) {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= MIN_WIDTH && n <= MAX_WIDTH) return n
  }
  return DEFAULT_WIDTH
}

interface Props {
  userEmail?: string
  userAvatar?: string
  userName?: string
  onSignOut: () => void
  onSignIn?: () => void
  isLocal: boolean
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

export default function Layout({
  userEmail, userAvatar, userName, onSignOut, onSignIn, isLocal,
  dashboards, activeId, activeDashboard, canCreateDashboard,
  onSwitchDashboard, onCreateDashboard, onDeleteDashboard, onRenameDashboard, onDuplicateDashboard,
}: Props) {
  const [sidebarWidth, setSidebarWidth] = useState(loadWidth)

  const handleWidthChange = useCallback((w: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w))
    setSidebarWidth(clamped)
    localStorage.setItem(SIDEBAR_KEY, String(clamped))
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userEmail={userEmail}
        userAvatar={userAvatar}
        userName={userName}
        onSignOut={onSignOut}
        onSignIn={onSignIn}
        isLocal={isLocal}
        width={sidebarWidth}
        onWidthChange={handleWidthChange}
        dashboards={dashboards}
        activeId={activeId}
        activeDashboard={activeDashboard}
        canCreateDashboard={canCreateDashboard}
        onSwitchDashboard={onSwitchDashboard}
        onCreateDashboard={onCreateDashboard}
        onDeleteDashboard={onDeleteDashboard}
        onRenameDashboard={onRenameDashboard}
        onDuplicateDashboard={onDuplicateDashboard}
      />
      <main
        className="flex-1 pt-16 lg:pt-6 p-4 lg:p-6 max-w-[1200px] w-full"
        style={{ marginLeft: undefined }}
      >
        <div className="hidden lg:block" style={{ marginLeft: sidebarWidth }} />
        {/* Sample dashboard banner */}
        {activeId === 'sample' && (
          <div className="mb-4 px-4 py-2 bg-amber/10 border border-amber/30 rounded-lg text-xs text-amber">
            Sample data — this dashboard uses demo data to show how the app works. Your real data lives in other dashboards.
          </div>
        )}
        {/* Combined dashboard read-only banner */}
        {activeDashboard?.mode === 'combined' && (
          <div className="mb-4 px-4 py-2 bg-purple/10 border border-purple/30 rounded-lg text-xs text-purple">
            Combined view — showing merged data from {activeDashboard.mergeIds?.length ?? 0} dashboards (read-only)
          </div>
        )}
        <Outlet />
      </main>
      <style>{`@media (min-width: 1024px) { main { margin-left: ${sidebarWidth}px !important; } }`}</style>
    </div>
  )
}
