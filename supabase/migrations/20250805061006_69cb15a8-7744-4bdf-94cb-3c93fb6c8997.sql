-- Fix remaining database functions with search_path security

-- Fix admin_reset_all_votes function
CREATE OR REPLACE FUNCTION public.admin_reset_all_votes()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  DELETE FROM book_votes;
  UPDATE profiles SET points_remaining = 10;
  UPDATE books SET votes = 1;
  DELETE FROM book_vote_logs;
END;
$function$;

-- Fix update_book_votes_on_vote_change function
CREATE OR REPLACE FUNCTION public.update_book_votes_on_vote_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_book_votes(OLD.book_id);
  ELSE
    PERFORM recalculate_book_votes(NEW.book_id);
  END IF;
  
  RETURN NULL;
END;
$function$;

-- Fix increment_vote function
CREATE OR REPLACE FUNCTION public.increment_vote(book_id uuid)
 RETURNS TABLE(new_votes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE books SET votes = books.votes + 1 WHERE books.id = book_id;
  RETURN QUERY SELECT books.votes FROM books WHERE books.id = book_id;
END;
$function$;

-- Fix get_voting_data function
CREATE OR REPLACE FUNCTION public.get_voting_data(book_id_param uuid)
 RETURNS TABLE(book_votes integer, user_has_voted boolean, user_remaining_points integer, user_suggested_book boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN QUERY 
    SELECT 
      COALESCE(b.votes, 1) as book_votes,
      false as user_has_voted,
      0 as user_remaining_points,
      false as user_suggested_book
    FROM books b
    WHERE b.id = book_id_param;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(b.votes, 1) as book_votes,
    EXISTS(SELECT 1 FROM book_votes bv WHERE bv.book_id = book_id_param AND bv.user_id = current_user_id) as user_has_voted,
    COALESCE(p.points_remaining, 0) as user_remaining_points,
    (b.suggested_by = current_user_id) as user_suggested_book
  FROM books b
  LEFT JOIN profiles p ON p.id = current_user_id
  WHERE b.id = book_id_param;
END;
$function$;

-- Fix recalculate_book_votes function
CREATE OR REPLACE FUNCTION public.recalculate_book_votes(book_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    additional_vote_count INTEGER;
    total_votes INTEGER;
BEGIN
    SELECT COUNT(*) INTO additional_vote_count
    FROM book_votes
    WHERE book_id = book_id_param;

    total_votes := 1 + additional_vote_count;

    UPDATE books
    SET votes = total_votes
    WHERE id = book_id_param;

    RETURN total_votes;
END;
$function$;

-- Fix add_vote (legacy function) 
CREATE OR REPLACE FUNCTION public.add_vote(book_id uuid, user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
    current_user_votes INTEGER;
    current_book_votes INTEGER;
    result JSON;
BEGIN
    SELECT COUNT(*) INTO current_user_votes
    FROM book_votes 
    WHERE book_votes.user_id = add_vote.user_id;
    
    IF EXISTS (
        SELECT 1 FROM book_votes 
        WHERE book_votes.book_id = add_vote.book_id 
        AND book_votes.user_id = add_vote.user_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User has already voted for this book',
            'user_total_votes', current_user_votes,
            'user_remaining_votes', 3 - current_user_votes
        );
    END IF;
    
    IF current_user_votes >= 3 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User has reached maximum of 3 votes',
            'user_total_votes', current_user_votes,
            'user_remaining_votes', 0
        );
    END IF;
    
    INSERT INTO book_votes (book_id, user_id)
    VALUES (add_vote.book_id, add_vote.user_id);
    
    UPDATE books 
    SET votes = votes + 1 
    WHERE id = add_vote.book_id;
    
    SELECT COUNT(*) INTO current_user_votes
    FROM book_votes 
    WHERE book_votes.user_id = add_vote.user_id;
    
    SELECT votes INTO current_book_votes
    FROM books 
    WHERE id = add_vote.book_id;
    
    RETURN json_build_object(
        'success', true,
        'book_votes', current_book_votes,
        'user_total_votes', current_user_votes,
        'user_remaining_votes', 3 - current_user_votes
    );
END;
$function$;

-- Fix decrement_vote function
CREATE OR REPLACE FUNCTION public.decrement_vote(book_id uuid)
 RETURNS TABLE(new_votes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE books SET votes = GREATEST(0, books.votes - 1) WHERE books.id = book_id;
  RETURN QUERY SELECT books.votes FROM books WHERE books.id = book_id;
END;
$function$;

-- Fix add_vote (newer version) function
CREATE OR REPLACE FUNCTION public.add_vote(book_id_param uuid)
 RETURNS TABLE(success boolean, new_vote_count integer, remaining_points integer, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_user_id UUID := auth.uid();
  book_suggester UUID;
  user_remaining INTEGER;
  existing_votes INTEGER;
  new_votes INTEGER;
  user_points INTEGER;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'Authentication required'::text;
    RETURN;
  END IF;

  SELECT suggested_by, votes INTO book_suggester, new_votes
  FROM books WHERE id = book_id_param;

  IF book_suggester IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'Book not found'::text;
    RETURN;
  END IF;

  IF book_suggester = current_user_id THEN
    RETURN QUERY SELECT false, 0, 0, 'Cannot vote on own suggestion'::text;
    RETURN;
  END IF;

  SELECT COUNT(*) INTO existing_votes
  FROM book_votes
  WHERE book_id = book_id_param AND user_id = current_user_id;

  IF existing_votes >= 3 THEN
    RETURN QUERY SELECT false, new_votes, 0, 'Maximum 3 votes per book reached'::text;
    RETURN;
  END IF;

  SELECT points_remaining INTO user_remaining
  FROM profiles WHERE id = current_user_id;

  IF user_remaining IS NULL OR user_remaining <= 0 THEN
    RETURN QUERY SELECT false, new_votes, COALESCE(user_remaining, 0), 'No points remaining'::text;
    RETURN;
  END IF;

  INSERT INTO book_votes (book_id, user_id) VALUES (book_id_param, current_user_id);

  UPDATE profiles
  SET points_remaining = points_remaining - 1
  WHERE id = current_user_id
  RETURNING points_remaining INTO user_points;

  UPDATE books
  SET votes = votes + 1
  WHERE id = book_id_param
  RETURNING votes INTO new_votes;

  RETURN QUERY SELECT true, new_votes, user_points, 'Vote added successfully'::text;
END;
$function$;

-- Fix remove_vote function
CREATE OR REPLACE FUNCTION public.remove_vote(book_id_param uuid)
 RETURNS TABLE(success boolean, new_vote_count integer, remaining_points integer, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_user_id UUID := auth.uid();
  vote_id UUID;
  new_votes INTEGER;
  user_points INTEGER;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN QUERY SELECT false, 0, 0, 'Authentication required'::text;
    RETURN;
  END IF;

  SELECT id INTO vote_id
  FROM book_votes
  WHERE book_id = book_id_param AND user_id = current_user_id
  ORDER BY created_at DESC LIMIT 1;

  IF vote_id IS NULL THEN
    SELECT votes INTO new_votes FROM books WHERE id = book_id_param;
    RETURN QUERY SELECT false, COALESCE(new_votes, 0), 0, 'No vote found to remove'::text;
    RETURN;
  END IF;

  DELETE FROM book_votes WHERE id = vote_id;

  UPDATE profiles
  SET points_remaining = LEAST(points_remaining + 1, 10)
  WHERE id = current_user_id
  RETURNING points_remaining INTO user_points;

  UPDATE books
  SET votes = GREATEST(votes - 1, 1)
  WHERE id = book_id_param
  RETURNING votes INTO new_votes;

  RETURN QUERY SELECT true, new_votes, user_points, 'Vote removed successfully'::text;
END;
$function$;

-- Fix get_voting_info function
CREATE OR REPLACE FUNCTION public.get_voting_info(book_id_param uuid)
 RETURNS TABLE(book_votes integer, user_vote_count integer, user_remaining_points integer, user_is_suggester boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN QUERY
    SELECT COALESCE(b.votes, 1), 0, 0, false
    FROM books b WHERE b.id = book_id_param;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(b.votes, 1),
    (SELECT COUNT(*)::integer FROM book_votes bv WHERE bv.book_id = book_id_param AND bv.user_id = current_user_id),
    COALESCE(p.points_remaining, 0),
    (b.suggested_by = current_user_id)
  FROM books b
  LEFT JOIN profiles p ON p.id = current_user_id
  WHERE b.id = book_id_param;
END;
$function$;

-- Fix handle_new_user function (already has search_path but ensuring consistency)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO profiles (id, email, points_remaining, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    10,
    (NEW.raw_user_meta_data->>'display_name')
  );
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;