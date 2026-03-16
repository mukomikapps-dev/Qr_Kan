-- Update profiles dengan cover_image_url dari Unsplash
-- Menggunakan hash dari username untuk memilih 6 image berbeda

UPDATE profiles 
SET cover_image_url = CASE 
  WHEN (ascii(substring(username, 1, 1)) % 6) = 0 THEN 'https://images.unsplash.com/photo-1537498425046-c894cddc4945?w=800&h=1200&fit=crop&q=80'
  WHEN (ascii(substring(username, 1, 1)) % 6) = 1 THEN 'https://images.unsplash.com/photo-1516321318423-f06f70d504f0?w=800&h=1200&fit=crop&q=80'
  WHEN (ascii(substring(username, 1, 1)) % 6) = 2 THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=1200&fit=crop&q=80'
  WHEN (ascii(substring(username, 1, 1)) % 6) = 3 THEN 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=1200&fit=crop&q=80'
  WHEN (ascii(substring(username, 1, 1)) % 6) = 4 THEN 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=1200&fit=crop&q=80'
  ELSE 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=1200&fit=crop&q=80'
END
WHERE cover_image_url IS NULL;

-- Verify
SELECT COUNT(*) as total,
       COUNT(CASE WHEN cover_image_url IS NOT NULL THEN 1 END) as with_cover,
       COUNT(CASE WHEN cover_image_url IS NULL THEN 1 END) as without_cover
FROM profiles;
