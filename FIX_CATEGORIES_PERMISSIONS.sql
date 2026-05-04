-- =============================================
-- FIX: Allow add/edit/delete on categories from admin page
-- Reason: existing RLS policy only allows `authenticated` users,
-- but the admin page uses a frontend password (not Supabase Auth),
-- so requests go as the `anon` role and are blocked.
-- Run this in the Supabase SQL Editor.
-- =============================================

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

-- Allow public read of all categories (admin needs to see inactive ones too)
CREATE POLICY "Public can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Allow public insert/update/delete (admin uses frontend password gate)
CREATE POLICY "Public can insert categories"
  ON categories
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update categories"
  ON categories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete categories"
  ON categories
  FOR DELETE
  TO public
  USING (true);

-- Verify
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'categories';
