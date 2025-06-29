/*
  # Create Real-time Triggers

  1. Triggers
    - Real-time notifications for new transactions
    - Automatic analytics_daily updates
    - Performance monitoring triggers
*/

-- Enable real-time for transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE geography;
ALTER PUBLICATION supabase_realtime ADD TABLE organization;

-- Function to update analytics_daily when transactions are inserted
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

-- Create trigger for automatic analytics updates
CREATE TRIGGER trigger_update_analytics_daily
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_daily();

-- Function to log high-value transactions
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

-- Create trigger for high-value transaction monitoring
CREATE TRIGGER trigger_log_high_value_transactions
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_high_value_transactions();

-- Function to validate transaction data
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

-- Create trigger for data validation
CREATE TRIGGER trigger_validate_transaction_data
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_data();