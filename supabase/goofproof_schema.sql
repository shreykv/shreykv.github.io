-- =============================================================================
-- Pour Decisions (bar crawl drink board) - shared board storage
-- =============================================================================
-- Each crawl is one board, keyed by its lowercased crawl code. Boards are
-- public and account-free: anyone with the code can read and write them. The constraints below keep the table
-- limited to the shapes the app writes, and the trigger caps each board's size.
-- Run this in your Supabase Dashboard > SQL Editor > New Query.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.goofproof_docs (
  board TEXT NOT NULL,
  col TEXT NOT NULL,
  id TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (board, col, id),
  CONSTRAINT goofproof_board_ok CHECK (board ~ '^[a-z0-9-]{1,40}$'),
  CONSTRAINT goofproof_col_ok CHECK (
    col IN ('players', 'stops', 'checkins', 'days', 'meta', 'probes')
    OR col ~ '^days/[0-9]{8}/drinks$'
  ),
  CONSTRAINT goofproof_id_ok CHECK (id ~ '^[A-Za-z0-9._-]{1,80}$'),
  CONSTRAINT goofproof_data_ok CHECK (jsonb_typeof(data) = 'object' AND pg_column_size(data) <= 8192)
);

ALTER TABLE public.goofproof_docs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read goofproof boards" ON public.goofproof_docs;
DROP POLICY IF EXISTS "Anyone can add to goofproof boards" ON public.goofproof_docs;
DROP POLICY IF EXISTS "Anyone can edit goofproof boards" ON public.goofproof_docs;
DROP POLICY IF EXISTS "Anyone can remove from goofproof boards" ON public.goofproof_docs;

CREATE POLICY "Anyone can read goofproof boards" ON public.goofproof_docs
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can add to goofproof boards" ON public.goofproof_docs
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can edit goofproof boards" ON public.goofproof_docs
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can remove from goofproof boards" ON public.goofproof_docs
  FOR DELETE TO anon, authenticated USING (true);

-- Caps a board at 6000 documents. The client reads the 'board_full' message
-- and tells the crew the board is full instead of retrying forever.
CREATE OR REPLACE FUNCTION public.goofproof_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
       SELECT 1 FROM public.goofproof_docs
       WHERE board = NEW.board AND col = NEW.col AND id = NEW.id
     )
     AND (SELECT COUNT(*) FROM public.goofproof_docs WHERE board = NEW.board) >= 6000 THEN
    RAISE EXCEPTION 'board_full';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS goofproof_cap ON public.goofproof_docs;
CREATE TRIGGER goofproof_cap
  BEFORE INSERT ON public.goofproof_docs
  FOR EACH ROW EXECUTE FUNCTION public.goofproof_cap();

-- The whole board as { cols: { <collection>: { <id>: <data> } } } in a single
-- row, so reads are not cut off by the API's per-request row limit.
CREATE OR REPLACE FUNCTION public.goofproof_state(p_board TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT jsonb_build_object('cols', COALESCE(jsonb_object_agg(c.col, c.docs), '{}'::jsonb))
  FROM (
    SELECT col, jsonb_object_agg(id, data) AS docs
    FROM public.goofproof_docs
    WHERE board = p_board
    GROUP BY col
  ) c;
$$;

-- Shallow-merges a patch into an existing document. Returns false when the
-- document does not exist, which the app treats as "this edit no longer applies".
CREATE OR REPLACE FUNCTION public.goofproof_update(p_board TEXT, p_col TEXT, p_id TEXT, p_patch JSONB)
RETURNS BOOLEAN
LANGUAGE sql
VOLATILE
SET search_path = ''
AS $$
  WITH u AS (
    UPDATE public.goofproof_docs
    SET data = data || p_patch, updated_at = NOW()
    WHERE board = p_board AND col = p_col AND id = p_id
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM u);
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goofproof_docs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.goofproof_state(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.goofproof_update(TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;
