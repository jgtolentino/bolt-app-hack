#!/usr/bin/env node

/**
 * Import GADM boundary data into database geographic tables
 * This script reads the downloaded GADM JSON files and imports them into
 * the normalized geographic hierarchy tables with polygon boundaries
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GADM data files
const GADM_FILES = {
  regions: 'public/data/gadm41_PHL_1.json',     // Level 1 - Regions
  provinces: 'public/data/gadm41_PHL_2.json',   // Level 2 - Provinces
  cities: 'public/data/gadm41_PHL_3.json'       // Level 3 - Cities/Municipalities
};

// Region name mapping (GADM to standard names)
const REGION_MAPPING = {
  'National Capital Region': 'NCR',
  'Ilocos Region': 'Region I',
  'Cagayan Valley': 'Region II',
  'Central Luzon': 'Region III',
  'Calabarzon': 'Region IV-A',
  'Mimaropa': 'MIMAROPA',
  'Bicol Region': 'Region V',
  'Western Visayas': 'Region VI',
  'Central Visayas': 'Region VII',
  'Eastern Visayas': 'Region VIII',
  'Zamboanga Peninsula': 'Region IX',
  'Northern Mindanao': 'Region X',
  'Davao Region': 'Region XI',
  'Soccsksargen': 'Region XII',
  'Caraga': 'Region XIII',
  'Bangsamoro': 'BARMM',
  'Cordillera Administrative Region': 'CAR'
};

async function loadGADMFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    throw error;
  }
}

async function importRegions() {
  console.log('Importing regions...');
  const data = await loadGADMFile(GADM_FILES.regions);
  
  const regions = data.features.map(feature => {
    const props = feature.properties;
    const gadmName = props.NAME_1;
    const standardName = REGION_MAPPING[gadmName] || gadmName;
    
    return {
      region_code: props.HASC_1?.replace('PH.', '') || props.GID_1,
      region_name: standardName,
      region_name_alt: gadmName,
      island_group: getIslandGroup(standardName),
      boundary_polygon: feature.geometry
    };
  });

  // Upsert regions
  for (const region of regions) {
    const { error } = await supabase
      .from('regions')
      .upsert(region, { 
        onConflict: 'region_code',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`Error importing region ${region.region_name}:`, error);
    } else {
      console.log(`✓ Imported region: ${region.region_name}`);
    }
  }
}

async function importProvinces() {
  console.log('\nImporting provinces...');
  const data = await loadGADMFile(GADM_FILES.provinces);
  
  // Get region mappings
  const { data: regions } = await supabase
    .from('regions')
    .select('id, region_code, region_name');
  
  const regionMap = {};
  regions.forEach(r => {
    regionMap[r.region_code] = r.id;
  });
  
  const provinces = data.features.map(feature => {
    const props = feature.properties;
    const regionCode = props.HASC_1?.replace('PH.', '');
    
    return {
      province_code: props.HASC_2?.replace('PH.', '').split('.').pop() || props.GID_2,
      province_name: props.NAME_2,
      region_id: regionMap[regionCode],
      boundary_polygon: feature.geometry
    };
  });

  // Upsert provinces
  for (const province of provinces) {
    if (!province.region_id) {
      console.warn(`Skipping province ${province.province_name} - no matching region`);
      continue;
    }
    
    const { error } = await supabase
      .from('provinces')
      .upsert(province, { 
        onConflict: 'province_code',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`Error importing province ${province.province_name}:`, error);
    } else {
      console.log(`✓ Imported province: ${province.province_name}`);
    }
  }
}

async function importCities() {
  console.log('\nImporting cities/municipalities...');
  const data = await loadGADMFile(GADM_FILES.cities);
  
  // Get region and province mappings
  const { data: regions } = await supabase
    .from('regions')
    .select('id, region_code');
  
  const { data: provinces } = await supabase
    .from('provinces')
    .select('id, province_code, province_name');
  
  const regionMap = {};
  regions.forEach(r => {
    regionMap[r.region_code] = r.id;
  });
  
  const provinceMap = {};
  provinces.forEach(p => {
    provinceMap[p.province_code] = p.id;
    // Also map by name as fallback
    provinceMap[p.province_name] = p.id;
  });
  
  const cities = data.features.map(feature => {
    const props = feature.properties;
    const regionCode = props.HASC_1?.replace('PH.', '');
    const provinceCode = props.HASC_2?.replace('PH.', '').split('.').pop();
    
    return {
      city_code: props.HASC_3?.replace('PH.', '').split('.').pop() || props.GID_3,
      city_name: props.NAME_3,
      city_class: determineCityClass(props.NAME_3, props.ENGTYPE_3),
      is_capital: props.NAME_3.includes('City') && props.NAME_3.includes('Capital'),
      is_highly_urbanized: props.ENGTYPE_3 === 'City' || props.NAME_3.includes('City'),
      province_id: provinceMap[provinceCode] || provinceMap[props.NAME_2],
      region_id: regionMap[regionCode],
      boundary_polygon: feature.geometry
    };
  });

  // Upsert cities
  let imported = 0;
  let skipped = 0;
  
  for (const city of cities) {
    if (!city.region_id) {
      console.warn(`Skipping city ${city.city_name} - no matching region`);
      skipped++;
      continue;
    }
    
    const { error } = await supabase
      .from('cities')
      .upsert(city, { 
        onConflict: 'city_code',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`Error importing city ${city.city_name}:`, error);
      skipped++;
    } else {
      imported++;
      if (imported % 100 === 0) {
        console.log(`✓ Imported ${imported} cities...`);
      }
    }
  }
  
  console.log(`\n✓ Successfully imported ${imported} cities/municipalities`);
  console.log(`✗ Skipped ${skipped} cities/municipalities`);
}

function getIslandGroup(regionName) {
  const luzon = ['NCR', 'CAR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region IV-B', 'MIMAROPA', 'Region V'];
  const visayas = ['Region VI', 'Region VII', 'Region VIII'];
  const mindanao = ['Region IX', 'Region X', 'Region XI', 'Region XII', 'Region XIII', 'BARMM'];
  
  if (luzon.includes(regionName)) return 'Luzon';
  if (visayas.includes(regionName)) return 'Visayas';
  if (mindanao.includes(regionName)) return 'Mindanao';
  return 'Unknown';
}

function determineCityClass(name, engType) {
  if (name.includes('City') || engType === 'City') {
    if (name.includes('Manila') || name.includes('Quezon City') || name.includes('Makati')) {
      return 'Highly Urbanized City';
    }
    return 'Component City';
  }
  return 'Municipality';
}

async function updateStoreLocations() {
  console.log('\nUpdating store location points...');
  
  // Update stores with PostGIS points
  const { error } = await supabase.rpc('execute_sql', {
    query: `
      UPDATE stores 
      SET location_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `
  });
  
  if (error) {
    console.error('Error updating store locations:', error);
  } else {
    console.log('✓ Updated store location points');
  }
}

async function linkStoresToGeography() {
  console.log('\nLinking stores to geographic hierarchy...');
  
  // This would use the find_location_hierarchy function to match stores
  // to their proper region/province/city/barangay based on coordinates
  // For now, we'll do text matching as a fallback
  
  const { data: stores } = await supabase
    .from('stores')
    .select('id, region, city, latitude, longitude');
  
  const { data: regions } = await supabase
    .from('regions')
    .select('id, region_name');
  
  const { data: cities } = await supabase
    .from('cities')
    .select('id, city_name, region_id');
  
  // Create lookup maps
  const regionMap = {};
  regions.forEach(r => {
    regionMap[r.region_name] = r.id;
    // Also map variations
    if (r.region_name === 'NCR') {
      regionMap['National Capital Region'] = r.id;
      regionMap['Metro Manila'] = r.id;
    }
  });
  
  const cityMap = {};
  cities.forEach(c => {
    if (!cityMap[c.city_name]) cityMap[c.city_name] = [];
    cityMap[c.city_name].push({ id: c.id, region_id: c.region_id });
  });
  
  // Update stores
  let updated = 0;
  for (const store of stores) {
    const updates = {};
    
    // Match region
    if (store.region && regionMap[store.region]) {
      updates.region_id = regionMap[store.region];
    }
    
    // Match city (considering region context)
    if (store.city && cityMap[store.city]) {
      const cityMatches = cityMap[store.city];
      if (cityMatches.length === 1) {
        updates.city_id = cityMatches[0].id;
      } else if (updates.region_id) {
        // Multiple cities with same name, use region to disambiguate
        const match = cityMatches.find(c => c.region_id === updates.region_id);
        if (match) updates.city_id = match.id;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', store.id);
      
      if (!error) updated++;
    }
  }
  
  console.log(`✓ Updated ${updated} stores with geographic IDs`);
}

async function main() {
  try {
    console.log('Starting GADM data import...\n');
    
    // Import in order: regions -> provinces -> cities
    await importRegions();
    await importProvinces();
    await importCities();
    
    // Update store locations and link to geography
    await updateStoreLocations();
    await linkStoresToGeography();
    
    console.log('\n✅ GADM import completed successfully!');
    
    // Show summary
    const { count: regionCount } = await supabase
      .from('regions')
      .select('*', { count: 'exact', head: true });
    
    const { count: provinceCount } = await supabase
      .from('provinces')
      .select('*', { count: 'exact', head: true });
    
    const { count: cityCount } = await supabase
      .from('cities')
      .select('*', { count: 'exact', head: true });
    
    console.log('\nSummary:');
    console.log(`- Regions: ${regionCount}`);
    console.log(`- Provinces: ${provinceCount}`);
    console.log(`- Cities/Municipalities: ${cityCount}`);
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
main();