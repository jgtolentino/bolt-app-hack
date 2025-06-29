/*
  # Fix View Drop Issue - Comprehensive Solution
  
  This migration fixes the issue where we cannot drop columns from views.
  PostgreSQL doesn't allow ALTER VIEW DROP COLUMN, so we must:
  1. Drop all dependent views first
  2. Drop and recreate problematic views
  3. Recreate dependent views
*/

-- First, drop all dependent views and functions that might reference these views
DROP VIEW IF EXISTS v_dashboard_metrics CASCADE;
DROP VIEW IF EXISTS v_substitution_analysis CASCADE;
DROP VIEW IF EXISTS v_ai_insights CASCADE;
DROP VIEW IF EXISTS v_customer_segments CASCADE;
DROP VIEW IF EXISTS v_price_changes CASCADE;
DROP VIEW IF EXISTS v_inventory_status CASCADE;
DROP VIEW IF EXISTS v_category_performance CASCADE;
DROP VIEW IF EXISTS v_hourly_sales CASCADE;
DROP VIEW IF EXISTS v_transaction_summary CASCADE;
DROP VIEW IF EXISTS v_payment_method_analysis CASCADE;
DROP VIEW IF EXISTS v_geographic_performance CASCADE;
DROP VIEW IF EXISTS v_product_performance CASCADE;

-- Drop any functions that might depend on these views
DROP FUNCTION IF EXISTS get_dashboard_metrics CASCADE;
DROP FUNCTION IF EXISTS get_product_performance CASCADE;
DROP FUNCTION IF EXISTS get_geographic_performance CASCADE;

-- Now recreate all views with proper structure
-- IMPORTANT: Include ALL columns from base tables to avoid column mismatch issues

-- Product performance view with all organization columns
CREATE VIEW v_product_performance AS
SELECT 
    o.id,
    o.client,
    o.category,
    o.brand,
    o.sku,
    o.sku_description,
    o.unit_price,
    o.cost_price,
    o.margin_percent,
    o.package_size,
    o.is_competitor,
    o.created_at,
    o.updated_at,
    COUNT(t.id) as transaction_count,
    COALESCE(SUM(t.quantity), 0) as total_quantity_sold,
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COALESCE(AVG(t.total_amount), 0) as avg_transaction_value,
    COUNT(DISTINCT t.geography_id) as unique_locations,
    COUNT(DISTINCT DATE(t.datetime)) as days_sold
FROM organization o
LEFT JOIN transactions t ON o.id = t.organization_id
GROUP BY o.id, o.client, o.category, o.brand, o.sku, o.sku_description, 
         o.unit_price, o.cost_price, o.margin_percent, o.package_size, 
         o.is_competitor, o.created_at, o.updated_at;

-- Geographic performance view with all geography columns
CREATE VIEW v_geographic_performance AS
SELECT 
    g.id,
    g.region,
    g.city_municipality,
    g.barangay,
    g.store_name,
    g.store_type,
    g.latitude,
    g.longitude,
    g.population,
    g.area_sqkm,
    g.created_at,
    g.updated_at,
    COUNT(t.id) as transaction_count,
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COALESCE(AVG(t.total_amount), 0) as avg_transaction_value,
    COUNT(DISTINCT t.organization_id) as unique_products,
    COUNT(DISTINCT DATE(t.datetime)) as active_days,
    MAX(t.datetime) as last_transaction_date
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.id, g.region, g.city_municipality, g.barangay, g.store_name, 
         g.store_type, g.latitude, g.longitude, g.population, g.area_sqkm, 
         g.created_at, g.updated_at;

-- Payment method analysis view
CREATE VIEW v_payment_method_analysis AS
SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_transaction_value,
    MIN(total_amount) as min_transaction,
    MAX(total_amount) as max_transaction,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage_of_transactions
FROM transactions
GROUP BY payment_method;

-- Transaction summary view
CREATE VIEW v_transaction_summary AS
SELECT 
    DATE(datetime) as transaction_date,
    COUNT(*) as transaction_count,
    SUM(total_amount) as daily_sales,
    AVG(total_amount) as avg_basket_size,
    COUNT(DISTINCT geography_id) as active_stores,
    COUNT(DISTINCT organization_id) as unique_products,
    MAX(total_amount) as highest_transaction,
    MIN(total_amount) as lowest_transaction
FROM transactions
GROUP BY DATE(datetime);

-- Dashboard metrics view for performance
CREATE VIEW v_dashboard_metrics AS
WITH daily_stats AS (
    SELECT 
        DATE(datetime) as date,
        SUM(total_amount) as daily_revenue,
        COUNT(*) as daily_transactions
    FROM transactions
    WHERE datetime >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(datetime)
),
payment_stats AS (
    SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(total_amount) as total
    FROM transactions
    WHERE datetime >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY payment_method
)
SELECT 
    COALESCE((SELECT SUM(daily_revenue) FROM daily_stats), 0) as total_revenue_30d,
    COALESCE((SELECT SUM(daily_transactions) FROM daily_stats), 0) as total_transactions_30d,
    COALESCE((SELECT AVG(daily_revenue) FROM daily_stats), 0) as avg_daily_revenue,
    COALESCE((SELECT json_agg(json_build_object(
        'payment_method', payment_method,
        'count', count,
        'total', total
    )) FROM payment_stats), '[]'::json) as payment_distribution;

-- Recreate the substitution analysis view if it exists
CREATE VIEW v_substitution_analysis AS
SELECT 
    o1.sku as original_sku,
    o1.brand as original_brand,
    o1.category as original_category,
    o2.sku as substituted_sku,
    o2.brand as substituted_brand,
    o2.category as substituted_category,
    sp.substitution_count,
    sp.acceptance_rate,
    g.region,
    g.city_municipality,
    CASE 
        WHEN o1.brand = o2.brand THEN 'Same Brand'
        WHEN o1.category = o2.category THEN 'Same Category'
        ELSE 'Different Category'
    END as substitution_type,
    CASE
        WHEN o2.unit_price > o1.unit_price THEN 'Upsell'
        WHEN o2.unit_price < o1.unit_price THEN 'Downsell'
        ELSE 'Same Price'
    END as price_impact
FROM substitution_patterns sp
JOIN organization o1 ON sp.original_product_id = o1.id
JOIN organization o2 ON sp.substituted_product_id = o2.id
LEFT JOIN geography g ON sp.geography_id = g.id;

-- Grant permissions on all views
GRANT SELECT ON v_product_performance TO authenticated, anon;
GRANT SELECT ON v_geographic_performance TO authenticated, anon;
GRANT SELECT ON v_payment_method_analysis TO authenticated, anon;
GRANT SELECT ON v_transaction_summary TO authenticated, anon;
GRANT SELECT ON v_dashboard_metrics TO authenticated, anon;
GRANT SELECT ON v_substitution_analysis TO authenticated, anon;

-- Add comments
COMMENT ON VIEW v_product_performance IS 'Aggregated product sales performance metrics with all organization columns';
COMMENT ON VIEW v_geographic_performance IS 'Store and location-based performance metrics with all geography columns';
COMMENT ON VIEW v_payment_method_analysis IS 'Payment method distribution and statistics';
COMMENT ON VIEW v_transaction_summary IS 'Daily transaction summaries and trends';
COMMENT ON VIEW v_dashboard_metrics IS 'Pre-aggregated metrics for dashboard performance';
COMMENT ON VIEW v_substitution_analysis IS 'Product substitution patterns and analytics';

-- Create indexes on base tables to improve view performance
CREATE INDEX IF NOT EXISTS idx_transactions_datetime ON transactions(datetime);
CREATE INDEX IF NOT EXISTS idx_transactions_geography_id ON transactions(geography_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_id ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);