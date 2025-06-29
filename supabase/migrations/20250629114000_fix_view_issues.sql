/*
  # Fix View Issues
  
  This migration fixes the issue with dropping columns from views.
  In PostgreSQL, you cannot ALTER VIEW to drop columns. 
  You must drop and recreate the view.
*/

-- First, let's identify any views that might have issues and recreate them properly

-- Drop any problematic views that might exist
DROP VIEW IF EXISTS v_product_performance CASCADE;
DROP VIEW IF EXISTS v_geographic_performance CASCADE;
DROP VIEW IF EXISTS v_payment_method_analysis CASCADE;
DROP VIEW IF EXISTS v_transaction_summary CASCADE;
DROP VIEW IF EXISTS v_inventory_status CASCADE;
DROP VIEW IF EXISTS v_price_changes CASCADE;
DROP VIEW IF EXISTS v_customer_segments CASCADE;
DROP VIEW IF EXISTS v_ai_insights CASCADE;

-- Recreate the views with proper structure

-- Product performance view
CREATE OR REPLACE VIEW v_product_performance AS
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
    COUNT(t.id) as transaction_count,
    SUM(t.quantity) as total_quantity_sold,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.geography_id) as unique_locations,
    COUNT(DISTINCT DATE(t.datetime)) as days_sold
FROM organization o
LEFT JOIN transactions t ON o.id = t.organization_id
GROUP BY o.id, o.client, o.category, o.brand, o.sku, o.sku_description, 
         o.unit_price, o.cost_price, o.margin_percent;

-- Geographic performance view
CREATE OR REPLACE VIEW v_geographic_performance AS
SELECT 
    g.id,
    g.region,
    g.city_municipality,
    g.barangay,
    g.store_name,
    g.store_type,
    COUNT(t.id) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.organization_id) as unique_products,
    COUNT(DISTINCT DATE(t.datetime)) as active_days,
    MAX(t.datetime) as last_transaction_date
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.id, g.region, g.city_municipality, g.barangay, 
         g.store_name, g.store_type;

-- Payment method analysis view
CREATE OR REPLACE VIEW v_payment_method_analysis AS
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
CREATE OR REPLACE VIEW v_transaction_summary AS
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

-- Grant permissions on views
GRANT SELECT ON v_product_performance TO authenticated, anon;
GRANT SELECT ON v_geographic_performance TO authenticated, anon;
GRANT SELECT ON v_payment_method_analysis TO authenticated, anon;
GRANT SELECT ON v_transaction_summary TO authenticated, anon;

-- Add comments
COMMENT ON VIEW v_product_performance IS 'Aggregated product sales performance metrics';
COMMENT ON VIEW v_geographic_performance IS 'Store and location-based performance metrics';
COMMENT ON VIEW v_payment_method_analysis IS 'Payment method distribution and statistics';
COMMENT ON VIEW v_transaction_summary IS 'Daily transaction summaries and trends';