/*
  # Add Store Size Dimension
  
  This migration adds a store size classification to better categorize sari-sari stores
  and other store types based on their operational scale.
*/

-- Add store_size column to geography table
ALTER TABLE geography 
ADD COLUMN IF NOT EXISTS store_size TEXT;

-- Update existing stores with size classifications based on population served and typical characteristics
UPDATE geography 
SET store_size = 
  CASE 
    WHEN store_type = 'sari-sari' THEN
      CASE 
        WHEN population > 100000 THEN 'Extra Large'
        WHEN population > 60000 THEN 'Large'
        WHEN population > 30000 THEN 'Medium'
        WHEN population > 10000 THEN 'Small'
        ELSE 'Micro'
      END
    WHEN store_type = 'grocery' THEN 'Large'
    WHEN store_type = 'mini-mart' THEN 'Medium'
    WHEN store_type = 'convenience' THEN 'Small'
    ELSE 'Medium'
  END;

-- Add constraint to ensure store_size is not null
ALTER TABLE geography 
ALTER COLUMN store_size SET NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_geography_store_size ON geography(store_size);
CREATE INDEX IF NOT EXISTS idx_geography_store_type_size ON geography(store_type, store_size);

-- Create a view to show store distribution by type and size
CREATE OR REPLACE VIEW v_store_distribution AS
SELECT 
    store_type,
    store_size,
    COUNT(*) as store_count,
    COUNT(DISTINCT region) as regions_covered,
    COUNT(DISTINCT city_municipality) as cities_covered,
    AVG(population) as avg_population_served,
    AVG(area_sqkm) as avg_area_coverage
FROM geography
GROUP BY store_type, store_size
ORDER BY store_type, 
  CASE store_size
    WHEN 'Micro' THEN 1
    WHEN 'Small' THEN 2
    WHEN 'Medium' THEN 3
    WHEN 'Large' THEN 4
    WHEN 'Extra Large' THEN 5
  END;

-- Create a view for sari-sari store analysis
CREATE OR REPLACE VIEW v_sari_sari_analysis AS
SELECT 
    g.store_name,
    g.region,
    g.city_municipality,
    g.barangay,
    g.store_size,
    g.population,
    g.area_sqkm,
    COUNT(t.id) as transaction_count,
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COALESCE(AVG(t.total_amount), 0) as avg_transaction_value,
    COALESCE(SUM(t.quantity), 0) as total_items_sold
FROM geography g
LEFT JOIN transactions t ON g.id = t.geography_id
WHERE g.store_type = 'sari-sari'
GROUP BY g.id, g.store_name, g.region, g.city_municipality, g.barangay, 
         g.store_size, g.population, g.area_sqkm
ORDER BY total_sales DESC;

-- Grant permissions
GRANT SELECT ON v_store_distribution TO authenticated, anon;
GRANT SELECT ON v_sari_sari_analysis TO authenticated, anon;

-- Add comments
COMMENT ON COLUMN geography.store_size IS 'Size classification of the store (Micro, Small, Medium, Large, Extra Large)';
COMMENT ON VIEW v_store_distribution IS 'Distribution of stores by type and size classification';
COMMENT ON VIEW v_sari_sari_analysis IS 'Detailed analysis of sari-sari stores with size classification';