/*
  # Create Geography Table

  1. New Tables
    - `geography`
      - `id` (uuid, primary key)
      - `region` (text) - Philippine regions (NCR, Region III, etc.)
      - `city_municipality` (text) - City or municipality name
      - `barangay` (text) - Barangay name
      - `store_name` (text) - Name of the retail store
      - `latitude` (numeric) - GPS latitude
      - `longitude` (numeric) - GPS longitude
      - `population` (integer) - Area population
      - `area_sqkm` (numeric) - Area in square kilometers
      - `store_type` (text) - Type of store (sari-sari, supermarket, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `geography` table
    - Add policy for public read access (for analytics dashboard)
*/

CREATE TABLE IF NOT EXISTS geography (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text NOT NULL,
  city_municipality text NOT NULL,
  barangay text NOT NULL,
  store_name text NOT NULL,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  population integer,
  area_sqkm numeric(10,2),
  store_type text DEFAULT 'sari-sari',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE geography ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (analytics dashboard)
CREATE POLICY "Allow public read access to geography"
  ON geography
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to insert/update
CREATE POLICY "Allow authenticated users to manage geography"
  ON geography
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_geography_region ON geography(region);
CREATE INDEX IF NOT EXISTS idx_geography_city ON geography(city_municipality);
CREATE INDEX IF NOT EXISTS idx_geography_location ON geography(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_geography_store_type ON geography(store_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_geography_updated_at
  BEFORE UPDATE ON geography
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();