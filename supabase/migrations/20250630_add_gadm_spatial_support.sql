-- Add GADM Spatial Support with PostGIS
-- This migration adds support for GADM (Global Administrative Areas) shapefiles
-- and spatial data for Philippine administrative boundaries

-- Enable PostGIS extension for spatial support
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- Create GADM administrative boundaries table
CREATE TABLE IF NOT EXISTS public.gadm_boundaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gadm_level INTEGER NOT NULL CHECK (gadm_level BETWEEN 0 AND 4), -- 0=Country, 1=Region, 2=Province, 3=City/Municipality, 4=Barangay
  gadm_code VARCHAR(50) UNIQUE NOT NULL,
  gadm_id VARCHAR(100),
  parent_code VARCHAR(50),
  country_code VARCHAR(3) DEFAULT 'PHL',
  country_name VARCHAR(100) DEFAULT 'Philippines',
  region_code VARCHAR(10),
  region_name VARCHAR(100),
  province_code VARCHAR(10),
  province_name VARCHAR(100),
  city_code VARCHAR(10),
  city_name VARCHAR(100),
  barangay_code VARCHAR(10),
  barangay_name VARCHAR(100),
  name_0 VARCHAR(100), -- Country name
  name_1 VARCHAR(100), -- Region name
  name_2 VARCHAR(100), -- Province name
  name_3 VARCHAR(100), -- City/Municipality name
  name_4 VARCHAR(100), -- Barangay name
  varname VARCHAR(255), -- Alternative names
  type_1 VARCHAR(50), -- Administrative type (Region, ARMM, etc.)
  type_2 VARCHAR(50), -- Administrative type (Province, HUC, etc.)
  type_3 VARCHAR(50), -- Administrative type (City, Municipality)
  type_4 VARCHAR(50), -- Administrative type (Barangay)
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL, -- WGS84 coordinate system
  simplified_geometry GEOMETRY(MultiPolygon, 4326), -- Simplified version for faster rendering
  bbox_geometry GEOMETRY(Polygon, 4326), -- Bounding box
  center_point GEOMETRY(Point, 4326), -- Centroid
  area_sqkm DECIMAL(12,2),
  perimeter_km DECIMAL(12,2),
  population INTEGER,
  population_year INTEGER,
  household_count INTEGER,
  poverty_incidence DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create spatial indexes for efficient querying
CREATE INDEX idx_gadm_boundaries_geometry ON public.gadm_boundaries USING GIST (geometry);
CREATE INDEX idx_gadm_boundaries_simplified ON public.gadm_boundaries USING GIST (simplified_geometry);
CREATE INDEX idx_gadm_boundaries_center ON public.gadm_boundaries USING GIST (center_point);
CREATE INDEX idx_gadm_boundaries_bbox ON public.gadm_boundaries USING GIST (bbox_geometry);
CREATE INDEX idx_gadm_boundaries_level ON public.gadm_boundaries(gadm_level);
CREATE INDEX idx_gadm_boundaries_codes ON public.gadm_boundaries(region_code, province_code, city_code, barangay_code);
CREATE INDEX idx_gadm_boundaries_names ON public.gadm_boundaries(region_name, province_name, city_name, barangay_name);

-- Add spatial reference to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS location_point GEOMETRY(Point, 4326),
ADD COLUMN IF NOT EXISTS gadm_region_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS gadm_province_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS gadm_city_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS gadm_barangay_code VARCHAR(10);

-- Update stores location_point from latitude/longitude
UPDATE public.stores 
SET location_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create spatial index on stores
CREATE INDEX IF NOT EXISTS idx_stores_location ON public.stores USING GIST (location_point);

-- Create function to find which administrative area contains a point
CREATE OR REPLACE FUNCTION public.find_gadm_boundaries(
  point_geom GEOMETRY,
  admin_level INTEGER DEFAULT NULL
)
RETURNS TABLE (
  gadm_level INTEGER,
  gadm_code VARCHAR(50),
  name VARCHAR(100),
  type VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.gadm_level,
    g.gadm_code,
    CASE g.gadm_level
      WHEN 0 THEN g.name_0
      WHEN 1 THEN g.name_1
      WHEN 2 THEN g.name_2
      WHEN 3 THEN g.name_3
      WHEN 4 THEN g.name_4
    END as name,
    CASE g.gadm_level
      WHEN 1 THEN g.type_1
      WHEN 2 THEN g.type_2
      WHEN 3 THEN g.type_3
      WHEN 4 THEN g.type_4
    END as type
  FROM public.gadm_boundaries g
  WHERE ST_Contains(g.geometry, point_geom)
    AND (admin_level IS NULL OR g.gadm_level = admin_level)
  ORDER BY g.gadm_level;
END;
$$ LANGUAGE plpgsql;

-- Create function to update store GADM codes based on coordinates
CREATE OR REPLACE FUNCTION public.update_store_gadm_codes()
RETURNS void AS $$
DECLARE
  store_record RECORD;
  boundary_record RECORD;
BEGIN
  FOR store_record IN 
    SELECT id, location_point 
    FROM public.stores 
    WHERE location_point IS NOT NULL
  LOOP
    -- Find region (level 1)
    SELECT gadm_code INTO boundary_record
    FROM public.gadm_boundaries
    WHERE gadm_level = 1 
      AND ST_Contains(geometry, store_record.location_point)
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE public.stores 
      SET gadm_region_code = boundary_record.gadm_code
      WHERE id = store_record.id;
    END IF;
    
    -- Find province (level 2)
    SELECT gadm_code INTO boundary_record
    FROM public.gadm_boundaries
    WHERE gadm_level = 2 
      AND ST_Contains(geometry, store_record.location_point)
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE public.stores 
      SET gadm_province_code = boundary_record.gadm_code
      WHERE id = store_record.id;
    END IF;
    
    -- Find city/municipality (level 3)
    SELECT gadm_code INTO boundary_record
    FROM public.gadm_boundaries
    WHERE gadm_level = 3 
      AND ST_Contains(geometry, store_record.location_point)
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE public.stores 
      SET gadm_city_code = boundary_record.gadm_code
      WHERE id = store_record.id;
    END IF;
    
    -- Find barangay (level 4)
    SELECT gadm_code INTO boundary_record
    FROM public.gadm_boundaries
    WHERE gadm_level = 4 
      AND ST_Contains(geometry, store_record.location_point)
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE public.stores 
      SET gadm_barangay_code = boundary_record.gadm_code
      WHERE id = store_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for store locations with full GADM hierarchy
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_stores_gadm_hierarchy AS
SELECT 
  s.id,
  s.store_code,
  s.store_name,
  s.latitude,
  s.longitude,
  s.location_point,
  -- Region info
  gr.gadm_code as region_gadm_code,
  gr.name_1 as region_name,
  gr.type_1 as region_type,
  gr.area_sqkm as region_area_sqkm,
  gr.population as region_population,
  -- Province info
  gp.gadm_code as province_gadm_code,
  gp.name_2 as province_name,
  gp.type_2 as province_type,
  gp.area_sqkm as province_area_sqkm,
  gp.population as province_population,
  -- City info
  gc.gadm_code as city_gadm_code,
  gc.name_3 as city_name,
  gc.type_3 as city_type,
  gc.area_sqkm as city_area_sqkm,
  gc.population as city_population,
  -- Barangay info
  gb.gadm_code as barangay_gadm_code,
  gb.name_4 as barangay_name,
  gb.type_4 as barangay_type,
  gb.area_sqkm as barangay_area_sqkm,
  gb.population as barangay_population
FROM public.stores s
LEFT JOIN public.gadm_boundaries gr ON s.gadm_region_code = gr.gadm_code AND gr.gadm_level = 1
LEFT JOIN public.gadm_boundaries gp ON s.gadm_province_code = gp.gadm_code AND gp.gadm_level = 2
LEFT JOIN public.gadm_boundaries gc ON s.gadm_city_code = gc.gadm_code AND gc.gadm_level = 3
LEFT JOIN public.gadm_boundaries gb ON s.gadm_barangay_code = gb.gadm_code AND gb.gadm_level = 4;

-- Create spatial analysis functions

-- Function to calculate distance between two stores
CREATE OR REPLACE FUNCTION public.calculate_store_distance(
  store_id_1 UUID,
  store_id_2 UUID,
  unit VARCHAR DEFAULT 'km'
)
RETURNS DECIMAL AS $$
DECLARE
  distance_meters DECIMAL;
BEGIN
  SELECT ST_Distance(
    s1.location_point::geography,
    s2.location_point::geography
  ) INTO distance_meters
  FROM public.stores s1, public.stores s2
  WHERE s1.id = store_id_1 AND s2.id = store_id_2;
  
  CASE unit
    WHEN 'km' THEN RETURN distance_meters / 1000;
    WHEN 'm' THEN RETURN distance_meters;
    WHEN 'mi' THEN RETURN distance_meters / 1609.344;
    ELSE RETURN distance_meters / 1000; -- Default to km
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to find stores within a radius
CREATE OR REPLACE FUNCTION public.find_stores_within_radius(
  center_lat DECIMAL,
  center_lon DECIMAL,
  radius_km DECIMAL
)
RETURNS TABLE (
  store_id UUID,
  store_code VARCHAR(50),
  store_name VARCHAR(255),
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.store_code,
    s.store_name,
    ST_Distance(
      s.location_point::geography,
      ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography
    ) / 1000 as distance_km
  FROM public.stores s
  WHERE ST_DWithin(
    s.location_point::geography,
    ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate sales by GADM boundary
CREATE OR REPLACE FUNCTION public.aggregate_sales_by_boundary(
  gadm_level_param INTEGER,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  gadm_code VARCHAR(50),
  boundary_name VARCHAR(100),
  total_sales DECIMAL,
  transaction_count BIGINT,
  store_count BIGINT,
  avg_transaction_value DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.gadm_code,
    CASE gadm_level_param
      WHEN 1 THEN g.name_1
      WHEN 2 THEN g.name_2
      WHEN 3 THEN g.name_3
      WHEN 4 THEN g.name_4
    END as boundary_name,
    COALESCE(SUM(t.total_amount), 0) as total_sales,
    COUNT(DISTINCT t.id) as transaction_count,
    COUNT(DISTINCT s.id) as store_count,
    CASE 
      WHEN COUNT(t.id) > 0 THEN SUM(t.total_amount) / COUNT(t.id)
      ELSE 0
    END as avg_transaction_value
  FROM public.gadm_boundaries g
  LEFT JOIN public.stores s ON 
    CASE gadm_level_param
      WHEN 1 THEN s.gadm_region_code = g.gadm_code
      WHEN 2 THEN s.gadm_province_code = g.gadm_code
      WHEN 3 THEN s.gadm_city_code = g.gadm_code
      WHEN 4 THEN s.gadm_barangay_code = g.gadm_code
    END
  LEFT JOIN public.transactions t ON s.id = t.store_id
    AND t.transaction_date BETWEEN start_date AND end_date
    AND t.status = 'completed'
  WHERE g.gadm_level = gadm_level_param
  GROUP BY g.gadm_code, boundary_name
  ORDER BY total_sales DESC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_stores_gadm_region ON public.stores(gadm_region_code);
CREATE INDEX IF NOT EXISTS idx_stores_gadm_province ON public.stores(gadm_province_code);
CREATE INDEX IF NOT EXISTS idx_stores_gadm_city ON public.stores(gadm_city_code);
CREATE INDEX IF NOT EXISTS idx_stores_gadm_barangay ON public.stores(gadm_barangay_code);

-- Grant permissions
GRANT SELECT ON public.gadm_boundaries TO authenticated;
GRANT SELECT ON public.mv_stores_gadm_hierarchy TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_gadm_boundaries TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_store_gadm_codes TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_store_distance TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_stores_within_radius TO authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_sales_by_boundary TO authenticated;

-- Enable RLS
ALTER TABLE public.gadm_boundaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
CREATE POLICY "Enable read access for all users" ON public.gadm_boundaries 
  FOR SELECT USING (true);

-- Add comments
COMMENT ON TABLE public.gadm_boundaries IS 'GADM administrative boundaries for the Philippines with full hierarchy';
COMMENT ON COLUMN public.gadm_boundaries.gadm_level IS '0=Country, 1=Region, 2=Province, 3=City/Municipality, 4=Barangay';
COMMENT ON COLUMN public.gadm_boundaries.geometry IS 'Full resolution MultiPolygon geometry in WGS84';
COMMENT ON COLUMN public.gadm_boundaries.simplified_geometry IS 'Simplified geometry for faster rendering at lower zoom levels';
COMMENT ON COLUMN public.gadm_boundaries.center_point IS 'Centroid point for label placement';

-- Note: Actual GADM data needs to be imported separately using tools like:
-- ogr2ogr, shp2pgsql, or QGIS
-- Example import command:
-- shp2pgsql -s 4326 -g geometry -I gadm41_PHL_1.shp public.gadm_boundaries | psql -d your_database