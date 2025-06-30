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

async function expandSubstitutionPatterns() {
  console.log('🔄 Expanding Substitution Patterns...\n');
  
  try {
    // Get all products grouped by category
    const { data: products, error: productsError } = await supabase
      .from('organization')
      .select('id, brand, sku_description, category')
      .order('category, brand');
    
    if (productsError) throw productsError;
    
    // Get sample stores for geographic diversity
    const { data: stores, error: storesError } = await supabase
      .from('geography')
      .select('id, region')
      .order('region');
    
    if (storesError) throw storesError;
    
    // Group products by category
    const productsByCategory = {};
    products.forEach(p => {
      if (!productsByCategory[p.category]) productsByCategory[p.category] = [];
      productsByCategory[p.category].push(p);
    });
    
    const patterns = [];
    let storeIndex = 0;
    
    // BEVERAGES - Cola wars and other drinks
    const beverages = productsByCategory['Beverages'] || [];
    const coke = beverages.find(b => b.brand === 'Coca-Cola');
    const pepsi = beverages.find(b => b.brand === 'Pepsi');
    const sprite = beverages.find(b => b.brand === 'Sprite');
    const royal = beverages.find(b => b.brand === 'Royal');
    const c2 = beverages.find(b => b.brand === 'C2');
    const zesto = beverages.find(b => b.brand === 'Zesto');
    const summit = beverages.find(b => b.brand === 'Summit');
    const mountainDew = beverages.find(b => b.brand === 'Mountain Dew');
    
    // Cola substitutions
    if (coke && pepsi) {
      patterns.push({
        original_product_id: coke.id,
        substituted_product_id: pepsi.id,
        substitution_count: 245,
        acceptance_rate: 0.72,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: pepsi.id,
        substituted_product_id: coke.id,
        substitution_count: 289,
        acceptance_rate: 0.78,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // Lemon-lime substitutions
    if (sprite && mountainDew) {
      patterns.push({
        original_product_id: sprite.id,
        substituted_product_id: mountainDew.id,
        substitution_count: 156,
        acceptance_rate: 0.65,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: mountainDew.id,
        substituted_product_id: sprite.id,
        substitution_count: 134,
        acceptance_rate: 0.62,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // Orange soda substitutions
    if (royal && c2) {
      patterns.push({
        original_product_id: royal.id,
        substituted_product_id: c2.id,
        substitution_count: 89,
        acceptance_rate: 0.55,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // Juice substitutions
    if (zesto && c2) {
      patterns.push({
        original_product_id: zesto.id,
        substituted_product_id: c2.id,
        substitution_count: 167,
        acceptance_rate: 0.71,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // Water substitutions
    if (summit && sprite) {
      patterns.push({
        original_product_id: summit.id,
        substituted_product_id: sprite.id,
        substitution_count: 45,
        acceptance_rate: 0.35,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // SNACKS - Multiple brand substitutions
    const snacks = productsByCategory['Snacks'] || [];
    const voice = snacks.find(s => s.brand === 'Voice');
    const oishi = snacks.find(s => s.brand === 'Oishi');
    const jackNJill = snacks.find(s => s.brand === 'Jack n Jill');
    const regent = snacks.find(s => s.brand === 'Regent');
    const rebisco = snacks.find(s => s.brand === 'Rebisco');
    const ricoa = snacks.find(s => s.brand === 'Ricoa');
    
    if (voice && oishi) {
      patterns.push({
        original_product_id: voice.id,
        substituted_product_id: oishi.id,
        substitution_count: 312,
        acceptance_rate: 0.81,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: oishi.id,
        substituted_product_id: voice.id,
        substitution_count: 278,
        acceptance_rate: 0.76,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (jackNJill && regent) {
      patterns.push({
        original_product_id: jackNJill.id,
        substituted_product_id: regent.id,
        substitution_count: 234,
        acceptance_rate: 0.69,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: regent.id,
        substituted_product_id: jackNJill.id,
        substitution_count: 198,
        acceptance_rate: 0.67,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (rebisco && ricoa) {
      patterns.push({
        original_product_id: rebisco.id,
        substituted_product_id: ricoa.id,
        substitution_count: 145,
        acceptance_rate: 0.58,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // PERSONAL CARE - Soap and shampoo substitutions
    const personalCare = productsByCategory['Personal Care'] || [];
    const safeguard = personalCare.find(p => p.brand === 'Safeguard');
    const palmolive = personalCare.find(p => p.brand === 'Palmolive');
    const dove = personalCare.find(p => p.brand === 'Dove');
    const colgate = personalCare.find(p => p.brand === 'Colgate');
    const headShoulders = personalCare.find(p => p.brand === 'Head & Shoulders');
    const sunsilk = personalCare.find(p => p.brand === 'Sunsilk');
    
    if (safeguard && palmolive) {
      patterns.push({
        original_product_id: safeguard.id,
        substituted_product_id: palmolive.id,
        substitution_count: 167,
        acceptance_rate: 0.58,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: palmolive.id,
        substituted_product_id: safeguard.id,
        substitution_count: 145,
        acceptance_rate: 0.61,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (dove && palmolive) {
      patterns.push({
        original_product_id: dove.id,
        substituted_product_id: palmolive.id,
        substitution_count: 89,
        acceptance_rate: 0.42,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (headShoulders && sunsilk) {
      patterns.push({
        original_product_id: headShoulders.id,
        substituted_product_id: sunsilk.id,
        substitution_count: 123,
        acceptance_rate: 0.54,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: sunsilk.id,
        substituted_product_id: headShoulders.id,
        substitution_count: 98,
        acceptance_rate: 0.48,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // HOME CARE - Detergent substitutions
    const homeCare = productsByCategory['Home Care'] || [];
    const tide = homeCare.find(h => h.brand === 'Tide');
    const ariel = homeCare.find(h => h.brand === 'Ariel');
    const surf = homeCare.find(h => h.brand === 'Surf');
    const breeze = homeCare.find(h => h.brand === 'Breeze');
    const ajax = homeCare.find(h => h.brand === 'Ajax');
    
    if (tide && ariel) {
      patterns.push({
        original_product_id: tide.id,
        substituted_product_id: ariel.id,
        substitution_count: 234,
        acceptance_rate: 0.75,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: ariel.id,
        substituted_product_id: tide.id,
        substitution_count: 267,
        acceptance_rate: 0.78,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (surf && breeze) {
      patterns.push({
        original_product_id: surf.id,
        substituted_product_id: breeze.id,
        substitution_count: 189,
        acceptance_rate: 0.69,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: breeze.id,
        substituted_product_id: surf.id,
        substitution_count: 156,
        acceptance_rate: 0.65,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (ajax && ariel) {
      patterns.push({
        original_product_id: ajax.id,
        substituted_product_id: ariel.id,
        substitution_count: 78,
        acceptance_rate: 0.52,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // FOOD - Instant noodles and canned goods
    const food = productsByCategory['Food'] || [];
    const luckyMe = food.find(f => f.brand === 'Lucky Me');
    const maggi = food.find(f => f.brand === 'Maggi');
    const centuryTuna = food.find(f => f.brand === 'Century Tuna');
    const cdo = food.find(f => f.brand === 'CDO');
    const purefoods = food.find(f => f.brand === 'Purefoods');
    const alaska = food.find(f => f.brand === 'Alaska');
    const bearBrand = food.find(f => f.brand === 'Bear Brand');
    
    if (luckyMe && maggi) {
      patterns.push({
        original_product_id: luckyMe.id,
        substituted_product_id: maggi.id,
        substitution_count: 178,
        acceptance_rate: 0.62,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (centuryTuna && cdo) {
      patterns.push({
        original_product_id: centuryTuna.id,
        substituted_product_id: cdo.id,
        substitution_count: 145,
        acceptance_rate: 0.58,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (alaska && bearBrand) {
      patterns.push({
        original_product_id: alaska.id,
        substituted_product_id: bearBrand.id,
        substitution_count: 234,
        acceptance_rate: 0.73,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: bearBrand.id,
        substituted_product_id: alaska.id,
        substitution_count: 212,
        acceptance_rate: 0.71,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // TOBACCO - Cigarette substitutions
    const tobacco = productsByCategory['Tobacco'] || [];
    const marlboro = tobacco.find(t => t.brand === 'Marlboro');
    const winston = tobacco.find(t => t.brand === 'Winston');
    const fortune = tobacco.find(t => t.brand === 'Fortune');
    
    if (marlboro && winston) {
      patterns.push({
        original_product_id: marlboro.id,
        substituted_product_id: winston.id,
        substitution_count: 89,
        acceptance_rate: 0.45,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    if (winston && fortune) {
      patterns.push({
        original_product_id: winston.id,
        substituted_product_id: fortune.id,
        substitution_count: 167,
        acceptance_rate: 0.68,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // TELECOM - Load substitutions
    const telecom = productsByCategory['Telecom'] || [];
    const globe = telecom.find(t => t.brand === 'Globe');
    const smart = telecom.find(t => t.brand === 'Smart');
    
    if (globe && smart) {
      patterns.push({
        original_product_id: globe.id,
        substituted_product_id: smart.id,
        substitution_count: 56,
        acceptance_rate: 0.35,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
      patterns.push({
        original_product_id: smart.id,
        substituted_product_id: globe.id,
        substitution_count: 45,
        acceptance_rate: 0.32,
        geography_id: stores[storeIndex++ % stores.length]?.id
      });
    }
    
    // Filter out any patterns with null IDs
    const validPatterns = patterns.filter(p => 
      p.original_product_id && 
      p.substituted_product_id && 
      p.geography_id
    );
    
    console.log(`Generated ${validPatterns.length} substitution patterns`);
    
    // Insert all patterns
    if (validPatterns.length > 0) {
      const { data, error } = await supabase
        .from('substitution_patterns')
        .insert(validPatterns)
        .select();
      
      if (error) throw error;
      
      console.log(`✅ Successfully added ${data.length} substitution patterns!\n`);
      
      // Show summary by category
      const summary = {};
      for (const pattern of validPatterns) {
        const original = products.find(p => p.id === pattern.original_product_id);
        const substitute = products.find(p => p.id === pattern.substituted_product_id);
        
        if (original && substitute) {
          const category = original.category;
          if (!summary[category]) summary[category] = 0;
          summary[category]++;
        }
      }
      
      console.log('Substitution patterns by category:');
      Object.entries(summary).forEach(([cat, count]) => {
        console.log(`  ${cat}: ${count} patterns`);
      });
    }
    
    // Verify total count
    const { count: totalCount } = await supabase
      .from('substitution_patterns')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Total substitution patterns in database: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Error expanding substitution patterns:', error);
  }
}

expandSubstitutionPatterns();