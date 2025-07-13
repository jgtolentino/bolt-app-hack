#!/usr/bin/env node

// Script to generate comprehensive synthetic data for Philippine retail analytics
// Usage: node generateSyntheticData.js [number_of_transactions] [output_file]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Since we're using TypeScript modules, we need to compile first
// For now, let's create a simplified version that follows the same structure

const STORE_LOCATIONS = [
  { region: 'NCR', city: 'Manila', barangays: ['Ermita', 'Malate', 'Quiapo', 'Sampaloc', 'Tondo'], lat: 14.5995, lng: 120.9842 },
  { region: 'NCR', city: 'Quezon City', barangays: ['Diliman', 'Cubao', 'Novaliches', 'Commonwealth'], lat: 14.6760, lng: 121.0437 },
  { region: 'NCR', city: 'Makati', barangays: ['Poblacion', 'Bel-Air', 'San Lorenzo', 'Legaspi'], lat: 14.5547, lng: 121.0244 },
  { region: 'Region III', city: 'Angeles', barangays: ['Balibago', 'Anunas', 'Cutcut', 'Pampang'], lat: 15.1450, lng: 120.5887 },
  { region: 'Region IV-A', city: 'Batangas City', barangays: ['Poblacion', 'Alangilan', 'Balagtas'], lat: 13.7565, lng: 121.0583 },
  { region: 'Region VII', city: 'Cebu City', barangays: ['Lahug', 'Banilad', 'IT Park', 'Fuente'], lat: 10.3157, lng: 123.8854 },
  { region: 'Region XI', city: 'Davao City', barangays: ['Poblacion', 'Buhangin', 'Matina', 'Toril'], lat: 7.1907, lng: 125.4553 }
];

const STORE_NAMES = [
  'Aling Nena Store', 'Mang Juan Sari-Sari', 'Ate Maria Store', 'Kuya Boy Store',
  'Tindahan ni Aling Rosa', 'JM Mart', 'RJ Store', 'Triple M', 'ABC Store',
  'Neighborhood Mart', 'Corner Store', 'Barangay Store', '24/7 Mart'
];

const FMCG_BRANDS = {
  beverages: ['Coca-Cola', 'Pepsi', 'Sprite', '7UP', 'Mountain Dew', 'Royal', 'Sarsi', 'C2', 'Gatorade', 'Red Bull'],
  snacks: ['Jack n Jill', 'Oishi', 'Leslie', 'Piattos', 'Nova', 'Chippy', 'Clover', 'Tomi', 'Boy Bawang'],
  personal_care: ['Unilever', 'P&G', 'Palmolive', 'Colgate', 'Close Up', 'Rejoice', 'Head & Shoulders', 'Sunsilk', 'Dove'],
  household: ['Tide', 'Ariel', 'Breeze', 'Surf', 'Downy', 'Joy', 'Smart', 'Ajax', 'Zonrox'],
  tobacco: ['Marlboro', 'Philip Morris', 'Fortune', 'Hope', 'More', 'Mighty', 'Winston', 'Lucky Strike', 'Camel'],
  instant_noodles: ['Lucky Me', 'Payless', 'Pancit Canton', 'Mi Goreng', 'Nissin', 'QuickChow']
};

const TRANSCRIPTION_SAMPLES = [
  {
    customer: ['Ate, may Marlboro Lights?', 'Isa lang. Magkano?'],
    storeowner: ['Meron po, ilang pack?', '180 pesos po']
  },
  {
    customer: ['May Coke Zero ba kayo?', 'Sige, yun na lang'],
    storeowner: ['Wala na po, pero may Pepsi Max, same lang zero sugar']
  },
  {
    customer: ['May promo ba ang Tide?', 'Ay sige, kunin ko na tatlo'],
    storeowner: ['Oo, buy 2 take 1 po ngayong week']
  },
  {
    customer: ['Miss, pahingi ng shampoo', 'Yung Sunsilk na pink'],
    storeowner: ['Anong brand po gusto niyo? May Head & Shoulders, Palmolive, Sunsilk']
  }
];

function generateTransaction(index) {
  const location = STORE_LOCATIONS[Math.floor(Math.random() * STORE_LOCATIONS.length)];
  const barangay = location.barangays[Math.floor(Math.random() * location.barangays.length)];
  const storeName = STORE_NAMES[Math.floor(Math.random() * STORE_NAMES.length)];
  
  // Generate timestamp
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const hour = Math.floor(Math.random() * 14) + 7; // 7 AM to 9 PM
  date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  
  // Generate items (focusing on FMCG and tobacco)
  const categories = Object.keys(FMCG_BRANDS);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const brands = FMCG_BRANDS[category];
  const brand = brands[Math.floor(Math.random() * brands.length)];
  
  // Price ranges
  const priceRanges = {
    beverages: [15, 120],
    snacks: [10, 80],
    personal_care: [20, 250],
    household: [30, 300],
    tobacco: [150, 200],
    instant_noodles: [10, 40]
  };
  
  const [minPrice, maxPrice] = priceRanges[category] || [10, 100];
  const unitPrice = Math.random() * (maxPrice - minPrice) + minPrice;
  const quantity = category === 'tobacco' ? 1 : Math.floor(Math.random() * 3) + 1;
  
  // Generate transcription
  const dialogue = TRANSCRIPTION_SAMPLES[Math.floor(Math.random() * TRANSCRIPTION_SAMPLES.length)];
  const fullTranscript = `customer: ${dialogue.customer[0]} storeowner: ${dialogue.storeowner[0]} customer: ${dialogue.customer[1]} storeowner: ${dialogue.storeowner[1]}`;
  
  // Substitution logic
  const wasSubstituted = Math.random() > 0.85;
  const originalBrand = wasSubstituted ? brands[Math.floor(Math.random() * brands.length)] : null;
  
  return {
    transaction_id: `TX${String(index).padStart(8, '0')}`,
    timestamp: date.toISOString(),
    store_id: `ST${String(Math.floor(Math.random() * 100)).padStart(6, '0')}`,
    store_name: storeName,
    store_type: Math.random() > 0.8 ? 'convenience' : 'sari-sari',
    barangay: barangay,
    city_municipality: location.city,
    province: location.city,
    region: location.region,
    latitude: location.lat + (Math.random() - 0.5) * 0.1,
    longitude: location.lng + (Math.random() - 0.5) * 0.1,
    economic_class: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
    transaction_value: (unitPrice * quantity).toFixed(2),
    discount_amount: (Math.random() > 0.8 ? unitPrice * 0.1 : 0).toFixed(2),
    final_amount: ((unitPrice * quantity) * (Math.random() > 0.8 ? 0.9 : 1)).toFixed(2),
    payment_method: Math.random() > 0.8 ? 'gcash' : 'cash',
    duration_seconds: Math.floor(Math.random() * 300) + 60,
    units_total: quantity,
    // Customer profile
    customer_gender: Math.random() > 0.5 ? 'male' : 'female',
    customer_age: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'][Math.floor(Math.random() * 6)],
    customer_type: Math.random() > 0.6 ? 'regular' : 'occasional',
    loyalty_status: Math.random() > 0.7 ? 'member' : 'non-member',
    // Audio signals
    request_type: dialogue.customer[0].includes(brand) ? 'branded' : 'generic',
    language: Math.random() > 0.7 ? 'tagalog' : 'mixed',
    storeowner_influence: wasSubstituted ? 'high' : 'low',
    suggestion_accepted: wasSubstituted,
    // Transcription
    full_transcript: fullTranscript,
    sentiment_score: (Math.random() * 0.4 + 0.6).toFixed(2),
    // Context
    day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
    hour_of_day: hour,
    weather: ['sunny', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)],
    is_payday: date.getDate() === 15 || date.getDate() === 30,
    // Product details
    first_item_sku: `SKU${String(Math.floor(Math.random() * 1000)).padStart(6, '0')}`,
    first_item_brand: brand,
    first_item_product: `${brand} ${category}`,
    first_item_category: category,
    first_item_quantity: quantity,
    first_item_price: unitPrice.toFixed(2),
    was_substituted: wasSubstituted,
    original_brand: originalBrand,
    // Campaign
    campaign_id: Math.random() > 0.7 ? `CAMP${String(Math.floor(Math.random() * 10)).padStart(3, '0')}` : '',
    campaign_name: Math.random() > 0.7 ? ['Summer Promo', 'Payday Sale', 'New Flavor Launch'][Math.floor(Math.random() * 3)] : '',
    influenced_by_campaign: Math.random() > 0.7,
    // Additional FMCG specific fields
    is_tbwa_client: ['Coca-Cola', 'Pepsi', 'Marlboro', 'Philip Morris', 'Unilever', 'P&G'].includes(brand),
    product_subcategory: category === 'beverages' ? 'carbonated' : 
                        category === 'tobacco' ? 'cigarettes' : 
                        category === 'snacks' ? 'chips' : 'regular',
    // Video objects for computer vision
    video_objects_detected: `customer|store_owner|counter|shelf|${brand.toLowerCase()}_product`,
    // Handshake metrics
    handshake_score: (Math.random()).toFixed(3),
    handshake_detected: Math.random() > 0.7
  };
}

function generateDataset(numTransactions) {
  console.log(`🏪 Generating ${numTransactions} transactions for Philippine retail (FMCG & Tobacco focus)...`);
  
  const transactions = [];
  for (let i = 0; i < numTransactions; i++) {
    transactions.push(generateTransaction(i));
    
    if ((i + 1) % 1000 === 0) {
      console.log(`   Generated ${i + 1} transactions...`);
    }
  }
  
  return transactions;
}

function exportToCSV(transactions) {
  const headers = Object.keys(transactions[0]);
  const rows = transactions.map(t => 
    headers.map(h => {
      const value = t[h];
      // Escape quotes in strings
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// Main execution
const args = process.argv.slice(2);
const numTransactions = parseInt(args[0]) || 10000;
const outputFile = args[1] || 'comprehensive_transactions.csv';

console.log('====================================================');
console.log('Philippine Retail Synthetic Data Generator');
console.log('Focus: FMCG & Tobacco Categories');
console.log('====================================================\n');

const transactions = generateDataset(numTransactions);
const csv = exportToCSV(transactions);

// Create output directory if it doesn't exist
const outputDir = path.dirname(outputFile);
if (outputDir && !fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, csv);

console.log(`\n✅ Successfully generated ${numTransactions} transactions!`);
console.log(`📄 Output saved to: ${path.resolve(outputFile)}`);
console.log(`📊 File size: ${(Buffer.byteLength(csv) / 1024 / 1024).toFixed(2)} MB`);

// Summary statistics
const categories = {};
const brands = {};
const regions = {};

transactions.forEach(t => {
  categories[t.first_item_category] = (categories[t.first_item_category] || 0) + 1;
  brands[t.first_item_brand] = (brands[t.first_item_brand] || 0) + 1;
  regions[t.region] = (regions[t.region] || 0) + 1;
});

console.log('\n📈 Dataset Summary:');
console.log('Categories:', Object.entries(categories).map(([k, v]) => `${k}: ${v}`).join(', '));
console.log('Top Brands:', Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', '));
console.log('Regions:', Object.entries(regions).map(([k, v]) => `${k}: ${v}`).join(', '));