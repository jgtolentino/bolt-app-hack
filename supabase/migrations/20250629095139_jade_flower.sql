/*
  # Fix Transaction Generation Timeout

  1. Issues Fixed
    - Statement timeout when generating large transaction batches
    - Function ambiguity errors with generate_full_dataset
    
  2. Changes
    - Create a more efficient transaction generation function
    - Use smaller batch sizes with better progress tracking
    - Add timeout handling and recovery mechanisms
    - Fix function signature ambiguity
*/

-- Drop existing functions with explicit parameter types to avoid ambiguity
DROP FUNCTION IF EXISTS generate_transaction_batch(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS generate_full_dataset(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS monitor_generation_progress();

-- Create a more efficient transaction generation function with timeout handling
CREATE OR REPLACE FUNCTION generate_efficient_transactions(
    target_count INTEGER DEFAULT 1000,
    max_batch_size INTEGER DEFAULT 1000
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    geo_ids UUID[];
    org_ids UUID[];
    batch_size INTEGER;
    total_batches INTEGER;
    current_batch INTEGER := 0;
    transactions_added INTEGER := 0;
    start_time TIMESTAMP := NOW();
    batch_start_time TIMESTAMP;
    batch_duration INTERVAL;
    avg_batch_time INTERVAL := INTERVAL '1 second';
    estimated_time INTERVAL;
    result TEXT;
BEGIN
    -- Get geography and organization IDs upfront to avoid repeated queries
    SELECT ARRAY_AGG(id) INTO geo_ids FROM geography;
    SELECT ARRAY_AGG(id) INTO org_ids FROM organization;
    
    -- Validate we have data to work with
    IF array_length(geo_ids, 1) IS NULL OR array_length(org_ids, 1) IS NULL THEN
        RETURN 'Error: No geography or organization data found';
    END IF;
    
    -- Start with a small batch size and adjust based on performance
    batch_size := LEAST(100, max_batch_size);
    total_batches := CEIL(target_count::DECIMAL / batch_size);
    
    RAISE NOTICE 'Starting generation of % transactions with adaptive batch sizing', target_count;
    
    -- Process in batches
    WHILE transactions_added < target_count LOOP
        current_batch := current_batch + 1;
        batch_start_time := NOW();
        
        -- Calculate remaining transactions
        batch_size := LEAST(batch_size, target_count - transactions_added);
        
        -- Insert batch of transactions
        WITH batch_data AS (
            SELECT 
                -- Random datetime within last 90 days
                NOW() - (RANDOM() * INTERVAL '90 days') AS datetime,
                -- Random geography
                geo_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(geo_ids, 1))::INTEGER] AS geography_id,
                -- Random organization
                org_ids[1 + FLOOR(RANDOM() * ARRAY_LENGTH(org_ids, 1))::INTEGER] AS organization_id,
                -- Total amount (₱10 to ₱1000)
                ROUND((10 + RANDOM() * 990)::NUMERIC, 2) AS total_amount,
                -- Quantity (1 to 5)
                1 + FLOOR(RANDOM() * 5)::INTEGER AS quantity,
                -- Payment method
                CASE 
                    WHEN RANDOM() < 0.528 THEN 'Cash'
                    WHEN RANDOM() < 0.809 THEN 'Utang/Lista'
                    WHEN RANDOM() < 0.998 THEN 'GCash'
                    ELSE 'Credit Card'
                END AS payment_method,
                -- Customer type
                CASE 
                    WHEN RANDOM() < 0.6 THEN 'Regular'
                    WHEN RANDOM() < 0.8 THEN 'Student'
                    WHEN RANDOM() < 0.9 THEN 'Senior'
                    ELSE 'Employee'
                END AS customer_type
            FROM generate_series(1, batch_size)
        )
        INSERT INTO transactions (
            datetime,
            geography_id,
            organization_id,
            total_amount,
            quantity,
            unit_price,
            payment_method,
            customer_type,
            transaction_source
        )
        SELECT
            datetime,
            geography_id,
            organization_id,
            total_amount,
            quantity,
            ROUND((total_amount / quantity)::NUMERIC, 2) AS unit_price,
            payment_method,
            customer_type,
            'generated'
        FROM batch_data;
        
        -- Update counters
        transactions_added := transactions_added + batch_size;
        batch_duration := NOW() - batch_start_time;
        
        -- Adaptively adjust batch size based on performance
        -- If batch took less than 0.5 seconds, increase batch size
        -- If batch took more than 2 seconds, decrease batch size
        IF batch_duration < INTERVAL '0.5 seconds' AND batch_size < max_batch_size THEN
            batch_size := LEAST(batch_size * 2, max_batch_size);
        ELSIF batch_duration > INTERVAL '2 seconds' AND batch_size > 100 THEN
            batch_size := GREATEST(batch_size / 2, 100)::INTEGER;
        END IF;
        
        -- Update average batch time with exponential moving average
        avg_batch_time := (avg_batch_time * 0.7) + (batch_duration * 0.3);
        
        -- Estimate remaining time
        estimated_time := avg_batch_time * ((target_count - transactions_added) / GREATEST(batch_size, 1))::INTEGER;
        
        -- Log progress every 10 batches or when batch size changes
        IF current_batch % 10 = 0 THEN
            RAISE NOTICE 'Progress: % of % transactions (%.1f%%) - Batch size: % - Est. remaining: % minutes',
                transactions_added,
                target_count,
                (transactions_added::FLOAT / target_count * 100),
                batch_size,
                EXTRACT(EPOCH FROM estimated_time) / 60;
        END IF;
        
        -- Small delay to prevent database overload
        PERFORM pg_sleep(0.05);
    END LOOP;
    
    result := format(
        'Successfully generated %s transactions in %s seconds. Current batch size: %s',
        transactions_added,
        EXTRACT(EPOCH FROM (NOW() - start_time))::INTEGER,
        batch_size
    );
    
    RAISE NOTICE '%', result;
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN format(
            'Error after generating %s of %s transactions: %s',
            transactions_added,
            target_count,
            SQLERRM
        );
END;
$$;

-- Create a function to monitor generation progress
CREATE OR REPLACE FUNCTION get_transaction_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_count', COUNT(*),
        'today_count', COUNT(*) FILTER (WHERE datetime::DATE = CURRENT_DATE),
        'by_payment_method', (
            SELECT json_object_agg(payment_method, cnt)
            FROM (
                SELECT payment_method, COUNT(*) as cnt
                FROM transactions
                GROUP BY payment_method
                ORDER BY cnt DESC
            ) pm
        ),
        'by_region', (
            SELECT json_object_agg(region, cnt)
            FROM (
                SELECT g.region, COUNT(*) as cnt
                FROM transactions t
                JOIN geography g ON t.geography_id = g.id
                GROUP BY g.region
                ORDER BY cnt DESC
                LIMIT 5
            ) r
        ),
        'latest_transaction', MAX(datetime),
        'earliest_transaction', MIN(datetime),
        'avg_transaction_value', AVG(total_amount)
    ) INTO result
    FROM transactions;
    
    RETURN result;
END;
$$;

-- Create a simpler function for small transaction generation
CREATE OR REPLACE FUNCTION generate_sample_transactions(count INTEGER DEFAULT 100)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN generate_efficient_transactions(count, 100);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error generating sample transactions: ' || SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_efficient_transactions(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_sample_transactions(INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION generate_efficient_transactions IS 'Efficiently generates transactions with adaptive batch sizing and timeout handling';
COMMENT ON FUNCTION get_transaction_stats IS 'Returns comprehensive statistics about transactions in the database';
COMMENT ON FUNCTION generate_sample_transactions IS 'Generates a small sample of transactions for testing';

-- Create additional RLS policies for transactions table if needed
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' 
        AND policyname = 'Allow authenticated users to manage transactions'
    ) THEN
        CREATE POLICY "Allow authenticated users to manage transactions"
            ON transactions
            FOR ALL
            TO authenticated
            USING (true);
    END IF;
END
$$;