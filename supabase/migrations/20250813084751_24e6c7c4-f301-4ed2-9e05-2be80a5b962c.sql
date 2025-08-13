-- Update books to populate suggester_name from profiles table
-- Only for books that are not anonymous and have a suggested_by user but no suggester_name
UPDATE books 
SET suggester_name = profiles.display_name
FROM profiles 
WHERE books.suggested_by = profiles.id 
  AND books.suggester_name IS NULL 
  AND (books.is_anonymous IS FALSE OR books.is_anonymous IS NULL)
  AND profiles.display_name IS NOT NULL;