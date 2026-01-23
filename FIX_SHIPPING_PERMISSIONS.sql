-- ===================================================================
-- FIX SHIPPING LOCATIONS PERMISSIONS
-- Run this script in the Supabase SQL Editor
-- ===================================================================

-- Drop existing restricted policies
DROP POLICY IF EXISTS "Allow public read access" ON shipping_locations;
DROP POLICY IF EXISTS "Allow authenticated insert" ON shipping_locations;
DROP POLICY IF EXISTS "Allow authenticated update" ON shipping_locations;
DROP POLICY IF EXISTS "Allow authenticated delete" ON shipping_locations;

-- Create new open policies (matching the app's simple admin auth model)
-- This allows the Admin Dashboard to modify these records without Supabase Auth
CREATE POLICY "Allow public full access" ON shipping_locations
  FOR ALL USING (true) WITH CHECK (true);

-- Ensure RLS is enabled (with the open policy)
ALTER TABLE shipping_locations ENABLE ROW LEVEL SECURITY;
