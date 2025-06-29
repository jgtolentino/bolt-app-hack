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

// Comprehensive seed data for Philippine retail
const seedData = {
  // All Philippine regions with proper distribution
  geography: [
    // NCR - National Capital Region (35% weight)
    { region: 'NCR', city_municipality: 'Manila', barangay: 'Tondo', store_name: 'Aling Nena Store', latitude: 14.6042, longitude: 120.9822, population: 628903, area_sqkm: 42.88, store_type: 'sari-sari' },
    { region: 'NCR', city_municipality: 'Manila', barangay: 'Binondo', store_name: 'Mang Juan Sari-Sari', latitude: 14.6000, longitude: 120.9740, population: 12985, area_sqkm: 0.66, store_type: 'sari-sari' },
    { region: 'NCR', city_municipality: 'Manila', barangay: 'Quiapo', store_name: 'Ate Rose Store', latitude: 14.5995, longitude: 120.9842, population: 24886, area_sqkm: 0.84, store_type: 'sari-sari' },
    { region: 'NCR', city_municipality: 'Quezon City', barangay: 'Commonwealth', store_name: 'Commonwealth Mart', latitude: 14.7103, longitude: 121.0853, population: 198285, area_sqkm: 5.80, store_type: 'grocery' },
    { region: 'NCR', city_municipality: 'Quezon City', barangay: 'Cubao', store_name: 'Cubao Central Store', latitude: 14.6177, longitude: 121.0567, population: 45678, area_sqkm: 2.34, store_type: 'sari-sari' },
    { region: 'NCR', city_municipality: 'Makati', barangay: 'Poblacion', store_name: 'Makati Convenience', latitude: 14.5649, longitude: 121.0302, population: 37879, area_sqkm: 1.71, store_type: 'convenience' },
    { region: 'NCR', city_municipality: 'Makati', barangay: 'Bel-Air', store_name: 'Bel-Air Mini Mart', latitude: 14.5595, longitude: 121.0244, population: 19235, area_sqkm: 1.65, store_type: 'mini-mart' },
    { region: 'NCR', city_municipality: 'Pasig', barangay: 'Ortigas', store_name: 'Ortigas Store', latitude: 14.5864, longitude: 121.0614, population: 56789, area_sqkm: 3.45, store_type: 'grocery' },
    { region: 'NCR', city_municipality: 'Taguig', barangay: 'Fort Bonifacio', store_name: 'BGC Express Mart', latitude: 14.5507, longitude: 121.0454, population: 215859, area_sqkm: 8.57, store_type: 'convenience' },
    { region: 'NCR', city_municipality: 'Caloocan', barangay: 'Grace Park', store_name: 'Grace Sari-Sari', latitude: 14.6577, longitude: 120.9664, population: 89456, area_sqkm: 2.78, store_type: 'sari-sari' },
    
    // Region III - Central Luzon (12% weight)
    { region: 'Region III', city_municipality: 'Angeles City', barangay: 'Balibago', store_name: 'Balibago Store', latitude: 15.1611, longitude: 120.5864, population: 67890, area_sqkm: 4.56, store_type: 'sari-sari' },
    { region: 'Region III', city_municipality: 'Angeles City', barangay: 'Dau', store_name: 'Dau Market Store', latitude: 15.1742, longitude: 120.5881, population: 45678, area_sqkm: 3.21, store_type: 'grocery' },
    { region: 'Region III', city_municipality: 'San Fernando', barangay: 'Dolores', store_name: 'Dolores Mart', latitude: 15.0286, longitude: 120.6897, population: 23456, area_sqkm: 2.11, store_type: 'sari-sari' },
    { region: 'Region III', city_municipality: 'Mabalacat', barangay: 'Dau', store_name: 'Highway Store', latitude: 15.2228, longitude: 120.5733, population: 34567, area_sqkm: 3.45, store_type: 'sari-sari' },
    { region: 'Region III', city_municipality: 'Clark', barangay: 'Clark Zone', store_name: 'Clark Convenience', latitude: 15.1856, longitude: 120.5398, population: 12345, area_sqkm: 1.89, store_type: 'convenience' },
    
    // Region IV-A - CALABARZON (10% weight)
    { region: 'Region IV-A', city_municipality: 'Antipolo', barangay: 'Marikina Heights', store_name: 'Heights Store', latitude: 14.6255, longitude: 121.1245, population: 78901, area_sqkm: 4.67, store_type: 'sari-sari' },
    { region: 'Region IV-A', city_municipality: 'Antipolo', barangay: 'Cogeo', store_name: 'Cogeo Mart', latitude: 14.6036, longitude: 121.1469, population: 56789, area_sqkm: 3.45, store_type: 'grocery' },
    { region: 'Region IV-A', city_municipality: 'Biñan', barangay: 'Santo Domingo', store_name: 'Santo Domingo Store', latitude: 14.3341, longitude: 121.0807, population: 45678, area_sqkm: 2.89, store_type: 'sari-sari' },
    { region: 'Region IV-A', city_municipality: 'Santa Rosa', barangay: 'Balibago', store_name: 'Rosa Store', latitude: 14.3122, longitude: 121.1113, population: 34567, area_sqkm: 2.34, store_type: 'sari-sari' },
    { region: 'Region IV-A', city_municipality: 'Calamba', barangay: 'Real', store_name: 'Real Convenience', latitude: 14.2115, longitude: 121.1653, population: 23456, area_sqkm: 1.98, store_type: 'convenience' },
    
    // Region VI - Western Visayas (8% weight)
    { region: 'Region VI', city_municipality: 'Iloilo City', barangay: 'Jaro', store_name: 'Jaro Store', latitude: 10.7202, longitude: 122.5611, population: 89123, area_sqkm: 5.67, store_type: 'sari-sari' },
    { region: 'Region VI', city_municipality: 'Iloilo City', barangay: 'Lapaz', store_name: 'Lapaz Market', latitude: 10.7049, longitude: 122.5675, population: 67890, area_sqkm: 4.23, store_type: 'grocery' },
    { region: 'Region VI', city_municipality: 'Bacolod', barangay: 'Mandalagan', store_name: 'Mandalagan Store', latitude: 10.6767, longitude: 122.9562, population: 56789, area_sqkm: 3.78, store_type: 'sari-sari' },
    { region: 'Region VI', city_municipality: 'Bacolod', barangay: 'Lacson', store_name: 'Lacson Mart', latitude: 10.6769, longitude: 122.9506, population: 45678, area_sqkm: 3.12, store_type: 'convenience' },
    
    // Region VII - Central Visayas (15% weight)
    { region: 'Region VII', city_municipality: 'Cebu City', barangay: 'Lahug', store_name: 'Lahug Store', latitude: 10.3336, longitude: 123.8941, population: 89123, area_sqkm: 5.89, store_type: 'sari-sari' },
    { region: 'Region VII', city_municipality: 'Cebu City', barangay: 'IT Park', store_name: 'IT Park Mart', latitude: 10.3306, longitude: 123.9054, population: 45678, area_sqkm: 2.34, store_type: 'convenience' },
    { region: 'Region VII', city_municipality: 'Cebu City', barangay: 'Mabolo', store_name: 'Mabolo Store', latitude: 10.3207, longitude: 123.9071, population: 67890, area_sqkm: 4.12, store_type: 'sari-sari' },
    { region: 'Region VII', city_municipality: 'Mandaue', barangay: 'Centro', store_name: 'Mandaue Central', latitude: 10.3236, longitude: 123.9222, population: 34567, area_sqkm: 2.89, store_type: 'grocery' },
    { region: 'Region VII', city_municipality: 'Lapu-Lapu', barangay: 'Mactan', store_name: 'Mactan Store', latitude: 10.3103, longitude: 123.9794, population: 23456, area_sqkm: 2.34, store_type: 'sari-sari' },
    
    // Region XI - Davao Region (5% weight)
    { region: 'Region XI', city_municipality: 'Davao City', barangay: 'Poblacion', store_name: 'Davao Central', latitude: 7.0733, longitude: 125.6128, population: 78901, area_sqkm: 4.67, store_type: 'grocery' },
    { region: 'Region XI', city_municipality: 'Davao City', barangay: 'Buhangin', store_name: 'Buhangin Store', latitude: 7.0947, longitude: 125.6269, population: 56789, area_sqkm: 3.45, store_type: 'sari-sari' },
    { region: 'Region XI', city_municipality: 'Davao City', barangay: 'Matina', store_name: 'Matina Market', latitude: 7.0589, longitude: 125.5949, population: 45678, area_sqkm: 3.12, store_type: 'sari-sari' },
    { region: 'Region XI', city_municipality: 'Tagum', barangay: 'Apokon', store_name: 'Apokon Store', latitude: 7.4478, longitude: 125.8086, population: 34567, area_sqkm: 2.78, store_type: 'sari-sari' }
  ],

  // Comprehensive product catalog covering ALL brands and categories
  organization: [
    // Beverages - 30% weight
    { client: 'Coca-Cola Philippines', category: 'Beverages', brand: 'Coca-Cola', sku: 'COKE-250ML', sku_description: 'Coca-Cola Mismo 250ml', unit_price: 15.00, cost_price: 11.00, margin_percent: 26.67, package_size: '250ml', is_competitor: false },
    { client: 'Coca-Cola Philippines', category: 'Beverages', brand: 'Coca-Cola', sku: 'COKE-1.5L', sku_description: 'Coca-Cola 1.5 Liter', unit_price: 65.00, cost_price: 48.00, margin_percent: 26.15, package_size: '1.5L', is_competitor: false },
    { client: 'Coca-Cola Philippines', category: 'Beverages', brand: 'Sprite', sku: 'SPRITE-250ML', sku_description: 'Sprite Mismo 250ml', unit_price: 15.00, cost_price: 11.00, margin_percent: 26.67, package_size: '250ml', is_competitor: false },
    { client: 'Coca-Cola Philippines', category: 'Beverages', brand: 'Royal', sku: 'ROYAL-250ML', sku_description: 'Royal Tru-Orange 250ml', unit_price: 15.00, cost_price: 11.00, margin_percent: 26.67, package_size: '250ml', is_competitor: false },
    { client: 'PepsiCo', category: 'Beverages', brand: 'Pepsi', sku: 'PEPSI-250ML', sku_description: 'Pepsi 250ml', unit_price: 15.00, cost_price: 11.00, margin_percent: 26.67, package_size: '250ml', is_competitor: true },
    { client: 'PepsiCo', category: 'Beverages', brand: 'Mountain Dew', sku: 'DEW-250ML', sku_description: 'Mountain Dew 250ml', unit_price: 16.00, cost_price: 12.00, margin_percent: 25.00, package_size: '250ml', is_competitor: true },
    { client: 'Universal Robina', category: 'Beverages', brand: 'C2', sku: 'C2-355ML', sku_description: 'C2 Green Tea Apple 355ml', unit_price: 20.00, cost_price: 15.00, margin_percent: 25.00, package_size: '355ml', is_competitor: true },
    { client: 'Asia Brewery', category: 'Beverages', brand: 'Summit', sku: 'SUMMIT-250ML', sku_description: 'Summit Drinking Water 250ml', unit_price: 10.00, cost_price: 7.00, margin_percent: 30.00, package_size: '250ml', is_competitor: true },
    { client: 'Nestle Philippines', category: 'Beverages', brand: 'Milo', sku: 'MILO-300ML', sku_description: 'Milo Ready to Drink 300ml', unit_price: 25.00, cost_price: 18.00, margin_percent: 28.00, package_size: '300ml', is_competitor: true },
    { client: 'Zesto Corporation', category: 'Beverages', brand: 'Zesto', sku: 'ZESTO-200ML', sku_description: 'Zesto Orange Juice 200ml', unit_price: 10.00, cost_price: 7.00, margin_percent: 30.00, package_size: '200ml', is_competitor: true },
    
    // Snacks - 25% weight
    { client: 'Universal Robina', category: 'Snacks', brand: 'Jack n Jill', sku: 'PIATTOS-40G', sku_description: 'Piattos Cheese 40g', unit_price: 20.00, cost_price: 14.00, margin_percent: 30.00, package_size: '40g', is_competitor: true },
    { client: 'Universal Robina', category: 'Snacks', brand: 'Jack n Jill', sku: 'NOVA-40G', sku_description: 'Nova Multigrain Chips 40g', unit_price: 20.00, cost_price: 14.00, margin_percent: 30.00, package_size: '40g', is_competitor: true },
    { client: 'Liwayway', category: 'Snacks', brand: 'Oishi', sku: 'OISHI-PRAWN-60G', sku_description: 'Oishi Prawn Crackers 60g', unit_price: 15.00, cost_price: 10.50, margin_percent: 30.00, package_size: '60g', is_competitor: true },
    { client: 'Monde Nissin', category: 'Snacks', brand: 'Lucky Me', sku: 'LUCKY-PANCIT-60G', sku_description: 'Lucky Me Pancit Canton 60g', unit_price: 15.00, cost_price: 11.00, margin_percent: 26.67, package_size: '60g', is_competitor: true },
    { client: 'Regent Foods', category: 'Snacks', brand: 'Regent', sku: 'REGENT-CAKE-10P', sku_description: 'Regent Ube Cake 10pcs', unit_price: 55.00, cost_price: 40.00, margin_percent: 27.27, package_size: '10pcs', is_competitor: true },
    { client: 'Rebisco', category: 'Snacks', brand: 'Rebisco', sku: 'REBISCO-CRACKERS-32G', sku_description: 'Rebisco Crackers 32g', unit_price: 7.00, cost_price: 5.00, margin_percent: 28.57, package_size: '32g', is_competitor: true },
    { client: 'Ricoa', category: 'Snacks', brand: 'Ricoa', sku: 'RICOA-CURLY-150G', sku_description: 'Ricoa Curly Tops 150g', unit_price: 95.00, cost_price: 70.00, margin_percent: 26.32, package_size: '150g', is_competitor: true },
    { client: 'Voice Combo', category: 'Snacks', brand: 'Voice', sku: 'VOICE-PEANUTS-100G', sku_description: 'Voice Peanuts Adobo 100g', unit_price: 35.00, cost_price: 25.00, margin_percent: 28.57, package_size: '100g', is_competitor: true },
    
    // Personal Care - 12% weight
    { client: 'Unilever', category: 'Personal Care', brand: 'Dove', sku: 'DOVE-SOAP-135G', sku_description: 'Dove White Beauty Bar 135g', unit_price: 55.00, cost_price: 40.00, margin_percent: 27.27, package_size: '135g', is_competitor: true },
    { client: 'Unilever', category: 'Personal Care', brand: 'Sunsilk', sku: 'SUNSILK-SHAMPOO-15ML', sku_description: 'Sunsilk Shampoo Pink Sachet 15ml', unit_price: 7.50, cost_price: 5.50, margin_percent: 26.67, package_size: '15ml', is_competitor: true },
    { client: 'P&G', category: 'Personal Care', brand: 'Safeguard', sku: 'SAFEGUARD-SOAP-135G', sku_description: 'Safeguard White 135g', unit_price: 42.00, cost_price: 31.00, margin_percent: 26.19, package_size: '135g', is_competitor: true },
    { client: 'P&G', category: 'Personal Care', brand: 'Head & Shoulders', sku: 'H&S-SHAMPOO-12ML', sku_description: 'Head & Shoulders Sachet 12ml', unit_price: 8.00, cost_price: 6.00, margin_percent: 25.00, package_size: '12ml', is_competitor: true },
    { client: 'Colgate-Palmolive', category: 'Personal Care', brand: 'Colgate', sku: 'COLGATE-TP-25G', sku_description: 'Colgate Toothpaste 25g', unit_price: 15.00, cost_price: 11.00, margin_percent: 26.67, package_size: '25g', is_competitor: true },
    { client: 'Colgate-Palmolive', category: 'Personal Care', brand: 'Palmolive', sku: 'PALMOLIVE-SOAP-130G', sku_description: 'Palmolive Naturals 130g', unit_price: 35.00, cost_price: 26.00, margin_percent: 25.71, package_size: '130g', is_competitor: true },
    
    // Food - 15% weight
    { client: 'Nestle Philippines', category: 'Food', brand: 'Bear Brand', sku: 'BEARBRAND-33G', sku_description: 'Bear Brand Milk Powder 33g', unit_price: 20.00, cost_price: 15.00, margin_percent: 25.00, package_size: '33g', is_competitor: true },
    { client: 'Nestle Philippines', category: 'Food', brand: 'Maggi', sku: 'MAGGI-SARAP-8G', sku_description: 'Maggi Magic Sarap 8g', unit_price: 5.00, cost_price: 3.50, margin_percent: 30.00, package_size: '8g', is_competitor: true },
    { client: 'Nestle Philippines', category: 'Food', brand: 'Nescafe', sku: 'NESCAFE-CLASSIC-7G', sku_description: 'Nescafe Classic Sachet 7g', unit_price: 7.00, cost_price: 5.00, margin_percent: 28.57, package_size: '7g', is_competitor: true },
    { client: 'CDO Foodsphere', category: 'Food', brand: 'CDO', sku: 'CDO-CORNED-BEEF-150G', sku_description: 'CDO Corned Beef 150g', unit_price: 42.00, cost_price: 32.00, margin_percent: 23.81, package_size: '150g', is_competitor: true },
    { client: 'Century Pacific', category: 'Food', brand: 'Century Tuna', sku: 'CENTURY-TUNA-155G', sku_description: 'Century Tuna Flakes in Oil 155g', unit_price: 38.00, cost_price: 28.00, margin_percent: 26.32, package_size: '155g', is_competitor: true },
    { client: 'San Miguel', category: 'Food', brand: 'Purefoods', sku: 'PF-CORNED-BEEF-150G', sku_description: 'Purefoods Corned Beef 150g', unit_price: 45.00, cost_price: 34.00, margin_percent: 24.44, package_size: '150g', is_competitor: true },
    { client: 'Alaska Milk', category: 'Food', brand: 'Alaska', sku: 'ALASKA-EVAP-370ML', sku_description: 'Alaska Evaporada 370ml', unit_price: 35.00, cost_price: 26.00, margin_percent: 25.71, package_size: '370ml', is_competitor: true },
    
    // Home Care - 10% weight
    { client: 'P&G', category: 'Home Care', brand: 'Tide', sku: 'TIDE-BAR-130G', sku_description: 'Tide Bar 130g', unit_price: 15.00, cost_price: 11.00, margin_percent: 26.67, package_size: '130g', is_competitor: true },
    { client: 'P&G', category: 'Home Care', brand: 'Ariel', sku: 'ARIEL-POWDER-66G', sku_description: 'Ariel Powder Detergent 66g', unit_price: 12.00, cost_price: 9.00, margin_percent: 25.00, package_size: '66g', is_competitor: true },
    { client: 'Unilever', category: 'Home Care', brand: 'Surf', sku: 'SURF-POWDER-70G', sku_description: 'Surf Powder Cherry Blossom 70g', unit_price: 12.00, cost_price: 9.00, margin_percent: 25.00, package_size: '70g', is_competitor: true },
    { client: 'Unilever', category: 'Home Care', brand: 'Breeze', sku: 'BREEZE-POWDER-70G', sku_description: 'Breeze Powder Detergent 70g', unit_price: 12.00, cost_price: 9.00, margin_percent: 25.00, package_size: '70g', is_competitor: true },
    { client: 'Colgate-Palmolive', category: 'Home Care', brand: 'Ajax', sku: 'AJAX-BLEACH-250ML', sku_description: 'Ajax Bleach 250ml', unit_price: 25.00, cost_price: 18.00, margin_percent: 28.00, package_size: '250ml', is_competitor: true },
    
    // Tobacco - 5% weight
    { client: 'Philip Morris', category: 'Tobacco', brand: 'Marlboro', sku: 'MARLBORO-RED-20S', sku_description: 'Marlboro Red 20 sticks', unit_price: 160.00, cost_price: 120.00, margin_percent: 25.00, package_size: '20s', is_competitor: true },
    { client: 'Philip Morris', category: 'Tobacco', brand: 'Marlboro', sku: 'MARLBORO-BLUE-20S', sku_description: 'Marlboro Blue 20 sticks', unit_price: 160.00, cost_price: 120.00, margin_percent: 25.00, package_size: '20s', is_competitor: true },
    { client: 'Japan Tobacco', category: 'Tobacco', brand: 'Winston', sku: 'WINSTON-RED-20S', sku_description: 'Winston Red 20 sticks', unit_price: 150.00, cost_price: 112.00, margin_percent: 25.33, package_size: '20s', is_competitor: true },
    { client: 'Fortune Tobacco', category: 'Tobacco', brand: 'Fortune', sku: 'FORTUNE-MENTHOL-20S', sku_description: 'Fortune Menthol 20 sticks', unit_price: 130.00, cost_price: 98.00, margin_percent: 24.62, package_size: '20s', is_competitor: true },
    
    // Others - 3% weight
    { client: 'Smart', category: 'Telecom', brand: 'Smart', sku: 'SMART-LOAD-30', sku_description: 'Smart Load 30', unit_price: 30.00, cost_price: 27.00, margin_percent: 10.00, package_size: '30 pesos', is_competitor: true },
    { client: 'Globe', category: 'Telecom', brand: 'Globe', sku: 'GLOBE-LOAD-50', sku_description: 'Globe Load 50', unit_price: 50.00, cost_price: 45.00, margin_percent: 10.00, package_size: '50 pesos', is_competitor: true },
    { client: 'Meralco', category: 'Utilities', brand: 'Meralco', sku: 'MERALCO-PREPAID-100', sku_description: 'Meralco Prepaid Load 100', unit_price: 100.00, cost_price: 95.00, margin_percent: 5.00, package_size: '100 pesos', is_competitor: true }
  ]
};

async function seedDatabase() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Clear existing data (optional - comment out if you want to preserve existing data)
    console.log('🗑️ Clearing existing data...');
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('geography').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('organization').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Seed geography data
    console.log('📍 Seeding geography data...');
    const { error: geoError } = await supabase
      .from('geography')
      .insert(seedData.geography);
    
    if (geoError) {
      console.error('❌ Error seeding geography:', geoError);
      return;
    }
    console.log('✅ Geography data seeded:', seedData.geography.length, 'locations');
    
    // Seed organization data
    console.log('🏢 Seeding organization data...');
    const { error: orgError } = await supabase
      .from('organization')
      .insert(seedData.organization);
    
    if (orgError) {
      console.error('❌ Error seeding organization:', orgError);
      return;
    }
    console.log('✅ Organization data seeded:', seedData.organization.length, 'products');
    
    // Generate transactions using the new function
    console.log('🔄 Starting transaction generation...');
    console.log('📊 First batch will ensure complete coverage of all regions and brands');
    
    // Try to use the most appropriate function available
    let result = await supabase.rpc('generate_efficient_transactions', { 
      target_count: 10000, 
      max_batch_size: 2000 
    });
    
    if (result.error && result.error.message.includes('Could not find')) {
      console.log('⚠️ Primary function not found, trying alternative...');
      result = await supabase.rpc('generate_sample_transactions', { 
        count: 2000 
      });
    }
    
    const { data, error } = result;
    
    if (error) {
      console.error('❌ Error generating transactions:', error);
      return;
    }
    
    console.log('✅ Transaction generation complete:', data);
    
    // Try to check coverage statistics if function exists
    let stats = null;
    let statsError = null;
    
    const statsResult = await supabase.rpc('get_transaction_stats');
    if (!statsResult.error) {
      stats = statsResult.data;
    } else {
      // Try alternative function
      const altStatsResult = await supabase.rpc('monitor_batch_generation');
      if (!altStatsResult.error) {
        stats = altStatsResult.data;
        statsError = altStatsResult.error;
      }
    }
    
    if (!statsError && stats && stats[0]) {
      console.log('\n📊 Final Database Statistics:');
      console.log('Total Transactions:', stats[0].total_transactions);
      console.log('Regions Covered:', stats[0].regions_covered);
      console.log('Brands Covered:', stats[0].brands_covered);
      console.log('Categories Covered:', stats[0].categories_covered);
      console.log('Average Transaction Value: ₱', stats[0].avg_transaction_value);
      console.log('\nPayment Method Distribution:', stats[0].payment_method_distribution);
      console.log('Regional Distribution:', stats[0].regional_distribution);
    }
    
    console.log('\n🎉 Database seeding complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the seed
seedDatabase();