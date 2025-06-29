/*
  # Create Organization Table

  1. New Tables
    - `organization`
      - `id` (uuid, primary key)
      - `client` (text) - Client company name
      - `category` (text) - Product category
      - `brand` (text) - Brand name
      - `sku` (text) - Stock Keeping Unit
      - `sku_description` (text) - Product description
      - `unit_price` (numeric) - Price per unit
      - `cost_price` (numeric) - Cost price
      - `margin_percent` (numeric) - Profit margin percentage
      - `package_size` (text) - Package size description
      - `is_competitor` (boolean) - Whether this is a competitor product
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `organization` table
    - Add policies for public read and authenticated write
*/

CREATE TABLE IF NOT EXISTS organization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client text NOT NULL,
  category text NOT NULL,
  brand text NOT NULL,
  sku text NOT NULL UNIQUE,
  sku_description text,
  unit_price numeric(10,2),
  cost_price numeric(10,2),
  margin_percent numeric(5,2),
  package_size text,
  is_competitor boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to organization"
  ON organization
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to manage
CREATE POLICY "Allow authenticated users to manage organization"
  ON organization
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organization_client ON organization(client);
CREATE INDEX IF NOT EXISTS idx_organization_category ON organization(category);
CREATE INDEX IF NOT EXISTS idx_organization_brand ON organization(brand);
CREATE INDEX IF NOT EXISTS idx_organization_sku ON organization(sku);
CREATE INDEX IF NOT EXISTS idx_organization_competitor ON organization(is_competitor);

-- Create updated_at trigger
CREATE TRIGGER update_organization_updated_at
  BEFORE UPDATE ON organization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();