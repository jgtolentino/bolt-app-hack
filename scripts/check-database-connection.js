#!/usr/bin/env node

/**
 * Database Connection Checker
 * This script verifies your Supabase connection and provides guidance
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Supabase Configuration...\n');

// Check credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables!');
  console.error('\nPlease ensure these are set in .env.local:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- VITE_SUPABASE_ANON_KEY');
  console.error('- SUPABASE_SERVICE_ROLE_KEY (for migrations)\n');
  process.exit(1);
}

console.log('✅ Environment variables found:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
console.log(`   Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : '❌ Not found'}`);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConnection() {
  console.log('\n🔌 Testing connection to Supabase...');
  
  try {
    // Try to query the geography table
    const { data, error, count } = await supabase
      .from('geography')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('relation "public.geography" does not exist')) {
        console.log('\n⚠️  Tables not found in database!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to your Supabase dashboard: ' + supabaseUrl);
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Run the migrations manually in order:');
        console.log('   - Start with the files in supabase/migrations/');
        console.log('   - Run them in chronological order (by timestamp)');
        console.log('   - Skip the problematic 20250629121000_add_all_regions.sql');
        console.log('   - Use 20250629122000_add_all_regions_fixed.sql instead');
        console.log('\nAlternatively, you can use the Supabase CLI:');
        console.log('1. Install Docker Desktop and start it');
        console.log('2. Run: npx supabase login');
        console.log('3. Run: npx supabase link --project-ref ' + supabaseUrl.match(/https:\/\/([^.]+)/)[1]);
        console.log('4. Run: npx supabase db push');
      } else {
        console.error('\n❌ Connection error:', error.message);
        console.log('\n💡 Possible issues:');
        console.log('- Check if your API keys are correct');
        console.log('- Ensure your Supabase project is active');
        console.log('- Verify network connectivity');
      }
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log(`📊 Found ${count || 0} records in geography table`);
    
    // Check other tables
    const tables = ['organization', 'transactions', 'customer_segments', 'ai_insights'];
    console.log('\n📋 Checking tables:');
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table}: Not found`);
      } else {
        console.log(`   ✅ ${table}: ${count || 0} records`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  const isConnected = await checkConnection();
  
  if (isConnected) {
    console.log('\n🎉 Your database is properly configured!');
    console.log('\nYou can now:');
    console.log('- Run: npm run dev');
    console.log('- Or run: node scripts/seed-database.js (to add sample data)');
  } else {
    console.log('\n⚠️  Database setup required.');
    console.log('\nFor detailed setup instructions, see:');
    console.log('- DATABASE_SETUP.md');
    console.log('- Or visit: https://supabase.com/docs/guides/cli/local-development');
  }
}

main().catch(console.error);