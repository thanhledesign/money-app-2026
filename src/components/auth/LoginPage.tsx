interface Props {
  onSignInWithGoogle: () => void
  configured: boolean
  onSkip: () => void
}

export function LoginPage({ onSignInWithGoogle, configured, onSkip }: Props) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Money 2026</h1>
          <p className="text-text-secondary">Your personal financial command center</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Welcome</h2>
          <p className="text-sm text-text-secondary mb-6">
            Sign in to sync your data across devices, or continue locally.
          </p>

          {configured ? (
            <button
              onClick={onSignInWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-800 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors mb-4"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          ) : (
            <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 mb-4">
              <p className="text-amber text-xs font-medium mb-1">Supabase not configured</p>
              <p className="text-text-muted text-xs">
                Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable Google sign-in.
              </p>
            </div>
          )}

          <button
            onClick={onSkip}
            className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text-secondary hover:text-text-primary hover:border-accent/50 transition-colors"
          >
            Continue without account
          </button>

          <p className="text-[10px] text-text-muted text-center mt-4 leading-relaxed">
            {configured
              ? 'Your data is stored securely in the cloud. Only you can access it.'
              : 'Your data stays on this device in your browser. Nothing is sent to any server.'}
          </p>
        </div>

        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-[10px] text-text-muted">
            <span>Manual-first tracking</span>
            <span>-</span>
            <span>No bank linking required</span>
            <span>-</span>
            <span>Privacy by design</span>
          </div>
        </div>
      </div>
    </div>
  )
}
