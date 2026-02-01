-- ============================================================================
-- Migration: Optional GitHub Onboarding
-- Date: 2026-02-01
-- Description: Make GitHub optional, add nickname for collaboration
-- ============================================================================

-- ============================================================================
-- PART 1: Update participants table
-- ============================================================================

-- Make github_username nullable (users can register without GitHub)
ALTER TABLE participants
  ALTER COLUMN github_username DROP NOT NULL;

-- Add nickname column for collaboration/display
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Add auth_user_id to link with Supabase auth (for email-only users)
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

-- Create index for auth_user_id lookups
CREATE INDEX IF NOT EXISTS idx_participants_auth_user_id ON participants(auth_user_id);

-- Update unique constraint on github_username to allow multiple NULLs
-- PostgreSQL allows multiple NULLs in unique columns by default, so no change needed

-- ============================================================================
-- PART 2: Add status column if not exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'participants' AND column_name = 'status') THEN
    ALTER TABLE participants ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END
$$;

-- ============================================================================
-- PART 3: Add is_admin column if not exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'participants' AND column_name = 'is_admin') THEN
    ALTER TABLE participants ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END
$$;

-- ============================================================================
-- PART 4: Update RLS policies to handle email-only users
-- ============================================================================

-- Drop and recreate policy for participants to handle auth_user_id
DROP POLICY IF EXISTS "Users can view own profile" ON participants;
CREATE POLICY "Users can view own profile" ON participants
  FOR SELECT
  USING (
    auth.uid() = auth_user_id
    OR (current_setting('role', true) = 'service_role')
    OR true  -- Public read for leaderboard visibility
  );

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON participants;
CREATE POLICY "Users can update own profile" ON participants
  FOR UPDATE
  USING (
    auth.uid() = auth_user_id
    OR (current_setting('role', true) = 'service_role')
  );

-- ============================================================================
-- End of Migration
-- ============================================================================
