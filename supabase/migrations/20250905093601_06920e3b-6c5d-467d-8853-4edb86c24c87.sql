-- Security Fix: Restrict book_votes table access to protect user privacy
-- Remove existing public read policies that expose voting patterns
DROP POLICY IF EXISTS "Anyone can read votes" ON public.book_votes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.book_votes;

-- Add secure policy that only allows users to see their own votes
CREATE POLICY "Users can view their own votes" 
ON public.book_votes 
FOR SELECT 
USING (auth.uid() = user_id);

-- Keep admin access for vote management
CREATE POLICY "Admin can view all votes" 
ON public.book_votes 
FOR SELECT 
USING (is_current_user_admin());

-- Security Fix: Restrict user_roles table access to protect admin information
-- Remove existing public read policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Add secure policy that only allows users to see their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Keep admin access for role management
CREATE POLICY "Admin can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (is_current_user_admin());

-- Create a secure function to get aggregated vote counts without exposing individual votes
CREATE OR REPLACE FUNCTION public.get_book_vote_count(book_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  vote_count integer;
BEGIN
  SELECT COUNT(*) INTO vote_count
  FROM book_votes
  WHERE book_id = book_id_param;
  
  RETURN vote_count;
END;
$$;