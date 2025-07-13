import { createClient } from '@supabase/supabase-js'

// Hardcode the values for testing
const SUPABASE_URL = 'https://baqlxgwdfjltivlfmsbr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhcWx4Z3dkZmpsdGl2bGZtc2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNTc5OTYsImV4cCI6MjA2NjczMzk5Nn0.lq1ZFea-FCiYnRGtwTgo-6e_TUQ2YYPeqJ3I9SVVkak'

async function testConnection() {
  console.log('🔌 Testing Supabase Connection')
  console.log('==============================\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Test basic connection with a simple query
  console.log('Testing connection to existing tables...')
  
  try {
    // Try to query the transactions table which should exist
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('❌ Connection error:', error.message)
      console.log('   Error code:', error.code)
      console.log('   Error details:', error.details)
    } else {
      console.log('✅ Successfully connected to Supabase!')
      console.log('   Found', data?.length || 0, 'transactions')
    }

    // Now test MCP tables
    console.log('\nChecking MCP tables...')
    const { data: agentsData, error: agentsError } = await supabase
      .from('mcp_agents')
      .select('*')
      .limit(1)
    
    if (agentsError) {
      if (agentsError.code === '42P01') {
        console.log('❌ MCP tables not found - migrations need to be deployed')
        console.log('\nTo deploy:')
        console.log('1. Run: supabase db push')
        console.log('2. Enter your database password when prompted')
        console.log('3. Password is in: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/settings/database')
      } else {
        console.log('❌ Error accessing MCP tables:', agentsError.message)
      }
    } else {
      console.log('✅ MCP tables exist!')
      if (agentsData && agentsData.length > 0) {
        console.log('   Found agents:', agentsData.map((a: any) => a.name).join(', '))
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testConnection().catch(console.error)