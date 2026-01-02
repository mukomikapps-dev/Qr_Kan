-- QR Kan Database Schema untuk Supabase Postgres
-- Jalankan SQL ini di Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_pro BOOLEAN NOT NULL DEFAULT FALSE,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table  
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  logo_url TEXT,
  bg_type TEXT DEFAULT 'none',
  bg_solid_color TEXT,
  bg_image_url TEXT,
  bg_pattern_id TEXT,
  bg_gradient_colors TEXT,
  show_avatar BOOLEAN NOT NULL DEFAULT TRUE,
  show_display_name BOOLEAN NOT NULL DEFAULT TRUE,
  show_bio BOOLEAN NOT NULL DEFAULT TRUE,
  show_logo BOOLEAN NOT NULL DEFAULT TRUE,
  show_qr BOOLEAN NOT NULL DEFAULT TRUE,
  show_icons BOOLEAN NOT NULL DEFAULT TRUE,
  sticky_header_bg BOOLEAN NOT NULL DEFAULT TRUE,
  theme_preset_id TEXT DEFAULT 'monochrome',
  theme_json TEXT,
  use_custom_colors BOOLEAN NOT NULL DEFAULT FALSE,
  custom_colors TEXT,
  detailed_colors TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data_json TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  scheduled_from TIMESTAMPTZ,
  scheduled_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT
);

-- Clicks table
CREATE TABLE IF NOT EXISTS clicks (
  id TEXT PRIMARY KEY,
  block_id TEXT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  variant_id TEXT,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT
);

-- Block Variants table (A/B Testing)
CREATE TABLE IF NOT EXISTS block_variants (
  id TEXT PRIMARY KEY,
  block_id TEXT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  data_json TEXT NOT NULL,
  traffic_split INTEGER NOT NULL DEFAULT 50,
  impressions INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_blocks_profile_id ON blocks(profile_id);
CREATE INDEX IF NOT EXISTS idx_visits_profile_id ON visits(profile_id);
CREATE INDEX IF NOT EXISTS idx_clicks_block_id ON clicks(block_id);
CREATE INDEX IF NOT EXISTS idx_block_variants_block_id ON block_variants(block_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::TEXT = id);

-- Profiles: Public can read, users can update their own
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::TEXT = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

-- Blocks: Public can read visible blocks, users can manage their own
CREATE POLICY "Public can view visible blocks" ON blocks
  FOR SELECT USING (is_visible = true);
  
CREATE POLICY "Users can manage own blocks" ON blocks
  FOR ALL USING (
    auth.uid()::TEXT IN (
      SELECT user_id FROM profiles WHERE id = blocks.profile_id
    )
  );

-- Visits: Anyone can insert, users can read their own
CREATE POLICY "Anyone can log visits" ON visits
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can read own visits" ON visits
  FOR SELECT USING (
    auth.uid()::TEXT IN (
      SELECT user_id FROM profiles WHERE id = visits.profile_id
    )
  );

-- Clicks: Anyone can insert, users can read their own
CREATE POLICY "Anyone can log clicks" ON clicks
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Users can read own clicks" ON clicks
  FOR SELECT USING (
    auth.uid()::TEXT IN (
      SELECT user_id FROM profiles 
      WHERE id IN (SELECT profile_id FROM blocks WHERE id = clicks.block_id)
    )
  );

-- Block Variants: Public can read active variants, users can manage their own
CREATE POLICY "Public can view active variants" ON block_variants
  FOR SELECT USING (is_active = true);
  
CREATE POLICY "Users can manage own variants" ON block_variants
  FOR ALL USING (
    auth.uid()::TEXT IN (
      SELECT user_id FROM profiles 
      WHERE id IN (SELECT profile_id FROM blocks WHERE id = block_variants.block_id)
    )
  );

