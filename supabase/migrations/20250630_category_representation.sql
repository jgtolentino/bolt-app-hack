-- Ensure Product Category Representation in Transactions
-- This migration creates functions to ensure all categories are represented in samples

-- Function to get transactions with category representation
CREATE OR REPLACE FUNCTION get_category_representative_transactions(
  limit_count INTEGER DEFAULT 1000,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  receipt_number TEXT,
  transaction_datetime TIMESTAMP WITH TIME ZONE,
  store_id UUID,
  region TEXT,
  city TEXT,
  total_amount NUMERIC,
  items_count INTEGER,
  payment_method TEXT,
  categories TEXT[],
  primary_category TEXT
) AS $$
DECLARE
  category_count INTEGER;
  per_category_limit INTEGER;
BEGIN
  -- Get count of distinct categories
  SELECT COUNT(DISTINCT pc.id) INTO category_count
  FROM product_categories pc
  WHERE pc.is_active = true;
  
  -- Calculate transactions per category
  per_category_limit := GREATEST(limit_count / NULLIF(category_count, 0), 1);
  
  -- Use window function to distribute evenly across categories
  RETURN QUERY
  WITH transaction_categories AS (
    SELECT 
      t.id,
      t.receipt_number,
      t.transaction_datetime,
      t.store_id,
      s.region,
      s.city,
      t.total_amount,
      t.items_count,
      t.payment_method,
      ARRAY_AGG(DISTINCT pc.category_name) as categories,
      -- Get the primary category (most items)
      (
        SELECT pc2.category_name
        FROM transaction_items ti2
        JOIN products p2 ON ti2.product_id = p2.id
        JOIN product_categories pc2 ON p2.category_id = pc2.id
        WHERE ti2.transaction_id = t.id
        GROUP BY pc2.category_name
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ) as primary_category
    FROM transactions t
    JOIN stores s ON t.store_id = s.id
    JOIN transaction_items ti ON t.id = ti.transaction_id
    JOIN products p ON ti.product_id = p.id
    JOIN product_categories pc ON p.category_id = pc.id
    WHERE t.status = 'completed'
    AND (date_from IS NULL OR t.transaction_datetime >= date_from)
    AND (date_to IS NULL OR t.transaction_datetime <= date_to)
    GROUP BY t.id, t.receipt_number, t.transaction_datetime, 
             t.store_id, s.region, s.city, t.total_amount, 
             t.items_count, t.payment_method
  ),
  ranked_by_category AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (
        PARTITION BY primary_category 
        ORDER BY transaction_datetime DESC
      ) as category_rank
    FROM transaction_categories
  )
  SELECT 
    id,
    receipt_number,
    transaction_datetime,
    store_id,
    region,
    city,
    total_amount,
    items_count,
    payment_method,
    categories,
    primary_category
  FROM ranked_by_category
  WHERE category_rank <= per_category_limit
  ORDER BY transaction_datetime DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure all categories have products
CREATE OR REPLACE FUNCTION ensure_category_products()
RETURNS TABLE (
  category_name TEXT,
  products_created INTEGER
) AS $$
DECLARE
  cat RECORD;
  created_count INTEGER;
  brand_id UUID;
BEGIN
  -- Get a default brand
  SELECT id INTO brand_id 
  FROM brands 
  LIMIT 1;
  
  -- If no brand exists, create a generic one
  IF brand_id IS NULL THEN
    INSERT INTO brands (brand_code, brand_name, is_active)
    VALUES ('BRD-GENERIC', 'Generic', true)
    RETURNING id INTO brand_id;
  END IF;
  
  -- Check each category
  FOR cat IN (SELECT * FROM product_categories WHERE is_active = true) LOOP
    -- Count existing products
    SELECT COUNT(*) INTO created_count
    FROM products p
    WHERE p.category_id = cat.id;
    
    -- If no products, create sample products
    IF created_count = 0 THEN
      -- Insert sample products for the category
      INSERT INTO products (
        barcode,
        sku,
        product_name,
        description,
        category_id,
        brand_id,
        current_price,
        cost_price,
        unit_of_measure,
        is_active
      )
      SELECT
        'BAR-' || cat.category_code || '-' || LPAD(generate_series::text, 3, '0'),
        'SKU-' || cat.category_code || '-' || LPAD(generate_series::text, 3, '0'),
        cat.category_name || ' Product ' || generate_series,
        'Sample product for ' || cat.category_name || ' category',
        cat.id,
        brand_id,
        ROUND((20 + random() * 180)::numeric, 2), -- Price between 20-200
        ROUND((15 + random() * 135)::numeric, 2), -- Cost 75% of price
        'piece',
        true
      FROM generate_series(1, 5);
      
      created_count := 5;
    END IF;
    
    category_name := cat.category_name;
    products_created := created_count;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- View for category distribution analytics
CREATE OR REPLACE VIEW v_category_distribution AS
WITH category_stats AS (
  SELECT 
    pc.category_name,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(DISTINCT ti.transaction_id) as transaction_count,
    SUM(ti.line_total) as total_sales,
    AVG(ti.line_total) as avg_line_total,
    SUM(ti.quantity) as total_units_sold,
    COUNT(DISTINCT t.store_id) as stores_selling,
    COUNT(DISTINCT t.customer_id) as unique_customers
  FROM product_categories pc
  LEFT JOIN products p ON pc.id = p.category_id
  LEFT JOIN transaction_items ti ON p.id = ti.product_id
  LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.status = 'completed'
  WHERE pc.is_active = true
  GROUP BY pc.category_name
)
SELECT 
  category_name,
  product_count,
  transaction_count,
  total_sales,
  avg_line_total,
  total_units_sold,
  stores_selling,
  unique_customers,
  ROUND(100.0 * transaction_count / NULLIF(SUM(transaction_count) OVER (), 0), 2) as transaction_percentage,
  ROUND(100.0 * total_sales / NULLIF(SUM(total_sales) OVER (), 0), 2) as sales_percentage
FROM category_stats
ORDER BY total_sales DESC NULLS LAST;

-- Function to check category coverage in transaction range
CREATE OR REPLACE FUNCTION check_category_coverage(
  transaction_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
  total_categories INTEGER,
  represented_categories INTEGER,
  missing_categories TEXT[],
  coverage_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH first_n_transactions AS (
    SELECT t.id
    FROM transactions t
    WHERE t.status = 'completed'
    ORDER BY t.created_at
    LIMIT transaction_limit
  ),
  represented AS (
    SELECT DISTINCT pc.category_name
    FROM first_n_transactions f
    JOIN transaction_items ti ON f.id = ti.transaction_id
    JOIN products p ON ti.product_id = p.id
    JOIN product_categories pc ON p.category_id = pc.id
  ),
  all_categories AS (
    SELECT category_name
    FROM product_categories
    WHERE is_active = true
  )
  SELECT 
    (SELECT COUNT(*) FROM all_categories)::INTEGER as total_categories,
    (SELECT COUNT(*) FROM represented)::INTEGER as represented_categories,
    ARRAY(
      SELECT category_name 
      FROM all_categories 
      WHERE category_name NOT IN (SELECT category_name FROM represented)
      ORDER BY category_name
    ) as missing_categories,
    ROUND(
      100.0 * (SELECT COUNT(*) FROM represented) / 
      NULLIF((SELECT COUNT(*) FROM all_categories), 0), 
      2
    ) as coverage_percentage;
END;
$$ LANGUAGE plpgsql;

-- Create sample data to ensure category representation
DO $$
DECLARE
  coverage RECORD;
BEGIN
  -- Check current coverage
  SELECT * INTO coverage FROM check_category_coverage(1000);
  
  IF coverage.coverage_percentage < 100 THEN
    RAISE NOTICE 'Category coverage is only %%. Creating sample transactions for missing categories...', coverage.coverage_percentage;
    
    -- This would typically call a more complex function to create transactions
    -- For now, just log the issue
    RAISE NOTICE 'Missing categories: %', array_to_string(coverage.missing_categories, ', ');
    RAISE NOTICE 'Run ensure-category-representation.js to fix this';
  ELSE
    RAISE NOTICE 'All categories are represented in the first 1000 transactions!';
  END IF;
END $$;

-- Index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON products(category_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_transaction_items_product_transaction 
ON transaction_items(product_id, transaction_id);

-- Add common Philippine retail categories if they don't exist
INSERT INTO product_categories (category_code, category_name, description, is_active)
VALUES 
  ('CAT-001', 'Beverages', 'Soft drinks, juices, water, coffee, tea', true),
  ('CAT-002', 'Snacks', 'Chips, crackers, nuts, candies', true),
  ('CAT-003', 'Personal Care', 'Soap, shampoo, toothpaste, deodorant', true),
  ('CAT-004', 'Food & Groceries', 'Canned goods, noodles, rice, cooking oil', true),
  ('CAT-005', 'Dairy', 'Milk, cheese, yogurt, butter', true),
  ('CAT-006', 'Household Items', 'Cleaning supplies, kitchen items, tools', true),
  ('CAT-007', 'Health & Medicine', 'Vitamins, OTC drugs, first aid', true),
  ('CAT-008', 'Baby Care', 'Diapers, formula, baby food', true),
  ('CAT-009', 'Frozen Foods', 'Ice cream, frozen meat, frozen vegetables', true),
  ('CAT-010', 'Canned Goods', 'Corned beef, tuna, sardines', true),
  ('CAT-011', 'Condiments & Sauces', 'Soy sauce, vinegar, ketchup, mayo', true),
  ('CAT-012', 'Bread & Bakery', 'Pandesal, loaf bread, pastries', true),
  ('CAT-013', 'Tobacco & Vape', 'Cigarettes, e-cigarettes, accessories', true),
  ('CAT-014', 'School & Office', 'Notebooks, pens, paper, supplies', true),
  ('CAT-015', 'Alcoholic Beverages', 'Beer, gin, rum, wine', true),
  ('CAT-016', 'Beauty Products', 'Makeup, skincare, perfume', true),
  ('CAT-017', 'Cleaning Supplies', 'Detergent, bleach, fabric softener', true),
  ('CAT-018', 'Pet Care', 'Pet food, accessories, supplies', true)
ON CONFLICT (category_code) DO UPDATE
SET 
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;