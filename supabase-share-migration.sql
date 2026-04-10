-- Shared dashboards table — public read-only links
-- Run this in your Supabase SQL Editor (after the main user_data migration)

CREATE TABLE IF NOT EXISTS shared_snapshots (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE shared_snapshots ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous users) can read shared snapshots by ID
-- This is intentional: the share ID itself is the access token
CREATE POLICY "Anyone can read shared snapshots" ON shared_snapshots
  FOR SELECT USING (true);

-- Only the owner can create their own shares
CREATE POLICY "Users can insert own shares" ON shared_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only the owner can delete their own shares
CREATE POLICY "Users can delete own shares" ON shared_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- Only the owner can update their own shares
CREATE POLICY "Users can update own shares" ON shared_snapshots
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for fast lookups by user (for "my shares" view if added later)
CREATE INDEX IF NOT EXISTS idx_shared_snapshots_user ON shared_snapshots(user_id);
