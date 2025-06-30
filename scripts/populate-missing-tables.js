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

async function populateCustomerSegments() {
  console.log('👥 Populating Customer Segments...\n');
  
  const segments = [
    {
      segment_name: 'Budget Conscious Buyers',
      segment_type: 'behavioral',
      description: 'Price-sensitive customers who frequently buy essential items in small quantities',
      criteria: {
        avg_basket_size: '< 200',
        visit_frequency: 'daily',
        preferred_payment: 'cash',
        key_categories: ['Food', 'Personal Care'],
        price_sensitivity: 'high'
      },
      customer_count: 4250,
      avg_transaction_value: 157.50,
      total_revenue: 669375.00
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
      },
      customer_count: 3100,
      avg_transaction_value: 285.75,
      total_revenue: 885825.00
    },
    {
      segment_name: 'Bulk Buyers',
      segment_type: 'behavioral',
      description: 'Customers who buy in larger quantities less frequently',
      criteria: {
        avg_basket_size: '> 600',
        visit_frequency: 'weekly',
        preferred_payment: 'cash',
        key_categories: ['Home Care', 'Food', 'Personal Care'],
        bulk_purchase: true
      },
      customer_count: 1850,
      avg_transaction_value: 725.50,
      total_revenue: 1342175.00
    },
    {
      segment_name: 'Credit Dependents',
      segment_type: 'behavioral',
      description: 'Regular customers who rely on store credit (utang/lista) system',
      criteria: {
        avg_basket_size: '150-300',
        visit_frequency: 'daily',
        preferred_payment: 'utang_lista',
        key_categories: ['Food', 'Beverages'],
        credit_usage: 'high',
        payment_delay_days: '7-30'
      },
      customer_count: 2500,
      avg_transaction_value: 225.00,
      total_revenue: 562500.00
    },
    {
      segment_name: 'Premium Shoppers',
      segment_type: 'behavioral',
      description: 'Customers who prefer premium brands and use digital payments',
      criteria: {
        avg_basket_size: '> 500',
        visit_frequency: '1-2 times per week',
        preferred_payment: 'credit_card',
        key_categories: ['Personal Care', 'Beverages', 'Snacks'],
        brand_preference: 'premium'
      },
      customer_count: 650,
      avg_transaction_value: 875.25,
      total_revenue: 568912.50
    },
    {
      segment_name: 'Morning Regulars',
      segment_type: 'temporal',
      description: 'Customers who consistently shop in morning hours for daily essentials',
      criteria: {
        shopping_hours: '6am-10am',
        visit_frequency: 'daily',
        key_items: ['Coffee', 'Bread', 'Breakfast items', 'Newspapers'],
        avg_basket_size: '100-200'
      },
      customer_count: 1800,
      avg_transaction_value: 145.50,
      total_revenue: 261900.00
    },
    {
      segment_name: 'Weekend Warriors',
      segment_type: 'temporal', 
      description: 'Customers who do major shopping on weekends',
      criteria: {
        shopping_days: ['Saturday', 'Sunday'],
        avg_basket_size: '> 800',
        visit_frequency: 'weekly',
        bulk_purchase: true,
        family_shopping: true
      },
      customer_count: 2200,
      avg_transaction_value: 925.75,
      total_revenue: 2036650.00
    },
    {
      segment_name: 'Digital Natives',
      segment_type: 'demographic',
      description: 'Young professionals who prefer cashless transactions',
      criteria: {
        age_range: '18-35',
        payment_preference: ['gcash', 'paymaya', 'credit_card'],
        shopping_time: 'after_work_hours',
        categories: ['Snacks', 'Beverages', 'Personal Care']
      },
      customer_count: 1750,
      avg_transaction_value: 312.50,
      total_revenue: 546875.00
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('customer_segments')
      .insert(segments)
      .select();
    
    if (error) throw error;
    console.log(`✅ Added ${segments.length} customer segments successfully!\n`);
    return data;
  } catch (error) {
    console.error('❌ Error populating customer segments:', error.message);
    return null;
  }
}

async function populateAIInsights() {
  console.log('🤖 Populating AI Insights...\n');
  
  const insights = [
    {
      insight_type: 'prediction',
      category: 'sales',
      severity: 'opportunity',
      title: 'Summer Beverage Demand Surge Expected',
      description: 'Based on historical patterns and weather forecasts, beverage sales in NCR are expected to increase by 25% in April-May. Coca-Cola 1.5L and Summit water show strongest correlation with temperature increases.',
      data: {
        confidence_score: 0.85,
        impact_score: 0.9,
        affected_products: ['Coca-Cola 1.5L', 'Summit 1L', 'Sprite 1.5L'],
        affected_regions: ['NCR', 'Region III', 'Region IV-A'],
        expected_increase: 0.25,
        temperature_correlation: 0.78
      },
      action_items: [
        'Increase beverage stock levels by 30% for April-May',
        'Negotiate bulk discounts with Coca-Cola distributor',
        'Prepare promotional campaigns for cold beverages',
        'Ensure refrigeration capacity is adequate'
      ],
      expires_at: new Date('2025-05-31')
    },
    {
      insight_type: 'recommendation',
      category: 'pricing',
      severity: 'opportunity',
      title: 'Price Optimization Opportunity for Voice Peanuts',
      description: 'Voice Peanuts Adobo shows price elasticity of -0.6, indicating low sensitivity. Analysis suggests a 5% price increase would result in only 3% volume decrease, improving margins by 4.2%.',
      data: {
        confidence_score: 0.78,
        current_price: 25,
        recommended_price: 26.25,
        price_elasticity: -0.6,
        expected_volume_change: -0.03,
        expected_margin_improvement: 0.042,
        competitor_prices: { 'Oishi': 24, 'Jack n Jill': 27 }
      },
      action_items: [
        'Test 5% price increase in 10 high-traffic stores',
        'Monitor daily sales volume for 2 weeks',
        'Compare with competitor pricing',
        'Roll out to all stores if test is successful'
      ]
    },
    {
      insight_type: 'recommendation',
      category: 'customer',
      severity: 'opportunity',
      title: 'Strong Cross-Sell Pattern: Lucky Me + Coca-Cola',
      description: '78% of Lucky Me Pancit Canton buyers also purchase Coca-Cola within the same transaction. This pattern is consistent across all regions and store types.',
      data: {
        confidence_score: 0.92,
        correlation: 0.78,
        product_pairs: [
          { primary: 'Lucky Me Pancit Canton', secondary: 'Coca-Cola', rate: 0.78 },
          { primary: 'Lucky Me Pancit Canton', secondary: 'C2', rate: 0.45 }
        ],
        average_basket_increase: 35.50
      },
      action_items: [
        'Create "Meal Deal" bundles with discount',
        'Place products near each other in stores',
        'Train staff to suggest combo purchases',
        'Create promotional signage for bundle'
      ]
    },
    {
      insight_type: 'anomaly',
      category: 'inventory',
      severity: 'warning',
      title: 'Slow-Moving Inventory Alert: Safeguard in Region VII',
      description: 'Safeguard soap stock turnover has decreased by 40% in Region VII over the past month. Current inventory levels risk expiration.',
      data: {
        current_turnover_days: 45,
        normal_turnover_days: 27,
        units_at_risk: 450,
        expiration_risk_date: '2025-08-15',
        affected_stores: 5,
        inventory_value: 33750
      },
      action_items: [
        'Reduce reorder quantities by 30% immediately',
        'Launch promotional campaign in Region VII',
        'Consider inter-region transfer to high-demand areas',
        'Review competitor activity in the region'
      ]
    },
    {
      insight_type: 'trend',
      category: 'sales',
      severity: 'info',
      title: 'Ramadan Sales Pattern Detected in BARMM',
      description: 'Historical data shows predictable sales patterns during Ramadan in BARMM region. Ariel detergent increases 60%, food items increase 40%.',
      data: {
        confidence_score: 0.91,
        seasonal_multipliers: {
          'Ariel': 1.6,
          'Food': 1.4,
          'Beverages': 0.8,
          'Personal Care': 1.3
        },
        affected_regions: ['BARMM'],
        pattern_duration_days: 30
      },
      action_items: [
        'Pre-position inventory 2 weeks before Ramadan',
        'Increase Ariel orders by 70% for the period',
        'Prepare Ramadan-specific product displays',
        'Train staff on cultural sensitivity'
      ]
    },
    {
      insight_type: 'trend',
      category: 'customer',
      severity: 'info',
      title: 'Digital Payment Adoption Accelerating',
      description: 'GCash adoption has increased 45% among urban sari-sari stores. Transactions above ₱200 show highest digital payment usage.',
      data: {
        growth_rate: 0.45,
        current_adoption: 0.20,
        urban_vs_rural: { urban: 0.35, rural: 0.08 },
        transaction_threshold: 200,
        age_correlation: { '18-25': 0.65, '26-35': 0.45, '36+': 0.25 }
      },
      action_items: [
        'Promote GCash cashback incentives',
        'Install QR code payments in all urban stores',
        'Train staff on digital payment assistance',
        'Consider transaction fee absorption for amounts > ₱500'
      ]
    },
    {
      insight_type: 'anomaly',
      category: 'sales',
      severity: 'critical',
      title: 'Unusual Sales Spike: Marlboro in Region X',
      description: 'Marlboro cigarette sales increased 200% in Region X last week. Pattern suggests bulk buying possibly due to anticipated tax increase.',
      data: {
        spike_magnitude: 3.0,
        normal_weekly_units: 450,
        spike_week_units: 1350,
        affected_stores: 3,
        concentration: 'single_customer_suspected'
      },
      action_items: [
        'Investigate if regulatory changes are coming',
        'Check for bulk buyer patterns',
        'Monitor for potential smuggling activity',
        'Report unusual patterns to management'
      ]
    },
    {
      insight_type: 'prediction',
      category: 'sales',
      severity: 'opportunity',
      title: 'Rainy Season Coffee Surge Approaching',
      description: 'June-July rainy season historically drives 120% increase in coffee sales. Nescafe and hot beverage categories show strongest growth.',
      data: {
        confidence_score: 0.94,
        seasonal_multiplier: 2.2,
        peak_categories: ['Coffee', 'Tea', 'Hot Chocolate'],
        peak_hours: ['6am-9am', '3pm-6pm'],
        weather_correlation: 0.85
      },
      action_items: [
        'Double Nescafe orders for June-July',
        'Ensure hot water dispensers are functional',
        'Create "Rainy Day" promotional campaigns',
        'Stock up on complementary items (biscuits, bread)'
      ]
    },
    {
      insight_type: 'recommendation',
      category: 'inventory',
      severity: 'warning',
      title: 'Optimize Store Layout Based on Traffic Patterns',
      description: 'Analysis shows 65% of customers follow predictable paths. High-margin impulse items are not optimally placed.',
      data: {
        traffic_patterns: {
          'entrance_to_beverages': 0.65,
          'beverages_to_snacks': 0.78,
          'checkout_impulse': 0.35
        },
        missed_revenue_opportunity: 125000,
        high_margin_exposure: 0.35
      },
      action_items: [
        'Move high-margin snacks near beverage section',
        'Create impulse buy displays at checkout',
        'Use floor stickers to guide traffic',
        'A/B test different layouts in select stores'
      ]
    },
    {
      insight_type: 'trend',
      category: 'customer',
      severity: 'info',
      title: 'Shift in Brand Preference: Personal Care',
      description: 'Unilever brands gaining 3% monthly market share from P&G in urban areas. Driven by aggressive pricing and promotions.',
      data: {
        market_share_delta: { 'Unilever': 0.03, 'P&G': -0.03 },
        key_products: {
          gaining: ['Dove', 'Sunsilk', 'Close Up'],
          losing: ['Safeguard', 'Head & Shoulders', 'Pantene']
        },
        price_differential: -0.12
      },
      action_items: [
        'Review P&G product pricing strategy',
        'Negotiate better terms with P&G',
        'Consider exclusive promotions for P&G products',
        'Monitor customer feedback on product switches'
      ]
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .insert(insights)
      .select();
    
    if (error) throw error;
    console.log(`✅ Added ${insights.length} AI insights successfully!\n`);
    return data;
  } catch (error) {
    console.error('❌ Error populating AI insights:', error.message);
    return null;
  }
}

async function verifyTables() {
  console.log('🔍 Verifying populated tables...\n');
  
  try {
    // Check customer_segments
    const { count: csCount, error: csError } = await supabase
      .from('customer_segments')
      .select('*', { count: 'exact', head: true });
    
    if (csError) {
      console.log('❌ customer_segments table not accessible:', csError.message);
    } else {
      console.log(`✅ customer_segments: ${csCount} records`);
    }
    
    // Check ai_insights
    const { count: aiCount, error: aiError } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true });
    
    if (aiError) {
      console.log('❌ ai_insights table not accessible:', aiError.message);
    } else {
      console.log(`✅ ai_insights: ${aiCount} records`);
    }
    
    // Show sample data
    if (!csError && csCount > 0) {
      const { data: sampleSegments } = await supabase
        .from('customer_segments')
        .select('segment_name, segment_type, customer_count')
        .limit(3);
      
      console.log('\nSample Customer Segments:');
      sampleSegments?.forEach(s => {
        console.log(`  - ${s.segment_name} (${s.segment_type}): ${s.customer_count} customers`);
      });
    }
    
    if (!aiError && aiCount > 0) {
      const { data: sampleInsights } = await supabase
        .from('ai_insights')
        .select('title, insight_type, severity')
        .limit(3);
      
      console.log('\nSample AI Insights:');
      sampleInsights?.forEach(i => {
        console.log(`  - ${i.title} (${i.insight_type}, ${i.severity})`);
      });
    }
    
  } catch (error) {
    console.error('Error verifying tables:', error);
  }
}

async function populateMissingTables() {
  console.log('🚀 Starting table population process...\n');
  
  // Check if tables exist first
  const { error: csCheck } = await supabase
    .from('customer_segments')
    .select('id')
    .limit(1);
  
  const { error: aiCheck } = await supabase
    .from('ai_insights')
    .select('id')
    .limit(1);
  
  if (csCheck && csCheck.code === '42P01') {
    console.log('❌ customer_segments table does not exist!');
    console.log('Please run the SQL commands from apply-missing-tables.js first.\n');
    return;
  }
  
  if (aiCheck && aiCheck.code === '42P01') {
    console.log('❌ ai_insights table does not exist!');
    console.log('Please run the SQL commands from apply-missing-tables.js first.\n');
    return;
  }
  
  // Populate tables
  await populateCustomerSegments();
  await populateAIInsights();
  
  // Verify
  await verifyTables();
  
  console.log('\n✅ Table population complete!');
}

populateMissingTables();