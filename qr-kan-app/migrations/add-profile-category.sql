-- Add category column to profiles table for grouping users in explore page
-- Run this migration in steps if you encounter timeout:

-- Step 1: Add column (run this first)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Step 2: Create index (run this separately after Step 1 completes)
-- This creates a partial index which is more efficient
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_category 
ON profiles(category) 
WHERE category IS NOT NULL;

