-- Add is_pro column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT FALSE;

-- Set user 'mangugeng' as pro user
UPDATE users 
SET is_pro = TRUE 
WHERE id IN (
  SELECT u.id 
  FROM users u
  JOIN profiles p ON u.id = p.user_id
  WHERE p.username = 'mangugeng'
);




