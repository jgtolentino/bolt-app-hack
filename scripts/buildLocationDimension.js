#!/usr/bin/env node

// Script to build master location dimension table with barangay-level data
// This creates a PostGIS-enabled table in Supabase for all MCP services

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Replace with your Supabase credentials
const SUPABASE_CONFIG = {
  host: process.env.SUPABASE_HOST || 'your-project.supabase.co',
  database: process.env.SUPABASE_DB || 'postgres',
  user: process.env.SUPABASE_USER || 'postgres',
  password: process.env.SUPABASE_PASSWORD || 'your-password',
  port: process.env.SUPABASE_PORT || 5432
};

// GeoJSON source for Philippine administrative boundaries
const GEOJSON_URL = 'https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/geojson/philippines.json';

// Alternative source with more detail
const ADM3_GEOJSON_URL = 'https://data.humdata.org/dataset/philippines-administrative-levels-0-to-3';

class LocationDimensionBuilder {
  constructor() {
    this.pool = new pg.Pool(SUPABASE_CONFIG);
  }

  async initialize() {
    console.log('🌏 Initializing Location Dimension Builder...');
    
    try {
      // Test connection
      await this.pool.query('SELECT NOW()');
      console.log('✅ Connected to Supabase database');
      
      // Enable PostGIS if not already enabled
      await this.enablePostGIS();
      
    } catch (error) {
      console.error('❌ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async enablePostGIS() {
    try {
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS postgis_topology;');
      console.log('✅ PostGIS extensions enabled');
    } catch (error) {
      console.error('⚠️  PostGIS might already be enabled:', error.message);
    }
  }

  async fetchGeoJSON() {
    console.log('📥 Fetching Philippine GeoJSON data...');
    
    try {
      const response = await fetch(GEOJSON_URL);
      const data = await response.json();
      
      console.log(`✅ Fetched ${data.features.length} geographic features`);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch GeoJSON:', error.message);
      throw error;
    }
  }

  async createTables() {
    console.log('🔨 Creating database tables...');
    
    // Drop existing tables if they exist
    const dropSQL = `
      DROP TABLE IF EXISTS location_dimension CASCADE;
      DROP TABLE IF EXISTS raw_geojson_import CASCADE;
    `;
    
    // Create raw import table
    const createRawSQL = `
      CREATE TABLE raw_geojson_import (
        id SERIAL PRIMARY KEY,
        properties JSONB,
        geometry GEOMETRY(Geometry, 4326),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Create master location dimension table
    const createMasterSQL = `
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
        
        -- Economic indicators
        economic_class VARCHAR(10),
        population_2020 INTEGER,
        household_count INTEGER,
        avg_household_income DECIMAL(12,2),
        poverty_incidence DECIMAL(5,2),
        
        -- Retail metrics
        sari_sari_density DECIMAL(8,2),
        convenience_store_count INTEGER,
        supermarket_count INTEGER,
        mall_count INTEGER,
        
        -- Infrastructure
        has_public_market BOOLEAN DEFAULT FALSE,
        road_density_km_per_sqkm DECIMAL(8,2),
        internet_penetration DECIMAL(5,2),
        electricity_access DECIMAL(5,2),
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        
        -- Indexes will be created separately
        UNIQUE(barangay_code, city_municipality_code, province_code, region_code)
      );
    `;
    
    try {
      await this.pool.query(dropSQL);
      await this.pool.query(createRawSQL);
      await this.pool.query(createMasterSQL);
      console.log('✅ Tables created successfully');
    } catch (error) {
      console.error('❌ Failed to create tables:', error.message);
      throw error;
    }
  }

  async importGeoJSON(geoJSON) {
    console.log('📤 Importing GeoJSON data...');
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let imported = 0;
      for (const feature of geoJSON.features) {
        const { properties, geometry } = feature;
        
        const insertSQL = `
          INSERT INTO raw_geojson_import (properties, geometry)
          VALUES ($1, ST_GeomFromGeoJSON($2))
        `;
        
        await client.query(insertSQL, [
          JSON.stringify(properties),
          JSON.stringify(geometry)
        ]);
        
        imported++;
        if (imported % 100 === 0) {
          console.log(`   Imported ${imported} features...`);
        }
      }
      
      await client.query('COMMIT');
      console.log(`✅ Imported ${imported} geographic features`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Import failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async processLocationData() {
    console.log('⚙️  Processing location hierarchy...');
    
    const processSQL = `
      INSERT INTO location_dimension (
        region_code,
        region_name,
        province_code,
        province_name,
        city_municipality_code,
        city_municipality_name,
        barangay_code,
        barangay_name,
        geometry,
        centroid,
        bbox,
        area_sqkm,
        perimeter_km,
        admin_level,
        island_group
      )
      SELECT 
        properties->>'region_code' AS region_code,
        properties->>'region_name' AS region_name,
        properties->>'province_code' AS province_code,
        properties->>'province_name' AS province_name,
        properties->>'city_mun_code' AS city_municipality_code,
        properties->>'city_mun_name' AS city_municipality_name,
        properties->>'brgy_code' AS barangay_code,
        properties->>'brgy_name' AS barangay_name,
        ST_Multi(geometry) AS geometry,
        ST_Centroid(geometry) AS centroid,
        Box2D(geometry) AS bbox,
        ST_Area(geography(geometry)) / 1000000.0 AS area_sqkm,
        ST_Perimeter(geography(geometry)) / 1000.0 AS perimeter_km,
        CASE 
          WHEN properties->>'brgy_code' IS NOT NULL THEN 4
          WHEN properties->>'city_mun_code' IS NOT NULL THEN 3
          WHEN properties->>'province_code' IS NOT NULL THEN 2
          WHEN properties->>'region_code' IS NOT NULL THEN 1
          ELSE 0
        END AS admin_level,
        CASE 
          WHEN properties->>'region_name' IN ('NCR', 'Region III', 'Region IV-A') THEN 'Luzon'
          WHEN properties->>'region_name' IN ('Region VI', 'Region VII', 'Region VIII') THEN 'Visayas'
          WHEN properties->>'region_name' IN ('Region IX', 'Region X', 'Region XI', 'Region XII') THEN 'Mindanao'
          ELSE 'Other'
        END AS island_group
      FROM raw_geojson_import
      WHERE geometry IS NOT NULL;
    `;
    
    try {
      const result = await this.pool.query(processSQL);
      console.log(`✅ Processed ${result.rowCount} location records`);
    } catch (error) {
      console.error('❌ Processing failed:', error.message);
      throw error;
    }
  }

  async createIndexes() {
    console.log('📇 Creating spatial and regular indexes...');
    
    const indexes = [
      // Spatial indexes
      'CREATE INDEX idx_location_geometry ON location_dimension USING GIST (geometry);',
      'CREATE INDEX idx_location_centroid ON location_dimension USING GIST (centroid);',
      
      // Hierarchical indexes
      'CREATE INDEX idx_location_region ON location_dimension (region_code, region_name);',
      'CREATE INDEX idx_location_province ON location_dimension (province_code, province_name);',
      'CREATE INDEX idx_location_city ON location_dimension (city_municipality_code, city_municipality_name);',
      'CREATE INDEX idx_location_barangay ON location_dimension (barangay_code, barangay_name);',
      
      // Composite indexes for common queries
      'CREATE INDEX idx_location_hierarchy ON location_dimension (region_code, province_code, city_municipality_code, barangay_code);',
      'CREATE INDEX idx_location_admin_level ON location_dimension (admin_level);',
      
      // Economic indexes
      'CREATE INDEX idx_location_economic_class ON location_dimension (economic_class);',
      'CREATE INDEX idx_location_urban ON location_dimension (is_urban);'
    ];
    
    for (const indexSQL of indexes) {
      try {
        await this.pool.query(indexSQL);
        console.log(`   ✅ ${indexSQL.match(/idx_\w+/)[0]} created`);
      } catch (error) {
        console.error(`   ⚠️  Failed to create index: ${error.message}`);
      }
    }
  }

  async updateUrbanFlags() {
    console.log('🏙️  Updating urban/coastal flags...');
    
    // Mark urban areas based on city classification
    const urbanSQL = `
      UPDATE location_dimension
      SET is_urban = TRUE
      WHERE city_municipality_name ILIKE '%city%'
         OR city_municipality_name IN ('Makati', 'Mandaluyong', 'Pasig', 'Quezon City', 'Manila', 'Cebu', 'Davao');
    `;
    
    // This would require coastline data, but we'll mark known coastal cities
    const coastalSQL = `
      UPDATE location_dimension
      SET is_coastal = TRUE
      WHERE city_municipality_name IN ('Batangas City', 'Subic', 'Davao City', 'Cebu City', 'Iloilo City')
         OR province_name IN ('Batanes', 'Palawan', 'Batangas', 'Quezon');
    `;
    
    try {
      await this.pool.query(urbanSQL);
      await this.pool.query(coastalSQL);
      console.log('✅ Urban and coastal flags updated');
    } catch (error) {
      console.error('❌ Failed to update flags:', error.message);
    }
  }

  async addRetailMetrics() {
    console.log('📊 Adding sample retail metrics...');
    
    // Add sample retail density based on urban/rural classification
    const retailSQL = `
      UPDATE location_dimension
      SET 
        sari_sari_density = CASE 
          WHEN is_urban THEN ROUND((RANDOM() * 50 + 50)::numeric, 2)  -- 50-100 per sq km in urban
          ELSE ROUND((RANDOM() * 20 + 5)::numeric, 2)                  -- 5-25 per sq km in rural
        END,
        convenience_store_count = CASE
          WHEN is_urban AND admin_level = 3 THEN FLOOR(RANDOM() * 10 + 5)::integer
          WHEN is_urban THEN FLOOR(RANDOM() * 5 + 1)::integer
          ELSE FLOOR(RANDOM() * 2)::integer
        END,
        supermarket_count = CASE
          WHEN is_urban AND admin_level <= 3 THEN FLOOR(RANDOM() * 3 + 1)::integer
          ELSE 0
        END,
        has_public_market = (RANDOM() > 0.3 OR is_urban),
        internet_penetration = CASE
          WHEN is_urban THEN ROUND((RANDOM() * 30 + 70)::numeric, 2)  -- 70-100% in urban
          ELSE ROUND((RANDOM() * 40 + 30)::numeric, 2)                 -- 30-70% in rural
        END,
        electricity_access = CASE
          WHEN is_urban THEN 100.0
          ELSE ROUND((RANDOM() * 20 + 80)::numeric, 2)                 -- 80-100% in rural
        END
      WHERE admin_level >= 3;  -- Only for city and barangay level
    `;
    
    try {
      await this.pool.query(retailSQL);
      console.log('✅ Retail metrics added');
    } catch (error) {
      console.error('❌ Failed to add retail metrics:', error.message);
    }
  }

  async createHelperFunctions() {
    console.log('🛠️  Creating helper functions...');
    
    const functions = [
      // Function to get location by coordinates
      `
      CREATE OR REPLACE FUNCTION get_location_by_coordinates(lat DECIMAL, lng DECIMAL)
      RETURNS TABLE(
        location_id INTEGER,
        barangay_name VARCHAR,
        city_municipality_name VARCHAR,
        province_name VARCHAR,
        region_name VARCHAR
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          l.location_id,
          l.barangay_name,
          l.city_municipality_name,
          l.province_name,
          l.region_name
        FROM location_dimension l
        WHERE ST_Contains(l.geometry, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
        ORDER BY l.admin_level DESC
        LIMIT 1;
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Function to get nearby locations
      `
      CREATE OR REPLACE FUNCTION get_nearby_locations(
        lat DECIMAL, 
        lng DECIMAL, 
        radius_km DECIMAL DEFAULT 5.0
      )
      RETURNS TABLE(
        location_id INTEGER,
        barangay_name VARCHAR,
        distance_km DECIMAL
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          l.location_id,
          l.barangay_name,
          ROUND((ST_Distance(
            l.centroid::geography, 
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
          ) / 1000)::numeric, 2) AS distance_km
        FROM location_dimension l
        WHERE ST_DWithin(
          l.centroid::geography,
          ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
          radius_km * 1000
        )
        AND l.admin_level = 4  -- Barangay level only
        ORDER BY distance_km;
      END;
      $$ LANGUAGE plpgsql;
      `
    ];
    
    for (const funcSQL of functions) {
      try {
        await this.pool.query(funcSQL);
        console.log('   ✅ Helper function created');
      } catch (error) {
        console.error('   ⚠️  Failed to create function:', error.message);
      }
    }
  }

  async generateSummaryReport() {
    console.log('📈 Generating summary report...');
    
    const summarySQL = `
      SELECT 
        admin_level,
        COUNT(*) as record_count,
        COUNT(DISTINCT region_name) as regions,
        COUNT(DISTINCT province_name) as provinces,
        COUNT(DISTINCT city_municipality_name) as cities,
        COUNT(DISTINCT barangay_name) as barangays,
        ROUND(AVG(area_sqkm)::numeric, 2) as avg_area_sqkm,
        ROUND(SUM(area_sqkm)::numeric, 2) as total_area_sqkm
      FROM location_dimension
      GROUP BY admin_level
      ORDER BY admin_level;
    `;
    
    try {
      const result = await this.pool.query(summarySQL);
      
      console.log('\n📊 LOCATION DIMENSION SUMMARY:');
      console.log('================================');
      result.rows.forEach(row => {
        console.log(`Admin Level ${row.admin_level}: ${row.record_count} records`);
        if (row.admin_level === 1) console.log(`  - Regions: ${row.regions}`);
        if (row.admin_level === 2) console.log(`  - Provinces: ${row.provinces}`);
        if (row.admin_level === 3) console.log(`  - Cities/Municipalities: ${row.cities}`);
        if (row.admin_level === 4) console.log(`  - Barangays: ${row.barangays}`);
        console.log(`  - Average area: ${row.avg_area_sqkm} sq km`);
        console.log(`  - Total area: ${row.total_area_sqkm} sq km`);
      });
      
      // Sample location query
      const sampleSQL = `
        SELECT 
          barangay_name,
          city_municipality_name,
          province_name,
          region_name,
          ROUND(area_sqkm::numeric, 2) as area_sqkm,
          is_urban,
          sari_sari_density
        FROM location_dimension
        WHERE admin_level = 4
        ORDER BY RANDOM()
        LIMIT 5;
      `;
      
      const samples = await this.pool.query(sampleSQL);
      
      console.log('\n📍 SAMPLE BARANGAY RECORDS:');
      console.log('================================');
      samples.rows.forEach(row => {
        console.log(`${row.barangay_name}, ${row.city_municipality_name}, ${row.province_name}`);
        console.log(`  Region: ${row.region_name}`);
        console.log(`  Area: ${row.area_sqkm} sq km`);
        console.log(`  Urban: ${row.is_urban ? 'Yes' : 'No'}`);
        console.log(`  Sari-sari density: ${row.sari_sari_density || 'N/A'} per sq km`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Failed to generate summary:', error.message);
    }
  }

  async exportToFile() {
    console.log('💾 Exporting location dimension to CSV...');
    
    const exportSQL = `
      COPY (
        SELECT 
          location_id,
          country_code,
          region_code,
          region_name,
          province_code,
          province_name,
          city_municipality_code,
          city_municipality_name,
          barangay_code,
          barangay_name,
          ST_X(centroid) as longitude,
          ST_Y(centroid) as latitude,
          area_sqkm,
          admin_level,
          island_group,
          is_urban,
          is_coastal,
          sari_sari_density,
          convenience_store_count,
          internet_penetration
        FROM location_dimension
        WHERE admin_level >= 3
        ORDER BY region_name, province_name, city_municipality_name, barangay_name
      ) TO STDOUT WITH CSV HEADER;
    `;
    
    try {
      const client = await this.pool.connect();
      const stream = client.query(exportSQL);
      const outputPath = path.join(__dirname, '..', 'data', 'location_dimension.csv');
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const fileStream = fs.createWriteStream(outputPath);
      stream.pipe(fileStream);
      
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });
      
      client.release();
      console.log(`✅ Exported to: ${outputPath}`);
      
    } catch (error) {
      console.error('❌ Export failed:', error.message);
    }
  }

  async cleanup() {
    await this.pool.end();
  }
}

// Main execution
async function main() {
  console.log('====================================================');
  console.log('Philippine Location Dimension Builder');
  console.log('Building PostGIS-enabled master location table');
  console.log('====================================================\n');
  
  const builder = new LocationDimensionBuilder();
  
  try {
    await builder.initialize();
    
    // Check if we should use local file or fetch
    const localGeoJSONPath = path.join(__dirname, '..', 'data', 'philippines_adm3.geojson');
    let geoJSON;
    
    if (fs.existsSync(localGeoJSONPath)) {
      console.log('📂 Using local GeoJSON file...');
      const data = fs.readFileSync(localGeoJSONPath, 'utf8');
      geoJSON = JSON.parse(data);
    } else {
      geoJSON = await builder.fetchGeoJSON();
    }
    
    await builder.createTables();
    await builder.importGeoJSON(geoJSON);
    await builder.processLocationData();
    await builder.createIndexes();
    await builder.updateUrbanFlags();
    await builder.addRetailMetrics();
    await builder.createHelperFunctions();
    await builder.generateSummaryReport();
    await builder.exportToFile();
    
    console.log('\n✅ Location dimension build complete!');
    console.log('📊 Your master location table is ready for use by all MCP services');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  } finally {
    await builder.cleanup();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { LocationDimensionBuilder };