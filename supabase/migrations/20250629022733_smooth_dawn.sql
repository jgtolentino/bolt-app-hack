-- =============================================================================
-- SUKI ANALYTICS DATABASE VALIDATION QUERIES
-- =============================================================================

-- 1. BASIC DATA COUNTS
-- =============================================================================
SELECT 'BASIC COUNTS' as section;

SELECT 
    'Geography' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT region) as unique_regions,
    COUNT(DISTINCT city_municipality) as unique_cities,
    COUNT(DISTINCT store_name) as unique_stores
FROM geography;

SELECT 
    'Organization' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT client) as unique_clients,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(DISTINCT brand) as unique_brands,
    COUNT(DISTINCT sku) as unique_skus
FROM organization;

SELECT 
    'Transactions' as table_name,
    COUNT(*) as total_records,
    MIN(datetime) as earliest_transaction,
    MAX(datetime) as latest_transaction,
    COUNT(DISTINCT DATE(datetime)) as unique_days
FROM transactions;

-- 2. KPI METRICS VALIDATION
-- =============================================================================
SELECT 'KPI METRICS' as section;

-- Total Sales
SELECT 
    'Total Sales' as metric,
    SUM(total_amount) as current_value,
    COUNT(*) as transaction_count,
    AVG(total_amount) as avg_transaction_value
FROM transactions
WHERE datetime >= CURRENT_DATE - INTERVAL '30 days';

-- Regional Distribution
SELECT 
    'Regional Sales' as metric,
    g.region,
    COUNT(t.id) as transaction_count,
    SUM(t.total_amount) as total_sales,
    ROUND(SUM(t.total_amount) * 100.0 / (SELECT SUM(total_amount) FROM transactions), 2) as percentage
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.region
ORDER BY total_sales DESC;

-- Payment Method Distribution
SELECT 
    'Payment Methods' as metric,
    payment_method,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_amount,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions), 2) as percentage
FROM transactions
GROUP BY payment_method
ORDER BY transaction_count DESC;

-- 3. TOP PERFORMING PRODUCTS
-- =============================================================================
SELECT 'TOP PRODUCTS' as section;

SELECT 
    o.sku,
    o.brand,
    o.category,
    COUNT(t.id) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value
FROM organization o
JOIN transactions t ON o.id = t.organization_id
GROUP BY o.id, o.sku, o.brand, o.category
ORDER BY total_sales DESC
LIMIT 10;

-- 4. GEOGRAPHIC PERFORMANCE
-- =============================================================================
SELECT 'GEOGRAPHIC PERFORMANCE' as section;

SELECT 
    g.region,
    g.city_municipality,
    COUNT(DISTINCT g.id) as store_count,
    COUNT(t.id) as total_transactions,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
GROUP BY g.region, g.city_municipality
ORDER BY total_sales DESC
LIMIT 15;

-- 5. TIME PATTERNS
-- =============================================================================
SELECT 'TIME PATTERNS' as section;

-- Hourly patterns
SELECT 
    EXTRACT(HOUR FROM datetime) as hour_of_day,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_transaction_value
FROM transactions
GROUP BY EXTRACT(HOUR FROM datetime)
ORDER BY hour_of_day;

-- Daily patterns (last 7 days)
SELECT 
    DATE(datetime) as transaction_date,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_transaction_value
FROM transactions
WHERE datetime >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(datetime)
ORDER BY transaction_date DESC;

-- 6. CUSTOMER TYPE ANALYSIS
-- =============================================================================
SELECT 'CUSTOMER ANALYSIS' as section;

SELECT 
    customer_type,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_transaction_value,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions), 2) as percentage
FROM transactions
GROUP BY customer_type
ORDER BY transaction_count DESC;

-- 7. BRAND PERFORMANCE (TBWA vs COMPETITORS)
-- =============================================================================
SELECT 'BRAND PERFORMANCE' as section;

SELECT 
    CASE WHEN o.is_competitor = FALSE THEN 'TBWA Clients' ELSE 'Competitors' END as brand_type,
    COUNT(t.id) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    ROUND(COUNT(t.id) * 100.0 / (SELECT COUNT(*) FROM transactions), 2) as percentage
FROM organization o
JOIN transactions t ON o.id = t.organization_id
GROUP BY o.is_competitor
ORDER BY total_sales DESC;

-- 8. RECENT ACTIVITY
-- =============================================================================
SELECT 'RECENT ACTIVITY' as section;

-- Last 10 transactions
SELECT 
    t.datetime,
    g.region,
    g.store_name,
    o.brand,
    o.sku,
    t.total_amount,
    t.payment_method,
    t.customer_type
FROM transactions t
JOIN geography g ON t.geography_id = g.id
JOIN organization o ON t.organization_id = o.id
ORDER BY t.datetime DESC
LIMIT 10;

-- 9. DATA QUALITY CHECKS
-- =============================================================================
SELECT 'DATA QUALITY' as section;

-- Check for null values
SELECT 
    'Null Values Check' as check_type,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN geography_id IS NULL THEN 1 END) as null_geography,
    COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as null_organization,
    COUNT(CASE WHEN total_amount IS NULL THEN 1 END) as null_amount,
    COUNT(CASE WHEN payment_method IS NULL THEN 1 END) as null_payment_method
FROM transactions;

-- Check for data ranges
SELECT 
    'Data Ranges' as check_type,
    MIN(total_amount) as min_amount,
    MAX(total_amount) as max_amount,
    AVG(total_amount) as avg_amount,
    MIN(quantity) as min_quantity,
    MAX(quantity) as max_quantity,
    AVG(quantity) as avg_quantity
FROM transactions;

-- 10. SUMMARY STATISTICS
-- =============================================================================
SELECT 'SUMMARY STATISTICS' as section;

SELECT 
    'Database Summary' as summary_type,
    (SELECT COUNT(*) FROM geography) as total_stores,
    (SELECT COUNT(DISTINCT region) FROM geography) as total_regions,
    (SELECT COUNT(*) FROM organization) as total_products,
    (SELECT COUNT(*) FROM transactions) as total_transactions,
    (SELECT SUM(total_amount) FROM transactions) as total_sales_value,
    (SELECT COUNT(DISTINCT payment_method) FROM transactions) as payment_methods,
    (SELECT COUNT(DISTINCT customer_type) FROM transactions) as customer_types;