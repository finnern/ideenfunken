-- Remove the problematic RLS policy that exposes profile data publicly
DROP POLICY IF EXISTS "Allow reading suggester display info only" ON public.profiles;

-- The books table already contains suggester_name field, so we don't need 
-- public access to profiles table for displaying book suggester information.
-- This ensures only users can see their own profile data, maintaining privacy.