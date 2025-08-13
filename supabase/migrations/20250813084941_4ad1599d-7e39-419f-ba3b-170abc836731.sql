-- First, populate display_name from email addresses for profiles that don't have one
UPDATE profiles 
SET display_name = CASE 
  WHEN email LIKE '%@%' THEN 
    INITCAP(REPLACE(SPLIT_PART(email, '@', 1), '.', ' '))
  ELSE 
    'Benutzer' 
END
WHERE display_name IS NULL;

-- Now update books to populate suggester_name from the newly populated display_name
UPDATE books 
SET suggester_name = profiles.display_name
FROM profiles 
WHERE books.suggested_by = profiles.id 
  AND books.suggester_name IS NULL 
  AND (books.is_anonymous IS FALSE OR books.is_anonymous IS NULL)
  AND profiles.display_name IS NOT NULL;