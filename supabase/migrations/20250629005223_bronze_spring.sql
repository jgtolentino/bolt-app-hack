/*
  # Create Database Functions

  1. Functions
    - `get_geographic_performance` - Get performance by geography
    - `detect_sales_anomalies` - Detect unusual sales patterns
    - `get_payment_method_analysis` - Analyze payment methods
    - `get_seasonal_trends` - Get seasonal performance trends

  2. Security
    - Functions are accessible to public for analytics
*/

-- Function to get geographic performance
CREATE OR REPLACE FUNCTION get_geographic_performance(
  filter_region text DEFAULT NULL,
  filter_city text DEFAULT NULL,
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  region text,
  city_municipality text,
  total_sales numeric,
  transaction_count bigint,
  avg_transaction numeric,
  growth_rate numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.region,
    g.city_municipality,
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COUNT(t.id) as transaction_count,
    COALESCE(AVG(t.total_amount), 0) as avg_transaction,
    COALESCE(
      (SUM(t.total_amount) - LAG(SUM(t.total_amount)) OVER (ORDER BY g.region)) / 
      NULLIF(LAG(SUM(t.total_amount)) OVER (ORDER BY g.region), 0) * 100, 
      0
    ) as growth_rate
  FROM geography g
  LEFT JOIN transactions t ON g.id = t.geography_id 
    AND t.datetime::date BETWEEN start_date AND end_date
  WHERE 
    (filter_region IS NULL OR g.region = filter_region) AND
    (filter_city IS NULL OR g.city_municipality = filter_city)
  GROUP BY g.region, g.city_municipality
  ORDER BY total_sales DESC;
END;
$$;

-- Function to detect sales anomalies
CREATE OR REPLACE FUNCTION detect_sales_anomalies(
  threshold_percentage numeric DEFAULT 50.0
)
RETURNS TABLE (
  transaction_id uuid,
  datetime timestamptz,
  amount numeric,
  expected_range text,
  anomaly_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_amount numeric;
  std_dev numeric;
BEGIN
  -- Calculate average and standard deviation
  SELECT AVG(total_amount), STDDEV(total_amount) 
  INTO avg_amount, std_dev
  FROM transactions 
  WHERE datetime >= CURRENT_DATE - INTERVAL '30 days';
  
  RETURN QUERY
  SELECT 
    t.id as transaction_id,
    t.datetime,
    t.total_amount as amount,
    CONCAT('₱', ROUND(avg_amount - std_dev, 2), ' - ₱', ROUND(avg_amount + std_dev, 2)) as expected_range,
    CASE 
      WHEN t.total_amount > avg_amount + (std_dev * threshold_percentage / 100) THEN 'High Value Spike'
      WHEN t.total_amount < avg_amount - (std_dev * threshold_percentage / 100) THEN 'Low Value Drop'
      ELSE 'Normal'
    END as anomaly_type
  FROM transactions t
  WHERE 
    t.datetime >= CURRENT_DATE - INTERVAL '7 days' AND
    (t.total_amount > avg_amount + (std_dev * threshold_percentage / 100) OR
     t.total_amount < avg_amount - (std_dev * threshold_percentage / 100))
  ORDER BY t.datetime DESC;
END;
$$;

-- Function to analyze payment methods
CREATE OR REPLACE FUNCTION get_payment_method_analysis(
  start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  payment_method text,
  transaction_count bigint,
  total_amount numeric,
  percentage numeric,
  avg_transaction_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_transactions bigint;
  total_sales numeric;
BEGIN
  -- Get totals for percentage calculation
  SELECT COUNT(*), SUM(total_amount) 
  INTO total_transactions, total_sales
  FROM transactions 
  WHERE datetime::date BETWEEN start_date AND end_date;
  
  RETURN QUERY
  SELECT 
    t.payment_method,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_amount,
    ROUND((COUNT(*)::numeric / total_transactions * 100), 2) as percentage,
    ROUND(AVG(t.total_amount), 2) as avg_transaction_value
  FROM transactions t
  WHERE t.datetime::date BETWEEN start_date AND end_date
  GROUP BY t.payment_method
  ORDER BY transaction_count DESC;
END;
$$;

-- Function to get seasonal trends
CREATE OR REPLACE FUNCTION get_seasonal_trends(
  year_filter integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer
)
RETURNS TABLE (
  month_name text,
  month_number integer,
  total_sales numeric,
  transaction_count bigint,
  avg_transaction numeric,
  growth_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      EXTRACT(MONTH FROM t.datetime)::integer as month_num,
      SUM(t.total_amount) as sales,
      COUNT(*) as transactions,
      AVG(t.total_amount) as avg_trans
    FROM transactions t
    WHERE EXTRACT(YEAR FROM t.datetime) = year_filter
    GROUP BY EXTRACT(MONTH FROM t.datetime)
    ORDER BY month_num
  )
  SELECT 
    TO_CHAR(TO_DATE(md.month_num::text, 'MM'), 'Month') as month_name,
    md.month_num as month_number,
    md.sales as total_sales,
    md.transactions as transaction_count,
    md.avg_trans as avg_transaction,
    COALESCE(
      (md.sales - LAG(md.sales) OVER (ORDER BY md.month_num)) / 
      NULLIF(LAG(md.sales) OVER (ORDER BY md.month_num), 0) * 100, 
      0
    ) as growth_rate
  FROM monthly_data md;
END;
$$;