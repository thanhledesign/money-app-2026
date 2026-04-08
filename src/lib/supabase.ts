import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const _configured = Boolean(supabaseUrl && supabaseAnonKey)

// Only create client if configured — avoids crash when env vars are missing
export const supabase: SupabaseClient | null = _configured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function isSupabaseConfigured(): boolean {
  return _configured
}
