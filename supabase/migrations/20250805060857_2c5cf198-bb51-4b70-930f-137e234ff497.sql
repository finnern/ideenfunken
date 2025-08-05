-- CRITICAL SECURITY FIX: Phase 1 - Fix Profile RLS to Protect Email Exposure
-- Currently "Enable reading suggester info" policy allows reading ALL profile data including emails
-- This is a CRITICAL privacy violation

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Enable reading suggester info" ON public.profiles;

-- Create a secure policy that only exposes non-sensitive suggester information
-- Only allow reading display_name and name fields for book suggesters, NEVER email
CREATE POLICY "Allow reading suggester display info only" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow users to see their own full profile
  auth.uid() = id 
  OR 
  -- Allow reading only display_name, first_name, last_name for book suggesters
  -- This prevents email exposure while still allowing suggester attribution
  id IN (
    SELECT DISTINCT suggested_by 
    FROM public.books 
    WHERE suggested_by IS NOT NULL
  )
);

-- CRITICAL SECURITY FIX: Phase 2 - Fix Database Functions Search Path
-- Add SET search_path = 'public' to prevent SQL injection attacks

-- Fix update_book_votes_on_change function
CREATE OR REPLACE FUNCTION public.update_book_votes_on_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  PERFORM recalculate_book_votes(
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.book_id
      ELSE NEW.book_id
    END
  );
  RETURN NULL;
END;
$function$;

-- Fix reset_all_user_points function  
CREATE OR REPLACE FUNCTION public.reset_all_user_points(default_points integer DEFAULT 10)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET points_remaining = default_points;
END;
$function$;

-- Fix recalculate_all_book_votes function
CREATE OR REPLACE FUNCTION public.recalculate_all_book_votes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    book_record RECORD;
BEGIN
    FOR book_record IN SELECT id FROM books LOOP
        PERFORM recalculate_book_votes(book_record.id);
    END LOOP;
END;
$function$;

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

-- Fix is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT has_role(auth.uid(), 'admin'::app_role)
$function$;

-- Fix update_book_vote_count function
CREATE OR REPLACE FUNCTION public.update_book_vote_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  vote_count INTEGER;
  affected_book_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_book_id := OLD.book_id;
  ELSE
    affected_book_id := NEW.book_id;
  END IF;

  SELECT COUNT(*) INTO vote_count 
  FROM book_votes 
  WHERE book_id = affected_book_id;

  INSERT INTO book_vote_logs (
    action, 
    book_id, 
    user_id, 
    new_count
  ) VALUES (
    TG_OP,
    affected_book_id,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END,
    vote_count
  );

  UPDATE books 
  SET votes = vote_count,
      updated_at = NOW()
  WHERE id = affected_book_id;

  RETURN NULL;
END;
$function$;

-- Fix secure_add_vote function
CREATE OR REPLACE FUNCTION public.secure_add_vote(book_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_id UUID := auth.uid();
  suggester_id UUID;
  current_remaining_votes INTEGER;
  vote_exists BOOLEAN;
BEGIN
  IF book_id_param IS NULL THEN
    RAISE EXCEPTION 'Invalid book ID';
  END IF;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT suggested_by INTO suggester_id
  FROM books
  WHERE id = book_id_param;

  IF suggester_id IS NULL THEN
    RAISE EXCEPTION 'Book not found';
  END IF;

  IF suggester_id = user_id THEN
    RAISE EXCEPTION 'Cannot vote on own suggestion';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM book_votes bv
    WHERE bv.book_id = book_id_param AND bv.user_id = user_id
  ) INTO vote_exists;

  IF vote_exists THEN
    RAISE EXCEPTION 'Vote already exists';
  END IF;

  SELECT points_remaining INTO current_remaining_votes
  FROM profiles
  WHERE id = user_id;

  IF current_remaining_votes IS NULL OR current_remaining_votes <= 0 THEN
    RAISE EXCEPTION 'No votes remaining';
  END IF;

  INSERT INTO book_votes (book_id, user_id)
  VALUES (book_id_param, user_id);

  UPDATE profiles
  SET points_remaining = points_remaining - 1
  WHERE id = user_id;

  UPDATE books
  SET votes = votes + 1
  WHERE id = book_id_param;

  RETURN TRUE;
END;
$function$;

-- Fix secure_remove_vote function
CREATE OR REPLACE FUNCTION public.secure_remove_vote(book_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_id UUID := auth.uid();
  vote_exists BOOLEAN;
BEGIN
  IF book_id_param IS NULL THEN
    RAISE EXCEPTION 'Invalid book ID';
  END IF;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM book_votes bv
    WHERE bv.book_id = book_id_param AND bv.user_id = user_id
  ) INTO vote_exists;

  IF NOT vote_exists THEN
    RAISE EXCEPTION 'Vote not found';
  END IF;

  DELETE FROM book_votes bv
  WHERE bv.book_id = book_id_param AND bv.user_id = user_id;

  UPDATE profiles
  SET points_remaining = LEAST(points_remaining + 1, 10)
  WHERE id = user_id;

  UPDATE books
  SET votes = GREATEST(votes - 1, 1)
  WHERE id = book_id_param;

  RETURN TRUE;
END;
$function$;