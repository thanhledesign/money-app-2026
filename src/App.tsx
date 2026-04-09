import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, useSearchParams, useLocation } from 'react-router-dom'
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
import TransactionsPage from '@/components/pro/TransactionsPage'
import { getStorageKey, saveData as storeSaveData } from '@/lib/store'
import { useTier } from '@/hooks/useTier'
import { UpgradeGate } from '@/components/ui/UpgradeGate'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AppInner({ userId, isLocal, auth }: {
  userId: string | undefined
  isLocal: boolean
  auth: ReturnType<typeof useAuth>
}) {
  const [searchParams] = useSearchParams()
  const freshMode = searchParams.get('fresh') === 'true'

  const db = useDashboards(userId)
  const { activeDashboard } = db
  const { tier } = useTier(auth.user?.email)

  const {
    data, isReadOnly, addSnapshot, deleteSnapshot, addGoal,
    addAccount, updateAccounts,
    updateComp, updateDeductions, updateAllocations, updateBudgetItems,
    resetData, undo, redo, canUndo, canRedo,
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
    {/* Background image layer */}
    <div id="app-background" className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ display: 'none', transform: 'scale(1.02)' }} />
    <div id="app-scrim" className="fixed inset-0 z-0 bg-background" style={{ opacity: 0.75 }} />
    <div className="relative z-10">
    <ScrollToTop />
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
        <Route index element={<DashboardPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} userId={userId} />} />
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
        <Route path="transactions" element={
          <UpgradeGate featureId="transactions" userTier={tier}><TransactionsPage /></UpgradeGate>
        } />
        <Route path="business" element={
          <UpgradeGate featureId="business" userTier={tier}><BusinessPage /></UpgradeGate>
        } />
        <Route path="properties" element={
          <UpgradeGate featureId="properties" userTier={tier}><PropertiesPage /></UpgradeGate>
        } />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="settings" element={
          <SettingsPage data={data} prefs={prefs}
            setAccountColor={setAccountColor} setLabelColor={setLabelColor}
            onUpdatePrefs={updatePrefs} resetPrefs={resetPrefs}
            userId={userId} dashboardId={db.activeId} dashboards={db.dashboards}
            onDataLoaded={(d) => { storeSaveData(d); window.location.reload() }} />
        } />
      </Route>
    </Routes>
    {/* Undo/Redo indicator */}
    {(canUndo || canRedo) && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface/90 backdrop-blur-xl border border-border/40 shadow-lg">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-2 py-0.5 text-xs text-text-secondary hover:text-accent disabled:opacity-30 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <span className="text-border">|</span>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="px-2 py-0.5 text-xs text-text-secondary hover:text-accent disabled:opacity-30 transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </button>
      </div>
    )}
    </div>
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
