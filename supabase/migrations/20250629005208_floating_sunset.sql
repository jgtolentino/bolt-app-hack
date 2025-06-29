/*
  # Create Transactions Table

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key)
      - `datetime` (timestamptz) - Transaction timestamp
      - `geography_id` (uuid) - Foreign key to geography
      - `organization_id` (uuid) - Foreign key to organization
      - `total_amount` (numeric) - Total transaction amount
      - `quantity` (integer) - Quantity purchased
      - `unit_price` (numeric) - Price per unit
      - `discount_amount` (numeric) - Discount applied
      - `payment_method` (text) - Cash, GCash, Utang/Lista, etc.
      - `customer_type` (text) - Regular, Student, Senior, etc.
      - `transaction_source` (text) - Source system
      - `is_processed` (boolean) - Processing status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `transactions` table
    - Add policies for access control
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  datetime timestamptz NOT NULL DEFAULT now(),
  geography_id uuid NOT NULL REFERENCES geography(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  total_amount numeric(12,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2),
  discount_amount numeric(10,2) DEFAULT 0,
  payment_method text DEFAULT 'Cash',
  customer_type text DEFAULT 'Regular',
  transaction_source text DEFAULT 'pos',
  is_processed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to manage
CREATE POLICY "Allow authenticated users to manage transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_datetime ON transactions(datetime);
CREATE INDEX IF NOT EXISTS idx_transactions_geography ON transactions(geography_id);
CREATE INDEX IF NOT EXISTS idx_transactions_organization ON transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_type ON transactions(customer_type);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(total_amount);
CREATE INDEX IF NOT EXISTS idx_transactions_date_range ON transactions(datetime, geography_id, organization_id);

-- Create updated_at trigger
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();