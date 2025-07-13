import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import agents from '../agents/all_agents.json'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

async function registerAllAgents() {
  console.log('🤖 Registering All 66 Pulser Agents')
  console.log('===================================\n')

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // First, check how many agents already exist
  const { data: existingAgents, error: checkError } = await supabase
    .from('mcp_agents')
    .select('name')

  if (checkError) {
    console.error('Error checking existing agents:', checkError)
    return
  }

  const existingNames = new Set(existingAgents?.map((a: any) => a.name) || [])
  console.log(`Found ${existingNames.size} existing agents\n`)

  let registered = 0
  let skipped = 0
  let failed = 0

  // Register each agent
  for (const agent of agents) {
    try {
      // Skip if already exists
      if (existingNames.has(agent.name)) {
        console.log(`⏭️  Skipping ${agent.name} (already exists)`)
        skipped++
        continue
      }

      // Use upsert to handle conflicts gracefully
      const { data: _data, error } = await supabase
        .from('mcp_agents')
        .upsert({
          name: agent.name,
          description: agent.description,
          category: agent.category,
          capabilities: agent.capabilities,
          status: 'active',
          version: '1.0.0',
          permissions: agent.capabilities.permissions || [],
          memory_tags: [agent.capabilities.memory_scope || 'session']
        }, {
          onConflict: 'name'
        })

      if (error) {
        console.error(`❌ Failed to register ${agent.name}:`, error.message)
        failed++
      } else {
        console.log(`✅ Registered: ${agent.name} (${agent.category})`)
        registered++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (err) {
      console.error(`❌ Error with ${agent.name}:`, err)
      failed++
    }
  }

  // Summary
  console.log('\n📊 Registration Summary')
  console.log('======================')
  console.log(`✅ Registered: ${registered}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📋 Total: ${agents.length}`)

  // Verify final count
  const { count, error: countError } = await supabase
    .from('mcp_agents')
    .select('*', { count: 'exact', head: true })

  if (!countError) {
    console.log(`\n✨ Total agents in database: ${count}`)
  }

  // Grant initial tool permissions for some agents
  console.log('\n🔧 Granting tool permissions...')
  
  const toolPermissions = [
    { agent: 'claudia', tools: ['generate_insight', 'send_notification'] },
    { agent: 'gagambi', tools: ['query_data'] },
    { agent: 'dash', tools: ['query_data'] },
    { agent: 'retailbot', tools: ['query_data'] },
    { agent: 'cesai', tools: ['generate_insight'] }
  ]

  for (const perm of toolPermissions) {
    // Get agent ID
    const { data: agent } = await supabase
      .from('mcp_agents')
      .select('id')
      .eq('name', perm.agent)
      .single()

    if (!agent) continue

    // Get tool IDs
    const { data: tools } = await supabase
      .from('mcp_tools')
      .select('id')
      .in('name', perm.tools)

    if (!tools) continue

    // Grant permissions
    for (const tool of tools) {
      await supabase
        .from('mcp_agent_tools')
        .upsert({
          agent_id: agent.id,
          tool_id: tool.id
        }, {
          onConflict: 'agent_id,tool_id'
        })
    }
  }

  console.log('✅ Tool permissions granted')
  console.log('\n🎉 All agents registered successfully!')
}

// Run the registration
registerAllAgents().catch(console.error)