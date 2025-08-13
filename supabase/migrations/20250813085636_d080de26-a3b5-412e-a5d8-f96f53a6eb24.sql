-- Fix display_name to use first_name and last_name instead of email
UPDATE profiles 
SET display_name = CASE 
  WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 
    CONCAT(first_name, ' ', last_name)
  WHEN first_name IS NOT NULL THEN 
    first_name
  WHEN last_name IS NOT NULL THEN 
    last_name
  WHEN email LIKE '%@%' THEN 
    INITCAP(REPLACE(SPLIT_PART(email, '@', 1), '.', ' '))
  ELSE 
    'Benutzer' 
END;

-- Update books to use the corrected suggester names
UPDATE books 
SET suggester_name = profiles.display_name
FROM profiles 
WHERE books.suggested_by = profiles.id 
  AND (books.is_anonymous IS FALSE OR books.is_anonymous IS NULL)
  AND profiles.display_name IS NOT NULL;