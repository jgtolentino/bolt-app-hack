/**
 * Environment validation for production builds
 * Ensures required API keys are present
 */

export function validateEnvironment(): void {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const aiVars = [
    'VITE_OPENAI_API_KEY',
    'VITE_ANTHROPIC_API_KEY'
  ];

  // Check required vars
  const missing = requiredVars.filter(key => !import.meta.env[key]);
  if (missing.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  }

  // Check that at least one AI provider is configured
  const hasAI = aiVars.some(key => import.meta.env[key]);
  if (!hasAI) {
    throw new Error('❌ No AI provider configured. Set either VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY');
  }

  // Validate API key format
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (openaiKey && !openaiKey.startsWith('sk-')) {
    throw new Error('❌ Invalid OpenAI API key format. Must start with "sk-"');
  }

  const anthropicKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (anthropicKey && !anthropicKey.startsWith('sk-ant-')) {
    throw new Error('❌ Invalid Anthropic API key format. Must start with "sk-ant-"');
  }

  console.log('✅ Environment validation passed');
  console.log(`✅ AI Providers configured: ${[
    openaiKey ? 'OpenAI' : null,
    anthropicKey ? 'Anthropic' : null
  ].filter(Boolean).join(', ')}`);
}