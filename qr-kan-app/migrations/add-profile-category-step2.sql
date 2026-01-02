-- Step 2: Create index for category filtering
-- Run this AFTER step 1 completes successfully
-- Using CONCURRENTLY to avoid locking the table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_category 
ON profiles(category) 
WHERE category IS NOT NULL;



