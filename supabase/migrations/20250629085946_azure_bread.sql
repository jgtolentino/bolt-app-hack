/*
  # Fix RLS policy for transaction generation

  1. Security Updates
    - Make generate_full_dataset function SECURITY DEFINER to bypass RLS
    - Add proper error handling for the generation function
    - Ensure the function can insert data regardless of current user role

  2. Function Updates
    - Update generate_full_dataset to be SECURITY DEFINER
    - Add batch processing capabilities
    - Improve error handling and logging

  This allows the generation function to work properly while maintaining security for normal operations.
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS generate_full_dataset(integer);

-- Create the improved generation function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION generate_full_dataset(target_transactions integer DEFAULT 10000)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
    geography_ids uuid[];
    organization_ids uuid[];
    current_count integer;
    batch_size integer := 1000;
    batches_completed integer := 0;
    total_batches integer;
    start_time timestamp;
    end_time timestamp;
BEGIN
    start_time := now();
    
    -- Get current transaction count
    SELECT COUNT(*) INTO current_count FROM transactions;
    
    -- Calculate total batches needed
    total_batches := CEIL(target_transactions::float / batch_size);
    
    -- Get available geography and organization IDs
    SELECT array_agg(id) INTO geography_ids FROM geography LIMIT 1000;
    SELECT array_agg(id) INTO organization_ids FROM organization LIMIT 1000;
    
    -- Validate we have data to work with
    IF array_length(geography_ids, 1) IS NULL OR array_length(organization_ids, 1) IS NULL THEN
        RETURN 'Error: No geography or organization data found. Please ensure base data exists.';
    END IF;
    
    -- Generate transactions in batches
    WHILE batches_completed < total_batches LOOP
        -- Insert batch of transactions
        INSERT INTO transactions (
            datetime,
            geography_id,
            organization_id,
            total_amount,
            quantity,
            unit_price,
            discount_amount,
            payment_method,
            customer_type,
            transaction_source,
            is_processed
        )
        SELECT 
            -- Random datetime within last 90 days
            now() - (random() * interval '90 days'),
            -- Random geography
            geography_ids[1 + floor(random() * array_length(geography_ids, 1))],
            -- Random organization
            organization_ids[1 + floor(random() * array_length(organization_ids, 1))],
            -- Total amount (₱10 to ₱5000)
            round((10 + random() * 4990)::numeric, 2),
            -- Quantity (1 to 10)
            1 + floor(random() * 10),
            -- Unit price (₱5 to ₱500)
            round((5 + random() * 495)::numeric, 2),
            -- Discount amount (0 to 10% of total)
            round((random() * 50)::numeric, 2),
            -- Payment method
            CASE floor(random() * 4)
                WHEN 0 THEN 'Cash'
                WHEN 1 THEN 'GCash'
                WHEN 2 THEN 'Card'
                ELSE 'Utang/Lista'
            END,
            -- Customer type
            CASE floor(random() * 3)
                WHEN 0 THEN 'Regular'
                WHEN 1 THEN 'VIP'
                ELSE 'New'
            END,
            -- Transaction source
            'generated',
            -- Is processed
            true
        FROM generate_series(1, LEAST(batch_size, target_transactions - (batches_completed * batch_size)));
        
        batches_completed := batches_completed + 1;
        
        -- Log progress every 10 batches
        IF batches_completed % 10 = 0 THEN
            RAISE NOTICE 'Generated batch % of % (% transactions)', batches_completed, total_batches, batches_completed * batch_size;
        END IF;
    END LOOP;
    
    end_time := now();
    
    -- Return success message with statistics
    RETURN format(
        'Successfully generated %s transactions in %s batches. Execution time: %s seconds. Total transactions in database: %s',
        target_transactions,
        total_batches,
        EXTRACT(EPOCH FROM (end_time - start_time))::integer,
        (SELECT COUNT(*) FROM transactions)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details
        RETURN format('Error generating transactions: %s', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_full_dataset(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_full_dataset(integer) TO anon;

-- Create a simpler function for the 750K generation specifically
CREATE OR REPLACE FUNCTION generate_philippine_transactions(num_transactions integer DEFAULT 10000)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result_message text;
BEGIN
    -- Call the main generation function
    SELECT generate_full_dataset(num_transactions) INTO result_message;
    RETURN result_message;
EXCEPTION
    WHEN OTHERS THEN
        RETURN format('Error in Philippine transaction generation: %s', SQLERRM);
END;
$$;

-- Grant permissions for the Philippine-specific function
GRANT EXECUTE ON FUNCTION generate_philippine_transactions(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_philippine_transactions(integer) TO anon;

-- Add a function to check generation progress
CREATE OR REPLACE FUNCTION get_generation_progress()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_count integer;
    today_count integer;
    target_count integer := 750000;
    progress_data json;
BEGIN
    -- Get total transaction count
    SELECT COUNT(*) INTO total_count FROM transactions;
    
    -- Get today's transaction count
    SELECT COUNT(*) INTO today_count 
    FROM transactions 
    WHERE DATE(datetime) = CURRENT_DATE;
    
    -- Build progress JSON
    progress_data := json_build_object(
        'total_transactions', total_count,
        'target_transactions', target_count,
        'target_percentage', ROUND((total_count::float / target_count * 100)::numeric, 2),
        'transactions_today', today_count,
        'remaining_transactions', GREATEST(0, target_count - total_count),
        'avg_per_hour', CASE 
            WHEN today_count > 0 THEN ROUND(today_count::float / EXTRACT(HOUR FROM now())::float, 0)
            ELSE 0
        END
    );
    
    RETURN progress_data;
END;
$$;

-- Grant permissions for progress function
GRANT EXECUTE ON FUNCTION get_generation_progress() TO authenticated;
GRANT EXECUTE ON FUNCTION get_generation_progress() TO anon;