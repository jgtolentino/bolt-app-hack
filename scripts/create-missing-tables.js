import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingTables() {
  console.log('📋 Creating missing tables...\n');
  
  try {
    // Create customer_segments table
    console.log('Creating customer_segments table...');
    const createCustomerSegments = `
      CREATE TABLE IF NOT EXISTS customer_segments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        segment_name TEXT NOT NULL,
        segment_type TEXT NOT NULL,
        description TEXT NOT NULL,
        criteria JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    
    const { error: csError } = await supabase.rpc('exec_sql', { sql: createCustomerSegments });
    if (csError) {
      console.error('Error creating customer_segments:', csError);
    } else {
      console.log('✅ customer_segments table created');
    }
    
    // Create ai_insights table
    console.log('\nCreating ai_insights table...');
    const createAIInsights = `
      CREATE TABLE IF NOT EXISTS ai_insights (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        insight_type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    
    const { error: aiError } = await supabase.rpc('exec_sql', { sql: createAIInsights });
    if (aiError) {
      console.error('Error creating ai_insights:', aiError);
    } else {
      console.log('✅ ai_insights table created');
    }
    
    // Grant permissions
    console.log('\nGranting permissions...');
    const grantPerms = `
      GRANT SELECT, INSERT, UPDATE, DELETE ON customer_segments TO authenticated, anon;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ai_insights TO authenticated, anon;
    `;
    
    await supabase.rpc('exec_sql', { sql: grantPerms });
    
    console.log('\n✅ Tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
    
    console.log('\n📝 Manual SQL to create tables:');
    console.log('Run these in your Supabase SQL editor:\n');
    
    console.log(`-- Customer Segments Table
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_name TEXT NOT NULL,
  segment_type TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_segments TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_insights TO authenticated, anon;`);
  }
}

createMissingTables();