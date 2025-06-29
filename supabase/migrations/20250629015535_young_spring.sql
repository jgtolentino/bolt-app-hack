/*
  # Fix views and triggers

  1. Changes
    - Remove direct ALTER PUBLICATION statements that were causing errors
    - Use DO block with conditional checks before adding tables to publication
    - Keep all view definitions and function definitions
  2. Security
    - Maintain all existing RLS policies
    - Preserve all trigger functions
*/

-- Create transaction summary view if it doesn't exist
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

-- Create geographic performance view if it doesn't exist
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

-- Create product performance view if it doesn't exist
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

-- Create payment method analysis view if it doesn't exist
CREATE OR REPLACE VIEW v_payment_method_analysis AS
SELECT 
    t.payment_method,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_amount,
    AVG(t.total_amount) as avg_transaction_value,
    ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM transactions), 0) * 100, 2) as percentage_of_transactions,
    ROUND(SUM(t.total_amount)::numeric / NULLIF((SELECT SUM(total_amount) FROM transactions), 0) * 100, 2) as percentage_of_sales,
    COUNT(DISTINCT t.geography_id) as stores_using_method,
    COUNT(DISTINCT t.datetime::date) as days_with_transactions
FROM transactions t
GROUP BY t.payment_method
ORDER BY transaction_count DESC;

-- Create hourly patterns view if it doesn't exist
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

-- Create customer analysis view if it doesn't exist
CREATE OR REPLACE VIEW v_customer_analysis AS
SELECT 
    t.customer_type,
    COUNT(*) as transaction_count,
    SUM(t.total_amount) as total_sales,
    AVG(t.total_amount) as avg_transaction_value,
    ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM transactions), 0) * 100, 2) as percentage_of_transactions,
    COUNT(DISTINCT t.geography_id) as stores_visited,
    STRING_AGG(DISTINCT t.payment_method, ', ') as preferred_payment_methods
FROM transactions t
GROUP BY t.customer_type
ORDER BY transaction_count DESC;

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update_analytics_daily function
CREATE OR REPLACE FUNCTION update_analytics_daily()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update analytics_daily record
    INSERT INTO analytics_daily (
        date,
        geography_id,
        organization_id,
        total_sales,
        transaction_count,
        avg_transaction_value,
        total_quantity,
        unique_customers
    )
    SELECT 
        NEW.datetime::date,
        NEW.geography_id,
        NEW.organization_id,
        SUM(t.total_amount),
        COUNT(*),
        AVG(t.total_amount),
        SUM(t.quantity),
        COUNT(DISTINCT CONCAT(t.customer_type, '-', EXTRACT(HOUR FROM t.datetime)))
    FROM transactions t
    WHERE t.datetime::date = NEW.datetime::date
      AND t.geography_id = NEW.geography_id
      AND t.organization_id = NEW.organization_id
    GROUP BY t.datetime::date, t.geography_id, t.organization_id
    ON CONFLICT (date, geography_id, organization_id)
    DO UPDATE SET
        total_sales = EXCLUDED.total_sales,
        transaction_count = EXCLUDED.transaction_count,
        avg_transaction_value = EXCLUDED.avg_transaction_value,
        total_quantity = EXCLUDED.total_quantity,
        unique_customers = EXCLUDED.unique_customers;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create log_high_value_transactions function
CREATE OR REPLACE FUNCTION log_high_value_transactions()
RETURNS TRIGGER AS $$
BEGIN
    -- Log transactions above ₱1000 for monitoring
    IF NEW.total_amount > 1000 THEN
        RAISE NOTICE 'High value transaction: ₱% at % (%) - Payment: %', 
            NEW.total_amount, 
            (SELECT store_name FROM geography WHERE id = NEW.geography_id),
            (SELECT region FROM geography WHERE id = NEW.geography_id),
            NEW.payment_method;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validate_transaction_data function
CREATE OR REPLACE FUNCTION validate_transaction_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure positive amounts
    IF NEW.total_amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be positive: %', NEW.total_amount;
    END IF;
    
    -- Ensure positive quantity
    IF NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'Transaction quantity must be positive: %', NEW.quantity;
    END IF;
    
    -- Validate payment method
    IF NEW.payment_method NOT IN ('Cash', 'GCash', 'Utang/Lista', 'Credit Card', 'Bank Transfer') THEN
        RAISE EXCEPTION 'Invalid payment method: %', NEW.payment_method;
    END IF;
    
    -- Validate customer type
    IF NEW.customer_type NOT IN ('Regular', 'Student', 'Senior', 'Employee', 'Tourist') THEN
        RAISE EXCEPTION 'Invalid customer type: %', NEW.customer_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic analytics updates
DROP TRIGGER IF EXISTS trigger_update_analytics_daily ON transactions;
CREATE TRIGGER trigger_update_analytics_daily
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_daily();

-- Create trigger for high-value transaction monitoring
DROP TRIGGER IF EXISTS trigger_log_high_value_transactions ON transactions;
CREATE TRIGGER trigger_log_high_value_transactions
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_high_value_transactions();

-- Create trigger for data validation
DROP TRIGGER IF EXISTS trigger_validate_transaction_data ON transactions;
CREATE TRIGGER trigger_validate_transaction_data
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_data();

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_geography_updated_at ON geography;
CREATE TRIGGER update_geography_updated_at
    BEFORE UPDATE ON geography
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organization_updated_at ON organization;
CREATE TRIGGER update_organization_updated_at
    BEFORE UPDATE ON organization
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Safely add tables to publication if they're not already members
DO $$
DECLARE
    transaction_exists BOOLEAN;
    geography_exists BOOLEAN;
    organization_exists BOOLEAN;
BEGIN
    -- Check if tables are already in the publication
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'transactions'
    ) INTO transaction_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'geography'
    ) INTO geography_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'organization'
    ) INTO organization_exists;
    
    -- Only add tables to publication if they're not already members
    IF NOT transaction_exists THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
    END IF;
    
    IF NOT geography_exists THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE geography;
    END IF;
    
    IF NOT organization_exists THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE organization;
    END IF;
END
$$;