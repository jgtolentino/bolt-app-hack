import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export default function useSkuPerf() {
  return useQuery({
    queryKey: ['analytics_sku_perf'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_sku_perf')
        .select('*')
        .order('sales', { ascending: false })
        .limit(50); // Top 50 SKUs
      
      if (error) throw error;
      return data;
    }
  });
}