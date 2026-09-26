-- Enable Row Level Security on public.products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Remove any conflicting existing policies on public.products
DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Admin can insert products" ON public.products;
DROP POLICY IF EXISTS "Admin can update products" ON public.products;
DROP POLICY IF EXISTS "Admin can delete products" ON public.products;
DROP POLICY IF EXISTS "Public SELECT on products" ON public.products;
DROP POLICY IF EXISTS "Authenticated INSERT on products" ON public.products;
DROP POLICY IF EXISTS "Authenticated UPDATE on products" ON public.products;
DROP POLICY IF EXISTS "Authenticated DELETE on products" ON public.products;

-- 1. Allow public SELECT access (visitors can view products on the website)
CREATE POLICY "Public SELECT on products"
ON public.products
FOR SELECT
TO public
USING (true);

-- 2. Allow authenticated Admin to INSERT new products
CREATE POLICY "Authenticated INSERT on products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.uid() = 'b8ac65e0-d3b9-43c8-b6ee-49a425a61fa7'::uuid
);

-- 3. Allow authenticated Admin to UPDATE existing products
CREATE POLICY "Authenticated UPDATE on products"
ON public.products
FOR UPDATE
TO authenticated
USING (
  auth.role() = 'authenticated'
  AND auth.uid() = 'b8ac65e0-d3b9-43c8-b6ee-49a425a61fa7'::uuid
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.uid() = 'b8ac65e0-d3b9-43c8-b6ee-49a425a61fa7'::uuid
);

-- 4. Allow authenticated Admin to DELETE products
CREATE POLICY "Authenticated DELETE on products"
ON public.products
FOR DELETE
TO authenticated
USING (
  auth.role() = 'authenticated'
  AND auth.uid() = 'b8ac65e0-d3b9-43c8-b6ee-49a425a61fa7'::uuid
);
