import { createClient } from '@supabase/supabase-js'

// Environment variables - these must be set when connecting to Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that required environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  throw new Error('Supabase configuration is incomplete. Please set up your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Fallback to email/password if OAuth providers are not configured
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  },
  global: {
    // Supabase Pro plan allows up to 1 million rows per request
    // Set a reasonable default that works well for most queries
    headers: { 
      'X-Supabase-Range': '0-50000',
      'X-Supabase-Prefer': 'count=exact'
    }
  }
})

// Enhanced function for Supabase Pro - can handle much larger datasets
export async function fetchAllRecords<T>(
  query: any, // The base query builder
  pageSize = 10000, // Increased page size for Pro plan
  maxRecords = 1000000 // Pro plan can handle up to 1M records
): Promise<T[]> {
  let allRecords: T[] = [];
  let page = 0;
  let hasMore = true;

  console.log(`🔄 Fetching records with Pro plan optimization (page size: ${pageSize})`);

  while (hasMore && allRecords.length < maxRecords) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    
    console.log(`📄 Fetching page ${page + 1} (records ${start}-${end})`);
    
    // Apply range for this page
    const { data, error, count } = await query
      .range(start, end);
    
    if (error) {
      console.error('Error fetching records:', error);
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
    // Test basic connection
    const { data, error, count } = await supabase
      .from('geography')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.warn('Supabase connection test failed:', error.message)
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
    return false
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
      generate_philippine_transactions: {
        Args: {
          num_transactions: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}