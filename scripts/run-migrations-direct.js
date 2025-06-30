#!/usr/bin/env node

/**
 * Direct Migration Runner for Supabase
 * This script runs migrations directly against your Supabase instance
 * without requiring the Supabase CLI or Docker
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials!');
  console.error('Please ensure the following environment variables are set:');
  console.error('- VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function runMigration(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n🔄 Running migration: ${fileName}`);
  
  try {
    // Read the SQL file
    const sql = await fs.readFile(filePath, 'utf8');
    
    // Skip if it's an empty file or only contains comments
    const cleanedSql = sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '').trim();
    if (!cleanedSql) {
      console.log(`⏭️  Skipping ${fileName} (no SQL statements)`);
      return true;
    }
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: sql }).single();
    
    if (error) {
      // If the RPC doesn't exist, try a different approach
      if (error.message.includes('function public.exec_sql') || error.code === 'PGRST202') {
        // Split by semicolons and execute each statement
        const statements = sql.split(/;\s*$/m).filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          const trimmedStmt = statement.trim();
          if (!trimmedStmt) continue;
          
          // Use raw SQL execution through the REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              query: trimmedStmt
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SQL execution failed: ${errorText}`);
          }
        }
      } else {
        throw error;
      }
    }
    
    console.log(`✅ Successfully ran ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error running ${fileName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting direct migration process...');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  
  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Sort to run in order
    
    console.log(`\n📁 Found ${sqlFiles.length} migration files`);
    
    // Run each migration
    let successCount = 0;
    let failureCount = 0;
    
    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const success = await runMigration(filePath);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
        // Continue with other migrations even if one fails
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    
    if (failureCount > 0) {
      console.log('\n⚠️  Some migrations failed. Please check the errors above.');
      console.log('You may need to:');
      console.log('1. Fix the SQL syntax in the failing migrations');
      console.log('2. Run the migrations manually in your Supabase SQL editor');
      console.log('3. Check if the tables/constraints already exist');
    } else {
      console.log('\n🎉 All migrations completed successfully!');
    }
    
    // Now run the seed script
    if (failureCount === 0) {
      console.log('\n🌱 Running seed script...');
      require('./seed-database.js');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);