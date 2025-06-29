/*
  # Suki Analytics Seed Data
  
  This seed file populates the database with realistic Philippine retail data
  Following the PRD specifications for market patterns and distributions
*/

-- Clear existing data (optional - comment out if you want to preserve existing data)
-- TRUNCATE TABLE transactions, inventory_levels, price_changes, competitor_pricing, product_combinations, ai_insights, customer_segments RESTART IDENTITY CASCADE;

-- Seed Customer Segments
INSERT INTO customer_segments (segment_name, segment_type, description, criteria, customer_count, avg_transaction_value, total_revenue) VALUES
  ('Regular Customers', 'behavioral', 'Everyday shoppers who visit frequently', '{"frequency": ">3/week", "basket_size": "medium"}', 4500, 157.50, 708750.00),
  ('Suki VIPs', 'behavioral', 'Loyal customers with credit privileges', '{"has_utang": true, "frequency": ">5/week"}', 1200, 285.30, 342360.00),
  ('Student Buyers', 'demographic', 'Students buying snacks and beverages', '{"customer_type": "Student", "time": "afternoon"}', 2100, 45.80, 96180.00),
  ('Senior Citizens', 'demographic', 'Senior customers with special discounts', '{"customer_type": "Senior", "age": ">60"}', 850, 125.60, 106760.00),
  ('Weekend Warriors', 'behavioral', 'High-value weekend shoppers', '{"day": "weekend", "basket_size": "large"}', 1800, 325.40, 585720.00),
  ('Payday Shoppers', 'behavioral', 'Bulk buyers during payday', '{"day": [15, 30], "basket_size": ">500"}', 2200, 485.90, 1068980.00),
  ('Morning Commuters', 'behavioral', 'Early morning coffee and breakfast buyers', '{"hour": "6-9", "products": ["coffee", "bread"]}', 1650, 68.50, 113025.00),
  ('Cigarette Buyers', 'behavioral', 'Regular tobacco purchasers', '{"products": ["tobacco"], "frequency": "daily"}', 980, 125.00, 122500.00);

-- Seed Product Combinations (Frequently Bought Together)
WITH product_pairs AS (
  SELECT 
    o1.id as product_1_id,
    o2.id as product_2_id,
    o1.sku as sku1,
    o2.sku as sku2
  FROM organization o1
  CROSS JOIN organization o2
  WHERE o1.id < o2.id
)
INSERT INTO product_combinations (product_1_id, product_2_id, combination_frequency, confidence_score, lift_value, avg_basket_value)
SELECT 
  product_1_id,
  product_2_id,
  combination_frequency,
  confidence_score,
  lift_value,
  avg_basket_value
FROM (
  -- Cigarettes + Beverages (very common in Philippines)
  SELECT 
    p.product_1_id,
    p.product_2_id,
    567 as combination_frequency,
    67.0 as confidence_score,
    2.8 as lift_value,
    125.00 as avg_basket_value
  FROM product_pairs p
  WHERE p.sku1 IN ('MAR100', 'WIN100') AND p.sku2 IN ('COKE250', 'SPR250', 'ROY250')
  
  UNION ALL
  
  -- Shampoo + Conditioner
  SELECT 
    p.product_1_id,
    p.product_2_id,
    234 as combination_frequency,
    45.0 as confidence_score,
    3.2 as lift_value,
    89.00 as avg_basket_value
  FROM product_pairs p
  WHERE p.sku1 IN ('HS200', 'DVE200') AND p.sku2 IN ('PMV200', 'SFG130')
  
  UNION ALL
  
  -- Coffee + Crackers (common breakfast)
  SELECT 
    p.product_1_id,
    p.product_2_id,
    189 as combination_frequency,
    38.0 as confidence_score,
    2.1 as lift_value,
    45.00 as avg_basket_value
  FROM product_pairs p
  WHERE p.sku1 IN ('NES50', 'KOP25') AND p.sku2 IN ('SKY25', 'OPR30')
  
  UNION ALL
  
  -- Chips + Drinks (snack time)
  SELECT 
    p.product_1_id,
    p.product_2_id,
    156 as combination_frequency,
    32.0 as confidence_score,
    1.9 as lift_value,
    55.00 as avg_basket_value
  FROM product_pairs p
  WHERE p.sku1 IN ('OPR30', 'OCP100', 'JCH60') AND p.sku2 IN ('C2S350', 'GAT500', 'PWD500')
  
  UNION ALL
  
  -- Detergent + Fabric Softener
  SELECT 
    p.product_1_id,
    p.product_2_id,
    98 as combination_frequency,
    25.0 as confidence_score,
    2.5 as lift_value,
    78.00 as avg_basket_value
  FROM product_pairs p
  WHERE p.sku1 IN ('SRF100', 'TID135') AND p.sku2 IN ('DWN200')
) AS combinations
ON CONFLICT (product_1_id, product_2_id) DO NOTHING;

-- Seed AI Insights
INSERT INTO ai_insights (insight_type, category, severity, title, description, data, action_items, expires_at) VALUES
  ('trend', 'sales', 'opportunity', 'Peak Hour Opportunity: 3-5 PM', 
   'Sales during 3-5 PM are 23% higher than average. This coincides with school dismissal and merienda time.',
   '{"peak_sales": 15680, "avg_sales": 12750, "growth": 23}',
   '["Ensure full stock of popular snacks by 2:30 PM", "Add student combo promos", "Staff additional cashier 3-5 PM"]',
   NOW() + INTERVAL '7 days'),
   
  ('anomaly', 'inventory', 'warning', 'Brand Switching Alert: Palmolive→Pantene', 
   'Customers are switching from Palmolive to Pantene shampoo. 15% increase in substitution this week.',
   '{"from_brand": "Palmolive", "to_brand": "Pantene", "switch_rate": 15}',
   '["Investigate Palmolive stock levels", "Check competitor pricing", "Consider Palmolive promotion"]',
   NOW() + INTERVAL '3 days'),
   
  ('recommendation', 'inventory', 'info', 'Stock Suggestion: Yelo for Afternoon', 
   'Based on temperature patterns and historical data, recommend stocking 20% more Yelo drinks for afternoon rush.',
   '{"current_stock": 50, "recommended": 60, "afternoon_demand": 45}',
   '["Order additional Yelo stock", "Place in prominent cooler position", "Bundle with popular chips"]',
   NOW() + INTERVAL '1 day'),
   
  ('prediction', 'sales', 'opportunity', 'Weekend Sales Forecast', 
   'Expecting 35% increase in sales this weekend due to local fiesta. Focus on beverages and snacks.',
   '{"predicted_increase": 35, "top_categories": ["Beverages", "Snacks"], "confidence": 85}',
   '["Double beverage stock by Friday", "Prepare bulk purchase discounts", "Schedule extra staff"]',
   NOW() + INTERVAL '5 days'),
   
  ('trend', 'customer', 'info', 'Utang Payment Trend', 
   'Utang/Lista payments peak at month-end (days 25-31), representing 45% of transactions.',
   '{"peak_days": [25, 26, 27, 28, 29, 30, 31], "utang_percentage": 45}',
   '["Prepare collection reminders", "Increase credit limit for regular sukis", "Track outstanding balances"]',
   NOW() + INTERVAL '30 days'),
   
  ('anomaly', 'pricing', 'critical', 'Competitor Price Drop: Lucky Me', 
   'Nearby store dropped Lucky Me pancit canton price by ₱2. May impact sales volume.',
   '{"competitor_price": 13, "our_price": 15, "price_gap": 2}',
   '["Match competitor price", "Create bundle deal", "Monitor sales impact"]',
   NOW() + INTERVAL '2 days'),
   
  ('recommendation', 'customer', 'opportunity', 'Cross-sell Opportunity', 
   '67% of cigarette buyers also purchase drinks. Not all are being offered drinks at checkout.',
   '{"correlation": 67, "missed_opportunities": 125, "potential_revenue": 3750}',
   '["Train staff on suggestive selling", "Place drinks near cigarette display", "Create cigarette+drink combos"]',
   NOW() + INTERVAL '14 days'),
   
  ('trend', 'sales', 'info', 'Payday Pattern Detected', 
   'Sales spike 40% on the 15th and 30th of each month. Plan inventory accordingly.',
   '{"payday_spike": 40, "regular_days_avg": 12500, "payday_avg": 17500}',
   '["Stock up 2 days before payday", "Prepare bulk purchase promos", "Extend store hours on paydays"]',
   NOW() + INTERVAL '30 days');

-- Seed Current Inventory Levels
INSERT INTO inventory_levels (organization_id, geography_id, current_stock, reorder_point, max_stock, stock_status)
SELECT 
  o.id as organization_id,
  g.id as geography_id,
  CASE 
    WHEN o.category = 'Beverages' THEN FLOOR(RANDOM() * 50 + 20)
    WHEN o.category = 'Snacks' THEN FLOOR(RANDOM() * 100 + 30)
    WHEN o.category = 'Personal Care' THEN FLOOR(RANDOM() * 30 + 10)
    ELSE FLOOR(RANDOM() * 40 + 15)
  END as current_stock,
  CASE 
    WHEN o.category = 'Beverages' THEN 15
    WHEN o.category = 'Snacks' THEN 25
    ELSE 10
  END as reorder_point,
  CASE 
    WHEN o.category = 'Beverages' THEN 100
    WHEN o.category = 'Snacks' THEN 200
    ELSE 75
  END as max_stock,
  CASE 
    WHEN RANDOM() < 0.1 THEN 'critical'
    WHEN RANDOM() < 0.25 THEN 'low'
    WHEN RANDOM() < 0.9 THEN 'normal'
    ELSE 'overstock'
  END as stock_status
FROM organization o
CROSS JOIN geography g
WHERE g.store_name IN ('Aling Nena Store', 'Mang Juan Sari-Sari', 'Ate Rose Store')
ON CONFLICT (organization_id, geography_id) DO NOTHING;

-- Seed Recent Price Changes
INSERT INTO price_changes (organization_id, old_price, new_price, change_percentage, change_reason, implemented_at)
SELECT 
  o.id as organization_id,
  o.unit_price as old_price,
  o.unit_price * (1 + change_percent) as new_price,
  change_percent * 100 as change_percentage,
  reason,
  implemented_date
FROM organization o
CROSS JOIN (
  VALUES 
    (0.05, 'Supplier price increase', NOW() - INTERVAL '7 days'),
    (-0.03, 'Promotional discount', NOW() - INTERVAL '3 days'),
    (0.02, 'Inflation adjustment', NOW() - INTERVAL '14 days')
) AS changes(change_percent, reason, implemented_date)
WHERE o.sku IN ('COKE250', 'MAR100', 'LKM55', 'HS200', 'SRF100')
  AND RANDOM() < 0.3;

-- Seed Competitor Pricing
INSERT INTO competitor_pricing (organization_id, competitor_name, competitor_price, price_difference, price_difference_percent, observed_date, source)
SELECT 
  o.id as organization_id,
  c.competitor_name,
  o.unit_price * (1 + c.price_variance) as competitor_price,
  o.unit_price * c.price_variance as price_difference,
  c.price_variance * 100 as price_difference_percent,
  CURRENT_DATE - INTERVAL '1 day' * c.days_ago as observed_date,
  'manual'
FROM organization o
CROSS JOIN (
  VALUES 
    ('7-Eleven', -0.05, 1),
    ('Mercury Drug', 0.03, 2),
    ('Puregold', -0.08, 1),
    ('SM Hypermarket', -0.10, 3)
) AS c(competitor_name, price_variance, days_ago)
WHERE o.category IN ('Beverages', 'Snacks', 'Personal Care')
  AND RANDOM() < 0.4
ON CONFLICT (organization_id, competitor_name, observed_date) DO NOTHING;

-- Create Dashboard Metrics for Quick Loading
INSERT INTO dashboard_metrics (metric_key, metric_date, geography_id, category, value, metadata)
SELECT 
  'daily_sales',
  CURRENT_DATE,
  g.id,
  NULL,
  RANDOM() * 50000 + 10000,
  jsonb_build_object(
    'transactions', FLOOR(RANDOM() * 200 + 50),
    'unique_products', FLOOR(RANDOM() * 40 + 20)
  )
FROM geography g
WHERE g.region IN ('NCR', 'Region III', 'Region VII')
ON CONFLICT (metric_key, metric_date, geography_id, category) DO NOTHING;

-- Add category-specific metrics
INSERT INTO dashboard_metrics (metric_key, metric_date, geography_id, category, value, metadata)
SELECT 
  'category_sales',
  CURRENT_DATE,
  NULL,
  category,
  RANDOM() * 20000 + 5000,
  jsonb_build_object(
    'top_brand', 
    CASE category
      WHEN 'Beverages' THEN 'Coca-Cola'
      WHEN 'Snacks' THEN 'Oishi'
      WHEN 'Personal Care' THEN 'Safeguard'
      WHEN 'Dairy' THEN 'Bear Brand'
      ELSE 'Various'
    END,
    'growth_rate', ROUND((RANDOM() * 30 - 10)::numeric, 2)
  )
FROM (SELECT DISTINCT category FROM organization) o
ON CONFLICT (metric_key, metric_date, geography_id, category) DO NOTHING;

-- Summary of seeded data
DO $$
BEGIN
  RAISE NOTICE 'Seed data loaded successfully!';
  RAISE NOTICE '- Customer segments: 8';
  RAISE NOTICE '- Product combinations: Multiple based on actual products';
  RAISE NOTICE '- AI insights: 8';
  RAISE NOTICE '- Inventory levels: For top 3 stores';
  RAISE NOTICE '- Price changes: Recent changes for popular products';
  RAISE NOTICE '- Competitor pricing: Market comparison data';
  RAISE NOTICE '- Dashboard metrics: Pre-calculated for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Run generate_full_dataset(750000) to create transaction history!';
END $$;