-- Add cover_image_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_cover_image_url ON profiles(cover_image_url) WHERE cover_image_url IS NOT NULL;




