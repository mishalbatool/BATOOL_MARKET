-- Ensure the 'product-images' bucket allows public SELECT access
UPDATE storage.buckets
SET public = true
WHERE id = 'product-images';

-- Remove existing policies for 'product-images' if present
DROP POLICY IF EXISTS "Public SELECT on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated INSERT on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated UPDATE on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated DELETE on product-images" ON storage.objects;

-- 1. Public SELECT access for 'product-images'
CREATE POLICY "Public SELECT on product-images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'product-images'
);

-- 2. Authenticated Admin INSERT access for 'product-images'
CREATE POLICY "Authenticated INSERT on product-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 3. Authenticated Admin UPDATE access for 'product-images'
CREATE POLICY "Authenticated UPDATE on product-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 4. Authenticated Admin DELETE access for 'product-images'
CREATE POLICY "Authenticated DELETE on product-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
