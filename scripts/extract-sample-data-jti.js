import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// JTI-relevant tobacco brands to search for
const JTI_BRANDS = ['Winston', 'Mighty', 'Mevius', 'Camel', 'LD'];
const TOBACCO_KEYWORDS = ['cigarette', 'tobacco', 'smoke', 'menthol'];

async function extractJTIData() {
  console.log('🚬 JTI DATA EXTRACTION TOOL\n');
  console.log('=' .repeat(60));
  
  const exportData = {
    metadata: {
      extractionDate: new Date().toISOString(),
      purpose: 'JTI Pitch - Sample Data Extract',
      recordCounts: {}
    },
    brands: [],
    products: [],
    stores: [],
    transactions: [],
    salesSummary: {},
    regionalAnalysis: {},
    competitorAnalysis: {}
  };

  try {
    // 1. Extract Brands (focus on tobacco category)
    console.log('\n📦 Extracting brands...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .or(`brand_name.ilike.%${JTI_BRANDS.join('%,brand_name.ilike.%')}%,category.ilike.%tobacco%,category.ilike.%cigarette%`)
      .limit(100);

    if (brandsError) {
      console.log('Note: brands table might not exist, checking products directly...');
    } else if (brands) {
      exportData.brands = brands;
      console.log(`✓ Found ${brands.length} tobacco-related brands`);
    }

    // 2. Extract Products (tobacco products)
    console.log('\n🚬 Extracting tobacco products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .or(
        JTI_BRANDS.map(brand => `product_name.ilike.%${brand}%`).join(',') + ',' +
        TOBACCO_KEYWORDS.map(keyword => `product_name.ilike.%${keyword}%`).join(',')
      )
      .limit(200);

    if (!productsError && products) {
      exportData.products = products;
      exportData.metadata.recordCounts.products = products.length;
      console.log(`✓ Found ${products.length} tobacco products`);
      
      // Show sample products
      if (products.length > 0) {
        console.log('\nSample products:');
        products.slice(0, 5).forEach(p => {
          console.log(`  - ${p.product_name} (${p.barcode || 'No barcode'})`);
        });
      }
    }

    // 3. Extract Stores (all stores for regional distribution)
    console.log('\n🏪 Extracting stores by region...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(1000);

    if (!storesError && stores) {
      exportData.stores = stores;
      exportData.metadata.recordCounts.stores = stores.length;
      
      // Group by region
      const storesByRegion = {};
      stores.forEach(store => {
        const region = store.region || 'Unknown';
        storesByRegion[region] = (storesByRegion[region] || 0) + 1;
      });
      
      exportData.regionalAnalysis.storeDistribution = storesByRegion;
      console.log(`✓ Found ${stores.length} stores across ${Object.keys(storesByRegion).length} regions`);
    }

    // 4. Extract Transactions (sample of 1000+)
    console.log('\n💰 Extracting transaction data...');
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_items!inner(
          product_id,
          quantity,
          unit_price,
          discount_amount
        )
      `)
      .order('transaction_datetime', { ascending: false })
      .limit(1500);

    if (!transError && transactions) {
      exportData.transactions = transactions;
      exportData.metadata.recordCounts.transactions = transactions.length;
      console.log(`✓ Found ${transactions.length} transactions`);
      
      // Calculate sales summary
      let totalSales = 0;
      let totalItems = 0;
      const salesByPaymentMethod = {};
      const salesByMonth = {};
      
      transactions.forEach(t => {
        totalSales += t.total_amount || 0;
        totalItems += t.transaction_items?.length || 0;
        
        // Payment method analysis
        const payment = t.payment_method || 'Unknown';
        salesByPaymentMethod[payment] = (salesByPaymentMethod[payment] || 0) + (t.total_amount || 0);
        
        // Monthly analysis
        if (t.transaction_datetime) {
          const month = new Date(t.transaction_datetime).toISOString().substring(0, 7);
          salesByMonth[month] = (salesByMonth[month] || 0) + (t.total_amount || 0);
        }
      });
      
      exportData.salesSummary = {
        totalSales,
        totalTransactions: transactions.length,
        totalItems,
        averageBasketSize: totalItems / transactions.length,
        averageTransactionValue: totalSales / transactions.length,
        salesByPaymentMethod,
        salesByMonth
      };
    }

    // 5. Look for any existing tobacco/JTI specific data
    console.log('\n🔍 Searching for JTI-specific data patterns...');
    
    // Check organization table for tobacco companies
    const { data: organizations, error: orgError } = await supabase
      .from('organization')
      .select('*')
      .or(
        `brand.ilike.%${JTI_BRANDS.join('%,brand.ilike.%')}%,` +
        `category.ilike.%tobacco%,category.ilike.%cigarette%`
      )
      .limit(100);

    if (!orgError && organizations) {
      console.log(`✓ Found ${organizations.length} tobacco-related organizations`);
      exportData.competitorAnalysis.organizations = organizations;
      
      // Extract unique brands and categories
      const uniqueBrands = [...new Set(organizations.map(o => o.brand).filter(Boolean))];
      const uniqueCategories = [...new Set(organizations.map(o => o.category).filter(Boolean))];
      
      exportData.competitorAnalysis.uniqueBrands = uniqueBrands;
      exportData.competitorAnalysis.uniqueCategories = uniqueCategories;
      
      if (uniqueBrands.length > 0) {
        console.log('\nTobacco brands found:');
        uniqueBrands.forEach(brand => console.log(`  - ${brand}`));
      }
    }

    // 6. Generate summary statistics
    exportData.metadata.summary = {
      hasJTIBrands: exportData.products.some(p => 
        JTI_BRANDS.some(brand => p.product_name?.toLowerCase().includes(brand.toLowerCase()))
      ),
      tobaccoProductCount: exportData.products.length,
      totalStores: exportData.stores.length,
      regions: Object.keys(exportData.regionalAnalysis.storeDistribution || {}),
      dateRange: {
        earliest: exportData.transactions[exportData.transactions.length - 1]?.transaction_datetime,
        latest: exportData.transactions[0]?.transaction_datetime
      }
    };

    // 7. Save to JSON file
    const outputPath = join(__dirname, '..', 'data', 'jti-sample-data.json');
    writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    
    console.log('\n✅ Data extraction complete!');
    console.log(`📁 Data saved to: ${outputPath}`);
    console.log('\n📊 SUMMARY:');
    console.log(`  - Tobacco/cigarette products: ${exportData.products.length}`);
    console.log(`  - Total stores: ${exportData.stores.length}`);
    console.log(`  - Sample transactions: ${exportData.transactions.length}`);
    console.log(`  - Has JTI brands: ${exportData.metadata.summary.hasJTIBrands ? 'Yes' : 'No'}`);
    
    // Also create a smaller sample file for quick review
    const sampleData = {
      metadata: exportData.metadata,
      sampleProducts: exportData.products.slice(0, 10),
      sampleStores: exportData.stores.slice(0, 10),
      sampleTransactions: exportData.transactions.slice(0, 10),
      salesSummary: exportData.salesSummary,
      regionalAnalysis: exportData.regionalAnalysis
    };
    
    const samplePath = join(__dirname, '..', 'data', 'jti-sample-preview.json');
    writeFileSync(samplePath, JSON.stringify(sampleData, null, 2));
    console.log(`\n📄 Sample preview saved to: ${samplePath}`);

  } catch (error) {
    console.error('❌ Error during extraction:', error);
    
    // Save partial data if available
    const errorPath = join(__dirname, '..', 'data', 'jti-extraction-partial.json');
    writeFileSync(errorPath, JSON.stringify(exportData, null, 2));
    console.log(`\n⚠️  Partial data saved to: ${errorPath}`);
  }
}

// Run the extraction
extractJTIData();