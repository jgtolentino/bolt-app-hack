import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { format } from 'date-fns';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// All Philippine regions
const PHILIPPINE_REGIONS = [
  'NCR',
  'Region I',
  'Region II',
  'Region III',
  'Region IV-A',
  'Region IV-B',
  'Region V',
  'Region VI',
  'Region VII',
  'Region VIII',
  'Region IX',
  'Region X',
  'Region XI',
  'Region XII',
  'Region XIII',
  'CAR',
  'CARAGA',
  'BARMM'
];

async function createRepresentativeSample() {
  console.log('🌏 Creating representative sample across all Philippine regions...\n');

  try {
    // Step 1: Get stores from each region
    console.log('📍 Fetching stores by region...');
    const storesByRegion = {};
    
    for (const region of PHILIPPINE_REGIONS) {
      const { data: stores, error } = await supabase
        .from('stores')
        .select('id, store_name, city')
        .eq('region', region)
        .limit(10);
      
      if (!error && stores && stores.length > 0) {
        storesByRegion[region] = stores;
        console.log(`✓ ${region}: ${stores.length} stores`);
      } else {
        console.log(`⚠️  ${region}: No stores found`);
      }
    }

    // Step 2: Calculate transactions per region for first 1000
    const regionsWithStores = Object.keys(storesByRegion);
    const transactionsPerRegion = Math.floor(1000 / regionsWithStores.length);
    const remainder = 1000 % regionsWithStores.length;
    
    console.log(`\n📊 Distribution plan:`);
    console.log(`- ${transactionsPerRegion} transactions per region`);
    console.log(`- ${remainder} extra for NCR (capital region)`);

    // Step 3: Get sample products and customers
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .limit(100);

    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .limit(200);

    const { data: cashiers } = await supabase
      .from('cashiers')
      .select('*')
      .limit(50);

    const { data: paymentMethods } = await supabase
      .from('payment_methods')
      .select('*');

    if (!products || !customers || !cashiers) {
      throw new Error('Failed to fetch required data');
    }

    // Step 4: Create representative transactions
    console.log('\n🔄 Creating representative transactions...');
    
    const allTransactions = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Start 30 days ago
    
    let transactionIndex = 0;
    
    for (const [regionIndex, region] of regionsWithStores.entries()) {
      const stores = storesByRegion[region];
      const regionTransactionCount = transactionsPerRegion + (region === 'NCR' ? remainder : 0);
      
      console.log(`\n${region}:`);
      
      for (let i = 0; i < regionTransactionCount; i++) {
        const store = stores[i % stores.length];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // Distribute transactions across the 30-day period
        const daysOffset = Math.floor((transactionIndex / 1000) * 30);
        const transactionDate = new Date(startDate);
        transactionDate.setDate(transactionDate.getDate() + daysOffset);
        
        // Add hourly variation (Philippine shopping patterns)
        const hour = getRealisticHour(region);
        transactionDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        
        // Create transaction
        const items = [];
        const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items
        let subtotal = 0;
        
        for (let j = 0; j < itemCount; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const lineTotal = product.current_price * quantity;
          subtotal += lineTotal;
          
          items.push({
            product_id: product.id,
            barcode: product.barcode,
            product_name: product.product_name,
            quantity,
            unit_price: product.current_price,
            discount_amount: 0,
            tax_amount: lineTotal * 0.12, // 12% VAT
            line_total: lineTotal,
            cost_price: product.cost_price,
            profit_amount: lineTotal - (product.cost_price * quantity)
          });
        }
        
        const taxAmount = subtotal * 0.12;
        const totalAmount = subtotal + taxAmount;
        
        const transaction = {
          receipt_number: `RCP-${String(transactionIndex + 1).padStart(6, '0')}`,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          transaction_time: format(transactionDate, 'HH:mm:ss'),
          transaction_datetime: transactionDate.toISOString(),
          store_id: store.id,
          cashier_id: cashier.id,
          customer_id: customer.id,
          subtotal,
          discount_amount: 0,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          payment_method: paymentMethod.method_name,
          payment_method_id: paymentMethod.id,
          items_count: itemCount,
          status: 'completed',
          sync_status: 'synced',
          duration_seconds: Math.floor(Math.random() * 300) + 60,
          basket_size_category: itemCount === 1 ? '1 item' : itemCount === 2 ? '2 items' : '3+ items',
          day_type: [0, 6].includes(transactionDate.getDay()) ? 'weekend' : 'weekday',
          items
        };
        
        allTransactions.push(transaction);
        transactionIndex++;
        
        if (i % 10 === 0) {
          process.stdout.write(`\r  Created ${i + 1}/${regionTransactionCount} transactions`);
        }
      }
      
      console.log(`\r  ✓ Created ${regionTransactionCount} transactions for ${region}`);
    }
    
    // Step 5: Insert transactions in batches
    console.log('\n\n💾 Inserting transactions into database...');
    
    const batchSize = 50;
    for (let i = 0; i < allTransactions.length; i += batchSize) {
      const batch = allTransactions.slice(i, i + batchSize);
      
      // Insert transactions
      const transactionsToInsert = batch.map(({ items, ...transaction }) => transaction);
      const { data: insertedTransactions, error: transError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select();
      
      if (transError) {
        console.error('Transaction insert error:', transError);
        continue;
      }
      
      // Insert transaction items
      for (let j = 0; j < insertedTransactions.length; j++) {
        const transaction = insertedTransactions[j];
        const items = batch[j].items.map(item => ({
          ...item,
          transaction_id: transaction.id
        }));
        
        const { error: itemError } = await supabase
          .from('transaction_items')
          .insert(items);
        
        if (itemError) {
          console.error('Item insert error:', itemError);
        }
      }
      
      process.stdout.write(`\r  Inserted ${Math.min(i + batchSize, allTransactions.length)}/${allTransactions.length} transactions`);
    }
    
    console.log('\n\n✅ Representative sample created successfully!');
    
    // Step 6: Verify the distribution
    console.log('\n📊 Verifying regional distribution:');
    
    const { data: verification } = await supabase
      .from('transactions')
      .select(`
        stores!inner(region)
      `)
      .order('created_at', { ascending: true })
      .limit(1000);
    
    const regionCounts = {};
    verification.forEach(t => {
      const region = t.stores.region;
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    
    Object.entries(regionCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([region, count]) => {
        console.log(`  ${region}: ${count} transactions (${(count / 10).toFixed(1)}%)`);
      });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Helper function to get realistic shopping hours by region
function getRealisticHour(region) {
  const urbanRegions = ['NCR', 'Region III', 'Region IV-A', 'Region VII'];
  const isUrban = urbanRegions.includes(region);
  
  // Urban areas have extended hours, rural areas close earlier
  const hours = isUrban
    ? [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
    : [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  
  // Weight towards peak hours (morning and evening)
  const weights = isUrban
    ? [2, 3, 3, 2, 1, 2, 3, 2, 1, 2, 3, 4, 4, 3, 2, 1]
    : [2, 3, 3, 2, 1, 2, 3, 2, 1, 2, 3, 4, 3];
  
  // Create weighted array
  const weightedHours = [];
  hours.forEach((hour, index) => {
    for (let i = 0; i < weights[index]; i++) {
      weightedHours.push(hour);
    }
  });
  
  return weightedHours[Math.floor(Math.random() * weightedHours.length)];
}

// Run the script
createRepresentativeSample();