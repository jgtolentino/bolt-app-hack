-- Representative Sampling Functions
-- Ensures all regions are represented in limited queries

-- Function to get representative sample of transactions
CREATE OR REPLACE FUNCTION get_representative_transactions(
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
  customer_id UUID
) AS $$
DECLARE
  regions_count INTEGER;
  per_region_limit INTEGER;
  extra_for_ncr INTEGER;
BEGIN
  -- Get count of distinct regions
  SELECT COUNT(DISTINCT s.region) INTO regions_count
  FROM stores s
  WHERE EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.store_id = s.id
    AND (date_from IS NULL OR t.transaction_datetime >= date_from)
    AND (date_to IS NULL OR t.transaction_datetime <= date_to)
  );
  
  -- Calculate transactions per region
  per_region_limit := limit_count / GREATEST(regions_count, 1);
  extra_for_ncr := limit_count % GREATEST(regions_count, 1);
  
  -- Use window function to distribute evenly across regions
  RETURN QUERY
  WITH ranked_transactions AS (
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
      t.customer_id,
      ROW_NUMBER() OVER (
        PARTITION BY s.region 
        ORDER BY t.transaction_datetime DESC
      ) as rn
    FROM transactions t
    JOIN stores s ON t.store_id = s.id
    WHERE t.status = 'completed'
    AND (date_from IS NULL OR t.transaction_datetime >= date_from)
    AND (date_to IS NULL OR t.transaction_datetime <= date_to)
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
    customer_id
  FROM ranked_transactions
  WHERE rn <= per_region_limit + CASE WHEN region = 'NCR' THEN extra_for_ncr ELSE 0 END
  ORDER BY transaction_datetime DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure stores are created for all regions
CREATE OR REPLACE FUNCTION ensure_regional_coverage()
RETURNS TABLE (
  region TEXT,
  stores_created INTEGER
) AS $$
DECLARE
  r TEXT;
  created_count INTEGER;
BEGIN
  -- All Philippine regions
  FOR r IN (
    SELECT unnest(ARRAY[
      'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region IV-B',
      'Region V', 'Region VI', 'Region VII', 'Region VIII', 'Region IX', 'Region X',
      'Region XI', 'Region XII', 'Region XIII', 'CAR', 'CARAGA', 'BARMM'
    ])
  ) LOOP
    -- Check if region has stores
    SELECT COUNT(*) INTO created_count
    FROM stores s
    WHERE s.region = r;
    
    -- If no stores, create sample stores
    IF created_count = 0 THEN
      -- Insert sample stores for the region
      INSERT INTO stores (
        store_code,
        store_name,
        region,
        city,
        barangay,
        store_type,
        status
      )
      SELECT
        'STR-' || r || '-' || LPAD(generate_series::text, 3, '0'),
        'Sample Store ' || generate_series || ' - ' || r,
        r,
        CASE r
          WHEN 'NCR' THEN (ARRAY['Manila', 'Quezon City', 'Makati', 'Pasig'])[1 + (generate_series % 4)]
          WHEN 'Region I' THEN (ARRAY['San Fernando', 'Vigan', 'Laoag'])[1 + (generate_series % 3)]
          WHEN 'Region II' THEN (ARRAY['Tuguegarao', 'Santiago', 'Cauayan'])[1 + (generate_series % 3)]
          WHEN 'Region III' THEN (ARRAY['San Fernando', 'Angeles', 'Malolos'])[1 + (generate_series % 3)]
          WHEN 'Region IV-A' THEN (ARRAY['Antipolo', 'Bacoor', 'Imus'])[1 + (generate_series % 3)]
          WHEN 'Region IV-B' THEN (ARRAY['Calapan', 'Puerto Princesa', 'Mamburao'])[1 + (generate_series % 3)]
          WHEN 'Region V' THEN (ARRAY['Legazpi', 'Naga', 'Sorsogon'])[1 + (generate_series % 3)]
          WHEN 'Region VI' THEN (ARRAY['Iloilo City', 'Bacolod', 'Roxas'])[1 + (generate_series % 3)]
          WHEN 'Region VII' THEN (ARRAY['Cebu City', 'Mandaue', 'Lapu-Lapu'])[1 + (generate_series % 3)]
          WHEN 'Region VIII' THEN (ARRAY['Tacloban', 'Ormoc', 'Baybay'])[1 + (generate_series % 3)]
          WHEN 'Region IX' THEN (ARRAY['Zamboanga City', 'Pagadian', 'Dipolog'])[1 + (generate_series % 3)]
          WHEN 'Region X' THEN (ARRAY['Cagayan de Oro', 'Iligan', 'Valencia'])[1 + (generate_series % 3)]
          WHEN 'Region XI' THEN (ARRAY['Davao City', 'Tagum', 'Panabo'])[1 + (generate_series % 3)]
          WHEN 'Region XII' THEN (ARRAY['General Santos', 'Koronadal', 'Tacurong'])[1 + (generate_series % 3)]
          WHEN 'Region XIII' THEN (ARRAY['Butuan', 'Cabadbaran', 'Bayugan'])[1 + (generate_series % 3)]
          WHEN 'CAR' THEN (ARRAY['Baguio', 'La Trinidad', 'Tabuk'])[1 + (generate_series % 3)]
          WHEN 'CARAGA' THEN (ARRAY['Butuan', 'Surigao', 'Tandag'])[1 + (generate_series % 3)]
          WHEN 'BARMM' THEN (ARRAY['Cotabato City', 'Marawi', 'Lamitan'])[1 + (generate_series % 3)]
          ELSE 'City ' || generate_series
        END,
        'Barangay ' || generate_series,
        CASE (generate_series % 3)
          WHEN 0 THEN 'sari-sari'
          WHEN 1 THEN 'supermarket'
          ELSE 'convenience'
        END,
        'active'
      FROM generate_series(1, 5);
      
      created_count := 5;
    END IF;
    
    region := r;
    stores_created := created_count;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- View for regional distribution analytics
CREATE OR REPLACE VIEW v_regional_distribution AS
WITH regional_stats AS (
  SELECT 
    s.region,
    COUNT(DISTINCT s.id) as store_count,
    COUNT(DISTINCT t.id) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.customer_id) as unique_customers,
    COUNT(DISTINCT p.category_id) as product_categories_sold
  FROM stores s
  LEFT JOIN transactions t ON s.id = t.store_id AND t.status = 'completed'
  LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
  LEFT JOIN products p ON ti.product_id = p.id
  GROUP BY s.region
)
SELECT 
  region,
  store_count,
  transaction_count,
  total_sales,
  avg_transaction_value,
  unique_customers,
  product_categories_sold,
  ROUND(100.0 * transaction_count / NULLIF(SUM(transaction_count) OVER (), 0), 2) as transaction_percentage,
  ROUND(100.0 * total_sales / NULLIF(SUM(total_sales) OVER (), 0), 2) as sales_percentage
FROM regional_stats
ORDER BY 
  CASE 
    WHEN region = 'NCR' THEN 1
    WHEN region LIKE 'Region%' THEN 2
    ELSE 3
  END,
  region;

-- Function to reorder existing transactions for better regional distribution
CREATE OR REPLACE FUNCTION reorder_for_regional_representation()
RETURNS TEXT AS $$
DECLARE
  regions TEXT[];
  region_text TEXT;
  counter INTEGER := 0;
  transaction_record RECORD;
  new_order INTEGER := 1;
BEGIN
  -- Get all regions with transactions
  SELECT ARRAY_AGG(DISTINCT s.region ORDER BY s.region)
  INTO regions
  FROM stores s
  JOIN transactions t ON s.id = t.store_id;
  
  -- Create temp table for new ordering
  CREATE TEMP TABLE temp_transaction_order (
    transaction_id UUID,
    new_order INTEGER
  );
  
  -- Round-robin assignment of order
  WHILE new_order <= 1000 LOOP
    FOREACH region_text IN ARRAY regions LOOP
      -- Get next transaction from this region
      FOR transaction_record IN (
        SELECT t.id
        FROM transactions t
        JOIN stores s ON t.store_id = s.id
        WHERE s.region = region_text
        AND NOT EXISTS (
          SELECT 1 FROM temp_transaction_order tto 
          WHERE tto.transaction_id = t.id
        )
        ORDER BY t.transaction_datetime DESC
        LIMIT 1
      ) LOOP
        INSERT INTO temp_transaction_order (transaction_id, new_order)
        VALUES (transaction_record.id, new_order);
        
        new_order := new_order + 1;
        EXIT WHEN new_order > 1000;
      END LOOP;
      
      EXIT WHEN new_order > 1000;
    END LOOP;
  END LOOP;
  
  -- Update transaction created_at to reflect new order
  -- (This maintains the actual transaction dates but changes display order)
  UPDATE transactions t
  SET created_at = NOW() - (tto.new_order || ' minutes')::INTERVAL
  FROM temp_transaction_order tto
  WHERE t.id = tto.transaction_id;
  
  DROP TABLE temp_transaction_order;
  
  RETURN 'Successfully reordered first 1000 transactions for regional representation';
END;
$$ LANGUAGE plpgsql;

-- Create index for representative sampling performance
CREATE INDEX IF NOT EXISTS idx_transactions_region_datetime 
ON transactions(store_id, transaction_datetime DESC)
INCLUDE (total_amount, items_count, payment_method);