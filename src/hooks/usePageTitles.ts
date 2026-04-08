import { useState, useCallback } from 'react'

const STORAGE_KEY = 'money-app-page-titles'

export const DEFAULT_PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  accounts: 'Cash Accounts',
  investments: 'Investments',
  debt: 'Debt',
  'net-worth': 'Net Worth',
  income: 'Income',
  budget: 'Budget',
  goals: 'Goals',
  tools: 'Tools',
  settings: 'Settings',
}

function loadTitles(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getPageTitle(key: string, fallback: string): string {
  const titles = loadTitles()
  return titles[key] || fallback
}

export function usePageTitles() {
  const [titles, setTitles] = useState<Record<string, string>>(loadTitles)

  const setTitle = useCallback((key: string, value: string) => {
    setTitles(prev => {
      const next = { ...prev, [key]: value }
      // Remove entry if it matches default (keeps storage clean)
      if (value === DEFAULT_PAGE_TITLES[key] || value === '') {
        delete next[key]
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getTitle = useCallback((key: string): string => {
    return titles[key] || DEFAULT_PAGE_TITLES[key] || key
  }, [titles])

  return { titles, setTitle, getTitle }
}
