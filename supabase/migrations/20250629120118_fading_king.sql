/*
  # Add Substitution Patterns Tracking

  1. New Tables
    - `substitution_patterns` - Tracks when customers substitute one product for another
      - `id` (uuid, primary key)
      - `original_product_id` (uuid) - Foreign key to organization (product originally requested)
      - `substituted_product_id` (uuid) - Foreign key to organization (product accepted instead)
      - `geography_id` (uuid) - Foreign key to geography (store location)
      - `substitution_count` (integer) - Number of times this substitution occurred
      - `acceptance_rate` (numeric) - Percentage of customers who accept this substitution
      - `last_updated` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Views
    - `v_substitution_analysis` - Provides insights on substitution patterns

  3. Security
    - Enable RLS on `substitution_patterns` table
    - Add policies for access control
*/

-- Create substitution_patterns table
CREATE TABLE IF NOT EXISTS substitution_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_product_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  substituted_product_id uuid NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  geography_id uuid REFERENCES geography(id) ON DELETE CASCADE,
  substitution_count integer NOT NULL DEFAULT 1,
  acceptance_rate numeric(5,2) NOT NULL DEFAULT 100.00,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE substitution_patterns ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to substitution_patterns"
  ON substitution_patterns
  FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to manage
CREATE POLICY "Allow authenticated users to manage substitution_patterns"
  ON substitution_patterns
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_substitution_original_product ON substitution_patterns(original_product_id);
CREATE INDEX IF NOT EXISTS idx_substitution_substituted_product ON substitution_patterns(substituted_product_id);
CREATE INDEX IF NOT EXISTS idx_substitution_geography ON substitution_patterns(geography_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_substitution_unique 
  ON substitution_patterns(original_product_id, substituted_product_id, geography_id);

-- Create updated_at trigger
CREATE TRIGGER update_substitution_patterns_updated_at
  BEFORE UPDATE ON substitution_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for substitution analysis
CREATE OR REPLACE VIEW v_substitution_analysis AS
SELECT 
    o1.sku as original_sku,
    o1.brand as original_brand,
    o1.category as original_category,
    o2.sku as substituted_sku,
    o2.brand as substituted_brand,
    o2.category as substituted_category,
    sp.substitution_count,
    sp.acceptance_rate,
    g.region,
    g.city_municipality,
    CASE 
        WHEN o1.brand = o2.brand THEN 'Same Brand'
        WHEN o1.category = o2.category THEN 'Same Category'
        ELSE 'Different Category'
    END as substitution_type,
    CASE
        WHEN o2.unit_price > o1.unit_price THEN 'Upsell'
        WHEN o2.unit_price < o1.unit_price THEN 'Downsell'
        ELSE 'Same Price'
    END as price_impact
FROM substitution_patterns sp
JOIN organization o1 ON sp.original_product_id = o1.id
JOIN organization o2 ON sp.substituted_product_id = o2.id
LEFT JOIN geography g ON sp.geography_id = g.id;

-- Function to record a substitution
CREATE OR REPLACE FUNCTION record_substitution(
    original_sku text,
    substituted_sku text,
    geography_id uuid DEFAULT NULL,
    accepted boolean DEFAULT true
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    original_id uuid;
    substituted_id uuid;
    existing_record_id uuid;
BEGIN
    -- Get product IDs
    SELECT id INTO original_id FROM organization WHERE sku = original_sku;
    SELECT id INTO substituted_id FROM organization WHERE sku = substituted_sku;
    
    -- Validate products exist
    IF original_id IS NULL THEN
        RETURN 'Error: Original product not found: ' || original_sku;
    END IF;
    
    IF substituted_id IS NULL THEN
        RETURN 'Error: Substituted product not found: ' || substituted_sku;
    END IF;
    
    -- Check if record already exists
    SELECT id INTO existing_record_id 
    FROM substitution_patterns 
    WHERE original_product_id = original_id 
      AND substituted_product_id = substituted_id
      AND (geography_id = record_substitution.geography_id OR 
           (geography_id IS NULL AND record_substitution.geography_id IS NULL));
    
    IF existing_record_id IS NOT NULL THEN
        -- Update existing record
        UPDATE substitution_patterns
        SET substitution_count = substitution_count + 1,
            acceptance_rate = CASE 
                WHEN accepted THEN 
                    (acceptance_rate * substitution_count + 100) / (substitution_count + 1)
                ELSE 
                    (acceptance_rate * substitution_count) / (substitution_count + 1)
            END,
            last_updated = now(),
            updated_at = now()
        WHERE id = existing_record_id;
        
        RETURN 'Updated existing substitution pattern';
    ELSE
        -- Insert new record
        INSERT INTO substitution_patterns (
            original_product_id,
            substituted_product_id,
            geography_id,
            substitution_count,
            acceptance_rate
        ) VALUES (
            original_id,
            substituted_id,
            geography_id,
            1,
            CASE WHEN accepted THEN 100.00 ELSE 0.00 END
        );
        
        RETURN 'Recorded new substitution pattern';
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION record_substitution(text, text, uuid, boolean) TO authenticated;

-- Insert sample substitution data
DO $$
DECLARE
    geo_id uuid;
    original_id uuid;
    substituted_id uuid;
BEGIN
    -- Get a sample geography ID
    SELECT id INTO geo_id FROM geography WHERE region = 'NCR' LIMIT 1;
    
    -- Coca-Cola to Pepsi
    SELECT id INTO original_id FROM organization WHERE sku = 'COKE-355ML-CAN';
    SELECT id INTO substituted_id FROM organization WHERE sku = 'PEPSI-355ML-CAN';
    
    IF original_id IS NOT NULL AND substituted_id IS NOT NULL THEN
        INSERT INTO substitution_patterns (
            original_product_id, substituted_product_id, geography_id, 
            substitution_count, acceptance_rate
        ) VALUES (
            original_id, substituted_id, geo_id, 450, 65.00
        );
    END IF;
    
    -- Oishi to Jack n Jill
    SELECT id INTO original_id FROM organization WHERE sku = 'OISHI-PRAWN-60G';
    SELECT id INTO substituted_id FROM organization WHERE sku = 'JNJ-PIATTOS-40G';
    
    IF original_id IS NOT NULL AND substituted_id IS NOT NULL THEN
        INSERT INTO substitution_patterns (
            original_product_id, substituted_product_id, geography_id, 
            substitution_count, acceptance_rate
        ) VALUES (
            original_id, substituted_id, geo_id, 320, 48.00
        );
    END IF;
    
    -- Alaska to Bear Brand
    SELECT id INTO original_id FROM organization WHERE sku = 'ALASKA-EVAP-410ML';
    SELECT id INTO substituted_id FROM organization WHERE sku = 'BEAR-BRAND-300ML';
    
    IF original_id IS NOT NULL AND substituted_id IS NOT NULL THEN
        INSERT INTO substitution_patterns (
            original_product_id, substituted_product_id, geography_id, 
            substitution_count, acceptance_rate
        ) VALUES (
            original_id, substituted_id, geo_id, 280, 42.00
        );
    END IF;
    
    -- Surf to Tide
    SELECT id INTO original_id FROM organization WHERE sku = 'SURF-POWDER-1KG';
    SELECT id INTO substituted_id FROM organization WHERE sku = 'TIDE-POWDER-1KG';
    
    IF original_id IS NOT NULL AND substituted_id IS NOT NULL THEN
        INSERT INTO substitution_patterns (
            original_product_id, substituted_product_id, geography_id, 
            substitution_count, acceptance_rate
        ) VALUES (
            original_id, substituted_id, geo_id, 200, 45.00
        );
    END IF;
END $$;