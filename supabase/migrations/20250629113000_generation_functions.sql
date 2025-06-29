/*
  # Transaction Generation Functions
  
  This migration creates the efficient generation functions needed by the improved dashboard
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_efficient_transactions CASCADE;
DROP FUNCTION IF EXISTS get_transaction_stats CASCADE;
DROP FUNCTION IF EXISTS stop_transaction_generation CASCADE;

-- Create efficient transaction generation function
CREATE OR REPLACE FUNCTION generate_efficient_transactions(
    target_count INTEGER DEFAULT 10000,
    max_batch_size INTEGER DEFAULT 1000
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    actual_batch_size INTEGER;
    batches_needed INTEGER;
    current_batch INTEGER := 0;
    batch_result TEXT;
    start_time TIMESTAMP := NOW();
    total_generated INTEGER := 0;
BEGIN
    -- Calculate optimal batch size to avoid timeouts
    actual_batch_size := LEAST(max_batch_size, 
                              CASE 
                                WHEN target_count > 10000 THEN 500
                                WHEN target_count > 5000 THEN 750
                                ELSE 1000
                              END);
    
    batches_needed := CEIL(target_count::DECIMAL / actual_batch_size);
    
    RAISE NOTICE '🚀 Starting efficient generation of % transactions in % batches of %', 
                 target_count, batches_needed, actual_batch_size;
    
    -- Generate batches
    WHILE current_batch < batches_needed LOOP
        current_batch := current_batch + 1;
        
        -- Generate batch ensuring coverage for first batch
        SELECT generate_comprehensive_batch(
            actual_batch_size, 
            current_batch, 
            current_batch = 1  -- ensure_full_coverage for first batch only
        ) INTO batch_result;
        
        total_generated := total_generated + actual_batch_size;
        
        -- Log progress
        IF current_batch % 5 = 0 OR current_batch = batches_needed THEN
            RAISE NOTICE '📊 Progress: % of % batches completed (≈% transactions)', 
                         current_batch, batches_needed, 
                         LEAST(total_generated, target_count);
        END IF;
        
        -- Small delay to prevent overwhelming the system
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RETURN format('✅ Successfully generated approximately %s transactions in %s seconds', 
                  LEAST(total_generated, target_count),
                  EXTRACT(EPOCH FROM (NOW() - start_time)));
EXCEPTION
    WHEN OTHERS THEN
        RETURN format('❌ Error during generation: %s (Generated %s transactions before error)', 
                      SQLERRM, total_generated);
END;
$$;

-- Create transaction statistics function
CREATE OR REPLACE FUNCTION get_transaction_stats()
RETURNS TABLE (
    total_count BIGINT,
    today_count BIGINT,
    avg_per_hour DECIMAL,
    earliest_transaction TIMESTAMP,
    latest_transaction TIMESTAMP,
    avg_transaction_value DECIMAL,
    by_payment_method JSONB,
    by_region JSONB,
    by_category JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH base_stats AS (
        SELECT 
            COUNT(*) as total_trans,
            COUNT(*) FILTER (WHERE datetime::date = CURRENT_DATE) as today_trans,
            MIN(datetime) as earliest,
            MAX(datetime) as latest,
            AVG(total_amount) as avg_value
        FROM transactions
    ),
    hourly_rate AS (
        SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE COUNT(*) / NULLIF(EXTRACT(EPOCH FROM (NOW() - MIN(datetime))) / 3600, 0)
            END as avg_hourly
        FROM transactions
        WHERE datetime > NOW() - INTERVAL '24 hours'
    ),
    payment_stats AS (
        SELECT jsonb_object_agg(payment_method, count) as payment_json
        FROM (
            SELECT payment_method, COUNT(*) as count
            FROM transactions
            GROUP BY payment_method
            ORDER BY count DESC
        ) p
    ),
    regional_stats AS (
        SELECT jsonb_object_agg(region, count) as region_json
        FROM (
            SELECT g.region, COUNT(*) as count
            FROM transactions t
            JOIN geography g ON t.geography_id = g.id
            GROUP BY g.region
            ORDER BY count DESC
        ) r
    ),
    category_stats AS (
        SELECT jsonb_object_agg(category, count) as category_json
        FROM (
            SELECT o.category, COUNT(*) as count
            FROM transactions t
            JOIN organization o ON t.organization_id = o.id
            GROUP BY o.category
            ORDER BY count DESC
        ) c
    )
    SELECT 
        base_stats.total_trans,
        base_stats.today_trans,
        ROUND(COALESCE(hourly_rate.avg_hourly, 0)::numeric, 2)::decimal,
        base_stats.earliest::timestamp,
        base_stats.latest::timestamp,
        ROUND(COALESCE(base_stats.avg_value, 0)::numeric, 2)::decimal,
        COALESCE(payment_stats.payment_json, '{}'::jsonb),
        COALESCE(regional_stats.region_json, '{}'::jsonb),
        COALESCE(category_stats.category_json, '{}'::jsonb)
    FROM base_stats, hourly_rate, payment_stats, regional_stats, category_stats;
END;
$$;

-- Create placeholder stop function (actual implementation would require background job management)
CREATE OR REPLACE FUNCTION stop_transaction_generation()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- In a real implementation, this would signal background jobs to stop
    -- For now, just return a message
    RETURN 'Generation stop signal sent (Note: Already running batches will complete)';
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_efficient_transactions TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_transaction_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION stop_transaction_generation TO authenticated, anon;

-- Add helpful comments
COMMENT ON FUNCTION generate_efficient_transactions IS 'Efficiently generates transactions with adaptive batch sizing to prevent timeouts';
COMMENT ON FUNCTION get_transaction_stats IS 'Returns comprehensive statistics about generated transactions';
COMMENT ON FUNCTION stop_transaction_generation IS 'Placeholder for stopping generation (requires background job implementation)';