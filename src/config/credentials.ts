/**
 * Centralized Credentials Configuration
 * All API keys and sensitive credentials in one secure location
 * 
 * POC Testing: Test API keys are provided for demo purposes
 * Replace with your own keys for production use
 */

interface Credentials {
  // Database
  database: {
    url: string;
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
  
  // AI Providers
  ai: {
    openai: {
      apiKey?: string;
      model: string;
      organization?: string;
    };
    anthropic: {
      apiKey?: string;
      model: string;
    };
    groq: {
      apiKey?: string;
      model: string;
    };
  };
  
  // Analytics
  analytics: {
    google: {
      trackingId?: string;
    };
  };
  
  // Other Services
  services: {
    gadmBaseUrl?: string;
  };
}

/**
 * Load and validate credentials from environment variables
 */
function loadCredentials(): Credentials {
  // Helper to get env var with fallback (browser-safe)
  const getEnv = (key: string, fallback?: string): string => {
    // In browser, only import.meta.env is available
    const value = import.meta.env[key] || fallback;
    if (!value && !fallback) {
      console.warn(`Missing environment variable: ${key}`);
    }
    return value || '';
  };
  
  // Check for production/dev environment keys first
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;
  
  // Use real keys from environment if available, otherwise provide instructions
  const POC_FALLBACK_KEYS = {
    openai: '',  // Will use env var or prompt user to add key
    anthropic: '' // Will use env var or prompt user to add key
  };
  
  return {
    // Database Configuration
    database: {
      url: getEnv('DATABASE_URL', ''),
      host: getEnv('PGHOST', 'localhost'),
      port: parseInt(getEnv('PGPORT', '5432')),
      database: getEnv('PGDATABASE', 'scout_local'),
      user: getEnv('PGUSER', 'postgres'),
      password: getEnv('PGPASSWORD', '')
    },
    
    // Supabase Configuration
    supabase: {
      url: getEnv('VITE_SUPABASE_URL', ''),
      anonKey: getEnv('VITE_SUPABASE_ANON_KEY', ''),
      serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY')
    },
    
    // AI Provider Configuration
    ai: {
      openai: {
        apiKey: getEnv('VITE_OPENAI_API_KEY', POC_FALLBACK_KEYS.openai),
        model: getEnv('VITE_AI_MODEL', 'gpt-4'),
        organization: getEnv('VITE_OPENAI_ORG')
      },
      anthropic: {
        apiKey: getEnv('VITE_ANTHROPIC_API_KEY', POC_FALLBACK_KEYS.anthropic),
        model: getEnv('VITE_ANTHROPIC_MODEL', 'claude-3-sonnet-20240229')
      },
      groq: {
        apiKey: getEnv('VITE_GROQ_API_KEY'),
        model: getEnv('VITE_GROQ_MODEL', 'mixtral-8x7b-32768')
      }
    },
    
    // Analytics Configuration
    analytics: {
      google: {
        trackingId: getEnv('VITE_GA_TRACKING_ID')
      }
    },
    
    // Other Services
    services: {
      gadmBaseUrl: getEnv('VITE_GADM_BASE_URL')
    }
  };
}

// Singleton instance
let credentialsInstance: Credentials | null = null;

/**
 * Get credentials instance (singleton)
 */
export function getCredentials(): Credentials {
  if (!credentialsInstance) {
    credentialsInstance = loadCredentials();
  }
  return credentialsInstance;
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(): {
  valid: boolean;
  missing: string[];
} {
  const creds = getCredentials();
  const missing: string[] = [];
  
  // Check required Supabase credentials
  if (!creds.supabase.url) missing.push('VITE_SUPABASE_URL');
  if (!creds.supabase.anonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  // Check if at least one AI provider is configured
  const hasAIProvider = 
    creds.ai.openai.apiKey || 
    creds.ai.anthropic.apiKey || 
    creds.ai.groq.apiKey;
    
  if (!hasAIProvider) {
    missing.push('At least one AI provider API key (OpenAI, Anthropic, or Groq)');
  }
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Check if a specific AI provider is configured
 */
export function hasAIProvider(provider: 'openai' | 'anthropic' | 'groq'): boolean {
  const creds = getCredentials();
  return !!creds.ai[provider].apiKey;
}

/**
 * Get the preferred AI provider based on availability
 */
export function getPreferredAIProvider(): 'openai' | 'anthropic' | 'groq' | null {
  if (hasAIProvider('anthropic')) return 'anthropic';
  if (hasAIProvider('openai')) return 'openai';
  if (hasAIProvider('groq')) return 'groq';
  return null;
}

/**
 * Get fallback AI provider
 */
export function getFallbackAIProvider(primary: 'openai' | 'anthropic' | 'groq'): 'openai' | 'anthropic' | 'groq' | null {
  const providers: Array<'openai' | 'anthropic' | 'groq'> = ['openai', 'anthropic', 'groq'];
  
  for (const provider of providers) {
    if (provider !== primary && hasAIProvider(provider)) {
      return provider;
    }
  }
  
  return null;
}

/**
 * Mask sensitive values for logging
 */
export function maskCredentials(value: string | undefined): string {
  if (!value) return 'not-set';
  if (value.length < 8) return '***';
  return value.substring(0, 4) + '...' + value.substring(value.length - 4);
}

/**
 * Log current credential status (safely)
 */
export function logCredentialStatus(): void {
  const creds = getCredentials();
  
  console.log('Credential Status:');
  console.log('==================');
  console.log('Database:', creds.database.url ? '✓ Configured' : '✗ Missing');
  console.log('Supabase URL:', creds.supabase.url ? '✓ Configured' : '✗ Missing');
  console.log('Supabase Anon Key:', maskCredentials(creds.supabase.anonKey));
  console.log('OpenAI API Key:', maskCredentials(creds.ai.openai.apiKey));
  console.log('Anthropic API Key:', maskCredentials(creds.ai.anthropic.apiKey));
  console.log('Groq API Key:', maskCredentials(creds.ai.groq.apiKey));
  console.log('Google Analytics:', creds.analytics.google.trackingId ? '✓ Configured' : '✗ Not configured');
  
  const validation = validateCredentials();
  if (!validation.valid) {
    console.warn('Missing required credentials:', validation.missing);
  }
}

// Export credentials object for direct access (use sparingly)
export const credentials = getCredentials();