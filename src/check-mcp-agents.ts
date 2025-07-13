import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

async function checkAgents() {
  console.log('🤖 MCP Agents Status')
  console.log('===================\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Check agents
  const { data: agents, error } = await supabase
    .from('mcp_agents')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching agents:', error)
    return
  }

  console.log(`Found ${agents?.length || 0} agents:\n`)
  
  agents?.forEach((agent: any) => {
    console.log(`✅ ${agent.name}`)
    console.log(`   Category: ${agent.category}`)
    console.log(`   Status: ${agent.status}`)
    console.log(`   Description: ${agent.description}`)
    console.log(`   Capabilities:`, agent.capabilities)
    console.log()
  })

  // Check tools
  const { data: tools, error: _toolsError } = await supabase
    .from('mcp_tools')
    .select('*')

  console.log(`\n📦 Found ${tools?.length || 0} tools:`)
  tools?.forEach((tool: any) => {
    console.log(`- ${tool.name}: ${tool.description}`)
  })
}

checkAgents().catch(console.error)