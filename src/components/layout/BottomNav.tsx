import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation, NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react'
import { allNavItems, navItems, proItems, settingsItem, type NavItem } from '@/lib/navItems'
import { getUserTier, canUseFeature } from '@/lib/tiers'

// Pages where the bottom nav should NOT show
const HIDDEN_ROUTES = ['/enter']

function findIndex(pathname: string): number {
  // Exact match for root, prefix match for others
  if (pathname === '/') return allNavItems.findIndex(n => n.to === '/')
  return allNavItems.findIndex(n => n.to !== '/' && pathname.startsWith(n.to))
}

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [jumpOpen, setJumpOpen] = useState(false)

  // Hide on certain routes
  if (HIDDEN_ROUTES.includes(pathname)) return null

  const currentIdx = findIndex(pathname)
  if (currentIdx === -1) return null

  const prev: NavItem | null = currentIdx > 0 ? allNavItems[currentIdx - 1] : null
  const next: NavItem | null = currentIdx < allNavItems.length - 1 ? allNavItems[currentIdx + 1] : null
  const current = allNavItems[currentIdx]

  return (
    <>
      <nav
        className="mt-10 mb-4 lg:mb-2 flex items-stretch gap-2"
        aria-label="Page navigation"
      >
        {/* Previous */}
        {prev ? (
          <button
            onClick={() => navigate(prev.to)}
            className="flex-1 group flex items-center gap-2 px-3 py-3 rounded-xl border border-border/40 bg-surface/40 backdrop-blur-md hover:bg-surface-hover/60 hover:border-accent/40 transition-all text-left min-w-0"
            title={`Previous: ${prev.label}`}
            aria-label={`Previous page: ${prev.label}`}
          >
            <ChevronLeft size={16} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Previous</div>
              <div className="text-xs font-medium text-text-secondary group-hover:text-text-primary truncate">{prev.label}</div>
            </div>
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {/* Jump menu trigger */}
        <button
          onClick={() => setJumpOpen(true)}
          className="px-4 py-3 rounded-xl border border-border/40 bg-surface/40 backdrop-blur-md hover:bg-surface-hover/60 hover:border-accent/40 transition-all flex items-center gap-2 text-text-muted hover:text-accent"
          title="Jump to page"
          aria-label="Open page menu"
        >
          <LayoutGrid size={14} />
          <span className="text-[11px] font-medium hidden sm:inline">
            {currentIdx + 1} / {allNavItems.length}
          </span>
        </button>

        {/* Next */}
        {next ? (
          <button
            onClick={() => navigate(next.to)}
            className="flex-1 group flex items-center justify-end gap-2 px-3 py-3 rounded-xl border border-border/40 bg-surface/40 backdrop-blur-md hover:bg-surface-hover/60 hover:border-accent/40 transition-all text-right min-w-0"
            title={`Next: ${next.label}`}
            aria-label={`Next page: ${next.label}`}
          >
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-text-muted">Next</div>
              <div className="text-xs font-medium text-text-secondary group-hover:text-text-primary truncate">{next.label}</div>
            </div>
            <ChevronRight size={16} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </nav>

      {/* Jump Menu Modal */}
      {jumpOpen && <JumpMenu currentPath={current.to} onClose={() => setJumpOpen(false)} />}
    </>
  )
}

interface JumpMenuProps {
  currentPath: string
  onClose: () => void
}

function JumpMenu({ currentPath, onClose }: JumpMenuProps) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const userTier = useMemo(() => getUserTier(), [])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-surface/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl"
        role="dialog"
        aria-label="Jump to page"
      >
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-xl flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h3 className="text-sm font-semibold text-text-primary">Jump to page</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                end={to === '/'}
                className={() =>
                  `flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                    currentPath === to
                      ? 'bg-accent/15 border-accent/40 text-accent'
                      : 'bg-surface/40 border-border/30 text-text-secondary hover:bg-surface-hover hover:border-accent/30 hover:text-text-primary'
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-[11px] font-medium">{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-border/30">
            <p className="text-[10px] text-text-muted uppercase tracking-wider px-1 mb-2">Pro Features</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {proItems.map(({ to, icon: Icon, label, featureId }) => {
                const locked = !canUseFeature(userTier, featureId)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={() =>
                      `flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                        currentPath === to
                          ? 'bg-amber/15 border-amber/40 text-amber'
                          : 'bg-surface/40 border-border/30 text-text-muted hover:bg-surface-hover hover:border-amber/30 hover:text-text-secondary'
                      } ${locked ? 'opacity-60' : ''}`
                    }
                  >
                    <Icon size={18} />
                    <span className="text-[11px] font-medium">{label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/30">
            <NavLink
              to={settingsItem.to}
              onClick={onClose}
              className={() =>
                `flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                  currentPath === settingsItem.to
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`
              }
            >
              <settingsItem.icon size={16} />
              <span className="text-xs font-medium">{settingsItem.label}</span>
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  )
}
