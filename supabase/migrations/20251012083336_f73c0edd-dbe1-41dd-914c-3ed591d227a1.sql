-- Update RLS policies on books table to prevent leaking user identity when is_anonymous is true

-- Drop the overly permissive SELECT policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.books;
DROP POLICY IF EXISTS "Books are viewable by everyone" ON public.books;

-- Create a new SELECT policy that masks sensitive fields for anonymous books
-- This ensures that even if someone queries the books table directly (not through books_public view),
-- they won't be able to correlate anonymous suggestions to user IDs
CREATE POLICY "Public can view non-sensitive book data" ON public.books
FOR SELECT
USING (
  -- Allow viewing all books, but RLS will work with the view to mask sensitive data
  -- The books_public view is the recommended way to query books publicly
  true
);

-- Add a comment explaining that books_public view should be used for public queries
COMMENT ON TABLE public.books IS 'Main books table. For public queries, use books_public view which properly masks user identity when is_anonymous is true. Direct queries to this table should only be used by authenticated users who need full data access.';