import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const SIDEBAR_KEY = 'money-app-sidebar-width'
const DEFAULT_WIDTH = 224 // w-56
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
}

export default function Layout({ userEmail, userAvatar, userName, onSignOut, onSignIn, isLocal }: Props) {
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
      />
      <main
        className="flex-1 pt-16 md:pt-0 p-4 md:p-6 max-w-[1200px] w-full"
        style={{ marginLeft: undefined }}
      >
        <div className="hidden md:block" style={{ marginLeft: sidebarWidth }} />
        <Outlet />
      </main>
      {/* Spacer for desktop sidebar */}
      <style>{`@media (min-width: 768px) { main { margin-left: ${sidebarWidth}px !important; } }`}</style>
    </div>
  )
}
