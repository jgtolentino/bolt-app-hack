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

async function applyMissingTables() {
  console.log('📋 Applying missing tables to Supabase...\n');
  
  console.log('Since we cannot create tables directly via the API, please run these SQL commands in your Supabase SQL Editor:\n');
  
  const sqlCommands = `
-- ========================================
-- CUSTOMER SEGMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_name text NOT NULL,
  segment_type text NOT NULL, -- 'demographic', 'behavioral', 'rfm'
  description text,
  criteria jsonb NOT NULL, -- Segment criteria
  customer_count integer DEFAULT 0,
  avg_transaction_value numeric(10,2),
  total_revenue numeric(12,2),
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access" ON customer_segments 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage" ON customer_segments 
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX idx_customer_segments_created ON customer_segments(created_at);

-- ========================================
-- AI INSIGHTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL, -- 'anomaly', 'trend', 'recommendation', 'prediction'
  category text NOT NULL, -- 'sales', 'inventory', 'customer', 'pricing'
  severity text DEFAULT 'info', -- 'info', 'warning', 'critical', 'opportunity'
  title text NOT NULL,
  description text NOT NULL,
  data jsonb, -- Supporting data
  action_items jsonb, -- Recommended actions
  is_active boolean DEFAULT true,
  is_acknowledged boolean DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public read access" ON ai_insights 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage" ON ai_insights 
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_category ON ai_insights(category);
CREATE INDEX idx_ai_insights_active ON ai_insights(is_active);
CREATE INDEX idx_ai_insights_created ON ai_insights(created_at);

-- ========================================
-- CREATE UPDATE TRIGGERS
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_segments_updated_at 
  BEFORE UPDATE ON customer_segments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at 
  BEFORE UPDATE ON ai_insights 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

  console.log(sqlCommands);
  
  console.log('\n📝 Instructions:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL commands above');
  console.log('4. Click "Run" to execute');
  console.log('5. Then run: node scripts/populate-missing-tables.js');
  
  // Try to check if tables exist
  console.log('\n🔍 Checking current table status...');
  
  try {
    const { error: csError } = await supabase
      .from('customer_segments')
      .select('id')
      .limit(1);
    
    if (csError) {
      console.log('❌ customer_segments table does not exist');
    } else {
      console.log('✅ customer_segments table exists');
    }
    
    const { error: aiError } = await supabase
      .from('ai_insights')
      .select('id')
      .limit(1);
    
    if (aiError) {
      console.log('❌ ai_insights table does not exist');
    } else {
      console.log('✅ ai_insights table exists');
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

applyMissingTables();