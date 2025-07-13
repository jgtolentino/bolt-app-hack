# Location Dimension Builder for Philippine Analytics

This script builds a comprehensive PostGIS-enabled master location dimension table with barangay-level geographic data for the Philippines.

## Features

### 🌏 Geographic Hierarchy
- **Country** → **Region** → **Province** → **City/Municipality** → **Barangay**
- Full administrative boundaries with PostGIS geometries
- Centroids for quick point-based queries
- Area and perimeter calculations

### 📊 Retail & Economic Metrics
- Sari-sari store density per sq km
- Convenience store counts
- Internet penetration rates
- Electricity access percentages
- Economic class indicators
- Urban/coastal flags

### 🔍 Spatial Capabilities
- Point-in-polygon queries to find locations
- Nearby location searches with distance
- Spatial indexes for fast queries
- Helper functions for common operations

## Prerequisites

1. **Supabase Account** with PostGIS enabled
2. **Node.js 18+** installed
3. **PostgreSQL client** (pg npm package)

## Setup

1. **Install dependencies:**
   ```bash
   npm install node-fetch pg
   ```

2. **Configure database connection:**
   ```bash
   export SUPABASE_HOST="your-project.supabase.co"
   export SUPABASE_DB="postgres"
   export SUPABASE_USER="postgres"
   export SUPABASE_PASSWORD="your-password"
   export SUPABASE_PORT="5432"
   ```

3. **Download Philippine GeoJSON data (optional):**
   ```bash
   # The script will auto-download if not present
   mkdir -p data
   wget -O data/philippines_adm3.geojson https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/geojson/philippines.json
   ```

## Usage

Run the location dimension builder:

```bash
node scripts/buildLocationDimension.js
```

The script will:
1. Connect to your Supabase database
2. Enable PostGIS extensions
3. Create location dimension tables
4. Import GeoJSON data
5. Process hierarchical relationships
6. Add retail and economic metrics
7. Create spatial indexes
8. Generate helper functions
9. Export data to CSV

## Database Schema

### Main Table: `location_dimension`

```sql
CREATE TABLE location_dimension (
  location_id SERIAL PRIMARY KEY,
  
  -- Hierarchical identifiers
  country_code VARCHAR(2) DEFAULT 'PH',
  region_code VARCHAR(10),
  region_name VARCHAR(100),
  province_code VARCHAR(10),
  province_name VARCHAR(100),
  city_municipality_code VARCHAR(10),
  city_municipality_name VARCHAR(100),
  barangay_code VARCHAR(20),
  barangay_name VARCHAR(100),
  
  -- Geographic data
  geometry GEOMETRY(MultiPolygon, 4326),
  centroid GEOMETRY(Point, 4326),
  bbox BOX2D,
  area_sqkm DECIMAL(10,2),
  perimeter_km DECIMAL(10,2),
  
  -- Administrative metadata
  admin_level INTEGER,
  island_group VARCHAR(50),
  is_urban BOOLEAN DEFAULT FALSE,
  is_coastal BOOLEAN DEFAULT FALSE,
  
  -- Retail metrics
  sari_sari_density DECIMAL(8,2),
  convenience_store_count INTEGER,
  supermarket_count INTEGER,
  
  -- Infrastructure
  internet_penetration DECIMAL(5,2),
  electricity_access DECIMAL(5,2)
);
```

## Helper Functions

### Get location by coordinates
```sql
SELECT * FROM get_location_by_coordinates(14.5995, 120.9842);
-- Returns: location_id, barangay, city, province, region
```

### Find nearby locations
```sql
SELECT * FROM get_nearby_locations(14.5995, 120.9842, 5.0);
-- Returns locations within 5km radius with distances
```

## Integration with MCP Services

### 1. Scout Dashboard
```javascript
// Find store location
const location = await supabase.rpc('get_location_by_coordinates', {
  lat: storeLatitude,
  lng: storeLongitude
});
```

### 2. Transaction Enrichment
```javascript
// Enrich transaction with location data
const enriched = await supabase
  .from('transactions')
  .update({ 
    location_id: location.location_id,
    is_urban: location.is_urban 
  })
  .eq('id', transactionId);
```

### 3. Regional Analytics
```javascript
// Aggregate by region
const regionalStats = await supabase
  .from('location_dimension')
  .select('region_name, sum(sari_sari_density * area_sqkm)')
  .eq('admin_level', 1)
  .group('region_name');
```

## Sample Queries

### Urban vs Rural Analysis
```sql
SELECT 
  is_urban,
  COUNT(*) as barangay_count,
  AVG(sari_sari_density) as avg_store_density,
  AVG(internet_penetration) as avg_internet
FROM location_dimension
WHERE admin_level = 4  -- Barangay level
GROUP BY is_urban;
```

### Top Cities by Store Density
```sql
SELECT 
  city_municipality_name,
  province_name,
  AVG(sari_sari_density) as avg_density,
  SUM(convenience_store_count) as total_convenience
FROM location_dimension
WHERE admin_level = 3
GROUP BY city_municipality_name, province_name
ORDER BY avg_density DESC
LIMIT 20;
```

### Find Coastal Barangays
```sql
SELECT 
  barangay_name,
  city_municipality_name,
  sari_sari_density
FROM location_dimension
WHERE is_coastal = TRUE
  AND admin_level = 4
ORDER BY sari_sari_density DESC;
```

## Output Files

1. **Database Tables:**
   - `location_dimension` - Main dimension table
   - `raw_geojson_import` - Raw import data

2. **CSV Export:**
   - `data/location_dimension.csv` - All locations with coordinates

3. **Summary Report:**
   - Console output with statistics
   - Sample barangay records
   - Total area coverage

## Performance Tips

1. **Use spatial indexes** - Already created for geometry columns
2. **Query by admin_level** - Filter hierarchical data efficiently
3. **Use centroids for distance** - Faster than full polygon calculations
4. **Cache frequently used regions** - Reduce database calls

## Troubleshooting

### PostGIS not enabled
```sql
-- Run manually in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Import fails with large GeoJSON
- Split into smaller files by region
- Use streaming import for large datasets
- Increase Node.js memory: `node --max-old-space-size=4096`

### Slow spatial queries
- Ensure indexes exist: `\di location_*`
- Use `ST_SimplifyPreserveTopology` for complex geometries
- Consider materialized views for common aggregations

## Next Steps

1. **Add demographic data** from PSA census
2. **Import road networks** for accessibility analysis
3. **Add weather stations** for climate correlation
4. **Create region-specific views** for faster queries
5. **Build location API** for MCP services

## References

- [PostGIS Documentation](https://postgis.net/docs/)
- [Philippine Standard Geographic Code](https://psa.gov.ph/classification/psgc/)
- [Supabase PostGIS Guide](https://supabase.com/docs/guides/database/extensions/postgis)