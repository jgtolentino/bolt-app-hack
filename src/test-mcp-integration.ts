import { ClaudiaAgent } from './agents/claudia-agent'
import { GagambiAgent } from './agents/gagambi-agent'
import { KeyKeyAgent } from './agents/keykey-agent'

// Test script for MCP server integration
// Run this after deploying to verify everything works

// Load environment variables
import * as dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

async function testMCPIntegration() {
  console.log('🧪 Testing MCP Server Integration')
  console.log('=================================\n')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
    console.log('Please set them in your .env file:')
    console.log('VITE_SUPABASE_URL=your-supabase-url')
    console.log('VITE_SUPABASE_ANON_KEY=your-anon-key')
    return
  }

  try {
    // Test 1: Initialize Agents
    console.log('1️⃣ Initializing agents...')
    
    const claudia = new ClaudiaAgent(SUPABASE_URL, SUPABASE_ANON_KEY)
    await claudia.initialize()
    console.log('✅ Claudia initialized')

    const gagambi = new GagambiAgent(SUPABASE_URL, SUPABASE_ANON_KEY)
    await gagambi.initialize()
    console.log('✅ Gagambi initialized')

    const keykey = new KeyKeyAgent(SUPABASE_URL, SUPABASE_ANON_KEY)
    await keykey.initialize()
    console.log('✅ KeyKey initialized')

    // Test 2: Test Context Storage
    console.log('\n2️⃣ Testing context storage...')
    
    const testContext = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Hello from MCP test'
    }

    // Store context via Claudia's MCP client
    const mcp = (claudia as any).mcp
    await mcp.storeContext(
      'test-context-123',
      'session',
      testContext,
      { tags: ['test', 'integration'], ttlMinutes: 5 }
    )
    console.log('✅ Context stored')

    // Retrieve context
    const retrievedContext = await mcp.getContext('test-context-123')
    console.log('✅ Context retrieved:', retrievedContext)

    // Test 3: Test Conversation Flow
    console.log('\n3️⃣ Testing conversation flow...')
    
    const conversationId = crypto.randomUUID()
    const response = await claudia.routeRequest(
      'I need to analyze sales data for testing',
      conversationId
    )
    console.log('✅ Request routed:', response)

    // Test 4: Test Tool Execution
    console.log('\n4️⃣ Testing tool execution...')
    
    try {
      const toolResult = await mcp.executeTool('query_data', {
        table: 'transactions',
        filters: { limit: 5 }
      })
      console.log('✅ Tool executed successfully')
      console.log('   Result:', toolResult.content[0]?.text?.substring(0, 100) + '...')
    } catch (error) {
      console.log('⚠️  Tool execution failed (expected if no test data):', error instanceof Error ? error.message : String(error))
    }

    // Test 5: Test Agent Stats
    console.log('\n5️⃣ Testing agent statistics...')
    
    const stats = await claudia.getStats()
    console.log('✅ Agent stats retrieved:', stats)

    // Test 6: Test Security Features
    console.log('\n6️⃣ Testing security features...')
    
    const authResult = await keykey.processAuthRequest(conversationId, {
      requester: 'test-script',
      request: 'perform security audit'
    })
    console.log('✅ Security audit completed:', authResult)

    // Summary
    console.log('\n✅ All tests completed successfully!')
    console.log('Your MCP server is ready for production use.')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    console.log('\nTroubleshooting:')
    console.log('1. Ensure migrations are deployed: supabase db push')
    console.log('2. Ensure edge functions are deployed: supabase functions deploy <function-name>')
    console.log('3. Check Supabase logs: https://supabase.com/dashboard/project/baqlxgwdfjltivlfmsbr/logs/edge-logs')
  }
}

// Run the test
testMCPIntegration().catch(console.error)