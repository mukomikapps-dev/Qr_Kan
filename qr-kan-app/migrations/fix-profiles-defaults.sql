-- Normalkan skema kolom `profiles` secara DEFENSIF: hanya mengubah kolom yang
-- BENAR-BENAR ADA di database (cek information_schema), agar idempoten dan
-- tidak gagal 42703 bila kolom seperti `category` memang tidak ada.

-- Helper: atur default & buang NOT NULL hanya jika kolomnya ada.
DO $$
DECLARE
  col text;
BEGIN
  -- Kolom boolean NOT NULL: pastikan punya DEFAULT TRUE/FALSE
  FOR col IN SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'profiles'
               AND column_name IN ('show_avatar','show_display_name','show_bio',
                                   'show_logo','show_qr','show_icons','sticky_header_bg')
  LOOP
    EXECUTE format('ALTER TABLE profiles ALTER COLUMN %I SET DEFAULT TRUE', col);
  END LOOP;

  FOR col IN SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'profiles'
               AND column_name = 'use_custom_colors'
  LOOP
    EXECUTE 'ALTER TABLE profiles ALTER COLUMN use_custom_colors SET DEFAULT FALSE';
  END LOOP;

  -- Kolom teks dengan default string
  FOR col IN SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'profiles'
               AND column_name IN ('bg_type','theme_preset_id','status_type')
  LOOP
    EXECUTE format('ALTER TABLE profiles ALTER COLUMN %I SET DEFAULT %L',
                   col, CASE col WHEN 'bg_type' THEN 'none'
                                 WHEN 'theme_preset_id' THEN 'monochrome'
                                 ELSE 'text' END);
  END LOOP;

  -- Kolom nullable: pastikan boleh NULL (drop NOT NULL bila ada)
  FOR col IN SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'profiles'
               AND column_name IN ('bio','avatar_url','logo_url','bg_solid_color',
                                   'bg_image_url','bg_pattern_id','bg_gradient_colors',
                                   'theme_json','custom_colors','detailed_colors',
                                   'status','status_type','cover_image_url','category')
  LOOP
    EXECUTE format('ALTER TABLE profiles ALTER COLUMN %I DROP NOT NULL', col);
  END LOOP;
END $$;