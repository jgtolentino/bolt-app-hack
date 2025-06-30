import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Additional regions to ensure we have all 18
const additionalRegions = [
  // Region I - Ilocos Region
  { region: 'Region I', city_municipality: 'Vigan City', barangay: 'Poblacion', store_name: 'Vigan Central Store', latitude: 17.5749, longitude: 120.3868, population: 53879, area_sqkm: 25.13, store_type: 'sari-sari' },
  { region: 'Region I', city_municipality: 'Laoag City', barangay: 'Brgy 1', store_name: 'Laoag Express Mart', latitude: 18.1984, longitude: 120.5935, population: 111125, area_sqkm: 116.08, store_type: 'grocery' },
  
  // Region II - Cagayan Valley
  { region: 'Region II', city_municipality: 'Tuguegarao City', barangay: 'Centro', store_name: 'Tuguegarao Central', latitude: 17.6132, longitude: 121.7270, population: 166334, area_sqkm: 144.80, store_type: 'grocery' },
  { region: 'Region II', city_municipality: 'Santiago City', barangay: 'Centro East', store_name: 'Santiago Express', latitude: 16.6872, longitude: 121.5487, population: 134830, area_sqkm: 255.51, store_type: 'sari-sari' },
  
  // Region IV-B - MIMAROPA
  { region: 'Region IV-B', city_municipality: 'Puerto Princesa', barangay: 'Poblacion', store_name: 'Palawan Central Store', latitude: 9.7392, longitude: 118.7353, population: 307079, area_sqkm: 2381.02, store_type: 'grocery' },
  
  // Region V - Bicol Region
  { region: 'Region V', city_municipality: 'Legazpi City', barangay: 'Poblacion', store_name: 'Legazpi Central', latitude: 13.1391, longitude: 123.7438, population: 209533, area_sqkm: 153.70, store_type: 'grocery' },
  { region: 'Region V', city_municipality: 'Naga City', barangay: 'Centro', store_name: 'Naga Express Mart', latitude: 13.6192, longitude: 123.1814, population: 209170, area_sqkm: 84.48, store_type: 'convenience' },
  
  // Region VIII - Eastern Visayas
  { region: 'Region VIII', city_municipality: 'Tacloban City', barangay: 'Downtown', store_name: 'Tacloban Central', latitude: 11.2543, longitude: 125.0055, population: 251881, area_sqkm: 201.72, store_type: 'grocery' },
  
  // Region IX - Zamboanga Peninsula
  { region: 'Region IX', city_municipality: 'Zamboanga City', barangay: 'Centro', store_name: 'Zamboanga Central', latitude: 6.9214, longitude: 122.0790, population: 977234, area_sqkm: 1483.38, store_type: 'grocery' },
  
  // Region X - Northern Mindanao
  { region: 'Region X', city_municipality: 'Cagayan de Oro', barangay: 'Centro', store_name: 'CDO Central Store', latitude: 8.4542, longitude: 124.6319, population: 728402, area_sqkm: 412.80, store_type: 'grocery' },
  
  // Region XII - SOCCSKSARGEN
  { region: 'Region XII', city_municipality: 'General Santos', barangay: 'Poblacion', store_name: 'GenSan Central', latitude: 6.1164, longitude: 125.1716, population: 697315, area_sqkm: 492.86, store_type: 'grocery' },
  
  // Region XIII - Caraga
  { region: 'Region XIII', city_municipality: 'Butuan City', barangay: 'Poblacion', store_name: 'Butuan Central', latitude: 8.9492, longitude: 125.5406, population: 372910, area_sqkm: 816.62, store_type: 'grocery' },
  
  // CAR - Cordillera Administrative Region
  { region: 'CAR', city_municipality: 'Baguio City', barangay: 'Session Road', store_name: 'Baguio Central', latitude: 16.4023, longitude: 120.5960, population: 366358, area_sqkm: 57.49, store_type: 'grocery' },
  
  // BARMM - Bangsamoro Autonomous Region
  { region: 'BARMM', city_municipality: 'Cotabato City', barangay: 'Poblacion', store_name: 'Cotabato Central', latitude: 7.2047, longitude: 124.2310, population: 325079, area_sqkm: 176.00, store_type: 'grocery' },
  
  // MIMAROPA
  { region: 'MIMAROPA', city_municipality: 'Romblon', barangay: 'Poblacion', store_name: 'Romblon Store', latitude: 12.5778, longitude: 122.2691, population: 40554, area_sqkm: 86.57, store_type: 'sari-sari' }
];

async function addRegionsAndGenerateTransactions() {
  console.log('🌏 Adding missing regions...');
  
  // Add missing regions
  for (const geo of additionalRegions) {
    await supabase.from('geography').insert(geo);
  }
  
  // Check regions
  const { data: geos } = await supabase.from('geography').select('region');
  const uniqueRegions = new Set(geos.map(g => g.region));
  console.log(`✅ Total regions: ${uniqueRegions.size}`);
  console.log('Regions:', Array.from(uniqueRegions).sort());
  
  // Generate transactions using RPC function for better performance
  console.log('🔄 Generating 365 days of transactions...');
  
  try {
    // Try the efficient batch generation
    const { data, error } = await supabase.rpc('generate_year_transactions', {
      days_back: 365,
      transactions_per_day: 1000
    });
    
    if (error) {
      console.log('Using fallback generation method...');
      // Fallback to generate_efficient_transactions
      const { data: fallbackData, error: fallbackError } = await supabase.rpc('generate_efficient_transactions', {
        target_count: 365000,
        max_batch_size: 5000
      });
      
      if (fallbackError) {
        console.error('Error:', fallbackError);
      } else {
        console.log('✅ Generated using efficient batch method');
      }
    } else {
      console.log('✅ Generated using year transaction function');
    }
    
    // Get final count
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total transactions: ${count}`);
    
    // Show regional distribution  
    const { data: stats } = await supabase.rpc('get_transaction_stats');
    if (stats && stats[0]) {
      console.log('\nRegional Distribution:', stats[0].regional_distribution);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Create the year generation function if it doesn't exist
async function createYearGenerationFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION generate_year_transactions(
      days_back INTEGER DEFAULT 365,
      transactions_per_day INTEGER DEFAULT 1000
    )
    RETURNS TEXT
    LANGUAGE plpgsql
    AS $$
    DECLARE
      geo RECORD;
      org RECORD;
      trans_date TIMESTAMP;
      daily_count INTEGER;
      i INTEGER;
      j INTEGER;
      total_generated INTEGER := 0;
    BEGIN
      -- Generate transactions for each day
      FOR i IN 0..days_back-1 LOOP
        trans_date := NOW() - INTERVAL '1 day' * i;
        daily_count := transactions_per_day + FLOOR(RANDOM() * 200 - 100); -- ±100 variation
        
        FOR j IN 1..daily_count LOOP
          -- Random geography
          SELECT * INTO geo FROM geography ORDER BY RANDOM() LIMIT 1;
          -- Random organization
          SELECT * INTO org FROM organization ORDER BY RANDOM() LIMIT 1;
          
          -- Insert transaction
          INSERT INTO transactions (
            datetime, geography_id, organization_id, 
            total_amount, quantity, payment_method
          ) VALUES (
            trans_date + (RANDOM() * INTERVAL '24 hours'),
            geo.id,
            org.id,
            50 + RANDOM() * 450, -- ₱50-500
            1 + FLOOR(RANDOM() * 5), -- 1-5 items
            CASE FLOOR(RANDOM() * 100)
              WHEN 0..52 THEN 'Cash'
              WHEN 53..90 THEN 'Utang/Lista'
              WHEN 91..98 THEN 'GCash'
              ELSE 'Credit Card'
            END
          );
          total_generated := total_generated + 1;
        END LOOP;
        
        IF i % 30 = 0 THEN
          RAISE NOTICE 'Generated % days, % transactions', i, total_generated;
        END IF;
      END LOOP;
      
      RETURN 'Generated ' || total_generated || ' transactions';
    END;
    $$;
  `;
  
  try {
    await supabase.rpc('exec_sql', { sql: functionSQL });
  } catch (error) {
    // Function might already exist or exec_sql might not be available
  }
}

// Run everything
createYearGenerationFunction().then(() => {
  addRegionsAndGenerateTransactions();
});