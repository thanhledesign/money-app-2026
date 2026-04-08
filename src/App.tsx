import { Routes, Route } from 'react-router-dom'
import { useAppData } from '@/hooks/useAppData'
import { useChartPrefs } from '@/hooks/useChartPrefs'
import Layout from '@/components/layout/Layout'
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

export default function App() {
  const {
    data, addSnapshot, addGoal,
    updateComp, updateDeductions, updateAllocations, updateBudgetItems,
  } = useAppData()

  const { prefs, update: updatePrefs, setAccountColor, setLabelColor, reset: resetPrefs } = useChartPrefs()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} />} />
        <Route path="enter" element={<EntryPage data={data} addSnapshot={addSnapshot} />} />
        <Route path="accounts" element={<AccountsPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} />} />
        <Route path="investments" element={<InvestmentsPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} />} />
        <Route path="debt" element={<DebtPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} />} />
        <Route path="net-worth" element={<NetWorthPage data={data} prefs={prefs} onUpdatePrefs={updatePrefs} />} />
        <Route path="income" element={
          <IncomePage data={data} updateComp={updateComp}
            updateDeductions={updateDeductions} updateAllocations={updateAllocations} />
        } />
        <Route path="budget" element={<BudgetPage data={data} updateBudgetItems={updateBudgetItems} />} />
        <Route path="goals" element={<GoalsPage data={data} addGoal={addGoal} />} />
        <Route path="settings" element={
          <SettingsPage data={data} prefs={prefs}
            setAccountColor={setAccountColor} setLabelColor={setLabelColor}
            onUpdatePrefs={updatePrefs} resetPrefs={resetPrefs} />
        } />
      </Route>
    </Routes>
  )
}
