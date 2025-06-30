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

async function runAllMigrationsAndGenerate() {
  console.log('🚀 Running complete setup with 3000 records...\n');
  
  try {
    // Step 1: Add store_size column if it doesn't exist
    console.log('📋 Step 1: Adding store_size dimension...');
    
    // Check if column exists
    const { data: checkColumn } = await supabase
      .from('geography')
      .select('id')
      .limit(1);
    
    // Try to add the column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'geography' AND column_name = 'store_size'
          ) THEN
            ALTER TABLE geography ADD COLUMN store_size TEXT;
          END IF;
        END $$;
      `
    });
    
    if (!alterError) {
      console.log('✓ Store size column ready');
      
      // Update store sizes
      console.log('📏 Updating store sizes...');
      
      // Update sari-sari stores based on population
      await supabase
        .from('geography')
        .update({ store_size: 'Extra Large' })
        .eq('store_type', 'sari-sari')
        .gt('population', 100000);
      
      await supabase
        .from('geography')
        .update({ store_size: 'Large' })
        .eq('store_type', 'sari-sari')
        .gt('population', 60000)
        .lte('population', 100000);
      
      await supabase
        .from('geography')
        .update({ store_size: 'Medium' })
        .eq('store_type', 'sari-sari')
        .gt('population', 30000)
        .lte('population', 60000);
      
      await supabase
        .from('geography')
        .update({ store_size: 'Small' })
        .eq('store_type', 'sari-sari')
        .gt('population', 10000)
        .lte('population', 30000);
      
      await supabase
        .from('geography')
        .update({ store_size: 'Micro' })
        .eq('store_type', 'sari-sari')
        .lte('population', 10000);
      
      // Update other store types
      await supabase.from('geography').update({ store_size: 'Large' }).eq('store_type', 'grocery');
      await supabase.from('geography').update({ store_size: 'Medium' }).eq('store_type', 'mini-mart');
      await supabase.from('geography').update({ store_size: 'Small' }).eq('store_type', 'convenience');
      
      console.log('✓ Store sizes updated');
    }
    
    // Step 2: Generate 3000 records
    console.log('\n📊 Step 2: Generating 3000 comprehensive records...\n');
    
    // Import and run the generation script
    const { default: generateRecords } = await import('./generate-complete-3000-records.js');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // If exec_sql doesn't work, provide manual instructions
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run this SQL:');
    console.log(`
ALTER TABLE geography ADD COLUMN IF NOT EXISTS store_size TEXT;

UPDATE geography 
SET store_size = 
  CASE 
    WHEN store_type = 'sari-sari' THEN
      CASE 
        WHEN population > 100000 THEN 'Extra Large'
        WHEN population > 60000 THEN 'Large'
        WHEN population > 30000 THEN 'Medium'
        WHEN population > 10000 THEN 'Small'
        ELSE 'Micro'
      END
    WHEN store_type = 'grocery' THEN 'Large'
    WHEN store_type = 'mini-mart' THEN 'Medium'
    WHEN store_type = 'convenience' THEN 'Small'
    ELSE 'Medium'
  END
WHERE store_size IS NULL;
    `);
    console.log('\n4. Then run: node scripts/generate-complete-3000-records.js');
  }
}

// Run everything
runAllMigrationsAndGenerate();