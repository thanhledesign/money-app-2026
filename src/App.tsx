import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, useSearchParams } from 'react-router-dom'
import { useAppData } from '@/hooks/useAppData'
import { useChartPrefs } from '@/hooks/useChartPrefs'
import { useAuth } from '@/hooks/useAuth'
import { useDashboards } from '@/hooks/useDashboards'
import { PasswordGate, isPasswordRequired, isPasswordValid } from '@/components/auth/PasswordGate'
import Layout from '@/components/layout/Layout'
import { LoginPage } from '@/components/auth/LoginPage'
import WizardPage from '@/components/wizard/WizardPage'
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
import { isAdmin } from '@/lib/roles'
import ToolsPage from '@/components/tools/ToolsPage'
import { getStorageKey } from '@/lib/store'

function AppInner({ userId, isLocal, auth }: {
  userId: string | undefined
  isLocal: boolean
  auth: ReturnType<typeof useAuth>
}) {
  const [searchParams] = useSearchParams()
  const freshMode = searchParams.get('fresh') === 'true'

  const db = useDashboards(userId)
  const { activeDashboard } = db

  const {
    data, isReadOnly, addSnapshot, deleteSnapshot, addGoal,
    addAccount, updateAccounts,
    updateComp, updateDeductions, updateAllocations, updateBudgetItems,
    resetData,
  } = useAppData(userId, activeDashboard)

  const { prefs, update: updatePrefs, setAccountColor, setLabelColor, reset: resetPrefs } = useChartPrefs()

  // Wizard completion is scoped per dashboard
  const wizardDoneKey = useMemo(() => getStorageKey('wizard-done'), [userId, db.activeId])

  const [wizardComplete, setWizardComplete] = useState(() => {
    if (freshMode) return false
    // Combined and view dashboards skip the wizard
    if (activeDashboard?.mode === 'combined' || activeDashboard?.mode === 'view') return true
    return localStorage.getItem(wizardDoneKey) === 'true' || data.snapshots.length > 0
  })

  // Re-check wizard state when dashboard changes
  useEffect(() => {
    if (activeDashboard?.mode === 'combined' || activeDashboard?.mode === 'view') {
      setWizardComplete(true)
      return
    }
    const done = localStorage.getItem(wizardDoneKey) === 'true' || data.snapshots.length > 0
    setWizardComplete(done)
  }, [userId, db.activeId, wizardDoneKey, data.snapshots.length, activeDashboard?.mode])

  // Fresh mode: reset data on mount
  useEffect(() => {
    if (freshMode) {
      resetData()
      localStorage.removeItem(wizardDoneKey)
      localStorage.removeItem('money-app-skipped-login')
    }
  }, [freshMode])

  if (!wizardComplete) {
    return (
      <WizardPage
        onComplete={() => {
          localStorage.setItem(wizardDoneKey, 'true')
          setWizardComplete(true)
        }}
        addAccount={addAccount}
        updateComp={updateComp}
        updateBudgetItems={updateBudgetItems}
        addGoal={addGoal}
      />
    )
  }

  return (
    <>
    {isAdmin(auth.user?.email) && <AdminDesigner />}
    <Routes>
      <Route element={
        <Layout
          userEmail={auth.user?.email}
          userAvatar={auth.user?.user_metadata?.avatar_url}
          userName={auth.user?.user_metadata?.full_name}
          onSignOut={auth.signOut}
          onSignIn={auth.configured ? auth.signInWithGoogle : undefined}
          isLocal={isLocal}
          dashboards={db.dashboards}
          activeId={db.activeId}
          activeDashboard={activeDashboard}
          canCreateDashboard={db.canCreate}
          onSwitchDashboard={db.switchDashboard}
          onCreateDashboard={db.createDashboard}
          onDeleteDashboard={db.deleteDashboard}
          onRenameDashboard={db.renameDashboard}
          onDuplicateDashboard={db.duplicateDashboard}
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

export default function App() {
  const auth = useAuth()
  const [passwordOk, setPasswordOk] = useState(() => isPasswordValid())
  const [skippedLogin, setSkippedLogin] = useState(() => {
    return localStorage.getItem('money-app-skipped-login') === 'true'
  })

  // Password gate
  if (isPasswordRequired() && !passwordOk) {
    return <PasswordGate onSuccess={() => setPasswordOk(true)} />
  }

  // Wait for auth to resolve before loading any data
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
  const userId = auth.user?.id

  return <AppInner userId={userId} isLocal={isLocal} auth={auth} />
}
