-- Ensure public read access for book detail pages via shared links
-- Enable RLS (idempotent-safe) and add a SELECT policy for everyone

-- Make sure table exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'books'
  ) THEN
    RAISE EXCEPTION 'Table public.books does not exist';
  END IF;
END $$;

-- Enable Row Level Security (no-op if already enabled)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create a SELECT policy if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'books'
      AND policyname = 'Books are viewable by everyone'
  ) THEN
    CREATE POLICY "Books are viewable by everyone"
    ON public.books
    FOR SELECT
    USING (true);
  END IF;
END
$$;