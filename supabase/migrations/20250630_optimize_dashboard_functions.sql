-- Optimized Dashboard Functions for Better Performance
-- Creates database functions that aggregate data efficiently

-- Function to get KPI metrics with comparison
CREATE OR REPLACE FUNCTION get_kpi_metrics(
  date_from DATE,
  date_to DATE,
  region_filter TEXT DEFAULT NULL,
  store_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  total_sales NUMERIC,
  total_transactions BIGINT,
  avg_basket_size NUMERIC,
  unique_customers BIGINT,
  active_stores BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(t.total_amount), 0)::NUMERIC as total_sales,
    COUNT(DISTINCT t.id)::BIGINT as total_transactions,
    COALESCE(AVG(t.total_amount), 0)::NUMERIC as avg_basket_size,
    COUNT(DISTINCT t.customer_id)::BIGINT as unique_customers,
    COUNT(DISTINCT t.store_id)::BIGINT as active_stores
  FROM transactions t
  JOIN stores s ON t.store_id = s.id
  WHERE 
    t.transaction_datetime >= date_from
    AND t.transaction_datetime <= date_to + INTERVAL '23 hours 59 minutes 59 seconds'
    AND t.status = 'completed'
    AND (region_filter IS NULL OR s.region = region_filter)
    AND (store_filter IS NULL OR t.store_id = store_filter);
END;
$$ LANGUAGE plpgsql;

-- Function to get hourly transaction patterns
CREATE OR REPLACE FUNCTION get_hourly_patterns(
  date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  hour_of_day INTEGER,
  avg_transactions NUMERIC,
  avg_sales NUMERIC,
  peak_day_transactions NUMERIC,
  peak_day_sales NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH hourly_data AS (
    SELECT 
      EXTRACT(HOUR FROM transaction_datetime)::INTEGER as hour_of_day,
      DATE(transaction_datetime) as transaction_date,
      COUNT(*) as transaction_count,
      SUM(total_amount) as daily_sales
    FROM transactions
    WHERE 
      transaction_datetime >= date_from
      AND transaction_datetime <= date_to + INTERVAL '23 hours 59 minutes 59 seconds'
      AND status = 'completed'
    GROUP BY 
      EXTRACT(HOUR FROM transaction_datetime),
      DATE(transaction_datetime)
  )
  SELECT 
    hour_of_day,
    AVG(transaction_count)::NUMERIC as avg_transactions,
    AVG(daily_sales)::NUMERIC as avg_sales,
    MAX(transaction_count)::NUMERIC as peak_day_transactions,
    MAX(daily_sales)::NUMERIC as peak_day_sales
  FROM hourly_data
  GROUP BY hour_of_day
  ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql;

-- Function to get top products with performance metrics
CREATE OR REPLACE FUNCTION get_top_products(
  date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  date_to DATE DEFAULT CURRENT_DATE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  category_name TEXT,
  brand_name TEXT,
  total_revenue NUMERIC,
  total_units_sold NUMERIC,
  transaction_count BIGINT,
  avg_price NUMERIC,
  revenue_rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH product_sales AS (
    SELECT 
      p.id as product_id,
      p.product_name,
      pc.category_name,
      b.brand_name,
      SUM(ti.line_total) as total_revenue,
      SUM(ti.quantity) as total_units_sold,
      COUNT(DISTINCT ti.transaction_id) as transaction_count,
      AVG(ti.unit_price) as avg_price
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN product_categories pc ON p.category_id = pc.id
    JOIN brands b ON p.brand_id = b.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE 
      t.transaction_datetime >= date_from
      AND t.transaction_datetime <= date_to + INTERVAL '23 hours 59 minutes 59 seconds'
      AND t.status = 'completed'
    GROUP BY p.id, p.product_name, pc.category_name, b.brand_name
  )
  SELECT 
    *,
    ROW_NUMBER() OVER (ORDER BY total_revenue DESC)::INTEGER as revenue_rank
  FROM product_sales
  ORDER BY total_revenue DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get regional performance summary
CREATE OR REPLACE FUNCTION get_regional_performance(
  date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  region TEXT,
  city TEXT,
  store_count BIGINT,
  total_sales NUMERIC,
  total_transactions BIGINT,
  avg_transaction_value NUMERIC,
  top_category TEXT,
  growth_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current_period AS (
    SELECT 
      s.region,
      s.city,
      COUNT(DISTINCT s.id) as store_count,
      SUM(t.total_amount) as total_sales,
      COUNT(t.id) as total_transactions,
      AVG(t.total_amount) as avg_transaction_value
    FROM transactions t
    JOIN stores s ON t.store_id = s.id
    WHERE 
      t.transaction_datetime >= date_from
      AND t.transaction_datetime <= date_to + INTERVAL '23 hours 59 minutes 59 seconds'
      AND t.status = 'completed'
    GROUP BY s.region, s.city
  ),
  previous_period AS (
    SELECT 
      s.region,
      s.city,
      SUM(t.total_amount) as prev_total_sales
    FROM transactions t
    JOIN stores s ON t.store_id = s.id
    WHERE 
      t.transaction_datetime >= date_from - (date_to - date_from + INTERVAL '1 day')
      AND t.transaction_datetime < date_from
      AND t.status = 'completed'
    GROUP BY s.region, s.city
  ),
  top_categories AS (
    SELECT DISTINCT ON (s.region, s.city)
      s.region,
      s.city,
      pc.category_name
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    JOIN stores s ON t.store_id = s.id
    JOIN products p ON ti.product_id = p.id
    JOIN product_categories pc ON p.category_id = pc.id
    WHERE 
      t.transaction_datetime >= date_from
      AND t.transaction_datetime <= date_to + INTERVAL '23 hours 59 minutes 59 seconds'
      AND t.status = 'completed'
    GROUP BY s.region, s.city, pc.category_name
    ORDER BY s.region, s.city, SUM(ti.line_total) DESC
  )
  SELECT 
    cp.region,
    cp.city,
    cp.store_count,
    cp.total_sales,
    cp.total_transactions,
    cp.avg_transaction_value,
    tc.category_name as top_category,
    CASE 
      WHEN pp.prev_total_sales > 0 THEN 
        ((cp.total_sales - pp.prev_total_sales) / pp.prev_total_sales * 100)::NUMERIC
      ELSE 0
    END as growth_rate
  FROM current_period cp
  LEFT JOIN previous_period pp ON cp.region = pp.region AND cp.city = pp.city
  LEFT JOIN top_categories tc ON cp.region = tc.region AND cp.city = tc.city
  ORDER BY cp.total_sales DESC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_datetime_status 
ON transactions(transaction_datetime, status) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_transaction_items_product_transaction 
ON transaction_items(product_id, transaction_id);

CREATE INDEX IF NOT EXISTS idx_stores_region_city 
ON stores(region, city);

-- Create a materialized view for real-time dashboard metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_metrics AS
WITH date_ranges AS (
  SELECT 
    CURRENT_DATE as today,
    CURRENT_DATE - INTERVAL '1 day' as yesterday,
    CURRENT_DATE - INTERVAL '7 days' as week_ago,
    CURRENT_DATE - INTERVAL '30 days' as month_ago
),
current_metrics AS (
  SELECT 
    COUNT(DISTINCT t.id) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_basket,
    COUNT(DISTINCT t.customer_id) as unique_customers,
    COUNT(DISTINCT t.store_id) as active_stores,
    COUNT(DISTINCT p.id) as active_products
  FROM transactions t
  CROSS JOIN date_ranges dr
  LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
  LEFT JOIN products p ON ti.product_id = p.id
  WHERE 
    t.transaction_datetime >= dr.yesterday
    AND t.transaction_datetime < dr.today + INTERVAL '1 day'
    AND t.status = 'completed'
)
SELECT 
  transaction_count,
  total_sales,
  avg_basket,
  unique_customers,
  active_stores,
  active_products,
  NOW() as last_updated
FROM current_metrics;

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh the materialized view every 5 minutes
-- Note: This requires pg_cron extension which may need to be enabled separately
-- SELECT cron.schedule('refresh-dashboard-metrics', '*/5 * * * *', 'SELECT refresh_dashboard_metrics();');