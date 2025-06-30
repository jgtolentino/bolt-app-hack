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

async function debugInserts() {
  console.log('🔍 Debugging table inserts...\n');
  
  // Test customer_segments insert
  console.log('Testing customer_segments insert:');
  try {
    const testSegment = {
      segment_name: 'Test Segment',
      segment_type: 'behavioral',
      description: 'Test description',
      criteria: { test: 'value' }
    };
    
    const { data, error } = await supabase
      .from('customer_segments')
      .insert(testSegment)
      .select();
    
    if (error) {
      console.error('Customer segments error:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ Customer segment inserted:', data);
      // Clean up test
      await supabase.from('customer_segments').delete().eq('segment_name', 'Test Segment');
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
  
  // Test ai_insights insert
  console.log('\nTesting ai_insights insert:');
  try {
    const testInsight = {
      insight_type: 'test_type',
      category: 'test',
      title: 'Test Insight',
      description: 'Test description',
      metadata: { test: 'value' }
    };
    
    const { data, error } = await supabase
      .from('ai_insights')
      .insert(testInsight)
      .select();
    
    if (error) {
      console.error('AI insights error:', error.message);
      console.error('Error details:', error);
    } else {
      console.log('✅ AI insight inserted:', data);
      // Clean up test
      await supabase.from('ai_insights').delete().eq('title', 'Test Insight');
    }
  } catch (e) {
    console.error('Unexpected error:', e);
  }
  
  // Check if tables exist
  console.log('\nChecking if tables exist:');
  try {
    const { data: tables } = await supabase.rpc('get_tables');
    console.log('Available tables:', tables?.map(t => t.table_name).join(', '));
  } catch (e) {
    // Try alternative method
    try {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('id')
        .limit(0);
      
      if (error) {
        console.log('customer_segments table might not exist:', error.message);
      } else {
        console.log('customer_segments table exists');
      }
    } catch (e2) {
      console.error('Error checking tables:', e2);
    }
  }
}

debugInserts();