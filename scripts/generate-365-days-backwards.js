import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Payment methods with Philippine-specific distribution
const paymentMethods = [
  { method: 'Cash', weight: 0.65 },
  { method: 'GCash', weight: 0.20 },
  { method: 'Utang/Lista', weight: 0.12 },
  { method: 'Credit Card', weight: 0.03 }
];

// Store type patterns
const storeTypePatterns = {
  'sari-sari': {
    peakHours: [7, 8, 9, 17, 18, 19],
    openHour: 6,
    closeHour: 21
  },
  'grocery': {
    peakHours: [10, 11, 14, 15, 16, 17, 18],
    openHour: 8,
    closeHour: 20
  },
  'mini-mart': {
    peakHours: [8, 9, 12, 13, 17, 18, 19],
    openHour: 7,
    closeHour: 22
  },
  'convenience': {
    peakHours: [7, 8, 9, 12, 17, 18, 19, 20, 21],
    openHour: 0,
    closeHour: 24
  }
};

function getRandomPaymentMethod() {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const pm of paymentMethods) {
    cumulative += pm.weight;
    if (rand <= cumulative) {
      return pm.method;
    }
  }
  
  return 'Cash';
}

function generateTransactionTime(date, storeType) {
  const pattern = storeTypePatterns[storeType] || storeTypePatterns['sari-sari'];
  
  let hour;
  if (Math.random() < 0.7 && pattern.peakHours.length > 0) {
    hour = pattern.peakHours[Math.floor(Math.random() * pattern.peakHours.length)];
  } else {
    const openHours = [];
    for (let h = pattern.openHour; h < pattern.closeHour; h++) {
      openHours.push(h);
    }
    hour = openHours[Math.floor(Math.random() * openHours.length)];
  }
  
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, second);
}

async function generate365DaysBackwards() {
  console.log('🗓️ Generating transactions for 365 days backwards from June 30, 2025...\n');
  
  try {
    // First, clear existing transactions if needed
    console.log('🧹 Clearing existing transactions...');
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.log('Warning: Could not clear existing transactions:', deleteError.message);
    }
    
    // Get all geography and organization data
    const { data: geography, error: geoError } = await supabase
      .from('geography')
      .select('*')
      .order('id');
    
    if (geoError) throw geoError;
    console.log(`✓ Loaded ${geography.length} stores`);
    
    const { data: products, error: prodError } = await supabase
      .from('organization')
      .select('*')
      .order('id');
    
    if (prodError) throw prodError;
    console.log(`✓ Loaded ${products.length} products\n`);
    
    const endDate = new Date('2025-06-30');
    const startDate = new Date('2024-06-30');
    
    console.log(`📅 Date range: ${startDate.toDateString()} to ${endDate.toDateString()}\n`);
    
    const batchSize = 500;
    const totalDays = 365;
    let totalGenerated = 0;
    
    // Generate transactions for each day
    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      // Vary transactions per day (200-800 per day)
      const transactionsToday = Math.floor(Math.random() * 600) + 200;
      const transactions = [];
      
      for (let i = 0; i < transactionsToday; i++) {
        const store = geography[Math.floor(Math.random() * geography.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        
        const transactionTime = generateTransactionTime(currentDate, store.store_type);
        
        // Calculate quantity
        let quantity;
        if (store.store_type === 'sari-sari') {
          quantity = Math.floor(Math.random() * 3) + 1;
        } else if (product.category === 'Beverages' || product.category === 'Snacks') {
          quantity = Math.floor(Math.random() * 5) + 1;
        } else {
          quantity = Math.floor(Math.random() * 3) + 1;
        }
        
        // Calculate total amount
        const baseAmount = product.unit_price * quantity;
        const discount = Math.random() < 0.1 ? Math.random() * 0.1 : 0;
        const totalAmount = Number((baseAmount * (1 - discount)).toFixed(2));
        
        transactions.push({
          datetime: transactionTime.toISOString(),
          geography_id: store.id,
          organization_id: product.id,
          quantity: quantity,
          unit_price: product.unit_price,
          total_amount: totalAmount,
          payment_method: getRandomPaymentMethod()
        });
        
        // Insert in batches
        if (transactions.length >= batchSize) {
          const { error: insertError } = await supabase
            .from('transactions')
            .insert(transactions);
          
          if (insertError) throw insertError;
          
          totalGenerated += transactions.length;
          transactions.length = 0;
        }
      }
      
      // Insert remaining transactions for the day
      if (transactions.length > 0) {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(transactions);
        
        if (insertError) throw insertError;
        totalGenerated += transactions.length;
      }
      
      // Progress update every 30 days
      if ((dayOffset + 1) % 30 === 0) {
        console.log(`✓ Generated ${dayOffset + 1}/${totalDays} days (${totalGenerated} transactions)`);
      }
    }
    
    // Final stats
    const { count: finalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n✅ Generation complete!`);
    console.log(`Total transactions: ${finalCount}`);
    console.log(`Date range: ${startDate.toDateString()} - ${endDate.toDateString()}`);
    
    // Verify date range
    const { data: dateCheck } = await supabase
      .from('transactions')
      .select('datetime')
      .order('datetime', { ascending: true })
      .limit(1);
    
    const { data: latestDate } = await supabase
      .from('transactions')
      .select('datetime')
      .order('datetime', { ascending: false })
      .limit(1);
    
    if (dateCheck && latestDate) {
      console.log(`\nActual date range in database:`);
      console.log(`First: ${new Date(dateCheck[0].datetime).toDateString()}`);
      console.log(`Last: ${new Date(latestDate[0].datetime).toDateString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the generation
generate365DaysBackwards();