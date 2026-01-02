-- Migration: Add scheduled content columns to blocks table
-- Run this SQL in Supabase SQL Editor

ALTER TABLE blocks 
ADD COLUMN IF NOT EXISTS scheduled_from TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_to TIMESTAMPTZ;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_blocks_scheduled_from ON blocks(scheduled_from);
CREATE INDEX IF NOT EXISTS idx_blocks_scheduled_to ON blocks(scheduled_to);




