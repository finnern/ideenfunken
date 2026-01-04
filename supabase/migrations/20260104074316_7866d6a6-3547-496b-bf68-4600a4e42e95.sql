-- Fix vote count for "Früher war alles schlechter" book
UPDATE books 
SET votes = 2 
WHERE id = 'f5f98a04-87d4-4b29-ab76-5bf565ccc10f';