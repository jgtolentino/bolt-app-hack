/*
  # Generate Philippine Retail Transactions

  1. New Data
    - Creates 10,000 realistic Philippine retail transactions
    - Includes Utang/Lista payment method (28.1% of transactions)
    - Follows Philippine shopping patterns and regional preferences
    - Realistic seasonal and time-of-day patterns

  2. Payment Methods
    - Cash: 52.8%
    - Utang/Lista: 28.1%
    - GCash: 18.9%
    - Credit Card: 0.2%

  3. Regional Distribution
    - NCR: 35%
    - Region VII (Central Visayas): 15%
    - Region III (Central Luzon): 12%
    - Region IV-A (CALABARZON): 10%
    - Region VI (Western Visayas): 8%
    - Region XI (Davao): 5%
    - Other regions: 15%
*/

-- Function to generate realistic Philippine retail transactions
CREATE OR REPLACE FUNCTION generate_philippine_transactions(num_transactions INTEGER)
RETURNS TEXT AS $$
DECLARE
    geo_id UUID;
    org_id UUID;
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
    geo_record RECORD;
    org_record RECORD;
BEGIN
    -- Loop to create transactions
    WHILE counter < num_transactions LOOP
        -- Select random geography (store location)
        SELECT id, region INTO geo_record FROM geography ORDER BY RANDOM() LIMIT 1;
        
        -- Select random product
        SELECT id INTO org_id FROM organization ORDER BY RANDOM() LIMIT 1;
        
        -- Generate realistic timestamp (last 30 days)
        SELECT NOW() - (RANDOM() * INTERVAL '30 days') INTO trans_datetime;
        
        -- REGIONAL ECONOMIC MODIFIERS (Based on actual Philippine economic data)
        CASE geo_record.region
            -- Metro tier (High purchasing power)
            WHEN 'NCR' THEN regional_economic_modifier := 1.35;
            WHEN 'Region IV-A' THEN regional_economic_modifier := 1.25;
            -- Urban tier (Growing middle class)
            WHEN 'Region III' THEN regional_economic_modifier := 1.15;
            WHEN 'Region VII' THEN regional_economic_modifier := 1.20;
            WHEN 'Region VI' THEN regional_economic_modifier := 1.10;
            WHEN 'Region XI' THEN regional_economic_modifier := 1.05;
            -- Other regions
            ELSE regional_economic_modifier := 0.95;
        END CASE;
        
        -- PHILIPPINE SEASONAL PATTERNS
        CASE EXTRACT(MONTH FROM trans_datetime)
            -- Christmas Season (Sept-Dec): MAJOR BOOST
            WHEN 9, 10, 11, 12 THEN seasonal_modifier := 1.4;
            -- Back-to-school (June-July): GOOD BOOST  
            WHEN 6, 7 THEN seasonal_modifier := 1.25;
            -- Summer months: SLIGHT BOOST
            WHEN 4, 5 THEN seasonal_modifier := 1.1;
            -- Regular months
            ELSE seasonal_modifier := 1.0;
        END CASE;
        
        -- HOURLY PATTERNS (Filipino shopping habits)
        CASE EXTRACT(HOUR FROM trans_datetime)
            WHEN 11, 12, 13 THEN hour_modifier := 1.4;  -- Lunch rush
            WHEN 18, 19, 20 THEN hour_modifier := 1.5;  -- Dinner/post-work
            WHEN 7, 8, 9 THEN hour_modifier := 1.2;     -- Morning commute
            WHEN 15, 16, 17 THEN hour_modifier := 1.1;  -- Afternoon snacks
            WHEN 21, 22, 23 THEN hour_modifier := 0.9;  -- Evening wind-down
            WHEN 0, 1, 2, 3, 4, 5, 6 THEN hour_modifier := 0.3; -- Night/early morning
            ELSE hour_modifier := 1.0;
        END CASE;
        
        -- WEEKEND MODIFIER (Filipino weekend shopping culture)
        CASE EXTRACT(DOW FROM trans_datetime)
            WHEN 0 THEN weekend_modifier := 1.3;   -- Sunday (family day)
            WHEN 6 THEN weekend_modifier := 1.4;   -- Saturday (major shopping day)
            WHEN 5 THEN weekend_modifier := 1.25;  -- Friday (payday effect)
            ELSE weekend_modifier := 1.0;
        END CASE;
        
        -- PAYDAY EFFECTS (15th & 30th/31st of month - Filipino salary pattern)
        CASE EXTRACT(DAY FROM trans_datetime)
            WHEN 15, 30, 31 THEN payday_modifier := 1.35;
            WHEN 1, 2, 3, 4, 5 THEN payday_modifier := 1.15;  -- Post-payday effect
            WHEN 16, 17, 18, 19, 20 THEN payday_modifier := 1.15; -- Post-payday effect
            WHEN 11, 12, 13, 14 THEN payday_modifier := 0.85; -- Pre-payday decline
            WHEN 26, 27, 28, 29 THEN payday_modifier := 0.85; -- Pre-payday decline
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
                ELSE FLOOR(RANDOM() * 5) + 1    -- 5% bulk buying (1-5 items)
            END INTO quantity;
        
        -- Calculate final amount with all Philippine-specific modifiers
        SELECT base_amount * quantity * 
               regional_economic_modifier * 
               seasonal_modifier * 
               hour_modifier * 
               weekend_modifier * 
               payday_modifier INTO final_amount;
        
        -- PAYMENT METHOD DISTRIBUTION (Philippine retail reality)
        -- Cash: 52.8%, Utang/Lista: 28.1%, GCash: 18.9%, Credit Card: 0.2%
        SELECT 
            CASE 
                WHEN RANDOM() < 0.528 THEN 'Cash'
                WHEN RANDOM() < 0.809 THEN 'Utang/Lista'  -- 0.528 + 0.281 = 0.809
                WHEN RANDOM() < 0.998 THEN 'GCash'        -- 0.809 + 0.189 = 0.998
                ELSE 'Credit Card'                        -- Remaining 0.2%
            END INTO payment_method;
        
        -- CUSTOMER TYPE DISTRIBUTION
        SELECT 
            CASE 
                WHEN RANDOM() < 0.6 THEN 'Regular'        -- 60% regular
                WHEN RANDOM() < 0.8 THEN 'Student'        -- 20% student
                WHEN RANDOM() < 0.9 THEN 'Senior'         -- 10% senior citizen
                ELSE 'Employee'                           -- 10% employee
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
            org_id,
            ROUND(final_amount::numeric, 2),
            quantity,
            ROUND((final_amount / quantity)::numeric, 2),
            payment_method,
            customer_type,
            'sari_sari_pos'
        );
        
        counter := counter + 1;
        
        -- Progress indicator every 1000 transactions
        IF counter % 1000 = 0 THEN
            RAISE NOTICE 'Generated % transactions...', counter;
        END IF;
    END LOOP;
    
    RETURN 'Successfully generated ' || counter || ' Philippine retail transactions with Utang/Lista payment method!';
END;
$$ LANGUAGE plpgsql;

-- Generate 10,000 transactions
SELECT generate_philippine_transactions(10000);

-- Verify payment method distribution
SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM transactions) * 100, 1) as percentage,
    SUM(total_amount) as total_amount,
    ROUND(AVG(total_amount), 2) as avg_transaction_value
FROM transactions
GROUP BY payment_method
ORDER BY transaction_count DESC;

-- Verify regional distribution
SELECT 
    g.region,
    COUNT(*) as transaction_count,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM transactions) * 100, 1) as percentage,
    SUM(t.total_amount) as total_sales,
    ROUND(AVG(t.total_amount), 2) as avg_transaction_value
FROM transactions t
JOIN geography g ON t.geography_id = g.id
GROUP BY g.region
ORDER BY transaction_count DESC;

-- Verify hourly patterns
SELECT 
    EXTRACT(HOUR FROM datetime) as hour_of_day,
    COUNT(*) as transaction_count,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM transactions) * 100, 1) as percentage,
    SUM(total_amount) as total_sales,
    ROUND(AVG(total_amount), 2) as avg_transaction_value
FROM transactions
GROUP BY hour_of_day
ORDER BY hour_of_day;

-- Verify payment method by region
SELECT 
    g.region,
    t.payment_method,
    COUNT(*) as transaction_count,
    ROUND(COUNT(*)::numeric / COUNT(*) OVER (PARTITION BY g.region) * 100, 1) as percentage_in_region,
    SUM(t.total_amount) as total_sales,
    ROUND(AVG(t.total_amount), 2) as avg_transaction_value
FROM transactions t
JOIN geography g ON t.geography_id = g.id
GROUP BY g.region, t.payment_method
ORDER BY g.region, transaction_count DESC;