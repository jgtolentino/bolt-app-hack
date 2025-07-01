# Manual Data Pruning Instructions

Since the database connection is having authentication issues, please run this SQL manually:

## Steps:

1. Go to Supabase SQL Editor:
   https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/sql

2. Copy and paste this SQL:

```sql
-- Prune data to exactly 1 year: June 30, 2024 to June 30, 2025
BEGIN;

-- Show current data range
SELECT 'Current data range:' as status, 
    MIN(timestamp)::date as start_date, 
    MAX(timestamp)::date as end_date,
    COUNT(*) as total_transactions
FROM transactions;

-- Delete transaction items outside the 1-year range
DELETE FROM transaction_items 
WHERE transaction_id IN (
    SELECT id FROM transactions 
    WHERE timestamp < '2024-06-30 00:00:00'::timestamp 
       OR timestamp > '2025-06-30 23:59:59'::timestamp
);

-- Delete transactions outside the 1-year range
DELETE FROM transactions 
WHERE timestamp < '2024-06-30 00:00:00'::timestamp 
   OR timestamp > '2025-06-30 23:59:59'::timestamp;

-- Verify new data range
SELECT 'New data range (1 year):' as status, 
    MIN(timestamp)::date as start_date, 
    MAX(timestamp)::date as end_date,
    COUNT(*) as total_transactions,
    (MAX(timestamp)::date - MIN(timestamp)::date) as days_span
FROM transactions;

-- Get last 30 days metrics (June 2025)
SELECT 'Last 30 days metrics:' as status,
    COUNT(*) as transactions,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_basket_value,
    COUNT(DISTINCT store_id) as active_stores
FROM transactions
WHERE timestamp >= '2025-06-01'::date 
  AND timestamp <= '2025-06-30 23:59:59'::timestamp;

COMMIT;
```

3. Click "Run" to execute

## Expected Results:

- **Before**: ~376,212 transactions (June 2024 - Dec 2025)
- **After**: Fewer transactions (June 2024 - June 2025 only)
- **Date Range**: Exactly 365 days
- **Last 30 Days**: June 1-30, 2025

## Verify in Dashboard:

1. Refresh the dashboard: https://bolt-app-hack.vercel.app
2. Check the overview page
3. Date range should now show: "365 days (6/30/2024 - 6/30/2025)"
4. Last 30 days metrics will be from June 2025
5. Header will show "Sample Data" instead of "Real Data"