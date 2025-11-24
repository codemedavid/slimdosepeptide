-- ============================================
-- CREATE STORAGE BUCKETS FOR HP GLOW
-- ============================================
-- Run this in Supabase SQL Editor to create all required buckets and policies
-- This creates: menu-images (product images) and payment-proofs (payment screenshots)

-- ============================================
-- PART 1: CREATE MENU-IMAGES BUCKET (Product Images)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,  -- Public bucket (important!)
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif']
) ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif'];

-- Policies for menu-images bucket
DROP POLICY IF EXISTS "Public read access for menu images" ON storage.objects;
CREATE POLICY "Public read access for menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone can upload menu images" ON storage.objects;
CREATE POLICY "Anyone can upload menu images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone can update menu images" ON storage.objects;
CREATE POLICY "Anyone can update menu images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anyone can delete menu images" ON storage.objects;
CREATE POLICY "Anyone can delete menu images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'menu-images');

-- ============================================
-- PART 2: CREATE PAYMENT-PROOFS BUCKET (Payment Screenshots)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,  -- Private bucket (payment proofs should not be public)
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif']
) ON CONFLICT (id) DO UPDATE
SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif'];

-- Policies for payment-proofs bucket (private, but allow uploads)
-- Read access: Only authenticated users or specific access control
DROP POLICY IF EXISTS "Authenticated read access for payment proofs" ON storage.objects;
CREATE POLICY "Authenticated read access for payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Allow public to upload (for checkout process)
DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow updates (for replacing proof images)
DROP POLICY IF EXISTS "Anyone can update payment proofs" ON storage.objects;
CREATE POLICY "Anyone can update payment proofs"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');

-- Allow deletes (for removing proof images)
DROP POLICY IF EXISTS "Anyone can delete payment proofs" ON storage.objects;
CREATE POLICY "Anyone can delete payment proofs"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'payment-proofs');

-- ============================================
-- PART 3: CREATE COA-IMAGES BUCKET (Lab Reports)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coa-images',
  'coa-images',
  true,  -- Public bucket (for displaying COA reports)
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif', 'application/pdf']
) ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff', 'image/svg+xml', 'image/heic', 'image/heif', 'application/pdf'];

-- Policies for coa-images bucket
DROP POLICY IF EXISTS "Public read access for coa images" ON storage.objects;
CREATE POLICY "Public read access for coa images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'coa-images');

DROP POLICY IF EXISTS "Anyone can upload coa images" ON storage.objects;
CREATE POLICY "Anyone can upload coa images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'coa-images');

DROP POLICY IF EXISTS "Anyone can update coa images" ON storage.objects;
CREATE POLICY "Anyone can update coa images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'coa-images')
WITH CHECK (bucket_id = 'coa-images');

DROP POLICY IF EXISTS "Anyone can delete coa images" ON storage.objects;
CREATE POLICY "Anyone can delete coa images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'coa-images');

-- ============================================
-- PART 4: VERIFY ALL BUCKETS CREATED
-- ============================================
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE id IN ('menu-images', 'payment-proofs', 'coa-images')
ORDER BY id;

-- If you see all 3 buckets above, they're created successfully! ✅
-- Expected result:
-- ✅ menu-images | menu-images | true | 10485760
-- ✅ payment-proofs | payment-proofs | false | 10485760
-- ✅ coa-images | coa-images | true | 10485760

