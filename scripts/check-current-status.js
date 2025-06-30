import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentStatus() {
  console.log('📊 CURRENT DATABASE STATUS\n');
  
  try {
    // Get total count
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`Total transactions: ${count}`);
    
    // Get date range
    const { data: earliest } = await supabase
      .from('transactions')
      .select('datetime')
      .order('datetime', { ascending: true })
      .limit(1);
    
    const { data: latest } = await supabase
      .from('transactions')
      .select('datetime')
      .order('datetime', { ascending: false })
      .limit(1);
    
    if (earliest?.[0] && latest?.[0]) {
      console.log(`\nDate range:`);
      console.log(`  Earliest: ${new Date(earliest[0].datetime).toLocaleString()}`);
      console.log(`  Latest: ${new Date(latest[0].datetime).toLocaleString()}`);
      
      const earliestDate = new Date(earliest[0].datetime);
      const latestDate = new Date(latest[0].datetime);
      const daysDiff = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24));
      console.log(`  Days covered: ${daysDiff} days`);
    }
    
    // Check transactions by month
    console.log('\n📅 Transactions by month:');
    const months = ['2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', 
                   '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'];
    
    for (const month of months) {
      const { count: monthCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .gte('datetime', `${month}-01`)
        .lt('datetime', `${month === '2025-06' ? '2025-07' : month.substring(0, 7) + '-' + (parseInt(month.substring(5, 7)) + 1).toString().padStart(2, '0')}-01`);
      
      if (monthCount > 0) {
        console.log(`  ${month}: ${monthCount} transactions`);
      }
    }
    
    // Payment method distribution
    console.log('\n💳 Payment methods:');
    const paymentTypes = ['Cash', 'GCash', 'Utang/Lista', 'Credit Card'];
    
    for (const method of paymentTypes) {
      const { count: methodCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('payment_method', method);
      
      if (methodCount > 0) {
        const percentage = ((methodCount / count) * 100).toFixed(1);
        console.log(`  ${method}: ${methodCount} (${percentage}%)`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCurrentStatus();