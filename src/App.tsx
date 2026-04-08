import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAppData } from '@/hooks/useAppData'
import { useChartPrefs } from '@/hooks/useChartPrefs'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/layout/Layout'
import { LoginPage } from '@/components/auth/LoginPage'
import DashboardPage from '@/components/dashboard/DashboardPage'
import EntryPage from '@/components/entry/EntryPage'
import AccountsPage from '@/components/accounts/AccountsPage'
import InvestmentsPage from '@/components/investments/InvestmentsPage'
import DebtPage from '@/components/debt/DebtPage'
import NetWorthPage from '@/components/networth/NetWorthPage'
import { IncomePage } from '@/components/income/IncomePage'
import { BudgetPage } from '@/components/budget/BudgetPage'
import { GoalsPage } from '@/components/goals/GoalsPage'
import SettingsPage from '@/components/settings/SettingsPage'
import BusinessPage from '@/components/pro/BusinessPage'
import PropertiesPage from '@/components/pro/PropertiesPage'
import { AdminDesigner } from '@/components/ui/AdminDesigner'
import ToolsPage from '@/components/tools/ToolsPage'

export default function App() {
  const auth = useAuth()
  const [skippedLogin, setSkippedLogin] = useState(() => {
    return localStorage.getItem('money-app-skipped-login') === 'true'
  })

  const {
    data, addSnapshot, deleteSnapshot, addGoal,
    addAccount, updateAccounts,
    updateComp, updateDeductions, updateAllocations, updateBudgetItems,
  } = useAppData()

  const { prefs, update: updatePrefs, setAccountColor, setLabelColor, reset: resetPrefs } = useChartPrefs()

  // Show login if not authenticated and hasn't skipped
  if (auth.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    )
  }

  if (!auth.isAuthenticated && !skippedLogin) {
    return (
      <LoginPage
        onSignInWithGoogle={auth.signInWithGoogle}
        configured={auth.configured}
        onSkip={() => {
          localStorage.setItem('money-app-skipped-login', 'true')
          setSkippedLogin(true)
        }}
      />
    )
  }

  const isLocal = !auth.isAuthenticated

  return (
    <>
    <AdminDesigner />
    <Routes>
      <Route element={
        <Layout
          userEmail={auth.user?.email}
          userAvatar={auth.user?.user_metadata?.avatar_url}
          userName={auth.user?.user_metadata?.full_name}
          onSignOut={auth.signOut}
          isLocal={isLocal}
        />
      }>
        <Route index element={<DashboardPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} />} />
        <Route path="enter" element={<EntryPage data={data} addSnapshot={addSnapshot} deleteSnapshot={deleteSnapshot} addAccount={addAccount} updateAccounts={updateAccounts} />} />
        <Route path="accounts" element={<AccountsPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} addAccount={addAccount} updateAccounts={updateAccounts} />} />
        <Route path="investments" element={<InvestmentsPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} addAccount={addAccount} updateAccounts={updateAccounts} />} />
        <Route path="debt" element={<DebtPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} addAccount={addAccount} updateAccounts={updateAccounts} />} />
        <Route path="net-worth" element={<NetWorthPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} addAccount={addAccount} updateAccounts={updateAccounts} />} />
        <Route path="income" element={
          <IncomePage data={data} updateComp={updateComp}
            updateDeductions={updateDeductions} updateAllocations={updateAllocations} />
        } />
        <Route path="budget" element={<BudgetPage data={data} updateBudgetItems={updateBudgetItems} />} />
        <Route path="goals" element={<GoalsPage data={data} addGoal={addGoal} />} />
        <Route path="business" element={<BusinessPage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="settings" element={
          <SettingsPage data={data} prefs={prefs}
            setAccountColor={setAccountColor} setLabelColor={setLabelColor}
            onUpdatePrefs={updatePrefs} resetPrefs={resetPrefs} />
        } />
      </Route>
    </Routes>
    </>
  )
}
