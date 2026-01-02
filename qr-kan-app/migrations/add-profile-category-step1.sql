-- Step 1: Add category column to profiles table
-- Run this first, wait for it to complete before running step 2
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category TEXT;



