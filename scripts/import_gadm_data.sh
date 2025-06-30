#!/bin/bash

# GADM Data Import Script for Philippines
# This script helps import GADM shapefiles into PostgreSQL/Supabase

# Configuration
DB_HOST="${DB_HOST:-db.your-project.supabase.co}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS}"

# GADM version and country code
GADM_VERSION="4.1"
COUNTRY_CODE="PHL"
GADM_BASE_URL="https://geodata.ucdavis.edu/gadm/gadm${GADM_VERSION}/shp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}GADM Data Import Script for Philippines${NC}"
echo "======================================="

# Check required tools
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    # Check for wget or curl
    if ! command -v wget &> /dev/null && ! command -v curl &> /dev/null; then
        echo -e "${RED}Error: wget or curl is required but not installed.${NC}"
        exit 1
    fi
    
    # Check for unzip
    if ! command -v unzip &> /dev/null; then
        echo -e "${RED}Error: unzip is required but not installed.${NC}"
        exit 1
    fi
    
    # Check for ogr2ogr (GDAL)
    if ! command -v ogr2ogr &> /dev/null; then
        echo -e "${RED}Error: ogr2ogr (GDAL) is required but not installed.${NC}"
        echo "Install with: brew install gdal (macOS) or apt-get install gdal-bin (Ubuntu)"
        exit 1
    fi
    
    echo -e "${GREEN}All requirements met!${NC}"
}

# Download GADM data
download_gadm_data() {
    echo -e "${YELLOW}Downloading GADM data for Philippines...${NC}"
    
    mkdir -p gadm_data
    cd gadm_data
    
    # GADM provides data at different administrative levels
    # Level 0: Country
    # Level 1: Regions
    # Level 2: Provinces
    # Level 3: Cities/Municipalities
    # Level 4: Barangays (if available)
    
    GADM_FILE="gadm${GADM_VERSION}_${COUNTRY_CODE}_shp.zip"
    GADM_URL="${GADM_BASE_URL}/${GADM_FILE}"
    
    if [ -f "$GADM_FILE" ]; then
        echo "GADM data already downloaded."
    else
        echo "Downloading from: $GADM_URL"
        if command -v wget &> /dev/null; then
            wget "$GADM_URL" -O "$GADM_FILE"
        else
            curl -L "$GADM_URL" -o "$GADM_FILE"
        fi
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error downloading GADM data.${NC}"
            exit 1
        fi
    fi
    
    # Extract files
    echo "Extracting shapefiles..."
    unzip -o "$GADM_FILE"
    
    cd ..
    echo -e "${GREEN}Download complete!${NC}"
}

# Import data to PostgreSQL
import_to_postgres() {
    echo -e "${YELLOW}Importing GADM data to PostgreSQL...${NC}"
    
    # Connection string
    PG_CONN="host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASS"
    
    cd gadm_data
    
    # Import each administrative level
    for level in 0 1 2 3 4; do
        SHAPEFILE="gadm${GADM_VERSION}_${COUNTRY_CODE}_${level}.shp"
        
        if [ -f "$SHAPEFILE" ]; then
            echo -e "${YELLOW}Importing Level $level: $SHAPEFILE${NC}"
            
            # Prepare the data and import
            ogr2ogr -f "PostgreSQL" \
                PG:"$PG_CONN" \
                "$SHAPEFILE" \
                -nln temp_gadm_level_${level} \
                -nlt MULTIPOLYGON \
                -t_srs EPSG:4326 \
                -lco GEOMETRY_NAME=geometry \
                -lco FID=ogc_fid \
                -lco PRECISION=NO \
                -overwrite \
                -progress
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}Level $level imported successfully!${NC}"
                
                # Transform and insert into our gadm_boundaries table
                echo "Transforming data for level $level..."
                
                case $level in
                    0)
                        SQL_TRANSFORM="
                        INSERT INTO public.gadm_boundaries (
                            gadm_level, gadm_code, gadm_id, name_0, country_code, 
                            geometry, simplified_geometry, center_point, area_sqkm
                        )
                        SELECT 
                            0, 
                            'PHL', 
                            GID_0,
                            NAME_0,
                            'PHL',
                            geometry,
                            ST_SimplifyPreserveTopology(geometry, 0.01),
                            ST_Centroid(geometry),
                            ST_Area(geometry::geography) / 1000000
                        FROM temp_gadm_level_0
                        ON CONFLICT (gadm_code) DO NOTHING;"
                        ;;
                    1)
                        SQL_TRANSFORM="
                        INSERT INTO public.gadm_boundaries (
                            gadm_level, gadm_code, gadm_id, parent_code,
                            name_0, name_1, type_1, region_name, varname,
                            geometry, simplified_geometry, center_point, area_sqkm
                        )
                        SELECT 
                            1, 
                            GID_1, 
                            GID_1,
                            'PHL',
                            NAME_0,
                            NAME_1,
                            TYPE_1,
                            NAME_1,
                            VARNAME_1,
                            geometry,
                            ST_SimplifyPreserveTopology(geometry, 0.01),
                            ST_Centroid(geometry),
                            ST_Area(geometry::geography) / 1000000
                        FROM temp_gadm_level_1
                        ON CONFLICT (gadm_code) DO NOTHING;"
                        ;;
                    2)
                        SQL_TRANSFORM="
                        INSERT INTO public.gadm_boundaries (
                            gadm_level, gadm_code, gadm_id, parent_code,
                            name_0, name_1, name_2, type_1, type_2,
                            region_name, province_name, varname,
                            geometry, simplified_geometry, center_point, area_sqkm
                        )
                        SELECT 
                            2, 
                            GID_2, 
                            GID_2,
                            GID_1,
                            NAME_0,
                            NAME_1,
                            NAME_2,
                            TYPE_1,
                            TYPE_2,
                            NAME_1,
                            NAME_2,
                            VARNAME_2,
                            geometry,
                            ST_SimplifyPreserveTopology(geometry, 0.005),
                            ST_Centroid(geometry),
                            ST_Area(geometry::geography) / 1000000
                        FROM temp_gadm_level_2
                        ON CONFLICT (gadm_code) DO NOTHING;"
                        ;;
                    3)
                        SQL_TRANSFORM="
                        INSERT INTO public.gadm_boundaries (
                            gadm_level, gadm_code, gadm_id, parent_code,
                            name_0, name_1, name_2, name_3, 
                            type_1, type_2, type_3,
                            region_name, province_name, city_name, varname,
                            geometry, simplified_geometry, center_point, area_sqkm
                        )
                        SELECT 
                            3, 
                            GID_3, 
                            GID_3,
                            GID_2,
                            NAME_0,
                            NAME_1,
                            NAME_2,
                            NAME_3,
                            TYPE_1,
                            TYPE_2,
                            TYPE_3,
                            NAME_1,
                            NAME_2,
                            NAME_3,
                            VARNAME_3,
                            geometry,
                            ST_SimplifyPreserveTopology(geometry, 0.001),
                            ST_Centroid(geometry),
                            ST_Area(geometry::geography) / 1000000
                        FROM temp_gadm_level_3
                        ON CONFLICT (gadm_code) DO NOTHING;"
                        ;;
                    4)
                        SQL_TRANSFORM="
                        INSERT INTO public.gadm_boundaries (
                            gadm_level, gadm_code, gadm_id, parent_code,
                            name_0, name_1, name_2, name_3, name_4,
                            type_1, type_2, type_3, type_4,
                            region_name, province_name, city_name, barangay_name, varname,
                            geometry, simplified_geometry, center_point, area_sqkm
                        )
                        SELECT 
                            4, 
                            GID_4, 
                            GID_4,
                            GID_3,
                            NAME_0,
                            NAME_1,
                            NAME_2,
                            NAME_3,
                            NAME_4,
                            TYPE_1,
                            TYPE_2,
                            TYPE_3,
                            TYPE_4,
                            NAME_1,
                            NAME_2,
                            NAME_3,
                            NAME_4,
                            VARNAME_4,
                            geometry,
                            ST_SimplifyPreserveTopology(geometry, 0.0001),
                            ST_Centroid(geometry),
                            ST_Area(geometry::geography) / 1000000
                        FROM temp_gadm_level_4
                        ON CONFLICT (gadm_code) DO NOTHING;"
                        ;;
                esac
                
                # Execute the transformation
                PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$SQL_TRANSFORM"
                
                # Clean up temporary table
                PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "DROP TABLE IF EXISTS temp_gadm_level_${level};"
                
            else
                echo -e "${RED}Error importing level $level${NC}"
            fi
        else
            echo -e "${YELLOW}Level $level shapefile not found, skipping...${NC}"
        fi
    done
    
    cd ..
}

# Update store locations with GADM codes
update_store_locations() {
    echo -e "${YELLOW}Updating store GADM codes...${NC}"
    
    SQL_UPDATE="
    -- Update stores with GADM boundary codes
    SELECT public.update_store_gadm_codes();
    
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW public.mv_stores_gadm_hierarchy;
    
    -- Show summary
    SELECT 
        COUNT(*) as total_stores,
        COUNT(gadm_region_code) as stores_with_region,
        COUNT(gadm_province_code) as stores_with_province,
        COUNT(gadm_city_code) as stores_with_city,
        COUNT(gadm_barangay_code) as stores_with_barangay
    FROM public.stores;"
    
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$SQL_UPDATE"
    
    echo -e "${GREEN}Store locations updated!${NC}"
}

# Create spatial visualizations
create_visualizations() {
    echo -e "${YELLOW}Creating spatial analysis views...${NC}"
    
    SQL_VIEWS="
    -- Create view for regional sales heatmap
    CREATE OR REPLACE VIEW public.v_regional_sales_heatmap AS
    SELECT 
        g.gadm_code,
        g.name_1 as region_name,
        g.simplified_geometry as geometry,
        COUNT(DISTINCT s.id) as store_count,
        COUNT(DISTINCT t.id) as transaction_count,
        COALESCE(SUM(t.total_amount), 0) as total_sales,
        COALESCE(AVG(t.total_amount), 0) as avg_transaction_value,
        g.population,
        CASE 
            WHEN g.population > 0 THEN COALESCE(SUM(t.total_amount), 0) / g.population
            ELSE 0
        END as sales_per_capita
    FROM public.gadm_boundaries g
    LEFT JOIN public.stores s ON s.gadm_region_code = g.gadm_code
    LEFT JOIN public.transactions t ON s.id = t.store_id 
        AND t.status = 'completed'
        AND t.transaction_date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE g.gadm_level = 1
    GROUP BY g.gadm_code, g.name_1, g.simplified_geometry, g.population;
    
    -- Create view for store clustering analysis
    CREATE OR REPLACE VIEW public.v_store_clusters AS
    SELECT 
        s1.id as store_id,
        s1.store_name,
        s1.location_point,
        COUNT(DISTINCT s2.id) as nearby_stores_1km,
        COUNT(DISTINCT CASE WHEN ST_Distance(s1.location_point::geography, s2.location_point::geography) <= 5000 THEN s2.id END) as nearby_stores_5km,
        COUNT(DISTINCT CASE WHEN ST_Distance(s1.location_point::geography, s2.location_point::geography) <= 10000 THEN s2.id END) as nearby_stores_10km
    FROM public.stores s1
    LEFT JOIN public.stores s2 ON s1.id != s2.id 
        AND ST_DWithin(s1.location_point::geography, s2.location_point::geography, 10000)
    WHERE s1.location_point IS NOT NULL
    GROUP BY s1.id, s1.store_name, s1.location_point;
    
    GRANT SELECT ON public.v_regional_sales_heatmap TO authenticated;
    GRANT SELECT ON public.v_store_clusters TO authenticated;"
    
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "$SQL_VIEWS"
    
    echo -e "${GREEN}Spatial views created!${NC}"
}

# Main execution
main() {
    echo "Starting GADM import process..."
    
    # Check for required parameters
    if [ -z "$DB_PASS" ]; then
        echo -e "${RED}Error: DB_PASS environment variable is required${NC}"
        echo "Usage: DB_PASS=your_password ./import_gadm_data.sh"
        exit 1
    fi
    
    check_requirements
    download_gadm_data
    import_to_postgres
    update_store_locations
    create_visualizations
    
    echo -e "${GREEN}GADM import completed successfully!${NC}"
    echo "You can now use spatial queries and visualizations in your application."
}

# Run main function
main