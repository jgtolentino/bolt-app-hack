/*
  # Suki Analytics Enhancement Tables and Views

  1. New Tables
    - `customer_segments` - Customer segmentation data
    - `product_combinations` - Frequently bought together data
    - `ai_insights` - AI-generated insights and recommendations
    - `dashboard_metrics` - Pre-calculated metrics for performance
    - `inventory_levels` - Current inventory tracking
    - `price_changes` - Price change history
    - `competitor_pricing` - Competitor price monitoring

  2. Views
    - `v_hourly_sales` - Hourly sales aggregations
    - `v_location_performance` - Location-based performance metrics
    - `v_product_performance` - Product performance metrics
    - `v_customer_behavior` - Customer behavior patterns

  3. Functions
    - `calculate_rfm_score` - Calculate RFM (Recency, Frequency, Monetary) scores
    - `get_product_recommendations` - Get product recommendations
    - `analyze_peak_hours` - Analyze peak business hours
*/

-- Customer Segments Table
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name text NOT NULL,
  segment_type text NOT NULL, -- 'demographic', 'behavioral', 'rfm'
  description text,
  criteria jsonb NOT NULL, -- Segment criteria
  customer_count integer DEFAULT 0,
  avg_transaction_value numeric(10,2),
  total_revenue numeric(12,2),
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product Combinations Table
CREATE TABLE IF NOT EXISTS product_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_1_id uuid NOT NULL REFERENCES organization(id),
  product_2_id uuid NOT NULL REFERENCES organization(id),
  combination_frequency integer DEFAULT 0,
  confidence_score numeric(5,2), -- Confidence percentage
  lift_value numeric(5,2), -- Association rule lift
  avg_basket_value numeric(10,2),
  last_seen timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_1_id, product_2_id)
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL, -- 'anomaly', 'trend', 'recommendation', 'prediction'
  category text NOT NULL, -- 'sales', 'inventory', 'customer', 'pricing'
  severity text DEFAULT 'info', -- 'info', 'warning', 'critical', 'opportunity'
  title text NOT NULL,
  description text NOT NULL,
  data jsonb, -- Supporting data
  action_items jsonb, -- Recommended actions
  is_active boolean DEFAULT true,
  is_acknowledged boolean DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dashboard Metrics Cache Table
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key text NOT NULL,
  metric_date date NOT NULL,
  geography_id uuid REFERENCES geography(id),
  category text,
  value numeric,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(metric_key, metric_date, geography_id, category)
);

-- Inventory Levels Table
CREATE TABLE IF NOT EXISTS inventory_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  geography_id uuid NOT NULL REFERENCES geography(id),
  current_stock integer NOT NULL DEFAULT 0,
  reorder_point integer DEFAULT 10,
  max_stock integer DEFAULT 100,
  last_restock_date timestamptz,
  days_of_supply integer,
  stock_status text DEFAULT 'normal', -- 'critical', 'low', 'normal', 'overstock'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, geography_id)
);

-- Price Changes Table
CREATE TABLE IF NOT EXISTS price_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  old_price numeric(10,2) NOT NULL,
  new_price numeric(10,2) NOT NULL,
  change_percentage numeric(5,2),
  change_reason text,
  implemented_at timestamptz NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Competitor Pricing Table
CREATE TABLE IF NOT EXISTS competitor_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  competitor_name text NOT NULL,
  competitor_price numeric(10,2) NOT NULL,
  price_difference numeric(10,2),
  price_difference_percent numeric(5,2),
  observed_date date NOT NULL,
  source text, -- 'manual', 'scraper', 'api'
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, competitor_name, observed_date)
);

-- Enable RLS on all new tables
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to customer_segments" ON customer_segments FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to product_combinations" ON product_combinations FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to ai_insights" ON ai_insights FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to dashboard_metrics" ON dashboard_metrics FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to inventory_levels" ON inventory_levels FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to price_changes" ON price_changes FOR SELECT TO public USING (true);
CREATE POLICY "Allow public read access to competitor_pricing" ON competitor_pricing FOR SELECT TO public USING (true);

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to manage customer_segments" ON customer_segments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage product_combinations" ON product_combinations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage ai_insights" ON ai_insights FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage dashboard_metrics" ON dashboard_metrics FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage inventory_levels" ON inventory_levels FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage price_changes" ON price_changes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage competitor_pricing" ON competitor_pricing FOR ALL TO authenticated USING (true);

-- Create indexes
CREATE INDEX idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX idx_product_combinations_frequency ON product_combinations(combination_frequency DESC);
CREATE INDEX idx_ai_insights_active ON ai_insights(is_active, insight_type);
CREATE INDEX idx_dashboard_metrics_lookup ON dashboard_metrics(metric_key, metric_date);
CREATE INDEX idx_inventory_levels_status ON inventory_levels(stock_status);
CREATE INDEX idx_price_changes_date ON price_changes(implemented_at);
CREATE INDEX idx_competitor_pricing_lookup ON competitor_pricing(organization_id, observed_date);

-- Create triggers for updated_at
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_combinations_updated_at BEFORE UPDATE ON product_combinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_insights_updated_at BEFORE UPDATE ON ai_insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_levels_updated_at BEFORE UPDATE ON inventory_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Views

-- Hourly Sales View
CREATE OR REPLACE VIEW v_hourly_sales AS
SELECT 
  DATE_TRUNC('hour', datetime) as hour,
  g.region,
  g.city_municipality,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_sales,
  AVG(total_amount) as avg_transaction_value,
  COUNT(DISTINCT organization_id) as unique_products,
  STRING_AGG(DISTINCT payment_method, ', ') as payment_methods
FROM transactions t
JOIN geography g ON t.geography_id = g.id
GROUP BY DATE_TRUNC('hour', datetime), g.region, g.city_municipality;

-- Location Performance View
CREATE OR REPLACE VIEW v_location_performance AS
SELECT 
  g.id as geography_id,
  g.region,
  g.city_municipality,
  g.barangay,
  g.store_name,
  COUNT(t.id) as total_transactions,
  SUM(t.total_amount) as total_revenue,
  AVG(t.total_amount) as avg_transaction_value,
  COUNT(DISTINCT DATE(t.datetime)) as active_days,
  COUNT(DISTINCT t.organization_id) as product_variety,
  MAX(t.datetime) as last_transaction
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.id, g.region, g.city_municipality, g.barangay, g.store_name;

-- Product Performance View
CREATE OR REPLACE VIEW v_product_performance AS
SELECT 
  o.id as product_id,
  o.category,
  o.brand,
  o.sku,
  o.sku_description,
  COUNT(t.id) as total_sold,
  SUM(t.quantity) as units_sold,
  SUM(t.total_amount) as total_revenue,
  AVG(t.unit_price) as avg_selling_price,
  COUNT(DISTINCT t.geography_id) as locations_sold,
  COUNT(DISTINCT DATE(t.datetime)) as days_sold
FROM organization o
LEFT JOIN transactions t ON o.id = t.organization_id
GROUP BY o.id, o.category, o.brand, o.sku, o.sku_description;

-- Customer Behavior View
CREATE OR REPLACE VIEW v_customer_behavior AS
SELECT 
  customer_type,
  payment_method,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_spent,
  AVG(total_amount) as avg_basket_size,
  AVG(quantity) as avg_items_per_transaction,
  COUNT(DISTINCT geography_id) as unique_stores_visited,
  COUNT(DISTINCT organization_id) as unique_products_bought,
  EXTRACT(hour FROM datetime) as preferred_hour
FROM transactions
GROUP BY customer_type, payment_method, EXTRACT(hour FROM datetime);

-- Functions

-- Calculate RFM Score Function
CREATE OR REPLACE FUNCTION calculate_rfm_score(
  p_geography_id uuid DEFAULT NULL,
  p_days_back integer DEFAULT 365
)
RETURNS TABLE (
  customer_type text,
  recency_days integer,
  frequency integer,
  monetary numeric,
  rfm_score text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH customer_metrics AS (
    SELECT 
      t.customer_type,
      DATE_PART('day', NOW() - MAX(t.datetime))::integer as recency,
      COUNT(*) as frequency,
      SUM(t.total_amount) as monetary
    FROM transactions t
    WHERE 
      t.datetime >= NOW() - INTERVAL '1 day' * p_days_back
      AND (p_geography_id IS NULL OR t.geography_id = p_geography_id)
    GROUP BY t.customer_type
  ),
  rfm_scores AS (
    SELECT 
      cm.*,
      NTILE(5) OVER (ORDER BY recency DESC) as r_score,
      NTILE(5) OVER (ORDER BY frequency) as f_score,
      NTILE(5) OVER (ORDER BY monetary) as m_score
    FROM customer_metrics cm
  )
  SELECT 
    customer_type,
    recency as recency_days,
    frequency,
    monetary,
    CONCAT(r_score, f_score, m_score) as rfm_score
  FROM rfm_scores;
END;
$$;

-- Get Product Recommendations Function
CREATE OR REPLACE FUNCTION get_product_recommendations(
  p_product_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  recommended_product_id uuid,
  product_name text,
  confidence numeric,
  lift numeric,
  frequency integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.product_2_id as recommended_product_id,
    o.sku_description as product_name,
    pc.confidence_score as confidence,
    pc.lift_value as lift,
    pc.combination_frequency as frequency
  FROM product_combinations pc
  JOIN organization o ON pc.product_2_id = o.id
  WHERE pc.product_1_id = p_product_id
  ORDER BY pc.lift_value DESC, pc.combination_frequency DESC
  LIMIT p_limit;
END;
$$;

-- Analyze Peak Hours Function
CREATE OR REPLACE FUNCTION analyze_peak_hours(
  p_geography_id uuid DEFAULT NULL,
  p_days_back integer DEFAULT 30
)
RETURNS TABLE (
  hour integer,
  avg_transactions numeric,
  avg_revenue numeric,
  peak_classification text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH hourly_stats AS (
    SELECT 
      EXTRACT(hour FROM datetime)::integer as hour,
      COUNT(*)::numeric / p_days_back as avg_trans,
      SUM(total_amount)::numeric / p_days_back as avg_rev
    FROM transactions
    WHERE 
      datetime >= NOW() - INTERVAL '1 day' * p_days_back
      AND (p_geography_id IS NULL OR geography_id = p_geography_id)
    GROUP BY EXTRACT(hour FROM datetime)
  ),
  stats AS (
    SELECT 
      AVG(avg_trans) as mean_trans,
      STDDEV(avg_trans) as stddev_trans
    FROM hourly_stats
  )
  SELECT 
    hs.hour,
    ROUND(hs.avg_trans, 2) as avg_transactions,
    ROUND(hs.avg_rev, 2) as avg_revenue,
    CASE 
      WHEN hs.avg_trans > (s.mean_trans + s.stddev_trans) THEN 'Peak'
      WHEN hs.avg_trans < (s.mean_trans - s.stddev_trans) THEN 'Low'
      ELSE 'Normal'
    END as peak_classification
  FROM hourly_stats hs
  CROSS JOIN stats s
  ORDER BY hs.hour;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_rfm_score TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_peak_hours TO authenticated;

-- Add comments
COMMENT ON TABLE customer_segments IS 'Customer segmentation data for targeted marketing and analysis';
COMMENT ON TABLE product_combinations IS 'Frequently bought together products for cross-selling';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations for business optimization';
COMMENT ON TABLE dashboard_metrics IS 'Pre-calculated metrics cache for dashboard performance';
COMMENT ON TABLE inventory_levels IS 'Current inventory tracking by product and location';
COMMENT ON TABLE price_changes IS 'Historical record of price changes';
COMMENT ON TABLE competitor_pricing IS 'Competitor price monitoring data';