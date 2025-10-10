-- Create a secure view that masks user identity for anonymous suggestions
CREATE OR REPLACE VIEW public.books_public AS
SELECT 
  id,
  title,
  author,
  description,
  cover_url,
  original_cover_url,
  isbn,
  votes,
  created_at,
  updated_at,
  more_info_url,
  url_good_reads,
  available_in_mediathek,
  -- Mask sensitive fields when is_anonymous is true
  CASE 
    WHEN is_anonymous = true THEN NULL 
    ELSE suggested_by 
  END as suggested_by,
  CASE 
    WHEN is_anonymous = true THEN NULL 
    ELSE suggester_name 
  END as suggester_name,
  CASE 
    WHEN is_anonymous = true THEN NULL 
    ELSE inspiration_quote 
  END as inspiration_quote,
  is_anonymous
FROM books;

-- Grant SELECT permission on the view to all users
GRANT SELECT ON public.books_public TO anon, authenticated;

-- Add comment explaining the security purpose
COMMENT ON VIEW public.books_public IS 'Public-facing view of books that masks user identity (suggested_by, suggester_name, inspiration_quote) when is_anonymous is true to prevent correlation attacks';