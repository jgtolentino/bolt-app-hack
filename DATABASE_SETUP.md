# Database Setup Guide

This guide explains how to set up the complete database schema and seed data for the POS Analytics System.

## Overview

The database is designed to handle a comprehensive POS (Point of Sale) analytics system with support for:
- Multiple stores across Philippine regions
- Product catalog with categories and brands
- Transaction processing with line items
- Customer segmentation
- Inventory management
- Promotions and pricing
- Real-time analytics with materialized views
- Consumer behavior tracking and profiling
- Product substitution patterns
- Local payment methods (including utang/lista)
- GADM spatial boundaries for geographic analysis
- PostGIS support for advanced location queries

## Database Schema

### Core Tables

1. **stores** - Physical store locations with geographic data
2. **cashiers** - Store employees/cashiers
3. **customers** - Customer records with loyalty tracking
4. **product_categories** - Hierarchical product categories
5. **brands** - Product brand information
6. **suppliers** - Product suppliers
7. **products** - Complete product catalog
8. **transactions** - POS transaction headers
9. **transaction_items** - Transaction line items
10. **price_history** - Product price changes over time
11. **inventory_movements** - Stock tracking
12. **promotions** - Promotional campaigns
13. **promotion_items** - Products included in promotions

### Materialized Views

1. **mv_daily_sales** - Pre-aggregated daily sales metrics
2. **mv_product_performance** - Product sales performance
3. **mv_hourly_patterns** - Hourly transaction patterns

## Setup Instructions

### 1. Run Migrations

Execute the migrations in order:

```bash
# 1. Create the complete data model
supabase db push supabase/migrations/20250630_complete_data_model.sql

# 2. Create transaction items table (if not included)
supabase db push supabase/migrations/20250630_create_transaction_items.sql

# 3. Seed 50,000 transactions with realistic data
supabase db push supabase/migrations/20250630_seed_50k_transactions.sql

# 4. Create refresh views function
supabase db push supabase/migrations/20250630_refresh_views_function.sql

# 5. Create retail analytics model (consumer behavior, substitutions, etc.)
supabase db push supabase/migrations/20250630_complete_retail_analytics_model.sql

# 6. Seed retail analytics data (consumer profiles, payment methods, etc.)
supabase db push supabase/migrations/20250630_seed_retail_analytics_data.sql

# 7. Add GADM spatial support (optional but recommended for geographic analysis)
supabase db push supabase/migrations/20250630_add_gadm_spatial_support.sql

# 8. Redistribute transactions across 365 days (for realistic data distribution)
supabase db push supabase/migrations/20250630_redistribute_transactions_365days.sql
```

### 2. Alternative: Direct SQL Execution

If using Supabase Studio or psql:

```sql
-- Run each migration file in order
\i supabase/migrations/20250630_complete_data_model.sql
\i supabase/migrations/20250630_create_transaction_items.sql
\i supabase/migrations/20250630_seed_50k_transactions.sql
\i supabase/migrations/20250630_refresh_views_function.sql
\i supabase/migrations/20250630_complete_retail_analytics_model.sql
\i supabase/migrations/20250630_seed_retail_analytics_data.sql
\i supabase/migrations/20250630_add_gadm_spatial_support.sql
\i supabase/migrations/20250630_redistribute_transactions_365days.sql
```

### 3. Verify Installation

```sql
-- Check table counts
SELECT 'stores' as table_name, COUNT(*) as count FROM stores
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'transaction_items', COUNT(*) FROM transaction_items;

-- Check materialized views
SELECT schemaname, matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';

-- Test data retrieval
SELECT * FROM mv_daily_sales LIMIT 10;
```

## Data Generation Details

The seed script generates:
- **20 stores** across Philippine regions
- **100 cashiers** distributed across stores
- **5,000 customers** with various types (Regular, Student, Senior, PWD, Walk-in)
- **500 products** across 15 categories with realistic Philippine brands
- **50,000 transactions** with 1-20 items each
- Realistic time patterns (peak hours, weekend surge)
- Payment method distribution (Cash dominant, growing digital adoption)

## Environment Configuration

Update your `.env` file with Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Frontend Integration

The application now uses the `dataService` to fetch real data:

```typescript
import { dataService } from '../services/dataService';

// Get KPI metrics
const metrics = await dataService.getKPIMetrics({ 
  start: subDays(new Date(), 30), 
  end: new Date() 
});

// Get sales trends
const salesData = await dataService.getSalesTrendData('hourly', 1);

// Get product performance
const products = await dataService.getProductPerformanceData(10);
```

## Data Refresh

Materialized views can be refreshed manually:

```sql
SELECT public.refresh_materialized_views();
```

Or set up automatic refresh with pg_cron (if available):

```sql
SELECT cron.schedule(
  'refresh-materialized-views', 
  '0 * * * *', 
  'SELECT public.refresh_materialized_views();'
);
```

## Performance Considerations

1. **Indexes** - All foreign keys and commonly queried fields are indexed
2. **Materialized Views** - Pre-aggregated data for faster dashboard loading
3. **Partitioning** - Consider partitioning `transactions` table by date for very large datasets
4. **Connection Pooling** - Use Supabase connection pooler for production

## Troubleshooting

### Common Issues

1. **"Missing Supabase configuration"**
   - Ensure `.env` file has valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

2. **"permission denied for schema public"**
   - Run migrations with a database owner role
   - Check RLS policies are properly configured

3. **Slow queries**
   - Refresh materialized views: `SELECT public.refresh_materialized_views();`
   - Check query plans with `EXPLAIN ANALYZE`

4. **Data not showing in frontend**
   - Verify "Real Data" mode is enabled in the UI
   - Check browser console for connection errors
   - Ensure RLS policies allow public SELECT access

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Public read access is allowed for analytics
- Write operations require authentication
- Sensitive data (if any) should have additional RLS policies

## Maintenance

Regular maintenance tasks:

1. **Daily**: Refresh materialized views
2. **Weekly**: Analyze tables for query optimization
3. **Monthly**: Review and archive old transactions
4. **Quarterly**: Review indexes and add new ones as needed

## Support

For issues or questions:
1. Check Supabase logs in the dashboard
2. Review browser console for frontend errors
3. Ensure all migrations ran successfully
4. Verify environment variables are set correctly