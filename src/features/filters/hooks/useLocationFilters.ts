import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Hook to fetch regions
export const useRegions = () => {
  return useQuery({
    queryKey: ['filter-regions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('region')
        .order('region');
      
      if (error) throw error;
      
      // Get unique regions with counts
      const regionCounts = data?.reduce((acc: Record<string, number>, store) => {
        if (store.region) {
          acc[store.region] = (acc[store.region] || 0) + 1;
        }
        return acc;
      }, {}) || {};
      
      // Convert to options format
      const options: FilterOption[] = Object.entries(regionCounts).map(([region, count]) => ({
        value: region,
        label: region,
        count
      }));
      
      return options;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch cities based on selected region
export const useCities = (region?: string) => {
  return useQuery({
    queryKey: ['filter-cities', region],
    queryFn: async () => {
      if (!region) return [];
      
      const { data, error } = await supabase
        .from('stores')
        .select('city')
        .eq('region', region)
        .order('city');
      
      if (error) throw error;
      
      // Get unique cities with counts
      const cityCounts = data?.reduce((acc: Record<string, number>, store) => {
        if (store.city) {
          acc[store.city] = (acc[store.city] || 0) + 1;
        }
        return acc;
      }, {}) || {};
      
      // Convert to options format
      const options: FilterOption[] = Object.entries(cityCounts).map(([city, count]) => ({
        value: city,
        label: city,
        count
      }));
      
      return options;
    },
    enabled: !!region, // Only fetch when region is selected
    staleTime: 5 * 60 * 1000,
  });
};

// Hook to fetch barangays based on selected city
export const useBarangays = (region?: string, city?: string) => {
  return useQuery({
    queryKey: ['filter-barangays', region, city],
    queryFn: async () => {
      if (!region || !city) return [];
      
      const { data, error } = await supabase
        .from('stores')
        .select('barangay')
        .eq('region', region)
        .eq('city', city)
        .order('barangay');
      
      if (error) throw error;
      
      // Get unique barangays with counts
      const barangayCounts = data?.reduce((acc: Record<string, number>, store) => {
        if (store.barangay) {
          acc[store.barangay] = (acc[store.barangay] || 0) + 1;
        }
        return acc;
      }, {}) || {};
      
      // Convert to options format
      const options: FilterOption[] = Object.entries(barangayCounts).map(([barangay, count]) => ({
        value: barangay,
        label: barangay,
        count
      }));
      
      return options;
    },
    enabled: !!region && !!city, // Only fetch when both region and city are selected
    staleTime: 5 * 60 * 1000,
  });
};