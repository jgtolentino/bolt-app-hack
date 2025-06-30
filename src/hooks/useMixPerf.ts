import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export default function useMixPerf() {
  return useQuery({
    queryKey: ['analytics_mix'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_mix')
        .select('*')
        .order('share', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
}