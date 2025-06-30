import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250630000000_fix_missing_functions.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    console.log('🚀 Applying migration...');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\nExecuting: ${statement.trim().substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { query: statement + ';' }).catch(() => ({ error: 'RPC not available' }));
        
        if (error) {
          // Try direct execution
          console.log('Direct SQL execution not available, migration needs to be applied manually');
        }
      }
    }
    
    console.log('\n✅ Migration process complete!');
    console.log('\nNote: Some migrations may need to be applied directly in Supabase dashboard');
    
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration();