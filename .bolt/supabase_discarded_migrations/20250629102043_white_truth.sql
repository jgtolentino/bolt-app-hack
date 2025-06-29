/*
  # Add Utang/Lista Payment Method Support

  1. New Tables
    - `utang_lista_accounts` - Tracks credit accounts for the Utang/Lista system
    - `utang_lista_transactions` - Records credit transactions and payments

  2. Changes
    - Updates payment method validation to include Utang/Lista
    - Adds new views for credit analysis

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create table for Utang/Lista accounts (credit accounts)
CREATE TABLE IF NOT EXISTS utang_lista_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_contact text,
  geography_id uuid NOT NULL REFERENCES geography(id) ON DELETE CASCADE,
  credit_limit numeric(12,2) DEFAULT 1000.00,
  current_balance numeric(12,2) DEFAULT 0.00,
  payment_due_date date,
  last_payment_date date,
  payment_history text DEFAULT 'good',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on Utang/Lista accounts
ALTER TABLE utang_lista_accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage utang_lista_accounts"
  ON utang_lista_accounts
  FOR ALL
  TO authenticated
  USING (true);

-- Create policy for public read access
CREATE POLICY "Allow public read access to utang_lista_accounts"
  ON utang_lista_accounts
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_utang_lista_accounts_geography ON utang_lista_accounts(geography_id);
CREATE INDEX IF NOT EXISTS idx_utang_lista_accounts_customer ON utang_lista_accounts(customer_name);
CREATE INDEX IF NOT EXISTS idx_utang_lista_accounts_balance ON utang_lista_accounts(current_balance);

-- Create trigger for updated_at column
CREATE TRIGGER update_utang_lista_accounts_updated_at
  BEFORE UPDATE ON utang_lista_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create table for Utang/Lista transactions (credit transactions)
CREATE TABLE IF NOT EXISTS utang_lista_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES utang_lista_accounts(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('purchase', 'payment')),
  amount numeric(12,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on Utang/Lista transactions
ALTER TABLE utang_lista_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users to manage utang_lista_transactions"
  ON utang_lista_transactions
  FOR ALL
  TO authenticated
  USING (true);

-- Create policy for public read access
CREATE POLICY "Allow public read access to utang_lista_transactions"
  ON utang_lista_transactions
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_utang_lista_transactions_account ON utang_lista_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_utang_lista_transactions_type ON utang_lista_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_utang_lista_transactions_amount ON utang_lista_transactions(amount);

-- Create trigger for updated_at column
CREATE TRIGGER update_utang_lista_transactions_updated_at
  BEFORE UPDATE ON utang_lista_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update validate_transaction_data function to include Utang/Lista
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
    
    -- Validate payment method (UPDATED to include Utang/Lista)
    IF NEW.payment_method NOT IN ('Cash', 'GCash', 'Utang/Lista', 'Credit Card', 'Bank Transfer') THEN
        RAISE EXCEPTION 'Invalid payment method: %', NEW.payment_method;
    END IF;
    
    -- Validate customer type
    IF NEW.customer_type NOT IN ('Regular', 'Student', 'Senior', 'Employee', 'Tourist', 'OFW') THEN
        RAISE EXCEPTION 'Invalid customer type: %', NEW.customer_type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update Utang/Lista account balance when a transaction is made
CREATE OR REPLACE FUNCTION update_utang_lista_balance()
RETURNS TRIGGER AS $$
DECLARE
    account_id uuid;
BEGIN
    -- Only process Utang/Lista transactions
    IF NEW.payment_method = 'Utang/Lista' THEN
        -- Find or create account (simplified - in production would use customer identification)
        SELECT id INTO account_id FROM utang_lista_accounts 
        WHERE geography_id = NEW.geography_id 
        AND customer_name = COALESCE(NEW.customer_type, 'Regular Customer')
        LIMIT 1;
        
        -- If no account exists, create one
        IF account_id IS NULL THEN
            INSERT INTO utang_lista_accounts (
                customer_name, 
                geography_id, 
                credit_limit,
                current_balance
            ) VALUES (
                COALESCE(NEW.customer_type, 'Regular Customer'),
                NEW.geography_id,
                1000.00,
                NEW.total_amount
            ) RETURNING id INTO account_id;
        ELSE
            -- Update existing account balance
            UPDATE utang_lista_accounts
            SET current_balance = current_balance + NEW.total_amount,
                updated_at = now()
            WHERE id = account_id;
        END IF;
        
        -- Record the credit transaction
        INSERT INTO utang_lista_transactions (
            account_id,
            transaction_id,
            transaction_type,
            amount,
            notes
        ) VALUES (
            account_id,
            NEW.id,
            'purchase',
            NEW.total_amount,
            'Credit purchase via Utang/Lista system'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for Utang/Lista balance updates
CREATE TRIGGER trigger_update_utang_lista_balance
    AFTER INSERT ON transactions
    FOR EACH ROW
    WHEN (NEW.payment_method = 'Utang/Lista')
    EXECUTE FUNCTION update_utang_lista_balance();

-- Create view for Utang/Lista analytics
CREATE OR REPLACE VIEW v_utang_lista_analytics AS
SELECT 
    g.region,
    g.city_municipality,
    g.store_name,
    COUNT(DISTINCT a.id) as credit_accounts,
    SUM(a.current_balance) as total_credit_outstanding,
    AVG(a.current_balance) as avg_credit_balance,
    MAX(a.current_balance) as max_credit_balance,
    COUNT(t.id) as credit_transactions,
    SUM(CASE WHEN t.transaction_type = 'purchase' THEN t.amount ELSE 0 END) as total_credit_purchases,
    SUM(CASE WHEN t.transaction_type = 'payment' THEN t.amount ELSE 0 END) as total_credit_payments,
    ROUND(
        SUM(CASE WHEN t.transaction_type = 'payment' THEN t.amount ELSE 0 END) / 
        NULLIF(SUM(CASE WHEN t.transaction_type = 'purchase' THEN t.amount ELSE 0 END), 0) * 100, 
        2
    ) as payment_collection_rate
FROM utang_lista_accounts a
JOIN geography g ON a.geography_id = g.id
LEFT JOIN utang_lista_transactions t ON a.id = t.account_id
GROUP BY g.region, g.city_municipality, g.store_name
ORDER BY total_credit_outstanding DESC;

-- Create function to process Utang/Lista payments
CREATE OR REPLACE FUNCTION process_utang_lista_payment(
    p_account_id uuid,
    p_amount numeric,
    p_notes text DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    current_balance numeric;
    account_name text;
BEGIN
    -- Get current balance
    SELECT current_balance, customer_name INTO current_balance, account_name
    FROM utang_lista_accounts
    WHERE id = p_account_id;
    
    -- Validate account exists
    IF account_name IS NULL THEN
        RETURN 'Error: Account not found';
    END IF;
    
    -- Validate payment amount
    IF p_amount <= 0 THEN
        RETURN 'Error: Payment amount must be positive';
    END IF;
    
    -- Update account balance
    UPDATE utang_lista_accounts
    SET 
        current_balance = GREATEST(0, current_balance - p_amount),
        last_payment_date = CURRENT_DATE,
        payment_history = CASE 
            WHEN p_amount >= current_balance * 0.5 THEN 'excellent'
            WHEN p_amount >= current_balance * 0.25 THEN 'good'
            ELSE 'fair'
        END,
        updated_at = now()
    WHERE id = p_account_id;
    
    -- Record payment transaction
    INSERT INTO utang_lista_transactions (
        account_id,
        transaction_type,
        amount,
        notes
    ) VALUES (
        p_account_id,
        'payment',
        p_amount,
        COALESCE(p_notes, 'Payment received for Utang/Lista account')
    );
    
    RETURN 'Success: Payment of ₱' || p_amount || ' processed for ' || account_name;
END;
$$ LANGUAGE plpgsql;

-- Add Utang/Lista sample data
DO $$
DECLARE
    geo_id uuid;
    account_id uuid;
BEGIN
    -- Get a sample geography ID
    SELECT id INTO geo_id FROM geography WHERE region = 'NCR' LIMIT 1;
    
    -- Create sample Utang/Lista accounts
    INSERT INTO utang_lista_accounts (
        customer_name,
        customer_contact,
        geography_id,
        credit_limit,
        current_balance,
        payment_due_date,
        last_payment_date,
        payment_history,
        is_active
    ) VALUES
    ('Maria Santos', '09123456789', geo_id, 2000.00, 1250.00, CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE - INTERVAL '15 days', 'good', true),
    ('Juan Dela Cruz', '09187654321', geo_id, 1500.00, 750.00, CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE - INTERVAL '20 days', 'excellent', true),
    ('Pedro Reyes', '09198765432', geo_id, 1000.00, 950.00, CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE - INTERVAL '25 days', 'fair', true);
    
    -- Get the first account ID for sample transactions
    SELECT id INTO account_id FROM utang_lista_accounts WHERE customer_name = 'Maria Santos';
    
    -- Add sample transactions
    INSERT INTO utang_lista_transactions (
        account_id,
        transaction_type,
        amount,
        notes,
        created_at
    ) VALUES
    (account_id, 'purchase', 500.00, 'Weekly groceries', CURRENT_DATE - INTERVAL '30 days'),
    (account_id, 'purchase', 350.00, 'School supplies', CURRENT_DATE - INTERVAL '25 days'),
    (account_id, 'payment', 300.00, 'Partial payment', CURRENT_DATE - INTERVAL '15 days'),
    (account_id, 'purchase', 700.00, 'Birthday supplies', CURRENT_DATE - INTERVAL '10 days');
END $$;

-- Update existing transactions to include Utang/Lista
UPDATE transactions
SET payment_method = 'Utang/Lista'
WHERE payment_method = 'Cash' 
AND RANDOM() < 0.3
AND id IN (
    SELECT id FROM transactions
    ORDER BY RANDOM()
    LIMIT 2500
);

-- Verify Utang/Lista data
SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM transactions) * 100, 1) as percentage,
    SUM(total_amount) as total_amount,
    ROUND(AVG(total_amount), 2) as avg_transaction_value
FROM transactions
GROUP BY payment_method
ORDER BY transaction_count DESC;