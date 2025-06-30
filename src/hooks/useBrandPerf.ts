import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export default function useBrandPerf() {
  return useQuery({
    queryKey: ['analytics_brand_perf'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_brand_perf')
        .select('*')
        .order('sales', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}