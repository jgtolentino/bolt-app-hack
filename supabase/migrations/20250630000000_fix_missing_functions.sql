-- Create missing get_product_performance function
CREATE OR REPLACE FUNCTION get_product_performance()
RETURNS TABLE (
  sku VARCHAR,
  total_sales DECIMAL,
  category VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.sku,
    p.total_sales,
    p.category
  FROM v_product_performance p
  ORDER BY p.total_sales DESC;
END;
$$ LANGUAGE plpgsql;

-- Fix v_seasonal_trends view to ensure it returns data
CREATE OR REPLACE VIEW v_seasonal_trends AS
SELECT 
  EXTRACT(YEAR FROM datetime) as year,
  EXTRACT(MONTH FROM datetime) as month,
  TO_CHAR(datetime, 'Mon') as month_name,
  COUNT(DISTINCT transaction_id) as transaction_count,
  SUM(total_amount) as total_sales,
  AVG(total_amount) as avg_transaction_value
FROM transactions
WHERE datetime >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY 
  EXTRACT(YEAR FROM datetime),
  EXTRACT(MONTH FROM datetime),
  TO_CHAR(datetime, 'Mon')
ORDER BY year, month;

-- Ensure v_clean_transactions has data
CREATE OR REPLACE VIEW v_clean_transactions AS
SELECT 
  t.*,
  g.region,
  g.city_municipality,
  g.barangay,
  o.channel_type,
  o.store_size
FROM transactions t
LEFT JOIN geography g ON t.geography_id = g.id
LEFT JOIN organizations o ON t.organization_id = o.id
WHERE t.total_amount > 0
  AND t.quantity > 0;