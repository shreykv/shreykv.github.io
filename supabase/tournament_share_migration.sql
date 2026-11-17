-- Run once against the live Supabase project to enable tournament spectator links.
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS patterns where possible.

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS share_code TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournaments_share_code
  ON tournaments (share_code)
  WHERE share_code IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can view shared tournaments" ON tournaments;
CREATE POLICY "Anyone can view shared tournaments" ON tournaments
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true AND share_code IS NOT NULL);
