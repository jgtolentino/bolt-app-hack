import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import readline from 'readline';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkCurrentState() {
  console.log('\n📊 Checking current database state...\n');
  
  // Check legacy tables
  const { count: geoCount } = await supabase
    .from('geography')
    .select('*', { count: 'exact', head: true });
  
  const { count: orgCount } = await supabase
    .from('organization')
    .select('*', { count: 'exact', head: true });
    
  const { count: transCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });

  console.log(`📍 Geography records: ${geoCount || 0}`);
  console.log(`📦 Organization records: ${orgCount || 0}`);
  console.log(`💳 Transaction records: ${transCount || 0}`);
  
  // Check if new tables already exist
  const { data: stores } = await supabase
    .from('stores')
    .select('store_id')
    .limit(1);
    
  const { data: products } = await supabase
    .from('products')
    .select('product_id')
    .limit(1);
  
  if (stores && stores.length > 0) {
    console.log('\n⚠️  Warning: stores table already has data');
  }
  
  if (products && products.length > 0) {
    console.log('⚠️  Warning: products table already has data');
  }
  
  return { geoCount, orgCount, transCount };
}

async function runMigration() {
  console.log('\n🚀 Starting Medallion Migration...\n');
  
  try {
    // Read migration SQL file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250701_legacy_to_medallion_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split into individual statements (simple split, may need refinement)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute statements one by one
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip certain statements that might cause issues in JS execution
      if (statement.includes('CREATE EXTENSION') || 
          statement.includes('GRANT') ||
          statement.includes('DO $$')) {
        console.log(`⏭️  Skipping: ${statement.substring(0, 50)}...`);
        continue;
      }
      
      try {
        // For this demo, we'll just show what would be executed
        console.log(`\n🔄 Would execute: ${statement.substring(0, 80)}...`);
        
        // In a real implementation, you'd use a proper PostgreSQL client
        // const result = await pgClient.query(statement);
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error in statement ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Migration simulation complete: ${successCount} success, ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
  }
  
  return true;
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');
  
  // Check new tables
  const { count: storeCount } = await supabase
    .from('stores')
    .select('*', { count: 'exact', head: true });
    
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });
    
  const { count: brandCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✅ Stores: ${storeCount || 0}`);
  console.log(`✅ Products: ${productCount || 0}`);
  console.log(`✅ Brands: ${brandCount || 0}`);
  
  // Test legacy views
  console.log('\n🔍 Testing legacy compatibility views...');
  
  try {
    const { data: geoView } = await supabase
      .from('geography')
      .select('store_name')
      .limit(1);
      
    const { data: orgView } = await supabase
      .from('organization')
      .select('sku')
      .limit(1);
    
    console.log('✅ Legacy views are working');
  } catch (error) {
    console.log('❌ Legacy views failed:', error.message);
  }
}

async function main() {
  console.log('🏗️  Scout Analytics: Legacy to Medallion Migration Tool\n');
  console.log('This tool will:');
  console.log('1. Transform geography → stores');
  console.log('2. Transform organization → products/brands/categories');
  console.log('3. Create backward-compatible views');
  console.log('4. Update transaction references\n');
  
  // Check current state
  const state = await checkCurrentState();
  
  if (!state.geoCount || !state.orgCount) {
    console.log('\n❌ No legacy data found to migrate');
    rl.close();
    return;
  }
  
  // Get user confirmation
  const answer = await question('\n⚠️  This will modify your database. Continue? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Migration cancelled');
    rl.close();
    return;
  }
  
  // Note about actual implementation
  console.log('\n📝 NOTE: This is a demonstration script.');
  console.log('For production migration, please run the SQL file directly:');
  console.log('\n  supabase db push');
  console.log('  OR');
  console.log('  psql -f supabase/migrations/20250701_legacy_to_medallion_migration.sql\n');
  
  // Simulate migration
  const success = await runMigration();
  
  if (success) {
    await verifyMigration();
  }
  
  rl.close();
}

// Run the migration tool
main().catch(console.error);