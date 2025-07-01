# Apply Medallion Views - Final Step

The core tables are already in place. Now we just need to create the Silver and Gold layer views.

## Quick Application via Supabase Dashboard

1. **Open SQL Editor**: 
   https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/sql

2. **Copy and paste** the contents of:
   `supabase/migrations/20250701_medallion_views_only.sql`

3. **Click "Run"**

## What This Creates:

### Silver Layer Views (Clean & Enriched):
- `silver_transactions` - Transactions with calculated time dimensions
- `silver_products` - Products with brand relationships
- `silver_stores` - Stores with island grouping
- `silver_customers` - Customer aggregations and RFM metrics

### Gold Layer Views (Business KPIs):
- `gold_executive_kpis` - Daily/MTD/YTD revenue metrics
- `gold_product_performance` - Product sales rankings
- `gold_store_performance` - Store performance tiers

## Verify Success:

Run this query after applying the views:

```sql
-- Check all Medallion views
SELECT 
    schemaname,
    viewname as view_name,
    CASE 
        WHEN viewname LIKE 'silver_%' THEN 'Silver Layer'
        WHEN viewname LIKE 'gold_%' THEN 'Gold Layer'
        ELSE 'Other'
    END as layer
FROM pg_views
WHERE schemaname = 'public' 
AND (viewname LIKE 'silver_%' OR viewname LIKE 'gold_%')
ORDER BY layer, view_name;

-- Test Gold Executive KPIs
SELECT * FROM gold_executive_kpis;

-- Test Product Performance (Top 10)
SELECT * FROM gold_product_performance LIMIT 10;

-- Test Store Performance
SELECT * FROM gold_store_performance ORDER BY revenue_rank LIMIT 10;
```

## Application Benefits:

1. **Performance**: Views use indexes on base tables
2. **Consistency**: Single source of truth for calculations
3. **Security**: Row-level security inherited from base tables
4. **Flexibility**: Views can be updated without changing app code

The application will now have access to both:
- Legacy tables/views for backward compatibility
- New Medallion architecture for advanced analytics

Total time to apply: ~30 seconds