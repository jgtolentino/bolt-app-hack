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

async function generateYearTransactions() {
  console.log('🚀 Starting optimized year transaction generation...');
  console.log('📅 Generating 365 days of data backwards from today');
  
  try {
    // Clear existing transactions
    console.log('🗑️ Clearing existing transactions...');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Get all geography and organization data
    const { data: geographies, error: geoError } = await supabase
      .from('geography')
      .select('*')
      .order('region');
    
    if (geoError) {
      console.error('Error fetching geography:', geoError);
      return;
    }
    
    const { data: organizations, error: orgError } = await supabase
      .from('organization')
      .select('*');
    
    if (orgError) {
      console.error('Error fetching organizations:', orgError);
      return;
    }
    
    console.log(`📍 Total locations: ${geographies.length}`);
    console.log(`📦 Total products: ${organizations.length}`);
    
    // Count unique regions
    const uniqueRegions = new Set(geographies.map(g => g.region));
    console.log(`🌏 Regions found: ${uniqueRegions.size}`);
    console.log('Regions:', Array.from(uniqueRegions).sort());
    
    // Generate transactions using RPC function for better performance
    console.log('🔄 Generating transactions batch by batch...');
    
    const now = new Date();
    const totalDays = 365;
    const transactionsPerDay = 1000; // Target ~365,000 transactions
    let totalGenerated = 0;
    
    // Generate transactions in daily batches
    for (let daysAgo = 0; daysAgo < totalDays; daysAgo++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - daysAgo);
      
      const dailyTransactions = [];
      const dailyCount = Math.floor(transactionsPerDay * (0.8 + Math.random() * 0.4)); // ±20% variation
      
      for (let t = 0; t < dailyCount; t++) {
        // Random geography with weighted distribution
        const geoIndex = Math.floor(Math.random() * geographies.length);
        const geo = geographies[geoIndex];
        
        // Random organization
        const orgIndex = Math.floor(Math.random() * organizations.length);
        const org = organizations[orgIndex];
        
        // Generate realistic time
        const hour = getWeightedHour();
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        
        const transactionTime = new Date(targetDate);
        transactionTime.setHours(hour, minute, second);
        
        // Calculate amount with modifiers
        const baseAmount = 50 + Math.random() * 450; // ₱50-500
        const quantity = Math.floor(1 + Math.random() * 5); // 1-5 items
        
        // Apply realistic modifiers
        const regionModifier = getRegionModifier(geo.region);
        const hourModifier = getHourModifier(hour);
        const dayModifier = getDayModifier(transactionTime.getDay());
        const categoryModifier = getCategoryModifier(org.category);
        
        const totalAmount = baseAmount * quantity * regionModifier * hourModifier * dayModifier * categoryModifier;
        
        // Payment method
        const paymentMethod = getPaymentMethod();
        
        dailyTransactions.push({
          datetime: transactionTime.toISOString(),
          geography_id: geo.id,
          organization_id: org.id,
          total_amount: Math.round(totalAmount * 100) / 100,
          quantity: quantity,
          payment_method: paymentMethod
        });
      }
      
      // Insert daily batch
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(dailyTransactions);
      
      if (insertError) {
        console.error(`Error inserting day ${daysAgo}:`, insertError);
      } else {
        totalGenerated += dailyTransactions.length;
        if (daysAgo % 30 === 0) {
          console.log(`📊 Progress: Day ${daysAgo + 1}/${totalDays} - Total transactions: ${totalGenerated}`);
        }
      }
    }
    
    // Verify final counts
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n✅ Transaction generation complete!');
    console.log(`Total transactions generated: ${count}`);
    
    // Show regional distribution
    const { data: regionStats } = await supabase
      .from('v_regional_coverage')
      .select('*');
    
    if (regionStats) {
      console.log('\n📊 Regional Distribution:');
      regionStats.forEach(region => {
        console.log(`${region.region}: ${region.total_transactions} transactions, ₱${Number(region.total_sales).toLocaleString()}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Helper functions for realistic data generation
function getWeightedHour() {
  const rand = Math.random();
  // Peak hours: 11-13 (lunch), 18-20 (dinner)
  if (rand < 0.15) return 11 + Math.floor(Math.random() * 3);
  if (rand < 0.30) return 18 + Math.floor(Math.random() * 3);
  if (rand < 0.45) return 7 + Math.floor(Math.random() * 3); // Morning
  if (rand < 0.60) return 15 + Math.floor(Math.random() * 3); // Afternoon
  if (rand < 0.75) return 9 + Math.floor(Math.random() * 2); // Mid-morning
  if (rand < 0.85) return 21 + Math.floor(Math.random() * 2); // Late evening
  return Math.floor(Math.random() * 24); // Random other hours
}

function getRegionModifier(region) {
  const modifiers = {
    'NCR': 1.5,
    'Region III': 1.3,
    'Region IV-A': 1.3,
    'Region VII': 1.25,
    'Region VI': 1.2,
    'Region X': 1.15,
    'Region XI': 1.15,
    'CAR': 1.1,
    'Region I': 1.05,
    'Region V': 1.05,
    'Region IX': 1.0,
    'Region XII': 1.0,
    'BARMM': 0.9,
    'Region VIII': 0.95,
    'Region II': 0.95,
    'Region XIII': 0.95,
    'Region IV-B': 0.9,
    'MIMAROPA': 0.85
  };
  return modifiers[region] || 1.0;
}

function getHourModifier(hour) {
  if (hour >= 11 && hour <= 13) return 1.4; // Lunch peak
  if (hour >= 18 && hour <= 20) return 1.3; // Dinner peak
  if (hour >= 7 && hour <= 9) return 1.2; // Morning rush
  if (hour >= 15 && hour <= 17) return 1.1; // Afternoon
  if (hour >= 21 && hour <= 23) return 0.9; // Late night
  if (hour >= 0 && hour <= 6) return 0.3; // Early morning
  return 1.0;
}

function getDayModifier(dayOfWeek) {
  // 0 = Sunday, 6 = Saturday
  return (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
}

function getCategoryModifier(category) {
  const modifiers = {
    'Beverages': 1.3,
    'Snacks': 1.2,
    'Food': 1.15,
    'Personal Care': 1.1,
    'Home Care': 1.05,
    'Tobacco': 1.0,
    'Dairy': 1.1,
    'Telecom': 0.8,
    'Utilities': 0.7
  };
  return modifiers[category] || 1.0;
}

function getPaymentMethod() {
  const rand = Math.random();
  if (rand < 0.53) return 'Cash'; // 53%
  if (rand < 0.91) return 'Utang/Lista'; // 38% store credit
  if (rand < 0.99) return 'GCash'; // 8% digital
  return 'Credit Card'; // 1% card
}

// Run the generation
generateYearTransactions();