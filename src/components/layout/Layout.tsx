import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

interface Props {
  userEmail?: string
  userAvatar?: string
  userName?: string
  onSignOut: () => void
  isLocal: boolean
}

export default function Layout({ userEmail, userAvatar, userName, onSignOut, isLocal }: Props) {
  return (
    <div className="flex min-h-screen">
      <Sidebar
        userEmail={userEmail}
        userAvatar={userAvatar}
        userName={userName}
        onSignOut={onSignOut}
        isLocal={isLocal}
      />
      <main className="flex-1 md:ml-56 pt-16 md:pt-0 p-4 md:p-6 max-w-[1200px] w-full">
        <Outlet />
      </main>
    </div>
  )
}
