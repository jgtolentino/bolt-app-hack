/*
  # Create Analytics Daily Table

  1. New Tables
    - `analytics_daily`
      - `id` (uuid, primary key)
      - `date` (date) - Analytics date
      - `geography_id` (uuid) - Optional geography filter
      - `organization_id` (uuid) - Optional organization filter
      - `total_sales` (numeric) - Total sales for the day
      - `transaction_count` (integer) - Number of transactions
      - `avg_transaction_value` (numeric) - Average transaction value
      - `total_quantity` (integer) - Total items sold
      - `unique_customers` (integer) - Estimated unique customers
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `analytics_daily` table
    - Add policies for access control
*/

CREATE TABLE IF NOT EXISTS analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  geography_id uuid REFERENCES geography(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organization(id) ON DELETE CASCADE,
  total_sales numeric(15,2),
  transaction_count integer,
  avg_transaction_value numeric(10,2),
  total_quantity integer,
  unique_customers integer,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to analytics_daily"
  ON analytics_daily
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to manage
CREATE POLICY "Allow authenticated users to manage analytics_daily"
  ON analytics_daily
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_daily_date ON analytics_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_geography ON analytics_daily(geography_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_organization ON analytics_daily(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_unique 
  ON analytics_daily(date, geography_id, organization_id);