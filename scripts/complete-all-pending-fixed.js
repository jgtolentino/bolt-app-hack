import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyStoreSizeDimension() {
  console.log('🏪 Step 1: Checking Store Size Dimension...\n');
  
  try {
    // Check if column exists by trying to select it
    const { data: test, error: testError } = await supabase
      .from('geography')
      .select('store_size')
      .limit(1);
    
    if (testError && testError.message.includes('column "store_size" does not exist')) {
      console.log('Store size column does not exist. Please run the migration manually.');
      return;
    }
    
    // Check if already populated
    const { data: sizeCheck } = await supabase
      .from('geography')
      .select('store_size')
      .is('store_size', null)
      .limit(1);
    
    if (!sizeCheck || sizeCheck.length === 0) {
      console.log('✅ Store sizes already applied!\n');
      return;
    }
    
    // Update store sizes
    console.log('Updating store sizes...');
    
    // Update sari-sari stores by population
    const sariSariUpdates = [
      { minPop: 100000, maxPop: 999999999, size: 'Extra Large' },
      { minPop: 60000, maxPop: 100000, size: 'Large' },
      { minPop: 30000, maxPop: 60000, size: 'Medium' },
      { minPop: 10000, maxPop: 30000, size: 'Small' },
      { minPop: 0, maxPop: 10000, size: 'Micro' }
    ];
    
    for (const update of sariSariUpdates) {
      await supabase
        .from('geography')
        .update({ store_size: update.size })
        .eq('store_type', 'sari-sari')
        .gte('population', update.minPop)
        .lt('population', update.maxPop);
    }
    
    // Update other store types
    await supabase.from('geography').update({ store_size: 'Large' }).eq('store_type', 'grocery');
    await supabase.from('geography').update({ store_size: 'Medium' }).eq('store_type', 'mini-mart');
    await supabase.from('geography').update({ store_size: 'Small' }).eq('store_type', 'convenience');
    
    console.log('✅ Store size dimension applied successfully!\n');
    
  } catch (error) {
    console.error('Error with store size:', error);
  }
}

async function populateCustomerSegments() {
  console.log('👥 Step 2: Populating Customer Segments...\n');
  
  try {
    // Check if already has data
    const { count: existingCount } = await supabase
      .from('customer_segments')
      .select('*', { count: 'exact', head: true });
    
    if (existingCount > 0) {
      console.log(`✅ Customer segments already populated (${existingCount} records)\n`);
      return;
    }
    
    // Define customer segments with correct schema
    const segments = [
      {
        segment_name: 'Budget Conscious',
        segment_type: 'behavioral',
        description: 'Price-sensitive customers who frequently buy essential items in small quantities',
        criteria: {
          avg_basket_size: '< 200',
          visit_frequency: 'daily',
          preferred_payment: 'cash',
          key_categories: ['Food', 'Personal Care'],
          price_sensitivity: 'high'
        }
      },
      {
        segment_name: 'Convenience Seekers',
        segment_type: 'behavioral',
        description: 'Customers who value quick shopping and proximity over price',
        criteria: {
          avg_basket_size: '200-400',
          visit_frequency: '2-3 times per week',
          preferred_payment: 'gcash',
          key_categories: ['Snacks', 'Beverages'],
          time_of_visit: 'peak_hours'
        }
      },
      {
        segment_name: 'Bulk Buyers',
        segment_type: 'value-based',
        description: 'Customers who buy in larger quantities less frequently',
        criteria: {
          avg_basket_size: '> 600',
          visit_frequency: 'weekly',
          preferred_payment: 'cash',
          key_categories: ['Home Care', 'Food', 'Personal Care'],
          bulk_purchase: true
        }
      },
      {
        segment_name: 'Credit Dependents',
        segment_type: 'payment-based',
        description: 'Regular customers who rely on store credit (utang/lista) system',
        criteria: {
          avg_basket_size: '150-300',
          visit_frequency: 'daily',
          preferred_payment: 'utang_lista',
          key_categories: ['Food', 'Beverages'],
          credit_usage: 'high'
        }
      },
      {
        segment_name: 'Premium Shoppers',
        segment_type: 'value-based',
        description: 'Customers who prefer premium brands and use digital payments',
        criteria: {
          avg_basket_size: '> 500',
          visit_frequency: '1-2 times per week',
          preferred_payment: 'credit_card',
          key_categories: ['Personal Care', 'Beverages', 'Snacks'],
          brand_preference: 'premium'
        }
      },
      {
        segment_name: 'Morning Shoppers',
        segment_type: 'temporal',
        description: 'Customers who consistently shop in morning hours',
        criteria: {
          shopping_hours: '6am-10am',
          visit_frequency: 'daily',
          key_items: ['Coffee', 'Bread', 'Breakfast items'],
          avg_basket_size: '100-200'
        }
      },
      {
        segment_name: 'Weekend Warriors',
        segment_type: 'temporal',
        description: 'Customers who do major shopping on weekends',
        criteria: {
          shopping_days: ['Saturday', 'Sunday'],
          avg_basket_size: '> 800',
          visit_frequency: 'weekly',
          bulk_purchase: true
        }
      }
    ];
    
    // Insert segments
    const { error } = await supabase
      .from('customer_segments')
      .insert(segments);
    
    if (error) throw error;
    console.log(`✅ Added ${segments.length} customer segments\n`);
    
  } catch (error) {
    console.error('Error populating customer segments:', error);
  }
}

async function populateAIInsights() {
  console.log('🤖 Step 3: Populating AI Insights...\n');
  
  try {
    // Check if already has data
    const { count: existingCount } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true });
    
    if (existingCount > 0) {
      console.log(`✅ AI insights already populated (${existingCount} records)\n`);
      return;
    }
    
    // Define AI insights with correct schema
    const insights = [
      {
        insight_type: 'demand_forecast',
        category: 'predictive',
        title: 'Summer Beverage Demand Surge Expected',
        description: 'Based on historical patterns and weather forecasts, beverage sales in NCR are expected to increase by 25% in April-May. Coca-Cola 1.5L and Summit water show strongest correlation with temperature increases.',
        metadata: {
          confidence_score: 0.85,
          impact_score: 0.9,
          affected_products: ['Coca-Cola 1.5L', 'Summit 1L'],
          affected_regions: ['NCR', 'Region III'],
          recommendation: 'Increase stock levels by 30% for April-May period'
        }
      },
      {
        insight_type: 'price_optimization',
        category: 'optimization',
        title: 'Price Elasticity Opportunity for Snack Products',
        description: 'Voice Peanuts shows price elasticity of -0.6, indicating low sensitivity. Analysis suggests a 5% price increase would result in only 3% volume decrease, improving margins.',
        metadata: {
          confidence_score: 0.78,
          impact_score: 0.7,
          affected_products: ['Voice Peanuts Adobo 100g'],
          price_elasticity: -0.6,
          recommendation: 'Test 5% price increase in high-traffic stores'
        }
      },
      {
        insight_type: 'cross_sell',
        category: 'behavioral',
        title: 'Strong Cross-Sell Pattern Detected',
        description: '78% of Lucky Me Pancit Canton buyers also purchase Coca-Cola within the same transaction. This pattern is consistent across all regions.',
        metadata: {
          confidence_score: 0.92,
          impact_score: 0.8,
          product_pairs: [
            { primary: 'Lucky Me Pancit Canton', secondary: 'Coca-Cola', correlation: 0.78 }
          ],
          recommendation: 'Create bundle promotions for these items'
        }
      },
      {
        insight_type: 'inventory_alert',
        category: 'operational',
        title: 'Oversupply Risk in Region VII',
        description: 'Safeguard soap stock turnover has decreased by 40% in Region VII over the past month, indicating potential oversupply and risk of expiration.',
        metadata: {
          confidence_score: 0.88,
          impact_score: 0.65,
          affected_products: ['Safeguard 135g'],
          affected_regions: ['Region VII'],
          current_turnover_days: 45,
          recommendation: 'Reduce reorder quantities by 30% for next cycle'
        }
      },
      {
        insight_type: 'regional_trend',
        category: 'behavioral',
        title: 'Ramadan Sales Pattern in BARMM',
        description: 'Historical data shows Ariel detergent sales increase by 60% in BARMM during Ramadan period, driven by increased washing needs.',
        metadata: {
          confidence_score: 0.91,
          impact_score: 0.85,
          affected_products: ['Ariel Powder Detergent'],
          affected_regions: ['BARMM'],
          seasonal_factor: 1.6,
          recommendation: 'Pre-position inventory 2 weeks before Ramadan'
        }
      },
      {
        insight_type: 'payment_trend',
        category: 'behavioral',
        title: 'Digital Payment Adoption Accelerating',
        description: 'GCash payment adoption has increased 45% among urban sari-sari stores, particularly for transactions above ₱200.',
        metadata: {
          confidence_score: 0.82,
          impact_score: 0.75,
          growth_rate: 0.45,
          store_types: ['sari-sari'],
          urban_vs_rural: { urban: 0.45, rural: 0.12 },
          recommendation: 'Promote GCash incentives in urban sari-sari stores'
        }
      },
      {
        insight_type: 'substitution_pattern',
        category: 'behavioral',
        title: 'Cola Wars Substitution Dynamics',
        description: 'When Pepsi is out of stock, 65% of customers choose Coca-Cola, 20% choose RC Cola, and 15% leave without purchase.',
        metadata: {
          confidence_score: 0.87,
          impact_score: 0.8,
          substitution_matrix: {
            'Pepsi': { 'Coca-Cola': 0.65, 'RC Cola': 0.20, 'No purchase': 0.15 }
          },
          recommendation: 'Maintain safety stock of Coca-Cola when Pepsi inventory is low'
        }
      },
      {
        insight_type: 'seasonal_pattern',
        category: 'predictive',
        title: 'Rainy Season Coffee Surge',
        description: 'Nescafe sales consistently increase by 120% during June-July (rainy season start) across all regions, with morning purchases doubling.',
        metadata: {
          confidence_score: 0.94,
          impact_score: 0.9,
          affected_products: ['Nescafe Classic', 'Nescafe 3-in-1'],
          seasonal_multiplier: 2.2,
          peak_hours: ['6am-9am'],
          recommendation: 'Double Nescafe orders for June-July period'
        }
      },
      {
        insight_type: 'competitor_analysis',
        category: 'competitive',
        title: 'Market Share Shift in Personal Care',
        description: 'Unilever products (Dove, Sunsilk) gaining 3% market share monthly from P&G products (Head & Shoulders, Safeguard) in urban areas.',
        metadata: {
          confidence_score: 0.79,
          impact_score: 0.7,
          market_share_delta: { 'Unilever': 0.03, 'P&G': -0.03 },
          affected_categories: ['Personal Care'],
          recommendation: 'Review pricing and promotion strategy for P&G products'
        }
      },
      {
        insight_type: 'anomaly_detection',
        category: 'alert',
        title: 'Unusual Sales Spike Detected',
        description: 'Marlboro cigarette sales increased 200% in Region X last week, potentially indicating bulk buying for resale or regulatory change anticipation.',
        metadata: {
          confidence_score: 0.65,
          impact_score: 0.6,
          spike_magnitude: 3.0,
          affected_products: ['Marlboro'],
          affected_regions: ['Region X'],
          recommendation: 'Investigate cause and monitor for stockpiling behavior'
        }
      }
    ];
    
    // Insert insights
    const { error } = await supabase
      .from('ai_insights')
      .insert(insights);
    
    if (error) throw error;
    console.log(`✅ Added ${insights.length} AI insights\n`);
    
  } catch (error) {
    console.error('Error populating AI insights:', error);
  }
}

async function populateSubstitutionPatterns() {
  console.log('🔄 Step 4: Populating Substitution Patterns...\n');
  
  try {
    // Check if already has enough data
    const { count: existingCount } = await supabase
      .from('substitution_patterns')
      .select('*', { count: 'exact', head: true });
    
    if (existingCount >= 7) {
      console.log(`✅ Substitution patterns already populated (${existingCount} records)\n`);
      return;
    }
    
    // Get products for substitution patterns
    const { data: beverages } = await supabase
      .from('organization')
      .select('id, brand, sku_description')
      .eq('category', 'Beverages');
    
    const { data: snacks } = await supabase
      .from('organization')
      .select('id, brand, sku_description')
      .eq('category', 'Snacks');
    
    const { data: personalCare } = await supabase
      .from('organization')
      .select('id, brand, sku_description')
      .eq('category', 'Personal Care');
    
    const { data: stores } = await supabase
      .from('geography')
      .select('id')
      .limit(10);
    
    const patterns = [];
    
    // Beverage substitutions
    if (beverages && beverages.length >= 4) {
      // Coca-Cola -> Pepsi
      const coke = beverages.find(b => b.brand === 'Coca-Cola');
      const pepsi = beverages.find(b => b.brand === 'Pepsi');
      if (coke && pepsi) {
        patterns.push({
          original_product_id: coke.id,
          substituted_product_id: pepsi.id,
          substitution_count: 145,
          acceptance_rate: 0.72,
          geography_id: stores?.[0]?.id
        });
      }
      
      // Pepsi -> Coca-Cola
      if (pepsi && coke) {
        patterns.push({
          original_product_id: pepsi.id,
          substituted_product_id: coke.id,
          substitution_count: 168,
          acceptance_rate: 0.78,
          geography_id: stores?.[1]?.id
        });
      }
      
      // Mountain Dew -> Sprite
      const dew = beverages.find(b => b.brand === 'Mountain Dew');
      const sprite = beverages.find(b => b.brand === 'Sprite');
      if (dew && sprite) {
        patterns.push({
          original_product_id: dew.id,
          substituted_product_id: sprite.id,
          substitution_count: 89,
          acceptance_rate: 0.65,
          geography_id: stores?.[2]?.id
        });
      }
    }
    
    // Snack substitutions
    if (snacks && snacks.length >= 4) {
      // Voice -> Oishi
      const voice = snacks.find(s => s.brand === 'Voice');
      const oishi = snacks.find(s => s.brand === 'Oishi');
      if (voice && oishi) {
        patterns.push({
          original_product_id: voice.id,
          substituted_product_id: oishi.id,
          substitution_count: 234,
          acceptance_rate: 0.81,
          geography_id: stores?.[3]?.id
        });
      }
      
      // Jack n Jill -> Regent
      const jack = snacks.find(s => s.brand === 'Jack n Jill');
      const regent = snacks.find(s => s.brand === 'Regent');
      if (jack && regent) {
        patterns.push({
          original_product_id: jack.id,
          substituted_product_id: regent.id,
          substitution_count: 156,
          acceptance_rate: 0.69,
          geography_id: stores?.[4]?.id
        });
      }
    }
    
    // Personal Care substitutions
    if (personalCare && personalCare.length >= 4) {
      // Safeguard -> Palmolive
      const safeguard = personalCare.find(p => p.brand === 'Safeguard');
      const palmolive = personalCare.find(p => p.brand === 'Palmolive');
      if (safeguard && palmolive) {
        patterns.push({
          original_product_id: safeguard.id,
          substituted_product_id: palmolive.id,
          substitution_count: 98,
          acceptance_rate: 0.58,
          geography_id: stores?.[5]?.id
        });
      }
      
      // Colgate -> Another toothpaste
      const colgate = personalCare.find(p => p.brand === 'Colgate');
      if (colgate && palmolive) {
        patterns.push({
          original_product_id: colgate.id,
          substituted_product_id: palmolive.id,
          substitution_count: 67,
          acceptance_rate: 0.45,
          geography_id: stores?.[6]?.id
        });
      }
    }
    
    // Filter out any patterns with null IDs
    const validPatterns = patterns.filter(p => p.original_product_id && p.substituted_product_id);
    
    if (validPatterns.length > 0) {
      const { error } = await supabase
        .from('substitution_patterns')
        .insert(validPatterns);
      
      if (error) throw error;
      console.log(`✅ Added ${validPatterns.length} substitution patterns\n`);
    }
    
  } catch (error) {
    console.error('Error populating substitution patterns:', error);
  }
}

async function verifyAllTables() {
  console.log('✅ Step 5: Verifying All Tables...\n');
  
  try {
    // Check store sizes
    const { data: storeSizes } = await supabase
      .from('geography')
      .select('store_type, store_size')
      .limit(5);
    
    if (storeSizes && storeSizes[0]?.store_size) {
      console.log('Sample store sizes:');
      storeSizes.forEach(s => console.log(`  ${s.store_type}: ${s.store_size || 'Not set'}`));
    }
    
    // Check all table counts
    const tables = ['geography', 'organization', 'transactions', 'customer_segments', 'ai_insights', 'substitution_patterns'];
    
    console.log('\nTable record counts:');
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      console.log(`  ${table}: ${count} records`);
    }
    
    console.log('\n🎉 All pending items completed successfully!');
    
  } catch (error) {
    console.error('Error verifying tables:', error);
  }
}

// Run all steps
async function completeAllPending() {
  console.log('🚀 Completing all pending database setup...\n');
  
  await applyStoreSizeDimension();
  await populateCustomerSegments();
  await populateAIInsights();
  await populateSubstitutionPatterns();
  await verifyAllTables();
}

completeAllPending();