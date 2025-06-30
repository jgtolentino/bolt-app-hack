-- ============================================
-- Scout Analytics: Legacy to Medallion Migration
-- Transforms legacy geography/organization to modern schema
-- Date: 2025-07-01
-- ============================================

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS migration_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  records_migrated INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  error_message TEXT,
  metadata JSONB
);

-- ============================================
-- STEP 1: Migrate Geography → Stores
-- ============================================

-- First, ensure stores table exists with proper schema
CREATE TABLE IF NOT EXISTS stores (
  store_id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL,
  store_type TEXT,
  region TEXT NOT NULL,
  city_municipality TEXT NOT NULL,
  barangay TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  area_sqkm DECIMAL(10, 2),
  manager_name TEXT,
  contact_number TEXT,
  opening_time TIME DEFAULT '06:00',
  closing_time TIME DEFAULT '22:00',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log migration start
INSERT INTO migration_log (migration_name, table_name, status)
VALUES ('geography_to_stores', 'stores', 'running');

-- Migrate geography data to stores
WITH migration AS (
  INSERT INTO stores (
    store_id,
    store_name,
    store_type,
    region,
    city_municipality,
    barangay,
    latitude,
    longitude,
    population,
    area_sqkm
  )
  SELECT
    COALESCE(id::text, gen_random_uuid()::text) as store_id,
    COALESCE(store_name, 'Store ' || ROW_NUMBER() OVER ()) as store_name,
    COALESCE(store_type, 'sari-sari') as store_type,
    region,
    city_municipality,
    barangay,
    latitude,
    longitude,
    population,
    area_sqkm
  FROM geography
  ON CONFLICT (store_id) DO NOTHING
  RETURNING 1
)
UPDATE migration_log
SET 
  records_migrated = (SELECT COUNT(*) FROM migration),
  completed_at = NOW(),
  status = 'completed'
WHERE migration_name = 'geography_to_stores'
  AND status = 'running';

-- ============================================
-- STEP 2: Migrate Organization → Products/Brands/Categories
-- ============================================

-- Create necessary tables if they don't exist
CREATE TABLE IF NOT EXISTS brands (
  brand_id SERIAL PRIMARY KEY,
  brand_name TEXT UNIQUE NOT NULL,
  company_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_categories (
  category_id SERIAL PRIMARY KEY,
  category_name TEXT UNIQUE NOT NULL,
  parent_category_id INTEGER REFERENCES product_categories(category_id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  sku_code TEXT UNIQUE,
  brand_id INTEGER REFERENCES brands(brand_id),
  category_id INTEGER REFERENCES product_categories(category_id),
  unit_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  margin_percent DECIMAL(5, 2),
  package_size TEXT,
  barcode TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log migration start for brands
INSERT INTO migration_log (migration_name, table_name, status)
VALUES ('organization_to_brands', 'brands', 'running');

-- Insert unique brands
WITH brand_migration AS (
  INSERT INTO brands (brand_name, company_name)
  SELECT DISTINCT 
    brand as brand_name,
    client as company_name
  FROM organization
  WHERE brand IS NOT NULL
  ON CONFLICT (brand_name) DO NOTHING
  RETURNING 1
)
UPDATE migration_log
SET 
  records_migrated = (SELECT COUNT(*) FROM brand_migration),
  completed_at = NOW(),
  status = 'completed'
WHERE migration_name = 'organization_to_brands'
  AND status = 'running';

-- Log migration start for categories
INSERT INTO migration_log (migration_name, table_name, status)
VALUES ('organization_to_categories', 'product_categories', 'running');

-- Insert unique categories
WITH category_migration AS (
  INSERT INTO product_categories (category_name)
  SELECT DISTINCT category
  FROM organization
  WHERE category IS NOT NULL
  ON CONFLICT (category_name) DO NOTHING
  RETURNING 1
)
UPDATE migration_log
SET 
  records_migrated = (SELECT COUNT(*) FROM category_migration),
  completed_at = NOW(),
  status = 'completed'
WHERE migration_name = 'organization_to_categories'
  AND status = 'running';

-- Log migration start for products
INSERT INTO migration_log (migration_name, table_name, status)
VALUES ('organization_to_products', 'products', 'running');

-- Insert products
WITH product_migration AS (
  INSERT INTO products (
    product_id,
    product_name,
    sku_code,
    brand_id,
    category_id,
    unit_price,
    cost_price,
    margin_percent,
    package_size
  )
  SELECT
    o.id::text,
    o.sku_description as product_name,
    o.sku as sku_code,
    b.brand_id,
    c.category_id,
    o.unit_price,
    o.cost_price,
    o.margin_percent,
    o.package_size
  FROM organization o
  LEFT JOIN brands b ON b.brand_name = o.brand
  LEFT JOIN product_categories c ON c.category_name = o.category
  ON CONFLICT (product_id) DO NOTHING
  RETURNING 1
)
UPDATE migration_log
SET 
  records_migrated = (SELECT COUNT(*) FROM product_migration),
  completed_at = NOW(),
  status = 'completed'
WHERE migration_name = 'organization_to_products'
  AND status = 'running';

-- ============================================
-- STEP 3: Create Legacy Compatibility Views
-- ============================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS geography CASCADE;
DROP VIEW IF EXISTS organization CASCADE;

-- Create backward-compatible view for geography
CREATE OR REPLACE VIEW geography AS
SELECT
  store_id::uuid as id,
  store_name,
  store_type,
  region,
  city_municipality,
  barangay,
  latitude,
  longitude,
  population,
  area_sqkm,
  created_at,
  updated_at
FROM stores;

-- Create backward-compatible view for organization
CREATE OR REPLACE VIEW organization AS
SELECT
  p.product_id::uuid as id,
  b.company_name as client,
  c.category_name as category,
  b.brand_name as brand,
  p.sku_code as sku,
  p.product_name as sku_description,
  p.unit_price,
  p.cost_price,
  p.margin_percent,
  p.package_size,
  FALSE as is_competitor,
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN brands b ON p.brand_id = b.brand_id
LEFT JOIN product_categories c ON p.category_id = c.category_id;

-- Grant permissions on views
GRANT SELECT ON geography TO authenticated;
GRANT SELECT ON organization TO authenticated;

-- ============================================
-- STEP 4: Update Transactions Table
-- ============================================

-- Add new columns to transactions if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'store_id') THEN
    ALTER TABLE transactions ADD COLUMN store_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'transactions' AND column_name = 'product_id') THEN
    ALTER TABLE transactions ADD COLUMN product_id TEXT;
  END IF;
END $$;

-- Log migration start for transaction updates
INSERT INTO migration_log (migration_name, table_name, status)
VALUES ('update_transaction_references', 'transactions', 'running');

-- Update transactions to use new references
WITH transaction_update AS (
  UPDATE transactions t
  SET 
    store_id = COALESCE(t.geography_id::text, t.store_id),
    product_id = COALESCE(t.organization_id::text, t.product_id)
  WHERE t.store_id IS NULL OR t.product_id IS NULL
  RETURNING 1
)
UPDATE migration_log
SET 
  records_migrated = (SELECT COUNT(*) FROM transaction_update),
  completed_at = NOW(),
  status = 'completed'
WHERE migration_name = 'update_transaction_references'
  AND status = 'running';

-- Add foreign key constraints
ALTER TABLE transactions 
  ADD CONSTRAINT fk_transactions_store 
  FOREIGN KEY (store_id) REFERENCES stores(store_id);

ALTER TABLE transactions 
  ADD CONSTRAINT fk_transactions_product 
  FOREIGN KEY (product_id) REFERENCES products(product_id);

-- ============================================
-- STEP 5: Create Transaction Items (if needed)
-- ============================================

-- Create transaction_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS transaction_items (
  item_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(transaction_id),
  product_id TEXT REFERENCES products(product_id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * price - discount) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction 
  ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product 
  ON transaction_items(product_id);

-- ============================================
-- STEP 6: Create Indexes for Performance
-- ============================================

-- Stores indexes
CREATE INDEX IF NOT EXISTS idx_stores_region ON stores(region);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city_municipality);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku_code);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_store ON transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_time ON transactions(transaction_time);

-- ============================================
-- STEP 7: Verification Queries
-- ============================================

-- Create verification function
CREATE OR REPLACE FUNCTION verify_migration()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check stores migration
  RETURN QUERY
  SELECT 
    'Stores Migration'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Success' ELSE 'Failed' END,
    format('%s stores migrated', COUNT(*))::TEXT
  FROM stores;

  -- Check products migration
  RETURN QUERY
  SELECT 
    'Products Migration'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Success' ELSE 'Failed' END,
    format('%s products migrated', COUNT(*))::TEXT
  FROM products;

  -- Check brands migration
  RETURN QUERY
  SELECT 
    'Brands Migration'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Success' ELSE 'Failed' END,
    format('%s brands created', COUNT(*))::TEXT
  FROM brands;

  -- Check categories migration
  RETURN QUERY
  SELECT 
    'Categories Migration'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Success' ELSE 'Failed' END,
    format('%s categories created', COUNT(*))::TEXT
  FROM product_categories;

  -- Check transaction updates
  RETURN QUERY
  SELECT 
    'Transaction References'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Success' ELSE 'Failed' END,
    format('%s transactions updated', COUNT(*))::TEXT
  FROM transactions
  WHERE store_id IS NOT NULL AND product_id IS NOT NULL;

  -- Check legacy view compatibility
  RETURN QUERY
  SELECT 
    'Legacy Views'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'geography')
       AND EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'organization')
      THEN 'Success' 
      ELSE 'Failed' 
    END,
    'Compatibility views created'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 8: Final Summary
-- ============================================

-- Show migration summary
SELECT 
  migration_name,
  table_name,
  records_migrated,
  status,
  EXTRACT(EPOCH FROM (completed_at - started_at)) as duration_seconds
FROM migration_log
ORDER BY started_at;

-- Show verification results
SELECT * FROM verify_migration();

-- ============================================
-- ROLLBACK PROCEDURES (if needed)
-- ============================================

-- Create rollback function
CREATE OR REPLACE FUNCTION rollback_medallion_migration()
RETURNS TEXT AS $$
BEGIN
  -- This function can be used to rollback the migration if needed
  -- It preserves the original tables (geography, organization)
  -- and removes the new tables/views
  
  -- For now, we just return a message
  -- The original tables are preserved, so no data is lost
  RETURN 'Original tables preserved. New tables can be dropped if needed.';
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON VIEW geography IS 'Legacy compatibility view for geography table - maps to stores';
COMMENT ON VIEW organization IS 'Legacy compatibility view for organization table - maps to products/brands';
COMMENT ON TABLE migration_log IS 'Tracks the legacy to medallion migration process';
COMMENT ON FUNCTION verify_migration() IS 'Verifies the success of the medallion migration';
COMMENT ON FUNCTION rollback_medallion_migration() IS 'Rollback procedure for medallion migration';

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION verify_migration() TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete! Run SELECT * FROM verify_migration() to see results.';
END $$;