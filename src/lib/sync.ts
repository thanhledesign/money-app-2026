import { supabase, isSupabaseConfigured } from './supabase'

const TABLE = 'user_data'
const SYNC_DEBOUNCE_MS = 2000

let _debounceTimer: ReturnType<typeof setTimeout> | null = null

// Save data to Supabase (upsert by user_id + key)
export async function syncToCloud(userId: string, key: string, data: unknown): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase || !userId) return false
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(
        { user_id: userId, key, data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      )
    if (error) {
      console.warn('[sync] upload failed:', error.message)
      return false
    }
    return true
  } catch (e) {
    console.warn('[sync] upload error:', e)
    return false
  }
}

// Load data from Supabase
export async function loadFromCloud(userId: string, key: string): Promise<unknown | null> {
  if (!isSupabaseConfigured() || !supabase || !userId) return null
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('user_id', userId)
      .eq('key', key)
      .single()
    if (error || !data) return null
    return data.data
  } catch {
    return null
  }
}

// Debounced sync — call after every local save to push to cloud
export function debouncedSync(userId: string, key: string, data: unknown) {
  if (!userId) return
  if (_debounceTimer) clearTimeout(_debounceTimer)
  _debounceTimer = setTimeout(() => {
    syncToCloud(userId, key, data)
  }, SYNC_DEBOUNCE_MS)
}

// Load all keys for a user (for initial hydration)
export async function loadAllFromCloud(userId: string): Promise<Record<string, unknown>> {
  if (!isSupabaseConfigured() || !supabase || !userId) return {}
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('key, data')
      .eq('user_id', userId)
    if (error || !data) return {}
    const result: Record<string, unknown> = {}
    for (const row of data) {
      result[row.key] = row.data
    }
    return result
  } catch {
    return {}
  }
}
