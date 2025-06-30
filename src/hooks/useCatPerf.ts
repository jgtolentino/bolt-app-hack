import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export default function useCatPerf() {
  return useQuery({
    queryKey: ['analytics_cat_perf'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_cat_perf')
        .select('*')
        .order('sales', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}