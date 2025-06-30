import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

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

async function applyStoreSizeMigration() {
  console.log('📋 Applying store size migration...\n');
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250629123000_add_store_size_dimension.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('/*') && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute.\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        console.log('Statement:', statement.substring(0, 100) + '...');
        
        // Try alternative approach for this specific migration
        if (statement.includes('ALTER TABLE geography ADD COLUMN')) {
          console.log('Trying alternative approach...');
          // The column might already exist or we need a different approach
        }
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    }
    
    // Verify the migration worked
    console.log('\n🔍 Verifying migration...');
    const { data: sample, error: verifyError } = await supabase
      .from('geography')
      .select('store_name, store_type, store_size')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else if (sample && sample[0].store_size !== undefined) {
      console.log('✅ Store size column successfully added!');
      console.log('\nSample data:');
      sample.forEach(s => {
        console.log(`  ${s.store_name}: ${s.store_type} (${s.store_size})`);
      });
    } else {
      console.log('⚠️  Store size column may not have been added properly.');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

// Run the migration
applyStoreSizeMigration();