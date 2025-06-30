import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// All 18 Philippine regions
const ALL_REGIONS = [
  'NCR', 'Region I', 'Region II', 'Region III', 'Region IV-A', 'Region IV-B',
  'Region V', 'Region VI', 'Region VII', 'Region VIII', 'Region IX', 'Region X',
  'Region XI', 'Region XII', 'Region XIII', 'CAR', 'BARMM', 'MIMAROPA'
];

// Extended geography data for all 18 regions
const extendedGeography = [
  // Existing regions (NCR, III, IV-A, VI, VII, XI)
  
  // Region I - Ilocos Region
  { region: 'Region I', city_municipality: 'Vigan City', barangay: 'Poblacion', store_name: 'Vigan Central Store', latitude: 17.5749, longitude: 120.3868, population: 53879, area_sqkm: 25.13, store_type: 'sari-sari' },
  { region: 'Region I', city_municipality: 'Laoag City', barangay: 'Brgy 1', store_name: 'Laoag Express Mart', latitude: 18.1984, longitude: 120.5935, population: 111125, area_sqkm: 116.08, store_type: 'grocery' },
  { region: 'Region I', city_municipality: 'San Fernando', barangay: 'Poblacion', store_name: 'La Union Mart', latitude: 16.6159, longitude: 120.3173, population: 121812, area_sqkm: 102.72, store_type: 'mini-mart' },
  
  // Region II - Cagayan Valley
  { region: 'Region II', city_municipality: 'Tuguegarao City', barangay: 'Centro', store_name: 'Tuguegarao Central', latitude: 17.6132, longitude: 121.7270, population: 166334, area_sqkm: 144.80, store_type: 'grocery' },
  { region: 'Region II', city_municipality: 'Santiago City', barangay: 'Centro East', store_name: 'Santiago Express', latitude: 16.6872, longitude: 121.5487, population: 134830, area_sqkm: 255.51, store_type: 'sari-sari' },
  { region: 'Region II', city_municipality: 'Cauayan City', barangay: 'District 1', store_name: 'Cauayan Mart', latitude: 16.9298, longitude: 121.7790, population: 143403, area_sqkm: 336.40, store_type: 'convenience' },
  
  // Region IV-B - MIMAROPA
  { region: 'Region IV-B', city_municipality: 'Puerto Princesa', barangay: 'Poblacion', store_name: 'Palawan Central Store', latitude: 9.7392, longitude: 118.7353, population: 307079, area_sqkm: 2381.02, store_type: 'grocery' },
  { region: 'Region IV-B', city_municipality: 'Calapan City', barangay: 'Poblacion', store_name: 'Oriental Mindoro Mart', latitude: 13.4115, longitude: 121.1803, population: 145786, area_sqkm: 250.06, store_type: 'sari-sari' },
  
  // Region V - Bicol Region
  { region: 'Region V', city_municipality: 'Legazpi City', barangay: 'Poblacion', store_name: 'Legazpi Central', latitude: 13.1391, longitude: 123.7438, population: 209533, area_sqkm: 153.70, store_type: 'grocery' },
  { region: 'Region V', city_municipality: 'Naga City', barangay: 'Centro', store_name: 'Naga Express Mart', latitude: 13.6192, longitude: 123.1814, population: 209170, area_sqkm: 84.48, store_type: 'convenience' },
  { region: 'Region V', city_municipality: 'Masbate City', barangay: 'Poblacion', store_name: 'Masbate Store', latitude: 12.3706, longitude: 123.6244, population: 104522, area_sqkm: 178.76, store_type: 'sari-sari' },
  
  // Region VIII - Eastern Visayas
  { region: 'Region VIII', city_municipality: 'Tacloban City', barangay: 'Downtown', store_name: 'Tacloban Central', latitude: 11.2543, longitude: 125.0055, population: 251881, area_sqkm: 201.72, store_type: 'grocery' },
  { region: 'Region VIII', city_municipality: 'Ormoc City', barangay: 'Poblacion', store_name: 'Ormoc Express', latitude: 11.0064, longitude: 124.6075, population: 230998, area_sqkm: 613.60, store_type: 'mini-mart' },
  { region: 'Region VIII', city_municipality: 'Calbayog City', barangay: 'Centro', store_name: 'Calbayog Mart', latitude: 12.0672, longitude: 124.5937, population: 186960, area_sqkm: 903.14, store_type: 'sari-sari' },
  
  // Region IX - Zamboanga Peninsula
  { region: 'Region IX', city_municipality: 'Zamboanga City', barangay: 'Centro', store_name: 'Zamboanga Central', latitude: 6.9214, longitude: 122.0790, population: 977234, area_sqkm: 1483.38, store_type: 'grocery' },
  { region: 'Region IX', city_municipality: 'Pagadian City', barangay: 'Poblacion', store_name: 'Pagadian Express', latitude: 7.8257, longitude: 123.4378, population: 210452, area_sqkm: 378.82, store_type: 'convenience' },
  { region: 'Region IX', city_municipality: 'Dipolog City', barangay: 'Central', store_name: 'Dipolog Mart', latitude: 8.5897, longitude: 123.3401, population: 138141, area_sqkm: 136.22, store_type: 'sari-sari' },
  
  // Region X - Northern Mindanao
  { region: 'Region X', city_municipality: 'Cagayan de Oro', barangay: 'Centro', store_name: 'CDO Central Store', latitude: 8.4542, longitude: 124.6319, population: 728402, area_sqkm: 412.80, store_type: 'grocery' },
  { region: 'Region X', city_municipality: 'Iligan City', barangay: 'Poblacion', store_name: 'Iligan Express', latitude: 8.2280, longitude: 124.2452, population: 363115, area_sqkm: 813.37, store_type: 'mini-mart' },
  { region: 'Region X', city_municipality: 'Malaybalay City', barangay: 'Poblacion', store_name: 'Bukidnon Central', latitude: 8.1575, longitude: 125.1334, population: 190712, area_sqkm: 969.19, store_type: 'sari-sari' },
  
  // Region XII - SOCCSKSARGEN
  { region: 'Region XII', city_municipality: 'General Santos', barangay: 'Poblacion', store_name: 'GenSan Central', latitude: 6.1164, longitude: 125.1716, population: 697315, area_sqkm: 492.86, store_type: 'grocery' },
  { region: 'Region XII', city_municipality: 'Koronadal City', barangay: 'Poblacion', store_name: 'Koronadal Express', latitude: 6.5033, longitude: 124.8469, population: 195398, area_sqkm: 277.00, store_type: 'convenience' },
  { region: 'Region XII', city_municipality: 'Tacurong City', barangay: 'Poblacion', store_name: 'Tacurong Mart', latitude: 6.6929, longitude: 124.6750, population: 109319, area_sqkm: 153.40, store_type: 'sari-sari' },
  
  // Region XIII - Caraga
  { region: 'Region XIII', city_municipality: 'Butuan City', barangay: 'Poblacion', store_name: 'Butuan Central', latitude: 8.9492, longitude: 125.5406, population: 372910, area_sqkm: 816.62, store_type: 'grocery' },
  { region: 'Region XIII', city_municipality: 'Surigao City', barangay: 'Centro', store_name: 'Surigao Express', latitude: 9.7839, longitude: 125.4890, population: 171107, area_sqkm: 245.00, store_type: 'mini-mart' },
  { region: 'Region XIII', city_municipality: 'Tandag City', barangay: 'Poblacion', store_name: 'Tandag Mart', latitude: 9.0730, longitude: 126.1985, population: 62669, area_sqkm: 291.73, store_type: 'sari-sari' },
  
  // CAR - Cordillera Administrative Region
  { region: 'CAR', city_municipality: 'Baguio City', barangay: 'Session Road', store_name: 'Baguio Central', latitude: 16.4023, longitude: 120.5960, population: 366358, area_sqkm: 57.49, store_type: 'grocery' },
  { region: 'CAR', city_municipality: 'La Trinidad', barangay: 'Poblacion', store_name: 'Benguet Express', latitude: 16.4556, longitude: 120.5871, population: 137404, area_sqkm: 69.08, store_type: 'sari-sari' },
  { region: 'CAR', city_municipality: 'Tabuk City', barangay: 'Poblacion', store_name: 'Kalinga Mart', latitude: 17.4091, longitude: 121.4444, population: 121033, area_sqkm: 700.25, store_type: 'mini-mart' },
  
  // BARMM - Bangsamoro Autonomous Region
  { region: 'BARMM', city_municipality: 'Cotabato City', barangay: 'Poblacion', store_name: 'Cotabato Central', latitude: 7.2047, longitude: 124.2310, population: 325079, area_sqkm: 176.00, store_type: 'grocery' },
  { region: 'BARMM', city_municipality: 'Marawi City', barangay: 'Poblacion', store_name: 'Marawi Express', latitude: 7.9986, longitude: 124.2928, population: 207010, area_sqkm: 87.55, store_type: 'sari-sari' },
  { region: 'BARMM', city_municipality: 'Jolo', barangay: 'Poblacion', store_name: 'Sulu Central Store', latitude: 6.0527, longitude: 121.0020, population: 125564, area_sqkm: 126.40, store_type: 'mini-mart' },
  
  // MIMAROPA (alternative to IV-B)
  { region: 'MIMAROPA', city_municipality: 'Romblon', barangay: 'Poblacion', store_name: 'Romblon Store', latitude: 12.5778, longitude: 122.2691, population: 40554, area_sqkm: 86.57, store_type: 'sari-sari' },
  { region: 'MIMAROPA', city_municipality: 'Boac', barangay: 'Poblacion', store_name: 'Marinduque Central', latitude: 13.4400, longitude: 121.8439, population: 57283, area_sqkm: 212.95, store_type: 'grocery' }
];

async function generateFullYearTransactions() {
  console.log('🚀 Starting full year transaction generation...');
  console.log('📅 Date range: 365 days backwards from today');
  console.log('🌏 All 18 Philippine regions will be covered');
  
  try {
    // Clear existing transactions
    console.log('🗑️ Clearing existing transactions...');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Ensure all extended geography data is inserted
    console.log('📍 Ensuring all 18 regions are in geography table...');
    for (const geo of extendedGeography) {
      const { error } = await supabase
        .from('geography')
        .upsert(geo, { onConflict: 'region,city_municipality,barangay' });
      
      if (error && !error.message.includes('duplicate')) {
        console.error('Error inserting geography:', error);
      }
    }
    
    // Get all geography and organization data
    const { data: geographies } = await supabase
      .from('geography')
      .select('*')
      .order('region');
    
    const { data: organizations } = await supabase
      .from('organization')
      .select('*');
    
    console.log(`📍 Total locations: ${geographies.length}`);
    console.log(`📦 Total products: ${organizations.length}`);
    
    // Count regions
    const uniqueRegions = new Set(geographies.map(g => g.region));
    console.log(`🌏 Regions covered: ${uniqueRegions.size}`);
    console.log('Regions:', Array.from(uniqueRegions).sort());
    
    // Generate transactions for the past 365 days
    const transactions = [];
    const now = new Date();
    const targetTransactionsPerDay = 1000; // ~365,000 total transactions
    
    for (let daysAgo = 0; daysAgo < 365; daysAgo++) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      
      // Generate transactions for each day
      const dailyTransactions = Math.floor(targetTransactionsPerDay * (0.8 + Math.random() * 0.4)); // ±20% variation
      
      for (let t = 0; t < dailyTransactions; t++) {
        // Random geography with regional weighting
        const geo = geographies[Math.floor(Math.random() * geographies.length)];
        
        // Regional economic modifiers
        let regionModifier = 1.0;
        if (geo.region === 'NCR') regionModifier = 1.5;
        else if (['Region III', 'Region IV-A', 'Region VII'].includes(geo.region)) regionModifier = 1.3;
        else if (['Region VI', 'Region X', 'Region XI'].includes(geo.region)) regionModifier = 1.2;
        else if (['CAR', 'Region I', 'Region V'].includes(geo.region)) regionModifier = 1.1;
        
        // Random organization
        const org = organizations[Math.floor(Math.random() * organizations.length)];
        
        // Time of day (realistic distribution)
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        
        date.setHours(hour, minute, second);
        
        // Hour modifier (peak hours)
        let hourModifier = 1.0;
        if (hour >= 11 && hour <= 13) hourModifier = 1.4; // Lunch
        else if (hour >= 18 && hour <= 20) hourModifier = 1.3; // Dinner
        else if (hour >= 7 && hour <= 9) hourModifier = 1.2; // Morning
        else if (hour >= 21 && hour <= 23) hourModifier = 0.9; // Late night
        else if (hour >= 0 && hour <= 6) hourModifier = 0.3; // Early morning
        
        // Weekend modifier
        const dayOfWeek = date.getDay();
        const weekendModifier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
        
        // Category modifier
        let categoryModifier = 1.0;
        if (org.category === 'Beverages') categoryModifier = 1.3;
        else if (org.category === 'Snacks') categoryModifier = 1.2;
        else if (org.category === 'Food') categoryModifier = 1.15;
        
        // Calculate transaction amount
        const baseAmount = 50 + Math.random() * 450; // ₱50-500 base
        const quantity = Math.floor(1 + Math.random() * 5); // 1-5 items
        const totalAmount = baseAmount * quantity * regionModifier * hourModifier * weekendModifier * categoryModifier;
        
        // Payment method distribution
        const paymentRandom = Math.random();
        let paymentMethod = 'Cash';
        if (paymentRandom > 0.7) paymentMethod = 'Utang/Lista'; // 30% store credit
        else if (paymentRandom > 0.6) paymentMethod = 'GCash'; // 10% digital
        else if (paymentRandom > 0.59) paymentMethod = 'Credit Card'; // 1% card
        
        transactions.push({
          datetime: date.toISOString(),
          geography_id: geo.id,
          organization_id: org.id,
          total_amount: Math.round(totalAmount * 100) / 100,
          quantity: quantity,
          payment_method: paymentMethod
        });
      }
      
      // Insert in batches every 7 days
      if (daysAgo % 7 === 6 || daysAgo === 364) {
        console.log(`💾 Inserting batch for day ${daysAgo + 1}/365...`);
        const { error } = await supabase
          .from('transactions')
          .insert(transactions);
        
        if (error) {
          console.error('❌ Error inserting transactions:', error);
          return;
        }
        
        transactions.length = 0; // Clear array
      }
    }
    
    // Get final statistics
    const { data: stats } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    const { data: regionStats } = await supabase
      .rpc('get_regional_statistics');
    
    console.log('\n📊 Final Statistics:');
    console.log(`Total Transactions: ${stats.count}`);
    console.log('\nRegional Distribution:');
    
    if (regionStats) {
      regionStats.forEach(region => {
        console.log(`${region.region}: ${region.transaction_count} transactions, ₱${region.total_sales.toLocaleString()}`);
      });
    }
    
    console.log('\n🎉 Full year data generation complete!');
    
  } catch (error) {
    console.error('❌ Error generating transactions:', error);
  }
}

// Create RPC function for regional statistics if it doesn't exist
async function createRegionalStatsFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION get_regional_statistics()
    RETURNS TABLE (
      region VARCHAR(100),
      transaction_count BIGINT,
      total_sales NUMERIC
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        g.region,
        COUNT(t.id) as transaction_count,
        COALESCE(SUM(t.total_amount), 0) as total_sales
      FROM geography g
      LEFT JOIN transactions t ON g.id = t.geography_id
      GROUP BY g.region
      ORDER BY g.region;
    END;
    $$;
  `;
  
  try {
    await supabase.rpc('exec_sql', { sql: functionSQL });
  } catch (error) {
    // Function might already exist
  }
}

// Run the generation
createRegionalStatsFunction().then(() => {
  generateFullYearTransactions();
});