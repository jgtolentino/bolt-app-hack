-- Comprehensive data seeding script for all tables
-- This script will populate all tables with realistic sample data

-- First, ensure all required tables exist
-- The transaction_items table is created in the previous migration

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE public.transaction_items CASCADE;
-- TRUNCATE TABLE public.transactions CASCADE;
-- TRUNCATE TABLE public.organization CASCADE;
-- TRUNCATE TABLE public.geography CASCADE;

-- Seed geography table with Philippine locations
INSERT INTO public.geography (region, city_municipality, barangay, latitude, longitude, store_name, store_type, is_active) VALUES
-- NCR (Metro Manila)
('NCR', 'Makati City', 'Poblacion', 14.5648, 121.0271, 'Suqi Store Makati 1', 'Supermarket', true),
('NCR', 'Makati City', 'Bel-Air', 14.5585, 121.0245, 'Suqi Store Makati 2', 'Convenience', true),
('NCR', 'Quezon City', 'Diliman', 14.6488, 121.0509, 'Suqi Store QC 1', 'Supermarket', true),
('NCR', 'Manila', 'Ermita', 14.5832, 120.9845, 'Suqi Store Manila 1', 'Convenience', true),
('NCR', 'Pasig City', 'Ortigas', 14.5877, 121.0619, 'Suqi Store Pasig 1', 'Supermarket', true),
-- Region VII (Central Visayas)
('Region VII', 'Cebu City', 'Lahug', 10.3338, 123.8941, 'Suqi Store Cebu 1', 'Supermarket', true),
('Region VII', 'Cebu City', 'IT Park', 10.3298, 123.9052, 'Suqi Store Cebu 2', 'Convenience', true),
('Region VII', 'Mandaue City', 'Centro', 10.3236, 123.9222, 'Suqi Store Mandaue 1', 'Supermarket', true),
-- Region III (Central Luzon)
('Region III', 'Angeles City', 'Balibago', 15.1629, 120.5888, 'Suqi Store Angeles 1', 'Supermarket', true),
('Region III', 'San Fernando', 'Dolores', 15.0286, 120.6898, 'Suqi Store SF 1', 'Convenience', true),
-- Region IV-A (CALABARZON)
('Region IV-A', 'Antipolo City', 'Mayamot', 14.5865, 121.1761, 'Suqi Store Antipolo 1', 'Supermarket', true),
('Region IV-A', 'Batangas City', 'Centro', 13.7565, 121.0583, 'Suqi Store Batangas 1', 'Convenience', true),
-- Region VI (Western Visayas)
('Region VI', 'Iloilo City', 'Jaro', 10.7202, 122.5621, 'Suqi Store Iloilo 1', 'Supermarket', true),
('Region VI', 'Bacolod City', 'Mandalagan', 10.6407, 122.9688, 'Suqi Store Bacolod 1', 'Convenience', true)
ON CONFLICT DO NOTHING;

-- Seed organization table with products
INSERT INTO public.organization (client, category, brand, sku, description, barcode, unit_price, cost_price, currency, is_active) VALUES
-- Beverages
('Coca-Cola', 'Beverages', 'Coca-Cola', 'COKE-355ML', 'Coca-Cola 355ml Can', '4800016110122', 35.00, 28.00, 'PHP', true),
('Coca-Cola', 'Beverages', 'Coca-Cola', 'COKE-1.5L', 'Coca-Cola 1.5L Bottle', '4800016110139', 75.00, 60.00, 'PHP', true),
('Coca-Cola', 'Beverages', 'Sprite', 'SPRITE-355ML', 'Sprite 355ml Can', '4800016110146', 35.00, 28.00, 'PHP', true),
('Pepsi', 'Beverages', 'Pepsi', 'PEPSI-355ML', 'Pepsi 355ml Can', '4800016110153', 32.00, 25.60, 'PHP', true),
('Universal Robina', 'Beverages', 'C2', 'C2-GREEN-500ML', 'C2 Green Tea 500ml', '4800016110160', 25.00, 20.00, 'PHP', true),
('Nestle', 'Beverages', 'Milo', 'MILO-300ML', 'Milo Ready to Drink 300ml', '4800016110177', 28.00, 22.40, 'PHP', true),
('Alaska', 'Beverages', 'Alaska', 'ALASKA-CHOCO-250ML', 'Alaska Chocolate Milk 250ml', '4800016110184', 30.00, 24.00, 'PHP', true),
-- Snacks
('Oishi', 'Snacks', 'Oishi', 'OISHI-PRAWN-60G', 'Oishi Prawn Crackers 60g', '4800194110122', 15.00, 12.00, 'PHP', true),
('Oishi', 'Snacks', 'Oishi', 'OISHI-PILLOWS-38G', 'Oishi Pillows Chocolate 38g', '4800194110139', 10.00, 8.00, 'PHP', true),
('Jack n Jill', 'Snacks', 'Piattos', 'PIATTOS-85G', 'Piattos Cheese 85g', '4800016111122', 25.00, 20.00, 'PHP', true),
('Jack n Jill', 'Snacks', 'Nova', 'NOVA-78G', 'Nova Country Cheddar 78g', '4800016111139', 22.00, 17.60, 'PHP', true),
('Ricoa', 'Snacks', 'Curly Tops', 'CURLY-TOPS-150G', 'Ricoa Curly Tops 150g', '4806502721108', 45.00, 36.00, 'PHP', true),
-- Dairy
('Alaska', 'Dairy', 'Alaska', 'ALASKA-EVAP-410ML', 'Alaska Evaporated Milk 410ml', '4800092110122', 42.00, 33.60, 'PHP', true),
('Alaska', 'Dairy', 'Alaska', 'ALASKA-CONDENSED-300ML', 'Alaska Condensada 300ml', '4800092110139', 38.00, 30.40, 'PHP', true),
('Bear Brand', 'Dairy', 'Bear Brand', 'BEAR-BRAND-300ML', 'Bear Brand Milk 300ml', '4800361381284', 40.00, 32.00, 'PHP', true),
('Nestle', 'Dairy', 'Nestle', 'NESTLE-CREAM-250ML', 'Nestle All Purpose Cream 250ml', '4800361381291', 35.00, 28.00, 'PHP', true),
('Magnolia', 'Dairy', 'Magnolia', 'MAGNOLIA-FRESH-1L', 'Magnolia Fresh Milk 1L', '4800088110122', 95.00, 76.00, 'PHP', true),
-- Personal Care
('Unilever', 'Personal Care', 'Safeguard', 'SAFEGUARD-135G', 'Safeguard White 135g', '4800888110122', 35.00, 28.00, 'PHP', true),
('Unilever', 'Personal Care', 'Dove', 'DOVE-135G', 'Dove Beauty Bar 135g', '4800888110139', 65.00, 52.00, 'PHP', true),
('P&G', 'Personal Care', 'Head & Shoulders', 'H&S-SHAMPOO-180ML', 'Head & Shoulders Shampoo 180ml', '4902430110122', 125.00, 100.00, 'PHP', true),
('Colgate', 'Personal Care', 'Colgate', 'COLGATE-150G', 'Colgate Maximum Cavity Protection 150g', '8850006110122', 45.00, 36.00, 'PHP', true),
-- Home Care
('P&G', 'Home Care', 'Tide', 'TIDE-1KG', 'Tide Powder Detergent 1kg', '4902430211122', 125.00, 100.00, 'PHP', true),
('Unilever', 'Home Care', 'Surf', 'SURF-1KG', 'Surf Powder Detergent 1kg', '4800888211122', 115.00, 92.00, 'PHP', true),
('P&G', 'Home Care', 'Joy', 'JOY-495ML', 'Joy Dishwashing Liquid 495ml', '4902430211139', 55.00, 44.00, 'PHP', true),
('Unilever', 'Home Care', 'Domex', 'DOMEX-500ML', 'Domex Toilet Cleaner 500ml', '4800888211139', 45.00, 36.00, 'PHP', true),
-- Food
('Century Pacific', 'Food', 'Century Tuna', 'CTUNA-180G', 'Century Tuna Flakes in Oil 180g', '748485100122', 35.00, 28.00, 'PHP', true),
('Century Pacific', 'Food', 'Argentina', 'ARG-BEEF-175G', 'Argentina Corned Beef 175g', '748485100139', 45.00, 36.00, 'PHP', true),
('Del Monte', 'Food', 'Del Monte', 'DELMONTE-PINE-1L', 'Del Monte Pineapple Juice 1L', '4800024110122', 85.00, 68.00, 'PHP', true),
('Nestle', 'Food', 'Maggi', 'MAGGI-CUBE-10G', 'Maggi Magic Sarap 10g x 12', '4800361481284', 24.00, 19.20, 'PHP', true),
('Lucky Me', 'Food', 'Lucky Me', 'LUCKYME-PANCIT-60G', 'Lucky Me Pancit Canton Original 60g', '4807770110122', 12.00, 9.60, 'PHP', true),
('Nissin', 'Food', 'Nissin', 'NISSIN-WAFER-20G', 'Nissin Wafer 20g', '4800016210122', 8.00, 6.40, 'PHP', true)
ON CONFLICT DO NOTHING;

-- Generate sample transactions for the last 90 days
DO $$
DECLARE
  v_transaction_id UUID;
  v_store_id UUID;
  v_product RECORD;
  v_quantity INTEGER;
  v_discount DECIMAL;
  v_date TIMESTAMP;
  v_hour INTEGER;
  v_customer_type VARCHAR;
  v_payment_method VARCHAR;
  v_day_of_week INTEGER;
  i INTEGER;
  j INTEGER;
BEGIN
  -- Loop through days
  FOR i IN 0..89 LOOP
    v_date := CURRENT_DATE - INTERVAL '1 day' * i;
    v_day_of_week := EXTRACT(DOW FROM v_date);
    
    -- Generate 50-200 transactions per day based on day of week
    FOR j IN 1..(50 + RANDOM() * 150)::INTEGER LOOP
      -- Select random store
      SELECT id INTO v_store_id FROM public.geography ORDER BY RANDOM() LIMIT 1;
      
      -- Determine hour based on realistic patterns
      v_hour := CASE 
        WHEN RANDOM() < 0.05 THEN 6 + (RANDOM() * 3)::INTEGER  -- 5% early morning
        WHEN RANDOM() < 0.25 THEN 9 + (RANDOM() * 3)::INTEGER  -- 20% morning
        WHEN RANDOM() < 0.60 THEN 12 + (RANDOM() * 3)::INTEGER -- 35% lunch
        WHEN RANDOM() < 0.85 THEN 15 + (RANDOM() * 3)::INTEGER -- 25% afternoon
        ELSE 18 + (RANDOM() * 4)::INTEGER                      -- 15% evening
      END;
      
      -- Determine customer type
      v_customer_type := CASE (RANDOM() * 100)::INTEGER % 5
        WHEN 0 THEN 'Regular'
        WHEN 1 THEN 'Student'
        WHEN 2 THEN 'Senior'
        WHEN 3 THEN 'Employee'
        ELSE 'Walk-in'
      END;
      
      -- Determine payment method
      v_payment_method := CASE (RANDOM() * 100)::INTEGER % 10
        WHEN 0 THEN 'Credit Card'
        WHEN 1 THEN 'GCash'
        WHEN 2 THEN 'GCash'
        WHEN 3 THEN 'Maya'
        WHEN 4 THEN 'Bank Transfer'
        ELSE 'Cash'
      END;
      
      -- Create transaction
      INSERT INTO public.transactions (
        id, datetime, geography_id, total_amount, payment_method, 
        customer_type, customer_count, is_peak_hour
      ) VALUES (
        gen_random_uuid(),
        v_date + (v_hour || ' hours')::INTERVAL + (RANDOM() * 60 || ' minutes')::INTERVAL,
        v_store_id,
        0, -- Will update after adding items
        v_payment_method,
        v_customer_type,
        1,
        v_hour BETWEEN 12 AND 14 OR v_hour BETWEEN 18 AND 20
      ) RETURNING id INTO v_transaction_id;
      
      -- Add 1-10 items per transaction
      FOR k IN 1..(1 + RANDOM() * 9)::INTEGER LOOP
        -- Select random product
        SELECT * INTO v_product FROM public.organization 
        WHERE is_active = true 
        ORDER BY RANDOM() LIMIT 1;
        
        -- Determine quantity (1-5 items typically)
        v_quantity := (1 + RANDOM() * 4)::INTEGER;
        
        -- Apply discount occasionally (10% of items)
        v_discount := CASE WHEN RANDOM() < 0.1 
          THEN ROUND((v_product.unit_price * v_quantity * (0.05 + RANDOM() * 0.15))::NUMERIC, 2)
          ELSE 0 
        END;
        
        -- Insert transaction item
        INSERT INTO public.transaction_items (
          transaction_id, sku, product_name, category, brand,
          quantity, unit_price, total_price, discount_amount
        ) VALUES (
          v_transaction_id,
          v_product.sku,
          v_product.description,
          v_product.category,
          v_product.brand,
          v_quantity,
          v_product.unit_price,
          v_product.unit_price * v_quantity,
          v_discount
        );
      END LOOP;
      
      -- Update transaction total
      UPDATE public.transactions 
      SET total_amount = (
        SELECT SUM(total_price - discount_amount) 
        FROM public.transaction_items 
        WHERE transaction_id = v_transaction_id
      )
      WHERE id = v_transaction_id;
      
    END LOOP;
  END LOOP;
END $$;

-- Create analytics_daily aggregated data
INSERT INTO public.analytics_daily (date, region, city_municipality, barangay, total_sales, transaction_count, unique_customers, top_category, top_brand, top_sku)
SELECT 
  DATE(t.datetime) as date,
  g.region,
  g.city_municipality,
  g.barangay,
  SUM(t.total_amount) as total_sales,
  COUNT(DISTINCT t.id) as transaction_count,
  COUNT(DISTINCT t.customer_type) * 100 as unique_customers, -- Approximation
  (
    SELECT ti.category 
    FROM public.transaction_items ti 
    WHERE ti.transaction_id IN (
      SELECT id FROM public.transactions 
      WHERE geography_id = g.id 
      AND DATE(datetime) = DATE(t.datetime)
    )
    GROUP BY ti.category 
    ORDER BY SUM(ti.total_price) DESC 
    LIMIT 1
  ) as top_category,
  (
    SELECT ti.brand 
    FROM public.transaction_items ti 
    WHERE ti.transaction_id IN (
      SELECT id FROM public.transactions 
      WHERE geography_id = g.id 
      AND DATE(datetime) = DATE(t.datetime)
    )
    GROUP BY ti.brand 
    ORDER BY SUM(ti.total_price) DESC 
    LIMIT 1
  ) as top_brand,
  (
    SELECT ti.sku 
    FROM public.transaction_items ti 
    WHERE ti.transaction_id IN (
      SELECT id FROM public.transactions 
      WHERE geography_id = g.id 
      AND DATE(datetime) = DATE(t.datetime)
    )
    GROUP BY ti.sku 
    ORDER BY SUM(ti.total_price) DESC 
    LIMIT 1
  ) as top_sku
FROM public.transactions t
JOIN public.geography g ON t.geography_id = g.id
WHERE t.datetime >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(t.datetime), g.id, g.region, g.city_municipality, g.barangay
ON CONFLICT DO NOTHING;

-- Populate customer_segments
INSERT INTO public.customer_segments (segment_name, customer_count, avg_transaction_value, avg_frequency, total_revenue, key_characteristics)
SELECT 
  customer_type as segment_name,
  COUNT(DISTINCT id) as customer_count,
  AVG(total_amount) as avg_transaction_value,
  COUNT(*) / NULLIF(COUNT(DISTINCT DATE(datetime)), 0) as avg_frequency,
  SUM(total_amount) as total_revenue,
  CASE customer_type
    WHEN 'Regular' THEN '{"age_range": "25-45", "shopping_time": "varied", "basket_size": "medium", "loyalty": "high"}'
    WHEN 'Student' THEN '{"age_range": "15-24", "shopping_time": "afternoon", "basket_size": "small", "loyalty": "medium"}'
    WHEN 'Senior' THEN '{"age_range": "60+", "shopping_time": "morning", "basket_size": "medium", "loyalty": "high"}'
    WHEN 'Employee' THEN '{"age_range": "25-55", "shopping_time": "lunch/evening", "basket_size": "large", "loyalty": "medium"}'
    ELSE '{"age_range": "varied", "shopping_time": "varied", "basket_size": "small", "loyalty": "low"}'
  END::JSONB as key_characteristics
FROM public.transactions
WHERE datetime >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY customer_type
ON CONFLICT DO NOTHING;

-- Populate product_combinations (frequently bought together)
INSERT INTO public.product_combinations (primary_sku, secondary_sku, frequency, confidence_score)
SELECT 
  ti1.sku as primary_sku,
  ti2.sku as secondary_sku,
  COUNT(*) as frequency,
  (COUNT(*)::FLOAT / (
    SELECT COUNT(DISTINCT transaction_id) 
    FROM public.transaction_items 
    WHERE sku = ti1.sku
  )) as confidence_score
FROM public.transaction_items ti1
JOIN public.transaction_items ti2 ON ti1.transaction_id = ti2.transaction_id AND ti1.sku < ti2.sku
WHERE ti1.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ti1.sku, ti2.sku
HAVING COUNT(*) >= 10
ORDER BY COUNT(*) DESC
LIMIT 100
ON CONFLICT DO NOTHING;

-- Populate substitution_patterns
INSERT INTO public.substitution_patterns (original_product, substitute_product, substitution_count, time_period)
VALUES
  ('COKE-355ML', 'PEPSI-355ML', 145, '30 days'),
  ('COKE-355ML', 'C2-GREEN-500ML', 87, '30 days'),
  ('OISHI-PRAWN-60G', 'PIATTOS-85G', 234, '30 days'),
  ('OISHI-PRAWN-60G', 'NOVA-78G', 189, '30 days'),
  ('ALASKA-EVAP-410ML', 'BEAR-BRAND-300ML', 167, '30 days'),
  ('TIDE-1KG', 'SURF-1KG', 298, '30 days'),
  ('H&S-SHAMPOO-180ML', 'DOVE-135G', 76, '30 days'),
  ('LUCKYME-PANCIT-60G', 'NISSIN-WAFER-20G', 342, '30 days')
ON CONFLICT DO NOTHING;

-- Generate AI insights
INSERT INTO public.ai_insights (insight_type, category, title, description, impact_score, recommendations, data_points)
VALUES
  ('trend', 'sales', 'Weekend Sales Surge', 'Sales increase by 35% on weekends, particularly Saturday afternoons', 85, 
   '["Increase staff during weekend peak hours", "Run weekend-specific promotions", "Ensure stock availability for high-demand items"]'::JSONB,
   '{"avg_weekday_sales": 125000, "avg_weekend_sales": 168750, "peak_day": "Saturday", "peak_hours": "14:00-18:00"}'::JSONB),
  
  ('anomaly', 'product', 'Unusual Demand for Instant Noodles', 'Lucky Me Pancit Canton sales increased 150% this week', 75,
   '["Investigate cause of surge", "Ensure adequate stock", "Consider bundle promotions", "Monitor competitor pricing"]'::JSONB,
   '{"normal_weekly_sales": 2500, "current_weekly_sales": 6250, "affected_stores": 8, "stock_risk": "high"}'::JSONB),
  
  ('optimization', 'inventory', 'Dairy Products Optimization', 'Dairy category shows consistent morning demand pattern', 70,
   '["Schedule dairy deliveries for early morning", "Adjust refrigeration capacity", "Train staff on FIFO rotation"]'::JSONB,
   '{"morning_sales_percent": 65, "optimal_stock_level": 850, "current_wastage": 3.2, "potential_savings": 12500}'::JSONB),
  
  ('prediction', 'seasonal', 'Upcoming Holiday Impact', 'Christmas season expected to increase sales by 45%', 90,
   '["Increase inventory by 40%", "Hire seasonal staff", "Prepare gift bundles", "Extend operating hours"]'::JSONB,
   '{"predicted_increase": 45, "categories_affected": ["Beverages", "Snacks", "Personal Care"], "preparation_timeline": "2 weeks"}'::JSONB)
ON CONFLICT DO NOTHING;

-- Populate dashboard_metrics for quick access
INSERT INTO public.dashboard_metrics (metric_name, metric_value, metric_type, metadata)
SELECT 
  'total_revenue' as metric_name,
  SUM(total_amount) as metric_value,
  'currency' as metric_type,
  jsonb_build_object('period', '30_days', 'currency', 'PHP') as metadata
FROM public.transactions
WHERE datetime >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 
  'total_transactions' as metric_name,
  COUNT(*) as metric_value,
  'count' as metric_type,
  jsonb_build_object('period', '30_days') as metadata
FROM public.transactions
WHERE datetime >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 
  'average_basket_size' as metric_name,
  AVG(total_amount) as metric_value,
  'currency' as metric_type,
  jsonb_build_object('period', '30_days', 'currency', 'PHP') as metadata
FROM public.transactions
WHERE datetime >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 
  'active_customers' as metric_name,
  COUNT(DISTINCT customer_type) * 250 as metric_value, -- Approximation
  'count' as metric_type,
  jsonb_build_object('period', '30_days', 'estimation_method', 'type_multiplier') as metadata
FROM public.transactions
WHERE datetime >= CURRENT_DATE - INTERVAL '30 days'
ON CONFLICT DO NOTHING;

-- Add sample inventory levels
INSERT INTO public.inventory_levels (geography_id, sku, current_stock, reorder_point, max_stock, last_restock_date)
SELECT 
  g.id as geography_id,
  o.sku,
  (100 + RANDOM() * 400)::INTEGER as current_stock,
  50 as reorder_point,
  500 as max_stock,
  CURRENT_DATE - (RANDOM() * 7)::INTEGER as last_restock_date
FROM public.geography g
CROSS JOIN public.organization o
WHERE g.is_active = true AND o.is_active = true
ON CONFLICT DO NOTHING;

-- Refresh materialized views if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'analytics_cat_perf') THEN
    REFRESH MATERIALIZED VIEW analytics_cat_perf;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'analytics_daily_trend') THEN
    REFRESH MATERIALIZED VIEW analytics_daily_trend;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'analytics_sku_velocity') THEN
    REFRESH MATERIALIZED VIEW analytics_sku_velocity;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'analytics_regional_mix') THEN
    REFRESH MATERIALIZED VIEW analytics_regional_mix;
  END IF;
END $$;

-- Final summary
DO $$
DECLARE
  v_transaction_count INTEGER;
  v_item_count INTEGER;
  v_total_revenue DECIMAL;
BEGIN
  SELECT COUNT(*) INTO v_transaction_count FROM public.transactions;
  SELECT COUNT(*) INTO v_item_count FROM public.transaction_items;
  SELECT SUM(total_amount) INTO v_total_revenue FROM public.transactions;
  
  RAISE NOTICE 'Data seeding completed successfully!';
  RAISE NOTICE 'Transactions created: %', v_transaction_count;
  RAISE NOTICE 'Transaction items created: %', v_item_count;
  RAISE NOTICE 'Total revenue generated: ₱%', TO_CHAR(v_total_revenue, 'FM999,999,999.00');
END $$;