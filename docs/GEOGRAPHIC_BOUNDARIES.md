# Geographic Boundaries Implementation

## Overview

We've enhanced the database with proper geographic hierarchy tables that include polygon boundaries from GADM (Global Administrative Areas Database). This enables powerful spatial analytics and accurate geographic visualizations.

## Database Structure

### New Tables with Polygon Boundaries

1. **`regions`** - Philippine regions with GADM Level 1 boundaries
   - `boundary_polygon` - GeoJSON MultiPolygon
   - `geometry` - PostGIS geometry for spatial queries
   - `center_lat/lng` - Calculated centroid
   - `area_sq_km` - Calculated area

2. **`provinces`** - Philippine provinces with GADM Level 2 boundaries
   - Links to parent region
   - Full polygon boundaries

3. **`cities`** - Cities/municipalities with GADM Level 3 boundaries
   - Links to province and region
   - Includes city classification
   - Population data (when available)

4. **`barangays`** - Barangay structure (polygons from PSGC when available)
   - Prepared for future boundary data

### Enhanced Stores Table

The `stores` table now includes:
- `region_id` - Foreign key to regions table
- `province_id` - Foreign key to provinces table  
- `city_id` - Foreign key to cities table
- `barangay_id` - Foreign key to barangays table
- `location_point` - PostGIS point geometry

## Key Features

### 1. Spatial Queries

Find which administrative area contains a point:
```sql
SELECT * FROM find_location_hierarchy(14.5995, 120.9842);
-- Returns: region_id, province_id, city_id for that coordinate
```

Find all stores within a boundary:
```sql
SELECT * FROM get_stores_in_boundary('region', 'region-uuid-here');
-- Returns all stores within that region's polygon
```

### 2. Automatic Geometry Updates

When you insert/update a `boundary_polygon` (GeoJSON), triggers automatically:
- Convert to PostGIS geometry
- Calculate center point
- Calculate area in km²

### 3. Spatial Indexes

GIST indexes on all geometry columns for fast:
- Point-in-polygon queries
- Intersection queries
- Distance calculations

## Data Sources

- **Regions** - GADM Level 1 (gadm41_PHL_1.json)
- **Provinces** - GADM Level 2 (gadm41_PHL_2.json) 
- **Cities** - GADM Level 3 (gadm41_PHL_3.json)
- **Barangays** - PSGC/PSA data (future enhancement)

## Import Process

1. **Run the migration**:
```bash
supabase db push supabase/migrations/20250701_add_geographic_boundaries.sql
```

2. **Import GADM data**:
```bash
node scripts/import-gadm-to-database.js
```

## Usage Examples

### Map Visualization

The PhilippinesMap component can now:
- Display accurate administrative boundaries
- Show stores within selected polygons
- Calculate metrics by geographic area

### Analytics Queries

```sql
-- Sales by region with area normalization
SELECT 
    r.region_name,
    r.area_sq_km,
    COUNT(DISTINCT s.id) as store_count,
    SUM(t.total_amount) as total_sales,
    SUM(t.total_amount) / r.area_sq_km as sales_per_sq_km
FROM regions r
JOIN stores s ON s.region_id = r.id
JOIN transactions t ON t.store_id = s.id
GROUP BY r.id, r.region_name, r.area_sq_km;

-- Find stores near a coordinate
SELECT 
    s.*,
    ST_Distance(s.location_point::geography, ST_MakePoint(121.0, 14.6)::geography) / 1000 as distance_km
FROM stores s
WHERE ST_DWithin(
    s.location_point::geography,
    ST_MakePoint(121.0, 14.6)::geography,
    10000  -- 10km radius
)
ORDER BY distance_km;
```

## Benefits

1. **Accurate Geography** - Real polygon boundaries, not just points
2. **Performance** - Spatial indexes for fast queries
3. **Flexibility** - Support any geographic aggregation
4. **Future-Proof** - Ready for barangay-level data
5. **Standards-Based** - Uses PostGIS and GeoJSON standards

## Next Steps

1. Import barangay boundaries when available from PSGC
2. Add demographic data to geographic tables
3. Create heat map visualizations using boundaries
4. Implement territory management features
5. Add routing/distance calculations between stores