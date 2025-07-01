import { createClient } from '@supabase/supabase-js'
import { getCredentials } from '../config/credentials'

// Get credentials from centralized config
const credentials = getCredentials()
const supabaseUrl = credentials.supabase.url
const supabaseAnonKey = credentials.supabase.anonKey

// Check if environment variables are placeholder values
const isPlaceholderUrl = !supabaseUrl || 
  supabaseUrl === 'https://your-project.supabase.co' || 
  supabaseUrl.includes('your-project')

const isPlaceholderKey = !supabaseAnonKey || 
  supabaseAnonKey === 'your-anon-key' || 
  supabaseAnonKey.length < 20

// Declare supabase variable at top level
let supabase: any

// Validate that required environment variables are present and not placeholders
if (!supabaseUrl || !supabaseAnonKey || isPlaceholderUrl || isPlaceholderKey) {
  const errorMessage = `
🔗 Supabase Connection Required

Your Supabase credentials are not configured. To connect:

1. Click the "Connect to Supabase" button in the top right corner
2. Or manually update your .env file with:
   - VITE_SUPABASE_URL=your-actual-supabase-url
   - VITE_SUPABASE_ANON_KEY=your-actual-anon-key

Current values:
- URL: ${supabaseUrl || 'not set'}
- Key: ${supabaseAnonKey ? 'set but invalid' : 'not set'}
  `
  
  console.error(errorMessage)
  
  // Create a mock client that will show helpful errors
  const mockClient = {
    from: () => ({
      select: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" in the top right corner.')),
      insert: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" in the top right corner.')),
      update: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" in the top right corner.')),
      delete: () => Promise.reject(new Error('Supabase not connected. Please click "Connect to Supabase" in the top right corner.'))
    }),
    auth: {
      signUp: () => Promise.reject(new Error('Supabase not connected')),
      signIn: () => Promise.reject(new Error('Supabase not connected')),
      signOut: () => Promise.reject(new Error('Supabase not connected')),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  }
  
  // Assign the mock client to the variable
  supabase = mockClient
} else {
  // Create the real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: { 
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    }
  })
}

// Enhanced function for Supabase Pro - can handle much larger datasets
export async function fetchAllRecords<T>(
  query: any, // The base query builder
  pageSize = 10000, // Increased page size for Pro plan
  maxRecords = 1000000 // Pro plan can handle up to 1M records
): Promise<T[]> {
  // Check if Supabase is properly configured
  if (isPlaceholderUrl || isPlaceholderKey) {
    throw new Error('Supabase not connected. Please click "Connect to Supabase" in the top right corner to set up your database connection.')
  }

  let allRecords: T[] = [];
  let page = 0;
  let hasMore = true;

  console.log(`🔄 Fetching records with Pro plan optimization (page size: ${pageSize})`);

  while (hasMore && allRecords.length < maxRecords) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    
    console.log(`📄 Fetching page ${page + 1} (records ${start}-${end})`);
    
    try {
      // Apply range for this page
      const { data, error, count } = await query
        .range(start, end);
      
      if (error) {
        console.error('Error fetching records:', error);
        
        // Provide more helpful error messages
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to Supabase. Please check your internet connection and Supabase configuration.')
        }
        
        throw error;
      }
      
      if (data && data.length > 0) {
        allRecords = [...allRecords, ...data];
        page++;
        
        // If we got fewer records than requested, we've reached the end
        hasMore = data.length === pageSize;
        
        // Log progress for large datasets
        if (count && count > 10000) {
          const progress = Math.min(100, (allRecords.length / count) * 100);
          console.log(`📊 Progress: ${progress.toFixed(1)}% (${allRecords.length}/${count} records)`);
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error('Network error while fetching records:', error);
      
      // Provide user-friendly error message
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Connection failed. Please ensure Supabase is properly configured and your internet connection is stable.')
      }
      
      throw error;
    }
  }
  
  console.log(`✅ Fetched ${allRecords.length} total records`);
  return allRecords;
}

// Pro plan optimized query builder
export function createOptimizedQuery(tableName: string) {
  return supabase
    .from(tableName)
    .select('*', { count: 'exact' });
}

// Batch processing for large datasets
export async function processBatchQuery<T>(
  query: any,
  batchSize = 50000,
  processor: (batch: T[]) => Promise<void>
): Promise<void> {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await query
      .range(offset, offset + batchSize - 1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      await processor(data);
      offset += batchSize;
      hasMore = data.length === batchSize;
    } else {
      hasMore = false;
    }
  }
}

// Test Supabase connection with Pro plan features
export const testSupabaseConnection = async () => {
  try {
    // Check if credentials are configured
    if (isPlaceholderUrl || isPlaceholderKey) {
      console.warn('⚠️ Supabase credentials not configured. Please connect to Supabase.')
      return false
    }

    // Test basic connection
    const { data, error, count } = await supabase
      .from('geography')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.warn('Supabase connection test failed:', error.message)
      
      if (error.message.includes('Failed to fetch')) {
        console.warn('💡 This usually means your Supabase URL or API key is incorrect, or there are network connectivity issues.')
      }
      
      return false
    }
    
    console.log('✅ Supabase connected successfully')
    console.log(`📊 Pro Plan Status: Can access ${count || 0} geography records`)
    
    // Test Pro plan features
    const { data: largeQuery } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true });
    
    if (largeQuery !== null) {
      console.log('🚀 Pro plan features available - large dataset access enabled')
    }
    
    return true
  } catch (error) {
    console.warn('Supabase connection test failed:', error)
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.warn('💡 Network error: Please check your internet connection and Supabase configuration.')
    }
    
    return false
  }
}

// Function to fetch substitution patterns
export async function fetchSubstitutionPatterns(filters: any = {}) {
  try {
    let query = supabase
      .from('v_substitution_analysis')
      .select('*');
    
    // Apply filters if provided
    if (filters.category) {
      query = query.eq('original_category', filters.category);
    }
    
    if (filters.brand) {
      query = query.eq('original_brand', filters.brand);
    }
    
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    
    if (filters.minRate) {
      query = query.gte('acceptance_rate', filters.minRate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform data to match the SubstitutionPattern interface
    return data.map((item: any) => ({
      source: item.original_sku,
      target: item.substituted_sku,
      value: item.substitution_count,
      percentage: item.acceptance_rate,
      sourceCategory: item.original_category,
      targetCategory: item.substituted_category,
      sourceBrand: item.original_brand,
      targetBrand: item.substituted_brand,
      priceImpact: item.price_impact.toLowerCase(),
      region: item.region
    }));
  } catch (error) {
    console.error('Error fetching substitution patterns:', error);
    return [];
  }
}

// Function to record a substitution
export async function recordSubstitution(
  originalSku: string,
  substitutedSku: string,
  geographyId?: string,
  accepted: boolean = true
) {
  try {
    const { data, error } = await supabase.rpc('record_substitution', {
      original_sku: originalSku,
      substituted_sku: substitutedSku,
      geography_id: geographyId,
      accepted: accepted
    });
    
    if (error) throw error;
    
    return { success: true, message: data };
  } catch (error) {
    console.error('Error recording substitution:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Database types for Philippine retail analytics
export interface Database {
  public: {
    Tables: {
      geography: {
        Row: {
          id: string
          region: string
          city_municipality: string
          barangay: string
          store_name: string
          latitude: number
          longitude: number
          population: number | null
          area_sqkm: number | null
          store_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          region: string
          city_municipality: string
          barangay: string
          store_name: string
          latitude: number
          longitude: number
          population?: number | null
          area_sqkm?: number | null
          store_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          region?: string
          city_municipality?: string
          barangay?: string
          store_name?: string
          latitude?: number
          longitude?: number
          population?: number | null
          area_sqkm?: number | null
          store_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization: {
        Row: {
          id: string
          client: string
          category: string
          brand: string
          sku: string
          sku_description: string | null
          unit_price: number | null
          cost_price: number | null
          margin_percent: number | null
          package_size: string | null
          is_competitor: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client: string
          category: string
          brand: string
          sku: string
          sku_description?: string | null
          unit_price?: number | null
          cost_price?: number | null
          margin_percent?: number | null
          package_size?: string | null
          is_competitor?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client?: string
          category?: string
          brand?: string
          sku?: string
          sku_description?: string | null
          unit_price?: number | null
          cost_price?: number | null
          margin_percent?: number | null
          package_size?: string | null
          is_competitor?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          datetime: string
          geography_id: string
          organization_id: string
          total_amount: number
          quantity: number
          unit_price: number | null
          discount_amount: number | null
          payment_method: string | null
          customer_type: string | null
          transaction_source: string | null
          is_processed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          datetime: string
          geography_id: string
          organization_id: string
          total_amount: number
          quantity?: number
          unit_price?: number | null
          discount_amount?: number | null
          payment_method?: string | null
          customer_type?: string | null
          transaction_source?: string | null
          is_processed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          datetime?: string
          geography_id?: string
          organization_id?: string
          total_amount?: number
          quantity?: number
          unit_price?: number | null
          discount_amount?: number | null
          payment_method?: string | null
          customer_type?: string | null
          transaction_source?: string | null
          is_processed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      analytics_daily: {
        Row: {
          id: string
          date: string
          geography_id: string | null
          organization_id: string | null
          total_sales: number | null
          transaction_count: number | null
          avg_transaction_value: number | null
          total_quantity: number | null
          unique_customers: number | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          geography_id?: string | null
          organization_id?: string | null
          total_sales?: number | null
          transaction_count?: number | null
          avg_transaction_value?: number | null
          total_quantity?: number | null
          unique_customers?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          geography_id?: string | null
          organization_id?: string | null
          total_sales?: number | null
          transaction_count?: number | null
          avg_transaction_value?: number | null
          total_quantity?: number | null
          unique_customers?: number | null
          created_at?: string
        }
      }
      substitution_patterns: {
        Row: {
          id: string
          original_product_id: string
          substituted_product_id: string
          geography_id: string | null
          substitution_count: number
          acceptance_rate: number
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          original_product_id: string
          substituted_product_id: string
          geography_id?: string | null
          substitution_count?: number
          acceptance_rate?: number
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          original_product_id?: string
          substituted_product_id?: string
          geography_id?: string | null
          substitution_count?: number
          acceptance_rate?: number
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      v_transaction_summary: {
        Row: {
          transaction_date: string | null
          region: string | null
          city_municipality: string | null
          barangay: string | null
          store_name: string | null
          client: string | null
          category: string | null
          brand: string | null
          sku: string | null
          transaction_count: number | null
          total_sales: number | null
          avg_transaction_value: number | null
          total_quantity: number | null
          payment_methods_used: string | null
        }
      }
      v_geographic_performance: {
        Row: {
          region: string | null
          city_municipality: string | null
          store_count: number | null
          total_transactions: number | null
          total_sales: number | null
          avg_transaction_value: number | null
          total_items_sold: number | null
          active_days: number | null
        }
      }
      v_product_performance: {
        Row: {
          client: string | null
          category: string | null
          brand: string | null
          sku: string | null
          sku_description: string | null
          transaction_count: number | null
          total_sales: number | null
          avg_transaction_value: number | null
          total_quantity_sold: number | null
          unit_price: number | null
          margin_percent: number | null
          estimated_profit: number | null
        }
      }
      v_payment_method_analysis: {
        Row: {
          payment_method: string | null
          transaction_count: number | null
          total_amount: number | null
          avg_transaction_value: number | null
          percentage_of_transactions: number | null
          percentage_of_sales: number | null
          stores_using_method: number | null
          days_with_transactions: number | null
        }
      }
      v_hourly_patterns: {
        Row: {
          hour_of_day: number | null
          transaction_count: number | null
          total_sales: number | null
          avg_transaction_value: number | null
          active_stores: number | null
          payment_methods: string | null
        }
      }
      v_customer_analysis: {
        Row: {
          customer_type: string | null
          transaction_count: number | null
          total_sales: number | null
          avg_transaction_value: number | null
          percentage_of_transactions: number | null
          stores_visited: number | null
          preferred_payment_methods: string | null
        }
      }
      v_substitution_analysis: {
        Row: {
          original_sku: string | null
          original_brand: string | null
          original_category: string | null
          substituted_sku: string | null
          substituted_brand: string | null
          substituted_category: string | null
          substitution_count: number | null
          acceptance_rate: number | null
          region: string | null
          city_municipality: string | null
          substitution_type: string | null
          price_impact: string | null
        }
      }
    }
    Functions: {
      get_geographic_performance: {
        Args: {
          filter_region?: string
          filter_city?: string
          start_date?: string
          end_date?: string
        }
        Returns: {
          region: string
          city_municipality: string
          total_sales: number
          transaction_count: number
          avg_transaction: number
          growth_rate: number
        }[]
      }
      detect_sales_anomalies: {
        Args: {
          threshold_percentage?: number
        }
        Returns: {
          transaction_id: string
          datetime: string
          amount: number
          expected_range: string
          anomaly_type: string
        }[]
      }
      get_payment_method_analysis: {
        Args: {
          start_date?: string
          end_date?: string
        }
        Returns: {
          payment_method: string
          transaction_count: number
          total_amount: number
          percentage: number
          avg_transaction_value: number
        }[]
      }
      get_seasonal_trends: {
        Args: {
          year_filter?: number
        }
        Returns: {
          month_name: string
          month_number: number
          total_sales: number
          transaction_count: number
          avg_transaction: number
          growth_rate: number
        }[]
      }
      record_substitution: {
        Args: {
          original_sku: string
          substituted_sku: string
          geography_id?: string
          accepted?: boolean
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper function to check if Supabase is properly configured
export function hasValidSupabaseConfig(): boolean {
  return !isPlaceholderUrl && !isPlaceholderKey;
}

// Export the supabase client
export { supabase }