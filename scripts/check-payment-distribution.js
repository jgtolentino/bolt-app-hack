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

async function checkPaymentDistribution() {
  console.log('💳 PAYMENT METHOD DISTRIBUTION CHECK\n');
  
  try {
    // Get recent transactions
    const { data: recentTrans, error: recentError } = await supabase
      .from('transactions')
      .select('id, payment_method, datetime')
      .order('datetime', { ascending: false })
      .limit(100);
    
    if (recentError) throw recentError;
    
    console.log('Recent transactions payment methods:');
    const recentMethods = {};
    recentTrans.forEach(t => {
      recentMethods[t.payment_method] = (recentMethods[t.payment_method] || 0) + 1;
    });
    
    Object.entries(recentMethods).forEach(([method, count]) => {
      console.log(`  ${method}: ${count}`);
    });
    
    // Get all unique payment methods
    const { data: allMethods, error: methodsError } = await supabase
      .rpc('get_unique_payment_methods');
    
    if (!methodsError && allMethods) {
      console.log('\nAll unique payment methods in database:', allMethods);
    }
    
    // Sample transactions from different date ranges
    console.log('\n📅 Payment methods by date range:');
    
    // January 2025
    const { data: jan2025 } = await supabase
      .from('transactions')
      .select('payment_method')
      .gte('datetime', '2025-01-01')
      .lt('datetime', '2025-02-01')
      .limit(100);
    
    if (jan2025) {
      const janMethods = {};
      jan2025.forEach(t => {
        janMethods[t.payment_method] = (janMethods[t.payment_method] || 0) + 1;
      });
      console.log('\nJanuary 2025:', janMethods);
    }
    
    // December 2025 (newly generated)
    const { data: dec2025 } = await supabase
      .from('transactions')
      .select('payment_method')
      .gte('datetime', '2025-12-01')
      .lt('datetime', '2026-01-01')
      .limit(100);
    
    if (dec2025) {
      const decMethods = {};
      dec2025.forEach(t => {
        decMethods[t.payment_method] = (decMethods[t.payment_method] || 0) + 1;
      });
      console.log('December 2025:', decMethods);
    }
    
    // Count total by payment method
    console.log('\n📊 Total transactions by payment method:');
    const paymentTypes = ['Cash', 'GCash', 'Utang/Lista', 'Credit Card'];
    
    for (const method of paymentTypes) {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('payment_method', method);
      
      if (count !== null && count > 0) {
        const percentage = ((count / 248909) * 100).toFixed(2);
        console.log(`  ${method}: ${count} (${percentage}%)`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentDistribution();