import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

async function testDatabase() {
  console.log('🔍 Checking MCP Database Status')
  console.log('================================\n')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Test 1: Check if tables exist
  console.log('1️⃣ Checking database tables...')
  
  const tables = [
    'mcp_agents',
    'mcp_contexts', 
    'mcp_tools',
    'mcp_messages',
    'mcp_resources',
    'mcp_prompts'
  ]

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Table exists`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err}`)
    }
  }

  // Test 2: Check if RPC functions exist
  console.log('\n2️⃣ Checking RPC functions...')
  
  try {
    const { data, error } = await supabase.rpc('mcp_get_agent', {
      p_name: 'claudia'
    })
    
    if (error) {
      console.log(`❌ RPC functions: ${error.message}`)
    } else {
      console.log(`✅ RPC functions: Working`)
      if (data && data.length > 0) {
        console.log(`   Found agent: ${data[0].name}`)
      }
    }
  } catch (err) {
    console.log(`❌ RPC functions: ${err}`)
  }

  // Test 3: Check edge functions
  console.log('\n3️⃣ Checking edge functions...')
  
  const edgeFunctions = [
    'mcp-register-agent',
    'mcp-store-context',
    'mcp-execute-tool',
    'mcp-send-message'
  ]

  for (const func of edgeFunctions) {
    try {
      const { data, error } = await supabase.functions.invoke(func, {
        body: {},
        method: 'OPTIONS'
      })
      
      if (error) {
        console.log(`❌ ${func}: Not deployed`)
      } else {
        console.log(`✅ ${func}: Deployed`)
      }
    } catch (err) {
      console.log(`❌ ${func}: Not accessible`)
    }
  }

  console.log('\n📊 Summary:')
  console.log('If you see errors above, you need to:')
  console.log('1. Deploy migrations: ./scripts/deploy-mcp-server.sh')
  console.log('2. Or manually: supabase db push')
  console.log('3. Deploy functions: supabase functions deploy <function-name>')
}

testDatabase().catch(console.error)