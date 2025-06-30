import { supabase } from '../lib/supabase';

export async function debugDataLoading() {
  console.log('=== Debug Data Loading ===');
  
  // Check if Supabase is connected
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  console.log('Supabase URL:', url);
  console.log('Supabase Key exists:', !!key);
  
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('transactions')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Connection test failed:', testError);
    } else {
      console.log('✅ Connection test passed');
    }
    
    // Check views
    const views = [
      'v_geographic_performance',
      'v_product_performance',
      'v_seasonal_trends'
    ];
    
    for (const view of views) {
      try {
        const { data, error, count } = await supabase
          .from(view)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`❌ View ${view} error:`, error.message);
        } else {
          console.log(`✅ View ${view} exists, count:`, count);
        }
      } catch (err) {
        console.error(`❌ View ${view} failed:`, err);
      }
    }
    
    // Check RPC functions
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_seasonal_trends', { year_filter: 2024 });
      
      if (rpcError) {
        console.error('❌ RPC get_seasonal_trends error:', rpcError.message);
      } else {
        console.log('✅ RPC get_seasonal_trends works, records:', rpcData?.length || 0);
      }
    } catch (err) {
      console.error('❌ RPC function failed:', err);
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
  
  console.log('=== End Debug ===');
}