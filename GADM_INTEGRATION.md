# GADM Integration Guide

This guide explains how to integrate GADM (Global Administrative Areas) spatial data into the POS Analytics System for advanced geographic analysis.

## Overview

GADM provides high-quality administrative boundary data for countries worldwide. For the Philippines, this includes:

- **Level 0**: Country boundary
- **Level 1**: Regions (17 regions)
- **Level 2**: Provinces (81 provinces)
- **Level 3**: Cities/Municipalities (1,647 cities/municipalities)
- **Level 4**: Barangays (42,036 barangays)

## Prerequisites

1. **PostGIS Extension**: Spatial data support in PostgreSQL
2. **GDAL Tools**: For importing shapefiles (`ogr2ogr`)
3. **Database Access**: Superuser or appropriate permissions

## Installation Steps

### 1. Apply the Migration

```bash
# Run the GADM spatial support migration
supabase db push supabase/migrations/20250630_add_gadm_spatial_support.sql
```

This migration:
- Enables PostGIS extensions
- Creates `gadm_boundaries` table for administrative polygons
- Adds spatial columns to `stores` table
- Creates spatial indexes for performance
- Adds helper functions for spatial queries

### 2. Download and Import GADM Data

Use the provided import script:

```bash
# Set your database credentials
export DB_HOST="db.your-project.supabase.co"
export DB_PORT="5432"
export DB_NAME="postgres"
export DB_USER="postgres"
export DB_PASS="your-password"

# Run the import script
./scripts/import_gadm_data.sh
```

The script will:
1. Download GADM shapefiles for Philippines
2. Import each administrative level
3. Transform data to match our schema
4. Update store locations with GADM codes
5. Create spatial analysis views

### 3. Manual Import (Alternative)

If you prefer manual import or have custom GADM data:

```bash
# Download GADM data
wget https://geodata.ucdavis.edu/gadm/gadm4.1/shp/gadm41_PHL_shp.zip
unzip gadm41_PHL_shp.zip

# Import each level using ogr2ogr
ogr2ogr -f "PostgreSQL" \
  PG:"host=localhost dbname=your_db user=postgres" \
  gadm41_PHL_1.shp \
  -nln gadm_boundaries \
  -nlt MULTIPOLYGON \
  -t_srs EPSG:4326 \
  -lco GEOMETRY_NAME=geometry
```

## Using Spatial Features

### 1. Find Administrative Area for a Point

```sql
-- Find which barangay, city, province, and region a store belongs to
SELECT * FROM public.find_gadm_boundaries(
  ST_SetSRID(ST_MakePoint(121.0244, 14.5547), 4326)
);
```

### 2. Calculate Distance Between Stores

```sql
-- Get distance in kilometers
SELECT public.calculate_store_distance(
  'store_uuid_1', 
  'store_uuid_2', 
  'km'
);
```

### 3. Find Nearby Stores

```sql
-- Find all stores within 5km of a location
SELECT * FROM public.find_stores_within_radius(
  14.5547,  -- latitude
  121.0244, -- longitude
  5.0       -- radius in km
);
```

### 4. Aggregate Sales by Region

```sql
-- Get total sales by region for last 30 days
SELECT * FROM public.aggregate_sales_by_boundary(
  1, -- gadm_level (1 = regions)
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

### 5. Spatial Queries

```sql
-- Get all stores in Metro Manila
SELECT s.* 
FROM stores s
JOIN gadm_boundaries g ON ST_Contains(g.geometry, s.location_point)
WHERE g.gadm_level = 1 
  AND g.name_1 = 'National Capital Region';

-- Count stores per province
SELECT 
  g.name_2 as province,
  COUNT(s.id) as store_count
FROM gadm_boundaries g
LEFT JOIN stores s ON ST_Contains(g.geometry, s.location_point)
WHERE g.gadm_level = 2
GROUP BY g.name_2
ORDER BY store_count DESC;
```

## Frontend Integration

### Using with Mapbox/Leaflet

```typescript
// Fetch regional sales data with boundaries
const regionalSales = await supabase
  .from('v_regional_sales_heatmap')
  .select('*');

// Convert to GeoJSON for map display
const geoJson = {
  type: 'FeatureCollection',
  features: regionalSales.data.map(region => ({
    type: 'Feature',
    geometry: region.geometry,
    properties: {
      name: region.region_name,
      sales: region.total_sales,
      stores: region.store_count
    }
  }))
};
```

### Store Clustering Analysis

```typescript
// Get store clusters for optimization
const clusters = await supabase
  .from('v_store_clusters')
  .select('*')
  .order('nearby_stores_1km', { ascending: false });
```

## Maintenance

### Updating GADM Data

GADM releases updates periodically. To update:

1. Download new GADM version
2. Clear existing boundaries: `TRUNCATE public.gadm_boundaries CASCADE;`
3. Re-run import process
4. Update store GADM codes: `SELECT public.update_store_gadm_codes();`

### Performance Optimization

1. **Use Simplified Geometries**: For visualization at lower zoom levels
2. **Spatial Indexes**: Already created, but monitor usage
3. **Materialized Views**: Refresh periodically for aggregated data

```sql
-- Refresh spatial analysis views
REFRESH MATERIALIZED VIEW public.mv_stores_gadm_hierarchy;
```

## Troubleshooting

### Common Issues

1. **PostGIS not installed**
   ```sql
   CREATE EXTENSION postgis;
   ```

2. **Import fails with projection errors**
   - Ensure source data is in WGS84 (EPSG:4326)
   - Use `-t_srs EPSG:4326` flag in ogr2ogr

3. **Slow spatial queries**
   - Check spatial indexes exist
   - Use `EXPLAIN ANALYZE` to optimize
   - Consider using simplified geometries

4. **Store locations not matching boundaries**
   - Verify latitude/longitude accuracy
   - Check coordinate order (lon, lat for PostGIS)
   - Run `UPDATE stores SET location_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);`

## Advanced Features

### Custom Boundaries

Add your own administrative or sales territories:

```sql
INSERT INTO gadm_boundaries (
  gadm_level, gadm_code, name_1, geometry
) VALUES (
  1, 'CUSTOM_NCR_NORTH', 'NCR North District',
  ST_GeomFromText('POLYGON((...))', 4326)
);
```

### Spatial Analytics

1. **Market Coverage**: Analyze underserved areas
2. **Delivery Zones**: Optimize logistics routes
3. **Competition Analysis**: Find store density patterns
4. **Demographics Integration**: Combine with population data

## Resources

- [GADM Website](https://gadm.org/)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Philippine Geographic Data](https://www.philgis.org/)
- [Spatial SQL Tutorial](https://postgis.net/workshops/postgis-intro/)