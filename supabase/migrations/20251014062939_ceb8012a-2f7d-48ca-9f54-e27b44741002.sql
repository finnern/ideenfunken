-- Fix books_public view to show inspiration_quote even for anonymous suggestions
-- Only the suggester name should be hidden, not the inspiration quote

DROP VIEW IF EXISTS books_public;

CREATE VIEW books_public AS
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
  CASE 
    WHEN is_anonymous = true THEN NULL::uuid
    ELSE suggested_by
  END AS suggested_by,
  CASE 
    WHEN is_anonymous = true THEN NULL::text
    ELSE suggester_name
  END AS suggester_name,
  inspiration_quote, -- Always show inspiration quote, even for anonymous
  is_anonymous
FROM books;