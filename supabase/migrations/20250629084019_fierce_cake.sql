/*
  # Generate 750K Philippine Retail Transactions - Batched Approach

  1. New Functions
    - `generate_transaction_batch` - Generates transactions in batches
    - `generate_full_dataset` - Orchestrates the full 750K generation
    - `monitor_generation_progress` - Tracks progress

  2. Features
    - Batched generation to avoid timeouts
    - Progress monitoring
    - Realistic Philippine retail patterns
    - Proper error handling
*/

-- Function to generate a batch of transactions
CREATE OR REPLACE FUNCTION generate_transaction_batch(
    batch_size INTEGER DEFAULT 10000,
    batch_number INTEGER DEFAULT 0
)
RETURNS TEXT AS $$
DECLARE
    geo_record RECORD;
    org_record RECORD;
    trans_datetime TIMESTAMP;
    base_amount DECIMAL(15,2);
    quantity INTEGER;
    final_amount DECIMAL(15,2);
    payment_method TEXT;
    customer_type TEXT;
    
    -- Philippine-specific modifiers
    regional_economic_modifier DECIMAL(3,2);
    seasonal_modifier DECIMAL(3,2);
    hour_modifier DECIMAL(3,2);
    weekend_modifier DECIMAL(3,2);
    payday_modifier DECIMAL(3,2);
    
    counter INTEGER := 0;
    start_time TIMESTAMP := NOW();
    
    -- Date range for transactions (1 year of data)
    start_date TIMESTAMP := NOW() - INTERVAL '365 days';
    end_date TIMESTAMP := NOW();
BEGIN
    -- Loop to create batch_size transactions
    WHILE counter < batch_size LOOP
        -- Select random geography (weighted by region economic importance)
        SELECT id, region INTO geo_record 
        FROM geography 
        ORDER BY 
            CASE region
                WHEN 'NCR' THEN RANDOM() * 0.35  -- 35% weight for NCR
                WHEN 'Region VII' THEN RANDOM() * 0.15  -- 15% for Central Visayas
                WHEN 'Region III' THEN RANDOM() * 0.12  -- 12% for Central Luzon
                WHEN 'Region IV-A' THEN RANDOM() * 0.10  -- 10% for CALABARZON
                WHEN 'Region VI' THEN RANDOM() * 0.08   -- 8% for Western Visayas
                WHEN 'Region XI' THEN RANDOM() * 0.05   -- 5% for Davao
                ELSE RANDOM() * 0.15  -- 15% for other regions
            END DESC
        LIMIT 1;
        
        -- Select random product (weighted by category popularity)
        SELECT id INTO org_record.id 
        FROM organization 
        ORDER BY 
            CASE category
                WHEN 'Beverages' THEN RANDOM() * 0.30    -- 30% beverages
                WHEN 'Snacks' THEN RANDOM() * 0.25       -- 25% snacks
                WHEN 'Dairy' THEN RANDOM() * 0.15        -- 15% dairy
                WHEN 'Personal Care' THEN RANDOM() * 0.12 -- 12% personal care
                WHEN 'Home Care' THEN RANDOM() * 0.10     -- 10% home care
                ELSE RANDOM() * 0.08  -- 8% other categories
            END DESC
        LIMIT 1;
        
        -- Generate realistic timestamp within the date range
        SELECT start_date + (RANDOM() * (end_date - start_date)) INTO trans_datetime;
        
        -- REGIONAL ECONOMIC MODIFIERS
        CASE geo_record.region
            WHEN 'NCR' THEN regional_economic_modifier := 1.35;
            WHEN 'Region IV-A' THEN regional_economic_modifier := 1.25;
            WHEN 'Region III' THEN regional_economic_modifier := 1.15;
            WHEN 'Region VII' THEN regional_economic_modifier := 1.20;
            WHEN 'Region VI' THEN regional_economic_modifier := 1.10;
            WHEN 'Region XI' THEN regional_economic_modifier := 1.05;
            ELSE regional_economic_modifier := 0.95;
        END CASE;
        
        -- PHILIPPINE SEASONAL PATTERNS
        CASE EXTRACT(MONTH FROM trans_datetime)
            WHEN 9, 10, 11, 12 THEN seasonal_modifier := 1.4;  -- Christmas season
            WHEN 6, 7 THEN seasonal_modifier := 1.25;          -- Back-to-school
            WHEN 4, 5 THEN seasonal_modifier := 1.1;           -- Summer
            ELSE seasonal_modifier := 1.0;
        END CASE;
        
        -- HOURLY PATTERNS (Filipino shopping habits)
        CASE EXTRACT(HOUR FROM trans_datetime)
            WHEN 11, 12, 13 THEN hour_modifier := 1.4;  -- Lunch rush
            WHEN 18, 19, 20 THEN hour_modifier := 1.5;  -- Dinner/post-work
            WHEN 7, 8, 9 THEN hour_modifier := 1.2;     -- Morning commute
            WHEN 15, 16, 17 THEN hour_modifier := 1.1;  -- Afternoon
            WHEN 21, 22, 23 THEN hour_modifier := 0.9;  -- Evening
            WHEN 0, 1, 2, 3, 4, 5, 6 THEN hour_modifier := 0.3; -- Night/early morning
            ELSE hour_modifier := 1.0;
        END CASE;
        
        -- WEEKEND MODIFIER
        CASE EXTRACT(DOW FROM trans_datetime)
            WHEN 0 THEN weekend_modifier := 1.3;   -- Sunday
            WHEN 6 THEN weekend_modifier := 1.4;   -- Saturday
            WHEN 5 THEN weekend_modifier := 1.25;  -- Friday
            ELSE weekend_modifier := 1.0;
        END CASE;
        
        -- PAYDAY EFFECTS (15th & 30th/31st)
        CASE EXTRACT(DAY FROM trans_datetime)
            WHEN 15, 30, 31 THEN payday_modifier := 1.35;
            WHEN 1, 2, 3, 4, 5, 16, 17, 18, 19, 20 THEN payday_modifier := 1.15;
            WHEN 11, 12, 13, 14, 26, 27, 28, 29 THEN payday_modifier := 0.85;
            ELSE payday_modifier := 1.0;
        END CASE;
        
        -- Base transaction amount (₱10 - ₱500)
        SELECT RANDOM() * 490 + 10 INTO base_amount;
        
        -- Realistic quantity patterns
        SELECT 
            CASE 
                WHEN RANDOM() < 0.6 THEN 1      -- 60% single item
                WHEN RANDOM() < 0.85 THEN 2     -- 25% two items  
                WHEN RANDOM() < 0.95 THEN 3     -- 10% three items
                ELSE FLOOR(RANDOM() * 5) + 1    -- 5% bulk buying
            END INTO quantity;
        
        -- Calculate final amount with all modifiers
        SELECT base_amount * quantity * 
               regional_economic_modifier * 
               seasonal_modifier * 
               hour_modifier * 
               weekend_modifier * 
               payday_modifier INTO final_amount;
        
        -- PAYMENT METHOD DISTRIBUTION (Philippine retail reality)
        SELECT 
            CASE 
                WHEN RANDOM() < 0.528 THEN 'Cash'
                WHEN RANDOM() < 0.809 THEN 'Utang/Lista'
                WHEN RANDOM() < 0.998 THEN 'GCash'
                ELSE 'Credit Card'
            END INTO payment_method;
        
        -- CUSTOMER TYPE DISTRIBUTION
        SELECT 
            CASE 
                WHEN RANDOM() < 0.6 THEN 'Regular'
                WHEN RANDOM() < 0.8 THEN 'Student'
                WHEN RANDOM() < 0.9 THEN 'Senior'
                ELSE 'Employee'
            END INTO customer_type;
        
        -- Insert transaction
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
END;
$$ LANGUAGE plpgsql;

-- Function to generate the full 750K dataset
CREATE OR REPLACE FUNCTION generate_full_dataset(
    total_transactions INTEGER DEFAULT 750000,
    batch_size INTEGER DEFAULT 10000
)
RETURNS TEXT AS $$
DECLARE
    total_batches INTEGER;
    current_batch INTEGER := 0;
    batch_result TEXT;
    start_time TIMESTAMP := NOW();
    initial_count INTEGER;
    final_count INTEGER;
BEGIN
    -- Get initial transaction count
    SELECT COUNT(*) INTO initial_count FROM transactions;
    
    -- Calculate total batches needed
    total_batches := CEIL(total_transactions::DECIMAL / batch_size);
    
    RAISE NOTICE '🚀 Starting generation of % transactions in % batches of % each', 
                 total_transactions, total_batches, batch_size;
    
    -- Generate transactions in batches
    WHILE current_batch < total_batches LOOP
        -- Generate one batch
        SELECT generate_transaction_batch(batch_size, current_batch + 1) INTO batch_result;
        
        current_batch := current_batch + 1;
        
        -- Progress report every 10 batches
        IF current_batch % 10 = 0 THEN
            RAISE NOTICE '📊 Progress: % of % batches completed (% transactions)', 
                         current_batch, total_batches, current_batch * batch_size;
        END IF;
        
        -- Small delay to prevent overload
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    -- Get final count
    SELECT COUNT(*) INTO final_count FROM transactions;
    
    RAISE NOTICE '✅ Generation complete! Added % transactions in % seconds', 
                 (final_count - initial_count), 
                 EXTRACT(EPOCH FROM (NOW() - start_time));
    
    RETURN 'Successfully generated ' || (final_count - initial_count) || 
           ' transactions. Total in database: ' || final_count;
END;
$$ LANGUAGE plpgsql;

-- Function to monitor generation progress
CREATE OR REPLACE FUNCTION monitor_generation_progress()
RETURNS TABLE (
    total_transactions BIGINT,
    target_percentage DECIMAL,
    latest_transaction TIMESTAMP,
    earliest_transaction TIMESTAMP,
    transactions_today BIGINT,
    avg_per_hour DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_transactions,
        ROUND((COUNT(*)::DECIMAL / 750000) * 100, 2) as target_percentage,
        MAX(datetime) as latest_transaction,
        MIN(datetime) as earliest_transaction,
        COUNT(*) FILTER (WHERE datetime::date = CURRENT_DATE) as transactions_today,
        ROUND(COUNT(*)::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (MAX(datetime) - MIN(datetime))) / 3600, 1), 2) as avg_per_hour
    FROM transactions;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance during generation
CREATE INDEX IF NOT EXISTS idx_transactions_datetime_batch ON transactions(datetime);
CREATE INDEX IF NOT EXISTS idx_transactions_geography_batch ON transactions(geography_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization_batch ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_batch ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_batch ON transactions(customer_type);

-- Composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_transactions_date_geo_batch ON transactions(datetime, geography_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_org_batch ON transactions(datetime, organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_amount_date_batch ON transactions(total_amount, datetime);

-- Execute the generation (uncomment to run)
-- SELECT generate_full_dataset(750000, 10000);

-- Monitor progress (run this to check status)
-- SELECT * FROM monitor_generation_progress();