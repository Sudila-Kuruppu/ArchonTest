-- Migration 002: Create products and categories tables
-- Requires: 001_create_profiles (profiles table with is_admin column)
-- This migration adds product catalog tables and storage

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE RESTRICT,
  subcategory text,
  price numeric(10, 2) NOT NULL CHECK (price > 0),
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  images jsonb[] NOT NULL DEFAULT '{}',
  is_featured boolean NOT NULL DEFAULT false,
  is_new_arrival boolean NOT NULL DEFAULT false,
  age_range jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_is_new_arrival ON products(is_new_arrival) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_deleted_at ON products(deleted_at);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_name_search ON products USING gin(name gin_trgm_ops);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Products: public read, admin write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly viewable"
  ON products FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- Categories: public read, admin write
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly viewable"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Admin can insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "Admin can update categories"
  ON categories FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "Admin can delete categories"
  ON categories FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- ============================================================
-- STORAGE: Product Images Bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for product images
CREATE POLICY "Product images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Admin write access for product images
CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "Admin can update product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

CREATE POLICY "Admin can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- ============================================================
-- FUNCTION: Ensure admin check for storage
-- ============================================================
-- This helper function simplifies RLS policies that check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;

-- ============================================================
-- TRIGGER: Auto-update updated_at on products
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
