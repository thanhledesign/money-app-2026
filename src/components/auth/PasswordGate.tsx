import { useState } from 'react'

const SITE_PASSWORD = import.meta.env.VITE_SITE_PASSWORD || ''
const STORAGE_KEY = 'money-app-password-ok'

export function isPasswordRequired(): boolean {
  return Boolean(SITE_PASSWORD)
}

export function isPasswordValid(): boolean {
  if (!SITE_PASSWORD) return true
  return sessionStorage.getItem(STORAGE_KEY) === 'true'
}

interface Props {
  onSuccess: () => void
}

export function PasswordGate({ onSuccess }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      onSuccess()
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-1">Money 2026</h1>
          <p className="text-sm text-text-muted">Enter password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Password"
            autoFocus
            className={`w-full px-4 py-3 bg-background border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
              error ? 'border-red' : 'border-border focus:border-accent'
            }`}
          />
          {error && <p className="text-xs text-red mt-2">Incorrect password</p>}
          <button
            type="submit"
            className="w-full mt-4 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors"
          >
            Enter
          </button>
        </form>

        <p className="text-[10px] text-text-muted text-center mt-4">
          This site is password-protected during beta.
        </p>
      </div>
    </div>
  )
}
