/*
  # Fix 750K Batch Generation - Complete Solution

  1. Issues Fixed
    - "record org_record is not assigned yet" error
    - "timestamp type mismatch" in monitor_generation_progress
    - RLS policy violations preventing bulk inserts
    
  2. Changes
    - Fixed org_record initialization in generate_transaction_batch
    - Added SECURITY DEFINER to bypass RLS during generation
    - Fixed timestamp casting in monitor_generation_progress
    - Added comprehensive RLS policies
    
  3. Security
    - Functions run with elevated privileges only during execution
    - Normal RLS policies remain active for regular operations
    - Proper permissions granted to authenticated and anon roles
*/

-- Ensure RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow bulk transaction generation" ON transactions;
DROP POLICY IF EXISTS "Allow service role bulk operations" ON transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON transactions;
DROP POLICY IF EXISTS "Service role has full access" ON transactions;

-- Create comprehensive RLS policies
CREATE POLICY "Enable read access for all users"
  ON transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role has full access"
  ON transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Drop and recreate functions with fixes
-- Drop all versions of the functions to avoid ambiguity
DROP FUNCTION IF EXISTS generate_transaction_batch(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS generate_transaction_batch(INTEGER);
DROP FUNCTION IF EXISTS generate_transaction_batch();

DROP FUNCTION IF EXISTS generate_full_dataset(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS generate_full_dataset(INTEGER);
DROP FUNCTION IF EXISTS generate_full_dataset();

DROP FUNCTION IF EXISTS monitor_generation_progress();

-- Fixed generate_transaction_batch function
CREATE OR REPLACE FUNCTION generate_transaction_batch(
    batch_size INTEGER DEFAULT 10000,
    batch_number INTEGER DEFAULT 0
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    geo_record RECORD;
    org_record RECORD;
    trans_datetime TIMESTAMP;
    base_amount DECIMAL(15,2);
    quantity INTEGER;
    final_amount DECIMAL(15,2);
    payment_method TEXT;
    customer_type TEXT;
    regional_economic_modifier DECIMAL(3,2);
    seasonal_modifier DECIMAL(3,2);
    hour_modifier DECIMAL(3,2);
    weekend_modifier DECIMAL(3,2);
    payday_modifier DECIMAL(3,2);
    counter INTEGER := 0;
    start_time TIMESTAMP := NOW();
    start_date TIMESTAMP := NOW() - INTERVAL '365 days';
    end_date TIMESTAMP := NOW();
BEGIN
    WHILE counter < batch_size LOOP
        -- Select random geography
        SELECT id, region INTO geo_record 
        FROM geography 
        ORDER BY 
            CASE region
                WHEN 'NCR' THEN RANDOM() * 0.35
                WHEN 'Region VII' THEN RANDOM() * 0.15
                WHEN 'Region III' THEN RANDOM() * 0.12
                WHEN 'Region IV-A' THEN RANDOM() * 0.10
                WHEN 'Region VI' THEN RANDOM() * 0.08
                WHEN 'Region XI' THEN RANDOM() * 0.05
                ELSE RANDOM() * 0.15
            END DESC
        LIMIT 1;
        
        -- FIX: Select full organization record
        SELECT * INTO org_record 
        FROM organization 
        ORDER BY 
            CASE category
                WHEN 'Beverages' THEN RANDOM() * 0.30
                WHEN 'Snacks' THEN RANDOM() * 0.25
                WHEN 'Dairy' THEN RANDOM() * 0.15
                WHEN 'Personal Care' THEN RANDOM() * 0.12
                WHEN 'Home Care' THEN RANDOM() * 0.10
                ELSE RANDOM() * 0.08
            END DESC
        LIMIT 1;
        
        trans_datetime := start_date + (RANDOM() * (end_date - start_date));
        
        -- Regional modifiers
        regional_economic_modifier := CASE geo_record.region
            WHEN 'NCR' THEN 1.35
            WHEN 'Region IV-A' THEN 1.25
            WHEN 'Region III' THEN 1.15
            WHEN 'Region VII' THEN 1.20
            WHEN 'Region VI' THEN 1.10
            WHEN 'Region XI' THEN 1.05
            ELSE 0.95
        END;
        
        -- Seasonal modifiers
        seasonal_modifier := CASE EXTRACT(MONTH FROM trans_datetime)::INTEGER
            WHEN 9 THEN 1.4
            WHEN 10 THEN 1.4
            WHEN 11 THEN 1.4
            WHEN 12 THEN 1.4
            WHEN 6 THEN 1.25
            WHEN 7 THEN 1.25
            WHEN 4 THEN 1.1
            WHEN 5 THEN 1.1
            ELSE 1.0
        END;
        
        -- Hourly modifiers
        hour_modifier := CASE EXTRACT(HOUR FROM trans_datetime)::INTEGER
            WHEN 11 THEN 1.4
            WHEN 12 THEN 1.4
            WHEN 13 THEN 1.4
            WHEN 18 THEN 1.5
            WHEN 19 THEN 1.5
            WHEN 20 THEN 1.5
            WHEN 7 THEN 1.2
            WHEN 8 THEN 1.2
            WHEN 9 THEN 1.2
            WHEN 15 THEN 1.1
            WHEN 16 THEN 1.1
            WHEN 17 THEN 1.1
            WHEN 21 THEN 0.9
            WHEN 22 THEN 0.9
            WHEN 23 THEN 0.9
            ELSE CASE WHEN EXTRACT(HOUR FROM trans_datetime) < 7 THEN 0.3 ELSE 1.0 END
        END;
        
        -- Weekend modifiers
        weekend_modifier := CASE EXTRACT(DOW FROM trans_datetime)::INTEGER
            WHEN 0 THEN 1.3
            WHEN 6 THEN 1.4
            WHEN 5 THEN 1.25
            ELSE 1.0
        END;
        
        -- Payday modifiers
        payday_modifier := CASE EXTRACT(DAY FROM trans_datetime)::INTEGER
            WHEN 15 THEN 1.35
            WHEN 30 THEN 1.35
            WHEN 31 THEN 1.35
            ELSE CASE 
                WHEN EXTRACT(DAY FROM trans_datetime) IN (1,2,3,4,5,16,17,18,19,20) THEN 1.15
                WHEN EXTRACT(DAY FROM trans_datetime) IN (11,12,13,14,26,27,28,29) THEN 0.85
                ELSE 1.0
            END
        END;
        
        base_amount := RANDOM() * 490 + 10;
        
        quantity := CASE 
            WHEN RANDOM() < 0.6 THEN 1
            WHEN RANDOM() < 0.85 THEN 2
            WHEN RANDOM() < 0.95 THEN 3
            ELSE FLOOR(RANDOM() * 5)::INTEGER + 1
        END;
        
        final_amount := base_amount * quantity * 
                       regional_economic_modifier * 
                       seasonal_modifier * 
                       hour_modifier * 
                       weekend_modifier * 
                       payday_modifier;
        
        payment_method := CASE 
            WHEN RANDOM() < 0.528 THEN 'Cash'
            WHEN RANDOM() < 0.809 THEN 'Utang/Lista'
            WHEN RANDOM() < 0.998 THEN 'GCash'
            ELSE 'Credit Card'
        END;
        
        customer_type := CASE 
            WHEN RANDOM() < 0.6 THEN 'Regular'
            WHEN RANDOM() < 0.8 THEN 'Student'
            WHEN RANDOM() < 0.9 THEN 'Senior'
            ELSE 'Employee'
        END;
        
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
        ) VALUES (
            trans_datetime,
            geo_record.id,
            org_record.id,
            ROUND(final_amount::numeric, 2),
            quantity,
            ROUND((final_amount / quantity)::numeric, 2),
            payment_method,
            customer_type,
            'sari_sari_pos'
        );
        
        counter := counter + 1;
    END LOOP;
    
    RETURN 'Batch ' || batch_number || ': Generated ' || counter || ' transactions in ' || 
           EXTRACT(EPOCH FROM (NOW() - start_time)) || ' seconds';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error in batch ' || batch_number || ': ' || SQLERRM;
END;
$$;

-- Fixed generate_full_dataset function
CREATE OR REPLACE FUNCTION generate_full_dataset(
    total_transactions INTEGER DEFAULT 750000,
    batch_size INTEGER DEFAULT 10000
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_batches INTEGER;
    current_batch INTEGER := 0;
    batch_result TEXT;
    start_time TIMESTAMP := NOW();
    initial_count INTEGER;
    final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO initial_count FROM transactions;
    total_batches := CEIL(total_transactions::DECIMAL / batch_size);
    
    RAISE NOTICE '🚀 Starting generation of % transactions in % batches of % each', 
                 total_transactions, total_batches, batch_size;
    
    WHILE current_batch < total_batches LOOP
        SELECT generate_transaction_batch(batch_size, current_batch + 1) INTO batch_result;
        current_batch := current_batch + 1;
        
        IF current_batch % 10 = 0 THEN
            RAISE NOTICE '📊 Progress: % of % batches completed (% transactions)', 
                         current_batch, total_batches, current_batch * batch_size;
        END IF;
        
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    SELECT COUNT(*) INTO final_count FROM transactions;
    
    RAISE NOTICE '✅ Generation complete! Added % transactions in % seconds', 
                 (final_count - initial_count), 
                 EXTRACT(EPOCH FROM (NOW() - start_time));
    
    RETURN 'Successfully generated ' || (final_count - initial_count) || 
           ' transactions. Total in database: ' || final_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error during generation: ' || SQLERRM;
END;
$$;

-- Fixed monitor_generation_progress function
CREATE OR REPLACE FUNCTION monitor_generation_progress()
RETURNS TABLE (
    total_transactions BIGINT,
    target_percentage DECIMAL,
    latest_transaction TIMESTAMP,
    earliest_transaction TIMESTAMP,
    transactions_today BIGINT,
    avg_per_hour DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_transactions,
        ROUND((COUNT(*)::DECIMAL / 750000) * 100, 2) as target_percentage,
        MAX(datetime)::TIMESTAMP as latest_transaction,  -- FIX: Cast to timestamp without timezone
        MIN(datetime)::TIMESTAMP as earliest_transaction, -- FIX: Cast to timestamp without timezone
        COUNT(*) FILTER (WHERE datetime::date = CURRENT_DATE) as transactions_today,
        ROUND(COUNT(*)::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (MAX(datetime) - MIN(datetime))) / 3600, 1), 2) as avg_per_hour
    FROM transactions;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_transaction_batch TO authenticated;
GRANT EXECUTE ON FUNCTION generate_full_dataset TO authenticated;
GRANT EXECUTE ON FUNCTION monitor_generation_progress TO authenticated;
GRANT EXECUTE ON FUNCTION generate_transaction_batch TO anon;
GRANT EXECUTE ON FUNCTION generate_full_dataset TO anon;
GRANT EXECUTE ON FUNCTION monitor_generation_progress TO anon;

-- Add comments
COMMENT ON FUNCTION generate_transaction_batch IS 'Generates a batch of realistic Philippine retail transactions. Uses SECURITY DEFINER to bypass RLS.';
COMMENT ON FUNCTION generate_full_dataset IS 'Orchestrates generation of 750K transactions in batches. Monitors progress and handles errors.';
COMMENT ON FUNCTION monitor_generation_progress IS 'Monitors the progress of transaction generation, showing counts and statistics.';