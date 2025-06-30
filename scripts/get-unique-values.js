import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getUniqueValues() {
  console.log('=== DATABASE UNIQUE VALUES SUMMARY ===\n');

  try {
    // Get unique regions
    console.log('📍 REGIONS:');
    const { data: regions, error: regionsError } = await supabase
      .from('geography')
      .select('region')
      .order('region');
    
    if (regionsError) throw regionsError;
    
    const uniqueRegions = [...new Set(regions.map(r => r.region))];
    console.log(`Total unique regions: ${uniqueRegions.length}`);
    uniqueRegions.forEach(region => console.log(`  - ${region}`));
    
    // Get unique cities per region
    console.log('\n🏙️ CITIES PER REGION:');
    const { data: cities, error: citiesError } = await supabase
      .from('geography')
      .select('region, city_municipality')
      .order('region, city_municipality');
    
    if (citiesError) throw citiesError;
    
    const citiesByRegion = {};
    cities.forEach(c => {
      if (!citiesByRegion[c.region]) citiesByRegion[c.region] = new Set();
      citiesByRegion[c.region].add(c.city_municipality);
    });
    
    Object.entries(citiesByRegion).forEach(([region, citySet]) => {
      console.log(`  ${region}: ${citySet.size} cities`);
    });
    
    // Get unique brands
    console.log('\n🏷️ BRANDS:');
    const { data: brands, error: brandsError } = await supabase
      .from('organization')
      .select('brand')
      .order('brand');
    
    if (brandsError) throw brandsError;
    
    const uniqueBrands = [...new Set(brands.map(b => b.brand))];
    console.log(`Total unique brands: ${uniqueBrands.length}`);
    uniqueBrands.forEach(brand => console.log(`  - ${brand}`));
    
    // Get unique categories
    console.log('\n📦 CATEGORIES:');
    const { data: categories, error: categoriesError } = await supabase
      .from('organization')
      .select('category')
      .order('category');
    
    if (categoriesError) throw categoriesError;
    
    const uniqueCategories = [...new Set(categories.map(c => c.category))];
    console.log(`Total unique categories: ${uniqueCategories.length}`);
    uniqueCategories.forEach(category => console.log(`  - ${category}`));
    
    // Get unique store types
    console.log('\n🏪 STORE TYPES:');
    const { data: storeTypes, error: storeTypesError } = await supabase
      .from('geography')
      .select('store_type')
      .order('store_type');
    
    if (storeTypesError) throw storeTypesError;
    
    const uniqueStoreTypes = [...new Set(storeTypes.map(s => s.store_type))];
    console.log(`Total unique store types: ${uniqueStoreTypes.length}`);
    uniqueStoreTypes.forEach(storeType => console.log(`  - ${storeType}`));
    
    // Get unique payment methods
    console.log('\n💳 PAYMENT METHODS:');
    const { data: paymentMethods, error: paymentMethodsError } = await supabase
      .from('transactions')
      .select('payment_method')
      .limit(1000); // Sample for performance
    
    if (paymentMethodsError) throw paymentMethodsError;
    
    const uniquePaymentMethods = [...new Set(paymentMethods.map(p => p.payment_method))];
    console.log(`Total unique payment methods: ${uniquePaymentMethods.length}`);
    uniquePaymentMethods.forEach(method => console.log(`  - ${method}`));
    
    // Get date range
    console.log('\n📅 DATE RANGE:');
    const { data: dateRange, error: dateRangeError } = await supabase
      .from('transactions')
      .select('datetime')
      .order('datetime', { ascending: true })
      .limit(1);
    
    const { data: latestDate, error: latestDateError } = await supabase
      .from('transactions')
      .select('datetime')
      .order('datetime', { ascending: false })
      .limit(1);
    
    if (!dateRangeError && !latestDateError && dateRange.length && latestDate.length) {
      console.log(`  Earliest transaction: ${new Date(dateRange[0].datetime).toLocaleDateString()}`);
      console.log(`  Latest transaction: ${new Date(latestDate[0].datetime).toLocaleDateString()}`);
    }
    
    // Get record counts
    console.log('\n📊 RECORD COUNTS:');
    const { count: geoCount } = await supabase.from('geography').select('*', { count: 'exact', head: true });
    const { count: orgCount } = await supabase.from('organization').select('*', { count: 'exact', head: true });
    const { count: transCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
    
    console.log(`  Geography records: ${geoCount}`);
    console.log(`  Organization records: ${orgCount}`);
    console.log(`  Transaction records: ${transCount}`);
    
    // Get sales summary by region
    console.log('\n💰 SALES BY REGION:');
    const { data: salesByRegion, error: salesError } = await supabase
      .from('transactions')
      .select('geography!inner(region), total_amount')
      .limit(10000); // Sample for performance
    
    if (!salesError && salesByRegion) {
      const regionSales = {};
      salesByRegion.forEach(t => {
        const region = t.geography.region;
        if (!regionSales[region]) regionSales[region] = 0;
        regionSales[region] += t.total_amount;
      });
      
      Object.entries(regionSales)
        .sort((a, b) => b[1] - a[1])
        .forEach(([region, total]) => {
          console.log(`  ${region}: ₱${total.toFixed(2)}`);
        });
    }
    
    // Get top products
    console.log('\n🏆 TOP 5 PRODUCTS BY SALES:');
    const { data: topProducts, error: topProductsError } = await supabase
      .from('transactions')
      .select('organization!inner(brand, sku_description), total_amount')
      .limit(10000); // Sample for performance
    
    if (!topProductsError && topProducts) {
      const productSales = {};
      topProducts.forEach(t => {
        const key = `${t.organization.brand} - ${t.organization.sku_description}`;
        if (!productSales[key]) productSales[key] = 0;
        productSales[key] += t.total_amount;
      });
      
      Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([product, total], index) => {
          console.log(`  ${index + 1}. ${product}: ₱${total.toFixed(2)}`);
        });
    }
    
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

getUniqueValues();