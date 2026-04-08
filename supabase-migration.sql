-- Create user_data table for syncing app data across devices
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_data (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Enable RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can read own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON user_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON user_data
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_data_user_key ON user_data(user_id, key);
