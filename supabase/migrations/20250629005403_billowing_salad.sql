/*
  # Create Useful Views

  1. Views
    - `v_transaction_summary` - Daily transaction summaries
    - `v_geographic_performance` - Geographic performance view
    - `v_product_performance` - Product performance view
    - `v_payment_method_analysis` - Payment method analysis
*/

-- View for transaction summaries
CREATE OR REPLACE VIEW v_transaction_summary AS
SELECT 
    t.datetime::date as transaction_date,
    g.region,
    g.city_municipality,
    g.barangay,
    g.store_name,
    o.client,
    o.category,
    o.brand,
    o.sku,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    SUM(t.quantity) as total_quantity,
    STRING_AGG(DISTINCT t.payment_method, ', ') as payment_methods_used
FROM transactions t
JOIN geography g ON t.geography_id = g.id
JOIN organization o ON t.organization_id = o.id
GROUP BY 
    t.datetime::date, g.region, g.city_municipality, g.barangay, g.store_name,
    o.client, o.category, o.brand, o.sku;

-- View for geographic performance
CREATE OR REPLACE VIEW v_geographic_performance AS
SELECT 
    g.region,
    g.city_municipality,
    COUNT(DISTINCT g.id) as store_count,
    COUNT(t.id) as total_transactions,
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COALESCE(AVG(t.total_amount), 0) as avg_transaction_value,
    COALESCE(SUM(t.quantity), 0) as total_items_sold,
    COUNT(DISTINCT t.datetime::date) as active_days
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.region, g.city_municipality
ORDER BY total_sales DESC;

-- View for product performance
CREATE OR REPLACE VIEW v_product_performance AS
SELECT 
    o.client,
    o.category,
    o.brand,
    o.sku,
    o.sku_description,
    COUNT(t.id) as transaction_count,
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COALESCE(AVG(t.total_amount), 0) as avg_transaction_value,
    COALESCE(SUM(t.quantity), 0) as total_quantity_sold,
    o.unit_price,
    o.margin_percent,
    COALESCE(SUM(t.total_amount) * o.margin_percent / 100, 0) as estimated_profit
FROM organization o
LEFT JOIN transactions t ON o.id = t.organization_id
GROUP BY o.id, o.client, o.category, o.brand, o.sku, o.sku_description, o.unit_price, o.margin_percent
ORDER BY total_sales DESC;

-- View for payment method analysis
CREATE OR REPLACE VIEW v_payment_method_analysis AS
SELECT 
    t.payment_method,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_amount,
    AVG(t.total_amount) as avg_transaction_value,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM transactions) * 100, 2) as percentage_of_transactions,
    ROUND(SUM(t.total_amount)::numeric / (SELECT SUM(total_amount) FROM transactions) * 100, 2) as percentage_of_sales,
    COUNT(DISTINCT t.geography_id) as stores_using_method,
    COUNT(DISTINCT t.datetime::date) as days_with_transactions
FROM transactions t
GROUP BY t.payment_method
ORDER BY transaction_count DESC;

-- View for hourly patterns
CREATE OR REPLACE VIEW v_hourly_patterns AS
SELECT 
    EXTRACT(HOUR FROM t.datetime) as hour_of_day,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    COUNT(DISTINCT t.geography_id) as active_stores,
    STRING_AGG(DISTINCT t.payment_method, ', ') as payment_methods
FROM transactions t
GROUP BY EXTRACT(HOUR FROM t.datetime)
ORDER BY hour_of_day;

-- View for customer type analysis
CREATE OR REPLACE VIEW v_customer_analysis AS
SELECT 
    t.customer_type,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM transactions) * 100, 2) as percentage_of_transactions,
    COUNT(DISTINCT t.geography_id) as stores_visited,
    STRING_AGG(DISTINCT t.payment_method, ', ') as preferred_payment_methods
FROM transactions t
GROUP BY t.customer_type
ORDER BY transaction_count DESC;