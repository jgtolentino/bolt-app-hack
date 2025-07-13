#!/usr/bin/env node

// Simplified Location Dimension Builder
// Creates a location dimension table with sample Philippine data

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample Philippine location data
const SAMPLE_LOCATIONS = [
  // NCR (National Capital Region)
  { region: 'NCR', province: 'Metro Manila', city: 'Manila', barangays: [
    { name: 'Ermita', lat: 14.5823, lng: 120.9748, area: 1.59, urban: true },
    { name: 'Malate', lat: 14.5739, lng: 120.9909, area: 2.59, urban: true },
    { name: 'Quiapo', lat: 14.5990, lng: 120.9831, area: 0.84, urban: true },
    { name: 'Sampaloc', lat: 14.6112, lng: 120.9926, area: 5.13, urban: true },
    { name: 'Tondo', lat: 14.6147, lng: 120.9671, area: 8.65, urban: true }
  ]},
  { region: 'NCR', province: 'Metro Manila', city: 'Quezon City', barangays: [
    { name: 'Diliman', lat: 14.6507, lng: 121.0494, area: 3.74, urban: true },
    { name: 'Cubao', lat: 14.6177, lng: 121.0551, area: 2.11, urban: true },
    { name: 'Commonwealth', lat: 14.6832, lng: 121.0896, area: 5.21, urban: true }
  ]},
  { region: 'NCR', province: 'Metro Manila', city: 'Makati', barangays: [
    { name: 'Poblacion', lat: 14.5659, lng: 121.0320, area: 1.85, urban: true },
    { name: 'Bel-Air', lat: 14.5612, lng: 121.0298, area: 1.71, urban: true },
    { name: 'Legaspi Village', lat: 14.5533, lng: 121.0194, area: 1.48, urban: true }
  ]},
  
  // Region III (Central Luzon)
  { region: 'Region III', province: 'Pampanga', city: 'Angeles', barangays: [
    { name: 'Balibago', lat: 15.1636, lng: 120.5887, area: 2.45, urban: true },
    { name: 'Anunas', lat: 15.1333, lng: 120.5987, area: 3.12, urban: false },
    { name: 'Cutcut', lat: 15.1287, lng: 120.5541, area: 4.23, urban: false }
  ]},
  
  // Region IV-A (CALABARZON)
  { region: 'Region IV-A', province: 'Batangas', city: 'Batangas City', barangays: [
    { name: 'Poblacion', lat: 13.7565, lng: 121.0583, area: 2.89, urban: true },
    { name: 'Alangilan', lat: 13.7860, lng: 121.0750, area: 8.47, urban: false },
    { name: 'Balagtas', lat: 13.7913, lng: 121.0521, area: 5.12, urban: false }
  ]},
  
  // Region VII (Central Visayas)
  { region: 'Region VII', province: 'Cebu', city: 'Cebu City', barangays: [
    { name: 'Lahug', lat: 10.3339, lng: 123.8941, area: 2.58, urban: true },
    { name: 'Banilad', lat: 10.3439, lng: 123.9119, area: 2.85, urban: true },
    { name: 'IT Park', lat: 10.3308, lng: 123.9054, area: 1.24, urban: true }
  ]},
  
  // Region XI (Davao Region)
  { region: 'Region XI', province: 'Davao del Sur', city: 'Davao City', barangays: [
    { name: 'Poblacion', lat: 7.0731, lng: 125.6128, area: 2.17, urban: true },
    { name: 'Buhangin', lat: 7.1027, lng: 125.6358, area: 13.44, urban: false },
    { name: 'Toril', lat: 7.0169, lng: 125.4914, area: 38.71, urban: false }
  ]}
];

// Configuration
const DB_CONFIG = {
  host: process.env.SUPABASE_HOST || 'localhost',
  database: process.env.SUPABASE_DB || 'postgres',
  user: process.env.SUPABASE_USER || 'postgres',
  password: process.env.SUPABASE_PASSWORD || 'postgres',
  port: process.env.SUPABASE_PORT || 5432
};

class SimpleLocationBuilder {
  constructor() {
    this.pool = new pg.Pool(DB_CONFIG);
  }

  async initialize() {
    console.log('🌏 Initializing Simple Location Dimension Builder...');
    
    try {
      await this.pool.query('SELECT NOW()');
      console.log('✅ Connected to database');
      
      // Enable PostGIS
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
      console.log('✅ PostGIS enabled');
      
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('\n💡 Make sure to set environment variables:');
      console.log('   export SUPABASE_HOST="your-project.supabase.co"');
      console.log('   export SUPABASE_PASSWORD="your-password"');
      throw error;
    }
  }

  async createTable() {
    console.log('🔨 Creating location dimension table...');
    
    const createSQL = `
      DROP TABLE IF EXISTS location_dimension CASCADE;
      
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
        geometry GEOMETRY(Point, 4326),
        latitude DECIMAL(10,6),
        longitude DECIMAL(10,6),
        area_sqkm DECIMAL(10,2),
        
        -- Administrative metadata
        admin_level INTEGER DEFAULT 4,
        island_group VARCHAR(50),
        is_urban BOOLEAN DEFAULT FALSE,
        is_coastal BOOLEAN DEFAULT FALSE,
        
        -- Economic indicators (sample data)
        economic_class VARCHAR(10),
        population_estimate INTEGER,
        household_estimate INTEGER,
        
        -- Retail metrics
        sari_sari_density DECIMAL(8,2),
        convenience_store_count INTEGER,
        supermarket_count INTEGER,
        
        -- Infrastructure
        has_public_market BOOLEAN DEFAULT FALSE,
        internet_penetration DECIMAL(5,2),
        electricity_access DECIMAL(5,2),
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX idx_location_geometry ON location_dimension USING GIST (geometry);
      CREATE INDEX idx_location_region ON location_dimension (region_name);
      CREATE INDEX idx_location_province ON location_dimension (province_name);
      CREATE INDEX idx_location_city ON location_dimension (city_municipality_name);
      CREATE INDEX idx_location_barangay ON location_dimension (barangay_name);
      CREATE INDEX idx_location_urban ON location_dimension (is_urban);
    `;
    
    try {
      await this.pool.query(createSQL);
      console.log('✅ Table and indexes created');
    } catch (error) {
      console.error('❌ Failed to create table:', error.message);
      throw error;
    }
  }

  async insertSampleData() {
    console.log('📤 Inserting sample location data...');
    
    const client = await this.pool.connect();
    let inserted = 0;
    
    try {
      await client.query('BEGIN');
      
      for (const location of SAMPLE_LOCATIONS) {
        const regionCode = location.region.replace(/\s+/g, '_').toUpperCase();
        const provinceCode = location.province.substring(0, 3).toUpperCase();
        
        const islandGroup = ['NCR', 'Region III', 'Region IV-A'].includes(location.region) ? 'Luzon' :
                           location.region === 'Region VII' ? 'Visayas' : 'Mindanao';
        
        for (const barangay of location.barangays) {
          const cityCode = location.city.substring(0, 3).toUpperCase();
          const barangayCode = `${cityCode}_${barangay.name.substring(0, 3).toUpperCase()}`;
          
          // Generate sample metrics based on urban/rural
          const sariDensity = barangay.urban ? 
            Math.floor(Math.random() * 50 + 50) : 
            Math.floor(Math.random() * 20 + 5);
            
          const population = barangay.urban ? 
            Math.floor(Math.random() * 20000 + 10000) : 
            Math.floor(Math.random() * 5000 + 1000);
            
          const insertSQL = `
            INSERT INTO location_dimension (
              region_code, region_name,
              province_code, province_name,
              city_municipality_code, city_municipality_name,
              barangay_code, barangay_name,
              geometry, latitude, longitude,
              area_sqkm, island_group, is_urban,
              economic_class, population_estimate, household_estimate,
              sari_sari_density, convenience_store_count, supermarket_count,
              has_public_market, internet_penetration, electricity_access
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              ST_SetSRID(ST_MakePoint($10, $9), 4326), $9, $10,
              $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
            )
          `;
          
          const values = [
            regionCode, location.region,
            provinceCode, location.province,
            cityCode, location.city,
            barangayCode, barangay.name,
            barangay.lat, barangay.lng,
            barangay.area, islandGroup, barangay.urban,
            barangay.urban ? 'B' : 'D',
            population,
            Math.floor(population / 4.5),
            sariDensity,
            barangay.urban ? Math.floor(Math.random() * 5 + 2) : Math.floor(Math.random() * 2),
            barangay.urban ? Math.floor(Math.random() * 2 + 1) : 0,
            barangay.urban || Math.random() > 0.5,
            barangay.urban ? Math.floor(Math.random() * 30 + 70) : Math.floor(Math.random() * 40 + 30),
            barangay.urban ? 100 : Math.floor(Math.random() * 20 + 80)
          ];
          
          await client.query(insertSQL, values);
          inserted++;
        }
      }
      
      await client.query('COMMIT');
      console.log(`✅ Inserted ${inserted} barangay records`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Insert failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async createHelperFunctions() {
    console.log('🛠️  Creating helper functions...');
    
    const functions = [
      `
      CREATE OR REPLACE FUNCTION find_nearest_barangay(
        lat DECIMAL, 
        lng DECIMAL
      )
      RETURNS TABLE(
        barangay_name VARCHAR,
        city_municipality_name VARCHAR,
        distance_km DECIMAL
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          l.barangay_name,
          l.city_municipality_name,
          ROUND((ST_Distance(
            l.geometry::geography, 
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
          ) / 1000)::numeric, 2) AS distance_km
        FROM location_dimension l
        ORDER BY l.geometry <-> ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        LIMIT 5;
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      `
      CREATE OR REPLACE FUNCTION get_region_summary()
      RETURNS TABLE(
        region_name VARCHAR,
        total_barangays BIGINT,
        urban_barangays BIGINT,
        avg_sari_density DECIMAL,
        total_population INTEGER
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          l.region_name,
          COUNT(*) as total_barangays,
          COUNT(*) FILTER (WHERE is_urban) as urban_barangays,
          ROUND(AVG(sari_sari_density)::numeric, 2) as avg_sari_density,
          SUM(population_estimate)::integer as total_population
        FROM location_dimension l
        GROUP BY l.region_name
        ORDER BY l.region_name;
      END;
      $$ LANGUAGE plpgsql;
      `
    ];
    
    for (const func of functions) {
      try {
        await this.pool.query(func);
        console.log('   ✅ Helper function created');
      } catch (error) {
        console.error('   ⚠️  Function creation failed:', error.message);
      }
    }
  }

  async generateReport() {
    console.log('\n📊 LOCATION DIMENSION SUMMARY:');
    console.log('================================');
    
    // Summary by region
    const regionSQL = `
      SELECT 
        region_name,
        COUNT(*) as barangays,
        COUNT(*) FILTER (WHERE is_urban) as urban,
        ROUND(AVG(sari_sari_density)::numeric, 1) as avg_density,
        SUM(population_estimate) as total_pop
      FROM location_dimension
      GROUP BY region_name
      ORDER BY region_name;
    `;
    
    const regions = await this.pool.query(regionSQL);
    
    console.log('\nBy Region:');
    regions.rows.forEach(row => {
      console.log(`${row.region_name}: ${row.barangays} barangays (${row.urban} urban)`);
      console.log(`  Population: ${row.total_pop?.toLocaleString() || 'N/A'}`);
      console.log(`  Avg sari-sari density: ${row.avg_density}/km²`);
    });
    
    // Urban vs Rural
    const urbanSQL = `
      SELECT 
        is_urban,
        COUNT(*) as count,
        ROUND(AVG(sari_sari_density)::numeric, 1) as avg_density,
        ROUND(AVG(internet_penetration)::numeric, 1) as avg_internet
      FROM location_dimension
      GROUP BY is_urban;
    `;
    
    const urban = await this.pool.query(urbanSQL);
    
    console.log('\nUrban vs Rural:');
    urban.rows.forEach(row => {
      console.log(`${row.is_urban ? 'Urban' : 'Rural'}: ${row.count} barangays`);
      console.log(`  Sari-sari density: ${row.avg_density}/km²`);
      console.log(`  Internet penetration: ${row.avg_internet}%`);
    });
    
    // Test nearest barangay function
    console.log('\nTest nearest barangay to Manila coordinates:');
    const nearest = await this.pool.query('SELECT * FROM find_nearest_barangay(14.5995, 120.9842)');
    nearest.rows.forEach(row => {
      console.log(`  ${row.barangay_name}, ${row.city_municipality_name} - ${row.distance_km}km`);
    });
  }

  async exportData() {
    console.log('\n💾 Exporting to CSV...');
    
    const query = `
      SELECT 
        location_id,
        region_name,
        province_name,
        city_municipality_name,
        barangay_name,
        latitude,
        longitude,
        area_sqkm,
        is_urban,
        economic_class,
        population_estimate,
        sari_sari_density,
        internet_penetration
      FROM location_dimension
      ORDER BY region_name, province_name, city_municipality_name, barangay_name
    `;
    
    try {
      const result = await this.pool.query(query);
      
      const csv = [
        'location_id,region,province,city,barangay,lat,lng,area_sqkm,urban,class,population,sari_density,internet',
        ...result.rows.map(row => 
          `${row.location_id},${row.region_name},${row.province_name},${row.city_municipality_name},${row.barangay_name},${row.latitude},${row.longitude},${row.area_sqkm},${row.is_urban},${row.economic_class},${row.population_estimate},${row.sari_sari_density},${row.internet_penetration}`
        )
      ].join('\n');
      
      const outputPath = path.join(__dirname, '..', 'data', 'location_dimension_sample.csv');
      const dir = path.dirname(outputPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, csv);
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
  console.log('Simple Philippine Location Dimension Builder');
  console.log('====================================================\n');
  
  const builder = new SimpleLocationBuilder();
  
  try {
    await builder.initialize();
    await builder.createTable();
    await builder.insertSampleData();
    await builder.createHelperFunctions();
    await builder.generateReport();
    await builder.exportData();
    
    console.log('\n✅ Location dimension build complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Test queries in Supabase SQL editor');
    console.log('2. Import real GeoJSON data for complete coverage');
    console.log('3. Add demographic data from PSA');
    console.log('4. Create API endpoints for location services');
    
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

export { SimpleLocationBuilder };