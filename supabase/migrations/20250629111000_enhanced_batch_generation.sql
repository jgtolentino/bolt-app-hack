/*
  # Enhanced Batch Generation with Comprehensive Distribution
  
  This migration creates an improved batch generation system that ensures:
  1. First 2000 records include ALL regions and brands
  2. Proper distribution across all data dimensions
  3. Realistic Philippine retail patterns
  4. Performance optimization for large datasets
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_comprehensive_batch CASCADE;
DROP FUNCTION IF EXISTS generate_distributed_transactions CASCADE;
DROP FUNCTION IF EXISTS ensure_coverage_batch CASCADE;

-- Create enhanced batch generation function with guaranteed coverage
CREATE OR REPLACE FUNCTION generate_comprehensive_batch(
    batch_size INTEGER DEFAULT 2000,
    batch_number INTEGER DEFAULT 1,
    ensure_full_coverage BOOLEAN DEFAULT TRUE
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
    counter INTEGER := 0;
    coverage_counter INTEGER := 0;
    start_time TIMESTAMP := NOW();
    
    -- Arrays to track coverage
    covered_regions TEXT[] := '{}';
    covered_brands TEXT[] := '{}';
    covered_categories TEXT[] := '{}';
    
    -- Cursors for systematic coverage
    geo_cursor CURSOR FOR 
        SELECT * FROM geography 
        ORDER BY 
            CASE 
                WHEN region = ANY(covered_regions) THEN 1 
                ELSE 0 
            END,
            region, city_municipality, barangay;
            
    org_cursor CURSOR FOR
        SELECT * FROM organization
        ORDER BY 
            CASE 
                WHEN brand = ANY(covered_brands) THEN 1 
                ELSE 0 
            END,
            category, brand, sku;
BEGIN
    -- Phase 1: Ensure coverage (if first batch and ensure_full_coverage is true)
    IF batch_number = 1 AND ensure_full_coverage THEN
        RAISE NOTICE '📊 Phase 1: Ensuring full coverage of all regions and brands...';
        
        -- Generate transactions for each unique combination of region x category x brand
        FOR geo_record IN 
            SELECT DISTINCT ON (region) * FROM geography 
            ORDER BY region, city_municipality
        LOOP
            FOR org_record IN 
                SELECT DISTINCT ON (category, brand) * FROM organization 
                ORDER BY category, brand, sku
            LOOP
                -- Generate strategic timestamp
                trans_datetime := NOW() - INTERVAL '30 days' + 
                    (INTERVAL '1 hour' * (coverage_counter % 720));
                
                -- Calculate transaction amount with regional modifiers
                base_amount := CASE geo_record.region
                    WHEN 'NCR' THEN 150 + (RANDOM() * 200)
                    WHEN 'Region VII' THEN 120 + (RANDOM() * 180)
                    WHEN 'Region III' THEN 100 + (RANDOM() * 150)
                    WHEN 'Region IV-A' THEN 110 + (RANDOM() * 160)
                    WHEN 'Region VI' THEN 90 + (RANDOM() * 140)
                    WHEN 'Region XI' THEN 85 + (RANDOM() * 130)
                    ELSE 80 + (RANDOM() * 120)
                END;
                
                -- Quantity based on category
                quantity := CASE org_record.category
                    WHEN 'Beverages' THEN FLOOR(RANDOM() * 3 + 1)::INTEGER
                    WHEN 'Snacks' THEN FLOOR(RANDOM() * 4 + 1)::INTEGER
                    WHEN 'Personal Care' THEN FLOOR(RANDOM() * 2 + 1)::INTEGER
                    WHEN 'Tobacco' THEN FLOOR(RANDOM() * 2 + 1)::INTEGER
                    ELSE FLOOR(RANDOM() * 3 + 1)::INTEGER
                END;
                
                final_amount := base_amount * quantity;
                
                -- Payment method distribution
                payment_method := CASE 
                    WHEN RANDOM() < 0.5 THEN 'Cash'
                    WHEN RANDOM() < 0.8 THEN 'Utang/Lista'
                    WHEN RANDOM() < 0.98 THEN 'GCash'
                    ELSE 'Credit Card'
                END;
                
                -- Customer type
                customer_type := CASE 
                    WHEN RANDOM() < 0.6 THEN 'Regular'
                    WHEN RANDOM() < 0.8 THEN 'Student'
                    WHEN RANDOM() < 0.9 THEN 'Senior'
                    ELSE 'Employee'
                END;
                
                -- Insert coverage transaction
                INSERT INTO transactions (
                    datetime, geography_id, organization_id, 
                    total_amount, quantity, unit_price, 
                    payment_method, customer_type, transaction_source
                ) VALUES (
                    trans_datetime,
                    geo_record.id,
                    org_record.id,
                    ROUND(final_amount::numeric, 2),
                    quantity,
                    ROUND((final_amount / quantity)::numeric, 2),
                    payment_method,
                    customer_type,
                    'coverage_batch'
                );
                
                coverage_counter := coverage_counter + 1;
                
                -- Track coverage
                IF NOT geo_record.region = ANY(covered_regions) THEN
                    covered_regions := array_append(covered_regions, geo_record.region);
                END IF;
                
                IF NOT org_record.brand = ANY(covered_brands) THEN
                    covered_brands := array_append(covered_brands, org_record.brand);
                END IF;
                
                IF NOT org_record.category = ANY(covered_categories) THEN
                    covered_categories := array_append(covered_categories, org_record.category);
                END IF;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE '✅ Coverage phase complete: % transactions ensuring all regions and brands', coverage_counter;
        counter := coverage_counter;
    END IF;
    
    -- Phase 2: Fill remaining batch size with realistic distribution
    RAISE NOTICE '📊 Phase 2: Generating remaining transactions with realistic patterns...';
    
    WHILE counter < batch_size LOOP
        -- Select geography with weighted distribution
        SELECT * INTO geo_record
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
        
        -- Select organization with category weighting
        SELECT * INTO org_record
        FROM organization
        ORDER BY 
            CASE category
                WHEN 'Beverages' THEN RANDOM() * 0.30
                WHEN 'Snacks' THEN RANDOM() * 0.25
                WHEN 'Dairy' THEN RANDOM() * 0.15
                WHEN 'Personal Care' THEN RANDOM() * 0.12
                WHEN 'Home Care' THEN RANDOM() * 0.10
                WHEN 'Tobacco' THEN RANDOM() * 0.05
                ELSE RANDOM() * 0.03
            END DESC
        LIMIT 1;
        
        -- Generate realistic timestamp patterns
        trans_datetime := NOW() - (RANDOM() * INTERVAL '365 days');
        
        -- Apply time-based modifiers
        base_amount := CASE 
            -- Payday effect (15th and 30th)
            WHEN EXTRACT(DAY FROM trans_datetime) IN (15, 30) THEN 
                (RANDOM() * 400 + 100) * 1.35
            -- Weekend effect
            WHEN EXTRACT(DOW FROM trans_datetime) IN (0, 6) THEN 
                (RANDOM() * 300 + 80) * 1.2
            -- Regular days
            ELSE 
                RANDOM() * 250 + 50
        END;
        
        -- Peak hour multiplier
        base_amount := base_amount * CASE EXTRACT(HOUR FROM trans_datetime)::INTEGER
            WHEN 11 THEN 1.3  -- Lunch prep
            WHEN 12 THEN 1.4  -- Lunch
            WHEN 13 THEN 1.3  -- Lunch
            WHEN 18 THEN 1.35 -- Dinner prep
            WHEN 19 THEN 1.4  -- Dinner
            WHEN 20 THEN 1.3  -- Dinner
            WHEN 7 THEN 1.2   -- Morning
            WHEN 8 THEN 1.2   -- Morning
            WHEN 15 THEN 1.15 -- Afternoon
            WHEN 16 THEN 1.15 -- Afternoon
            ELSE 1.0
        END;
        
        -- Category-specific quantity patterns
        quantity := CASE 
            WHEN org_record.category = 'Beverages' AND EXTRACT(HOUR FROM trans_datetime) BETWEEN 11 AND 14 THEN 
                FLOOR(RANDOM() * 4 + 2)::INTEGER
            WHEN org_record.category = 'Snacks' AND EXTRACT(HOUR FROM trans_datetime) BETWEEN 14 AND 17 THEN 
                FLOOR(RANDOM() * 5 + 1)::INTEGER
            WHEN org_record.category = 'Tobacco' THEN 
                FLOOR(RANDOM() * 2 + 1)::INTEGER
            ELSE 
                FLOOR(RANDOM() * 3 + 1)::INTEGER
        END;
        
        final_amount := base_amount * quantity;
        
        -- Realistic payment method by amount
        payment_method := CASE 
            WHEN final_amount < 100 THEN 
                CASE WHEN RANDOM() < 0.7 THEN 'Cash' ELSE 'Utang/Lista' END
            WHEN final_amount < 500 THEN 
                CASE 
                    WHEN RANDOM() < 0.5 THEN 'Cash'
                    WHEN RANDOM() < 0.8 THEN 'GCash'
                    ELSE 'Utang/Lista'
                END
            ELSE 
                CASE 
                    WHEN RANDOM() < 0.3 THEN 'Cash'
                    WHEN RANDOM() < 0.7 THEN 'GCash'
                    WHEN RANDOM() < 0.95 THEN 'Credit Card'
                    ELSE 'Utang/Lista'
                END
        END;
        
        -- Customer type by time and day
        customer_type := CASE 
            WHEN EXTRACT(HOUR FROM trans_datetime) BETWEEN 7 AND 9 AND 
                 EXTRACT(DOW FROM trans_datetime) BETWEEN 1 AND 5 THEN 
                CASE WHEN RANDOM() < 0.4 THEN 'Employee' ELSE 'Regular' END
            WHEN EXTRACT(HOUR FROM trans_datetime) BETWEEN 14 AND 17 THEN 
                CASE WHEN RANDOM() < 0.3 THEN 'Student' ELSE 'Regular' END
            WHEN EXTRACT(HOUR FROM trans_datetime) BETWEEN 9 AND 11 THEN 
                CASE WHEN RANDOM() < 0.2 THEN 'Senior' ELSE 'Regular' END
            ELSE 'Regular'
        END;
        
        -- Insert transaction
        INSERT INTO transactions (
            datetime, geography_id, organization_id, 
            total_amount, quantity, unit_price, 
            payment_method, customer_type, transaction_source
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
    
    RETURN format('Batch %s: Generated %s transactions (Coverage: %s, Regular: %s) in %s seconds', 
                  batch_number, 
                  counter, 
                  coverage_counter,
                  counter - coverage_counter,
                  EXTRACT(EPOCH FROM (NOW() - start_time)));
EXCEPTION
    WHEN OTHERS THEN
        RETURN format('Error in batch %s: %s', batch_number, SQLERRM);
END;
$$;

-- Create function to generate full dataset with coverage guarantee
CREATE OR REPLACE FUNCTION generate_distributed_transactions(
    total_transactions INTEGER DEFAULT 750000,
    batch_size INTEGER DEFAULT 2000
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
    coverage_stats JSONB;
BEGIN
    SELECT COUNT(*) INTO initial_count FROM transactions;
    total_batches := CEIL(total_transactions::DECIMAL / batch_size);
    
    RAISE NOTICE '🚀 Starting generation of % transactions in % batches', total_transactions, total_batches;
    RAISE NOTICE '📊 First batch will ensure complete coverage of all regions and brands';
    
    -- Generate first batch with coverage guarantee
    SELECT generate_comprehensive_batch(batch_size, 1, TRUE) INTO batch_result;
    RAISE NOTICE '%', batch_result;
    current_batch := 1;
    
    -- Check coverage after first batch
    SELECT jsonb_build_object(
        'regions_covered', COUNT(DISTINCT g.region),
        'cities_covered', COUNT(DISTINCT g.city_municipality),
        'categories_covered', COUNT(DISTINCT o.category),
        'brands_covered', COUNT(DISTINCT o.brand),
        'payment_methods', COUNT(DISTINCT t.payment_method)
    ) INTO coverage_stats
    FROM transactions t
    JOIN geography g ON t.geography_id = g.id
    JOIN organization o ON t.organization_id = o.id
    WHERE t.transaction_source IN ('coverage_batch', 'sari_sari_pos');
    
    RAISE NOTICE '✅ Coverage after first batch: %', coverage_stats;
    
    -- Generate remaining batches
    WHILE current_batch < total_batches LOOP
        current_batch := current_batch + 1;
        
        -- For subsequent batches, don't enforce coverage
        SELECT generate_comprehensive_batch(batch_size, current_batch, FALSE) INTO batch_result;
        
        IF current_batch % 10 = 0 THEN
            RAISE NOTICE '📊 Progress: % of % batches completed (% transactions)', 
                         current_batch, total_batches, current_batch * batch_size;
        END IF;
        
        -- Small delay to prevent overwhelming the system
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    SELECT COUNT(*) INTO final_count FROM transactions;
    
    -- Final coverage check
    SELECT jsonb_build_object(
        'total_transactions', COUNT(*),
        'unique_regions', COUNT(DISTINCT g.region),
        'unique_cities', COUNT(DISTINCT g.city_municipality),
        'unique_barangays', COUNT(DISTINCT g.barangay),
        'unique_categories', COUNT(DISTINCT o.category),
        'unique_brands', COUNT(DISTINCT o.brand),
        'unique_skus', COUNT(DISTINCT o.sku),
        'date_range', jsonb_build_object(
            'earliest', MIN(t.datetime),
            'latest', MAX(t.datetime)
        ),
        'payment_methods', jsonb_object_agg(t.payment_method, count(*))
    ) INTO coverage_stats
    FROM transactions t
    JOIN geography g ON t.geography_id = g.id
    JOIN organization o ON t.organization_id = o.id;
    
    RAISE NOTICE '✅ Generation complete! Added % transactions in % seconds', 
                 (final_count - initial_count), 
                 EXTRACT(EPOCH FROM (NOW() - start_time));
    RAISE NOTICE '📊 Final coverage statistics: %', coverage_stats;
    
    RETURN format('Successfully generated %s transactions. Total in database: %s. Coverage: %s', 
                  (final_count - initial_count), 
                  final_count,
                  coverage_stats);
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error during generation: ' || SQLERRM;
END;
$$;

-- Create monitoring function with enhanced statistics
CREATE OR REPLACE FUNCTION monitor_batch_generation()
RETURNS TABLE (
    total_transactions BIGINT,
    regions_covered BIGINT,
    brands_covered BIGINT,
    categories_covered BIGINT,
    latest_transaction TIMESTAMP,
    earliest_transaction TIMESTAMP,
    transactions_today BIGINT,
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
        stats.regions,
        stats.brands,
        stats.categories,
        stats.latest::timestamp,
        stats.earliest::timestamp,
        stats.today_trans,
        ROUND(stats.avg_value::numeric, 2)::decimal,
        payment_dist.payment_json,
        hourly_dist.hourly_json,
        regional_dist.regional_json
    FROM stats, payment_dist, hourly_dist, regional_dist;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_comprehensive_batch TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_distributed_transactions TO authenticated, anon;
GRANT EXECUTE ON FUNCTION monitor_batch_generation TO authenticated, anon;

-- Add helpful comments
COMMENT ON FUNCTION generate_comprehensive_batch IS 'Generates transaction batches with optional full coverage guarantee for first batch';
COMMENT ON FUNCTION generate_distributed_transactions IS 'Orchestrates complete dataset generation ensuring all regions and brands are represented';
COMMENT ON FUNCTION monitor_batch_generation IS 'Provides comprehensive statistics on generated transaction data';

-- Create index for batch generation performance
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(transaction_source);
CREATE INDEX IF NOT EXISTS idx_transactions_datetime_hour ON transactions(EXTRACT(HOUR FROM datetime));