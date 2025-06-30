-- Scout Analytics Medallion Architecture Implementation
-- Generated: 2025-07-01
-- This migration creates the complete Medallion layer structure

-- ============================================
-- BRONZE LAYER - Raw Data Ingestion
-- ============================================

-- Bronze: Raw STT transcriptions
CREATE TABLE IF NOT EXISTS bronze_transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  store_id TEXT,
  raw_payload JSONB NOT NULL,
  transcription_text TEXT,
  confidence_score DECIMAL(3,2),
  language_code TEXT DEFAULT 'tl-PH',
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  error_log TEXT
);

-- Bronze: Vision detection events
CREATE TABLE IF NOT EXISTS bronze_vision_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  store_id TEXT,
  detection_payload JSONB NOT NULL,
  object_class TEXT,
  confidence DECIMAL(3,2),
  bbox_coordinates JSONB,
  frame_timestamp TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Bronze: Raw POS transactions
CREATE TABLE IF NOT EXISTS bronze_pos_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pos_system_id TEXT,
  store_id TEXT,
  raw_transaction JSONB NOT NULL,
  transaction_ref TEXT,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  validation_errors JSONB
);

-- Bronze: Inventory events
CREATE TABLE IF NOT EXISTS bronze_inventory_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  system_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- stock_in, stock_out, adjustment
  raw_event JSONB NOT NULL,
  store_id TEXT,
  sku_code TEXT,
  quantity INTEGER,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Bronze: Customer interaction logs
CREATE TABLE IF NOT EXISTS bronze_customer_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_type TEXT NOT NULL, -- voice, gesture, app
  device_id TEXT,
  store_id TEXT,
  raw_data JSONB NOT NULL,
  customer_id TEXT,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Indexes for Bronze layer
CREATE INDEX idx_bronze_trans_unprocessed ON bronze_transcriptions(processed) WHERE processed = FALSE;
CREATE INDEX idx_bronze_vision_unprocessed ON bronze_vision_detections(processed) WHERE processed = FALSE;
CREATE INDEX idx_bronze_pos_unprocessed ON bronze_pos_transactions(processed) WHERE processed = FALSE;
CREATE INDEX idx_bronze_inv_unprocessed ON bronze_inventory_events(processed) WHERE processed = FALSE;
CREATE INDEX idx_bronze_cust_unprocessed ON bronze_customer_interactions(processed) WHERE processed = FALSE;

-- ============================================
-- SILVER LAYER - Cleaned & Validated Data
-- ============================================

-- Silver layer tables already exist (transactions, stores, products, etc.)
-- Adding new Silver views for consistency

-- Silver: Validated transcription insights
CREATE OR REPLACE VIEW silver_transcription_insights AS
SELECT 
  t.id,
  t.store_id,
  s.store_name,
  s.region,
  s.city_municipality,
  t.transcription_text,
  t.confidence_score,
  t.language_code,
  -- Extract structured data from transcription
  CASE 
    WHEN transcription_text ILIKE '%marlboro%' THEN 'branded'
    WHEN transcription_text ILIKE '%yosi%' THEN 'unbranded'
    ELSE 'unclear'
  END as request_type,
  -- Extract product mentions
  ARRAY(
    SELECT DISTINCT unnest(
      string_to_array(
        regexp_replace(transcription_text, '[^a-zA-Z0-9\s]', '', 'g'),
        ' '
      )
    )
  ) && ARRAY(SELECT DISTINCT product_name FROM products) as mentioned_products,
  t.ingested_at as captured_at
FROM bronze_transcriptions t
LEFT JOIN stores s ON t.store_id = s.store_id
WHERE t.processed = TRUE
  AND t.confidence_score > 0.7;

-- Silver: Product performance metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS silver_product_performance AS
SELECT 
  p.product_id,
  p.product_name,
  p.category_name,
  p.brand_name,
  cb.client_name,
  DATE_TRUNC('day', t.transaction_time) as date,
  COUNT(DISTINCT t.transaction_id) as transaction_count,
  SUM(ti.quantity) as units_sold,
  SUM(ti.subtotal) as revenue,
  AVG(ti.price) as avg_price,
  COUNT(DISTINCT t.store_id) as store_reach,
  COUNT(DISTINCT t.transaction_time::date) as active_days
FROM products p
JOIN transaction_items ti ON p.product_id = ti.product_id
JOIN transactions t ON ti.transaction_id = t.transaction_id
LEFT JOIN client_brands cb ON p.brand_name = cb.brand_name
WHERE t.transaction_time >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY 1,2,3,4,5,6;

-- Silver: Store hourly patterns
CREATE MATERIALIZED VIEW IF NOT EXISTS silver_store_hourly_patterns AS
SELECT 
  s.store_id,
  s.store_name,
  s.region,
  s.city_municipality,
  s.barangay,
  EXTRACT(hour FROM t.transaction_time) as hour_of_day,
  EXTRACT(dow FROM t.transaction_time) as day_of_week,
  COUNT(*) as transaction_count,
  SUM(t.total_amount) as hourly_revenue,
  AVG(t.total_amount) as avg_transaction_value,
  COUNT(DISTINCT t.transaction_time::date) as sample_days
FROM stores s
JOIN transactions t ON s.store_id = t.store_id
WHERE t.transaction_time >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY 1,2,3,4,5,6,7;

-- Silver: Customer behavior patterns
CREATE MATERIALIZED VIEW IF NOT EXISTS silver_customer_patterns AS
SELECT 
  DATE_TRUNC('week', transaction_time) as week,
  store_id,
  -- Basket composition
  AVG(item_count) as avg_items_per_basket,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY item_count) as median_basket_size,
  -- Purchase patterns
  COUNT(CASE WHEN item_count = 1 THEN 1 END)::float / COUNT(*) as single_item_ratio,
  COUNT(CASE WHEN item_count >= 5 THEN 1 END)::float / COUNT(*) as large_basket_ratio,
  -- Time patterns
  COUNT(CASE WHEN EXTRACT(hour FROM transaction_time) BETWEEN 6 AND 12 THEN 1 END)::float / COUNT(*) as morning_ratio,
  COUNT(CASE WHEN EXTRACT(hour FROM transaction_time) BETWEEN 12 AND 18 THEN 1 END)::float / COUNT(*) as afternoon_ratio,
  COUNT(CASE WHEN EXTRACT(hour FROM transaction_time) BETWEEN 18 AND 22 THEN 1 END)::float / COUNT(*) as evening_ratio
FROM (
  SELECT 
    t.transaction_id,
    t.transaction_time,
    t.store_id,
    COUNT(ti.product_id) as item_count
  FROM transactions t
  JOIN transaction_items ti ON t.transaction_id = ti.transaction_id
  GROUP BY 1,2,3
) basket_analysis
GROUP BY 1,2;

-- ============================================
-- GOLD LAYER - Business-Ready Analytics
-- ============================================

-- Gold: Executive KPI Dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS gold_executive_kpis AS
SELECT 
  CURRENT_DATE as report_date,
  -- Revenue KPIs
  SUM(CASE WHEN date = CURRENT_DATE THEN daily_revenue END) as today_revenue,
  SUM(CASE WHEN date = CURRENT_DATE - 1 THEN daily_revenue END) as yesterday_revenue,
  SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN daily_revenue END) as week_revenue,
  SUM(CASE WHEN date >= CURRENT_DATE - 30 THEN daily_revenue END) as month_revenue,
  -- Transaction KPIs
  SUM(CASE WHEN date = CURRENT_DATE THEN transaction_count END) as today_transactions,
  SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN transaction_count END) as week_transactions,
  -- Growth metrics
  (SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN daily_revenue END) - 
   SUM(CASE WHEN date >= CURRENT_DATE - 14 AND date < CURRENT_DATE - 7 THEN daily_revenue END)) /
   NULLIF(SUM(CASE WHEN date >= CURRENT_DATE - 14 AND date < CURRENT_DATE - 7 THEN daily_revenue END), 0) * 100 as week_over_week_growth,
  -- Store metrics
  COUNT(DISTINCT CASE WHEN date = CURRENT_DATE THEN store_id END) as active_stores_today,
  COUNT(DISTINCT CASE WHEN date >= CURRENT_DATE - 7 THEN store_id END) as active_stores_week
FROM (
  SELECT 
    store_id,
    DATE(transaction_time) as date,
    SUM(total_amount) as daily_revenue,
    COUNT(*) as transaction_count
  FROM transactions
  WHERE transaction_time >= CURRENT_DATE - 90
  GROUP BY 1,2
) daily_metrics;

-- Gold: Brand performance scores
CREATE MATERIALIZED VIEW IF NOT EXISTS gold_brand_performance AS
SELECT 
  brand_name,
  client_name,
  -- Core metrics
  SUM(revenue) as total_revenue,
  SUM(units_sold) as total_units,
  AVG(avg_price) as avg_selling_price,
  MAX(store_reach) as distribution_width,
  -- Performance scores (0-100 scale)
  NTILE(100) OVER (ORDER BY SUM(revenue)) as revenue_percentile,
  NTILE(100) OVER (ORDER BY SUM(units_sold)) as volume_percentile,
  NTILE(100) OVER (ORDER BY MAX(store_reach)) as distribution_percentile,
  -- Composite score
  (NTILE(100) OVER (ORDER BY SUM(revenue)) + 
   NTILE(100) OVER (ORDER BY SUM(units_sold)) + 
   NTILE(100) OVER (ORDER BY MAX(store_reach))) / 3.0 as overall_score,
  -- Trending
  CASE 
    WHEN SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN revenue END) > 
         SUM(CASE WHEN date >= CURRENT_DATE - 14 AND date < CURRENT_DATE - 7 THEN revenue END)
    THEN 'up'
    ELSE 'down'
  END as trend_direction
FROM silver_product_performance
WHERE date >= CURRENT_DATE - 30
GROUP BY 1,2;

-- Gold: AI-ready feature store
CREATE MATERIALIZED VIEW IF NOT EXISTS gold_ai_features AS
SELECT 
  p.product_id,
  p.product_name,
  p.category_name,
  p.brand_name,
  -- Time series features
  ARRAY_AGG(daily_revenue ORDER BY date) as revenue_timeseries,
  ARRAY_AGG(daily_units ORDER BY date) as units_timeseries,
  -- Statistical features
  AVG(daily_revenue) as avg_daily_revenue,
  STDDEV(daily_revenue) as revenue_volatility,
  MAX(daily_revenue) - MIN(daily_revenue) as revenue_range,
  -- Seasonal patterns
  AVG(CASE WHEN EXTRACT(dow FROM date) IN (0,6) THEN daily_revenue END) as weekend_avg_revenue,
  AVG(CASE WHEN EXTRACT(dow FROM date) NOT IN (0,6) THEN daily_revenue END) as weekday_avg_revenue,
  -- Growth features
  COALESCE(
    (SUM(CASE WHEN date >= CURRENT_DATE - 7 THEN daily_revenue END) - 
     SUM(CASE WHEN date >= CURRENT_DATE - 14 AND date < CURRENT_DATE - 7 THEN daily_revenue END)) /
     NULLIF(SUM(CASE WHEN date >= CURRENT_DATE - 14 AND date < CURRENT_DATE - 7 THEN daily_revenue END), 0),
    0
  ) as week_over_week_growth_rate
FROM products p
JOIN (
  SELECT 
    ti.product_id,
    DATE(t.transaction_time) as date,
    SUM(ti.subtotal) as daily_revenue,
    SUM(ti.quantity) as daily_units
  FROM transaction_items ti
  JOIN transactions t ON ti.transaction_id = t.transaction_id
  WHERE t.transaction_time >= CURRENT_DATE - 30
  GROUP BY 1,2
) daily_product_metrics ON p.product_id = daily_product_metrics.product_id
GROUP BY 1,2,3,4;

-- Gold: Substitution patterns
CREATE MATERIALIZED VIEW IF NOT EXISTS gold_substitution_matrix AS
WITH product_pairs AS (
  SELECT 
    ti1.product_id as product_a,
    ti2.product_id as product_b,
    COUNT(DISTINCT ti1.transaction_id) as co_occurrence_count
  FROM transaction_items ti1
  JOIN transaction_items ti2 ON ti1.transaction_id = ti2.transaction_id
    AND ti1.product_id < ti2.product_id
  GROUP BY 1,2
  HAVING COUNT(DISTINCT ti1.transaction_id) >= 10
)
SELECT 
  p1.product_name as product_a_name,
  p1.category_name as product_a_category,
  p2.product_name as product_b_name,
  p2.category_name as product_b_category,
  pp.co_occurrence_count,
  pp.co_occurrence_count::float / 
    (SELECT COUNT(DISTINCT transaction_id) FROM transaction_items WHERE product_id = pp.product_a) as support_a,
  pp.co_occurrence_count::float / 
    (SELECT COUNT(DISTINCT transaction_id) FROM transaction_items WHERE product_id = pp.product_b) as support_b,
  CASE 
    WHEN p1.category_name = p2.category_name AND p1.brand_name != p2.brand_name THEN 'brand_substitution'
    WHEN p1.category_name != p2.category_name THEN 'complementary'
    ELSE 'variant'
  END as relationship_type
FROM product_pairs pp
JOIN products p1 ON pp.product_a = p1.product_id
JOIN products p2 ON pp.product_b = p2.product_id
ORDER BY co_occurrence_count DESC;

-- ============================================
-- SCHEDULED REFRESH JOBS
-- ============================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Bronze → Silver ETL (every 15 minutes)
SELECT cron.schedule(
  'process-bronze-to-silver',
  '*/15 * * * *',
  $$
  -- Process transcriptions
  UPDATE bronze_transcriptions 
  SET processed = TRUE 
  WHERE processed = FALSE 
    AND confidence_score > 0.5;
    
  -- Process vision detections
  UPDATE bronze_vision_detections
  SET processed = TRUE
  WHERE processed = FALSE
    AND confidence > 0.7;
    
  -- Process POS transactions
  INSERT INTO transactions (transaction_id, store_id, transaction_time, total_amount)
  SELECT 
    (raw_transaction->>'id')::uuid,
    store_id,
    (raw_transaction->>'timestamp')::timestamptz,
    (raw_transaction->>'total')::decimal
  FROM bronze_pos_transactions
  WHERE processed = FALSE
    AND validation_errors IS NULL
  ON CONFLICT (transaction_id) DO NOTHING;
  
  UPDATE bronze_pos_transactions
  SET processed = TRUE
  WHERE processed = FALSE
    AND validation_errors IS NULL;
  $$
);

-- Silver → Gold refresh (every hour)
SELECT cron.schedule(
  'refresh-silver-views',
  '0 * * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_product_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_store_hourly_patterns;
  REFRESH MATERIALIZED VIEW CONCURRENTLY silver_customer_patterns;
  $$
);

-- Gold layer refresh (every 6 hours)
SELECT cron.schedule(
  'refresh-gold-views',
  '0 */6 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_executive_kpis;
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_brand_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_ai_features;
  REFRESH MATERIALIZED VIEW CONCURRENTLY gold_substitution_matrix;
  $$
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Bronze layer: Service role only
ALTER TABLE bronze_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bronze_vision_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bronze_pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bronze_inventory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bronze_customer_interactions ENABLE ROW LEVEL SECURITY;

-- No policies = no access except service role

-- Silver layer: Client/Region based access
CREATE POLICY "Users see their assigned regions" ON stores
  FOR SELECT USING (
    region IN (
      SELECT unnest(assigned_regions) 
      FROM user_permissions 
      WHERE user_id = auth.uid()
    )
  );

-- Gold layer: Role-based access
CREATE POLICY "Executives see all KPIs" ON gold_executive_kpis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('executive', 'admin')
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get data lineage
CREATE OR REPLACE FUNCTION get_data_lineage(table_name text)
RETURNS TABLE (
  layer text,
  object_name text,
  object_type text,
  dependencies text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN object_name LIKE 'bronze_%' THEN 'Bronze'
      WHEN object_name LIKE 'silver_%' THEN 'Silver'
      WHEN object_name LIKE 'gold_%' THEN 'Gold'
      ELSE 'Core'
    END as layer,
    object_name,
    object_type,
    dependencies
  FROM (
    -- Add your lineage tracking logic here
    SELECT 'example'::text as object_name, 'table'::text as object_type, ARRAY['dep1']::text[] as dependencies
  ) lineage;
END;
$$ LANGUAGE plpgsql;

-- Function to check layer health
CREATE OR REPLACE FUNCTION check_medallion_health()
RETURNS TABLE (
  layer text,
  metric text,
  value numeric,
  status text
) AS $$
BEGIN
  RETURN QUERY
  -- Bronze layer metrics
  SELECT 
    'Bronze'::text,
    'Unprocessed Records'::text,
    COUNT(*)::numeric,
    CASE WHEN COUNT(*) > 1000 THEN 'Warning' ELSE 'OK' END
  FROM bronze_transcriptions
  WHERE processed = FALSE
  
  UNION ALL
  
  -- Silver layer metrics
  SELECT 
    'Silver'::text,
    'View Staleness (hours)'::text,
    EXTRACT(epoch FROM (NOW() - schemaname.refresh_time)) / 3600,
    CASE 
      WHEN EXTRACT(epoch FROM (NOW() - schemaname.refresh_time)) / 3600 > 2 THEN 'Warning' 
      ELSE 'OK' 
    END
  FROM pg_matviews
  WHERE matviewname LIKE 'silver_%'
  
  UNION ALL
  
  -- Gold layer metrics
  SELECT 
    'Gold'::text,
    'KPI Freshness (minutes)'::text,
    EXTRACT(epoch FROM (NOW() - MAX(report_date))) / 60,
    CASE 
      WHEN EXTRACT(epoch FROM (NOW() - MAX(report_date))) / 60 > 360 THEN 'Error'
      WHEN EXTRACT(epoch FROM (NOW() - MAX(report_date))) / 60 > 60 THEN 'Warning'
      ELSE 'OK' 
    END
  FROM gold_executive_kpis;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MONITORING & ALERTS
-- ============================================

-- Create monitoring table
CREATE TABLE IF NOT EXISTS medallion_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  check_time TIMESTAMPTZ DEFAULT NOW(),
  layer TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  alert_triggered BOOLEAN DEFAULT FALSE,
  alert_message TEXT
);

-- Create alert function
CREATE OR REPLACE FUNCTION check_medallion_alerts()
RETURNS void AS $$
DECLARE
  bronze_backlog integer;
  silver_staleness interval;
  gold_staleness interval;
BEGIN
  -- Check Bronze backlog
  SELECT COUNT(*) INTO bronze_backlog
  FROM bronze_transcriptions
  WHERE processed = FALSE
    AND ingested_at < NOW() - INTERVAL '1 hour';
    
  IF bronze_backlog > 1000 THEN
    INSERT INTO medallion_monitoring (layer, metric_name, metric_value, threshold_value, alert_triggered, alert_message)
    VALUES ('Bronze', 'processing_backlog', bronze_backlog, 1000, TRUE, 
            format('Bronze processing backlog critical: %s unprocessed records older than 1 hour', bronze_backlog));
  END IF;
  
  -- Check Silver freshness
  -- Add similar checks for Silver and Gold layers
  
END;
$$ LANGUAGE plpgsql;

-- Schedule alert checks every 30 minutes
SELECT cron.schedule(
  'medallion-health-check',
  '*/30 * * * *',
  'SELECT check_medallion_alerts();'
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Silver layer indexes
CREATE INDEX idx_silver_product_perf_date ON silver_product_performance(date);
CREATE INDEX idx_silver_product_perf_product ON silver_product_performance(product_id);
CREATE INDEX idx_silver_store_patterns_store ON silver_store_hourly_patterns(store_id);
CREATE INDEX idx_silver_customer_week ON silver_customer_patterns(week);

-- Gold layer indexes
CREATE UNIQUE INDEX idx_gold_exec_kpis_date ON gold_executive_kpis(report_date);
CREATE INDEX idx_gold_brand_perf_brand ON gold_brand_performance(brand_name);
CREATE INDEX idx_gold_ai_features_product ON gold_ai_features(product_id);
CREATE INDEX idx_gold_substitution_products ON gold_substitution_matrix(product_a_name, product_b_name);

-- ============================================
-- COMMENTS & DOCUMENTATION
-- ============================================

COMMENT ON SCHEMA public IS 'Scout Analytics Medallion Architecture - Bronze, Silver, and Gold data layers';

COMMENT ON TABLE bronze_transcriptions IS 'Bronze Layer: Raw speech-to-text transcriptions from edge devices';
COMMENT ON TABLE bronze_vision_detections IS 'Bronze Layer: Raw computer vision detection events';
COMMENT ON TABLE bronze_pos_transactions IS 'Bronze Layer: Raw POS transaction payloads';

COMMENT ON MATERIALIZED VIEW silver_product_performance IS 'Silver Layer: Cleaned and validated product performance metrics';
COMMENT ON MATERIALIZED VIEW gold_executive_kpis IS 'Gold Layer: Executive dashboard KPIs, refreshed every 6 hours';
COMMENT ON MATERIALIZED VIEW gold_ai_features IS 'Gold Layer: Feature store for AI/ML models';

-- Grant appropriate permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;