-- Redistribute 50,000 transactions across 365 days backwards from today
-- This creates a more realistic distribution with daily, weekly, and seasonal patterns

-- Update transaction dates to spread across 365 days
WITH date_distribution AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY random()) as rn,
    COUNT(*) OVER () as total_count
  FROM public.transactions
),
date_assignments AS (
  SELECT 
    id,
    rn,
    total_count,
    -- Distribute across 365 days with some randomness
    CURRENT_DATE - INTERVAL '1 day' * (
      -- Base day distribution (0-364)
      FLOOR((rn - 1) * 365.0 / total_count) +
      -- Add some randomness to avoid perfect distribution
      FLOOR(random() * 3 - 1)
    ) as new_date
  FROM date_distribution
)
UPDATE public.transactions t
SET 
  transaction_date = da.new_date,
  transaction_datetime = da.new_date + t.transaction_time::time,
  -- Add day type based on new date
  day_type = CASE 
    WHEN EXTRACT(DOW FROM da.new_date) IN (0, 6) THEN 'weekend'
    WHEN da.new_date IN (
      '2024-12-25', '2024-12-30', '2024-12-31', '2025-01-01',
      '2024-11-01', '2024-11-02', '2024-06-12', '2024-08-21',
      '2024-08-26', '2024-11-30', '2024-04-09', '2024-04-10',
      '2024-05-01', '2024-06-12', '2024-08-21', '2024-08-26'
    ) THEN 'holiday'
    ELSE 'weekday'
  END,
  -- Adjust amounts based on seasonality and day of week
  total_amount = t.total_amount * CASE
    -- December boost (Christmas season)
    WHEN EXTRACT(MONTH FROM da.new_date) = 12 THEN 1.3
    -- November boost (start of Christmas season)
    WHEN EXTRACT(MONTH FROM da.new_date) = 11 THEN 1.2
    -- Summer months slight decrease
    WHEN EXTRACT(MONTH FROM da.new_date) IN (4, 5) THEN 0.9
    -- Weekend boost
    WHEN EXTRACT(DOW FROM da.new_date) IN (0, 6) THEN 1.15
    -- Friday boost
    WHEN EXTRACT(DOW FROM da.new_date) = 5 THEN 1.1
    ELSE 1.0
  END,
  subtotal = t.subtotal * CASE
    WHEN EXTRACT(MONTH FROM da.new_date) = 12 THEN 1.3
    WHEN EXTRACT(MONTH FROM da.new_date) = 11 THEN 1.2
    WHEN EXTRACT(MONTH FROM da.new_date) IN (4, 5) THEN 0.9
    WHEN EXTRACT(DOW FROM da.new_date) IN (0, 6) THEN 1.15
    WHEN EXTRACT(DOW FROM da.new_date) = 5 THEN 1.1
    ELSE 1.0
  END
FROM date_assignments da
WHERE t.id = da.id
  AND da.new_date >= CURRENT_DATE - INTERVAL '365 days'
  AND da.new_date <= CURRENT_DATE;

-- Update transaction items to match the adjusted totals
UPDATE public.transaction_items ti
SET 
  line_total = ti.line_total * CASE
    WHEN EXTRACT(MONTH FROM t.transaction_date) = 12 THEN 1.3
    WHEN EXTRACT(MONTH FROM t.transaction_date) = 11 THEN 1.2
    WHEN EXTRACT(MONTH FROM t.transaction_date) IN (4, 5) THEN 0.9
    WHEN EXTRACT(DOW FROM t.transaction_date) IN (0, 6) THEN 1.15
    WHEN EXTRACT(DOW FROM t.transaction_date) = 5 THEN 1.1
    ELSE 1.0
  END
FROM public.transactions t
WHERE ti.transaction_id = t.id;

-- Create more realistic hourly distribution
UPDATE public.transactions
SET transaction_time = 
  CASE 
    -- Morning rush (6-9 AM) - 15% of transactions
    WHEN random() < 0.15 THEN 
      (INTERVAL '6 hours' + INTERVAL '1 minute' * FLOOR(random() * 180))::time
    -- Late morning (9-12 PM) - 20% of transactions
    WHEN random() < 0.35 THEN 
      (INTERVAL '9 hours' + INTERVAL '1 minute' * FLOOR(random() * 180))::time
    -- Lunch time (12-2 PM) - 15% of transactions
    WHEN random() < 0.50 THEN 
      (INTERVAL '12 hours' + INTERVAL '1 minute' * FLOOR(random() * 120))::time
    -- Afternoon (2-5 PM) - 20% of transactions
    WHEN random() < 0.70 THEN 
      (INTERVAL '14 hours' + INTERVAL '1 minute' * FLOOR(random() * 180))::time
    -- Evening rush (5-8 PM) - 25% of transactions
    WHEN random() < 0.95 THEN 
      (INTERVAL '17 hours' + INTERVAL '1 minute' * FLOOR(random() * 180))::time
    -- Night time (8-10 PM) - 5% of transactions
    ELSE 
      (INTERVAL '20 hours' + INTERVAL '1 minute' * FLOOR(random() * 120))::time
  END,
  transaction_datetime = transaction_date + transaction_time::time;

-- Add more variety to payment methods based on time and amount
UPDATE public.transactions t
SET 
  payment_method = CASE
    -- Larger transactions more likely to use digital/card
    WHEN t.total_amount > 1000 AND random() < 0.6 THEN 
      CASE 
        WHEN random() < 0.4 THEN 'GCash'
        WHEN random() < 0.7 THEN 'Maya'
        WHEN random() < 0.9 THEN 'Credit Card'
        ELSE 'Bank Transfer'
      END
    -- Recent transactions more likely to be digital
    WHEN t.transaction_date > CURRENT_DATE - INTERVAL '30 days' AND random() < 0.4 THEN
      CASE 
        WHEN random() < 0.6 THEN 'GCash'
        WHEN random() < 0.9 THEN 'Maya'
        ELSE 'Credit Card'
      END
    -- Weekend transactions slightly more cash
    WHEN EXTRACT(DOW FROM t.transaction_date) IN (0, 6) AND random() < 0.75 THEN 'Cash'
    -- Default distribution
    WHEN random() < 0.65 THEN 'Cash'
    WHEN random() < 0.80 THEN 'GCash'
    WHEN random() < 0.90 THEN 'Maya'
    WHEN random() < 0.95 THEN 'Credit Card'
    ELSE 'Bank Transfer'
  END,
  payment_method_id = pm.id
FROM public.payment_methods pm
WHERE pm.method_name = t.payment_method;

-- Ensure consumer interactions match new dates
UPDATE public.consumer_interactions ci
SET 
  interaction_start_time = t.transaction_datetime - (ci.duration_seconds || ' seconds')::INTERVAL,
  interaction_end_time = t.transaction_datetime
FROM public.transactions t
WHERE ci.transaction_id = t.id;

-- Refresh all materialized views with new data distribution
SELECT public.refresh_materialized_views();
SELECT public.refresh_retail_analytics_views();

-- Display summary of the redistribution
WITH daily_summary AS (
  SELECT 
    transaction_date,
    COUNT(*) as transaction_count,
    SUM(total_amount) as daily_total,
    AVG(total_amount) as avg_transaction,
    COUNT(DISTINCT store_id) as active_stores,
    COUNT(DISTINCT cashier_id) as active_cashiers
  FROM public.transactions
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY transaction_date
),
monthly_summary AS (
  SELECT 
    TO_CHAR(transaction_date, 'YYYY-MM') as month,
    COUNT(*) as transaction_count,
    SUM(total_amount) as monthly_total,
    AVG(total_amount) as avg_transaction,
    COUNT(DISTINCT DATE_TRUNC('day', transaction_date)) as active_days
  FROM public.transactions
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '365 days'
  GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
  ORDER BY month DESC
)
SELECT 
  'Redistribution Complete' as status,
  (SELECT COUNT(*) FROM public.transactions WHERE transaction_date >= CURRENT_DATE - INTERVAL '365 days') as total_transactions,
  (SELECT COUNT(DISTINCT transaction_date) FROM public.transactions WHERE transaction_date >= CURRENT_DATE - INTERVAL '365 days') as unique_days,
  (SELECT AVG(transaction_count) FROM daily_summary) as avg_daily_transactions,
  (SELECT MIN(transaction_date) FROM public.transactions) as earliest_date,
  (SELECT MAX(transaction_date) FROM public.transactions) as latest_date;

-- Show monthly distribution
SELECT 
  TO_CHAR(transaction_date, 'YYYY-MM') as month,
  COUNT(*) as transactions,
  SUM(total_amount) as total_sales,
  AVG(total_amount) as avg_sale,
  COUNT(DISTINCT customer_id) as unique_customers
FROM public.transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
ORDER BY month;

-- Show hourly distribution
SELECT 
  EXTRACT(HOUR FROM transaction_time) as hour,
  COUNT(*) as transaction_count,
  AVG(total_amount) as avg_amount
FROM public.transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM transaction_time)
ORDER BY hour;