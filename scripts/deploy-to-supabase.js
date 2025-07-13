#!/usr/bin/env node

/**
 * Deploy Scout Dashboard v4.0 to Supabase
 * Sets up schema, loads data, and configures the dashboard
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://cxzllzyxwpyptfretryc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4emxsenl4d3B5cHRmcmV0cnljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjM3NjE4MCwiZXhwIjoyMDY3OTUyMTgwfQ.bHZu_tPiiFVM7fZksLA1lIvflwKENz1t2jowGkx23QI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

class SupabaseDeployment {
  constructor() {
    this.schemaFile = path.join(__dirname, '..', 'migrations', '001_create_scout_v4_schema.sql');
  }

  async deploySchema() {
    console.log('🗄️  Deploying database schema...');
    
    try {
      // Read the schema file
      const schema = fs.readFileSync(this.schemaFile, 'utf8');
      
      // Split into individual statements (rough split on semicolons)
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`   Found ${statements.length} SQL statements`);

      // Execute statements one by one
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.length < 10) continue;
        
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });
          
          if (error) {
            console.log(`   ⚠️  Statement ${i + 1} warning: ${error.message}`);
          } else {
            console.log(`   ✅ Statement ${i + 1} executed`);
          }
        } catch (err) {
          console.log(`   ⚠️  Statement ${i + 1} error: ${err.message}`);
        }
      }

      console.log('✅ Schema deployment complete');
      
    } catch (error) {
      console.error('❌ Schema deployment failed:', error.message);
      throw error;
    }
  }

  async generateSampleData() {
    console.log('📊 Generating sample data...');
    
    try {
      // Generate synthetic data using Python script
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [
          path.join(__dirname, 'fmcg-tobacco-generator.py')
        ]);

        pythonProcess.stdout.on('data', (data) => {
          console.log(`   ${data.toString().trim()}`);
        });

        pythonProcess.stderr.on('data', (data) => {
          console.error(`   Error: ${data.toString().trim()}`);
        });

        pythonProcess.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Sample data generated');
            resolve();
          } else {
            reject(new Error(`Python script failed with code ${code}`));
          }
        });
      });

    } catch (error) {
      console.error('❌ Sample data generation failed:', error.message);
      throw error;
    }
  }

  async loadSampleData() {
    console.log('💾 Loading sample data into Supabase...');
    
    try {
      // Check if CSV file exists
      const csvFile = path.join(__dirname, '..', 'comprehensive_fmcg_tobacco.csv');
      
      if (!fs.existsSync(csvFile)) {
        throw new Error('Sample data CSV not found. Run generateSampleData() first.');
      }

      // For now, we'll create a simplified data loading approach
      // In production, you'd use the postgres-data-loader.py script
      
      console.log('📄 CSV file ready for import');
      console.log('ℹ️  Use the Supabase dashboard to import the CSV file:');
      console.log(`   1. Go to ${SUPABASE_URL}/project/cxzllzyxwpyptfretryc/editor`);
      console.log(`   2. Navigate to the transactions table`);
      console.log(`   3. Click "Insert" > "Import data from CSV"`);
      console.log(`   4. Upload: ${csvFile}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Data loading failed:', error.message);
      throw error;
    }
  }

  async setupRLS() {
    console.log('🔒 Setting up Row Level Security...');
    
    const rls_policies = [
      // Allow authenticated users to read all data
      `
      CREATE POLICY "Enable read access for authenticated users" ON transactions
      FOR SELECT USING (auth.role() = 'authenticated');
      `,
      
      `
      CREATE POLICY "Enable read access for authenticated users" ON transaction_items
      FOR SELECT USING (auth.role() = 'authenticated');
      `,
      
      `
      CREATE POLICY "Enable read access for authenticated users" ON stores
      FOR SELECT USING (auth.role() = 'authenticated');
      `,
      
      `
      CREATE POLICY "Enable read access for authenticated users" ON products
      FOR SELECT USING (auth.role() = 'authenticated');
      `,
      
      `
      CREATE POLICY "Enable read access for authenticated users" ON brands
      FOR SELECT USING (auth.role() = 'authenticated');
      `,
      
      // Enable RLS on tables
      'ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE stores ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE products ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE brands ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE customers ENABLE ROW LEVEL SECURITY;'
    ];

    for (const policy of rls_policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
          console.log(`   ⚠️  RLS policy warning: ${error.message}`);
        }
      } catch (err) {
        console.log(`   ⚠️  RLS policy error: ${err.message}`);
      }
    }

    console.log('✅ RLS setup complete');
  }

  async createAPIFunctions() {
    console.log('⚡ Creating API functions...');
    
    const functions = [
      {
        name: 'get_transaction_trends',
        sql: `
        CREATE OR REPLACE FUNCTION get_transaction_trends(
          p_region TEXT DEFAULT NULL,
          p_start_date DATE DEFAULT NULL,
          p_end_date DATE DEFAULT NULL
        )
        RETURNS TABLE(
          date DATE,
          hour_of_day INTEGER,
          transaction_count BIGINT,
          total_value DECIMAL,
          avg_value DECIMAL
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            DATE(t.timestamp) as date,
            t.hour_of_day,
            COUNT(*)::BIGINT as transaction_count,
            SUM(t.transaction_value) as total_value,
            AVG(t.transaction_value) as avg_value
          FROM transactions t
          JOIN stores s ON t.store_id = s.store_id
          WHERE 
            (p_region IS NULL OR s.region = p_region)
            AND (p_start_date IS NULL OR DATE(t.timestamp) >= p_start_date)
            AND (p_end_date IS NULL OR DATE(t.timestamp) <= p_end_date)
          GROUP BY DATE(t.timestamp), t.hour_of_day
          ORDER BY date, hour_of_day;
        END;
        $$ LANGUAGE plpgsql;
        `
      },
      
      {
        name: 'get_substitution_data',
        sql: `
        CREATE OR REPLACE FUNCTION get_substitution_data(
          p_region TEXT DEFAULT NULL
        )
        RETURNS TABLE(
          original_product TEXT,
          substituted_product TEXT,
          original_brand TEXT,
          substituted_brand TEXT,
          substitution_count BIGINT
        ) AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            p_orig.product_name as original_product,
            p_sub.product_name as substituted_product,
            b_orig.brand_name as original_brand,
            b_sub.brand_name as substituted_brand,
            COUNT(*)::BIGINT as substitution_count
          FROM transaction_items ti
          JOIN products p_orig ON ti.original_sku_id = p_orig.sku_id
          JOIN products p_sub ON ti.sku_id = p_sub.sku_id
          JOIN brands b_orig ON p_orig.brand_id = b_orig.brand_id
          JOIN brands b_sub ON p_sub.brand_id = b_sub.brand_id
          JOIN transactions t ON ti.transaction_id = t.transaction_id
          JOIN stores s ON t.store_id = s.store_id
          WHERE 
            ti.was_substituted = TRUE
            AND (p_region IS NULL OR s.region = p_region)
          GROUP BY p_orig.product_name, p_sub.product_name, b_orig.brand_name, b_sub.brand_name
          ORDER BY substitution_count DESC;
        END;
        $$ LANGUAGE plpgsql;
        `
      }
    ];

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: func.sql });
        if (error) {
          console.log(`   ⚠️  Function ${func.name} warning: ${error.message}`);
        } else {
          console.log(`   ✅ Function ${func.name} created`);
        }
      } catch (err) {
        console.log(`   ⚠️  Function ${func.name} error: ${err.message}`);
      }
    }

    console.log('✅ API functions created');
  }

  async testConnection() {
    console.log('🔍 Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('count', { count: 'exact', head: true });

      if (error) throw error;

      console.log(`✅ Connection successful - found ${data || 0} stores`);
      return true;
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 Starting Scout Dashboard v4.0 Supabase Deployment');
    console.log('====================================================\n');

    try {
      // 1. Test connection
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to Supabase');
      }

      // 2. Deploy schema
      await this.deploySchema();

      // 3. Setup RLS
      await this.setupRLS();

      // 4. Create API functions
      await this.createAPIFunctions();

      // 5. Generate sample data
      await this.generateSampleData();

      // 6. Instructions for data loading
      await this.loadSampleData();

      console.log('\n✅ Deployment completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Import the generated CSV data through Supabase dashboard');
      console.log('2. Run: npm run dev to test the dashboard locally');
      console.log('3. Deploy to Vercel/Netlify for production');
      console.log('\n🔗 Supabase Dashboard:', `${SUPABASE_URL}/project/cxzllzyxwpyptfretryc`);

    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployment = new SupabaseDeployment();
  deployment.run();
}

export { SupabaseDeployment };