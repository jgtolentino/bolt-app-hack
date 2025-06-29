/*
  # Validation and Dashboard Functions
  
  This migration creates functions needed by the database validation dashboard
  to properly test Pro plan features and generate comprehensive datasets.
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_full_dataset CASCADE;
DROP FUNCTION IF EXISTS monitor_generation_progress CASCADE;
DROP FUNCTION IF EXISTS get_geographic_performance CASCADE;

-- Create the full dataset generation function
CREATE OR REPLACE FUNCTION generate_full_dataset(
    total_transactions INTEGER DEFAULT 750000,
    batch_size INTEGER DEFAULT 10000
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This is a wrapper for the existing function
    RETURN generate_distributed_transactions(total_transactions, batch_size);
END;
$$;

-- Create monitoring function that matches dashboard expectations
CREATE OR REPLACE FUNCTION monitor_generation_progress()
RETURNS TABLE (
    total_transactions BIGINT,
    target_percentage DECIMAL,
    transactions_today BIGINT,
    avg_per_hour DECIMAL,
    regions_covered BIGINT,
    brands_covered BIGINT,
    categories_covered BIGINT,
    latest_transaction TIMESTAMP,
    earliest_transaction TIMESTAMP,
    avg_transaction_value DECIMAL,
    payment_method_distribution JSONB,
    hourly_distribution JSONB,
    regional_distribution JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_trans,
            COUNT(DISTINCT g.region) as regions,
            COUNT(DISTINCT o.brand) as brands,
            COUNT(DISTINCT o.category) as categories,
            MAX(t.datetime) as latest,
            MIN(t.datetime) as earliest,
            COUNT(*) FILTER (WHERE t.datetime::date = CURRENT_DATE) as today_trans,
            AVG(t.total_amount) as avg_value
        FROM transactions t
        JOIN geography g ON t.geography_id = g.id
        JOIN organization o ON t.organization_id = o.id
    ),
    hourly_stats AS (
        SELECT 
            COUNT(*) / NULLIF(EXTRACT(EPOCH FROM (NOW() - MIN(datetime))) / 3600, 0) as avg_hourly
        FROM transactions
        WHERE datetime > NOW() - INTERVAL '24 hours'
    ),
    payment_dist AS (
        SELECT jsonb_object_agg(payment_method, count) as payment_json
        FROM (
            SELECT payment_method, COUNT(*) as count
            FROM transactions
            GROUP BY payment_method
        ) p
    ),
    hourly_dist AS (
        SELECT jsonb_object_agg(hour::text, count) as hourly_json
        FROM (
            SELECT EXTRACT(HOUR FROM datetime)::int as hour, COUNT(*) as count
            FROM transactions
            GROUP BY EXTRACT(HOUR FROM datetime)
        ) h
    ),
    regional_dist AS (
        SELECT jsonb_object_agg(region, count) as regional_json
        FROM (
            SELECT g.region, COUNT(*) as count
            FROM transactions t
            JOIN geography g ON t.geography_id = g.id
            GROUP BY g.region
        ) r
    )
    SELECT 
        stats.total_trans,
        ROUND((stats.total_trans::DECIMAL / 750000) * 100, 2) as target_percentage,
        stats.today_trans,
        ROUND(COALESCE(hourly_stats.avg_hourly, 0)::numeric, 2)::decimal as avg_per_hour,
        stats.regions,
        stats.brands,
        stats.categories,
        stats.latest::timestamp,
        stats.earliest::timestamp,
        ROUND(stats.avg_value::numeric, 2)::decimal,
        payment_dist.payment_json,
        hourly_dist.hourly_json,
        regional_dist.regional_json
    FROM stats, hourly_stats, payment_dist, hourly_dist, regional_dist;
END;
$$;

-- Create geographic performance function for complex query validation
CREATE OR REPLACE FUNCTION get_geographic_performance(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    region TEXT,
    city_municipality TEXT,
    total_sales DECIMAL,
    transaction_count BIGINT,
    avg_transaction_value DECIMAL,
    top_product TEXT,
    top_payment_method TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH regional_stats AS (
        SELECT 
            g.region,
            g.city_municipality,
            SUM(t.total_amount) as total_rev,
            COUNT(*) as trans_count,
            AVG(t.total_amount) as avg_trans
        FROM transactions t
        JOIN geography g ON t.geography_id = g.id
        WHERE t.datetime::date BETWEEN start_date AND end_date
        GROUP BY g.region, g.city_municipality
    ),
    top_products AS (
        SELECT DISTINCT ON (g.region, g.city_municipality)
            g.region,
            g.city_municipality,
            o.sku as top_sku
        FROM transactions t
        JOIN geography g ON t.geography_id = g.id
        JOIN organization o ON t.organization_id = o.id
        WHERE t.datetime::date BETWEEN start_date AND end_date
        GROUP BY g.region, g.city_municipality, o.sku
        ORDER BY g.region, g.city_municipality, SUM(t.total_amount) DESC
    ),
    top_payments AS (
        SELECT DISTINCT ON (g.region, g.city_municipality)
            g.region,
            g.city_municipality,
            t.payment_method as top_payment
        FROM transactions t
        JOIN geography g ON t.geography_id = g.id
        WHERE t.datetime::date BETWEEN start_date AND end_date
        GROUP BY g.region, g.city_municipality, t.payment_method
        ORDER BY g.region, g.city_municipality, COUNT(*) DESC
    )
    SELECT 
        rs.region,
        rs.city_municipality,
        ROUND(rs.total_rev::numeric, 2)::decimal,
        rs.trans_count,
        ROUND(rs.avg_trans::numeric, 2)::decimal,
        tp.top_sku,
        tpay.top_payment
    FROM regional_stats rs
    LEFT JOIN top_products tp ON rs.region = tp.region AND rs.city_municipality = tp.city_municipality
    LEFT JOIN top_payments tpay ON rs.region = tpay.region AND rs.city_municipality = tpay.city_municipality
    ORDER BY rs.total_rev DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_full_dataset TO authenticated, anon;
GRANT EXECUTE ON FUNCTION monitor_generation_progress TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_geographic_performance TO authenticated, anon;

-- Add helpful comments
COMMENT ON FUNCTION generate_full_dataset IS 'Wrapper function for generating 750K transactions, used by the validation dashboard';
COMMENT ON FUNCTION monitor_generation_progress IS 'Returns comprehensive progress statistics for transaction generation';
COMMENT ON FUNCTION get_geographic_performance IS 'Complex query function for testing Pro plan capabilities';