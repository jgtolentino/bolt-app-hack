/*
  # Create Clean Transactions View
  
  This migration creates a filtered view that excludes anomalous transactions
  above the 99th percentile to prevent dashboard spikes.
*/

-- First, let's check what column name is used for transaction amounts
-- Based on the schema, it's 'total_amount', not 'transaction_value'

-- Create the clean transactions view that filters out outliers
CREATE OR REPLACE VIEW transactions_clean AS
SELECT *
FROM transactions
WHERE total_amount <= (
  SELECT PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_amount)
  FROM transactions
);

-- Grant permissions
GRANT SELECT ON transactions_clean TO authenticated, anon;

-- Add comment
COMMENT ON VIEW transactions_clean IS 'Filtered transactions view excluding values above 99th percentile';

-- Create an index on the base table to speed up percentile calculations
CREATE INDEX IF NOT EXISTS idx_transactions_total_amount ON transactions(total_amount);

-- Also create a view that shows the current threshold
CREATE OR REPLACE VIEW v_transaction_thresholds AS
SELECT 
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_amount) as p95_threshold,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_amount) as p99_threshold,
  MAX(total_amount) as max_value,
  COUNT(*) as total_transactions,
  COUNT(*) FILTER (WHERE total_amount > (
    SELECT PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY total_amount) FROM transactions
  )) as outlier_count
FROM transactions;

-- Grant permissions
GRANT SELECT ON v_transaction_thresholds TO authenticated, anon;

-- For Philippine retail context, also create a reasonable transaction limit view
-- This covers typical retail including bulk purchases and groceries
CREATE OR REPLACE VIEW transactions_reasonable AS
SELECT *
FROM transactions
WHERE total_amount <= 10000;  -- ₱10,000 max for retail transactions including bulk purchases

GRANT SELECT ON transactions_reasonable TO authenticated, anon;

COMMENT ON VIEW transactions_reasonable IS 'Transactions with reasonable retail amounts (≤₱10,000)';